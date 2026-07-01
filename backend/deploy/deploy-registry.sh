#!/bin/bash
# Pull a prebuilt image from GHCR and deploy with automatic rollback on failure.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

print_header "Registry deploy (pull prebuilt image)"
require_project_root
require_docker
make_scripts_executable

if [[ -z "${APP_IMAGE:-}" ]]; then
    print_error "APP_IMAGE is required (e.g. ghcr.io/<owner>/itnb-hub-api:<sha>)"
    exit 1
fi

validate_env
load_env

TARGET_APP_IMAGE="$APP_IMAGE"
PREVIOUS_APP_IMAGE="$(read_running_app_image)"
if [[ -z "$PREVIOUS_APP_IMAGE" ]]; then
    PREVIOUS_APP_IMAGE="$(read_persisted_app_image)"
fi
if [[ -z "$PREVIOUS_APP_IMAGE" ]]; then
    PREVIOUS_APP_IMAGE="$(read_last_good_app_image)"
fi

export APP_IMAGE="$TARGET_APP_IMAGE"

if [[ "${AUTO_DEPLOY:-}" != "true" ]]; then
    read -r -p "Pull and deploy ${TARGET_APP_IMAGE}? (yes/no): " confirm
    [[ "$confirm" == "yes" ]] || exit 0
fi

if [[ "${SKIP_PULL_CODE:-false}" != "true" ]]; then
    REPO_ROOT="$(resolve_repo_root)"
    BEFORE_HEAD="$(git -C "$REPO_ROOT" rev-parse HEAD 2>/dev/null || true)"
    git -C "$REPO_ROOT" pull origin "$DEPLOY_BRANCH" || true
    AFTER_HEAD="$(git -C "$REPO_ROOT" rev-parse HEAD 2>/dev/null || true)"
    if [[ -z "${CHANGED_FILES:-}" && -n "$BEFORE_HEAD" && -n "$AFTER_HEAD" ]]; then
        CHANGED_FILES="$(git -C "$REPO_ROOT" diff --name-only "$BEFORE_HEAD" "$AFTER_HEAD" 2>/dev/null || true)"
    fi
    make_scripts_executable
fi

print_header "Pulling ${TARGET_APP_IMAGE}"
compose pull "$APP_SERVICE"

print_header "Starting API container"
compose up -d --no-deps "$APP_SERVICE"

DEPLOY_OK=false
if wait_for_healthy "$APP_SERVICE" 40 && probe_app_http_health "$(resolve_app_port)" 12; then
    DEPLOY_OK=true
fi

if [[ "$DEPLOY_OK" != true ]]; then
    print_error "New deployment failed health checks"
    compose logs --tail=50 "$APP_SERVICE" || true
    if [[ -n "$PREVIOUS_APP_IMAGE" && "$PREVIOUS_APP_IMAGE" != "$TARGET_APP_IMAGE" ]]; then
        rollback_app_deployment "$PREVIOUS_APP_IMAGE" && exit 1
    fi
    exit 1
fi

persist_app_image "$TARGET_APP_IMAGE"
save_last_good_app_image "$TARGET_APP_IMAGE"

print_header "Restarting workers"
restart_workers

if [[ -n "${CHANGED_FILES:-}" ]] && echo "$CHANGED_FILES" | grep -qE '(^|/)nginx/'; then
    print_header "Reloading nginx (config changed)"
    compose up -d --no-deps nginx
fi

print_success "Deployed ${TARGET_APP_IMAGE}"
