#!/usr/bin/env bash
set -euo pipefail

export AWS_PAGER=""

usage() {
  cat <<'EOF'
Usage: aws-prod-off.sh [--yes]

Turns OFF prod runtime components:
  - ECS/Fargate: desiredCount -> 0
  - RDS:
      - RDS_MODE=stop: stop DB instance (and any read replicas)
      - RDS_MODE=snapshot-delete: create manual snapshot then delete DB instance (and any read replicas)
  - NAT Gateway: delete + release EIPs

Env:
  AWS_REGION=us-east-1
  ECS_CLUSTER=detective-cluster
  ECS_SERVICE=detective-task-service-kcd9bcm2
  DB_INSTANCE_ID=detective-postgres-db
  RDS_MODE=stop|snapshot-delete        (default: stop)

Snapshot-delete mode:
  DB_SNAPSHOT_ID=...                   (optional; auto-generated if empty)
  SNAPSHOT_ID_PREFIX=detective-postgres-db-manual (optional)

NAT/VPC detection:
  ALB_NAME=detective-alb
  VPC_ID=...                           (optional; derived from ALB if empty)

Examples:
  AWS_REGION=us-east-1 bash scripts/aws-prod-off.sh
  AWS_REGION=us-east-1 RDS_MODE=snapshot-delete bash scripts/aws-prod-off.sh --yes
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

DB_INSTANCE_ID="${DB_INSTANCE_ID:-detective-postgres-db}"
RDS_MODE="${RDS_MODE:-stop}"

SNAPSHOT_ID_PREFIX="${SNAPSHOT_ID_PREFIX:-${DB_INSTANCE_ID}-manual}"
DB_SNAPSHOT_ID="${DB_SNAPSHOT_ID:-}"

ALB_NAME="${ALB_NAME:-detective-alb}"
VPC_ID="${VPC_ID:-}"

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
  say "Type 'off' to proceed:"
  read -r ans
  [[ "$ans" == "off" ]]
}

rds_status() {
  awsr rds describe-db-instances --db-instance-identifier "${DB_INSTANCE_ID}" --query 'DBInstances[0].DBInstanceStatus' --output text 2>/dev/null || true
}

rds_exists() {
  awsr rds describe-db-instances --db-instance-identifier "${DB_INSTANCE_ID}" >/dev/null 2>&1
}

wait_rds_status() {
  local want="$1"
  local timeout_sec="${2:-1800}"
  local interval_sec="${3:-20}"

  local end=$((SECONDS + timeout_sec))
  while (( SECONDS < end )); do
    local st
    st="$(rds_status)"
    if [[ -z "${st}" || "${st}" == "None" ]]; then
      say "RDS status: <not found>"
    else
      say "RDS status: ${st}"
      if [[ "${st}" == "${want}" ]]; then
        return 0
      fi
    fi
    sleep "${interval_sec}"
  done

  say "[ERROR] Timed out waiting for RDS status=${want}" >&2
  return 1
}

need aws
need python3

section "Auth"
aws --no-cli-pager sts get-caller-identity --query '{Account:Account,Arn:Arn}' --output table
say "AWS_REGION: ${AWS_REGION}"

if [[ -z "${VPC_ID}" ]]; then
  VPC_ID="$(awsr elbv2 describe-load-balancers --names "${ALB_NAME}" --query 'LoadBalancers[0].VpcId' --output text 2>/dev/null || true)"
fi

section "Plan"
say "- ECS: ${ECS_CLUSTER}/${ECS_SERVICE} -> desiredCount=0"
say "- RDS: ${DB_INSTANCE_ID} (mode=${RDS_MODE})"
if [[ "${RDS_MODE}" == "snapshot-delete" ]]; then
  if [[ -n "${DB_SNAPSHOT_ID}" ]]; then
    say "  - snapshot: ${DB_SNAPSHOT_ID}"
  else
    say "  - snapshot: auto (${SNAPSHOT_ID_PREFIX}-<timestamp>)"
  fi
fi
if [[ -n "${VPC_ID}" && "${VPC_ID}" != "None" ]]; then
  say "- NAT: delete NAT gateway(s) in VPC ${VPC_ID} + release EIP(s)"
else
  say "- NAT: skip (VPC_ID not resolved; set VPC_ID or ALB_NAME)"
fi

if ! confirm; then
  say "Canceled."
  exit 1
fi

section "ECS -> desiredCount=0"
if awsr ecs describe-services --cluster "${ECS_CLUSTER}" --services "${ECS_SERVICE}" >/dev/null 2>&1; then
  awsr ecs update-service --cluster "${ECS_CLUSTER}" --service "${ECS_SERVICE}" --desired-count 0 >/dev/null
  awsr ecs wait services-stable --cluster "${ECS_CLUSTER}" --services "${ECS_SERVICE}"
  awsr ecs describe-services --cluster "${ECS_CLUSTER}" --services "${ECS_SERVICE}" \
    --query 'services[0].{Desired:desiredCount,Running:runningCount,Pending:pendingCount}' --output table
else
  say "[WARN] ECS service not found, skipping: ${ECS_SERVICE}"
fi

section "RDS (${RDS_MODE})"
if ! rds_exists; then
  say "[WARN] DB instance not found, skipping: ${DB_INSTANCE_ID}"
else
  read_replicas="$(awsr rds describe-db-instances --db-instance-identifier "${DB_INSTANCE_ID}" --query 'DBInstances[0].ReadReplicaDBInstanceIdentifiers' --output text 2>/dev/null || true)"

  case "${RDS_MODE}" in
    stop)
      st="$(rds_status)"
      if [[ "${st}" != "stopped" ]]; then
        awsr rds stop-db-instance --db-instance-identifier "${DB_INSTANCE_ID}" >/dev/null || true
        wait_rds_status "stopped"
      else
        say "RDS already stopped."
      fi

      if [[ -n "${read_replicas}" && "${read_replicas}" != "None" ]]; then
        for rr in ${read_replicas}; do
          rr_st="$(awsr rds describe-db-instances --db-instance-identifier "${rr}" --query 'DBInstances[0].DBInstanceStatus' --output text 2>/dev/null || true)"
          if [[ -n "${rr_st}" && "${rr_st}" != "None" && "${rr_st}" != "stopped" ]]; then
            say "Stopping read replica: ${rr}"
            awsr rds stop-db-instance --db-instance-identifier "${rr}" >/dev/null || true
          fi
        done
      fi

      ;;

    snapshot-delete)
      snapshot_id="${DB_SNAPSHOT_ID}"
      if [[ -z "${snapshot_id}" ]]; then
        snapshot_id="${SNAPSHOT_ID_PREFIX}-$(date -u +%Y%m%d%H%M%S)"
      fi

      say "Creating manual snapshot: ${snapshot_id}"
      awsr rds create-db-snapshot --db-instance-identifier "${DB_INSTANCE_ID}" --db-snapshot-identifier "${snapshot_id}" >/dev/null
      awsr rds wait db-snapshot-available --db-snapshot-identifier "${snapshot_id}"

      if [[ -n "${read_replicas}" && "${read_replicas}" != "None" ]]; then
        for rr in ${read_replicas}; do
          say "Deleting read replica: ${rr}"
          awsr rds delete-db-instance --db-instance-identifier "${rr}" --skip-final-snapshot --delete-automated-backups >/dev/null || true
          awsr rds wait db-instance-deleted --db-instance-identifier "${rr}" || true
        done
      fi

      say "Deleting DB instance: ${DB_INSTANCE_ID}"
      awsr rds delete-db-instance --db-instance-identifier "${DB_INSTANCE_ID}" --skip-final-snapshot --delete-automated-backups >/dev/null
      awsr rds wait db-instance-deleted --db-instance-identifier "${DB_INSTANCE_ID}"

      say "Snapshot kept: ${snapshot_id} (manual)"
      ;;

    *)
      say "[ERROR] Invalid RDS_MODE: ${RDS_MODE} (expected stop|snapshot-delete)" >&2
      exit 2
      ;;
  esac
fi

section "NAT delete + EIP release"
if [[ -z "${VPC_ID}" || "${VPC_ID}" == "None" ]]; then
  say "[WARN] VPC_ID not resolved. Skipping NAT delete. (set VPC_ID or ALB_NAME)"
  exit 0
fi

nat_json="$(awsr ec2 describe-nat-gateways --filter "Name=vpc-id,Values=${VPC_ID}" --output json)"
python3 - <<'PY' "$nat_json" >/tmp/nat_off_plan.txt
import json, sys
data = (json.loads(sys.argv[1]) or {}).get("NatGateways", [])
rows = []
for ngw in data:
    if ngw.get("State") not in ("available", "pending", "deleting"):
        continue
    nat_id = ngw.get("NatGatewayId")
    alloc_ids = []
    for addr in ngw.get("NatGatewayAddresses", []):
        aid = addr.get("AllocationId")
        if aid:
            alloc_ids.append(aid)
    rows.append((nat_id, alloc_ids))
for nat_id, alloc_ids in rows:
    print(nat_id + "\t" + ",".join(alloc_ids))
PY

if [[ ! -s /tmp/nat_off_plan.txt ]]; then
  say "No NAT gateways found. Done."
  exit 0
fi

while IFS=$'\t' read -r nat_id alloc_csv; do
  [[ -n "${nat_id}" ]] || continue

  say "Deleting NAT: ${nat_id}"
  awsr ec2 delete-nat-gateway --nat-gateway-id "${nat_id}" >/dev/null || true
  awsr ec2 wait nat-gateway-deleted --nat-gateway-ids "${nat_id}" || true

  if [[ -n "${alloc_csv}" ]]; then
    IFS=',' read -r -a alloc_ids <<< "${alloc_csv}"
    for alloc_id in "${alloc_ids[@]}"; do
      [[ -n "${alloc_id}" ]] || continue
      say "Releasing EIP allocation: ${alloc_id}"
      awsr ec2 release-address --allocation-id "${alloc_id}" >/dev/null || true
    done
  fi
done < /tmp/nat_off_plan.txt

say "Done."

