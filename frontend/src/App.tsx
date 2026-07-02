import { Suspense, lazy } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { QueryClientProvider } from "@tanstack/react-query"
import { queryClient } from "@/lib/query-client"
import { AuthProvider } from "@/contexts/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { AppToaster } from "@/components/ui/app-toaster"

const AdminLayout = lazy(() => import("@/components/admin-layout").then((m) => ({ default: m.AdminLayout })))
const LoginPage = lazy(() => import("@/pages/login-page").then((m) => ({ default: m.LoginPage })))
const AdminLoginPage = lazy(() => import("@/pages/admin-login-page").then((m) => ({ default: m.AdminLoginPage })))
const ForgotPasswordPage = lazy(() => import("@/pages/forgot-password-page").then((m) => ({ default: m.ForgotPasswordPage })))
const ResetPasswordPage = lazy(() => import("@/pages/reset-password-page").then((m) => ({ default: m.ResetPasswordPage })))
const AdminDashboardPage = lazy(() => import("@/pages/admin-dashboard-page").then((m) => ({ default: m.AdminDashboardPage })))
const AdminUsersPage = lazy(() => import("@/pages/admin-users-page").then((m) => ({ default: m.AdminUsersPage })))
const AdminRoleUsersListPage = lazy(() =>
  import("@/pages/admin-role-users-list-page").then((m) => ({ default: m.AdminRoleUsersListPage }))
)
const AdminRoleUsersCreatePage = lazy(() =>
  import("@/pages/admin-role-users-create-page").then((m) => ({ default: m.AdminRoleUsersCreatePage }))
)
const AdminRoleUsersEditPage = lazy(() =>
  import("@/pages/admin-role-users-edit-page").then((m) => ({ default: m.AdminRoleUsersEditPage }))
)
const AdminStudentRecordCreatePage = lazy(() =>
  import("@/pages/admin-student-record-create-page").then((m) => ({ default: m.AdminStudentRecordCreatePage }))
)
const AdminStudentRecordEditPage = lazy(() =>
  import("@/pages/admin-student-record-edit-page").then((m) => ({ default: m.AdminStudentRecordEditPage }))
)
const AdminPostsPage = lazy(() => import("@/pages/admin-posts-page").then((m) => ({ default: m.AdminPostsPage })))
const AdminPostCreatePage = lazy(() => import("@/pages/admin-post-create-page").then((m) => ({ default: m.AdminPostCreatePage })))
const AdminPostEditPage = lazy(() => import("@/pages/admin-post-edit-page").then((m) => ({ default: m.AdminPostEditPage })))
const AdminWebinarsPage = lazy(() => import("@/pages/admin-webinars-page").then((m) => ({ default: m.AdminWebinarsPage })))
const AdminWebinarCreatePage = lazy(() =>
  import("@/pages/admin-webinar-create-page").then((m) => ({ default: m.AdminWebinarCreatePage }))
)
const AdminWebinarEditPage = lazy(() =>
  import("@/pages/admin-webinar-edit-page").then((m) => ({ default: m.AdminWebinarEditPage }))
)
const AdminWebinarAttendancePage = lazy(() =>
  import("@/pages/admin-webinar-attendance-page").then((m) => ({ default: m.AdminWebinarAttendancePage }))
)
const AdminBenefitsPage = lazy(() => import("@/pages/admin-benefits-page").then((m) => ({ default: m.AdminBenefitsPage })))
const AdminBenefitCreatePage = lazy(() =>
  import("@/pages/admin-benefit-create-page").then((m) => ({ default: m.AdminBenefitCreatePage }))
)
const AdminBenefitEditPage = lazy(() =>
  import("@/pages/admin-benefit-edit-page").then((m) => ({ default: m.AdminBenefitEditPage }))
)
const AdminFooterInfoPage = lazy(() => import("@/pages/admin-footer-info-page").then((m) => ({ default: m.AdminFooterInfoPage })))
const AdminPlaceholderPage = lazy(() => import("@/pages/admin-placeholder-page").then((m) => ({ default: m.AdminPlaceholderPage })))
const AdminCertificatesPage = lazy(() =>
  import("@/pages/admin-certificates-page").then((m) => ({ default: m.AdminCertificatesPage }))
)
const AdminCertificateProgramCreatePage = lazy(() =>
  import("@/pages/admin-certificate-program-create-page").then((m) => ({ default: m.AdminCertificateProgramCreatePage }))
)
const AdminCertificateProgramDetailPage = lazy(() =>
  import("@/pages/admin-certificate-program-detail-page").then((m) => ({ default: m.AdminCertificateProgramDetailPage }))
)
const VerifyCardPage = lazy(() =>
  import("@/pages/verify-card-page").then((m) => ({ default: m.VerifyCardPage }))
)
const StudentEmailSetupPage = lazy(() =>
  import("@/pages/student-email-setup-page").then((m) => ({ default: m.StudentEmailSetupPage }))
)
const StudentDashboard = lazy(() => import("@/pages/student/dashboard").then((m) => ({ default: m.StudentDashboard })))
const StaffDashboardPage = lazy(() => import("@/pages/staff-dashboard-page").then((m) => ({ default: m.StaffDashboardPage })))
const LecturerDashboardPage = lazy(() => import("@/pages/lecturer-dashboard-page").then((m) => ({ default: m.LecturerDashboardPage })))
const StudentIDPage = lazy(() => import("@/pages/student/id").then((m) => ({ default: m.StudentIDPage })))
const StudentCertificatesPage = lazy(() => import("@/pages/student/certificates").then((m) => ({ default: m.StudentCertificatesPage })))
const StudentNewsPage = lazy(() => import("@/pages/student/news").then((m) => ({ default: m.StudentNewsPage })))
const StudentPerksPage = lazy(() => import("@/pages/student/perks").then((m) => ({ default: m.StudentPerksPage })))
const StudentScoresPage = lazy(() => import("@/pages/student/scores").then((m) => ({ default: m.StudentScoresPage })))
const NewsPage = lazy(() => import("@/pages/shared/news-page").then((m) => ({ default: m.NewsPage })))
const PerksPage = lazy(() => import("@/pages/shared/perks-page").then((m) => ({ default: m.PerksPage })))
const NewsDetailPage = lazy(() => import("@/pages/shared/news-detail-page").then((m) => ({ default: m.NewsDetailPage })))
const PerkDetailPage = lazy(() => import("@/pages/shared/perk-detail-page").then((m) => ({ default: m.PerkDetailPage })))
const CertificateDetailPage = lazy(() => import("@/pages/shared/certificate-detail-page").then((m) => ({ default: m.CertificateDetailPage })))
const ProfilePage = lazy(() => import("@/pages/shared/profile-page").then((m) => ({ default: m.ProfilePage })))
const ChangePasswordPage = lazy(() => import("@/pages/shared/change-password-page").then((m) => ({ default: m.ChangePasswordPage })))
const CredentialsPage = lazy(() => import("@/pages/shared/credentials-page").then((m) => ({ default: m.CredentialsPage })))
const MemberIdPage = lazy(() => import("@/pages/shared/member-id-page").then((m) => ({ default: m.MemberIdPage })))
const AlumniDashboardPage = lazy(() => import("@/pages/alumni/dashboard").then((m) => ({ default: m.AlumniDashboardPage })))

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
            <Route path="/verify-card/:cardNumber" element={<VerifyCardPage />} />

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
              <Route path="users/record/new" element={<AdminStudentRecordCreatePage />} />
              <Route path="users/record/:id/edit" element={<AdminStudentRecordEditPage />} />
              <Route path="users/:roleSegment/new" element={<AdminRoleUsersCreatePage />} />
              <Route path="users/:roleSegment/:id/edit" element={<AdminRoleUsersEditPage />} />
              <Route path="users/:roleSegment" element={<AdminRoleUsersListPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="profile" element={<ProfilePage role="ADMIN" />} />
              <Route path="change-password" element={<ChangePasswordPage role="ADMIN" />} />
              <Route path="posts/new" element={<AdminPostCreatePage />} />
              <Route path="posts/:id/edit" element={<AdminPostEditPage />} />
              <Route
                path="privacy-policy"
                element={
                  <AdminFooterInfoPage
                    title="Privacy Policy"
                    description="How IT&B Hub collects, uses, and protects institutional and personal information."
                    sections={[
                      {
                        heading: "Data Collection",
                        body: "We collect account and activity data required to operate the portal, including login details, role access metadata, and content interactions for platform reliability and accountability.",
                      },
                      {
                        heading: "Data Usage",
                        body: "Collected data is used for authentication, authorization, operational reporting, and institutional communication. Data is not used outside approved academic and administrative purposes.",
                      },
                      {
                        heading: "Security & Retention",
                        body: "Data is protected with role-based access controls and secure transport. Retention follows institutional policy and legal obligations, with periodic review for minimization and compliance.",
                      },
                    ]}
                  />
                }
              />
              <Route
                path="institutional-standards"
                element={
                  <AdminFooterInfoPage
                    title="Institutional Standards"
                    description="Operational and content standards that govern quality, consistency, and compliance across IT&B Hub."
                    sections={[
                      {
                        heading: "Content Governance",
                        body: "All published content must be accurate, role-appropriate, and approved by authorized personnel. Sensitive information must be reviewed before publication.",
                      },
                      {
                        heading: "Access & Accountability",
                        body: "Administrative actions are role-restricted and auditable. Users must operate under least-privilege principles and uphold professional conduct standards.",
                      },
                      {
                        heading: "Service Reliability",
                        body: "Teams should maintain reliable uptime, incident response procedures, and regular quality checks to ensure a secure and dependable user experience.",
                      },
                    ]}
                  />
                }
              />
              <Route
                path="staff-support"
                element={
                  <AdminFooterInfoPage
                    title="Staff Support"
                    description="Support guidance for administrative and operational staff using IT&B Hub."
                    sections={[
                      {
                        heading: "Technical Assistance",
                        body: "For platform issues, submit a support request including affected module, timestamp, and screenshots to speed up triage and resolution.",
                      },
                      {
                        heading: "Account & Access Requests",
                        body: "Role changes, account unlocks, and access requests must be approved through designated administrators and verified against institutional policy.",
                      },
                      {
                        heading: "Training & Documentation",
                        body: "Staff should refer to updated internal guides and onboarding documentation for workflow standards, publication procedures, and security best practices.",
                      },
                    ]}
                  />
                }
              />
              <Route path="certificates/new" element={<AdminCertificateProgramCreatePage />} />
              <Route path="certificates/:programId" element={<AdminCertificateProgramDetailPage />} />
              <Route path="certificates" element={<AdminCertificatesPage />} />
              <Route path="webinars/new" element={<AdminWebinarCreatePage />} />
              <Route path="webinars/:id/edit" element={<AdminWebinarEditPage />} />
              <Route path="webinars/:id/attendance" element={<AdminWebinarAttendancePage />} />
              <Route path="webinars" element={<AdminWebinarsPage />} />
              <Route path="benefits/new" element={<AdminBenefitCreatePage />} />
              <Route path="benefits/:id/edit" element={<AdminBenefitEditPage />} />
              <Route path="benefits" element={<AdminBenefitsPage />} />
              <Route path="posts" element={<AdminPostsPage />} />
              <Route path="events" element={<Navigate to="/admin/dashboard" replace />} />
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
              path="/student/setup-email"
              element={
                <ProtectedRoute allowedRoles={["STUDENT"]}>
                  <StudentEmailSetupPage />
                </ProtectedRoute>
              }
            />
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
              path="/student/scores"
              element={
                <ProtectedRoute allowedRoles={["STUDENT"]}>
                  <StudentScoresPage />
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
              path="/student/webinars"
              element={
                <ProtectedRoute allowedRoles={["STUDENT"]}>
                  <Navigate to="/student/certificates?tab=webinars" replace />
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
              path="/alumni/setup-email"
              element={
                <ProtectedRoute allowedRoles={["ALUMNI"]}>
                  <StudentEmailSetupPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/alumni/*"
              element={
                <ProtectedRoute allowedRoles={["ALUMNI"]}>
                  <AlumniDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/alumni/dashboard"
              element={
                <ProtectedRoute allowedRoles={["ALUMNI"]}>
                  <AlumniDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/alumni/id"
              element={
                <ProtectedRoute allowedRoles={["ALUMNI"]}>
                  <MemberIdPage role="ALUMNI" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/alumni/profile"
              element={
                <ProtectedRoute allowedRoles={["ALUMNI"]}>
                  <ProfilePage role="ALUMNI" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/alumni/change-password"
              element={
                <ProtectedRoute allowedRoles={["ALUMNI"]}>
                  <ChangePasswordPage role="ALUMNI" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/alumni/certificates"
              element={
                <ProtectedRoute allowedRoles={["ALUMNI"]}>
                  <CredentialsPage role="ALUMNI" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/alumni/certificates/:id"
              element={
                <ProtectedRoute allowedRoles={["ALUMNI"]}>
                  <CertificateDetailPage role="ALUMNI" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/alumni/webinars"
              element={
                <ProtectedRoute allowedRoles={["ALUMNI"]}>
                  <Navigate to="/alumni/certificates?tab=webinars" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/alumni/news"
              element={
                <ProtectedRoute allowedRoles={["ALUMNI"]}>
                  <NewsPage role="ALUMNI" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/alumni/news/:id"
              element={
                <ProtectedRoute allowedRoles={["ALUMNI"]}>
                  <NewsDetailPage role="ALUMNI" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/alumni/perks"
              element={
                <ProtectedRoute allowedRoles={["ALUMNI"]}>
                  <PerksPage role="ALUMNI" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/alumni/perks/:id"
              element={
                <ProtectedRoute allowedRoles={["ALUMNI"]}>
                  <PerkDetailPage role="ALUMNI" />
                </ProtectedRoute>
              }
            />

            {/* Redirects */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>

          {/* Toast notifications */}
          <AppToaster />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
