# CI/CD — Backend & Frontend on the VPS

Both apps run on one VPS behind **Caddy** (`itnb-hub-caddy`), which terminates TLS with automatic
Let's Encrypt certificates and serves:

| Domain | Served by |
|--------|-----------|
| `data.itnb.ac.id` | Reverse proxy → `api:8000` (Daphne, HTTP + WebSocket); `/static/*` and `/media/*` from volumes |
| `portal.itnb.ac.id` | SPA from `backend/frontend-releases/current` |
| `http://:8081` (internal, not published) | Container healthcheck + CI smoke test |

Config: [`backend/caddy/Caddyfile`](../caddy/Caddyfile).

## Workflows

### Backend — `.github/workflows/docker-production.yml`
Runs on pushes to `main` touching `backend/**`. Builds the image to GHCR, then on the VPS runs
`deploy/deploy-registry.sh`, which deploys the API (rollback on failed health check), restarts
workers and calls `ensure_proxy`:

- creates `frontend-releases/` (must exist before Caddy starts, so the deploy user owns it),
- removes the legacy `itnb-hub-nginx` container if present,
- starts Caddy, and reloads it (zero downtime) when files under `backend/caddy/` changed.

### Frontend — `.github/workflows/frontend-production.yml`
Runs on pushes to `main` touching `frontend/**` (PRs: lint + build only).

1. `bun install --frozen-lockfile`, ESLint (non-blocking), `tsc -b && vite build`.
2. Precompresses assets (`.br` / `.gz`) — Caddy serves them via `precompressed`.
3. rsyncs `dist/` to `frontend-releases/<sha>/` (unchanged files hard-linked from the live release).
4. Verifies every `/assets/*` referenced by `index.html` exists, atomically swaps the `current`
   symlink, smoke-tests through `http://127.0.0.1:8081` inside the Caddy container, and rolls back
   to the previous release on failure.
5. Keeps the newest 5 releases.

Manual rollback on the VPS:

```bash
cd ~/itnb-ktm/backend/frontend-releases
ls -t                                   # pick a previous <sha>
ln -sfn <sha> current.next && mv -Tf current.next current
```

## GitHub configuration

Secrets (shared with the backend workflow): `DO_HOST`, `DO_USERNAME`, `DO_SSH_PORT`,
`DO_SSH_PRIVATE_KEY` (or `DO_SSH_PRIVATE_KEY_B64`), `DO_PROJECT_PATH` (= `/home/itnb/itnb-ktm/backend`).

Repository **variables** (baked into the bundle at build time — public values only):

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://data.itnb.ac.id` (required) |
| `VITE_APP_NAME` | e.g. `ITNB Hub` |
| `VITE_APP_URL` | `https://portal.itnb.ac.id` |
| `VITE_ID_CARD_FRONT_TEMPLATE_URL` | optional |
| `VITE_ID_CARD_BACK_TEMPLATE_URL` | optional |

## One-time migration from nginx + certbot + Vercel

1. **GitHub**: add the variables above (copy current values from the Vercel project settings).
2. **DNS**: lower the TTL of `portal.itnb.ac.id` (currently a CNAME to Vercel) a day ahead.
3. **VPS**, immediately before merging — discard the files `ssl-setup.sh` generated, otherwise
   `git pull` in the deploy fails, and set the ACME contact:
   ```bash
   cd ~/itnb-ktm && git checkout -- backend/nginx backend/deploy
   echo 'ACME_EMAIL=admin@itnb.ac.id' >> backend/.env
   ```
   (The running nginx keeps serving: its bind-mounted config files are unaffected until it restarts.)
4. **Merge to `main`**. The backend deploy replaces nginx with Caddy; `data.itnb.ac.id` gets a new
   certificate within seconds (a few seconds of API downtime during the swap). The frontend deploy
   stages the SPA and smoke-tests it on `:8081` — the public site is still on Vercel.
5. **DNS**: change `portal.itnb.ac.id` to `A 202.155.19.42`. Caddy obtains the certificate on the
   first request after DNS propagates (it retries automatically until then).
6. **Verify**: `curl -I https://portal.itnb.ac.id` returns `200` with no `x-vercel-*` headers,
   login works, WebSocket features work, and `docker logs itnb-hub-caddy | grep -i error` is clean.
7. **Clean up**:
   - Remove the Vercel project (or disconnect its Git integration), then delete `frontend/vercel.json`.
   - Remove certbot, which can no longer renew (Caddy owns ports 80/443):
     ```bash
     sudo rm -f /etc/cron.d/certbot /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
     sudo systemctl disable --now certbot.timer 2>/dev/null || true
     ```
