#!/usr/bin/env bash
set -euo pipefail

: "${AWS_REGION:?}"
: "${AWS_ACCOUNT_ID:?}"
: "${ECR_REPO:?}"

IMAGE_TAG="${IMAGE_TAG:-dev-latest}"
CONTAINER_NAME="${CONTAINER_NAME:-detective-backend}"
PORT_PUBLISH="${PORT_PUBLISH:-127.0.0.1:8080:8080}"
ENV_FILE="${ENV_FILE:-$HOME/detective-backend.env}"

ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
IMAGE="${ECR_REGISTRY}/${ECR_REPO}:${IMAGE_TAG}"

aws ecr get-login-password --region "$AWS_REGION" \
  | docker login --username AWS --password-stdin "$ECR_REGISTRY" >/dev/null

docker pull "$IMAGE"
docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true

run_args=(
  -d
  --name "$CONTAINER_NAME"
  --restart unless-stopped
  -p "$PORT_PUBLISH"
)

if [ -f "$ENV_FILE" ]; then
  run_args+=(--env-file "$ENV_FILE")
else
  echo "WARN: env file not found: $ENV_FILE (run without --env-file)" >&2
fi

docker run "${run_args[@]}" "$IMAGE"
docker ps --filter "name=^/${CONTAINER_NAME}$" --format "table {{.Names}}\t{{.Status}}\t{{.Image}}\t{{.Ports}}"
