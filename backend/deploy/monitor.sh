#!/bin/bash

###############################################################################
# ITNB Hub – Monitoring & Diagnostics Script
#
# DESCRIPTION:
#   Check service health, view logs, restart services
#
# USAGE:
#   chmod +x deploy/monitor.sh
#   ./deploy/monitor.sh <status|logs|restart|clean|health>
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
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

COMMAND="${1:-status}"

cd "$PROJECT_DIR"

# ===========================================================================
# Commands
# ===========================================================================

if [[ "$COMMAND" == "status" ]]; then
    log_info "=== Service Status ==="
    docker ps --filter "name=itnb-hub" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
elif [[ "$COMMAND" == "logs" ]]; then
    SERVICE="${2:-backend}"
    log_info "Showing logs for $SERVICE (Ctrl+C to exit)..."
    docker-compose -f docker-compose.prod.yml logs -f $SERVICE
    
elif [[ "$COMMAND" == "restart" ]]; then
    SERVICE="${2:-all}"
    if [[ "$SERVICE" == "all" ]]; then
        log_warning "Restarting all services..."
        docker-compose -f docker-compose.prod.yml restart
    else
        log_warning "Restarting $SERVICE..."
        docker-compose -f docker-compose.prod.yml restart $SERVICE
    fi
    log_success "Restart complete"
    
elif [[ "$COMMAND" == "clean" ]]; then
    log_warning "This will remove stopped containers and unused images"
    read -p "Continue? (yes/no): " -r CONFIRM
    if [[ $CONFIRM =~ ^[Yy][Ee][Ss]$ ]]; then
        docker container prune -f
        docker image prune -f
        log_success "Cleanup complete"
    fi
    
elif [[ "$COMMAND" == "health" ]]; then
    log_info "=== Health Check ==="
    
    # Check backend
    if docker exec itnb-hub-backend python manage.py check; then
        log_success "Backend: OK"
    else
        log_error "Backend: FAILED"
    fi
    
    # Check database
    if docker exec itnb-hub-db pg_isready -U postgres > /dev/null 2>&1; then
        log_success "Database: OK"
    else
        log_error "Database: FAILED"
    fi
    
    # Check Redis
    if docker exec itnb-hub-redis redis-cli ping > /dev/null 2>&1; then
        log_success "Redis: OK"
    else
        log_error "Redis: FAILED"
    fi
    
    # Check API accessibility
    if curl -sf http://localhost:8000/api/ > /dev/null 2>&1; then
        log_success "API: OK"
    else
        log_warning "API: Unreachable (may need nginx/SSL setup)"
    fi
    
    echo ""
    log_success "Health check complete"
    
elif [[ "$COMMAND" == "exec" ]]; then
    CONTAINER="${2:-backend}"
    COMMAND_STR="${3:-python manage.py shell}"
    log_info "Executing in $CONTAINER: $COMMAND_STR"
    docker exec -it itnb-hub-$CONTAINER $COMMAND_STR
    
else
    echo "Usage:"
    echo "  $0 status              - Show running services"
    echo "  $0 logs [service]      - View logs (backend, db, redis, celery, etc.)"
    echo "  $0 restart [service]   - Restart service(s)"
    echo "  $0 health              - Run health checks"
    echo "  $0 clean               - Remove stopped containers/images"
    echo "  $0 exec <container> <cmd> - Execute command in container"
    exit 1
fi
