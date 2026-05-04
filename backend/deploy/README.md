# ITNB Hub – Deploy Scripts & Documentation

This directory contains all scripts and documentation needed for production deployment and operations.

## Quick Start

**On fresh production server:**
```bash
cd /var/www/itnb-hub/backend/deploy
chmod +x *.sh
./pre-deploy-check.sh          # Verify prerequisites
./env-setup.sh                 # Configure environment
../../../deploy/setup.sh       # Initialize server
```

**For daily operations:**
```bash
./monitor.sh status            # Check system status
./monitor.sh health            # Full health check
./monitor.sh logs backend      # View application logs
./backup.sh backup             # Create database backup
./redeploy.sh                  # Deploy new code
```

---

## Scripts & Tools

### 1. `setup.sh` – Initial Server Setup
**Purpose**: Prepare production server for first deployment

**What it does:**
- ✓ Installs Docker and Docker Compose
- ✓ Creates necessary directories (/backups, /volumes, etc.)
- ✓ Prompts for configuration values
- ✓ Generates SSL certificate paths
- ✓ Sets up .env file with secure defaults
- ✓ Verifies all components

**Usage:**
```bash
./setup.sh
```

**When to use**: 
- First time deployment to a new server
- Only run once per server

**Time required**: ~10-15 minutes

**Requires**: Internet connection, sudo/root access

---

### 2. `redeploy.sh` – Safe Redeployment
**Purpose**: Deploy code updates with zero downtime

**What it does:**
- ✓ Backs up current database
- ✓ Stashes local git changes
- ✓ Pulls latest code from repository
- ✓ Stops current services gracefully
- ✓ Rebuilds Docker images
- ✓ Starts new services
- ✓ Runs database migrations
- ✓ Collects static files
- ✓ Performs health checks

**Usage:**
```bash
./redeploy.sh
```

**When to use**: 
- Deploying code updates
- Updating dependencies in requirements.txt
- Regular code changes

**Time required**: ~2-3 minutes

**Safety features**: 
- Creates backup before deployment
- Keeps rollback capability for ~24 hours
- Validates migrations before applying

---

### 3. `backup.sh` – Database Backup & Restore
**Purpose**: Manage database backups

**Commands:**

```bash
# Create backup
./backup.sh backup
# Creates: backups/backup_YYYYMMDD_HHMMSS.tar.gz (~compressed database + media files)

# List available backups
./backup.sh list
# Shows all backups with size and timestamp

# Restore from backup (DESTRUCTIVE)
./backup.sh restore backups/backup_YYYYMMDD_HHMMSS.tar.gz
# Restores database and media files to backup state
```

**When to use**:
- Before major deployments
- Weekly routine backups
- Before database migrations
- Emergency recovery

**Backup includes:**
- PostgreSQL database dump (gzip compressed)
- Media files (user uploads)
- Static files

**Time required**: 
- Backup: 1-2 minutes
- Restore: 2-3 minutes
- Depends on database size

---

### 4. `monitor.sh` – Service Monitoring & Management
**Purpose**: Daily operations and troubleshooting

**Commands:**

```bash
# Show running services and status
./monitor.sh status

# View real-time logs
./monitor.sh logs backend      # Django application
./monitor.sh logs db           # Database
./monitor.sh logs celery       # Background tasks
./monitor.sh logs nginx        # Web server
# (Exit logs with Ctrl+C)

# Run health checks
./monitor.sh health
# Tests: backend, database, Redis, API accessibility

# Restart services
./monitor.sh restart all       # Stop and restart everything
./monitor.sh restart backend   # Restart just backend

# Clean up Docker
./monitor.sh clean
# Removes stopped containers and unused images

# Execute commands in containers
./monitor.sh exec backend python manage.py shell
./monitor.sh exec db psql -U postgres
```

**When to use**: Daily operations, troubleshooting, monitoring

---

### 5. `env-setup.sh` – Environment Variables Wizard
**Purpose**: Interactive configuration of environment variables

**What it does:**
- ✓ Prompts for all configuration values
- ✓ Validates inputs (domain format, email format, etc.)
- ✓ Generates secure SECRET_KEY
- ✓ Creates .env file with proper permissions (600)
- ✓ Provides configuration summary

**Usage:**
```bash
./env-setup.sh
```

**Interactive prompts:**
- Environment type (development/production)
- DEBUG mode
- Domain name(s)
- CORS origins
- Database configuration
- Email server settings
- Redis configuration
- SSL certificate paths

**When to use**: 
- Initial setup
- Updating configuration
- Creating test environments

**Time required**: ~5 minutes

---

### 6. `pre-deploy-check.sh` – Deployment Verification
**Purpose**: Validate server is ready for deployment

**What it checks:**
- ✓ OS type and compatibility
- ✓ CPU cores (minimum 2)
- ✓ Available memory (minimum 2GB)
- ✓ Disk space availability
- ✓ Docker installation and daemon
- ✓ Port availability (80, 443, 5432)
- ✓ Project files and structure
- ✓ Git repository status
- ✓ Python and Django setup
- ✓ Network connectivity
- ✓ SSL certificate availability

**Usage:**
```bash
./pre-deploy-check.sh
```

**Output:** Color-coded results:
- ✓ GREEN: Check passed
- ✗ RED: Check failed (must fix before deployment)
- ⚠ YELLOW: Warning (review before deployment)
- ℹ BLUE: Information

**When to use**: Before any deployment

**Time required**: ~30 seconds

---

## Documentation

### 1. `DEPLOYMENT_GUIDE.md` – Comprehensive Deployment Manual
**Length**: ~600 lines

**Sections:**
- Initial server setup (step-by-step)
- Deployment workflows (first-time, updates, rollback)
- Monitoring and maintenance (daily, weekly, monthly, quarterly)
- Troubleshooting (7 common issues with solutions)
- Architecture overview (topology, data flow, containers)
- Security checklist (pre-deployment, post-deployment, ongoing)

**When to reference**: 
- Deployment process
- Troubleshooting issues
- Planning maintenance windows
- Security hardening

---

### 2. `QUICK_REFERENCE.md` – Operations Cheat Sheet
**Length**: ~300 lines

**Sections:**
- Emergency contact tree
- Critical commands at a glance
- Incident response flowchart
- Performance baselines and thresholds
- Maintenance schedule (daily/weekly/monthly)
- Common issues & quick fixes
- Useful one-liners
- After-hours handoff template

**When to reference**: 
- Daily operations
- Quick troubleshooting
- Incident response
- Team handoffs

**Ideal format**: Print and post in operations center

---

### 3. `DEPLOYMENT_CHECKLIST.md` – Deployment Verification Form
**Length**: ~400 lines

**Sections:**
- Pre-deployment checklist (system, access, network, SSL)
- Deployment execution (10 steps with verification)
- Post-deployment verification (immediate, short-term, before going live)
- First backup creation
- Monitoring setup
- Security checklist
- Sign-off and handover section
- Notes and follow-up

**When to use**: 
- During deployment (print before starting)
- Post-deployment verification
- Team handoff
- Audit trails

**Format**: Printable checklist with check boxes and signature lines

---

### 4. `README.md` (this file) – Deploy Directory Guide
**Purpose**: Navigation guide for all deploy scripts and documentation

---

## File Organization

```
backend/deploy/
├── setup.sh                        → 🔴 RUN FIRST: Initial server setup
├── env-setup.sh                    → Configuration wizard
├── pre-deploy-check.sh             → ✓ Run before any deployment
├── redeploy.sh                     → Deploy code updates
├── monitor.sh                      → Daily operations
├── backup.sh                       → Database backup/restore
├── DEPLOYMENT_GUIDE.md             → 📖 Full reference manual
├── QUICK_REFERENCE.md              → 📋 Cheat sheet (print this)
├── DEPLOYMENT_CHECKLIST.md         → ✅ Deployment form (print/fill)
└── README.md                       → This file
```

---

## Workflow Examples

### Scenario 1: Brand New Production Server

```bash
# 1. SSH into server
ssh user@server-ip

# 2. Clone repository
cd /var/www
git clone https://github.com/your-org/itnb-hub.git
cd itnb-hub/backend/deploy

# 3. Make scripts executable
chmod +x *.sh

# 4. Check prerequisites
./pre-deploy-check.sh
# Fix any RED items before proceeding

# 5. Configure environment
./env-setup.sh
# Follow interactive prompts

# 6. Initialize server
./setup.sh
# Installs Docker, prepares system

# 7. Start services (returns to parent dir)
cd ..
docker-compose -f docker-compose.prod.yml up -d
sleep 30

# 8. Verify deployment
./deploy/monitor.sh health

# 9. Create superuser
docker exec -it itnb-hub-backend python manage.py createsuperuser

# 10. Create first backup
./deploy/backup.sh backup

# Total time: ~15-20 minutes
```

### Scenario 2: Deploying Code Updates

```bash
# 1. Verify server is ready
./deploy/monitor.sh status

# 2. Check prerequisites
./deploy/pre-deploy-check.sh

# 3. Deploy new code
./deploy/redeploy.sh
# Automatically:
# - Pulls latest code
# - Rebuilds images
# - Runs migrations
# - Restarts services

# 4. Verify deployment
./deploy/monitor.sh health

# Total time: ~2-3 minutes
```

### Scenario 3: Emergency Backup & Restore

```bash
# 1. Create backup NOW
./deploy/backup.sh backup

# 2. Investigate issue
./deploy/monitor.sh logs backend

# 3. If critical issue, restore backup
./deploy/backup.sh restore backups/backup_YYYYMMDD_HHMMSS.tar.gz
# WARNING: This will overwrite current database!

# 4. Verify restoration
./deploy/monitor.sh health
```

### Scenario 4: Daily Health Check (Run at shift start)

```bash
./deploy/monitor.sh status     # All services running?
./deploy/monitor.sh health     # Comprehensive health check
docker stats                   # Resource usage

# If all green: System is healthy
# If any warnings: Investigate with monitor.sh logs
```

---

## Common Operations

### View Application Errors
```bash
./deploy/monitor.sh logs backend | grep -i error
```

### Check Database Status
```bash
./deploy/monitor.sh logs db
```

### Monitor Resources
```bash
docker stats itnb-hub-backend itnb-hub-db itnb-hub-redis
```

### Restart Everything
```bash
./deploy/monitor.sh restart all
```

### Create Backup
```bash
./deploy/backup.sh backup
```

### List Backups
```bash
./deploy/backup.sh list
```

### Execute Django Command
```bash
./deploy/monitor.sh exec backend python manage.py <command>
```

---

## Important Notes

### Security
- ✓ All scripts use `set -euo pipefail` for safety
- ✓ Sensitive data in .env file is never committed to git
- ✓ Backup files contain sensitive data - store securely
- ✓ Scripts require appropriate file permissions

### Permissions
Make scripts executable after clone:
```bash
chmod +x backend/deploy/*.sh
```

### Error Handling
All scripts have error handling. If something fails:
1. Read the error message carefully
2. Check `QUICK_REFERENCE.md` for troubleshooting
3. Review full logs with `./deploy/monitor.sh logs`
4. Consult `DEPLOYMENT_GUIDE.md` troubleshooting section

### Backups
- Create before every deployment
- Store off-site for critical systems
- Test restore procedures regularly
- Minimum retention: 30 days

### SSH Keys
All scripts should use SSH keys, not passwords:
```bash
# Add SSH key to server
ssh-copy-id -i ~/.ssh/id_rsa.pub user@server-ip

# Test key-based access
ssh -i ~/.ssh/id_rsa user@server-ip
```

---

## Support & References

- **Django Docs**: https://docs.djangoproject.com/
- **Docker Docs**: https://docs.docker.com/
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **DRF Docs**: https://www.django-rest-framework.org/
- **Celery Docs**: https://docs.celeryproject.io/

---

## Version Info

- **Created**: 2024
- **Last Updated**: 2024
- **Python**: 3.9+
- **Django**: 5.2+
- **Docker**: 20.10+
- **Docker Compose**: 1.29+

---

## Change Log

### v1.0 (Initial Release)
- ✓ setup.sh - Initial server setup
- ✓ redeploy.sh - Code deployment
- ✓ backup.sh - Database backup/restore
- ✓ monitor.sh - Service monitoring
- ✓ env-setup.sh - Environment configuration
- ✓ pre-deploy-check.sh - Deployment validation
- ✓ DEPLOYMENT_GUIDE.md - Full reference
- ✓ QUICK_REFERENCE.md - Operations cheat sheet
- ✓ DEPLOYMENT_CHECKLIST.md - Deployment form
- ✓ README.md - This guide

---

**Questions?** See QUICK_REFERENCE.md or DEPLOYMENT_GUIDE.md
