# Frontend Development Guide - Role-Based Dashboards

Complete guide for implementing the Student, Staff, Lecturer, and Alumni dashboards following the Institutional Prestige design system.

---

## 📚 Documentation Overview

| Document | Purpose |
|----------|---------|
| [DESIGN.md](DESIGN.md) | Core design system specification & rules |
| [ROLE_DASHBOARDS.md](ROLE_DASHBOARDS.md) | Detailed specs for each role's dashboard |
| **This Guide** | Implementation roadmap & best practices |
| [STUDENT_DASHBOARD.html](STUDENT_DASHBOARD.html) | HTML reference (provided) |
| [STAFF_DASHBOARD.html](STAFF_DASHBOARD.html) | HTML mockup |
| [LECTURER_DASHBOARD.html](LECTURER_DASHBOARD.html) | HTML mockup |
| [ALUMNI_DASHBOARD.html](ALUMNI_DASHBOARD.html) | HTML mockup |

---

## 🏗️ Architecture Overview

```
src/
├── components/
│   ├── common/
│   │   ├── Header.tsx           # Top app bar
│   │   ├── PageHeader.tsx       # Sidebar motif + title
│   │   ├── BottomNav.tsx        # Role-based navigation
│   │   ├── Button.tsx           # Button variants
│   │   └── Card.tsx             # Base card component
│   │
│   ├── shared/
│   │   ├── RoleCard.tsx         # Dynamic ID card
│   │   ├── StatCard.tsx         # Metric cards
│   │   ├── ContentCard.tsx      # List item card
│   │   └── EmptyState.tsx       # Empty state
│   │
│   └── dashboard/
│       ├── student/
│       │   ├── StudentDashboard.tsx
│       │   ├── StudentIdCard.tsx
│       │   ├── StudentStats.tsx
│       │   └── StudentSchedule.tsx
│       │
│       ├── staff/
│       │   ├── StaffDashboard.tsx
│       │   ├── StaffCard.tsx
│       │   ├── StaffStats.tsx
│       │   └── PendingTasks.tsx
│       │
│       ├── lecturer/
│       │   ├── LecturerDashboard.tsx
│       │   ├── LecturerCard.tsx
│       │   ├── ClassOverview.tsx
│       │   └── RecentSubmissions.tsx
│       │
│       └── alumni/
│           ├── AlumniDashboard.tsx
│           ├── AlumniCard.tsx
│           ├── NetworkStats.tsx
│           ├── EventsList.tsx
│           └── OpportunityBoard.tsx
│
├── hooks/
│   ├── use-user-role.ts         # Get current user role
│   └── use-dashboard-data.ts    # Fetch role-specific data
│
├── types/
│   └── dashboard.ts             # Dashboard-specific types
│
├── styles/
│   └── dashboard.css            # Shared styles
│
└── App.tsx                      # Main routing
```

---

## 🎯 Implementation Phases

### Phase 1: Foundation Components (Week 1)

#### Task 1: Setup & Base Styling
- [ ] Configure Tailwind with custom color tokens (already done in mockup)
- [ ] Create global CSS for typography (Manrope/Inter imports)
- [ ] Setup Material Symbols icon font
- [ ] Configure TailwindCSS `@apply` directives

```tsx
// src/styles/dashboard.css
@layer components {
  .sidebar-motif {
    @apply w-1 h-16 bg-primary mr-4;
  }
  
  .stat-card {
    @apply bg-surface-container-lowest p-6 shadow-[0px_4px_32px_rgba(175,15,36,0.02)];
  }
  
  .content-card {
    @apply bg-surface-container-low p-4 flex gap-4 items-center;
  }
}
```

#### Task 2: Common Components
- [ ] **Header.tsx** - Top app bar with menu icon, logo, profile avatar
- [ ] **PageHeader.tsx** - Sidebar motif + headline + status badge
- [ ] **Button.tsx** - Primary button (solid red), Secondary (ghost)
- [ ] **Card.tsx** - Base card with white background + shadow

```tsx
// src/components/common/Header.tsx
export interface HeaderProps {
  onMenuClick?: () => void;
  profileImage?: string;
}

export function Header({ onMenuClick, profileImage }: HeaderProps) {
  return (
    <header className="fixed top-0 w-full z-50 bg-surface flex justify-between items-center px-6 h-16 shadow-sm">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="p-2">
          <span className="material-symbols-outlined text-primary">menu</span>
        </button>
        <span className="tracking-tighter font-black text-primary text-xl">IT&B HUB</span>
      </div>
      <div className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant/20">
        <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
      </div>
    </header>
  );
}
```

#### Task 3: Shared Dashboard Components
- [ ] **RoleCard.tsx** - Red ID card (accepts template props for role variants)
- [ ] **StatCard.tsx** - Metric card with trend indicator
- [ ] **ContentCard.tsx** - List item card with icon + meta + action

---

### Phase 2: Role-Based Components (Week 2)

#### Student Dashboard Components
- [ ] **StudentDashboard.tsx** - Main layout
- [ ] **StudentIdCard.tsx** - Wraps RoleCard with student data
- [ ] **StudentStats.tsx** - GPA + Credits cards
- [ ] **StudentSchedule.tsx** - Today's schedule list
- [ ] **CampusSessionCard.tsx** - Dark status section

#### Staff Dashboard Components
- [ ] **StaffDashboard.tsx** - Main layout
- [ ] **StaffCard.tsx** - Staff ID card variant
- [ ] **StaffStats.tsx** - Active users + Posts published
- [ ] **PendingTasks.tsx** - Task list with priority
- [ ] **SystemHealthCard.tsx** - Status indicator

#### Lecturer Dashboard Components
- [ ] **LecturerDashboard.tsx** - Main layout
- [ ] **LecturerCard.tsx** - Faculty ID card variant
- [ ] **ClassOverview.tsx** - Class stats cards
- [ ] **ClassList.tsx** - This semester's classes
- [ ] **SubmissionsList.tsx** - Recent submissions

#### Alumni Dashboard Components
- [ ] **AlumniDashboard.tsx** - Main layout
- [ ] **AlumniCard.tsx** - Alumni ID card variant
- [ ] **NetworkStats.tsx** - Network + job matches
- [ ] **EventsList.tsx** - Upcoming alumni events
- [ ] **OpportunityBoard.tsx** - Job opportunities

---

### Phase 3: Navigation & Integration (Week 3)

#### Task 1: Routing & Authentication
```tsx
// src/App.tsx
import { useAuth } from './hooks/use-auth.ts';
import StudentDashboard from './pages/StudentDashboard';
import StaffDashboard from './pages/StaffDashboard';
import LecturerDashboard from './pages/LecturerDashboard';
import AlumniDashboard from './pages/AlumniDashboard';

export function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route 
        path="/dashboard" 
        element={<ProtectedRoute><DashboardRouter user={user} /></ProtectedRoute>}
      />
    </Routes>
  );
}

function DashboardRouter({ user }: { user: User }) {
  switch (user.role) {
    case 'student':
      return <StudentDashboard />;
    case 'staff':
      return <StaffDashboard />;
    case 'lecturer':
      return <LecturerDashboard />;
    case 'alumni':
      return <AlumniDashboard />;
    default:
      return <LoginPage />;
  }
}
```

#### Task 2: BottomNav Component
- [ ] Create dynamic bottom navigation based on role
- [ ] Show/hide nav items per role
- [ ] Handle active state (primary red, scaled)

```tsx
// src/components/common/BottomNav.tsx
export interface BottomNavItem {
  icon: string;
  label: string;
  href: string;
}

export interface BottomNavProps {
  items: BottomNavItem[];
  activeTab: string;
  onTabChange: (href: string) => void;
}

export function BottomNav({ items, activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 w-full h-20 px-4 flex justify-around items-center bg-white/80 backdrop-blur-md shadow-[0px_-4px_32px_rgba(175,15,36,0.04)] z-50">
      {items.map(item => (
        <button
          key={item.href}
          onClick={() => onTabChange(item.href)}
          className={`flex flex-col items-center justify-center text-[10px] font-bold tracking-tight ${
            activeTab === item.href
              ? 'text-primary scale-110'
              : 'text-gray-400 opacity-60 hover:opacity-100'
          }`}
        >
          <span className="material-symbols-outlined mb-1" style={activeTab === item.href ? { fontVariationSettings: "'FILL' 1" } : {}}>
            {item.icon}
          </span>
          {item.label}
        </button>
      ))}
    </nav>
  );
}
```

#### Task 3: API Integration
- [ ] Create role-specific API hooks
- [ ] Create dashboard data fetching hooks
- [ ] Handle loading & error states

```tsx
// src/hooks/use-student-dashboard.ts
import { useQuery } from '@tanstack/react-query';

export function useStudentDashboard() {
  const { data: student, isLoading: studentLoading } = useQuery({
    queryKey: ['student', 'profile'],
    queryFn: () => api.get('/api/students/me/'),
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['student', 'stats'],
    queryFn: () => api.get('/api/students/me/stats/'),
  });

  const { data: schedule, isLoading: scheduleLoading } = useQuery({
    queryKey: ['student', 'schedule'],
    queryFn: () => api.get('/api/students/me/schedule/'),
  });

  return {
    student: student?.data,
    stats: stats?.data,
    schedule: schedule?.data,
    isLoading: studentLoading || statsLoading || scheduleLoading,
  };
}
```

---

## 🎨 Component Examples

### RoleCard Component
```tsx
// src/components/shared/RoleCard.tsx
export interface RoleCardData {
  cardTitle: string;        // "STUDENT ID CARD", "STAFF ID CARD", etc.
  name: string;
  subtitle: string;
  idLabel: string;          // "ID NUMBER", "EMPLOYEE ID", "FACULTY ID", "ALUMNI ID"
  idValue: string;
  profileImage?: string;
  institutionText?: string; // Vertical text
  bottomLeftIcon: string;
  bottomRightContent?: React.ReactNode;
}

export function RoleCard(props: RoleCardData) {
  return (
    <div className="bg-primary text-white p-6 shadow-[0px_4px_32px_rgba(175,15,36,0.15)] overflow-hidden relative min-h-[220px]">
      {/* Grid pattern background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <svg height="100%" width="100%">
          <defs>
            <pattern height="40" id={`grid-${props.cardTitle}`} patternUnits="userSpaceOnUse" width="40">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"></path>
            </pattern>
          </defs>
          <rect fill={`url(#grid-${props.cardTitle})`} height="100%" width="100%"></rect>
        </svg>
      </div>

      {/* Main content */}
      <div className="flex justify-between items-start relative z-10">
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] opacity-80 mb-1">{props.cardTitle}</p>
            <p className="text-xl font-bold tracking-tight">{props.name}</p>
            <p className="text-xs opacity-90 font-medium">{props.subtitle}</p>
          </div>
          <div className="pt-2">
            <p className="text-[10px] font-bold tracking-[0.2em] opacity-80 mb-1">{props.idLabel}</p>
            <p className="text-lg font-mono tracking-wider font-bold">{props.idValue}</p>
          </div>
        </div>

        {/* Right side: Photo + text */}
        <div className="flex flex-col items-end gap-2">
          {props.profileImage && (
            <div className="w-20 h-24 bg-white/10 backdrop-blur-sm p-1 border border-white/20 overflow-hidden">
              <img src={props.profileImage} alt="Profile" className="w-full h-full object-cover grayscale brightness-110" />
            </div>
          )}
          {props.institutionText && (
            <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }} className="text-[8px] font-bold tracking-[0.4em] opacity-40">
              {props.institutionText}
            </div>
          )}
        </div>
      </div>

      {/* Bottom left: Icon + label */}
      <div className="absolute bottom-4 left-6 flex items-center gap-2">
        <span className="material-symbols-outlined text-[16px]">{props.bottomLeftIcon}</span>
        <span className="text-[10px] font-bold">{props.cardTitle}</span>
      </div>

      {/* Bottom right: Custom content */}
      {props.bottomRightContent && (
        <div className="absolute bottom-4 right-6">
          {props.bottomRightContent}
        </div>
      )}
    </div>
  );
}
```

### StatCard Component
```tsx
// src/components/shared/StatCard.tsx
export interface StatCardProps {
  label: string;
  value: string | number;
  trend?: {
    direction: 'up' | 'down';
    value: string;
    color?: 'green' | 'orange' | 'red';
  };
  progress?: {
    current: number;
    total: number;
    label: string;
  };
}

export function StatCard({ label, value, trend, progress }: StatCardProps) {
  return (
    <div className="bg-surface-container-lowest p-6 flex flex-col justify-between shadow-[0px_4px_32px_rgba(175,15,36,0.02)]">
      <div>
        <p className="text-primary font-bold text-[10px] tracking-widest uppercase mb-1">{label}</p>
        <h3 className="text-3xl font-extrabold text-on-surface">{value}</h3>
      </div>
      <div className="mt-4">
        {trend && (
          <div className={`flex items-center gap-1 text-${trend.color || 'primary'}-600`}>
            <span className="material-symbols-outlined text-sm">
              {trend.direction === 'up' ? 'trending_up' : 'trending_down'}
            </span>
            <span className="text-[10px] font-bold">{trend.value}</span>
          </div>
        )}
        {progress && (
          <>
            <div className="w-full bg-surface-container-high h-1">
              <div 
                className="bg-primary h-full" 
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              ></div>
            </div>
            <p className="text-[10px] font-bold text-secondary mt-1">{progress.label}</p>
          </>
        )}
      </div>
    </div>
  );
}
```

---

## 📋 Development Checklist

### Week 1: Foundation
- [ ] Setup TypeScript types for dashboard
- [ ] Create Header component
- [ ] Create PageHeader component
- [ ] Create Button component (primary + secondary)
- [ ] Create base Card component
- [ ] Configure Tailwind + custom colors
- [ ] Setup Material Symbols font

### Week 2: Shared Components
- [ ] Create RoleCard component (dynamic ID card)
- [ ] Create StatCard component
- [ ] Create ContentCard component
- [ ] Create BottomNav component
- [ ] Setup useUserRole hook
- [ ] Create dashboard layout wrapper

### Week 3: Student Dashboard
- [ ] Create StudentDashboard page
- [ ] Build StudentIdCard section
- [ ] Build StudentStats section
- [ ] Build StudentSchedule section
- [ ] Build CampusSessionCard section
- [ ] Integrate with API
- [ ] Add loading/error states
- [ ] Test with sample data

### Week 4: Staff Dashboard
- [ ] Create StaffDashboard page
- [ ] Build StaffCard section
- [ ] Build StaffStats section
- [ ] Build PendingTasks section
- [ ] Build SystemHealthCard section
- [ ] Adapt bottom nav for staff
- [ ] Integrate with API
- [ ] Test with sample data

### Week 5: Lecturer Dashboard
- [ ] Create LecturerDashboard page
- [ ] Build LecturerCard section
- [ ] Build ClassOverview section
- [ ] Build ClassList section
- [ ] Build SubmissionsList section
- [ ] Adapt bottom nav for lecturer
- [ ] Integrate with API
- [ ] Test with sample data

### Week 6: Alumni Dashboard
- [ ] Create AlumniDashboard page
- [ ] Build AlumniCard section
- [ ] Build NetworkStats section
- [ ] Build EventsList section
- [ ] Build OpportunityBoard section
- [ ] Adapt bottom nav for alumni
- [ ] Integrate with API
- [ ] Test with sample data

### Week 7: Integration & Polish
- [ ] Implement role-based routing
- [ ] Add ProtectedRoute component
- [ ] Implement navigation between sections
- [ ] Add loading skeleton screens
- [ ] Add error boundaries
- [ ] Implement error handling & toasts
- [ ] Add empty states
- [ ] Performance optimization

### Week 8: Testing & Refinement
- [ ] Test all dashboards across devices
- [ ] Cross-browser testing
- [ ] Accessibility audit (WCAG AA)
- [ ] Performance testing
- [ ] User testing feedback
- [ ] Bug fixes & refinements
- [ ] Documentation updates

---

## 🎯 Design Consistency Checklist

### For Every Component
- [ ] Uses correct color tokens (primary, surface, on-surface, etc.)
- [ ] Typography follows hierarchy (Manrope for headlines, Inter for body)
- [ ] Spacing uses 4px base unit multiples
- [ ] No 1px borders (use tonal shifts instead)
- [ ] Corners are 0px, 2px, or 4px (not rounded pills)
- [ ] Shadows use primary-tinted color: `rgba(175, 15, 36, 0.04)` - `0.15`
- [ ] Icons use Material Symbols
- [ ] Maintains visual hierarchy through weight + size

### For Every Page
- [ ] Header motif (red bar + title + status)
- [ ] PageHeader uses sidebar motif
- [ ] Bottom navigation matches role
- [ ] Main content has max-w-md on mobile
- [ ] Padding is consistent (16px horizontal)
- [ ] Section gaps are 40px (10 x 4px)
- [ ] Loading states show skeleton matching layout
- [ ] Error states include helpful messages

---

## 🚀 API Endpoints Referenced

```
GET  /api/students/me/              # Student profile
GET  /api/students/me/stats/        # GPA, credits
GET  /api/students/me/schedule/     # Today's classes
GET  /api/students/me/certificates/ # Student certs

GET  /api/staff/me/                 # Staff profile
GET  /api/users/                    # List users (paginated)
GET  /api/posts/                    # Published posts
GET  /api/users/pending-approval/   # Pending reviews

GET  /api/lecturers/me/             # Faculty profile
GET  /api/lecturers/me/classes/     # My classes
GET  /api/lecturers/me/submissions/ # Recent submissions
GET  /api/grades/pending/           # Pending grading

GET  /api/alumni/me/                # Alumni profile
GET  /api/alumni/network/           # Network connections
GET  /api/alumni/events/            # Upcoming events
GET  /api/alumni/jobs/              # Job opportunities
```

---

## 📖 References

- **Design System:** [DESIGN.md](DESIGN.md)
- **Role Specifications:** [ROLE_DASHBOARDS.md](ROLE_DASHBOARDS.md)
- **React Query:** https://tanstack.com/query/latest
- **Tailwind CSS:** https://tailwindcss.com
- **Material Symbols:** https://fonts.google.com/icons

---

**Ready to build? Start with Phase 1, Week 1, Task 1!** 🚀
