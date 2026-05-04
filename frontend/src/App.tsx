import { Suspense, lazy } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "sonner"
import { queryClient } from "@/lib/query-client"
import { AuthProvider } from "@/contexts/auth-context"
import { ProtectedRoute } from "@/components/protected-route"

const AdminLayout = lazy(() => import("@/components/admin-layout").then((m) => ({ default: m.AdminLayout })))
const LoginPage = lazy(() => import("@/pages/login-page").then((m) => ({ default: m.LoginPage })))
const AdminLoginPage = lazy(() => import("@/pages/admin-login-page").then((m) => ({ default: m.AdminLoginPage })))
const ForgotPasswordPage = lazy(() => import("@/pages/forgot-password-page").then((m) => ({ default: m.ForgotPasswordPage })))
const ResetPasswordPage = lazy(() => import("@/pages/reset-password-page").then((m) => ({ default: m.ResetPasswordPage })))
const AdminDashboardPage = lazy(() => import("@/pages/admin-dashboard-page").then((m) => ({ default: m.AdminDashboardPage })))
const AdminUsersPage = lazy(() => import("@/pages/admin-users-page").then((m) => ({ default: m.AdminUsersPage })))
const AdminPlaceholderPage = lazy(() => import("@/pages/admin-placeholder-page").then((m) => ({ default: m.AdminPlaceholderPage })))
const StudentDashboard = lazy(() => import("@/pages/student/dashboard").then((m) => ({ default: m.StudentDashboard })))
const StaffDashboardPage = lazy(() => import("@/pages/staff-dashboard-page").then((m) => ({ default: m.StaffDashboardPage })))
const LecturerDashboardPage = lazy(() => import("@/pages/lecturer-dashboard-page").then((m) => ({ default: m.LecturerDashboardPage })))
const StudentIDPage = lazy(() => import("@/pages/student/id").then((m) => ({ default: m.StudentIDPage })))
const StudentCertificatesPage = lazy(() => import("@/pages/student/certificates").then((m) => ({ default: m.StudentCertificatesPage })))
const StudentNewsPage = lazy(() => import("@/pages/student/news").then((m) => ({ default: m.StudentNewsPage })))
const StudentPerksPage = lazy(() => import("@/pages/student/perks").then((m) => ({ default: m.StudentPerksPage })))
const NewsPage = lazy(() => import("@/pages/shared/news-page").then((m) => ({ default: m.NewsPage })))
const PerksPage = lazy(() => import("@/pages/shared/perks-page").then((m) => ({ default: m.PerksPage })))
const NewsDetailPage = lazy(() => import("@/pages/shared/news-detail-page").then((m) => ({ default: m.NewsDetailPage })))
const PerkDetailPage = lazy(() => import("@/pages/shared/perk-detail-page").then((m) => ({ default: m.PerkDetailPage })))
const CertificateDetailPage = lazy(() => import("@/pages/shared/certificate-detail-page").then((m) => ({ default: m.CertificateDetailPage })))
const ProfilePage = lazy(() => import("@/pages/shared/profile-page").then((m) => ({ default: m.ProfilePage })))
const ChangePasswordPage = lazy(() => import("@/pages/shared/change-password-page").then((m) => ({ default: m.ChangePasswordPage })))

/**
 * Main App component with routing
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Suspense
            fallback={
              <div className="flex min-h-screen items-center justify-center bg-[#f9f9f9] text-sm font-semibold text-[#5f5e5e]">
                Loading...
              </div>
            }
          >
            <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Admin Routes */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute loginPath="/admin/login" allowedRoles={["ADMIN"]}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="certificates" element={<AdminPlaceholderPage title="Certificates" description="Issue, validate, and manage institutional certificates for students and staff." />} />
              <Route path="benefits" element={<AdminPlaceholderPage title="Course Material & Benefits" description="Curate content catalogs, perks, and academic support materials for role-based access." />} />
              <Route path="posts" element={<AdminPlaceholderPage title="Campus News" description="Publish institutional announcements and long-form updates for all role portals." />} />
              <Route path="events" element={<AdminPlaceholderPage title="Attendance & Events" description="Coordinate attendance operations and upcoming event schedules with status tracking." />} />
              <Route path="settings" element={<AdminPlaceholderPage title="System Settings" description="Configure administrative policies, permissions, and portal defaults." />} />
            </Route>

            {/* Staff Routes */}
            <Route
              path="/staff/*"
              element={
                <ProtectedRoute allowedRoles={["STAFF"]}>
                  <StaffDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/news"
              element={
                <ProtectedRoute allowedRoles={["STAFF"]}>
                  <NewsPage role="STAFF" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/profile"
              element={
                <ProtectedRoute allowedRoles={["STAFF"]}>
                  <ProfilePage role="STAFF" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/change-password"
              element={
                <ProtectedRoute allowedRoles={["STAFF"]}>
                  <ChangePasswordPage role="STAFF" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/news/:id"
              element={
                <ProtectedRoute allowedRoles={["STAFF"]}>
                  <NewsDetailPage role="STAFF" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/perks"
              element={
                <ProtectedRoute allowedRoles={["STAFF"]}>
                  <PerksPage role="STAFF" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/perks/:id"
              element={
                <ProtectedRoute allowedRoles={["STAFF"]}>
                  <PerkDetailPage role="STAFF" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lecturer/*"
              element={
                <ProtectedRoute allowedRoles={["LECTURER"]}>
                  <LecturerDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lecturer/news"
              element={
                <ProtectedRoute allowedRoles={["LECTURER"]}>
                  <NewsPage role="LECTURER" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lecturer/profile"
              element={
                <ProtectedRoute allowedRoles={["LECTURER"]}>
                  <ProfilePage role="LECTURER" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lecturer/change-password"
              element={
                <ProtectedRoute allowedRoles={["LECTURER"]}>
                  <ChangePasswordPage role="LECTURER" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lecturer/news/:id"
              element={
                <ProtectedRoute allowedRoles={["LECTURER"]}>
                  <NewsDetailPage role="LECTURER" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lecturer/perks"
              element={
                <ProtectedRoute allowedRoles={["LECTURER"]}>
                  <PerksPage role="LECTURER" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lecturer/perks/:id"
              element={
                <ProtectedRoute allowedRoles={["LECTURER"]}>
                  <PerkDetailPage role="LECTURER" />
                </ProtectedRoute>
              }
            />
            
            {/* Student Routes */}
            <Route
              path="/student/*"
              element={
                <ProtectedRoute allowedRoles={["STUDENT"]}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute allowedRoles={["STUDENT"]}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/id"
              element={
                <ProtectedRoute allowedRoles={["STUDENT"]}>
                  <StudentIDPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/profile"
              element={
                <ProtectedRoute allowedRoles={["STUDENT"]}>
                  <ProfilePage role="STUDENT" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/change-password"
              element={
                <ProtectedRoute allowedRoles={["STUDENT"]}>
                  <ChangePasswordPage role="STUDENT" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/certificates"
              element={
                <ProtectedRoute allowedRoles={["STUDENT"]}>
                  <StudentCertificatesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/certificates/:id"
              element={
                <ProtectedRoute allowedRoles={["STUDENT"]}>
                  <CertificateDetailPage role="STUDENT" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/news"
              element={
                <ProtectedRoute allowedRoles={["STUDENT"]}>
                  <StudentNewsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/news/:id"
              element={
                <ProtectedRoute allowedRoles={["STUDENT"]}>
                  <NewsDetailPage role="STUDENT" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/perks"
              element={
                <ProtectedRoute allowedRoles={["STUDENT"]}>
                  <StudentPerksPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/perks/:id"
              element={
                <ProtectedRoute allowedRoles={["STUDENT"]}>
                  <PerkDetailPage role="STUDENT" />
                </ProtectedRoute>
              }
            />
            
            {/* Alumni Routes */}
            <Route
              path="/alumni/*"
              element={
                <ProtectedRoute allowedRoles={["ALUMNI"]}>
                  <div>Alumni Dashboard (Coming soon)</div>
                </ProtectedRoute>
              }
            />

            {/* Redirects */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>

          {/* Toast notifications */}
          <Toaster position="top-right" />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
