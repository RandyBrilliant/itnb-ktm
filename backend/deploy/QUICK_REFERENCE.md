# ITNB Hub – Operations Quick Reference

## Emergency Contact Tree
```
System Down:        DevOps Lead (ext. 1001) → Senior Admin (ext. 1002)
Database Issues:    DBA Team (email: dba@itnb.local)
Security Incident:  Security Officer → DevOps Lead
Email/Comms:        Communications Team
```

---

## Critical Commands at a Glance

### Health & Status
```bash
./deploy/monitor.sh status          # All services running?
./deploy/monitor.sh health          # Comprehensive health check
docker-compose ps                   # Raw container status
```

### Logs & Diagnostics
```bash
./deploy/monitor.sh logs backend    # Application errors
./deploy/monitor.sh logs db         # Database errors
./deploy/monitor.sh logs celery     # Task processing errors
docker-compose logs --tail=100      # Last 100 lines from all services
```

### Restart
```bash
./deploy/monitor.sh restart backend # Restart just the app
./deploy/monitor.sh restart all     # Restart everything
```

### Database
```bash
# Backup NOW
./deploy/backup.sh backup

# Restore (DESTRUCTIVE - use with caution)
./deploy/backup.sh restore backup_YYYYMMDD_HHMMSS.tar.gz

# List available backups
./deploy/backup.sh list
```

### Deployment
```bash
./deploy/redeploy.sh                # Pull latest code, rebuild, restart
```

---

## Incident Response Flowchart

```
Is the system down?
├─ YES → Run: ./deploy/monitor.sh status
│        └─ All containers running?
│           ├─ YES → Check: ./deploy/monitor.sh health
│           │        └─ What failed?
│           │           ├─ Backend → ./deploy/monitor.sh logs backend
│           │           ├─ DB → ./deploy/monitor.sh logs db
│           │           └─ Redis → ./deploy/monitor.sh restart redis
│           └─ NO → Run: docker-compose up -d
│
└─ NO → Check response time
         └─ Slow response? → Check resource: docker stats
                            └─ Update memory limit in docker-compose.yml
```

---

## Performance Baselines

| Metric | Normal | Warning | Critical |
|--------|--------|---------|----------|
| API Response | <200ms | 200-500ms | >500ms |
| DB CPU | <30% | 30-60% | >60% |
| Backend Memory | <300MB | 300-450MB | >450MB |
| Disk Usage | <50% | 50-80% | >80% |
| Celery Queue | <100 | 100-500 | >500 |

---

## Maintenance Schedule

| Frequency | Task | Command |
|-----------|------|---------|
| Daily | Check status | `./deploy/monitor.sh status` |
| Daily | Review errors | `./deploy/monitor.sh logs backend \| grep ERROR` |
| Weekly | Backup | `./deploy/backup.sh backup` |
| Weekly | Docker cleanup | `./deploy/monitor.sh clean` |
| Monthly | Update images | `docker-compose pull && ./deploy/redeploy.sh` |
| Monthly | DB maintenance | `docker exec itnb-hub-db vacuumdb -U postgres itnb_hub` |
| Quarterly | SSL renewal | `sudo certbot renew` |
| Quarterly | Security scan | `docker run --rm aquasec/trivy image itnb-hub-backend:latest` |

---

## Common Issues & Fixes

### Issue: "Port 80 already in use"
```bash
# Find what's using port 80
sudo lsof -i :80

# Stop conflicting service or change nginx port in docker-compose.prod.yml
```

### Issue: "Database connection refused"
```bash
# Verify PostgreSQL is running
./deploy/monitor.sh status

# Check credentials in .env
grep DATABASE_PASSWORD .env

# Restart database
./deploy/monitor.sh restart db
```

### Issue: "Static files returning 404"
```bash
# Collect static files
docker exec itnb-hub-backend python manage.py collectstatic --noinput

# Verify Nginx sees them
docker exec itnb-hub-nginx ls -la /usr/share/nginx/html/static/ | head -20
```

### Issue: "API returns 500 errors"
```bash
# View full error
./deploy/monitor.sh logs backend | grep -A 20 "ERROR"

# Check database schema
docker exec itnb-hub-backend python manage.py migrate --check

# If migrations needed
docker exec itnb-hub-backend python manage.py migrate
```

### Issue: "Out of memory"
```bash
# See what's consuming memory
docker stats

# Increase limit in docker-compose.prod.yml
# memory: 512m → memory: 1g

# Restart affected service
./deploy/monitor.sh restart backend
```

---

## Critical Thresholds & Alerts

### Set up monitoring alerts for:
- ✓ Container restarts (>3 in 1 hour)
- ✓ Disk usage (>90%)
- ✓ Database connections (>80% of max_connections)
- ✓ API response time (>1000ms p95)
- ✓ Error rate (>1% of requests)
- ✓ Celery queue depth (>1000 tasks)

### Recommended external monitoring:
- **Sentry** for error tracking (DSN in .env)
- **DataDog** or **New Relic** for APM
- **Prometheus + Grafana** for metrics
- **AlertManager** for threshold-based alerts

---

## Rollback Procedure

If deployment goes wrong:

```bash
# 1. IMMEDIATE: Revert code
git revert HEAD
# or go to known-good commit:
git checkout <commit-hash>

# 2. Stop services
docker-compose down

# 3. Rebuild images
docker-compose build

# 4. Start services
docker-compose -f docker-compose.prod.yml up -d

# 5. Monitor
./deploy/monitor.sh logs backend
```

**Time to rollback**: ~2-3 minutes

---

## Access Information

| Service | URL | Default User |
|---------|-----|--------------|
| API | https://itnb-hub.example.com/api/ | N/A |
| Django Admin | https://itnb-hub.example.com/admin/ | superuser |
| Mailhog (dev only) | http://localhost:1025 | N/A |
| Redis CLI (SSH tunnel) | localhost:6379 | None (no auth) |
| PostgreSQL (SSH tunnel) | localhost:5432 | postgres |

---

## File Locations

```
Project Root
├── backend/
│   ├── deploy/
│   │   ├── setup.sh               → Initial server setup
│   │   ├── redeploy.sh            → Code deployment
│   │   ├── backup.sh              → Database backup/restore
│   │   ├── monitor.sh             → Health & logs
│   │   ├── env-setup.sh           → .env wizard
│   │   └── DEPLOYMENT_GUIDE.md    → Full documentation
│   ├── .env                       → Environment variables (production)
│   ├── docker-compose.prod.yml    → Production services
│   ├── docker-compose.yml         → Development services
│   ├── Dockerfile.prod            → Production image
│   ├── Dockerfile                 → Development image
│   ├── manage.py                  → Django CLI
│   └── volumes/
│       ├── postgres/              → Database data
│       ├── media/                 → User uploads
│       ├── static/                → Collected static files
│       └── backup/                → Database backups
```

---

## Useful One-Liners

```bash
# SSH into backend container and Django shell
docker exec -it itnb-hub-backend python manage.py shell

# Count API requests in nginx logs (last hour)
docker exec itnb-hub-nginx grep "$(date -d '1 hour ago' +'%d/%b/%Y:%H')" /var/log/nginx/access.log | wc -l

# Find slowest endpoints
docker exec itnb-hub-nginx grep -oP '"\s+\d+\s+\d+' /var/log/nginx/access.log | tail -1000 | sort -k3 -rn | head -20

# Monitor Celery tasks in real-time
docker exec -it itnb-hub-celery celery inspect active

# Database size
docker exec itnb-hub-db du -sh /var/lib/postgresql/data/base/

# Check for deadlocked transactions
docker exec itnb-hub-db psql -U postgres -c "SELECT * FROM pg_locks l JOIN pg_stat_activity a ON l.pid = a.pid;"

# Export database (for manual backup)
docker exec itnb-hub-db pg_dump -U postgres itnb_hub | gzip > backup_$(date +%s).sql.gz
```

---

## After-Hours Handoff Template

```
Time: ________________
From: ________________     To: ________________

Current Status:
  Infrastructure: [ ] OK  [ ] ISSUES
  Performance: [ ] OK  [ ] ISSUES
  Data: [ ] OK  [ ] ISSUES

Active Incidents:
  1. ____________________
     Status: ____________________
     Action: ____________________

Recent Changes:
  ☐ Deployment at _______ (commit: _______)
  ☐ Database migration
  ☐ Infrastructure change

Next Scheduled Maintenance:
  ____________________

Notes:
  ____________________
  ____________________

Contact: _________________ (ext. _____)
```

---

**Last Updated**: 2024
**Maintained By**: DevOps Team
**Escalation**: DevOps Lead

For full documentation, see: `DEPLOYMENT_GUIDE.md`
