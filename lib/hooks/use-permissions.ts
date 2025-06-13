import { Permission } from "@/lib/permissions"
import { usePermissionsContext } from "@/context/permissions-context"

// This hook is kept for backward compatibility
// It now uses the permissions context internally
export const usePermissions = (userId: string, workspaceId: string) => {
  const { permissions, hasPermission, loading, error } = usePermissionsContext()

  return {
    permissions,
    hasPermission,
    loading,
    error
  }
}

// Hook for checking analytics permission
export const useCanViewAnalytics = (userId: string, workspaceId: string) => {
  const { hasPermission, loading } = usePermissionsContext()

  return {
    canViewAnalytics: hasPermission("users.analytics"),
    loading
  }
}
