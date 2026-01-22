#!/usr/bin/env bash
set -euo pipefail

export AWS_PAGER=""

AWS_REGION="${AWS_REGION:-us-east-1}"

ECS_CLUSTER="${ECS_CLUSTER:-detective-cluster}"
ECS_SERVICE="${ECS_SERVICE:-detective-task-service-kcd9bcm2}"
DB_INSTANCE_ID="${DB_INSTANCE_ID:-detective-postgres-db}"

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

need aws
need python3

section "Auth"
aws --no-cli-pager sts get-caller-identity --query '{Account:Account,Arn:Arn,UserId:UserId}' --output table
say "AWS_REGION: ${AWS_REGION}"

section "ECS (prod runtime)"
if awsr ecs describe-services --cluster "${ECS_CLUSTER}" --services "${ECS_SERVICE}" >/dev/null 2>&1; then
  awsr ecs describe-services --cluster "${ECS_CLUSTER}" --services "${ECS_SERVICE}" \
    --query 'services[0].{Status:status,Desired:desiredCount,Running:runningCount,Pending:pendingCount,TaskDefinition:taskDefinition}' --output table
else
  say "[WARN] ECS service not found: ${ECS_SERVICE} (cluster=${ECS_CLUSTER}, region=${AWS_REGION})"
fi

section "RDS"
if awsr rds describe-db-instances --db-instance-identifier "${DB_INSTANCE_ID}" >/dev/null 2>&1; then
  awsr rds describe-db-instances --db-instance-identifier "${DB_INSTANCE_ID}" \
    --query 'DBInstances[0].{Status:DBInstanceStatus,Engine:Engine,Class:DBInstanceClass,Endpoint:Endpoint.Address,PubliclyAccessible:PubliclyAccessible,SubnetGroup:DBSubnetGroup.DBSubnetGroupName,VpcId:DBSubnetGroup.VpcId,SecurityGroups:VpcSecurityGroups[].VpcSecurityGroupId,ReadReplicas:ReadReplicaDBInstanceIdentifiers}' \
    --output json
else
  say "[WARN] DB instance not found: ${DB_INSTANCE_ID} (region=${AWS_REGION})"
fi

section "RDS snapshots (manual)"
awsr rds describe-db-snapshots --db-instance-identifier "${DB_INSTANCE_ID}" --snapshot-type manual \
  --query 'reverse(sort_by(DBSnapshots,&SnapshotCreateTime))[:5].{Id:DBSnapshotIdentifier,Status:Status,Created:SnapshotCreateTime,Engine:Engine,Size:AllocatedStorage}' \
  --output table 2>/dev/null || true

section "VPC/NAT"
if [[ -z "${VPC_ID}" ]]; then
  VPC_ID="$(awsr elbv2 describe-load-balancers --names "${ALB_NAME}" --query 'LoadBalancers[0].VpcId' --output text 2>/dev/null || true)"
  if [[ -n "${VPC_ID}" && "${VPC_ID}" != "None" ]]; then
    say "Derived VPC_ID from ALB (${ALB_NAME}): ${VPC_ID}"
  fi
fi

if [[ -z "${VPC_ID}" || "${VPC_ID}" == "None" ]]; then
  say "[WARN] VPC_ID is not set and could not be derived from ALB. (set VPC_ID or ALB_NAME)"
  exit 0
fi

awsr ec2 describe-nat-gateways --filter "Name=vpc-id,Values=${VPC_ID}" \
  --query 'NatGateways[].{NatGatewayId:NatGatewayId,State:State,SubnetId:SubnetId,PublicIps:NatGatewayAddresses[].PublicIp,AllocationIds:NatGatewayAddresses[].AllocationId}' \
  --output table

section "Route tables (private default routes)"
rt_json="$(awsr ec2 describe-route-tables --filters "Name=vpc-id,Values=${VPC_ID}" --output json)"
python3 - <<'PY' "$rt_json"
import json, sys
data = json.loads(sys.argv[1])

def has_igw(rt):
    for r in rt.get("Routes", []):
        if (r.get("GatewayId") or "").startswith("igw-") and r.get("DestinationCidrBlock") == "0.0.0.0/0":
            return True
    return False

def default_route(rt):
    for r in rt.get("Routes", []):
        if r.get("DestinationCidrBlock") == "0.0.0.0/0":
            return {
                "State": r.get("State"),
                "NatGatewayId": r.get("NatGatewayId"),
                "GatewayId": r.get("GatewayId"),
            }
    return None

for rt in data.get("RouteTables", []):
    if has_igw(rt):
        continue
    rtb = rt.get("RouteTableId")
    dr = default_route(rt)
    print(f"- {rtb}: {dr}")
PY

