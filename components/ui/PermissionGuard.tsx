import { usePermissions, Permission } from "@/lib/permissions"
import { useContext } from "react"
import { ChatbotUIContext } from "@/context/context"

interface PermissionGuardProps {
  permission: Permission
  children: React.ReactNode
  fallback?: React.ReactNode
  workspaceId?: string
  showLoading?: boolean
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  children,
  fallback = null,
  workspaceId,
  showLoading = false
}) => {
  const { profile, selectedWorkspace } = useContext(ChatbotUIContext)
  const currentWorkspaceId = workspaceId || selectedWorkspace?.id

  const { hasPermission, loading } = usePermissions(
    profile?.user_id || "",
    currentWorkspaceId || ""
  )

  // Show loading state if requested
  if (loading && showLoading) {
    return <div className="h-4 w-16 animate-pulse rounded bg-gray-200"></div>
  }

  // Don't render anything while loading (unless showLoading is true)
  if (loading) {
    return null
  }

  // Check if user has the required permission
  const userHasPermission = hasPermission(permission)

  if (!userHasPermission) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
