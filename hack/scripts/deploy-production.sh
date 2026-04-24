#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="${REPO_DIR:-/opt/hack/repo}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.production.yml}"
ENV_FILE="${ENV_FILE:-$REPO_DIR/.env}"
DEPLOY_SHA="${DEPLOY_SHA:-unknown}"
DEPLOY_REPO="${DEPLOY_REPO:-}"
DEPLOY_COMMIT_MESSAGE_B64="${DEPLOY_COMMIT_MESSAGE_B64:-}"

json_escape() {
  local value="$1"
  value="${value//\\/\\\\}"
  value="${value//\"/\\\"}"
  value="${value//$'\n'/\\n}"
  value="${value//$'\r'/\\r}"
  value="${value//$'\t'/\\t}"
  printf '%s' "$value"
}

notify_slack() {
  local status="$1"
  local sha="${DEPLOY_SHA//$'\n'/}"
  sha="${sha//$'\r'/}"
  sha="${sha#"${sha%%[![:space:]]*}"}"
  sha="${sha%"${sha##*[![:space:]]}"}"
  if [[ -z "$sha" ]]; then
    sha="unknown"
  fi
  local sha_short="${sha:0:7}"
  local commit_message=""

  if [[ "$sha" == "unknown" ]]; then
    sha="$(git rev-parse HEAD 2>/dev/null || echo "unknown")"
    sha_short="${sha:0:7}"
  fi

  if [[ -n "$DEPLOY_COMMIT_MESSAGE_B64" ]]; then
    commit_message="$(printf '%s' "$DEPLOY_COMMIT_MESSAGE_B64" | base64 --decode 2>/dev/null || true)"
  fi

  if [[ -z "$commit_message" && "$sha" != "unknown" ]]; then
    commit_message="$(git show -s --format=%s "$sha" 2>/dev/null || true)"
  fi

  commit_message="${commit_message//$'\r'/}"
  commit_message="${commit_message//$'\n'/ }"

  if [[ -z "${SLACK_BOT_TOKEN:-}" || -z "${SLACK_CHANNEL:-}" ]]; then
    return 0
  fi

  local commit_ref="${sha_short}"
  if [[ -n "$DEPLOY_REPO" && "$sha" != "unknown" ]]; then
    commit_ref="<https://github.com/${DEPLOY_REPO}/commit/${sha}|${sha_short}>"
  fi

  local message
  if [[ "$status" == "success" ]]; then
    message="🚀 sucessfully deployed hack (${commit_ref} commit)"
  else
    message="😭 failed deploying hack (${commit_ref} commit)"
  fi

  if [[ -n "$commit_message" ]]; then
    message="${message} - ${commit_message}"
  fi

  local escaped_message
  escaped_message="$(json_escape "$message")"
  local escaped_channel
  escaped_channel="$(json_escape "$SLACK_CHANNEL")"

  local payload
  payload=$(cat <<EOF
{"channel":"$escaped_channel","text":"$escaped_message"}
EOF
)

  curl -sS -X POST \
    -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
    -H "Content-type: application/json" \
    --data "$payload" \
    https://slack.com/api/chat.postMessage >/dev/null || true
}

on_failure() {
  local exit_code=$?
  notify_slack "failure"
  exit "$exit_code"
}

trap on_failure ERR

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Environment file not found: $ENV_FILE"
  exit 1
fi

cd "$REPO_DIR"

if [[ "${SKIP_GIT_SYNC:-0}" != "1" ]]; then
  git fetch origin main
  git reset --hard origin/main
fi

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d postgres
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" build migrator
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" run --rm migrator
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" build app
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d app postgres cron-ticker --remove-orphans
if [[ "${DOCKER_IMAGE_PRUNE:-0}" == "1" ]]; then
  docker image prune -f
fi

if [[ -n "${CLOUDFLARE_ZONE_ID:-}" && -n "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  curl -sS -X POST \
    "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache" \
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    -H "Content-Type: application/json" \
    --data '{"purge_everything":true}' >/dev/null || true
fi

notify_slack "success"
