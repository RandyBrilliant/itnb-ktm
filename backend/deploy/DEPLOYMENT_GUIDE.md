# ITNB Hub – Deployment & Operations Guide

## Table of Contents

1. [Initial Server Setup](#initial-server-setup)
2. [Deployment Workflows](#deployment-workflows)
3. [Monitoring & Maintenance](#monitoring--maintenance)
4. [Troubleshooting](#troubleshooting)
5. [Architecture Overview](#architecture-overview)
6. [Security Checklist](#security-checklist)

---

## Initial Server Setup

### Prerequisites

- **OS**: Ubuntu 20.04+ or similar Linux
- **Resources**: 2+ CPU cores, 2+ GB RAM, 20+ GB disk (adjust for media storage)
- **Network**: Public IP with SSH access, ports 80/443 available, outbound internet

### Step 1: Prepare Server

```bash
# SSH into production server
ssh user@server-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Navigate to application directory
cd /var/www/itnb-hub  # or your desired path
```

### Step 2: Clone Repository

```bash
# Clone (with credentials)
git clone https://github.com/your-org/itnb-hub.git
cd itnb-hub

# Or if already cloned, pull latest
git pull origin main
```

### Step 3: Run Initial Setup

```bash
# Make setup script executable
chmod +x backend/deploy/setup.sh

# Run setup (installs Docker, creates .env file, verifies SSL)
./backend/deploy/setup.sh

# The script will:
# ✓ Install Docker & Docker Compose
# ✓ Create .env file with secure defaults
# ✓ Prompt for Django SECRET_KEY, database password, mail config
# ✓ Set up Let's Encrypt certificate path
# ✓ Create necessary directories with proper permissions
```

### Step 4: Verify Installation

```bash
# Check Docker installation
docker --version
docker-compose --version

# Confirm all scripts are executable
chmod +x backend/deploy/*.sh

# Test configuration
cd backend && python manage.py check
```

### Step 5: Start Services

```bash
# From project root
docker-compose -f backend/docker-compose.prod.yml up -d

# Wait for initialization (~30 seconds)
sleep 30

# Verify all containers are running
docker ps | grep itnb-hub

# Check logs for errors
docker-compose -f backend/docker-compose.prod.yml logs --tail=50
```

---

## Deployment Workflows

### Workflow 1: First-Time Deployment

Use this after cloning and completing Initial Server Setup.

```bash
cd /var/www/itnb-hub/backend

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Create superuser (for Django admin)
docker exec itnb-hub-backend python manage.py createsuperuser

# Create test data (optional)
docker exec itnb-hub-backend python manage.py shell < scripts/seed_data.py

# Access:
# - Django Admin: https://your-domain/admin
# - API: https://your-domain/api/
```

### Workflow 2: Code Updates (Safe Redeployment)

Use this when pulling new code from version control.

```bash
cd /var/www/itnb-hub/backend

# Make script executable
chmod +x deploy/redeploy.sh

# Run redeployment (auto pulls, rebuilds, migrates)
./deploy/redeploy.sh

# Script will:
# ✓ Stash local changes (backup)
# ✓ Pull latest code from main branch
# ✓ Stop existing services gracefully
# ✓ Rebuild Docker images
# ✓ Restart containers
# ✓ Run database migrations
# ✓ Collect static files
# ✓ Display health status
```

### Workflow 3: Backup & Restore

```bash
cd /var/www/itnb-hub/backend

# Make script executable
chmod +x deploy/backup.sh

# Create full backup (database + media files)
./deploy/backup.sh backup

# Output location: ./backups/backup_YYYYMMDD_HHMMSS.tar.gz

# List available backups
./deploy/backup.sh list

# Restore from backup
./deploy/backup.sh restore backups/backup_YYYYMMDD_HHMMSS.tar.gz
```

### Workflow 4: Emergency Rollback

```bash
cd /var/www/itnb-hub/backend

# If redeployment fails:

# 1. Stop current services
docker-compose -f docker-compose.prod.yml down

# 2. Revert code to previous version
git revert HEAD  # or git checkout <commit-hash>

# 3. Rebuild and start
docker-compose -f docker-compose.prod.yml up -d

# 4. Monitor logs during startup
docker-compose -f docker-compose.prod.yml logs -f backend
```

---

## Monitoring & Maintenance

### Daily Operations

```bash
cd /var/www/itnb-hub/backend

# Make script executable
chmod +x deploy/monitor.sh

# Check service status
./deploy/monitor.sh status

# Example output:
# NAME                    STATUS                      PORTS
# itnb-hub-backend        Up 2 days                   0.0.0.0:8000->8000/tcp
# itnb-hub-db             Up 2 days                   0.0.0.0:5432->5432/tcp
# itnb-hub-redis          Up 2 days                   0.0.0.0:6379->6379/tcp
# itnb-hub-celery         Up 2 days                   
# itnb-hub-nginx          Up 2 days                   0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
```

### View Logs

```bash
# Real-time backend logs
./deploy/monitor.sh logs backend

# Database logs
./deploy/monitor.sh logs db

# Celery worker logs
./deploy/monitor.sh logs celery

# Nginx logs (exit with Ctrl+C)
./deploy/monitor.sh logs nginx

# Or direct Docker access
docker logs -f itnb-hub-backend
```

### Health Checks

```bash
# Run comprehensive health check
./deploy/monitor.sh health

# Output:
# Backend: OK
# Database: OK
# Redis: OK
# API: OK
```

### Resource Monitoring

```bash
# CPU & memory usage
docker stats itnb-hub-backend itnb-hub-db itnb-hub-redis

# Database size
docker exec itnb-hub-db psql -U postgres -c "SELECT * FROM pg_database_size('itnb_hub');"

# Disk usage
df -h
du -sh /var/www/itnb-hub/backend/volumes
```

### Regular Maintenance Tasks

#### Weekly

```bash
# 1. Backup database
./deploy/backup.sh backup

# 2. Check disk space
df -h

# 3. Review error logs
./deploy/monitor.sh logs backend | grep ERROR
```

#### Monthly

```bash
# 1. Update dependencies
docker-compose -f docker-compose.prod.yml pull

# 2. Clean up unused images
./deploy/monitor.sh clean

# 3. Test backup restore
./deploy/backup.sh restore <latest-backup-file>

# 4. Review security logs
grep "permission denied\|invalid request" /var/log/nginx/error.log
```

#### Quarterly

```bash
# 1. Full system update
sudo apt update && sudo apt upgrade -y

# 2. Docker update
sudo apt install -y docker-ce docker-ce-cli

# 3. SSL certificate renewal (Let's Encrypt auto-renews at day 30)
sudo certbot renew --quiet

# 4. Database optimization
docker exec itnb-hub-db vacuumdb -U postgres itnb_hub
docker exec itnb-hub-db reindexdb -U postgres itnb_hub
```

---

## Troubleshooting

### 1. Services Won't Start

**Symptom**: `docker-compose up` fails

```bash
# Check for port conflicts
sudo netstat -tulpn | grep LISTEN

# Check .env file exists and is readable
cat backend/.env | head -10

# View detailed error logs
docker-compose -f backend/docker-compose.prod.yml logs
```

**Solution**:
- Ensure ports 80, 443, 5432 are not in use by other services
- Verify .env file has correct database credentials
- Check disk space: `df -h`

### 2. Database Connection Failed

**Symptom**: `FATAL: remaining connection slots are reserved`

```bash
# Check database connections
docker exec itnb-hub-db psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# Restart database service
./deploy/monitor.sh restart db
```

**Solution**:
- Increase `max_connections` in PostgreSQL config
- Ensure connection pooling is enabled in Django settings

### 3. Static Files Not Loading

**Symptom**: CSS/images show 404 in browser

```bash
# Collect static files
docker exec itnb-hub-backend python manage.py collectstatic --noinput

# Check if Nginx serving them correctly
docker exec itnb-hub-nginx ls -la /usr/share/nginx/html/static/
```

**Solution**:
- Run `collectstatic` manually
- Verify Nginx volume mounts in `docker-compose.prod.yml`
- Check file permissions: `sudo chmod -R 755 /path/to/static`

### 4. API Returns 500 Errors

**Symptom**: `/api/users/` returns Internal Server Error

```bash
# Check backend logs for stack trace
./deploy/monitor.sh logs backend | grep -A 10 "ERROR\|Traceback"

# Run Django check
docker exec itnb-hub-backend python manage.py check

# Test database connectivity
docker exec itnb-hub-backend python manage.py dbshell
```

**Solution**:
- Review full error traceback in logs
- Run database migrations if schema changed: `docker exec itnb-hub-backend python manage.py migrate`
- Verify environment variables match settings.py expectations

### 5. Celery Tasks Not Processing

**Symptom**: Async tasks queue up but don't execute

```bash
# Check if Celery worker is running
./deploy/monitor.sh status | grep celery

# View Celery logs
./deploy/monitor.sh logs celery

# Check Redis connectivity
docker exec itnb-hub-redis redis-cli ping
# Should return: PONG
```

**Solution**:
- Restart Celery: `./deploy/monitor.sh restart celery`
- Verify Redis is running and accessible
- Check for worker errors in logs (memory, permissions, etc.)

### 6. Out of Memory

**Symptom**: Service killed without error, Docker shows OOMKilled

```bash
# Monitor resource usage in real-time
docker stats

# Check memory limit in docker-compose.prod.yml
grep "memory:" backend/docker-compose.prod.yml

# Identify memory-heavy queries
docker exec itnb-hub-db psql -U postgres -c "SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"
```

**Solution**:
- Increase memory allocation in `docker-compose.prod.yml`
- Optimize database queries
- Reduce number of Celery workers

### 7. SSL Certificate Issues

**Symptom**: `SSL_ERROR_RX_RECORD_TOO_LONG` or browser shows certificate warning

```bash
# Check current certificate
sudo openssl x509 -in /etc/letsencrypt/live/your-domain/fullchain.pem -text -noout

# Test SSL configuration
echo | openssl s_client -servername your-domain -connect your-domain:443

# Check Nginx SSL configuration
docker exec itnb-hub-nginx cat /etc/nginx/conf.d/itnb-hub.conf | grep -A 5 "ssl_certificate"
```

**Solution**:
- Renew certificate: `sudo certbot renew`
- Verify Nginx is using correct certificate paths
- Restart Nginx: `./deploy/monitor.sh restart nginx`

---

## Architecture Overview

### Service Topology

```
┌─────────────────────────────────────────────────────────────┐
│                       Internet (80/443)                     │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/HTTPS
                           ▼
        ┌──────────────────────────────────────┐
        │      Nginx (Reverse Proxy)           │
        │  - SSL termination                   │
        │  - Static file serving               │
        │  - Load balancing                    │
        └──────────────┬───────────────────────┘
                       │
        ┌──────────────┼───────────────────────┐
        │              │                       │
        ▼              ▼                       ▼
    ┌────────┐    ┌────────┐            ┌──────────┐
    │Backend │    │Daphne  │            │ Celery   │
    │ Django │    │(ASGI)  │            │ Worker   │
    │  8000  │    │ 8001   │            │ (async)  │
    └────┬───┘    └────┬───┘            └────┬─────┘
         │             │                      │
         └─────────────┼──────────────────────┘
                       │
        ┌──────────────┼──────────────────┐
        │              │                  │
        ▼              ▼                  ▼
    ┌────────┐   ┌──────────┐      ┌──────────┐
    │   DB   │   │  Redis   │      │ Media    │
    │  PG15  │   │   7.0    │      │ Storage  │
    │  5432  │   │  6379    │      │ Volumes  │
    └────────┘   └──────────┘      └──────────┘
```

### Data Flow

1. **HTTP Request** → Nginx (reverse proxy) → Django Backend
2. **Async Tasks** → Celery Worker → Process → Redis
3. **Real-time Updates** → WebSocket (Channels) → Connected Clients
4. **File Operations** → Media Volume → Stored on Host
5. **Database** → Django ORM → PostgreSQL

### Container Specifications

| Service | Image | Purpose | Port | Memory |
|---------|-------|---------|------|--------|
| **backend** | custom:prod | Django REST API | 8000 | 512MB |
| **daphne** | custom:prod | ASGI server (WebSocket) | 8001 | 256MB |
| **celery** | custom:prod | Async tasks | N/A | 512MB |
| **nginx** | nginx:latest | Web server/proxy | 80,443 | 256MB |
| **db** | postgres:15 | Primary database | 5432 | 1GB |
| **redis** | redis:7 | Cache/broker | 6379 | 256MB |

---

## Security Checklist

### Pre-Deployment

- [ ] Generate strong `SECRET_KEY` in `.env`
- [ ] Set `DEBUG=False` in `.env`
- [ ] Configure `ALLOWED_HOSTS` in `.env`
- [ ] Enable HTTPS in Nginx config
- [ ] Set strong database password
- [ ] Create Django superuser with complex password
- [ ] Review and restrict CORS origins
- [ ] Set `SESSION_COOKIE_SECURE=True`
- [ ] Set `CSRF_COOKIE_SECURE=True`
- [ ] Enable `SECURE_HSTS_SECONDS` in settings.py

### Post-Deployment

- [ ] Disable SSH password auth (use keys only)
- [ ] Configure firewall (ufw):
  ```bash
  sudo ufw allow 22/tcp
  sudo ufw allow 80/tcp
  sudo ufw allow 443/tcp
  sudo ufw enable
  ```
- [ ] Set up log rotation for Docker and Nginx
- [ ] Configure monitoring/alerting (e.g., Sentry for errors)
- [ ] Enable automatic backups with offsite storage
- [ ] Set up SSH key authentication for deployments
- [ ] Review Django security settings: `python manage.py check --deploy`

### Ongoing

- [ ] Monthly: Review access logs for suspicious activity
- [ ] Monthly: Update dependencies (`docker-compose pull && redeploy.sh`)
- [ ] Quarterly: Security audit of code changes
- [ ] Quarterly: Penetration testing
- [ ] Quarterly: Database backup restoration test

### Emergency Contacts

```
On-call: [DevOps Team Phone]
Security Issues: security@your-domain.com
Incident Report: incidents@your-domain.com
```

---

## Additional Resources

### Documentation Links
- [Django Deployment Guide](https://docs.djangoproject.com/en/5.2/howto/deployment/)
- [Docker Production Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Nginx Configuration Guide](https://nginx.org/en/docs/)
- [PostgreSQL Administration](https://www.postgresql.org/docs/15/admin.html)
- [Celery Production Guide](https://docs.celeryproject.io/en/stable/userguide/deploying.html)

### Common Commands Reference

```bash
# Restart specific service
./deploy/monitor.sh restart backend

# View logs with filtering
./deploy/monitor.sh logs backend | grep -i error

# Execute Django shell
./deploy/monitor.sh exec backend python manage.py shell

# Create database backup
./deploy/backup.sh backup

# Health check
./deploy/monitor.sh health

# Clean unused Docker resources
./deploy/monitor.sh clean
```

### Support & Community

- GitHub Issues: [Link to repo issues]
- Discussion Forum: [Link to forum]
- Slack Channel: #itnb-hub-support

---

**Last Updated**: 2024
**Version**: 1.0
**Maintainer**: DevOps Team
