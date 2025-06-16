"use client"
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
  useMemo,
  useRef
} from "react"
import { Permission, getUserPermissions } from "@/lib/permissions"
import { ChatbotUIContext } from "./context"

interface PermissionsContextType {
  permissions: Permission[]
  hasPermission: (permission: Permission) => boolean
  loading: boolean
  error: string | null
  refreshPermissions: () => Promise<void>
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(
  undefined
)

export const PermissionsProvider = ({ children }: { children: ReactNode }) => {
  const { profile, selectedWorkspace } = useContext(ChatbotUIContext)
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Memoize user and workspace IDs to prevent unnecessary re-renders
  const userId = useMemo(() => profile?.user_id, [profile?.user_id])
  const workspaceId = useMemo(
    () => selectedWorkspace?.id,
    [selectedWorkspace?.id]
  )

  const fetchPermissions = useCallback(async () => {
    // Remove excessive logging
    if (!userId || !workspaceId) {
      setPermissions([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const userPermissions = await getUserPermissions(userId, workspaceId)
      setPermissions(userPermissions)
    } catch (err: any) {
      console.error("Error fetching permissions:", err)
      setError(err.message)
      setPermissions([])
    } finally {
      setLoading(false)
    }
  }, [userId, workspaceId]) // Proper dependencies

  // Use proper dependencies
  useEffect(() => {
    fetchPermissions()
  }, [fetchPermissions])

  // Memoize hasPermission to prevent re-renders
  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      return permissions.includes(permission)
    },
    [permissions]
  )

  const refreshPermissions = useCallback(async () => {
    await fetchPermissions()
  }, [fetchPermissions])

  // Memoize the context value
  const value = useMemo(
    () => ({
      permissions,
      hasPermission,
      loading,
      error,
      refreshPermissions
    }),
    [permissions, hasPermission, loading, error, refreshPermissions]
  )

  // Remove excessive logging - only log once when permissions change
  useEffect(() => {
    if (!loading) {
      console.log("Permissions loaded:", permissions.length, "permissions")
    }
  }, [permissions, loading])

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  )
}

export const usePermissionsContext = () => {
  const context = useContext(PermissionsContext)
  if (context === undefined) {
    throw new Error(
      "usePermissionsContext must be used within a PermissionsProvider"
    )
  }
  return context
}
