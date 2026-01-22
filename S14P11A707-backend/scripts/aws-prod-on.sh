#!/usr/bin/env bash
set -euo pipefail

export AWS_PAGER=""

usage() {
  cat <<'EOF'
Usage: aws-prod-on.sh [--yes]

Turns ON prod runtime components:
  - (If missing) create NAT Gateway + EIP
  - ensure private route tables default route -> NAT
  - RDS:
      - RDS_MODE=stop: start DB instance (and any read replicas)
      - RDS_MODE=snapshot-delete: restore DB instance from manual snapshot (if missing)
  - ECS/Fargate: set desiredCount (default 1)

Env:
  AWS_REGION=us-east-1
  ECS_CLUSTER=detective-cluster
  ECS_SERVICE=detective-task-service-kcd9bcm2
  ECS_DESIRED_COUNT=1

  DB_INSTANCE_ID=detective-postgres-db
  RDS_MODE=stop|snapshot-delete        (default: stop)

Snapshot-restore mode:
  DB_SNAPSHOT_ID=...                   (required when DB is deleted)
  DB_INSTANCE_CLASS=db.t4g.micro       (default: db.t4g.micro)
  DB_SUBNET_GROUP_NAME=detective-db-sg (default: detective-db-sg)
  DB_VPC_SECURITY_GROUP_IDS=sg-...     (default: detective-sg-db in this project)

NAT/VPC detection:
  ALB_NAME=detective-alb
  VPC_ID=...                           (optional; derived from ALB if empty)
  PUBLIC_SUBNET_ID=subnet-...          (optional; auto-detected via IGW route if empty)

Examples:
  AWS_REGION=us-east-1 ECS_DESIRED_COUNT=1 bash scripts/aws-prod-on.sh
  AWS_REGION=us-east-1 RDS_MODE=snapshot-delete DB_SNAPSHOT_ID=... bash scripts/aws-prod-on.sh --yes
EOF
}

YES=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --yes) YES=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; usage; exit 2 ;;
  esac
done

AWS_REGION="${AWS_REGION:-us-east-1}"

ECS_CLUSTER="${ECS_CLUSTER:-detective-cluster}"
ECS_SERVICE="${ECS_SERVICE:-detective-task-service-kcd9bcm2}"
ECS_DESIRED_COUNT="${ECS_DESIRED_COUNT:-1}"

DB_INSTANCE_ID="${DB_INSTANCE_ID:-detective-postgres-db}"
RDS_MODE="${RDS_MODE:-stop}"

DB_SNAPSHOT_ID="${DB_SNAPSHOT_ID:-}"
DB_INSTANCE_CLASS="${DB_INSTANCE_CLASS:-db.t4g.micro}"
DB_SUBNET_GROUP_NAME="${DB_SUBNET_GROUP_NAME:-detective-db-sg}"
DB_VPC_SECURITY_GROUP_IDS="${DB_VPC_SECURITY_GROUP_IDS:-sg-03d646f2a17482526}"

ALB_NAME="${ALB_NAME:-detective-alb}"
VPC_ID="${VPC_ID:-}"
PUBLIC_SUBNET_ID="${PUBLIC_SUBNET_ID:-}"

say() { printf '%s\n' "$*"; }
hr() { say "------------------------------------------------------------"; }
section() { hr; say "## $*"; }

need() {
  if ! command -v "$1" >/dev/null 2>&1; then
    say "Missing command: $1"
    exit 1
  fi
}

awsr() {
  aws --no-cli-pager --region "${AWS_REGION}" "$@"
}

confirm() {
  if [[ "${YES}" == "1" ]]; then
    return 0
  fi
  say
  say "Type 'on' to proceed:"
  read -r ans
  [[ "$ans" == "on" ]]
}

rds_exists() {
  awsr rds describe-db-instances --db-instance-identifier "${DB_INSTANCE_ID}" >/dev/null 2>&1
}

need aws
need python3

section "Auth"
aws --no-cli-pager sts get-caller-identity --query '{Account:Account,Arn:Arn}' --output table
say "AWS_REGION: ${AWS_REGION}"

if [[ -z "${VPC_ID}" ]]; then
  VPC_ID="$(awsr elbv2 describe-load-balancers --names "${ALB_NAME}" --query 'LoadBalancers[0].VpcId' --output text 2>/dev/null || true)"
fi

if [[ -z "${VPC_ID}" || "${VPC_ID}" == "None" ]]; then
  say "VPC_ID not resolved. Set VPC_ID or ALB_NAME." >&2
  exit 1
fi

section "Plan"
say "- VPC: ${VPC_ID}"
say "- NAT: ensure NAT exists (create if missing) + update private route tables"
say "- RDS: ${DB_INSTANCE_ID} (mode=${RDS_MODE})"
if [[ "${RDS_MODE}" == "snapshot-delete" ]]; then
  say "  - snapshot: ${DB_SNAPSHOT_ID:-<required if DB is deleted>}"
  say "  - subnet group: ${DB_SUBNET_GROUP_NAME}"
  say "  - security groups: ${DB_VPC_SECURITY_GROUP_IDS}"
  say "  - instance class: ${DB_INSTANCE_CLASS}"
fi
say "- ECS: ${ECS_CLUSTER}/${ECS_SERVICE} -> desiredCount=${ECS_DESIRED_COUNT}"

if ! confirm; then
  say "Canceled."
  exit 1
fi

section "Ensure NAT"
nat_id="$(awsr ec2 describe-nat-gateways --filter "Name=vpc-id,Values=${VPC_ID}" \
  --query "NatGateways[?State=='available'].NatGatewayId | [0]" --output text 2>/dev/null || true)"

if [[ -n "${nat_id}" && "${nat_id}" != "None" ]]; then
  say "NAT exists: ${nat_id}"
else
  if [[ -z "${PUBLIC_SUBNET_ID}" ]]; then
    rt_json="$(awsr ec2 describe-route-tables --filters "Name=vpc-id,Values=${VPC_ID}" --output json)"
    PUBLIC_SUBNET_ID="$(python3 - <<'PY' "$rt_json"
import json, sys
data = json.loads(sys.argv[1])
public_subnets = []
for rt in data.get("RouteTables", []):
    routes = rt.get("Routes", [])
    has_igw = any((r.get("GatewayId") or "").startswith("igw-") and r.get("DestinationCidrBlock") == "0.0.0.0/0" for r in routes)
    if not has_igw:
        continue
    for assoc in rt.get("Associations", []):
        sid = assoc.get("SubnetId")
        if sid:
            public_subnets.append(sid)
print(public_subnets[0] if public_subnets else "")
PY
)"
  fi

  if [[ -z "${PUBLIC_SUBNET_ID}" ]]; then
    say "Public subnet not resolved. Set PUBLIC_SUBNET_ID." >&2
    exit 1
  fi

  alloc_id="$(awsr ec2 allocate-address --domain vpc --query 'AllocationId' --output text)"
  nat_id="$(awsr ec2 create-nat-gateway --subnet-id "${PUBLIC_SUBNET_ID}" --allocation-id "${alloc_id}" \
    --query 'NatGateway.NatGatewayId' --output text)"

  say "Created NAT: ${nat_id} (subnet=${PUBLIC_SUBNET_ID}, eip=${alloc_id})"
  awsr ec2 wait nat-gateway-available --nat-gateway-ids "${nat_id}"
fi

section "Update private route tables default route -> NAT"
rt_json="$(awsr ec2 describe-route-tables --filters "Name=vpc-id,Values=${VPC_ID}" --output json)"
private_rt_ids="$(python3 - <<'PY' "$rt_json"
import json, sys
data = json.loads(sys.argv[1])
ids = []
for rt in data.get("RouteTables", []):
    routes = rt.get("Routes", [])
    has_igw = any((r.get("GatewayId") or "").startswith("igw-") and r.get("DestinationCidrBlock") == "0.0.0.0/0" for r in routes)
    if has_igw:
        continue
    ids.append(rt.get("RouteTableId"))
print(" ".join([i for i in ids if i]))
PY
)"

if [[ -z "${private_rt_ids}" ]]; then
  say "[WARN] No private route tables found. Skipping route update."
else
  for rt_id in ${private_rt_ids}; do
    say "Updating route table: ${rt_id} (0.0.0.0/0 -> ${nat_id})"
    if awsr ec2 replace-route --route-table-id "${rt_id}" --destination-cidr-block 0.0.0.0/0 --nat-gateway-id "${nat_id}" >/dev/null 2>&1; then
      :
    else
      awsr ec2 create-route --route-table-id "${rt_id}" --destination-cidr-block 0.0.0.0/0 --nat-gateway-id "${nat_id}" >/dev/null
    fi
  done
fi

section "RDS (${RDS_MODE})"
case "${RDS_MODE}" in
  stop)
    if ! rds_exists; then
      say "[ERROR] DB instance not found: ${DB_INSTANCE_ID} (use RDS_MODE=snapshot-delete to restore)" >&2
      exit 1
    fi

    st="$(awsr rds describe-db-instances --db-instance-identifier "${DB_INSTANCE_ID}" --query 'DBInstances[0].DBInstanceStatus' --output text)"
    if [[ "${st}" != "available" ]]; then
      awsr rds start-db-instance --db-instance-identifier "${DB_INSTANCE_ID}" >/dev/null || true
      awsr rds wait db-instance-available --db-instance-identifier "${DB_INSTANCE_ID}"
    fi

    # Optional: start read replicas too (if present)
    read_replicas="$(awsr rds describe-db-instances --db-instance-identifier "${DB_INSTANCE_ID}" --query 'DBInstances[0].ReadReplicaDBInstanceIdentifiers' --output text 2>/dev/null || true)"
    if [[ -n "${read_replicas}" && "${read_replicas}" != "None" ]]; then
      for rr in ${read_replicas}; do
        rr_st="$(awsr rds describe-db-instances --db-instance-identifier "${rr}" --query 'DBInstances[0].DBInstanceStatus' --output text 2>/dev/null || true)"
        if [[ -n "${rr_st}" && "${rr_st}" != "None" && "${rr_st}" != "available" ]]; then
          say "Starting read replica: ${rr}"
          awsr rds start-db-instance --db-instance-identifier "${rr}" >/dev/null || true
          awsr rds wait db-instance-available --db-instance-identifier "${rr}" || true
        fi
      done
    fi
    ;;

  snapshot-delete)
    if [[ -z "${DB_SNAPSHOT_ID}" ]]; then
      say "[ERROR] DB_SNAPSHOT_ID is required for RDS_MODE=snapshot-delete (restore)" >&2
      exit 2
    fi

    if rds_exists; then
      say "DB instance already exists: ${DB_INSTANCE_ID} (skip restore)"
    else
      say "Waiting snapshot available: ${DB_SNAPSHOT_ID}"
      awsr rds wait db-snapshot-available --db-snapshot-identifier "${DB_SNAPSHOT_ID}"

      # allow comma-separated SG IDs
      sg_ids="${DB_VPC_SECURITY_GROUP_IDS//,/ }"

      say "Restoring DB from snapshot: ${DB_SNAPSHOT_ID}"
      awsr rds restore-db-instance-from-db-snapshot \
        --db-instance-identifier "${DB_INSTANCE_ID}" \
        --db-snapshot-identifier "${DB_SNAPSHOT_ID}" \
        --db-instance-class "${DB_INSTANCE_CLASS}" \
        --db-subnet-group-name "${DB_SUBNET_GROUP_NAME}" \
        --vpc-security-group-ids ${sg_ids} \
        --no-multi-az \
        --no-publicly-accessible \
        >/dev/null

      awsr rds wait db-instance-available --db-instance-identifier "${DB_INSTANCE_ID}"
    fi
    ;;

  *)
    say "[ERROR] Invalid RDS_MODE: ${RDS_MODE} (expected stop|snapshot-delete)" >&2
    exit 2
    ;;
esac

awsr rds describe-db-instances --db-instance-identifier "${DB_INSTANCE_ID}" \
  --query 'DBInstances[0].{Status:DBInstanceStatus,Endpoint:Endpoint.Address,PubliclyAccessible:PubliclyAccessible,SubnetGroup:DBSubnetGroup.DBSubnetGroupName,VpcId:DBSubnetGroup.VpcId}' --output table || true

section "ECS -> desiredCount=${ECS_DESIRED_COUNT}"
if awsr ecs describe-services --cluster "${ECS_CLUSTER}" --services "${ECS_SERVICE}" >/dev/null 2>&1; then
  awsr ecs update-service --cluster "${ECS_CLUSTER}" --service "${ECS_SERVICE}" --desired-count "${ECS_DESIRED_COUNT}" >/dev/null
  awsr ecs wait services-stable --cluster "${ECS_CLUSTER}" --services "${ECS_SERVICE}"
  awsr ecs describe-services --cluster "${ECS_CLUSTER}" --services "${ECS_SERVICE}" \
    --query 'services[0].{Desired:desiredCount,Running:runningCount,Pending:pendingCount,TaskDefinition:taskDefinition}' --output table
else
  say "[WARN] ECS service not found, skipping: ${ECS_SERVICE}"
fi

say "Done."

