#!/usr/bin/env bash
# Runs on the server as root, from the repo checkout. Usage:
#   remote-deploy.sh <commit-sha|branch>      (default: origin/main)
# Fetches that commit, builds the images on this machine and restarts the stack.
set -euo pipefail

REF="${1:-origin/main}"
REGION=eu-north-1
BASE=/opt/treasurebox
SRC=$BASE/src
export AWS_DEFAULT_REGION=$REGION

cd "$SRC"
git fetch --quiet origin
git checkout --quiet --force "$REF"
echo "Deploying $(git log --oneline -1)"

# Secrets and build settings live in SSM Parameter Store
umask 077
aws ssm get-parameter --name /treasurebox/api-env --with-decryption \
  --query Parameter.Value --output text > "$BASE/api.env.new"
mv "$BASE/api.env.new" "$BASE/api.env"
aws ssm get-parameter --name /treasurebox/build-env --with-decryption \
  --query Parameter.Value --output text > deploy/.env
umask 022

cd deploy
# Build one image at a time: the server has little RAM. Old containers keep serving meanwhile.
BUILD_LOG=$BASE/build.log
if ! COMPOSE_PARALLEL_LIMIT=1 docker compose --progress plain build --pull > "$BUILD_LOG" 2>&1; then
  tail -60 "$BUILD_LOG"
  echo "Deploy FAILED: image build failed (full log: $BUILD_LOG)" >&2
  exit 1
fi
echo "Images built"
docker compose up -d --remove-orphans

# Free disk: old images and build cache
docker image prune -f >/dev/null || true
docker builder prune -f --keep-storage 3gb >/dev/null 2>&1 || true

# Wait up to 2 minutes for the API to answer through nginx
for _ in $(seq 1 24); do
  if curl -fsS -m 5 http://127.0.0.1/health >/dev/null 2>&1; then
    docker compose ps
    echo "Deploy OK: $(git -C "$SRC" log --oneline -1)"
    exit 0
  fi
  sleep 5
done
docker compose ps
docker compose logs --tail 40 api
echo "Deploy FAILED: API health check did not pass" >&2
exit 1
