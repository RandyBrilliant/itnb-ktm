# ITNB Hub - Frontend Admin Dashboard

**React 19 + TypeScript + Vite** - Role-Based Dashboards for Students, Staff, Lecturers, and Alumni

## 📚 Documentation Index

**Quick Links to All Frontend Design & Implementation Guides:**

### 📖 Getting Started (Start Here!)
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Overview & quick reference (5 min)
- **[DESIGN.md](DESIGN.md)** - Design system specification (15 min)
- **[ROLE_DASHBOARDS.md](ROLE_DASHBOARDS.md)** - Detailed dashboard specs (20 min)

### 🛠️ Development
- **[DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md)** - 8-week implementation roadmap (30 min)
- **[FRONTEND_SETUP.md](FRONTEND_SETUP.md)** - Setup & installation guide (10 min)

### 🎨 Visual References
- **[STUDENT_DASHBOARD.html](STUDENT_DASHBOARD.html)** - Student dashboard mockup (reference)
- **[STUDENT_ID_PAGE.html](STUDENT_ID_PAGE.html)** - Student ID page mockup
- **[STUDENT_CERTIFICATES_PAGE.html](STUDENT_CERTIFICATES_PAGE.html)** - Student Certificates page mockup
- **[STUDENT_NEWS_PAGE.html](STUDENT_NEWS_PAGE.html)** - Student News & Events page mockup
- **[STUDENT_PERKS_PAGE.html](STUDENT_PERKS_PAGE.html)** - Student Perks & Benefits page mockup (NEW!)
- **[STAFF_DASHBOARD.html](STAFF_DASHBOARD.html)** - Staff dashboard mockup
- **[LECTURER_DASHBOARD.html](LECTURER_DASHBOARD.html)** - Lecturer dashboard mockup
- **[ALUMNI_DASHBOARD.html](ALUMNI_DASHBOARD.html)** - Alumni dashboard mockup

View HTML files in a browser to see the interactive design in action.

---

## 🎯 What This Project Includes

### Four Role-Based Dashboards
1. **Student Dashboard** - Academic performance, schedule, ID card
2. **Staff Dashboard** - User management, content metrics, system health
3. **Lecturer Dashboard** - Class management, grading, submissions
4. **Alumni Dashboard** - Networking, job board, events, career opportunities

### Design System: "Institutional Prestige"
- **Professional Aesthetic** - Inspired by physical IT&B student card
- **Editorial Styling** - Magazine-like hierarchy and typography
- **Thoughtful UX** - No borders, sharp geometry, semantic color use
- **Accessibility First** - WCAG AA compliant, touch-friendly

### Technology Stack
- **React 19** - Modern UI framework
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool
- **TailwindCSS 4** - Utility-first CSS
- **Material Symbols** - Professional iconography
- **React Query** - Server state management
- **React Router** - Client-side routing
- **Axios** - HTTP client with auto token refresh

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
# or
bun install
```

### 2. Setup Environment
```bash
cp .env.example .env
# Update VITE_API_URL=http://localhost:8000
```

### 3. Start Development Server
```bash
npm run dev
# Server runs at http://localhost:5173
```

### 4. View Design References
Open HTML mockup files in your browser:
- `STUDENT_DASHBOARD.html` → Student view
- `STAFF_DASHBOARD.html` → Staff view
- `LECTURER_DASHBOARD.html` → Lecturer view
- `ALUMNI_DASHBOARD.html` → Alumni view

---

## 📊 Dashboard Overview

### Student Dashboard
```
Header [ACADEMIC YEAR] Dashboard [Status]
├── Digital ID Card (red background)
├── Cumulative GPA (3.84) + trend
├── Total Credits (112/140) + progress
├── Today's Schedule (2 classes)
└── Active Campus Session (WiFi status)
Nav: Dashboard* | ID | Certificates | News | Perks
```

### Staff Dashboard
```
Header [STAFF PORTAL] Dashboard [Role]
├── Staff ID Card (red background)
├── Active Users (1,247) + trend
├── Posts Published (23) + progress
├── Pending Tasks (5 verifications, 3 reviews)
└── System Status (operational)
Nav: Dashboard* | Users | Content | Reports | Settings
```

### Lecturer Dashboard
```
Header [ACADEMIC YEAR] My Classes [Faculty]
├── Faculty ID Card (red background)
├── Active Classes (4) | Total Students  
├── Pending Grading (12) + warning
├── This Semester's Classes (CS402, CS305, CS101)
├── Recent Submissions (on-time, late)
└── Gradebook Status
Nav: Dashboard* | Classes | Students | Grades | Resources
```

### Alumni Dashboard
```
Header [CLASS OF 2021] Alumni Hub [5 Years]
├── Alumni ID Card (red background + current role)
├── Network Size (342 connections)
├── Job Matches (8 in field)
├── Upcoming Events (Networking, Reunion)
├── Featured Jobs (TechCorp, InnovateLabs)
└── Alumni Achievement Story
Nav: Dashboard* | Profile | Events | Jobs | Network
```

---

## 🎨 Design System Highlights

### Colors
- **Primary Red:** `#af0f24` - Brand authority and CTAs
- **Surface:** `#f9f9f9` - Clean, gallery-white background
- **On-Surface:** `#1a1c1c` - Deep charcoal text
- **Containers:** `#f3f3f3`, `#ffffff` - Tonal variation (no borders!)

### Typography
- **Headlines:** Manrope (geometric precision)
- **Body:** Inter (maximum readability)
- **Pattern:** Bold, uppercase labels in primary red

### Components
- Big red ID cards with grid patterns (Role-specific)
- Metric cards with trend indicators
- Clean list items with left-side accent bars
- Glassmorphism for floating elements
- Material Symbols icons throughout

### Design Principles
1. ✅ **No 1px Borders** - Use tonal shifts instead
2. ✅ **Sharp Corners** - 0px, 2px, or 4px (never rounded pills)
3. ✅ **Sidebar Motif** - Red bar + headline hierarchy
4. ✅ **Physical Card Aesthetic** - Grid overlays, institutional branding
5. ✅ **Editorial Style** - Magazine-like layout and typography

---

## 📋 Implementation Roadmap

**8-Week Development Plan**

| Week | Phase | Focus | Deliverable |
|------|-------|-------|-------------|
| W1 | Foundation | Base components | Header, PageHeader, Button |
| W2 | Shared | Reusable components | RoleCard, StatCard, BottomNav |
| W3 | Student | First dashboard | Complete + API integration |
| W4 | Staff | Second dashboard | Complete + API integration |
| W5 | Lecturer | Third dashboard | Complete + API integration |
| W6 | Alumni | Fourth dashboard | Complete + API integration |
| W7 | Integration | Role-based routing | Auth flow, role detection |
| W8 | Polish | QA & optimization | Accessibility, performance |

**See [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) for detailed task breakdown.**

---

## 🏗️ Component Architecture

```
Components by Type:
├── Layout (Header, PageHeader, BottomNav)
├── Content (RoleCard, StatCard, ContentCard)
├── UI (Button, Card, Input, Icon)
└── Pages (StudentDashboard, StaffDashboard, etc.)

Located in: src/components/
```

---

## 🔗 API Integration

### Frontend connects to backend endpoints:
- **Authentication:** `/api/auth/token/`, `/api/auth/token/refresh/`, `/api/auth/logout/`
- **Students:** `/api/students/me/`, `/api/students/me/stats/`, `/api/students/me/schedule/`
- **Staff:** `/api/staff/me/`, `/api/users/`, `/api/posts/`
- **Lecturers:** `/api/lecturers/me/`, `/api/lecturers/me/classes/`, `/api/grades/pending/`
- **Alumni:** `/api/alumni/me/`, `/api/alumni/events/`, `/api/alumni/jobs/`

**See [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) for complete endpoint reference.**

---

## 🎓 Learning Resources

### Design Files
- **[DESIGN.md](DESIGN.md)** - Core design language & principles
- **[ROLE_DASHBOARDS.md](ROLE_DASHBOARDS.md)** - Role-specific requirements

### Development
- **[DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md)** - Implementation steps with code examples
- **[FRONTEND_SETUP.md](FRONTEND_SETUP.md)** - Feature overview & code patterns

### Official Docs
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev)
- [TailwindCSS](https://tailwindcss.com)
- [Material Symbols](https://fonts.google.com/icons)

---

## ✅ Development Checklist

- [ ] Review DESIGN.md (design principles)
- [ ] Review ROLE_DASHBOARDS.md (requirements)
- [ ] View HTML mockups in browser
- [ ] Follow DEVELOPMENT_GUIDE.md phases
- [ ] Build components incrementally
- [ ] Test accessibility (WCAG AA)
- [ ] Test cross-browser compatibility
- [ ] Test performance & optimization

---

## 📞 Quick Reference

| Need Help? | See |
|-----------|-----|
| Design rules | [DESIGN.md](DESIGN.md) |
| What to build | [ROLE_DASHBOARDS.md](ROLE_DASHBOARDS.md) |
| How to build | [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) |
| Visual mockups | [HTML files](STUDENT_DASHBOARD.html) |
| Setup steps | [FRONTEND_SETUP.md](FRONTEND_SETUP.md) |
| Project overview | [../README.md](../README.md) |

---

**Ready to start building? Open [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) and begin with Week 1!** 🚀
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
