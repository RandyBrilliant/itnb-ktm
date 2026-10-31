#!/bin/bash

###############################################################################
# ITNB Hub – Database Backup & Management Script
#
# DESCRIPTION:
#   Backs up PostgreSQL database and media files to timestamped archives
#
# USAGE:
#   chmod +x deploy/backup.sh
#   ./deploy/backup.sh <backup|restore> [backup_file.sql]
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
BACKUP_DIR="$PROJECT_DIR/backups"
DB_CONTAINER="itnb-hub-db"
DB_NAME="${SQL_DATABASE:-itnb_hub}"
DB_USER="${SQL_USER:-postgres}"

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ===========================================================================
# Main script
# ===========================================================================

COMMAND="${1:-backup}"
BACKUP_FILE="${2:-}"

if [[ "$COMMAND" == "backup" ]]; then
    log_info "Starting database backup..."
    
    mkdir -p "$BACKUP_DIR"
    
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_NAME="itnb_hub_backup_${TIMESTAMP}.sql"
    BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"
    
    log_info "Dumping database to $BACKUP_PATH..."
    
    docker exec $DB_CONTAINER pg_dump -U $DB_USER $DB_NAME > "$BACKUP_PATH"
    
    if [[ -f "$BACKUP_PATH" ]]; then
        log_success "Database backed up to $BACKUP_PATH"
        log_info "Compressing backup..."
        gzip "$BACKUP_PATH"
        log_success "Backup compressed: ${BACKUP_PATH}.gz"
    else
        log_error "Failed to create backup"
    fi
    
    # Also backup media files
    log_info "Backing up media files..."
    MEDIA_BACKUP="$BACKUP_DIR/media_${TIMESTAMP}.tar.gz"
    docker exec itnb-hub-backend tar czf - /app/media > "$MEDIA_BACKUP"
    log_success "Media files backed up to $MEDIA_BACKUP"

elif [[ "$COMMAND" == "restore" ]]; then
    if [[ -z "$BACKUP_FILE" ]]; then
        log_error "Usage: $0 restore <backup_file.sql.gz>"
    fi
    
    if [[ ! -f "$BACKUP_FILE" ]]; then
        log_error "Backup file not found: $BACKUP_FILE"
    fi
    
    log_warning "This will OVERWRITE the current database!"
    read -p "Continue? (yes/no): " -r CONFIRM
    if [[ ! $CONFIRM =~ ^[Yy][Ee][Ss]$ ]]; then
        log_info "Restore cancelled"
        exit 0
    fi
    
    log_info "Restoring database..."
    
    # Decompress if needed
    if [[ "$BACKUP_FILE" == *.gz ]]; then
        log_info "Decompressing..."
        gunzip -c "$BACKUP_FILE" > /tmp/restore.sql
        RESTORE_FILE="/tmp/restore.sql"
    else
        RESTORE_FILE="$BACKUP_FILE"
    fi
    
    # Drop and recreate database
    log_info "Recreating database..."
    docker exec $DB_CONTAINER psql -U $DB_USER -c "DROP DATABASE IF EXISTS $DB_NAME;"
    docker exec $DB_CONTAINER psql -U $DB_USER -c "CREATE DATABASE $DB_NAME;"
    
    # Restore from backup
    log_info "Restoring data..."
    docker exec -i $DB_CONTAINER psql -U $DB_USER $DB_NAME < "$RESTORE_FILE"
    
    log_success "Database restored successfully"
    
    # Clean up temp file
    if [[ "$BACKUP_FILE" == *.gz ]]; then
        rm -f /tmp/restore.sql
    fi

elif [[ "$COMMAND" == "list" ]]; then
    log_info "Available backups:"
    ls -lh "$BACKUP_DIR" 2>/dev/null || log_warning "No backups found in $BACKUP_DIR"

else
    log_error "Unknown command: $COMMAND"
    echo "Usage:"
    echo "  $0 backup          - Create database and media backup"
    echo "  $0 restore <file>  - Restore database from backup"
    echo "  $0 list            - List available backups"
fi
