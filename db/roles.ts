import { supabase } from "@/lib/supabase/browser-client"

export type Role = {
  id: string
  workspace_id?: string
  name: string
  description: string | null | undefined
  permissions: any[] // jsonb type
  is_system_role?: boolean
  created_at?: string
  updated_at: string | null | undefined
}

export type RoleCreate = Omit<Role, "id" | "created_at" | "updated_at">

export const createRole = async (
  role: RoleCreate,
  workspaceId: string
): Promise<Role> => {
  // Validate inputs
  if (!workspaceId) {
    throw new Error("workspace_id is required")
  }

  if (!role.name) {
    throw new Error("role name is required")
  }

  // Match the actual table structure
  const roleData = {
    workspace_id: workspaceId,
    name: role.name,
    description: role.description || null,
    permissions: role.permissions || [],
    is_system_role: role.is_system_role || false
  }

  const { data, error } = await supabase
    .from("roles")
    .insert(roleData)
    .select("*")
    .single()

  if (error) {
    console.error("Error creating role:", error)
    throw new Error(`Failed to create role: ${error.message}`)
  }

  return data
}

export const getRolesByWorkspace = async (
  workspaceId: string
): Promise<Role[]> => {
  const { data, error } = await supabase
    .from("roles")
    .select("*")
    .eq("workspace_id", workspaceId)

  if (error) {
    console.error("Error fetching roles:", error)
    throw new Error(`Failed to fetch roles: ${error.message}`)
  }

  return data || []
}

export const updateRole = async (
  roleId: string,
  updates: Partial<RoleCreate>
): Promise<Role> => {
  const { data, error } = await supabase
    .from("roles")
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq("id", roleId)
    .select("*")
    .single()

  if (error) {
    console.error("Error updating role:", error)
    throw new Error(`Failed to update role: ${error.message}`)
  }

  return data
}

export const deleteRole = async (roleId: string): Promise<void> => {
  const { error } = await supabase.from("roles").delete().eq("id", roleId)

  if (error) {
    console.error("Error deleting role:", error)
    throw new Error(`Failed to delete role: ${error.message}`)
  }
}
