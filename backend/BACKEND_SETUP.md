# ITNB Hub - Backend Django API

Production-ready Django REST API for the ITNB Hub admin dashboard system, featuring user management, authentication, certificate generation, benefits management, and more.

## Overview

This is a modern Django backend built with:
- **Django 5.2** - Web framework
- **Django REST Framework** - REST API toolkit
- **djangorestframework-simplejwt** - JWT authentication
- **django-cors-headers** - CORS support for frontend
- **Celery & Redis** - Async task queue
- **Channels** - WebSocket support
- **Pillow & QRCode** - Image and QR code generation
- **ReportLab** - PDF generation
- **PostgreSQL** - Database (production)

## Project Structure

```
backend/
├── account/                    # User authentication & management
│   ├── models.py              # User models, roles, permissions
│   ├── views.py               # Auth endpoints
│   ├── urls.py                # Auth routes
│   ├── serializers.py         # Request/response serialization
│   ├── managers.py            # Custom Django managers
│   ├── throttles.py           # Rate limiting
│   ├── tasks.py               # Async tasks (email, etc.)
│   ├── admin.py               # Django admin configuration
│   ├── tests.py               # Unit tests
│   └── migrations/            # Database migrations
│
├── main/                      # Core application models
│   ├── models.py              # Certificates, Benefits, Posts, Events
│   ├── views.py               # API endpoints
│   ├── urls.py                # Routes
│   ├── serializers.py         # Serialization
│   ├── filters.py             # Django filters
│   ├── admin.py               # Django admin
│   └── migrations/            # Database migrations
│
├── backend/                   # Django settings & URLs
│   ├── settings.py            # Configuration (dev/prod)
│   ├── urls.py                # Main URL routing
│   ├── asgi.py                # ASGI configuration (channels)
│   ├── wsgi.py                # WSGI configuration (gunicorn)
│   └── __init__.py
│
├── .env                       # Environment variables (git-ignored)
├── .env.example              # Environment template
├── requirements.txt          # Python dependencies
├── manage.py                 # Django CLI
├── rest_framework_setup.sh  # DRF setup helper
└── README.md                # This file
```

## Installation & Setup

### 1. Create Virtual Environment

```bash
# Create environment
python -m venv env

# Activate environment
# Windows:
env\Scripts\activate
# macOS/Linux:
source env/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

Copy `.env.example` to `.env` and update settings:

```bash
cp .env.example .env
```

```env
# Django Settings
DEBUG=True
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1
CSRF_TRUSTED_ORIGINS=http://localhost:5173

# Database
# Development (SQLite)
DATABASE_URL=sqlite:///db.sqlite3

# Production (PostgreSQL)
# DATABASE_URL=postgresql://user:password@localhost/itnb_hub

# CORS Settings
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# JWT Configuration
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_LIFETIME=3600  # 1 hour
JWT_REFRESH_TOKEN_LIFETIME=604800  # 7 days

# Email Configuration (Mailgun API)
MAILGUN_API_KEY=your-mailgun-api-key
MAILGUN_DOMAIN=mg.yourdomain.com
DEFAULT_FROM_EMAIL=noreply@mg.yourdomain.com
# MAILGUN_API_URL=https://api.eu.mailgun.net/v3  # EU region only

# Redis (for Celery & Channels)
REDIS_URL=redis://localhost:6379/0

# AWS S3 (optional, for media storage)
USE_S3=False
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_STORAGE_BUCKET_NAME=

# App Settings
BASE_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
```

### 4. Initialize Database

```bash
# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser
# Email: admin@itnb.com
# Password: (set a strong password)

# Create test data (optional)
python manage.py seed_demo_data
```

### 5. Start Development Server

```bash
# Terminal 1: Django server
python manage.py runserver 0.0.0.0:8000

# Terminal 2: Celery worker (for async tasks)
celery -A backend worker -l info

# Terminal 3: Celery beat (for scheduled tasks)
celery -A backend beat -l info

# Terminal 4: Channels WebSocket (if using WebSockets)
python manage.py runserver
```

**Server available at**: `http://localhost:8000`
**Admin panel**: `http://localhost:8000/admin`

## API Endpoints Overview

### Authentication

```
POST   /api/auth/token/            # Login
POST   /api/auth/token/refresh/    # Refresh JWT token
POST   /api/auth/logout/           # Logout
GET    /api/auth/me/               # Get current user
PATCH  /api/auth/me/               # Update profile
POST   /api/auth/password-change/  # Change password
```

### User Management

```
GET    /api/users/                 # List users (paginated, filtered)
GET    /api/users/{id}/            # Get user details
POST   /api/users/                 # Create user (admin)
PATCH  /api/users/{id}/            # Update user (admin)
DELETE /api/users/{id}/            # Delete user (admin)
POST   /api/users/{id}/activate/   # Activate user
POST   /api/users/{id}/deactivate/ # Deactivate user
```

### Certificates

```
GET    /api/certificates/          # List certificates (filtered by role)
GET    /api/certificates/{id}/     # Get certificate
POST   /api/certificates/          # Create certificate (admin)
PATCH  /api/certificates/{id}/     # Update certificate
DELETE /api/certificates/{id}/     # Delete certificate
POST   /api/certificates/{id}/verify/ # Verify certificate
GET    /api/certificates/{id}/qrcode/ # Download QR code
```

### Benefits

```
GET    /api/benefits/              # List benefits (filtered by role)
GET    /api/benefits/{id}/         # Get benefit
POST   /api/benefits/              # Create benefit (admin)
PATCH  /api/benefits/{id}/         # Update benefit
DELETE /api/benefits/{id}/         # Delete benefit
GET    /api/benefit-categories/    # List categories
POST   /api/benefit-categories/    # Create category (staff)
```

### Posts & News

```
GET    /api/posts/                 # List posts (paginated)
GET    /api/posts/{id}/            # Get post
POST   /api/posts/                 # Create post (staff)
PATCH  /api/posts/{id}/            # Update post
DELETE /api/posts/{id}/            # Delete post
```

### Events

```
GET    /api/events/                # List events (paginated, filtered)
GET    /api/events/{id}/           # Get event
POST   /api/events/                # Create event (admin)
PATCH  /api/events/{id}/           # Update event
DELETE /api/events/{id}/           # Delete event
POST   /api/events/{id}/register/  # Register for event
```

## Authentication & Permissions

### JWT Flow

1. **Login**: `POST /api/auth/token/` with email & password
   - Returns: `access` token (short-lived, 1 hour)
   - Returns: `refresh` token (long-lived, 7 days)

2. **Requests**: Include `Authorization: Bearer {access_token}` header

3. **Refresh**: `POST /api/auth/token/refresh/` with refresh token
   - Returns: New `access` token

4. **Logout**: `POST /api/auth/logout/` revokes refresh token

### User Roles & Permissions

```python
class UserRole(models.TextChoices):
    ADMIN = "admin", "Admin"           # Full system access
    STAFF = "staff", "Staff"           # Content management
    LECTURER = "lecturer", "Lecturer" # Course management
    STUDENT = "student", "Student"    # View only
    ALUMNI = "alumni", "Alumni"        # View only
```

### Permission Classes

- `IsAuthenticated` - User must be logged in
- `IsAdmin` - User must be admin
- `IsStaffOrAdmin` - User is staff or admin
- `IsOwnerOrAdmin` - User is object owner or admin

## Code Patterns

### 1. ViewSets (DRF)

```python
# accounts/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminOrReadOnly]
    
    @action(detail=True, methods=["post"])
    def activate(self, request, pk=None):
        user = self.get_object()
        user.is_active = True
        user.save()
        return Response({"status": "user activated"})
```

### 2. Serializers

```python
# accounts/serializers.py
from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name", "role", "is_active"]
        read_only_fields = ["id"]
```

### 3. Filters

```python
# main/filters.py
from django_filters import FilterSet, CharFilter, ChoiceFilter
from .models import Certificate

class CertificateFilter(FilterSet):
    user = CharFilter(field_name="user__email", lookup_expr="icontains")
    status = ChoiceFilter(field_name="status")
    
    class Meta:
        model = Certificate
        fields = ["user", "status"]
```

### 4. Async Tasks (Celery)

```python
# account/tasks.py
from celery import shared_task
from django.core.mail import send_mail

@shared_task
def send_welcome_email(user_id):
    user = User.objects.get(id=user_id)
    send_mail(
        "Welcome to ITNB Hub",
        f"Hello {user.first_name}!",
        "noreply@itnb.com",
        [user.email]
    )
```

### 5. Model with Timestamps

```python
# main/models.py
from django.db import models

class TimestampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True

class Certificate(TimestampedModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=Status.choices)
```

## Common Tasks

### Add a New API Endpoint

1. **Define Model** (`main/models.py`)
   ```python
   class MyModel(models.Model):
       name = models.CharField(max_length=255)
   ```

2. **Create Serializer** (`main/serializers.py`)
   ```python
   class MyModelSerializer(serializers.ModelSerializer):
       class Meta:
           model = MyModel
           fields = "__all__"
   ```

3. **Create ViewSet** (`main/views.py`)
   ```python
   class MyModelViewSet(viewsets.ModelViewSet):
       queryset = MyModel.objects.all()
       serializer_class = MyModelSerializer
   ```

4. **Register Route** (`main/urls.py`)
   ```python
   router.register(r"mymodel", MyModelViewSet)
   ```

5. **Run Migration**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

### Custom Management Command

```bash
# Create file: account/management/commands/send_emails.py
python manage.py send_emails
```

### Running Tests

```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test account

# Run with verbosity
python manage.py test account -v 2

# Run with coverage
pip install coverage
coverage run --source='.' manage.py test
coverage report
```

## Production Deployment

### 1. Environment Settings

```env
DEBUG=False
ALLOWED_HOSTS=api.yourdomain.com
SECRET_KEY=generate-new-secret-key
DATABASE_URL=postgresql://user:password@db-host/itnb_hub
```

### 2. Collect Static Files

```bash
python manage.py collectstatic --noinput
```

### 3. Run Migrations

```bash
python manage.py migrate
```

### 4. Deploy with Gunicorn

```bash
pip install gunicorn
gunicorn backend.wsgi:application --bind 0.0.0.0:8000 --workers 4
```

### 5. Use Nginx as Reverse Proxy

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location /static/ {
        alias /path/to/backend/staticfiles/;
    }

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 6. Enable HTTPS with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

## Troubleshooting

### Issue: "ModuleNotFoundError"
**Solution**: Ensure virtual environment is activated and dependencies are installed

### Issue: "Database connection refused"
**Solution**: Check DATABASE_URL in .env and ensure database service is running

### Issue: "CORS errors from frontend"
**Solution**: Update CORS_ALLOWED_ORIGINS in .env to include frontend URL

### Issue: "Permission denied when saving files"
**Solution**: Check file permissions on media directory:
```bash
chmod -R 755 media/
```

### Issue: "Email not sending"
**Solution**: Set `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, and `DEFAULT_FROM_EMAIL` in `.env` (use console backend for local testing by leaving Mailgun vars empty)

## Performance Tips

1. **Database Queries**
   ```python
   # Use select_related for foreign keys
   users = User.objects.select_related('profile').all()
   
   # Use prefetch_related for reverse relations
   posts = Post.objects.prefetch_related('comments').all()
   ```

2. **Pagination**
   ```python
   # Enable pagination in settings
   REST_FRAMEWORK = {
       'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
       'PAGE_SIZE': 20
   }
   ```

3. **Caching**
   ```python
   from django.views.decorators.cache import cache_page
   
   @cache_page(60 * 5)  # Cache for 5 minutes
   def get_benefits(request):
       pass
   ```

4. **Database Indexing**
   ```python
   class User(models.Model):
       email = models.EmailField(db_index=True)
   ```

## Documentation References

- [Django Official Docs](https://docs.djangoproject.com)
- [Django REST Framework](https://www.django-rest-framework.org)
- [Simple JWT](https://django-rest-framework-simplejwt.readthedocs.io)
- [Celery Documentation](https://docs.celeryproject.org)
- [Channels Documentation](https://channels.readthedocs.io)

## API Testing

### Using cURL

```bash
# Login
curl -X POST http://localhost:8000/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@itnb.com","password":"password"}'

# Get users (with token)
curl -X GET http://localhost:8000/api/users/ \
  -H "Authorization: Bearer {access_token}"
```

### Using Postman

1. Import the provided Postman collection
2. Set `{{base_url}}` to `http://localhost:8000`
3. Login to get JWT tokens
4. Tokens auto-populate in request headers

### Using Python

```python
import requests

BASE_URL = "http://localhost:8000"

# Login
response = requests.post(
    f"{BASE_URL}/api/auth/token/",
    json={"email": "admin@itnb.com", "password": "password"}
)
token = response.json()["access"]

# Get users
headers = {"Authorization": f"Bearer {token}"}
response = requests.get(f"{BASE_URL}/api/users/", headers=headers)
print(response.json())
```

## Support

For issues or questions:
1. Check Django REST Framework documentation
2. Review existing models and views for patterns
3. Check database migrations for schema
4. Review test files for usage examples

---

**Ready to build?** Start with `python manage.py runserver` and happy coding! 🚀
