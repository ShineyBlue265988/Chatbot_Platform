import React, { useState } from "react"
import { supabase } from "@/lib/supabase/browser-client"

interface TeamWorkspaceCreateModalProps {
  teamId: string
  onClose: () => void
  onCreated: () => void
}

const TeamWorkspaceCreateModal: React.FC<TeamWorkspaceCreateModalProps> = ({
  teamId,
  onClose,
  onCreated
}) => {
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    if (!name.trim()) {
      setError("Workspace name is required.")
      setLoading(false)
      return
    }

    const { data: workspace, error: wsError } = await (supabase as any)
      .from("workspaces")
      .insert([{ team_id: teamId, name }]) // <-- FIXED HERE

    console.log("workspace---------->", workspace)
    if (wsError) {
      console.log(wsError)
      // handle error
      return
    }
    // 2. Link it in team_workspaces
    await (supabase as any)
      .from("team_workspaces")
      .insert([{ team_id: teamId, workspace_id: workspace.id, name }]) // <-- FIXED HERE
    // const { error } = await supabase
    //   .from("team_workspaces")
    //   .insert([{ team_id: teamId, name }])
    if (error) {
      setError("Failed to create workspace.")
      setLoading(false)
      return
    }
    setLoading(false)
    setName("")
    onCreated()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-bold">Create Workspace</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Workspace Name *
            </label>
            <input
              className="w-full rounded border px-3 py-2"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              maxLength={50}
              disabled={loading}
            />
          </div>
          {error && <div className="text-sm text-red-500">{error}</div>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="rounded bg-gray-200 px-4 py-2 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TeamWorkspaceCreateModal
