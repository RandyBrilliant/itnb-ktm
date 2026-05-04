# Student Portal - Backend API Requirements

## Required Endpoints

### 1. Student Profile
**GET** `/api/student/profile`
```json
Response: {
  "success": true,
  "data": {
    "id": "student-uuid",
    "name": "Alexander R. Vandenberg",
    "email": "student@itnb.edu",
    "studentId": "2024-8892-012",
    "program": "Computer Science",
    "level": "Level 3",
    "gpa": 3.45,
    "totalCredits": 120,
    "profileImage": "https://...",
    "department": "Computer Science"
  }
}
```

### 2. Dashboard Statistics
**GET** `/api/student/dashboard/stats`
```json
Response: {
  "success": true,
  "data": {
    "gpa": 3.45,
    "gpaChange": 0.15,
    "credits": 120,
    "creditProgress": 75,
    "upcomingEvents": 3
  }
}
```

### 3. Digital ID
**GET** `/api/student/digital-id`
```json
Response: {
  "success": true,
  "data": {
    "id": "id-uuid",
    "studentId": "2024-8892-012",
    "fullName": "Alexander R. Vandenberg",
    "program": "Computer Science",
    "department": "Computer Science",
    "photoUrl": "https://...",
    "validFrom": "2024-01-01T00:00:00Z",
    "validUntil": "2028-08-31T23:59:59Z",
    "libraryAccessLevel": 3,
    "emergencyContactName": "Sarah Vandenberg",
    "emergencyContactRelation": "Parent/Guardian",
    "emergencyContactPhone": "+1-555-123-4567"
  }
}
```

### 4. Certificates List
**GET** `/api/student/certificates?page=1&page_size=10`
```json
Response: {
  "success": true,
  "data": {
    "items": [
      {
        "id": "cert-uuid",
        "title": "Certificate Title",
        "category": "official|historical",
        "issueDate": "2024-06-15T00:00:00Z",
        "expirationDate": "2025-06-15T00:00:00Z",
        "status": "valid|expired",
        "downloadUrl": "https://...",
        "icon": "description",
        "metadata": "Issued by Faculty of Science"
      }
    ],
    "total": 5,
    "page": 1,
    "pageSize": 10,
    "hasMore": false
  }
}
```

### 5. News Articles
**GET** `/api/student/news?category=all&page=1`
```json
Response: {
  "success": true,
  "data": {
    "items": [
      {
        "id": "news-uuid",
        "title": "New Lab Opens",
        "excerpt": "A new research lab...",
        "category": "academics|campus-life|editorial|events",
        "image": "https://...",
        "publishedAt": "2026-04-10T10:00:00Z",
        "featured": true
      }
    ],
    "total": 15,
    "page": 1,
    "pageSize": 10,
    "hasMore": true
  }
}
```

### 6. Student Perks
**GET** `/api/student/perks?category=all&page=1`
```json
Response: {
  "success": true,
  "data": {
    "items": [
      {
        "id": "perk-uuid",
        "title": "GitHub Student Pack",
        "provider": "GitHub",
        "category": "software|food-drink|transport|tech",
        "description": "Free access to developer tools",
        "discount": "100",
        "image": "https://...",
        "imageAlt": "GitHub Logo",
        "claimUrl": "https://...",
        "tags": ["dev", "free"],
        "isFeatured": true,
        "status": "active|expired|used"
      }
    ],
    "total": 25,
    "page": 1,
    "pageSize": 10,
    "hasMore": true
  }
}
```

## Implementation Checklist

- [ ] Create `StudentSerializer` for profile data
- [ ] Create `CertificateSerializer` for certificates
- [ ] Create `NewsArticleSerializer` for news  
- [ ] Create `PerkSerializer` for perks/benefits
- [ ] Add authentication requirement to all student endpoints
- [ ] Implement pagination for list endpoints
- [ ] Add filtering by category/status where applicable
- [ ] Create ViewSet or APIView for each endpoint
- [ ] Register routes in `urls.py`
- [ ] Add permission classes to restrict to authenticated students
- [ ] Add tests for each endpoint
- [ ] Document API in Django admin

## Authentication
All student endpoints require JWT authentication:
```
Authorization: Bearer <token>
```

## Permissions
- Students can only access their own data
- Implement `IsAuthenticated` + custom permission to verify student role

## Pagination Query Parameters
- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 10, max: 100)

## Sorting & Filtering
Students may anticipate filters like:
- News: category, featured
- Certificates: status (valid/expired), category
- Perks: category, status, featured
