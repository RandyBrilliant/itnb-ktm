#!/bin/bash
# First-time production bootstrap: build images locally and start the full stack.
# After this succeeds, routine deploys use deploy-registry.sh via GitHub Actions.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

print_header "Fresh production deploy (local build)"
require_project_root
require_docker
make_scripts_executable
validate_env
load_env

export APP_IMAGE="${APP_IMAGE:-$DEFAULT_APP_IMAGE}"

if [[ "${AUTO_DEPLOY:-}" != "true" ]]; then
    read -r -p "Build and start the full production stack? (yes/no): " confirm
    [[ "$confirm" == "yes" ]] || exit 0
fi

print_header "Building and starting services"
compose up -d --build

print_header "Waiting for API health"
if wait_for_healthy "$APP_SERVICE" 60 && probe_app_http_health "$(resolve_app_port)" 18; then
    persist_app_image "$APP_IMAGE"
    save_last_good_app_image "$APP_IMAGE"
    print_success "Fresh deploy complete"
    compose ps
else
    print_error "Fresh deploy failed health checks"
    compose logs --tail=50 "$APP_SERVICE" || true
    exit 1
fi
