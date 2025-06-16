import { supabase } from "@/lib/supabase/browser-client"
import { useState, useEffect } from "react"
export type Permission =
  | "team.view"
  | "team.manage"
  | "team.invite"
  | "team.remove_members"
  | "team.change_roles"
  | "workspace.read"
  | "workspace.write"
  | "workspace.manage"
  | "workspace.delete"
  | "chats.read"
  | "chats.write"
  | "chats.delete"
  | "chats.manage"
  | "files.view"
  | "files.write"
  | "files.delete"
  | "files.manage"
  | "assistants.view"
  | "assistants.write"
  | "assistants.delete"
  | "assistants.manage"
  | "prompts.view"
  | "prompts.write"
  | "prompts.delete"
  | "prompts.manage"
  | "presets.view"
  | "presets.write"
  | "presets.delete"
  | "presets.manage"
  | "collections.read"
  | "collections.write"
  | "collections.delete"
  | "collections.manage"
  | "tools.view"
  | "tools.write"
  | "tools.delete"
  | "tools.manage"
  | "models.read"
  | "models.write"
  | "models.delete"
  | "models.manage"
  | "roles.read"
  | "roles.write"
  | "roles.delete"
  | "roles.manage"
  | "users.read"
  | "users.manage"
  | "users.analytics"
  | "usage.read"
  | "usage.manage"
  | "analytics.read"
export const checkPermission = async (
  userId: string,
  workspaceId: string,
  permission: Permission
): Promise<boolean> => {
  try {
    console.log("Checking permission:", { userId, workspaceId, permission })

    if (!userId || !workspaceId) {
      console.log("Missing userId or workspaceId")
      return false
    }

    // First check if user is workspace owner
    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("user_id, team_id") // Select team_id here as well
      .eq("id", workspaceId)
      .single()

    if (workspaceError) {
      console.error("Workspace check error:", workspaceError)
      return false
    }

    if (workspace?.user_id === userId) {
      console.log("User is workspace owner - granting permission")
      return true
    }

    // If not owner, check team memberships linked via workspace's team_id
    const teamId = workspace?.team_id

    if (!teamId) {
      console.log(`Workspace ${workspaceId} has no associated team.`)
      return false // Or handle appropriately if a workspace can exist without a team
    }

    // Get user's team membership for the specific team linked to the workspace
    const { data: teamMemberships, error: memberError } = await supabase
      .from("team_members")
      .select(
        `
          role
        `
      )
      .eq("user_id", userId)
      .eq("team_id", teamId) // Filter by the team_id found in the workspace

    if (memberError) {
      console.error("Team membership check error:", memberError)
      return false
    }

    if (!teamMemberships || teamMemberships.length === 0) {
      console.log("User has no team memberships in the workspace's team")
      return false
    }

    // Get unique role names from the memberships found
    const roleNames = [...new Set(teamMemberships.map(tm => tm.role))]

    if (roleNames.length === 0) {
      console.log("User has no roles in the workspace's team")
      return false
    }

    // Get roles and their permissions from the roles table (which has workspace_id)
    const { data: roles, error: rolesError } = await supabase
      .from("roles")
      .select("name, permissions")
      .eq("workspace_id", workspaceId) // Filter roles by workspace_id
      .in("name", roleNames) // Filter roles by the user's role names

    if (rolesError) {
      console.error("Roles check error:", rolesError)
      return false
    }
    interface TeamMember {
      role: string
      teams: {
        id: string
        name: string
      }
    }
    // Check if any of the user's roles in this workspace have the required permission
    const hasPermission =
      roles?.some(
        role =>
          Array.isArray(role.permissions) &&
          role.permissions.includes(permission)
      ) || false

    console.log("Permission check result:", hasPermission)
    return hasPermission
  } catch (error) {
    console.error("Permission check failed:", error)
    return false
  }
}

export const getUserPermissions = async (
  userId: string,
  workspaceId: string
): Promise<Permission[]> => {
  try {
    console.log("Getting user permissions:", { userId, workspaceId })

    if (!userId || !workspaceId) {
      // Checks if IDs are missing
      console.log("Missing userId or workspaceId for permissions")
      return []
    }

    // Check if user is workspace owner first
    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("user_id, team_id")
      .eq("id", workspaceId)
      .single()

    if (workspaceError) {
      // Returns empty array on workspace fetch error
      console.error("Workspace check error:", workspaceError)
      return []
    }

    if (workspace?.user_id === userId) {
      console.log("User is workspace owner, fetching all permissions")
      // Workspace owner gets all permissions
      const { data: allPermissions } = await supabase
        .from("permissions")
        .select("id")

      const permissions =
        allPermissions?.map(p => (p as any).id as Permission) || []
      console.log("Workspace owner permissions:", permissions)
      return permissions
    }

    // If not owner, find the team_id associated with the workspace
    const teamId = workspace?.team_id
    console.log("Team ID from workspace:", teamId)

    if (!teamId) {
      console.log(`Workspace ${workspaceId} has no associated team.`)
      return []
    }

    // Get user's team membership for the specific team linked to the workspace
    const { data: teamMemberships, error: memberError } = await supabase
      .from("team_members")
      .select("role")
      .eq("user_id", userId)
      .eq("team_id", teamId)

    console.log("Team memberships check result:", {
      teamMemberships,
      memberError
    })

    if (memberError || !teamMemberships) {
      console.error("Team membership error:", memberError)
      return []
    }

    // Get unique role names from the memberships found
    const roleNames = [...new Set(teamMemberships.map(tm => tm.role))]
    console.log("User role names:", roleNames)

    if (roleNames.length === 0) {
      console.log("User has no roles in the workspace's team")
      return []
    }

    // Get roles and their permissions from the roles table
    const { data: roles, error: rolesError } = await supabase
      .from("roles")
      .select("name, permissions")
      .eq("workspace_id", workspaceId)
      .in("name", roleNames)

    console.log("Roles check result:", { roles, rolesError })

    if (rolesError || !roles) {
      console.error("Roles error:", rolesError)
      return []
    }

    // Combine all permissions from all roles
    const allPermissions = new Set<Permission>()
    roles.forEach(role => {
      const rolePermissions = (role as any).permissions as string[] | null
      console.log(`Processing role ${role.name} permissions:`, rolePermissions)

      if (Array.isArray(rolePermissions)) {
        rolePermissions.forEach(perm => allPermissions.add(perm as Permission))
      }
    })

    const permissions = Array.from(allPermissions)
    console.log("Final combined permissions:", permissions)
    return permissions
  } catch (error) {
    console.error("Get permissions failed:", error)
    return []
  }
}

// Add this new hook at the end of your permissions.ts file

export const useCanViewAnalytics = (userId: string, workspaceId: string) => {
  const { hasPermission, loading } = usePermissions(userId, workspaceId)

  return {
    canViewAnalytics: hasPermission("users.analytics"),
    loading
  }
}

// Get user's roles with team context
export const getUserRoles = async (
  userId: string,
  workspaceId: string
): Promise<
  Array<{
    role_name: string
    role_description: string
    role_permissions: string[]
    team_name: string
    team_id: string
    is_system_role: boolean
  }>
> => {
  try {
    console.log("Getting user roles:", { userId, workspaceId })

    if (!userId || !workspaceId) {
      return []
    }

    // Get the team_id associated with the workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("team_id")
      .eq("id", workspaceId)
      .single()

    if (workspaceError) {
      console.error("Workspace check error:", workspaceError)
      return []
    }

    const teamId = workspace?.team_id

    if (!teamId) {
      console.log(`Workspace ${workspaceId} has no associated team.`)
      return []
    }

    // Get user's team memberships for the specific team linked to the workspace, joining teams to get name and id
    const { data: teamMemberships, error: memberError } = await supabase
      .from("team_members")
      .select("role, teams(id, name)")
      .eq("user_id", userId)
      .eq("team_id", teamId)
    // .returns<TeamMember[]>()

    if (memberError || !teamMemberships) {
      console.error("Team membership error:", memberError)
      return []
    }

    // Get unique role names from the memberships found
    const roleNames = [...new Set(teamMemberships.map(tm => tm.role))]

    if (roleNames.length === 0) {
      return []
    }

    // Get role details from the roles table (which has workspace_id)
    const { data: roles, error: rolesError } = await supabase
      .from("roles")
      .select("name, description, permissions, is_system_role")
      .eq("workspace_id", workspaceId) // Filter roles by workspace_id
      .in("name", roleNames) // Filter roles by the user's role names

    if (rolesError || !roles) {
      console.error("Roles error:", rolesError)
      return []
    }

    // Combine team memberships with role details
    const userRoles = teamMemberships.map(tm => {
      const roleDetail = roles.find((r: any) => r.name === tm.role) // Type assertion for role
      return {
        role_name: tm.role,
        role_description: (roleDetail as any)?.description || "", // Type assertion
        role_permissions: (roleDetail as any)?.permissions || [], // Type assertion
        team_name: tm.teams.name,
        team_id: tm.teams.id,
        is_system_role: (roleDetail as any)?.is_system_role || false // Type assertion
      }
    })

    console.log("User roles:", userRoles)
    return userRoles
  } catch (error) {
    console.error("Get user roles failed:", error)
    return []
  }
}

// Permission checking hook
export const usePermissions = (userId: string, workspaceId: string) => {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPermissions = async () => {
      console.log("usePermissions: Fetching permissions for:", {
        userId,
        workspaceId
      })

      if (!userId || !workspaceId) {
        console.log("usePermissions: Missing userId or workspaceId")
        setPermissions([])
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const userPermissions = await getUserPermissions(userId, workspaceId)
        console.log("usePermissions: Fetched permissions:", userPermissions)
        setPermissions(userPermissions)
      } catch (err: any) {
        console.error("usePermissions: Error fetching permissions:", err)
        setError(err.message)
        setPermissions([])
      } finally {
        setLoading(false)
      }
    }

    fetchPermissions()
  }, [userId, workspaceId])

  const hasPermission = (permission: Permission): boolean => {
    const result = permissions.includes(permission)
    console.log(`hasPermission(${permission}):`, result)
    return result
  }

  return { permissions, hasPermission, loading, error }
}

// Hook for getting user roles
export const useUserRoles = (userId: string, workspaceId: string) => {
  const [userRoles, setUserRoles] = useState<
    Array<{
      role_name: string
      role_description: string
      role_permissions: string[]
      team_name: string
      team_id: string
      is_system_role: boolean
    }>
  >([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserRoles = async () => {
      if (!userId || !workspaceId) {
        setUserRoles([])
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const roles = await getUserRoles(userId, workspaceId)
        setUserRoles(roles)
      } catch (err: any) {
        console.error("useUserRoles: Error fetching roles:", err)
        setError(err.message)
        setUserRoles([])
      } finally {
        setLoading(false)
      }
    }

    fetchUserRoles()
  }, [userId, workspaceId])

  return { userRoles, loading, error }
}
