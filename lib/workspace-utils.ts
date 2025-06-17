import { Tables } from "@/supabase/types"

type Workspace = Tables<"workspaces">

export const findHomeWorkspace = (
  workspaces: Workspace[]
): Workspace | null => {
  return workspaces.find(workspace => workspace.is_home) || null
}

export const ensureHomeWorkspaceSelected = (
  workspaces: Workspace[],
  selectedWorkspace: Workspace | null,
  setSelectedWorkspace: (workspace: Workspace) => void
): boolean => {
  if (!selectedWorkspace && workspaces.length > 0) {
    const homeWorkspace = findHomeWorkspace(workspaces)
    if (homeWorkspace) {
      setSelectedWorkspace(homeWorkspace)
      return true
    }
  }
  return false
}
