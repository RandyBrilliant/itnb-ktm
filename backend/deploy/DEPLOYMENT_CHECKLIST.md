# ITNB Hub – Startup & Deployment Checklist

Print this checklist and have it available in the server room or operations center.

---

## PRE-DEPLOYMENT CHECKLIST

**Date**: ________________  
**Operator**: ________________  
**Reviewed By**: ________________  

### System Preparation
- [ ] Server has minimum 2 CPU cores
- [ ] Server has minimum 2GB available memory
- [ ] Disk space available: ≥ 20GB
- [ ] Ubuntu 20.04+ (or compatible Linux)
- [ ] Outbound internet connectivity confirmed
- [ ] SSH access tested and working

### Access & Credentials
- [ ] SSH key configured for server access
- [ ] Git repository access verified
- [ ] Docker Hub account available (if using private registry)
- [ ] Email credentials for mail server ready
- [ ] Database password generated and stored securely
- [ ] Django SECRET_KEY ready (or generate with: `openssl rand -base64 50`)

### Network Configuration
- [ ] Domain name purchased and DNS configured
- [ ] Domain name points to server IP
- [ ] Port 80 is available and not blocked by firewall
- [ ] Port 443 is available and not blocked by firewall
- [ ] Port 5432 (DB) not exposed externally
- [ ] Firewall rules reviewed and configured

### SSL Certificate
- [ ] Let's Encrypt account created (if using free SSL)
- [ ] OR commercial SSL certificate obtained
- [ ] Certificate valid for domain
- [ ] Certificate valid for minimum 90 days
- [ ] Certificate path documented: `/etc/letsencrypt/live/domain/`

---

## DEPLOYMENT EXECUTION

### Step 1: Verify Prerequisites
```bash
# Run automated checks
./backend/deploy/pre-deploy-check.sh

# All checks should pass (no RED ✗ marks)
```
- [ ] Pre-deployment check script ran successfully
- [ ] No FAILED items reported
- [ ] Warnings reviewed and documented

### Step 2: Clone Repository
```bash
# SSH into production server
ssh user@server-ip

# Navigate to deployment directory
cd /var/www  # or preferred path

# Clone repository
git clone https://github.com/your-org/itnb-hub.git
cd itnb-hub
```
- [ ] Repository cloned successfully
- [ ] In correct directory
- [ ] Git branch is `main` (or confirmed branch)

### Step 3: Configure Environment
```bash
# Make setup script executable
chmod +x backend/deploy/*.sh

# Generate .env file (interactive wizard)
./backend/deploy/env-setup.sh

# Or manually create .env (see .env.example)
# - Configure database credentials
# - Configure email settings
# - Set ALLOWED_HOSTS to your domain
# - Generate SECRET_KEY
```
- [ ] .env file created
- [ ] All required variables configured
- [ ] Credentials stored securely (not in git)
- [ ] SECRET_KEY is unique and secure
- [ ] DEBUG=False for production

### Step 4: Initial Setup
```bash
# Run setup script (installs Docker, prepares system)
chmod +x backend/deploy/setup.sh
./backend/deploy/setup.sh
```
- [ ] Script completed without errors
- [ ] Docker installed
- [ ] Docker daemon running
- [ ] Directory structure created
- [ ] SSL certificate path set
- [ ] Initial backup directory created

### Step 5: Start Services
```bash
# Navigate to backend
cd backend

# Start Docker services
docker-compose -f docker-compose.prod.yml up -d

# Wait for startup (~30 seconds)
sleep 30

# Verify services started
docker ps | grep itnb-hub
```
- [ ] All containers started successfully
- [ ] No "Error" or "Exited" states
- [ ] Backend container running
- [ ] Database container running
- [ ] Redis container running
- [ ] Nginx container running

### Step 6: Verify Database
```bash
# Run migrations (auto on startup, but verify)
docker exec itnb-hub-backend python manage.py migrate --check

# If prompted to run migrations:
docker exec itnb-hub-backend python manage.py migrate

# Create superuser account
docker exec -it itnb-hub-backend python manage.py createsuperuser
# Username: (enter)
# Email: (enter valid email)
# Password: (enter strong password)
```
- [ ] Database migrations completed
- [ ] Superuser account created
- [ ] Superuser credentials stored securely

### Step 7: Test API
```bash
# Health check
./deploy/monitor.sh health

# Or manually test
curl -I http://localhost:8000/api/

# Should return: 200 OK (with CORS headers if dev mode)
```
- [ ] API is responding
- [ ] Backend health check passes
- [ ] Database connectivity verified
- [ ] Redis connectivity verified

### Step 8: Configure SSL (Let's Encrypt)
```bash
# If not already done by setup.sh:
sudo certbot certonly --standalone -d your-domain.com

# Verify certificate exists
ls -la /etc/letsencrypt/live/your-domain.com/
```
- [ ] SSL certificate obtained
- [ ] Certificate path correct in .env
- [ ] Certificate valid until date noted: ________________
- [ ] Auto-renewal configured

### Step 9: Start HTTPS Access
```bash
# Restart Nginx with SSL config
./deploy/monitor.sh restart nginx

# Test HTTPS
curl -I https://your-domain.com/

# Should return: 200 OK
```
- [ ] HTTPS working
- [ ] Certificate valid in browser
- [ ] No certificate warnings
- [ ] Automatic redirect from HTTP to HTTPS working

### Step 10: Create Initial Data (Optional)
```bash
# Create test user
docker exec -it itnb-hub-backend python manage.py create_test_data

# Or manually in Django admin:
# 1. Go to https://your-domain/admin
# 2. Login with superuser credentials
# 3. Create test users for each role
```
- [ ] Test data created (if applicable)
- [ ] At least one user per role (Student, Lecturer, Staff, Alumni)
- [ ] Test data documented

---

## POST-DEPLOYMENT VERIFICATION

### Immediate (First 5 Minutes)
```bash
# Monitor logs for errors
./deploy/monitor.sh logs backend
```
- [ ] No ERROR or CRITICAL messages
- [ ] No database connection errors
- [ ] No permission denied errors

### Short-term (First Hour)
```bash
# Check resource usage
docker stats

# Monitor response times
curl -w "Response time: %{time_total}s\n" https://your-domain/api/
```
- [ ] CPU usage stable (<60%)
- [ ] Memory usage stable (<400MB backend)
- [ ] Response times acceptable (<500ms)
- [ ] No unexpected errors in logs

### Before Going Live
- [ ] User acceptance testing completed
- [ ] Admin panel accessible and working
- [ ] API endpoints responding correctly
- [ ] Email sending tested
- [ ] File upload tested (if applicable)
- [ ] Backup script tested successfully
- [ ] All team members trained on scripts
- [ ] Incident response procedure reviewed

---

## FIRST BACKUP CREATION

**Critical: Create first backup immediately after deployment**

```bash
# Create backup
./deploy/backup.sh backup

# Verify backup created
./deploy/backup.sh list

# Test restore (optional, on test environment)
# ./deploy/backup.sh restore backup_YYYYMMDD_HHMMSS.tar.gz
```
- [ ] First backup created successfully
- [ ] Backup file size reasonable (>1MB)
- [ ] Backup stored with full path documented
- [ ] Remote backup initiated (if configured)

**Backup location**: ___________________________________

**Backup size**: ___________________________________

---

## MONITORING SETUP

### Service Monitoring
- [ ] Monitoring agent installed (Datadog/New Relic/CloudWatch)
- [ ] Alerts configured for:
  - [ ] Backend service down
  - [ ] Database connection failed
  - [ ] Disk space >90%
  - [ ] Memory usage >80%
  - [ ] API response time >1000ms
  - [ ] Celery queue depth >500

### Log Aggregation
- [ ] Logs being sent to centralized system (ELK/Splunk/CloudWatch)
- [ ] Log retention policy set (minimum 30 days)
- [ ] Error alerts configured

### Health Checks
- [ ] Uptime monitoring service configured
- [ ] Health endpoint configured: `/api/health/`
- [ ] Check frequency: every 5 minutes

---

## SECURITY CHECKLIST

### At Deployment Time
- [ ] DEBUG mode is False
- [ ] SECRET_KEY is cryptographically secure
- [ ] Database password is strong (>16 chars, mixed case)
- [ ] SSH keys configured (no password authentication)
- [ ] Firewall rules restrict unnecessary ports
- [ ] HTTPS/SSL enforced for all traffic

### After Deployment
- [ ] Django security check passed: `python manage.py check --deploy`
- [ ] ALLOWED_HOSTS properly configured
- [ ] CORS origins restricted to known domains
- [ ] Default admin username changed
- [ ] Admin panel moved from `/admin/` (optional: URL obfuscation)
- [ ] X-Frame-Options header set to prevent clickjacking
- [ ] CSRF protection enabled

---

## HANDOFF TO OPERATIONS

**Deployment Completed By**: ________________  
**Date & Time**: ________________  
**Handed Over To**: ________________  

### Operational Knowledge Transfer
- [ ] Ops team trained on all deploy scripts
- [ ] Quick reference guide reviewed (`QUICK_REFERENCE.md`)
- [ ] Emergency contacts updated and posted
- [ ] On-call schedule configured
- [ ] Escalation procedures documented
- [ ] Backup & restore procedures tested with ops team
- [ ] Log access configured for ops team
- [ ] Alert notification methods tested

### Documentation Handed Over
- [ ] Full `DEPLOYMENT_GUIDE.md`
- [ ] `QUICK_REFERENCE.md` for daily operations
- [ ] This checklist (signed & dated)
- [ ] Architecture diagrams
- [ ] Credential management document (secure location)
- [ ] Runbooks for common incidents

### Access Credentials (Secure Handoff)
Credentials should be transferred through secure means (not this document):
- [ ] SSH key pair
- [ ] Database admin password
- [ ] Superuser credentials
- [ ] Email account credentials
- [ ] SSL certificate details
- [ ] Remote backup system credentials

---

## SIGN-OFF

**Deployment Status**: [ ] COMPLETE  [ ] INCOMPLETE

**Issues or Deviations**:
```
__________________________________________________________
__________________________________________________________
__________________________________________________________
```

**Deployment Completed By**:
- Name: ____________________
- Signature: ____________________ 
- Date: ____________________

**Approved By**:
- Name: ____________________
- Signature: ____________________
- Date: ____________________

**Handed To Operations**:
- Name: ____________________
- Signature: ____________________
- Date: ____________________

---

## NOTES & FOLLOW-UP

### Known Issues:
- [ ] None
- [ ] Issue 1: ____________________
  - [ ] Workaround: ____________________
  
### Pending Tasks:
- [ ] Task 1: ____________________
  - [ ] Assigned to: ____________________
  - [ ] Due date: ____________________

### Next Scheduled Maintenance:
- [ ] Date: ____________________
- [ ] Type: ____________________
- [ ] Est. downtime: ____________________

---

**Keep this checklist for future reference and audits.**

**Location to store**: `/home/ops/checklists/itnb-hub-deployment-$(date +%Y%m%d).txt`
