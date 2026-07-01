#!/bin/bash
# Renew Let's Encrypt certificates and reload nginx (safe to run from cron).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
WEBROOT="$PROJECT_DIR/nginx/certbot/www"

mkdir -p "$PROJECT_DIR/logs" "$WEBROOT"

log() {
    echo "[$(date -Iseconds)] $*" | tee -a "$PROJECT_DIR/logs/ssl-renew.log"
}

reload_nginx() {
    if docker ps --format '{{.Names}}' | grep -qx 'itnb-hub-nginx'; then
        docker exec itnb-hub-nginx nginx -s reload
        log "nginx reloaded"
    else
        log "WARN: itnb-hub-nginx not running — skipped reload"
    fi
}

if ! command -v certbot >/dev/null 2>&1; then
    log "ERROR: certbot not installed — run deploy/ssl-setup.sh first"
    exit 1
fi

log "Checking for certificate renewal"

certbot renew \
    --quiet \
    --webroot -w "$WEBROOT" \
    --deploy-hook "docker exec itnb-hub-nginx nginx -s reload" \
    2>&1 | tee -a "$PROJECT_DIR/logs/ssl-renew.log"

log "Renewal check complete"
