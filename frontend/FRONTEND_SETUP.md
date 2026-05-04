# ITNB Hub - Frontend Admin Dashboard

Complete React + TypeScript admin dashboard for the ITNB Hub system, featuring user management, certificates, benefits, and more.

## Overview

This is a modern admin dashboard built with:
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Lightning-fast build tool
- **TailwindCSS 4** - Utility-first styling
- **shadcn/ui** - High-quality UI components
- **TanStack React Query** - Server state management
- **React Router** - Client-side routing
- **Axios** - HTTP client with automatic token refresh
- **Zod** - Schema validation
- **Sonner** - Toast notifications

## Project Structure

```
frontend/
├── src/
│   ├── api/                     # API client modules
│   │   ├── auth.ts             # Authentication endpoints
│   │   ├── users.ts            # User management endpoints
│   │   └── benefits.ts         # Benefits endpoints
│   ├── components/             # Reusable React components
│   │   ├── admin-layout.tsx    # Main dashboard layout
│   │   ├── admin-sidebar.tsx   # Sidebar navigation
│   │   ├── admin-header.tsx    # Dashboard header
│   │   └── protected-route.tsx # Route guard
│   ├── contexts/               # React contexts
│   │   └── auth-context.tsx    # Authentication context
│   ├── hooks/                  # Custom React hooks
│   │   ├── use-auth.ts        # Auth context hook
│   │   ├── use-auth-query.ts  # Auth queries
│   │   └── use-users-query.ts # User queries
│   ├── lib/                    # Utilities and helpers
│   │   ├── api.ts             # Axios configuration
│   │   ├── env.ts             # Environment variables
│   │   ├── query-client.ts    # React Query config
│   │   ├── toast.ts           # Toast notifications
│   │   └── utils.ts           # Helper functions
│   ├── pages/                  # Page components
│   │   ├── login-page.tsx     # Login page
│   │   ├── admin-dashboard-page.tsx  # Admin dashboard
│   │   └── admin-users-page.tsx      # Users management
│   ├── types/                  # TypeScript type definitions
│   │   ├── api.ts             # API response types
│   │   └── auth.ts            # Authentication types
│   ├── App.tsx                # Main app with routing
│   ├── main.tsx               # Entry point
│   └── index.css             # Global styles
├── public/                    # Static assets
├── .env                       # Environment variables
├── .env.example              # Environment template
├── tailwind.config.ts        # TailwindCSS config
├── tsconfig.json             # TypeScript config
├── vite.config.ts            # Vite config
└── package.json              # Dependencies
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd frontend
npm install
# or
bun install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update as needed:

```bash
cp .env.example .env
```

```env
# Backend API
VITE_API_URL=http://localhost:8000

# App settings
VITE_APP_NAME=ITNB Hub Admin
VITE_APP_URL=http://localhost:5173
```

### 3. Start Development Server

```bash
npm run dev
# or
bun run dev
```

The app will be available at `http://localhost:5173`

### 4. Build for Production

```bash
npm run build
# or
bun run build
```

## Code Conventions

Following the example project, this frontend adheres to these patterns:

### 1. API Client (Modular Organization)

Each feature has its own API module:

```typescript
// src/api/users.ts
export interface UserFilters { ... }
export async function listUsers(filters?: UserFilters) { ... }
export async function getUser(id: number) { ... }
export async function createUser(userData: Partial<User>) { ... }
```

### 2. Custom Hooks (React Query)

Hooks wrap API calls with caching and state management:

```typescript
// src/hooks/use-users-query.ts
export function useUsersQuery(
  filters?: UserFilters,
  options?: UseQueryOptions<UserListResponse, Error>
): UseQueryResult<UserListResponse, Error> {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: () => listUsers(filters),
    staleTime: 1000 * 60 * 5,
    ...options,
  })
}
```

### 3. Context for Shared State

React Context for authentication and global state:

```typescript
// src/contexts/auth-context.tsx
export function AuthProvider({ children }: AuthProviderProps) {
  const { data: user, isLoading } = useMeQuery()
  // ... auth logic
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
```

### 4. Type Safety

TypeScript types for all API responses:

```typescript
// src/types/api.ts
export interface ApiSuccessResponse<T = unknown> {
  code: string
  detail?: string
  data?: T
}

// src/types/auth.ts
export interface User {
  id: number
  email: string
  role: UserRole
  // ... other fields
}
```

### 5. Component Structure

- Functional components with hooks
- TailwindCSS for styling (no CSS modules)
- Props destructuring with TypeScript
- Error boundaries for reliability

### 6. Error Handling

- API errors caught and displayed via toast notifications
- Automatic token refresh on 401 responses
- User-friendly error messages

## Connecting to Backend

### JWT Authentication

The app uses JWT tokens for authentication:

1. **Login**: `POST /api/auth/token/` → returns access token
2. **Store**: Token stored in `localStorage`
3. **Auto-refresh**: 401 responses trigger `POST /api/auth/token/refresh/`
4. **Logout**: `POST /api/auth/logout/` → clears token

### API Endpoints Used

#### Authentication
- `POST /api/auth/token/` - Login
- `POST /api/auth/token/refresh/` - Refresh token
- `POST /api/auth/logout/` - Logout
- `GET /api/auth/me/` - Get current user

#### Users
- `GET /api/users/` - List users (paginated, filterable)
- `GET /api/users/{id}/` - Get user
- `POST /api/users/` - Create user (admin only)
- `PATCH /api/users/{id}/` - Update user
- `DELETE /api/users/{id}/` - Delete user
- `POST /api/users/{id}/activate/` - Activate user
- `POST /api/users/{id}/deactivate/` - Deactivate user

#### Benefits
- `GET /api/benefits/` - List benefits (filtered by user role)
- `GET /api/benefits/{id}/` - Get benefit
- `GET /api/benefit-categories/` - List categories
- `POST /api/benefit-categories/` - Create category (staff only)

## Feature Status

### ✅ Completed
- Authentication (login/logout)
- Admin dashboard overview
- User management (list, pagination, filtering)
- User activation/deactivation
- Protected routes
- Toast notifications
- Responsive design

### 🚀 Coming Soon (Planned)
- Certificate management
- Benefits management
- Posts/News management
- Events management
- Settings page
- Staff dashboard
- Lecturer dashboard
- Student dashboard
- Alumni dashboard

## Best Practices Implemented

1. **Type Safety**: Full TypeScript coverage
2. **Error Handling**: Try-catch blocks with user feedback
3. **Loading States**: Skeleton/loading indicators
4. **Pagination**: Server-side pagination support
5. **Filtering**: Dynamic filter UI and API support
6. **Caching**: React Query for efficient data management
7. **Session Management**: Auto token refresh, logout on 401
8. **Responsive Design**: Mobile-first TailwindCSS mixin
9. **Semantic HTML**: Accessibility first
10. **Component Reusability**: Modular component design

## Development Workflow

### Add a New Feature

1. **Create API client** (`src/api/feature.ts`)
   ```typescript
   export async function getFeatures(): Promise<Feature[]> {
     const { data } = await api.get<ApiSuccessResponse<Feature[]>>("/api/features/")
     return data.data || []
   }
   ```

2. **Create React Query hook** (`src/hooks/use-features-query.ts`)
   ```typescript
   export function useFeaturesQuery() {
     return useQuery({
       queryKey: ["features"],
       queryFn: getFeatures,
     })
   }
   ```

3. **Create page component** (`src/pages/features-page.tsx`)
   ```typescript
   export function FeaturesPage() {
     const { data, isLoading } = useFeaturesQuery()
     return <div>{ /* render features */ }</div>
   }
   ```

4. **Add route** (`src/App.tsx`)
   ```typescript
   <Route path="features" element={<FeaturesPage />} />
   ```

### Testing Locally

```bash
# Terminal 1: Start backend
cd backend
python manage.py runserver

# Terminal 2: Start frontend
cd frontend
npm run dev
```

Visit `http://localhost:5173/login` and login with your admin credentials.

## Troubleshooting

### Issue: "API connection refused"
**Solution**: Make sure backend is running on `http://localhost:8000`

### Issue: "401 Unauthorized"
**Solution**: Check token in localStorage, try logging in again

### Issue: "CORS errors"
**Solution**: Backend `ALLOWED_HOSTS` must include frontend URL

### Issue: Module not found errors
**Solution**: Check import paths use `@/` alias, not relative paths

## Next Steps

1. **Install shadcn CLI** (optional, for adding pre-built components):
   ```bash
   npm install -D shadcn-ui@latest
   npx shadcn-ui@latest init
   ```

2. **Add more admin pages**:
   - Certificates management
   - Benefits management
   - Posts/News management
   - Events management

3. **Create other dashboards**:
   - Staff dashboard
   - Lecturer dashboard
   - Student dashboard
   - Alumni dashboard

4. **Advanced features**:
   - Real-time notifications (WebSocket)
   - User search with debouncing
   - Bulk user import/export
   - Advanced filtering
   - Report generation

## Documentation References

- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [React Router Docs](https://reactrouter.com)
- [TanStack React Query](https://tanstack.com/query/latest)
- [Axios Docs](https://axios-http.com)

## Support

For issues or questions:
1. Check existing issues in GitHub
2. Review the example project for patterns
3. Consult the backend API documentation
4. Check browser console for errors

---

**Ready to build?** Start with `npm run dev` and happy coding! 🚀
