#!/bin/sh
# Certbot deploy hook. Runs as root after a certificate is renewed.
# certbot.timer invokes this from /etc/letsencrypt/renewal-hooks/deploy/.

set -eu

LOG=/var/log/itnb-ssl-reload.log
DOCKER="$(command -v docker || true)"

if [ -z "$DOCKER" ]; then
    echo "$(date -Iseconds) ERROR: docker not found; nginx was not reloaded" >> "$LOG"
    exit 1
fi

if "$DOCKER" ps --format '{{.Names}}' | grep -qx 'itnb-hub-nginx'; then
    "$DOCKER" exec itnb-hub-nginx nginx -s reload
    echo "$(date -Iseconds) nginx reloaded after certificate renewal${RENEWED_DOMAINS:+ ($RENEWED_DOMAINS)}" >> "$LOG"
else
    echo "$(date -Iseconds) WARN: itnb-hub-nginx not running; new certificate loads on next start" >> "$LOG"
fi
