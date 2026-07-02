#!/bin/bash
# Shared helpers for ITNB Hub registry-based deploys.

set -euo pipefail

# Directory containing docker-compose.prod.yml (backend/).
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env}"
APP_SERVICE="${APP_SERVICE:-api}"
APP_CONTAINER="${APP_CONTAINER:-itnb-hub-backend}"
WORKER_SERVICES="${WORKER_SERVICES:-celery celery-beat}"
DEFAULT_APP_IMAGE="${DEFAULT_APP_IMAGE:-itnb-hub-api:latest}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() { echo -e "\n${BLUE}=== $1 ===${NC}"; }
print_success() { echo -e "${GREEN}[OK]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARN]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

require_project_root() {
    if [[ ! -f "$PROJECT_ROOT/$COMPOSE_FILE" ]]; then
        print_error "Expected $COMPOSE_FILE in $PROJECT_ROOT"
        exit 1
    fi
}

require_docker() {
    if ! command -v docker >/dev/null 2>&1; then
        print_error "Docker is not installed"
        exit 1
    fi
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker daemon is not running or not accessible"
        exit 1
    fi
}

make_scripts_executable() {
    chmod +x "$PROJECT_ROOT/deploy/"*.sh "$PROJECT_ROOT/deploy/lib/"*.sh 2>/dev/null || true
}

resolve_repo_root() {
    if git -C "$PROJECT_ROOT" rev-parse --show-toplevel >/dev/null 2>&1; then
        git -C "$PROJECT_ROOT" rev-parse --show-toplevel
        return 0
    fi

    local dir="$PROJECT_ROOT"
    while [[ "$dir" != "/" ]]; do
        if [[ -d "$dir/.git" ]]; then
            echo "$dir"
            return 0
        fi
        dir="$(dirname "$dir")"
    done

    echo "$PROJECT_ROOT"
}

load_env() {
    if [[ -f "$PROJECT_ROOT/$ENV_FILE" ]]; then
        set -a
        # shellcheck disable=SC1090
        source "$PROJECT_ROOT/$ENV_FILE"
        set +a
    fi
}

validate_env() {
    if [[ ! -f "$PROJECT_ROOT/$ENV_FILE" ]]; then
        print_error "$ENV_FILE missing — copy env.example to .env and configure secrets"
        exit 1
    fi

    load_env

    if [[ "${DEBUG:-True}" =~ ^(False|0|false|no)$ ]]; then
        if [[ -z "${SECRET_KEY:-}" || "${SECRET_KEY}" == change-me* ]]; then
            print_error "SECRET_KEY must be set to a secure value in production"
            exit 1
        fi
    fi
}

compose() {
    local args=()
    if [[ -f "$PROJECT_ROOT/$ENV_FILE" ]]; then
        args+=(--env-file "$PROJECT_ROOT/$ENV_FILE")
    fi
    docker compose -f "$PROJECT_ROOT/$COMPOSE_FILE" "${args[@]}" "$@"
}

persist_app_image() {
    local image="$1"
    local env_file="$PROJECT_ROOT/$ENV_FILE"

    [[ -n "$image" ]] || return 0
    touch "$env_file"

    if grep -q '^APP_IMAGE=' "$env_file" 2>/dev/null; then
        sed -i.bak "s|^APP_IMAGE=.*|APP_IMAGE=${image}|" "$env_file" && rm -f "${env_file}.bak"
    else
        echo "APP_IMAGE=${image}" >> "$env_file"
    fi
}

read_persisted_app_image() {
    grep -E '^APP_IMAGE=' "$PROJECT_ROOT/$ENV_FILE" 2>/dev/null | head -n1 | cut -d= -f2- | tr -d '"' | tr -d "'"
}

read_running_app_image() {
    docker inspect "$APP_CONTAINER" --format '{{.Config.Image}}' 2>/dev/null | tr -d '[:space:]'
}

read_last_good_app_image() {
    if [[ -f "$PROJECT_ROOT/.deploy-last-good-image" ]]; then
        head -n1 "$PROJECT_ROOT/.deploy-last-good-image" | tr -d '[:space:]'
    fi
}

save_last_good_app_image() {
    [[ -n "${1:-}" ]] && printf '%s\n' "$1" > "$PROJECT_ROOT/.deploy-last-good-image"
}

resolve_app_port() {
    load_env
    echo "${API_PORT:-8000}"
}

probe_app_http_health() {
    local port="${1:-$(resolve_app_port)}"
    local max_attempts="${2:-12}"
    local i

    for ((i = 1; i <= max_attempts; i++)); do
        if curl -fsS --max-time 5 "http://127.0.0.1:${port}/health/" 2>/dev/null \
            | grep -qE '"status"[[:space:]]*:[[:space:]]*"ok"|"success"[[:space:]]*:[[:space:]]*true|"up"[[:space:]]*:[[:space:]]*true'; then
            return 0
        fi
        sleep 5
    done

    return 1
}

wait_for_healthy() {
    local service="$1"
    local max_attempts="${2:-40}"
    local i

    for ((i = 1; i <= max_attempts; i++)); do
        if compose ps "$service" 2>/dev/null | grep -q "(healthy)"; then
            return 0
        fi
        sleep 3
    done

    return 1
}

restart_workers() {
    local worker
    for worker in $WORKER_SERVICES; do
        compose up -d --no-deps "$worker"
    done
}

rollback_app_deployment() {
    local rollback_image="$1"
    [[ -n "$rollback_image" ]] || return 1

    print_warning "Rolling back to $rollback_image"
    export APP_IMAGE="$rollback_image"
    compose pull "$APP_SERVICE" 2>/dev/null || true
    compose up -d --no-deps "$APP_SERVICE"

    if wait_for_healthy "$APP_SERVICE" 40 && probe_app_http_health "$(resolve_app_port)" 12; then
        restart_workers
        persist_app_image "$rollback_image"
        save_last_good_app_image "$rollback_image"
        print_success "Rollback completed"
        return 0
    fi

    return 1
}
