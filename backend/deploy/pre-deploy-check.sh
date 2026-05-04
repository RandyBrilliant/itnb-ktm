#!/bin/bash

###############################################################################
# ITNB Hub – Pre-Deployment Checklist Script
#
# DESCRIPTION:
#   Validates server configuration before deployment
#   Ensures all prerequisites are met
#
# USAGE:
#   chmod +x deploy/pre-deploy-check.sh
#   ./deploy/pre-deploy-check.sh
#
###############################################################################

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASSED=0
FAILED=0
WARNING=0

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Styling functions
check_pass() {
    echo -e "${GREEN}✓ PASS${NC}: $1"
    ((PASSED++))
}

check_fail() {
    echo -e "${RED}✗ FAIL${NC}: $1"
    ((FAILED++))
}

check_warn() {
    echo -e "${YELLOW}⚠ WARN${NC}: $1"
    ((WARNING++))
}

check_info() {
    echo -e "${BLUE}ℹ INFO${NC}: $1"
}

header() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# ===========================================================================
# Checks
# ===========================================================================

header "System Prerequisites"

# Check OS
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    check_pass "Running on Linux"
else
    check_fail "Not running on Linux (detected: $OSTYPE)"
fi

# Check if running as non-root
if [[ $EUID -ne 0 ]]; then
    check_warn "Not running as root (may need sudo for some commands)"
else
    check_pass "Running as root"
fi

# Check CPU cores
CPUS=$(nproc)
if [[ $CPUS -ge 2 ]]; then
    check_pass "CPU cores sufficient: $CPUS cores"
else
    check_fail "Insufficient CPU cores: $CPUS (minimum: 2)"
fi

# Check available memory
MEM_AVAILABLE=$(free -m | awk 'NR==2 {print $7}')
if [[ $MEM_AVAILABLE -ge 2048 ]]; then
    check_pass "Memory available: ${MEM_AVAILABLE}MB"
else
    check_fail "Insufficient memory: ${MEM_AVAILABLE}MB (minimum: 2048MB)"
fi

# Check disk space
DISK_AVAILABLE=$(df /var/lib --output=avail -h | tail -1 | xargs)
DISK_PERCENT=$(df /var/lib --output=pcent | tail -1 | xargs)
if [[ ${DISK_PERCENT%\%} -lt 80 ]]; then
    check_pass "Disk space OK: $DISK_AVAILABLE free ($DISK_PERCENT used)"
else
    check_fail "Low disk space: $DISK_AVAILABLE free ($DISK_PERCENT used)"
fi

header "Docker & Containers"

# Docker installation
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    check_pass "Docker installed: $DOCKER_VERSION"
else
    check_fail "Docker not installed"
fi

# Docker Compose
if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version)
    check_pass "Docker Compose installed: $COMPOSE_VERSION"
else
    check_fail "Docker Compose not installed"
fi

# Docker daemon running
if docker ps > /dev/null 2>&1; then
    check_pass "Docker daemon is running"
    RUNNING_CONTAINERS=$(docker ps -q | wc -l)
    if [[ $RUNNING_CONTAINERS -gt 0 ]]; then
        check_warn "$RUNNING_CONTAINERS containers already running"
    fi
else
    check_fail "Docker daemon not running"
fi

# Available port 80
if ! netstat -tuln 2>/dev/null | grep ":80 " > /dev/null; then
    check_pass "Port 80 is available"
else
    check_fail "Port 80 is already in use"
fi

# Available port 443
if ! netstat -tuln 2>/dev/null | grep ":443 " > /dev/null; then
    check_pass "Port 443 is available"
else
    check_fail "Port 443 is already in use"
fi

# Available port 5432
if ! netstat -tuln 2>/dev/null | grep ":5432 " > /dev/null; then
    check_pass "Port 5432 is available"
else
    check_warn "Port 5432 is in use (might be another database)"
fi

header "Project Structure"

# Check project files
cd "$PROJECT_DIR"

if [[ -d "backend" ]]; then
    check_pass "Backend directory exists"
else
    check_fail "Backend directory not found"
fi

if [[ -d "frontend" ]]; then
    check_pass "Frontend directory exists"
else
    check_warn "Frontend directory not found"
fi

if [[ -f "backend/manage.py" ]]; then
    check_pass "Django manage.py found"
else
    check_fail "Django manage.py not found"
fi

if [[ -f "backend/docker-compose.prod.yml" ]]; then
    check_pass "Production docker-compose file found"
else
    check_fail "Production docker-compose.prod.yml not found"
fi

if [[ -f "backend/Dockerfile.prod" ]]; then
    check_pass "Production Dockerfile found"
else
    check_fail "Production Dockerfile.prod not found"
fi

if [[ -f "backend/.env" ]]; then
    check_warn ".env file exists (review before deployment)"
else
    check_info ".env file not found (will be created/prompted)"
fi

if [[ -f "backend/requirements.txt" ]]; then
    check_pass "requirements.txt found"
    REQ_COUNT=$(wc -l < backend/requirements.txt)
    check_info "Dependencies specified: $REQ_COUNT packages"
else
    check_fail "requirements.txt not found"
fi

header "Configuration Files"

# Check deploy scripts
for script in setup.sh redeploy.sh monitor.sh backup.sh env-setup.sh; do
    if [[ -f "backend/deploy/$script" ]]; then
        if [[ -x "backend/deploy/$script" ]]; then
            check_pass "Deploy script is executable: $script"
        else
            check_warn "Deploy script not executable (needs chmod +x): $script"
        fi
    else
        check_fail "Deploy script missing: $script"
    fi
done

# Check documentation
for doc in DEPLOYMENT_GUIDE.md QUICK_REFERENCE.md; do
    if [[ -f "backend/deploy/$doc" ]]; then
        check_pass "Documentation found: $doc"
    else
        check_warn "Documentation missing: $doc"
    fi
done

# Check nginx config
if [[ -f "backend/nginx/itnb-hub.conf" ]]; then
    check_pass "Nginx configuration found"
else
    check_fail "Nginx configuration not found"
fi

header "Git & Version Control"

# Git installed
if command -v git &> /dev/null; then
    check_pass "Git installed: $(git --version)"
else
    check_warn "Git not installed (needed for deployments)"
fi

# Git repository
if [[ -d ".git" ]]; then
    check_pass "Git repository initialized"
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    LAST_COMMIT=$(git log -1 --pretty=format:"%h - %s (%cr)")
    check_info "Current branch: $CURRENT_BRANCH"
    check_info "Last commit: $LAST_COMMIT"
else
    check_warn "Not a git repository"
fi

header "Python & Django"

# Python installation
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    check_pass "$PYTHON_VERSION installed"
else
    check_fail "Python 3 not installed"
fi

# Django check (if .env exists)
if [[ -f "backend/.env" ]]; then
    cd backend
    if python manage.py check --deploy 2>&1 | grep -q "System check identified"; then
        check_warn "Django check reported issues (review .env configuration)"
    else
        check_pass "Django deployment check passed"
    fi
    cd "$PROJECT_DIR"
else
    check_info "Skipping Django check (.env not yet configured)"
fi

header "Network & Connectivity"

# Internet connectivity
if ping -c 1 8.8.8.8 > /dev/null 2>&1; then
    check_pass "Internet connectivity OK"
else
    check_fail "No internet connectivity"
fi

# DNS resolution
if host github.com > /dev/null 2>&1; then
    check_pass "DNS resolution working"
else
    check_warn "DNS might not be resolving correctly"
fi

# Registry access
if curl -s --connect-timeout 5 https://registry.docker.com/v2/ > /dev/null 2>&1; then
    check_pass "Can reach Docker registry"
else
    check_warn "May not be able to reach Docker registry"
fi

header "SSL/HTTPS Configuration"

# SSL certificate path
SSL_CERT="/etc/letsencrypt/live/*/fullchain.pem"
if ls $SSL_CERT > /dev/null 2>&1; then
    CERT_COUNT=$(ls $SSL_CERT | wc -l)
    check_pass "SSL certificates found: $CERT_COUNT"
else
    check_warn "No SSL certificates found (Let's Encrypt setup may be needed)"
fi

# Certbot
if command -v certbot &> /dev/null; then
    check_pass "Certbot installed: $(certbot --version)"
else
    check_warn "Certbot not installed (needed for Let's Encrypt SSL)"
fi

header "Summary"

TOTAL=$((PASSED + FAILED + WARNING))
echo ""
echo -e "Total checks: $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
if [[ $WARNING -gt 0 ]]; then
    echo -e "${YELLOW}Warnings: $WARNING${NC}"
fi
if [[ $FAILED -gt 0 ]]; then
    echo -e "${RED}Failed: $FAILED${NC}"
fi

echo ""

if [[ $FAILED -eq 0 ]]; then
    if [[ $WARNING -eq 0 ]]; then
        echo -e "${GREEN}✓ All checks passed! Ready to deploy.${NC}"
        exit 0
    else
        echo -e "${YELLOW}⚠ Checks passed with warnings. Review above before deploying.${NC}"
        exit 0
    fi
else
    echo -e "${RED}✗ Some checks failed. Fix issues above before deploying.${NC}"
    exit 1
fi
