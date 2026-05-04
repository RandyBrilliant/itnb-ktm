import {
  useQuery,
  type UseQueryResult,
} from "@tanstack/react-query"
import { listUsers } from "@/api/users"
import type { UserFilters, UserListResponse } from "@/api/users"

export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (filters?: UserFilters) => [...userKeys.lists(), filters] as const,
}

/**
 * Hook to fetch paginated list of users
 */
export function useUsersQuery(
  filters?: UserFilters,
  options?: Record<string, unknown>
): UseQueryResult<UserListResponse, Error> {
  return useQuery<UserListResponse, Error>({
    queryKey: userKeys.list(filters),
    queryFn: () => listUsers(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  })
}
