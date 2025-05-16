import React, { useEffect, useState, useContext } from "react"
import { supabase } from "@/lib/supabase/browser-client"
import { ChatbotUIContext } from "@/context/context"
import TeamWorkspaceCreateModal from "./TeamWorkspaceCreateModal"
import { Tables } from "@/supabase/types"
import { useRouter, useParams } from "next/navigation"

interface TeamWorkspaceListProps {
  teamId: string
}
const TeamWorkspaceList: React.FC<TeamWorkspaceListProps> = ({ teamId }) => {
  const [workspaces, setWorkspaces] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const { selectedWorkspace, setSelectedWorkspace } =
    useContext(ChatbotUIContext)
  const router = useRouter()
  const params = useParams()
  const locale = params?.locale || "en"

  const fetchWorkspaces = async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from("workspaces")
      .select("*")
      .eq("team_id", teamId)
    if (error) setError("Failed to fetch workspaces.")
    setWorkspaces(data || [])
    setLoading(false)
  }

  useEffect(() => {
    if (teamId) fetchWorkspaces()
  }, [teamId])

  return (
    <div>
      {/* <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Team Workspaces</h3>
        <button
          className="px-2 py-1 bg-blue-600 text-white rounded"
          onClick={() => setShowModal(true)}
        >
          + Create Workspace
        </button>
      </div> */}
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-500">{error}</div>}
      <ul className="space-y-2">
        {workspaces.map(ws => (
          <li
            key={ws.id}
            className={`cursor-pointer rounded border p-2 hover:bg-gray-100 dark:hover:bg-gray-800 ${selectedWorkspace?.id === ws.id ? "bg-blue-200 dark:bg-blue-800" : ""}`}
            onClick={() => {
              console.log("ws.id-------------------->", ws.id)
              router.push(`/${ws.id}/chat`)
              setSelectedWorkspace(ws)
            }}
          >
            {ws.name}
          </li>
        ))}
      </ul>
      {showModal && (
        <TeamWorkspaceCreateModal
          teamId={teamId}
          onClose={() => setShowModal(false)}
          onCreated={fetchWorkspaces}
        />
      )}
    </div>
  )
}

export default TeamWorkspaceList
