import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useMeQuery } from "@/hooks/use-auth-query"
import { getMyCard } from "@/api/cards"
import { listCertificates } from "@/api/certificates"
import { listEvents } from "@/api/events"
import { listPosts } from "@/api/posts"
import { listBenefits } from "@/api/benefits"
import type { UserRole } from "@/types/auth"

export function useRoleDashboard(role: UserRole) {
  const meQuery = useMeQuery()
  const cardQuery = useQuery({
    queryKey: ["dashboard", role, "card"],
    queryFn: getMyCard,
    retry: false,
  })
  const certQuery = useQuery({
    queryKey: ["dashboard", role, "certificates"],
    queryFn: () => listCertificates(),
    retry: false,
  })
  const eventQuery = useQuery({
    queryKey: ["dashboard", role, "events"],
    queryFn: listEvents,
    retry: false,
  })
  const postQuery = useQuery({
    queryKey: ["dashboard", role, "posts"],
    queryFn: () => listPosts(),
    retry: false,
  })
  const benefitQuery = useQuery({
    queryKey: ["dashboard", role, "benefits"],
    queryFn: () => listBenefits(1),
    retry: false,
  })

  const summary = useMemo(() => {
    const certificates = certQuery.data?.results ?? []
    const activeCertificates = certificates.filter((c) => c.status === "ISSUED").length
    const events = eventQuery.data?.results ?? []
    const posts = postQuery.data?.results ?? []
    const benefits = benefitQuery.data?.results ?? []

    const roleStats: Record<
      UserRole,
      {
        leftLabel: string
        leftValue: string
        leftHint: string
        rightLabel: string
        rightValue: string
        rightHint: string
      }
    > = {
      STUDENT: {
        leftLabel: "Active Certificates",
        leftValue: String(activeCertificates),
        leftHint: `${certificates.length} total records`,
        rightLabel: "Available Perks",
        rightValue: String(benefits.length),
        rightHint: "Role-based eligibility",
      },
      STAFF: {
        leftLabel: "Certificates",
        leftValue: String(certificates.length),
        leftHint: "Issuable and managed",
        rightLabel: "Benefit Records",
        rightValue: String(benefits.length),
        rightHint: "Directory coverage",
      },
      LECTURER: {
        leftLabel: "Published Posts",
        leftValue: String(posts.length),
        leftHint: "Announcements and updates",
        rightLabel: "Upcoming Events",
        rightValue: String(events.length),
        rightHint: "Academic agenda",
      },
      ADMIN: {
        leftLabel: "Posts",
        leftValue: String(posts.length),
        leftHint: "System content",
        rightLabel: "Events",
        rightValue: String(events.length),
        rightHint: "Operational visibility",
      },
      ALUMNI: {
        leftLabel: "Certificates",
        leftValue: String(certificates.length),
        leftHint: "Issued records",
        rightLabel: "Perks",
        rightValue: String(benefits.length),
        rightHint: "Alumni access",
      },
    }

    return {
      events,
      posts,
      stats: roleStats[role],
      benefitsCount: benefits.length,
      certificatesCount: certificates.length,
      activeCertificates,
    }
  }, [role, certQuery.data, eventQuery.data, postQuery.data, benefitQuery.data])

  const isBootLoading = meQuery.isLoading || cardQuery.isLoading
  const isDataLoading =
    certQuery.isLoading || eventQuery.isLoading || postQuery.isLoading || benefitQuery.isLoading

  return {
    isBootLoading,
    isDataLoading,
    me: meQuery.data,
    card: cardQuery.data,
    ...summary,
  }
}
