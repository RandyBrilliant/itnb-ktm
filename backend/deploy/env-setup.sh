#!/bin/bash

###############################################################################
# ITNB Hub – Environment Setup Script (Interactive)
#
# DESCRIPTION:
#   Interactive wizard to generate secure .env file for production
#   Validates inputs and creates template for manual review
#
# USAGE:
#   chmod +x deploy/env-setup.sh
#   ./deploy/env-setup.sh
#
###############################################################################

set -euo pipefail

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$PROJECT_DIR/.env"

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ===========================================================================
# Helper Functions
# ===========================================================================

generate_secret_key() {
    python3 -c "import secrets; print(secrets.token_urlsafe(50))"
}

validate_domain() {
    local domain=$1
    if [[ $domain =~ ^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$ ]]; then
        return 0
    else
        return 1
    fi
}

validate_email() {
    local email=$1
    if [[ $email =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
        return 0
    else
        return 1
    fi
}

# ===========================================================================
# Main Wizard
# ===========================================================================

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║          ITNB Hub – Environment Setup Wizard                   ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if .env already exists
if [[ -f "$ENV_FILE" ]]; then
    log_warning ".env file already exists at: $ENV_FILE"
    read -p "Overwrite? (yes/no): " -r CONFIRM
    if [[ ! $CONFIRM =~ ^[Yy][Ee][Ss]$ ]]; then
        log_info "Setup cancelled"
        exit 0
    fi
fi

echo -e "\n${YELLOW}=== Django Configuration ===${NC}\n"

# Environment type
read -p "Environment (development/production) [production]: " ENV_TYPE
ENV_TYPE=${ENV_TYPE:-production}

# Debug mode
read -p "DEBUG mode (True/False) [False]: " DEBUG_MODE
DEBUG_MODE=${DEBUG_MODE:-False}

# Secret key
log_info "Generating secure SECRET_KEY..."
SECRET_KEY=$(generate_secret_key)
log_success "Generated: ${SECRET_KEY:0:20}..."

# Domain/Allowed hosts
while true; do
    read -p "Domain name(s) (comma-separated): " DOMAINS
    if [[ ! -z "$DOMAINS" ]]; then
        for domain in $(echo $DOMAINS | tr ',' ' '); do
            domain=$(echo $domain | xargs)  # trim whitespace
            if ! validate_domain "$domain"; then
                log_error "Invalid domain: $domain"
                continue 2
            fi
        done
        break
    fi
done

# CORS origins
read -p "CORS origins (comma-separated, or leave empty for same-domain): " CORS_ORIGINS
CORS_ORIGINS=${CORS_ORIGINS:-"https://${DOMAINS%%,*}"}

echo -e "\n${YELLOW}=== Database Configuration ===${NC}\n"

# Database
read -p "Database engine (postgresql/sqlite3) [postgresql]: " DB_ENGINE
DB_ENGINE=${DB_ENGINE:-postgresql}

if [[ "$DB_ENGINE" == "postgresql" ]]; then
    read -p "Database host [localhost]: " DB_HOST
    DB_HOST=${DB_HOST:-localhost}
    
    read -p "Database port [5432]: " DB_PORT
    DB_PORT=${DB_PORT:-5432}
    
    read -p "Database name [itnb_hub]: " DB_NAME
    DB_NAME=${DB_NAME:-itnb_hub}
    
    read -p "Database user [postgres]: " DB_USER
    DB_USER=${DB_USER:-postgres}
    
    read -sp "Database password: " DB_PASSWORD
    echo ""
    
    if [[ -z "$DB_PASSWORD" ]]; then
        log_error "Database password cannot be empty"
        exit 1
    fi
else
    DB_HOST=""
    DB_PORT=""
    DB_NAME="db.sqlite3"
    DB_USER=""
    DB_PASSWORD=""
fi

echo -e "\n${YELLOW}=== Email Configuration ===${NC}\n"

read -p "Email backend (console/smtp) [smtp]: " EMAIL_BACKEND
EMAIL_BACKEND=${EMAIL_BACKEND:-smtp}

if [[ "$EMAIL_BACKEND" == "smtp" ]]; then
    read -p "Email host (e.g., smtp.gmail.com): " EMAIL_HOST
    read -p "Email port [587]: " EMAIL_PORT
    EMAIL_PORT=${EMAIL_PORT:-587}
    
    read -p "Email use TLS (True/False) [True]: " EMAIL_USE_TLS
    EMAIL_USE_TLS=${EMAIL_USE_TLS:-True}
    
    while true; do
        read -p "Email user/from address: " EMAIL_USER
        if validate_email "$EMAIL_USER"; then
            break
        else
            log_error "Invalid email address"
        fi
    done
    
    read -sp "Email password: " EMAIL_PASSWORD
    echo ""
else
    EMAIL_HOST=""
    EMAIL_PORT=""
    EMAIL_USE_TLS=""
    EMAIL_USER=""
    EMAIL_PASSWORD=""
fi

echo -e "\n${YELLOW}=== Security Configuration ===${NC}\n"

# Redis
read -p "Redis host [localhost]: " REDIS_HOST
REDIS_HOST=${REDIS_HOST:-localhost}

read -p "Redis port [6379]: " REDIS_PORT
REDIS_PORT=${REDIS_PORT:-6379}

# SSL
read -p "Use HTTPS (True/False) [True]: " USE_HTTPS
USE_HTTPS=${USE_HTTPS:-True}

if [[ "$USE_HTTPS" == "True" ]]; then
    read -p "SSL certificate path [/etc/letsencrypt/live/\${domain}/fullchain.pem]: " SSL_CERT
    SSL_CERT=${SSL_CERT:-/etc/letsencrypt/live/${DOMAINS%%,*}/fullchain.pem}
    
    read -p "SSL key path [/etc/letsencrypt/live/\${domain}/privkey.pem]: " SSL_KEY
    SSL_KEY=${SSL_KEY:-/etc/letsencrypt/live/${DOMAINS%%,*}/privkey.pem}
else
    SSL_CERT=""
    SSL_KEY=""
fi

echo -e "\n${YELLOW}=== Generate .env File ===${NC}\n"

# Create .env content
cat > "$ENV_FILE" << EOF
# Django Configuration
ENVIRONMENT=$ENV_TYPE
DEBUG=$DEBUG_MODE
SECRET_KEY=$SECRET_KEY
ALLOWED_HOSTS=$DOMAINS
CORS_ALLOWED_ORIGINS=$CORS_ORIGINS

# Database
DATABASE_ENGINE=$DB_ENGINE
DATABASE_HOST=$DB_HOST
DATABASE_PORT=$DB_PORT
DATABASE_NAME=$DB_NAME
DATABASE_USER=$DB_USER
DATABASE_PASSWORD=$DB_PASSWORD

# Email Configuration
EMAIL_BACKEND=$EMAIL_BACKEND
EMAIL_HOST=$EMAIL_HOST
EMAIL_PORT=$EMAIL_PORT
EMAIL_USE_TLS=$EMAIL_USE_TLS
EMAIL_HOST_USER=$EMAIL_USER
EMAIL_HOST_PASSWORD=$EMAIL_PASSWORD

# Redis
REDIS_HOST=$REDIS_HOST
REDIS_PORT=$REDIS_PORT

# Security
USE_HTTPS=$USE_HTTPS
SSL_CERTIFICATE_PATH=$SSL_CERT
SSL_KEY_PATH=$SSL_KEY
EOF

# Set restricted permissions
chmod 600 "$ENV_FILE"

log_success ".env file created successfully"
echo -e "\n${BLUE}Location: $ENV_FILE${NC}"
echo -e "${YELLOW}Permissions: 600 (read-only for owner)${NC}\n"

# Show summary
echo -e "${BLUE}=== Configuration Summary ===${NC}"
echo "Environment: $ENV_TYPE"
echo "Debug: $DEBUG_MODE"
echo "Domain(s): $DOMAINS"
echo "Database: $DB_ENGINE"
if [[ "$DB_ENGINE" == "postgresql" ]]; then
    echo "  Host: $DB_HOST:$DB_PORT"
    echo "  Name: $DB_NAME"
    echo "  User: $DB_USER"
fi
echo "HTTPS: $USE_HTTPS"
echo ""

log_info "Next steps:"
echo "  1. Review .env file: cat $ENV_FILE"
echo "  2. Update .env with any additional settings"
echo "  3. Start services: docker-compose -f docker-compose.prod.yml up -d"
echo "  4. Monitor logs: ./deploy/monitor.sh logs backend"
echo ""

log_success "Setup complete!"
