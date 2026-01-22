#!/usr/bin/env bash
set -euo pipefail

export AWS_PAGER=""

AWS_REGION="${AWS_REGION:-us-east-1}"

ECR_REPO="${ECR_REPO:-detective-backend}"
ECS_CLUSTER="${ECS_CLUSTER:-detective-cluster}"
ECS_SERVICE="${ECS_SERVICE:-detective-task-service-kcd9bcm2}"
ALB_NAME="${ALB_NAME:-detective-alb}"
TARGET_GROUP_NAME="${TARGET_GROUP_NAME:-detective-tg}"
LOG_GROUP="${LOG_GROUP:-/ecs/detective-backend}"
DB_INSTANCE_ID="${DB_INSTANCE_ID:-detective-postgres-db}"
DB_SUBNET_GROUP="${DB_SUBNET_GROUP:-detective-db-sg}"

ECS_TASK_EXECUTION_ROLE_NAME="${ECS_TASK_EXECUTION_ROLE_NAME:-ecsTaskExecutionRole-detective-backend-prod}"
CI_POLICY_NAME="${CI_POLICY_NAME:-detective-backend-gitlab-ci-deploy-policy}"
GRAFANA_POLICY_NAME="${GRAFANA_POLICY_NAME:-detective-backend-grafana-cloudwatch-readonly-policy}"

API_DOMAIN="${API_DOMAIN:-}"
ORIGIN_API_DOMAIN="${ORIGIN_API_DOMAIN:-}"

say() { printf '%s\n' "$*"; }
hr() { say "------------------------------------------------------------"; }
section() { hr; say "## $*"; }

need() {
  if ! command -v "$1" >/dev/null 2>&1; then
    say "Missing command: $1"
    exit 1
  fi
}

ok() { say "[OK] $*"; }
warn() { say "[WARN] $*"; }
miss() { say "[MISSING] $*"; }

need aws

section "Auth"
if ! aws --no-cli-pager sts get-caller-identity >/dev/null 2>&1; then
  say "AWS 세션이 없거나 만료되었습니다."
  say "아래 중 하나로 다시 로그인 후 재실행하세요:"
  say "  - aws login"
  say "  - (SSH/WSL 등 브라우저가 불편하면) aws login --remote"
  exit 1
fi

aws --no-cli-pager sts get-caller-identity --query '{Account:Account,Arn:Arn,UserId:UserId}' --output table
say "AWS_REGION (regional resources): ${AWS_REGION}"

section "02) IAM"
ci_policy_arn="$(aws --no-cli-pager iam list-policies --scope Local --query "Policies[?PolicyName=='${CI_POLICY_NAME}'].Arn | [0]" --output text 2>/dev/null || true)"
if [[ -z "${ci_policy_arn}" || "${ci_policy_arn}" == "None" ]]; then
  ci_policy_candidates="$(aws --no-cli-pager iam list-policies --scope Local --query "Policies[?contains(PolicyName,'ci-deploy-policy')].[PolicyName,Arn]" --output text 2>/dev/null || true)"
  if [[ -n "${ci_policy_candidates}" ]]; then
    warn "IAM policy not found: ${CI_POLICY_NAME} (found CI deploy policy candidate(s) below)"
    aws --no-cli-pager iam list-policies --scope Local --query "Policies[?contains(PolicyName,'ci-deploy-policy')].[PolicyName,Arn]" --output table || true
  else
    miss "IAM policy: ${CI_POLICY_NAME}"
  fi
else
  ok "IAM policy: ${CI_POLICY_NAME} (${ci_policy_arn})"
fi

grafana_policy_arn="$(aws --no-cli-pager iam list-policies --scope Local --query "Policies[?PolicyName=='${GRAFANA_POLICY_NAME}'].Arn | [0]" --output text 2>/dev/null || true)"
if [[ -z "${grafana_policy_arn}" || "${grafana_policy_arn}" == "None" ]]; then
  miss "IAM policy: ${GRAFANA_POLICY_NAME}"
else
  ok "IAM policy: ${GRAFANA_POLICY_NAME} (${grafana_policy_arn})"
fi

if exec_role_arn="$(aws --no-cli-pager iam get-role --role-name "${ECS_TASK_EXECUTION_ROLE_NAME}" --query 'Role.Arn' --output text 2>/dev/null)"; then
  ok "IAM role (task execution): ${ECS_TASK_EXECUTION_ROLE_NAME} (${exec_role_arn})"
else
  miss "IAM role (task execution): ${ECS_TASK_EXECUTION_ROLE_NAME}"
fi

section "04/05) ECR (repo + images)"
if repo_uri="$(aws --no-cli-pager ecr describe-repositories --region "${AWS_REGION}" --repository-names "${ECR_REPO}" --query 'repositories[0].repositoryUri' --output text 2>/dev/null)"; then
  ok "ECR repo: ${ECR_REPO} (${repo_uri})"
  aws --no-cli-pager ecr describe-images --region "${AWS_REGION}" --repository-name "${ECR_REPO}" \
    --query "reverse(sort_by(imageDetails,&imagePushedAt))[:5].[imagePushedAt,imageTags[0],imageDigest]" --output table || true
else
  miss "ECR repo: ${ECR_REPO} (region=${AWS_REGION})"
fi

section "07) CloudWatch Logs"
log_group_found="$(aws --no-cli-pager logs describe-log-groups --region "${AWS_REGION}" --log-group-name-prefix "${LOG_GROUP}" --query "logGroups[?logGroupName=='${LOG_GROUP}'].logGroupName | [0]" --output text 2>/dev/null || true)"
if [[ -z "${log_group_found}" || "${log_group_found}" == "None" ]]; then
  miss "Log group: ${LOG_GROUP}"
else
  ok "Log group: ${LOG_GROUP}"
fi

section "07) ALB + Target Group"
ALB_ARN="$(aws --no-cli-pager elbv2 describe-load-balancers --region "${AWS_REGION}" --names "${ALB_NAME}" --query 'LoadBalancers[0].LoadBalancerArn' --output text 2>/dev/null || true)"
ALB_DNS="$(aws --no-cli-pager elbv2 describe-load-balancers --region "${AWS_REGION}" --names "${ALB_NAME}" --query 'LoadBalancers[0].DNSName' --output text 2>/dev/null || true)"
VPC_ID_FROM_ALB="$(aws --no-cli-pager elbv2 describe-load-balancers --region "${AWS_REGION}" --names "${ALB_NAME}" --query 'LoadBalancers[0].VpcId' --output text 2>/dev/null || true)"

if [[ -z "${ALB_ARN}" || "${ALB_ARN}" == "None" ]]; then
  miss "ALB: ${ALB_NAME} (region=${AWS_REGION})"
else
  ok "ALB: ${ALB_NAME} (${ALB_DNS})"
  aws --no-cli-pager elbv2 describe-load-balancers --region "${AWS_REGION}" --load-balancer-arns "${ALB_ARN}" \
    --query 'LoadBalancers[0].{Scheme:Scheme,State:State.Code,VpcId:VpcId,Subnets:AvailabilityZones[].SubnetId}' --output table || true
  aws --no-cli-pager elbv2 describe-listeners --region "${AWS_REGION}" --load-balancer-arn "${ALB_ARN}" \
    --query 'Listeners[].{Port:Port,Protocol:Protocol,SslPolicy:SslPolicy,Certificates:Certificates[].CertificateArn}' --output table || true
fi

TARGET_GROUP_NAME_EFFECTIVE="${TARGET_GROUP_NAME}"
TG_ARN="$(aws --no-cli-pager elbv2 describe-target-groups --region "${AWS_REGION}" --names "${TARGET_GROUP_NAME_EFFECTIVE}" --query 'TargetGroups[0].TargetGroupArn' --output text 2>/dev/null || true)"
if [[ -z "${TG_ARN}" || "${TG_ARN}" == "None" ]]; then
  if [[ -n "${ALB_ARN}" && "${ALB_ARN}" != "None" ]]; then
    TG_ARN="$(aws --no-cli-pager elbv2 describe-listeners --region "${AWS_REGION}" --load-balancer-arn "${ALB_ARN}" --query 'Listeners[].DefaultActions[?Type==`forward`].TargetGroupArn | [0]' --output text 2>/dev/null || true)"
    if [[ -n "${TG_ARN}" && "${TG_ARN}" != "None" ]]; then
      TARGET_GROUP_NAME_EFFECTIVE="$(aws --no-cli-pager elbv2 describe-target-groups --region "${AWS_REGION}" --target-group-arns "${TG_ARN}" --query 'TargetGroups[0].TargetGroupName' --output text 2>/dev/null || true)"
      warn "Target group not found by name: ${TARGET_GROUP_NAME} (using ALB listener target group: ${TARGET_GROUP_NAME_EFFECTIVE})"
    fi
  fi
fi
if [[ -z "${TG_ARN}" || "${TG_ARN}" == "None" ]]; then
  miss "Target group: ${TARGET_GROUP_NAME} (region=${AWS_REGION})"
else
  ok "Target group: ${TARGET_GROUP_NAME_EFFECTIVE}"
  aws --no-cli-pager elbv2 describe-target-groups --region "${AWS_REGION}" --target-group-arns "${TG_ARN}" \
    --query 'TargetGroups[0].{Protocol:Protocol,Port:Port,VpcId:VpcId,HealthPath:HealthCheckPath,HealthProtocol:HealthCheckProtocol}' --output table || true
  aws --no-cli-pager elbv2 describe-target-health --region "${AWS_REGION}" --target-group-arn "${TG_ARN}" \
    --query 'TargetHealthDescriptions[].{Target:Target.Id,Port:Target.Port,State:TargetHealth.State,Reason:TargetHealth.Reason}' --output table || true
fi

section "07) ECS (cluster/service)"
requested_ecs_cluster="${ECS_CLUSTER}"
cluster_arn="$(aws --no-cli-pager ecs describe-clusters --region "${AWS_REGION}" --clusters "${ECS_CLUSTER}" --query 'clusters[0].clusterArn' --output text 2>/dev/null || true)"
if [[ -z "${cluster_arn}" || "${cluster_arn}" == "None" ]]; then
  cluster_arns_text="$(aws --no-cli-pager ecs list-clusters --region "${AWS_REGION}" --query 'clusterArns[]' --output text 2>/dev/null || true)"
  if [[ -n "${cluster_arns_text}" ]]; then
    read -r -a cluster_arns <<< "${cluster_arns_text}"
    if (( ${#cluster_arns[@]} == 1 )); then
      ECS_CLUSTER="${cluster_arns[0]##*/}"
      warn "ECS cluster not found: ${requested_ecs_cluster} (using only cluster in region: ${ECS_CLUSTER})"
      cluster_arn="$(aws --no-cli-pager ecs describe-clusters --region "${AWS_REGION}" --clusters "${ECS_CLUSTER}" --query 'clusters[0].clusterArn' --output text 2>/dev/null || true)"
    fi
  fi
fi

if [[ -z "${cluster_arn}" || "${cluster_arn}" == "None" ]]; then
  miss "ECS cluster: ${requested_ecs_cluster} (region=${AWS_REGION})"
  aws --no-cli-pager ecs list-clusters --region "${AWS_REGION}" --output table || true
  service_arn=""
  task_def_arn=""
else
  ok "ECS cluster: ${ECS_CLUSTER}"
  aws --no-cli-pager ecs describe-clusters --region "${AWS_REGION}" --clusters "${ECS_CLUSTER}" \
    --query 'clusters[0].{Status:status,ActiveServices:activeServicesCount,RunningTasks:runningTasksCount,PendingTasks:pendingTasksCount}' --output table || true

  requested_ecs_service="${ECS_SERVICE}"
  service_arn="$(aws --no-cli-pager ecs describe-services --region "${AWS_REGION}" --cluster "${ECS_CLUSTER}" --services "${ECS_SERVICE}" --query 'services[0].serviceArn' --output text 2>/dev/null || true)"
  task_def_arn="$(aws --no-cli-pager ecs describe-services --region "${AWS_REGION}" --cluster "${ECS_CLUSTER}" --services "${ECS_SERVICE}" --query 'services[0].taskDefinition' --output text 2>/dev/null || true)"
  if [[ -z "${service_arn}" || "${service_arn}" == "None" ]]; then
    service_arns_text="$(aws --no-cli-pager ecs list-services --region "${AWS_REGION}" --cluster "${ECS_CLUSTER}" --query 'serviceArns[]' --output text 2>/dev/null || true)"
    if [[ -n "${service_arns_text}" ]]; then
      read -r -a service_arns <<< "${service_arns_text}"
      if (( ${#service_arns[@]} == 1 )); then
        ECS_SERVICE="${service_arns[0]##*/}"
        warn "ECS service not found: ${requested_ecs_service} (using only service in cluster: ${ECS_SERVICE})"
        service_arn="$(aws --no-cli-pager ecs describe-services --region "${AWS_REGION}" --cluster "${ECS_CLUSTER}" --services "${ECS_SERVICE}" --query 'services[0].serviceArn' --output text 2>/dev/null || true)"
        task_def_arn="$(aws --no-cli-pager ecs describe-services --region "${AWS_REGION}" --cluster "${ECS_CLUSTER}" --services "${ECS_SERVICE}" --query 'services[0].taskDefinition' --output text 2>/dev/null || true)"
      fi
    fi
  fi

  if [[ -z "${service_arn}" || "${service_arn}" == "None" ]]; then
    miss "ECS service: ${requested_ecs_service} (cluster=${ECS_CLUSTER}, region=${AWS_REGION})"
    aws --no-cli-pager ecs list-services --region "${AWS_REGION}" --cluster "${ECS_CLUSTER}" --output table || true
  else
    ok "ECS service: ${ECS_SERVICE}"
    aws --no-cli-pager ecs describe-services --region "${AWS_REGION}" --cluster "${ECS_CLUSTER}" --services "${ECS_SERVICE}" \
      --query 'services[0].{Status:status,Desired:desiredCount,Running:runningCount,Pending:pendingCount,TaskDefinition:taskDefinition,LaunchType:launchType}' --output table || true
    aws --no-cli-pager ecs describe-services --region "${AWS_REGION}" --cluster "${ECS_CLUSTER}" --services "${ECS_SERVICE}" \
      --query 'services[0].networkConfiguration.awsvpcConfiguration' --output json || true
    aws --no-cli-pager ecs describe-services --region "${AWS_REGION}" --cluster "${ECS_CLUSTER}" --services "${ECS_SERVICE}" \
      --query 'services[0].loadBalancers' --output json || true
  fi
fi

if [[ -n "${task_def_arn}" && "${task_def_arn}" != "None" ]]; then
  section "07) ECS Task Definition"
  aws --no-cli-pager ecs describe-task-definition --region "${AWS_REGION}" --task-definition "${task_def_arn}" \
    --query 'taskDefinition.{Family:family,Revision:revision,NetworkMode:networkMode,ExecutionRoleArn:executionRoleArn,TaskRoleArn:taskRoleArn,ContainerNames:containerDefinitions[].name,ContainerPorts:containerDefinitions[].portMappings[].containerPort,LogGroups:containerDefinitions[].logConfiguration.options."awslogs-group"}' \
    --output json || true
fi

section "03) VPC (derived from ALB/TG)"
VPC_ID="${VPC_ID_FROM_ALB}"
if [[ -z "${VPC_ID}" || "${VPC_ID}" == "None" ]]; then
  VPC_ID="$(aws --no-cli-pager elbv2 describe-target-groups --region "${AWS_REGION}" --target-group-arns "${TG_ARN}" --query 'TargetGroups[0].VpcId' --output text 2>/dev/null || true)"
fi

if [[ -z "${VPC_ID}" || "${VPC_ID}" == "None" ]]; then
  warn "VPC ID를 특정하지 못했습니다(ALB/TG가 없으면 정상)."
else
  ok "VPC: ${VPC_ID}"
  aws --no-cli-pager ec2 describe-vpcs --region "${AWS_REGION}" --vpc-ids "${VPC_ID}" \
    --query 'Vpcs[0].{VpcId:VpcId,Cidr:CidrBlock,Name:Tags[?Key==`Name`]|[0].Value}' --output table || true
  aws --no-cli-pager ec2 describe-subnets --region "${AWS_REGION}" --filters "Name=vpc-id,Values=${VPC_ID}" \
    --query 'Subnets[].{SubnetId:SubnetId,Az:AvailabilityZone,Cidr:CidrBlock,MapPublicIpOnLaunch:MapPublicIpOnLaunch,Name:Tags[?Key==`Name`]|[0].Value}' --output table || true

  igw_id="$(aws --no-cli-pager ec2 describe-internet-gateways --region "${AWS_REGION}" --filters "Name=attachment.vpc-id,Values=${VPC_ID}" --query 'InternetGateways[0].InternetGatewayId' --output text 2>/dev/null || true)"
  if [[ -n "${igw_id}" && "${igw_id}" != "None" ]]; then
    ok "IGW attached: ${igw_id}"
  else
    warn "IGW가 VPC에 연결되어 있지 않습니다."
  fi

  aws --no-cli-pager ec2 describe-nat-gateways --region "${AWS_REGION}" --filter "Name=vpc-id,Values=${VPC_ID}" \
    --query 'NatGateways[].{NatGatewayId:NatGatewayId,State:State,ConnectivityType:ConnectivityType,AvailabilityMode:AvailabilityMode,RouteTableId:RouteTableId,PublicIps:NatGatewayAddresses[].PublicIp}' --output table || true
fi

section "06) RDS PostgreSQL"
db_instance_id_effective="${DB_INSTANCE_ID}"
if ! aws --no-cli-pager rds describe-db-instances --region "${AWS_REGION}" --db-instance-identifier "${db_instance_id_effective}" >/dev/null 2>&1; then
  db_ids_text="$(aws --no-cli-pager rds describe-db-instances --region "${AWS_REGION}" --query 'DBInstances[].DBInstanceIdentifier' --output text 2>/dev/null || true)"
  if [[ -n "${db_ids_text}" ]]; then
    read -r -a db_ids <<< "${db_ids_text}"
    if (( ${#db_ids[@]} == 1 )); then
      db_instance_id_effective="${db_ids[0]}"
      warn "DB instance not found: ${DB_INSTANCE_ID} (using only DB instance in region: ${db_instance_id_effective})"
    fi
  fi
fi

if aws --no-cli-pager rds describe-db-instances --region "${AWS_REGION}" --db-instance-identifier "${db_instance_id_effective}" >/dev/null 2>&1; then
  ok "DB instance: ${db_instance_id_effective}"
  db_subnet_group_from_instance="$(aws --no-cli-pager rds describe-db-instances --region "${AWS_REGION}" --db-instance-identifier "${db_instance_id_effective}" --query 'DBInstances[0].DBSubnetGroup.DBSubnetGroupName' --output text 2>/dev/null || true)"
  aws --no-cli-pager rds describe-db-instances --region "${AWS_REGION}" --db-instance-identifier "${db_instance_id_effective}" \
    --query 'DBInstances[0].{Status:DBInstanceStatus,Engine:Engine,Class:DBInstanceClass,Endpoint:Endpoint.Address,Port:Endpoint.Port,PubliclyAccessible:PubliclyAccessible,MultiAZ:MultiAZ,BackupRetention:BackupRetentionPeriod,DeletionProtection:DeletionProtection,SubnetGroup:DBSubnetGroup.DBSubnetGroupName,VpcSecurityGroups:VpcSecurityGroups[].VpcSecurityGroupId,ReadReplicas:ReadReplicaDBInstanceIdentifiers}' \
    --output json || true
else
  miss "DB instance: ${DB_INSTANCE_ID} (region=${AWS_REGION})"
  db_subnet_group_from_instance=""
fi

if aws --no-cli-pager rds describe-db-subnet-groups --region "${AWS_REGION}" --db-subnet-group-name "${DB_SUBNET_GROUP}" >/dev/null 2>&1; then
  ok "DB subnet group: ${DB_SUBNET_GROUP}"
else
  if [[ -n "${db_subnet_group_from_instance}" && "${db_subnet_group_from_instance}" != "None" ]]; then
    warn "DB subnet group not found: ${DB_SUBNET_GROUP} (instance uses: ${db_subnet_group_from_instance})"
    if aws --no-cli-pager rds describe-db-subnet-groups --region "${AWS_REGION}" --db-subnet-group-name "${db_subnet_group_from_instance}" >/dev/null 2>&1; then
      ok "DB subnet group: ${db_subnet_group_from_instance}"
    fi
  else
    miss "DB subnet group: ${DB_SUBNET_GROUP} (region=${AWS_REGION})"
  fi
fi

section "08) CloudFront (+ACM/Route53)"
aws --no-cli-pager cloudfront list-distributions \
  --query 'DistributionList.Items[].{Id:Id,Status:Status,Enabled:Enabled,DomainName:DomainName,AliasCount:Aliases.Quantity,Alias0:Aliases.Items[0],OriginCount:Origins.Quantity,Origin0:Origins.Items[0].DomainName}' \
  --output table || true

backend_dist_id=""
if [[ -n "${API_DOMAIN}" ]]; then
  backend_dist_id="$(aws --no-cli-pager cloudfront list-distributions --query "DistributionList.Items[?contains(join(',',Aliases.Items), '${API_DOMAIN}')].Id | [0]" --output text 2>/dev/null || true)"
fi
if [[ -z "${backend_dist_id}" || "${backend_dist_id}" == "None" ]]; then
  if [[ -n "${ALB_DNS}" && "${ALB_DNS}" != "None" ]]; then
    backend_dist_id="$(aws --no-cli-pager cloudfront list-distributions --query "DistributionList.Items[?contains(join(',',Origins.Items[].DomainName), '${ALB_DNS}')].Id | [0]" --output text 2>/dev/null || true)"
  fi
fi
if [[ -z "${backend_dist_id}" || "${backend_dist_id}" == "None" ]]; then
  backend_dist_id="$(aws --no-cli-pager cloudfront list-distributions --query "DistributionList.Items[?contains(join(',',Origins.Items[].DomainName), 'elb.amazonaws.com')].Id | [0]" --output text 2>/dev/null || true)"
fi

if [[ -z "${backend_dist_id}" || "${backend_dist_id}" == "None" ]]; then
  warn "백엔드(ALB) 오리진을 가진 CloudFront 배포를 자동으로 특정하지 못했습니다."
  warn "API_DOMAIN(예: api.example.com)을 환경 변수로 넣고 다시 실행하면 특정이 더 정확합니다."
else
  ok "Backend CloudFront distribution candidate: ${backend_dist_id}"
  dist_viewer_cert_arn="$(aws --no-cli-pager cloudfront get-distribution-config --id "${backend_dist_id}" --query 'DistributionConfig.ViewerCertificate.ACMCertificateArn' --output text 2>/dev/null || true)"
  aws --no-cli-pager cloudfront get-distribution-config --id "${backend_dist_id}" \
    --query '{Aliases:DistributionConfig.Aliases.Items,Origins:DistributionConfig.Origins.Items[].{Id:Id,DomainName:DomainName,OriginProtocolPolicy:CustomOriginConfig.OriginProtocolPolicy},DefaultCacheBehavior:DistributionConfig.DefaultCacheBehavior.{TargetOriginId:TargetOriginId,ViewerProtocolPolicy:ViewerProtocolPolicy,CachePolicyId:CachePolicyId,OriginRequestPolicyId:OriginRequestPolicyId,AllowedMethods:AllowedMethods.Items},CacheBehaviors:DistributionConfig.CacheBehaviors.Items[].{PathPattern:PathPattern,TargetOriginId:TargetOriginId,CachePolicyId:CachePolicyId,OriginRequestPolicyId:OriginRequestPolicyId},WebACLId:DistributionConfig.WebACLId,Comment:DistributionConfig.Comment,ViewerCertificate:DistributionConfig.ViewerCertificate}' \
    --output json || true

  if [[ -n "${dist_viewer_cert_arn}" && "${dist_viewer_cert_arn}" != "None" ]]; then
    ok "CloudFront ACM cert: ${dist_viewer_cert_arn}"
    aws --no-cli-pager acm describe-certificate --region us-east-1 --certificate-arn "${dist_viewer_cert_arn}" \
      --query 'Certificate.{DomainName:DomainName,Status:Status,NotAfter:NotAfter,SubjectAlternativeNames:SubjectAlternativeNames}' --output json || true
  else
    warn "CloudFront 배포에서 ACMCertificateArn을 찾지 못했습니다(기본 인증서거나 설정 확인 필요)."
  fi
fi

if [[ -n "${API_DOMAIN}" || -n "${ORIGIN_API_DOMAIN}" ]]; then
  section "08) Route53 (optional)"
  zones="$(aws --no-cli-pager route53 list-hosted-zones --query 'HostedZones[].{Id:Id,Name:Name,Private:Config.PrivateZone}' --output text 2>/dev/null || true)"
  if [[ -z "${zones}" ]]; then
    warn "Route53 hosted zone을 찾지 못했습니다(외부 DNS 사용이면 정상)."
  else
    aws --no-cli-pager route53 list-hosted-zones --query 'HostedZones[].{Id:Id,Name:Name,Private:Config.PrivateZone}' --output table || true
  fi

  find_zone_for_record() {
    local record="$1"
    local best_id=""
    local best_name=""
    while read -r zid zname _; do
      [[ -z "${zid}" || -z "${zname}" ]] && continue
      if [[ "${record}." == *"${zname}" ]]; then
        if (( ${#zname} > ${#best_name} )); then
          best_name="${zname}"
          best_id="${zid}"
        fi
      fi
    done < <(aws --no-cli-pager route53 list-hosted-zones --query 'HostedZones[].{Id:Id,Name:Name,Private:Config.PrivateZone}' --output text 2>/dev/null || true)
    printf '%s' "${best_id##*/}"
  }

  for record in "${API_DOMAIN}" "${ORIGIN_API_DOMAIN}"; do
    [[ -z "${record}" ]] && continue
    zone_id="$(find_zone_for_record "${record}")"
    if [[ -z "${zone_id}" ]]; then
      warn "Hosted zone을 찾지 못해 레코드 확인을 건너뜁니다: ${record}"
      continue
    fi
    alias_target="$(aws --no-cli-pager route53 list-resource-record-sets --hosted-zone-id "${zone_id}" --query "ResourceRecordSets[?Name=='${record}.'].AliasTarget.DNSName | [0]" --output text 2>/dev/null || true)"
    if [[ -z "${alias_target}" || "${alias_target}" == "None" ]]; then
      miss "Route53 record: ${record} (zone=${zone_id})"
    else
      ok "Route53 record: ${record} -> ${alias_target}"
    fi
  done
fi

hr
say "Done."
