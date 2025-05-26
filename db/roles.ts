import { supabase } from "@/lib/supabase/browser-client"

export type Role = {
  id: string
  name: string
  description: string
  permissions: string[]
  created_at?: string
  updated_at?: string | null
  user_id: string
  workspace_id: string
}

export type RoleCreate = Omit<Role, "id" | "created_at" | "updated_at">

export const createRole = async (
  role: RoleCreate,
  workspaceId: string
): Promise<Role> => {
  const { data, error } = await supabase
    .from("roles")
    .insert([
      {
        ...role,
        workspace_id: workspaceId
      }
    ])
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}
