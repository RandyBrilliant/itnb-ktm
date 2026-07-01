#!/bin/bash
# First-time Let's Encrypt SSL for portal.itnb.ac.id (or SSL_DOMAIN from .env).
# Installs certbot, obtains the certificate, enables HTTPS in nginx, and schedules auto-renewal.
#
# Usage:
#   ./deploy/ssl-setup.sh [domain] [email]
#
# Prerequisites:
#   - DNS for the domain must point to this VPS
#   - docker compose stack running (at least api + nginx)
#   - ports 80 and 443 open in the firewall

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
WEBROOT="$PROJECT_DIR/nginx/certbot/www"
SSL_TEMPLATE="$PROJECT_DIR/nginx/templates/itnb-hub.ssl.conf.template"
HTTP_CONF="$PROJECT_DIR/nginx/itnb-hub.conf"
SSL_CONF="$PROJECT_DIR/nginx/itnb-hub.ssl.conf"
CRON_MARKER="# itnb-hub-ssl-renew"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[INFO]${NC} $1"; }
ok() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

if [[ -f "$PROJECT_DIR/.env" ]]; then
    set -a
    # shellcheck disable=SC1091
    source "$PROJECT_DIR/.env"
    set +a
fi

DOMAIN="${1:-${SSL_DOMAIN:-portal.itnb.ac.id}}"
EMAIL="${2:-${SSL_EMAIL:-}}"

if [[ -z "$EMAIL" ]]; then
    read -r -p "Let's Encrypt notification email: " EMAIL
fi

[[ -n "$EMAIL" ]] || err "Email is required for Let's Encrypt"
[[ -f "$HTTP_CONF" ]] || err "Missing nginx config: $HTTP_CONF"
[[ -f "$SSL_TEMPLATE" ]] || err "Missing SSL template: $SSL_TEMPLATE"

if ! command -v docker >/dev/null 2>&1; then
    err "Docker is required"
fi

if ! sudo -n true 2>/dev/null; then
    log "sudo access required for certbot"
fi

install_certbot() {
    if command -v certbot >/dev/null 2>&1; then
        ok "certbot already installed"
        return
    fi

    log "Installing certbot"
    sudo apt-get update -qq
    sudo apt-get install -y certbot
    ok "certbot installed"
}

ensure_nginx_running() {
    cd "$PROJECT_DIR"
    docker compose -f docker-compose.prod.yml up -d nginx api
    sleep 3

    if ! docker ps --format '{{.Names}}' | grep -qx 'itnb-hub-nginx'; then
        err "nginx container failed to start — check: docker compose -f docker-compose.prod.yml logs nginx"
    fi
    ok "nginx is running"
}

obtain_certificate() {
    mkdir -p "$WEBROOT" "$PROJECT_DIR/logs"

    if [[ -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]]; then
        warn "Certificate already exists for ${DOMAIN} — skipping issuance"
        return
    fi

    log "Requesting certificate for ${DOMAIN} (DNS must point to this server)"
    log "Using webroot: ${WEBROOT}"

    if sudo certbot certonly \
        --webroot -w "$WEBROOT" \
        -d "$DOMAIN" \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        --non-interactive; then
        ok "Certificate issued"
        return
    fi

    warn "Webroot issuance failed — retrying with standalone (brief nginx stop)"
    cd "$PROJECT_DIR"
    docker compose -f docker-compose.prod.yml stop nginx

    sudo certbot certonly \
        --standalone \
        -d "$DOMAIN" \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        --non-interactive

    docker compose -f docker-compose.prod.yml up -d nginx
    ok "Certificate issued (standalone)"
}

enable_https_nginx() {
    log "Enabling HTTPS in nginx"

    sed "s/__SSL_DOMAIN__/${DOMAIN}/g" "$SSL_TEMPLATE" > "$SSL_CONF"

    # HTTP: ACME + health stay; everything else redirects to HTTPS
    cat > "$HTTP_CONF" << EOF
# ITNB Hub – HTTP (ACME challenges + health; API redirects to HTTPS)
server {
    listen 80;
    server_name ${DOMAIN};

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location /health/ {
        proxy_pass http://api:8000;
        proxy_set_header Host \$host;
        access_log off;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}
EOF

    docker exec itnb-hub-nginx nginx -t
    docker exec itnb-hub-nginx nginx -s reload
    ok "HTTPS enabled for ${DOMAIN}"
}

persist_ssl_env() {
    touch "$PROJECT_DIR/.env"

    for kv in "SSL_DOMAIN=${DOMAIN}" "SSL_EMAIL=${EMAIL}"; do
        key="${kv%%=*}"
        if grep -q "^${key}=" "$PROJECT_DIR/.env" 2>/dev/null; then
            sed -i.bak "s|^${key}=.*|${kv}|" "$PROJECT_DIR/.env" && rm -f "$PROJECT_DIR/.env.bak"
        else
            echo "$kv" >> "$PROJECT_DIR/.env"
        fi
    done
}

install_renewal_cron() {
    chmod +x "$SCRIPT_DIR/ssl-renew.sh"
    local cron_line="0 3 * * * ${SCRIPT_DIR}/ssl-renew.sh >> ${PROJECT_DIR}/logs/ssl-renew.log 2>&1 ${CRON_MARKER}"

    if crontab -l 2>/dev/null | grep -qF "$CRON_MARKER"; then
        ok "Renewal cron already installed"
        return
    fi

    (crontab -l 2>/dev/null || true; echo "$cron_line") | crontab -
    ok "Auto-renewal cron installed (daily 03:00)"
}

verify_https() {
    log "Verifying HTTPS"
    sleep 2

    if curl -fsS --max-time 15 "https://${DOMAIN}/health/" | grep -qE '"status"[[:space:]]*:[[:space:]]*"ok"|"success"[[:space:]]*:[[:space:]]*true'; then
        ok "https://${DOMAIN}/health/ is healthy"
    else
        warn "HTTPS health check did not pass yet — confirm DNS and firewall (ports 80/443)"
        warn "Debug: curl -v https://${DOMAIN}/health/"
    fi
}

log "SSL setup for ${DOMAIN}"
install_certbot
ensure_nginx_running
obtain_certificate
enable_https_nginx
persist_ssl_env
install_renewal_cron
verify_https

echo ""
ok "SSL setup complete"
echo "  Domain:  https://${DOMAIN}"
echo "  Renew:   ${SCRIPT_DIR}/ssl-renew.sh"
echo "  Cron:    daily at 03:00 (certbot renew + nginx reload)"
echo ""
echo "Set on Vercel: VITE_API_URL=https://${DOMAIN}"
