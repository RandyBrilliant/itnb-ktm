#!/bin/bash

###############################################################################
# ITNB Hub – Update & Redeploy Script
#
# DESCRIPTION:
#   Pulls latest code, rebuilds Docker images, and redeploys services
#   Safe for production (no data loss)
#
# USAGE:
#   chmod +x deploy/redeploy.sh
#   ./deploy/redeploy.sh
#
###############################################################################

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ===========================================================================
# Main deployment
# ===========================================================================

log_info "Starting ITNB Hub redeployment..."

cd "$PROJECT_DIR"

# Check if .env exists
if [[ ! -f .env ]]; then
    log_error ".env file not found"
fi

log_info "Pulling latest code from git..."
git pull origin main || log_warning "Git pull failed (not a git repo?)"

log_info "Building Docker images..."
docker-compose -f docker-compose.prod.yml build --no-cache

log_info "Stopping old services..."
docker-compose -f docker-compose.prod.yml down

log_info "Starting new services..."
docker-compose -f docker-compose.prod.yml up -d

log_info "Running database migrations..."
sleep 5
docker exec itnb-hub-backend python manage.py migrate --noinput || log_warning "Migrations may have already been applied"

log_info "Collecting static files..."
docker exec itnb-hub-backend python manage.py collectstatic --noinput

log_success "Redeployment complete!"
log_info "Services status:"
docker ps | grep itnb-hub

log_info "View logs: docker-compose -f docker-compose.prod.yml logs -f"
