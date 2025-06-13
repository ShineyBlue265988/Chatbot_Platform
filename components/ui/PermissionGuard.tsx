'use client'
import { Permission } from "@/lib/permissions"
import { useContext } from "react"
import { ChatbotUIContext } from "@/context/context"
import { usePermissionsContext } from "@/context/permissions-context"

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
  const { selectedWorkspace } = useContext(ChatbotUIContext)
  const currentWorkspaceId = workspaceId || selectedWorkspace?.id
  const { hasPermission, loading } = usePermissionsContext()

  console.log("PermissionGuard rendering:", {
    permission,
    currentWorkspaceId,
    loading
  })

  // Show loading state if requested
  if (loading && showLoading) {
    console.log("PermissionGuard: showing loading state")
    return <div className="h-4 w-16 animate-pulse rounded bg-gray-200"></div>
  }

  // Don't render anything while loading (unless showLoading is true)
  if (loading) {
    console.log("PermissionGuard: loading, not rendering")
    return null
  }

  // Check if user has the required permission
  const userHasPermission = hasPermission(permission)
  console.log("PermissionGuard permission check:", {
    permission,
    userHasPermission
  })

  if (!userHasPermission) {
    console.log("PermissionGuard: permission denied, showing fallback")
    return <>{fallback}</>
  }

  console.log("PermissionGuard: permission granted, showing children")
  return <>{children}</>
}
