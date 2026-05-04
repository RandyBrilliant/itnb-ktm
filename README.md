# ITNB Hub - Full Stack Admin Dashboard

Complete web application for the ITNB Hub admin dashboard system. This project includes a Django REST API backend and a React + TypeScript admin dashboard frontend.

## 📋 Project Overview

ITNB Hub is a comprehensive administration platform designed to manage:
- **User Management** - Admins, staff, lecturers, students, and alumni
- **Certificates** - Issue, verify, and download certificates with QR codes
- **Benefits** - Manage role-specific benefits and categories
- **Posts & News** - Publish articles and announcements
- **Events** - Schedule events and manage registrations
- **Settings** - System configuration and administration

## 🏗️ Architecture

```
ITNB Hub
├── 🖥️ Frontend (React + TypeScript)
│   ├── Admin Dashboard
│   ├── User Management UI
│   ├── Certificate Management
│   └── Benefits System
│
└── 🗄️ Backend (Django REST API)
    ├── User Authentication (JWT)
    ├── Role-Based Access Control
    ├── Certificate Generation (PDF + QR)
    ├── Data Management
    └── Async Tasks (Celery)
```

## 🚀 Quick Start

### Prerequisites
- Python 3.10+ (Backend)
- Node.js 18+ (Frontend)
- PostgreSQL 12+ (Production)
- Redis (For Celery & Channels)

### Option 1: Quick Setup (SQLite + Local Redis)

```bash
# Terminal 1: Backend
cd backend
python -m venv env
env\Scripts\activate  # Windows or source env/bin/activate on Mac/Linux
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver

# Terminal 2: Frontend
cd frontend
npm install
npm run dev

# Open http://localhost:5173 and login
```

### Option 2: Docker Setup (Production-Ready)

```bash
# Run entire stack with Docker
docker-compose up -d

# Initialize database
docker-compose exec api python manage.py migrate
docker-compose exec api python manage.py createsuperuser

# Seed login users and content data
docker-compose exec api python manage.py seed_role_users
docker-compose exec api python manage.py seed_content_data
```

**Access**: 
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- Admin: http://localhost:8000/admin

## 📁 Project Structure

```
itnb-ktm/
├── backend/                    # Django REST API
│   ├── account/               # Authentication & Users
│   ├── main/                  # Models (Certificates, Benefits, etc.)
│   ├── backend/               # Django settings
│   ├── manage.py             # Django CLI
│   ├── requirements.txt       # Python dependencies
│   ├── .env.example          # Environment template
│   └── BACKEND_SETUP.md      # Backend documentation
│
├── frontend/                  # React + TypeScript Dashboard
│   ├── src/
│   │   ├── api/              # API client modules
│   │   ├── components/       # Reusable components
│   │   ├── contexts/         # React contexts
│   │   ├── hooks/            # Custom hooks
│   │   ├── pages/            # Page components
│   │   ├── types/            # TypeScript types
│   │   ├── App.tsx           # Main app
│   │   └── main.tsx          # Entry point
│   ├── package.json          # Node dependencies
│   ├── .env.example          # Environment template
│   ├── vite.config.ts        # Vite configuration
│   └── FRONTEND_SETUP.md     # Frontend documentation
│
└── README.md                 # This file
```

## 🔧 Technology Stack

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Django | 5.2 | Web framework |
| Django REST Framework | 3.14 | API development |
| SimpleJWT | 5.3 | JWT authentication |
| Celery | 5.3 | Async tasks |
| Channels | 4.0 | WebSocket support |
| PostgreSQL | 12+ | Database (prod) |
| Redis | Latest | Cache & task queue |

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19 | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | Latest | Build tool |
| TailwindCSS | 4.x | Styling |
| shadcn/ui | Latest | UI components |
| React Query | Latest | Data fetching |
| React Router | Latest | Routing |
| Axios | Latest | HTTP client |

## 🔑 Key Features

### ✅ Implemented
- [x] JWT Authentication (login/logout/refresh)
- [x] Role-Based Access Control (Admin, Staff, Lecturer, Student, Alumni)
- [x] User Management (CRUD operations)
- [x] Protected Routes & API Endpoints
- [x] Responsive Admin Dashboard
- [x] Toast Notifications
- [x] Pagination & Filtering
- [x] Loading States & Error Handling
- [x] Async Email Tasks
- [x] PDF Certificate Generation

### 🚀 Coming Soon
- [ ] Certificate Management Dashboard
- [ ] Benefits Management System
- [ ] Posts & News Management
- [ ] Events Management
- [ ] Real-time Notifications (WebSocket)
- [ ] Advanced Reporting & Analytics
- [ ] Bulk Import/Export
- [ ] Email Notifications
- [ ] Multi-language Support

## 📚 Documentation

For AI handoff / chatbot context, use:
- `PROJECT_CONTEXT_FOR_CHATBOT.md`

### For Quick Reference
```bash
# Backend Setup
cat backend/BACKEND_SETUP.md

# Frontend Setup
cat frontend/FRONTEND_SETUP.md
```

### Important URLs
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Django Admin**: http://localhost:8000/admin
- **API Swagger Docs** (if installed): http://localhost:8000/api/docs

## 🔐 Authentication Flow

```
┌─────────────┐
│   Login     │
│ (Email/Pass)│
└────┬────────┘
     │
     ▼
┌──────────────────────────┐
│  POST /api/auth/token/   │
│  Returns: JWT tokens     │
└────┬─────────────────────┘
     │
     ├─► access_token (1 hour)
     │
     └─► refresh_token (7 days)
          stored in localStorage
     │
     ▼
┌──────────────────────────────┐
│ Authorization: Bearer token  │
│ All API requests use this    │
└──────────────────────────────┘
     │
     ├─ Valid? ──► Allow request ──► 200 OK
     │
     └─ Expired? ──► POST /api/auth/token/refresh/ ──► New token
```

## 👥 User Roles & Permissions

| Role | Admin | Staff | Lecturer | Student | Alumni |
|------|-------|-------|----------|---------|--------|
| Manage Users | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create Posts | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create Events | ✅ | ✅ | ❌ | ❌ | ❌ |
| Issue Certificates | ✅ | ✅ | ❌ | ❌ | ❌ |
| View Benefits | ✅ | ✅ | ✅ | ✅ | ✅ |
| Register Events | ✅ | ✅ | ✅ | ✅ | ✅ |

## 🛠️ Common Development Tasks

### Backend

```bash
cd backend

# Create virtual environment
python -m venv env
source env/bin/activate  # or env\Scripts\activate on Windows

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env
# Edit .env with your settings

# Database
python manage.py migrate
python manage.py createsuperuser

# Run development server
python manage.py runserver

# Create new app
python manage.py startapp myapp

# Create migration
python manage.py makemigrations

# Run tests
python manage.py test account

# Run Celery worker
celery -A backend worker -l info
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install
# or
bun install

# Setup environment
cp .env.example .env
# Edit .env with your API URL

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Format code
npm run format
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
python manage.py test account        # Test account app
python manage.py test main           # Test main app
python manage.py test -v 2           # Verbose output
```

### Frontend Tests (Setup when ready)
```bash
cd frontend
npm run test                         # Run tests
npm run test:ui                      # UI test runner
npm run coverage                     # Coverage report
```

## 🚢 Deployment

### Backend Deployment Checklist
- [ ] Set `DEBUG=False` in .env
- [ ] Update `ALLOWED_HOSTS`
- [ ] Set strong `SECRET_KEY`
- [ ] Configure PostgreSQL
- [ ] Setup Redis
- [ ] Run `python manage.py collectstatic`
- [ ] Setup Gunicorn or similar
- [ ] Configure Nginx as reverse proxy
- [ ] Enable HTTPS/SSL
- [ ] Setup backups
- [ ] Configure monitoring

### Frontend Deployment Checklist
- [ ] Update `VITE_API_URL` to production backend
- [ ] Run `npm run build`
- [ ] Configure deployment (Vercel, Netlify, etc.)
- [ ] Setup CI/CD pipeline
- [ ] Enable HTTPS
- [ ] Configure analytics

## 🔍 Debugging

### Backend

```python
# Add debug logging
import logging
logger = logging.getLogger(__name__)
logger.debug("Debug message")

# Use Django shell
python manage.py shell

# Check database
python manage.py dbshell
```

### Frontend

```javascript
// Browser DevTools
console.log(data)
console.table(data)

// Network tab
Inspect API requests

// React DevTools
Inspect component state
```

## 📊 API Examples

### Login
```bash
curl -X POST http://localhost:8000/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@itnb.com","password":"password"}'
```

Response:
```json
{
  "code": "SUCCESS",
  "data": {
    "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
  }
}
```

### Get Users
```bash
curl -X GET http://localhost:8000/api/users/ \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc..."
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| API connection refused | Start backend: `python manage.py runserver` |
| 401 Unauthorized | Login again, check token in localStorage |
| CORS errors | Check `CORS_ALLOWED_ORIGINS` in backend .env |
| Module not found | Install dependencies: `pip install -r requirements.txt` or `npm install` |
| Database locked | Restart Django server or check other processes |
| Token expired | Refresh token automatically or login again |

## 📖 Learn More

### Official Documentation
- [Django Documentation](https://docs.djangoproject.com)
- [Django REST Framework](https://www.django-rest-framework.org)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev)
- [TailwindCSS](https://tailwindcss.com)

### Guides
- [Backend Setup Guide →](backend/BACKEND_SETUP.md)
- [Frontend Setup Guide →](frontend/FRONTEND_SETUP.md)

## 🤝 Contributing

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes, commit
git add .
git commit -m "feat: add my feature"

# Push and create PR
git push origin feature/my-feature
```

### Code Guidelines
- Use descriptive commit messages
- Follow PEP 8 (Python) and ESLint (JavaScript)
- Write tests for new features
- Update documentation

## 📝 License

This project is proprietary software for ITNB Hub.

## 👨‍💻 Support

For issues, questions, or suggestions:
1. Check the documentation in backend/ or frontend/ folders
2. Review existing code for patterns
3. Create an issue with details
4. Contact the development team

---

## 🎯 Getting Started Roadmap

1. **Week 1**: Environment setup & basic authentication
2. **Week 2**: User management dashboard
3. **Week 3**: Certificate management
4. **Week 4**: Benefits & Posts system
5. **Week 5**: Events management
6. **Week 6+**: Advanced features & optimization

---

**Ready to start?**

```bash
# Backend
cd backend && python -m venv env && source env/bin/activate && pip install -r requirements.txt && cp .env.example .env && python manage.py migrate && python manage.py runserver

# Frontend (in another terminal)
cd frontend && npm install && cp .env.example .env && npm run dev
```

**Then visit http://localhost:5173** 🚀
