# ITNB Hub - Project Context for AI Handoff

This document is the canonical handoff context for another chatbot/agent.
It reflects the current codebase state after app-boundary refactors.

---

## 1) Project Summary

ITNB Hub is a full-stack web app with:
- Django + DRF backend (`backend/`)
- React + TypeScript + Vite frontend (`frontend/`)
- Role-based experience for `ADMIN`, `STAFF`, `LECTURER`, `STUDENT`, `ALUMNI`
- JWT authentication and role-protected routes
- Core domain modules: certificates, perks/benefits, posts/news, events, digital ID card

Primary local URLs:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- Django admin: `http://localhost:8000/admin`

---

## 2) Current App Boundaries (Important)

Backend has two local apps:

### `account` app (account/auth ownership only)
- User/auth and profile concerns
- Models:
  - `CustomUser`
  - `UserRole`
  - `StaffProfile`
  - `LecturerProfile`
  - `AlumniProfile`
  - `DigitalCard`
  - `EmailVerificationCode`
- Endpoints:
  - auth/me/logout/password flows
  - users CRUD
  - role profile endpoints
  - digital card endpoints

### `main` app (domain/content ownership only)
- Domain resources and business content
- Models:
  - `Certificate`
  - `BenefitCategory`
  - `Benefit`
  - `Post`
  - `Event`
  - `Broadcast`
  - `Notification`
  - enums: `CertificateStatus`, `PostCategory`, `NotificationType`, `NotificationPriority`
- Endpoints:
  - certificates
  - benefit categories
  - benefits
  - posts
  - events
- Services (moved from account):
  - `main/services/certificate_generation.py`
  - `main/services/benefit_filtering.py`

Do not re-couple these boundaries unless explicitly requested.

---

## 3) Backend Routing Map

Top-level routes in `backend/backend/urls.py`:
- `admin/`
- `api/token/`, `api/token/refresh/`
- `api/auth/token/`, `api/auth/token/refresh/`
- `health/`
- `api/` includes `account.urls`
- `api/` includes `main.urls`

### Account routes (`backend/account/urls.py`)
- Auth:
  - `api/auth/me/`
  - `api/auth/logout/`
  - `api/auth/forgot-password/`
  - `api/auth/reset-password/`
  - `api/auth/change-password/`
  - `api/health/`
- Routers:
  - `api/users/`
  - `api/lecturer-profiles/`
  - `api/staff-profiles/`
  - `api/alumni-profiles/`
  - `api/cards/`

### Main routes (`backend/main/urls.py`)
- Routers:
  - `api/certificates/`
  - `api/benefit-categories/`
  - `api/benefits/`
  - `api/posts/`
  - `api/events/`

---

## 4) Frontend Summary

Frontend stack:
- React 19
- TypeScript
- Vite
- Tailwind v4
- TanStack Query
- React Router
- Axios
- Framer Motion

Frontend uses role-based shells/layouts and shared content pages.
Auth flow includes:
- public login (`/login`) for non-admin roles
- admin login (`/admin/login`) for admin role
- forgot/reset/change password pages

---

## 5) Authentication and Security

- JWT via `rest_framework_simplejwt`
- DRF default auth class is JWT
- Token endpoints:
  - `POST /api/auth/token/`
  - `POST /api/auth/token/refresh/`
- Password reset flow:
  - `POST /api/auth/forgot-password/`
  - `POST /api/auth/reset-password/`
- Change password:
  - `POST /api/auth/change-password/`

Permissions are centralized in `backend/account/permissions.py` and used by both apps.

---

## 6) Seed Data and Local Credentials

Management commands:
- `python manage.py seed_role_users`
- `python manage.py seed_content_data`

Default seeded users:
- `admin@itnb.local` / `Pass1234!`
- `staff@itnb.local` / `Pass1234!`
- `lecturer@itnb.local` / `Pass1234!`
- `student@itnb.local` / `Pass1234!`
- `alumni@itnb.local` / `Pass1234!`

---

## 7) Current Database/Migration State

The backend was reset for clean ownership:
- old compatibility migration chain removed
- fresh migrations generated:
  - `account/migrations/0001_initial.py`
  - `main/migrations/0001_initial.py`
- database recreated (`sqlite` local dev)

If schema changes are needed next, continue from these new initial migrations.

---

## 8) Key Environment Variables

Backend (`backend/.env`):
- `SECRET_KEY`
- `DEBUG`
- `ALLOWED_HOSTS`
- `CORS_ALLOWED_ORIGINS`
- `CSRF_TRUSTED_ORIGINS`
- `FRONTEND_URL`
- `DEFAULT_FROM_EMAIL`
- `EMAIL_BACKEND`
- `ID_CARD_FRONT_TEMPLATE_URL`
- `ID_CARD_BACK_TEMPLATE_URL`
- `ID_CARD_FRONT_TEMPLATE_PATH`
- `ID_CARD_BACK_TEMPLATE_PATH`
- `GENERATE_CARD_IMAGE_ON_CREATE`
- `CELERY_BROKER_URL`
- `CELERY_RESULT_BACKEND`

Frontend (`frontend/.env`):
- `VITE_API_URL`
- optional card template URL vars are supported, backend template endpoint is preferred

---

## 9) Known Architectural Decisions

- Keep account/auth concerns in `account`; keep domain/content in `main`.
- Prefer shared reusable role-aware UI for student/staff/lecturer pages.
- API response handling on frontend uses compatibility helpers (`unwrapApiData`) because some endpoints may return wrapped or raw data.
- ID card template resolution supports backend-driven template URLs and fallback behavior.

---

## 10) Signals, Tasks, and Async Notes

- No active custom Django signal registration is currently wired via `apps.py` `ready()`.
- Celery config exists; some legacy task stubs remain and may intentionally early-return/log warnings.
- If introducing signals, document them and register them explicitly in app config.

---

## 11) How to Run (Recommended)

### Docker
From `backend/`:
- `docker compose up -d`
- `docker compose exec api python manage.py migrate`
- `docker compose exec api python manage.py seed_role_users`
- `docker compose exec api python manage.py seed_content_data`

From `frontend/`:
- `bun install` (or `npm install`)
- `bun run dev` (or `npm run dev`)

### Non-Docker (if local Python toolchain available)
- Backend:
  - create venv
  - install `requirements.txt`
  - `python manage.py migrate`
  - `python manage.py runserver`
- Frontend:
  - `bun install`
  - `bun run dev`

---

## 12) Fast Orientation for Another Chatbot

If handing this repo to another chatbot, provide:
1. This file (`PROJECT_CONTEXT_FOR_CHATBOT.md`)
2. The requested task scope (feature/fix/refactor)
3. Constraint: preserve `account` vs `main` boundary unless requested otherwise
4. Current target package manager for frontend: `bun` preferred

Suggested starter prompt:

> Use `PROJECT_CONTEXT_FOR_CHATBOT.md` as source of truth.  
> Keep `account` for auth/profile/card concerns and `main` for certificates/benefits/posts/events.  
> Before editing, run a quick impact scan for imports/routes/serializers/views and ensure `python manage.py check` still passes after edits.

---

## 13) Maintenance Checklist

When changing backend domain features:
- update `main/models.py` and relevant `main/serializers.py`, `main/views.py`, `main/urls.py`
- update/admin-register in `main/admin.py` if needed
- add/update migration
- update seed command if sample data needs adjustment
- run:
  - `python manage.py check`
  - `python manage.py migrate`
  - relevant seed command(s)

When changing auth/profile:
- use `account` app only
- verify frontend auth route behavior (`/login` vs `/admin/login`)

