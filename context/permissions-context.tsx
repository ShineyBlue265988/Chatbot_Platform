'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { Permission, getUserPermissions } from "@/lib/permissions"
import { ChatbotUIContext } from "./context"

interface PermissionsContextType {
  permissions: Permission[]
  hasPermission: (permission: Permission) => boolean
  loading: boolean
  error: string | null
  refreshPermissions: () => Promise<void>
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined)

export const PermissionsProvider = ({ children }: { children: ReactNode }) => {
  const { profile, selectedWorkspace } = useContext(ChatbotUIContext)
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPermissions = async () => {
    console.log("Fetching permissions for:", {
      userId: profile?.user_id,
      workspaceId: selectedWorkspace?.id
    })

    if (!profile?.user_id || !selectedWorkspace?.id) {
      console.log("Missing profile or workspace, clearing permissions")
      setPermissions([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const userPermissions = await getUserPermissions(
        profile.user_id,
        selectedWorkspace.id
      )
      console.log("Fetched permissions:", userPermissions)
      setPermissions(userPermissions)
    } catch (err: any) {
      console.error("Error fetching permissions:", err)
      setError(err.message)
      setPermissions([])
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch and when workspace/user changes
  useEffect(() => {
    console.log("Permissions context effect triggered:", {
      userId: profile?.user_id,
      workspaceId: selectedWorkspace?.id
    })
    fetchPermissions()
  }, [profile?.user_id, selectedWorkspace?.id])

  const hasPermission = (permission: Permission): boolean => {
    const result = permissions.includes(permission)
    console.log(`Checking permission ${permission}:`, {
      hasPermission: result,
      availablePermissions: permissions
    })
    return result
  }

  const refreshPermissions = async () => {
    await fetchPermissions()
  }

  const value = {
    permissions,
    hasPermission,
    loading,
    error,
    refreshPermissions
  }

  console.log("Permissions context value:", {
    permissions,
    loading,
    error,
    userId: profile?.user_id,
    workspaceId: selectedWorkspace?.id
  })

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  )
}

export const usePermissionsContext = () => {
  const context = useContext(PermissionsContext)
  if (context === undefined) {
    throw new Error("usePermissionsContext must be used within a PermissionsProvider")
  }
  return context
} 