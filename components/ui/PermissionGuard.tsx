"use client"
import { Permission } from "@/lib/permissions"
import { useContext, useMemo, memo } from "react"
import { ChatbotUIContext } from "@/context/context"
import { usePermissionsContext } from "@/context/permissions-context"

interface PermissionGuardProps {
  permission: Permission
  children: React.ReactNode
  fallback?: React.ReactNode
  workspaceId?: string
  showLoading?: boolean
}

const PermissionGuardComponent: React.FC<PermissionGuardProps> = ({
  permission,
  children,
  fallback = null,
  workspaceId,
  showLoading = false
}) => {
  const { selectedWorkspace } = useContext(ChatbotUIContext)
  const { hasPermission, loading } = usePermissionsContext()

  const currentWorkspaceId = useMemo(
    () => workspaceId || selectedWorkspace?.id,
    [workspaceId, selectedWorkspace?.id]
  )

  const userHasPermission = useMemo(
    () => hasPermission(permission),
    [hasPermission, permission]
  )

  // Show loading state if requested
  if (loading && showLoading) {
    return <div className="h-4 w-16 animate-pulse rounded bg-gray-200"></div>
  }

  // Don't render anything while loading
  if (loading) {
    return null
  }

  if (!userHasPermission) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// Memoize the component to prevent unnecessary re-renders
export const PermissionGuard = memo(
  PermissionGuardComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.permission === nextProps.permission &&
      prevProps.workspaceId === nextProps.workspaceId &&
      prevProps.showLoading === nextProps.showLoading
    )
  }
)
