#!/bin/bash
# One-time VPS setup: Docker, firewall basics, git hygiene.
# Run as a user with sudo on Ubuntu 22.04+.

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[INFO]${NC} $1"; }
ok() { echo -e "${GREEN}[OK]${NC} $1"; }
err() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

if [[ "$(id -u)" -eq 0 ]]; then
    err "Run as a normal user with sudo, not root"
fi

if ! command -v sudo >/dev/null 2>&1; then
    err "sudo is required"
fi

log "Updating packages"
sudo apt-get update -qq
sudo apt-get upgrade -y -qq

if ! command -v docker >/dev/null 2>&1; then
    log "Installing Docker"
    curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
    sudo sh /tmp/get-docker.sh
    rm -f /tmp/get-docker.sh
    sudo usermod -aG docker "$USER"
    ok "Docker installed — log out and back in for group membership"
else
    ok "Docker already installed"
fi

if command -v ufw >/dev/null 2>&1; then
    log "Configuring UFW (SSH, HTTP, HTTPS)"
    sudo ufw allow OpenSSH || true
    sudo ufw allow 80/tcp || true
    sudo ufw allow 443/tcp || true
    sudo ufw --force enable || true
    ok "UFW configured"
fi

if ! swapon --show | grep -q .; then
    if [[ ! -f /swapfile ]]; then
        log "Creating 1 GB swap (recommended for 4 GB VPS)"
        sudo fallocate -l 1G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=1024
        sudo chmod 600 /swapfile
        sudo mkswap /swapfile
        sudo swapon /swapfile
        if ! grep -q '/swapfile' /etc/fstab; then
            echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
        fi
        ok "Swap enabled"
    fi
fi

if [[ -d .git ]]; then
    git config core.fileMode false
    ok "git core.fileMode=false set in this repo"
fi

ok "VPS bootstrap complete"
echo ""
echo "Next steps:"
echo "  1. Re-login so docker group applies"
echo "  2. Clone the repo and cd into backend/"
echo "  3. cp env.example .env && edit secrets"
echo "  4. ./deploy/deploy-fresh.sh"
echo "  5. ./deploy/ssl-setup.sh data.itnb.ac.id your@email.com"
