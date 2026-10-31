#!/bin/bash

###############################################################################
# ITNB Hub – Production Deployment Initialization Script
# 
# DESCRIPTION:
#   Sets up ITNB Hub on a production server (Ubuntu 20.04+)
#   - Installs Docker & Docker Compose
#   - HTTPS is handled by Caddy (automatic Let's Encrypt)
#   - Sets up environment variables
#   - Initializes database
#   - Starts all services
#
# USAGE:
#   chmod +x deploy/setup.sh
#   sudo ./deploy/setup.sh
#
# REQUIREMENTS:
#   - Ubuntu 20.04 or later
#   - Root or sudo access
#   - Public IP/domain registered
#
###############################################################################

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOMAIN="${1:-}"
EMAIL="${2:-admin@example.com}"

# ===========================================================================
# Helper functions
# ===========================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# ===========================================================================
# Check prerequisites
# ===========================================================================

log_info "Checking prerequisites..."

if [[ ! -f "$PROJECT_DIR/.env" ]]; then
    log_error ".env file not found at $PROJECT_DIR/.env"
fi

if [[ -z "$DOMAIN" ]]; then
    log_error "Domain name required. Usage: ./setup.sh yourdomain.com [email@example.com]"
fi

if ! command -v docker &> /dev/null; then
    log_warning "Docker not found. Installing Docker..."
    curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
    bash /tmp/get-docker.sh
    usermod -aG docker $SUDO_USER
    log_success "Docker installed"
fi

if ! command -v docker-compose &> /dev/null; then
    log_warning "Docker Compose not found. Installing..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    log_success "Docker Compose installed"
fi

# ===========================================================================
# Update .env for production
# ===========================================================================

log_info "Configuring environment for production..."

# Generate secure SECRET_KEY if not set
if grep -q "SECRET_KEY=change-me" "$PROJECT_DIR/.env"; then
    SECRET_KEY=$(python3 -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())')
    sed -i "s/SECRET_KEY=.*/SECRET_KEY=$SECRET_KEY/" "$PROJECT_DIR/.env"
    log_success "Generated secure SECRET_KEY"
fi

# Update ALLOWED_HOSTS
sed -i "s/ALLOWED_HOSTS=.*/ALLOWED_HOSTS=$DOMAIN,www.$DOMAIN,127.0.0.1/" "$PROJECT_DIR/.env"
log_success "Updated ALLOWED_HOSTS to $DOMAIN"

# Enable production settings
sed -i "s/DEBUG=.*/DEBUG=False/" "$PROJECT_DIR/.env"
sed -i "s/SECURE_SSL_REDIRECT=.*/SECURE_SSL_REDIRECT=1/" "$PROJECT_DIR/.env"
sed -i "s/SESSION_COOKIE_SECURE=.*/SESSION_COOKIE_SECURE=1/" "$PROJECT_DIR/.env"
sed -i "s/CSRF_COOKIE_SECURE=.*/CSRF_COOKIE_SECURE=1/" "$PROJECT_DIR/.env"
sed -i "s|CSRF_TRUSTED_ORIGINS=.*|CSRF_TRUSTED_ORIGINS=https://$DOMAIN,https://www.$DOMAIN|" "$PROJECT_DIR/.env"
log_success "Enabled production security settings"

# ===========================================================================
# Create frontend release directory (Caddy bind mount)
# ===========================================================================

mkdir -p "$PROJECT_DIR/frontend-releases"

log_success "Created frontend-releases directory"

# ===========================================================================
# Build and start services
# ===========================================================================

log_info "Building Docker images..."

cd "$PROJECT_DIR"
docker-compose -f docker-compose.prod.yml build

log_success "Docker images built"

log_info "Starting services..."

docker-compose -f docker-compose.prod.yml up -d

sleep 5

log_success "Services started"

# ===========================================================================
# TLS
# ===========================================================================

log_info "HTTPS is automatic: Caddy issues certificates once DNS points at this server"
log_info "  docker compose -f docker-compose.prod.yml logs -f caddy"

# ===========================================================================
# Verify services
# ===========================================================================

log_info "Verifying services..."

sleep 3

if docker ps | grep -q "itnb-hub-backend"; then
    log_success "Backend service is running"
else
    log_error "Backend service failed to start"
fi

if docker ps | grep -q "itnb-hub-celery"; then
    log_success "Celery worker is running"
else
    log_warning "Celery worker not running"
fi

# ===========================================================================
# Summary
# ===========================================================================

log_success "======================================================"
log_success "ITNB Hub Deployment Complete!"
log_success "======================================================"
echo ""
echo "Project: $PROJECT_DIR"
echo "Domain: $DOMAIN"
echo ""
echo "Next steps:"
echo "1. HTTPS: point DNS at this server; Caddy issues certificates automatically"
echo "   docker-compose -f docker-compose.prod.yml logs -f caddy"
echo ""
echo "2. View logs:"
echo "   docker-compose -f docker-compose.prod.yml logs -f"
echo ""
echo "3. Access your API:"
echo "   https://$DOMAIN/api/"
echo ""
log_success "========================================================"
