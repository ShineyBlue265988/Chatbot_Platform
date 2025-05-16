import React, { useState, useContext } from "react"
import { supabase } from "@/lib/supabase/browser-client"
import { Tables } from "@/supabase/types"
import { ChatbotUIContext } from "@/context/context"

interface TeamCreateModalProps {
  open: boolean
  onClose: () => void
  userId: string
  onTeamCreated: () => void
}

const TeamCreateModal: React.FC<TeamCreateModalProps> = ({
  open,
  onClose,
  userId,
  onTeamCreated
}) => {
  const { profile } = useContext(ChatbotUIContext)
  const { setWorkspaces, workspaces } = useContext(ChatbotUIContext)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    if (!name.trim()) {
      setError("Team name is required.")
      setLoading(false)
      return
    }
    // Create team
    const { data: workspace, error } = await (supabase as any).rpc(
      "create_team_with_workspace",
      {
        team_name: name,
        workspace_name: name, // or a separate field
        description,
        avatar_url: "", // or the uploaded avatar URL
        user_id: profile?.user_id
      }
    )
    console.log("workspace------------------------>", workspace)
    // if (!error && workspace) {
    //   setWorkspaces([...workspaces, workspace])
    // }
    // if (data && data.team_id) {
    //   console.log("data", data)
    //   console.log("team_id", data?.team_id)
    //   await (supabase as any).from("team_members").insert(
    //     [
    //     { team_id: data?.team_id, user_id: profile?.user_id, role: "owner" }
    //   ]
    // )
    // }
    if (error) {
      setError("Failed to create team.")
      setLoading(false)
      return
    }
    setLoading(false)
    setName("")
    setDescription("")
    onTeamCreated()
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
      <div className="animate-fade-in relative mx-4 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-2xl dark:border-gray-700 dark:bg-black">
        {/* Close button */}
        <button
          type="button"
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 focus:outline-none dark:hover:text-gray-300"
          onClick={onClose}
          aria-label="Close"
          disabled={loading}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="size-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-900 dark:text-white">
          Create Team
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Team Name *
            </label>
            <input
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 transition focus:outline-none focus:ring-2 focus:ring-gray-500 dark:border-gray-700 dark:bg-black dark:focus:ring-gray-400"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              maxLength={50}
              disabled={loading}
              placeholder="Enter team name"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Description
            </label>
            <textarea
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 transition focus:outline-none focus:ring-2 focus:ring-gray-500 dark:border-gray-700 dark:bg-black dark:focus:ring-gray-400"
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={200}
              disabled={loading}
              placeholder="Describe your team (optional)"
              rows={3}
            />
          </div>
          {/* Avatar upload placeholder */}
          <div className="flex items-center gap-3">
            <label className="block text-sm font-medium text-gray-400">
              Team Avatar (coming soon)
            </label>
            <div className="flex size-12 items-center justify-center rounded-full border border-dashed border-gray-400 bg-gray-200 text-lg text-gray-400 dark:bg-gray-700">
              ?
            </div>
          </div>
          {error && (
            <div className="text-center text-sm text-red-500">{error}</div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              className="rounded-lg border border-gray-300 bg-gray-100 px-4 py-2 text-gray-700 transition hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-black px-4 py-2 font-semibold text-white transition hover:bg-gray-800 focus:ring-2 focus:ring-blue-400 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-gray-200"
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

export default TeamCreateModal
