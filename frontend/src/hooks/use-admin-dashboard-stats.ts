import { useQueries, useQuery } from "@tanstack/react-query"
import { listUsers } from "@/api/users"
import { listPosts } from "@/api/posts"
import { listBenefitsAdmin } from "@/api/benefits"
import { listCertificatePrograms } from "@/api/certificate-programs"

const stale = 60_000

/**
 * Aggregates counts from existing admin APIs for the dashboard overview.
 */
export function useAdminDashboardStats() {
  const queries = useQueries({
    queries: [
      {
        queryKey: ["admin-dashboard", "students"],
        queryFn: () => listUsers({ role: "STUDENT", page: 1, page_size: 1 }),
        staleTime: stale,
      },
      {
        queryKey: ["admin-dashboard", "posts"],
        queryFn: () => listPosts({ page: 1, page_size: 1 }),
        staleTime: stale,
      },
      {
        queryKey: ["admin-dashboard", "benefits-active"],
        queryFn: () => listBenefitsAdmin({ page: 1, page_size: 1, is_active: true }),
        staleTime: stale,
      },
      {
        queryKey: ["admin-dashboard", "cert-programs"],
        queryFn: () => listCertificatePrograms(1),
        staleTime: stale,
      },
    ],
  })

  const [studentsQ, postsQ, benefitsQ, programsQ] = queries

  return {
    studentCount: studentsQ.data?.count ?? null,
    postsCount: postsQ.data?.count ?? null,
    benefitsCount: benefitsQ.data?.count ?? null,
    programsCount: programsQ.data?.count ?? null,
    isLoading: queries.some((q) => q.isLoading),
    hasError: queries.some((q) => q.isError),
  }
}

export function useAdminRecentPosts() {
  return useQuery({
    queryKey: ["admin-dashboard", "recent-posts"],
    queryFn: () =>
      listPosts({
        page: 1,
        page_size: 6,
        ordering: "-published_at",
      }),
    staleTime: stale,
  })
}
