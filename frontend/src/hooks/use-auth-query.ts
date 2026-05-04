import {
  useQuery,
  type UseQueryResult,
} from "@tanstack/react-query"
import { getMe } from "@/api/auth"
import type { User } from "@/types/auth"

export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
}

/**
 * Hook to fetch the current authenticated user
 */
export function useMeQuery(
  options?: Record<string, unknown>
): UseQueryResult<User, Error> {
  return useQuery<User, Error>({
    queryKey: authKeys.me(),
    queryFn: getMe,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  })
}
