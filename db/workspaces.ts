import { supabase } from "@/lib/supabase/browser-client"
import { TablesInsert, TablesUpdate } from "@/supabase/types"

export const getHomeWorkspaceByUserId = async (userId: string) => {
  const { data: homeWorkspace, error } = await supabase
    .from("workspaces")
    .select("*")
    .eq("user_id", userId)
    .eq("is_home", true)
    .single()

  if (!homeWorkspace) {
    throw new Error(error.message)
  }

  return homeWorkspace.id
}

export const getWorkspaceById = async (workspaceId: string) => {
  const { data: workspace, error } = await supabase
    .from("workspaces")
    .select("*")
    .eq("id", workspaceId)
    .single()

  if (error) {
    throw new Error(error.message || "Workspace not found")
  }
  if (!workspace) {
    throw new Error("Workspace not found")
  }
  return workspace
}

export const getTeamIdsByUserId = async (userId: string) => {
  const { data, error } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", userId)

  if (error) {
    throw new Error(error.message)
  }

  // Return an array of team IDs
  return (data ?? []).map(row => row.team_id)
}

export const getWorkspacesByUserId = async (userId: string) => {
  const { data: workspaces, error } = await supabase
    .from("workspaces")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (!workspaces) {
    throw new Error(error.message)
  }

  return workspaces
}

export const getWorkspacesByTeamIds = async (teamIds: string[]) => {
  if (!teamIds.length) return []

  const { data, error } = await supabase
    .from("workspaces")
    .select("*")
    .in("team_id", teamIds)

  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}

export const createWorkspace = async (
  workspace: TablesInsert<"workspaces">
) => {
  const { data: createdWorkspace, error } = await supabase
    .from("workspaces")
    .insert([workspace])
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return createdWorkspace
}

export const updateWorkspace = async (
  workspaceId: string,
  workspace: TablesUpdate<"workspaces">
) => {
  console.log("🔍 Attempting to update workspace:", workspaceId)
  console.log("📝 Update data:", workspace)

  // Get current user
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error("User authentication required")
  }

  console.log("👤 Current user:", user.id)

  // First check if the workspace exists and get detailed info
  const { data: existingWorkspace, error: checkError } = await supabase
    .from("workspaces")
    .select("*")
    .eq("id", workspaceId)
    .maybeSingle()

  console.log("🔍 Existing workspace check:", { existingWorkspace, checkError })

  if (checkError) {
    console.error("❌ Error checking workspace:", checkError)
    throw new Error(`Error checking workspace: ${checkError.message}`)
  }

  if (!existingWorkspace) {
    console.error("❌ Workspace not found:", workspaceId)
    throw new Error(`Workspace with id ${workspaceId} not found`)
  }

  // Check if user has permission to update this workspace
  const canUpdate = await checkWorkspaceUpdatePermission(
    user.id,
    existingWorkspace
  )

  if (!canUpdate) {
    throw new Error("Only the workspace owner can update this workspace")
  }

  // Prepare update data
  const cleanUpdateData = { ...workspace }
  delete cleanUpdateData.id
  delete cleanUpdateData.created_at

  // If converting from team to private workspace, ensure proper ownership
  if (existingWorkspace.team_id && !workspace.team_id) {
    console.log("🔄 Converting team workspace to private workspace")
    cleanUpdateData.user_id = user.id
    cleanUpdateData.team_id = null
  }

  console.log("🧹 Cleaned update data:", cleanUpdateData)

  // Perform the update
  const { data, error } = await supabase
    .from("workspaces")
    .update(cleanUpdateData)
    .eq("id", workspaceId)
    .select("*")
    .single()

  if (error) {
    console.error("❌ Supabase error:", error)
    throw new Error(`Failed to update workspace: ${error.message}`)
  }

  if (!data) {
    throw new Error("No workspace was updated")
  }

  console.log("✅ Workspace updated successfully:", data)
  return data
}

// Helper function to check if user can update the workspace
const checkWorkspaceUpdatePermission = async (
  userId: string,
  workspace: any
): Promise<boolean> => {
  // If user owns the workspace directly (private workspace)
  if (workspace.user_id === userId) {
    return true
  }

  // If it's a team workspace, check if user is the OWNER of that team
  if (workspace.team_id) {
    const { data: team, error } = await supabase
      .from("teams")
      .select("creator_id")
      .eq("id", workspace.team_id)
      .maybeSingle()

    if (error) {
      console.error("Error checking team ownership:", error)
      return false
    }

    // Only the team owner can update team workspaces
    return team?.creator_id === userId
  }

  return false
}

export const deleteWorkspace = async (workspaceId: string) => {
  const { error } = await supabase
    .from("workspaces")
    .delete()
    .eq("id", workspaceId)

  if (error) {
    throw new Error(error.message)
  }

  return true
}
