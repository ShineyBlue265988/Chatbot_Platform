import React, { useContext, useEffect, useState } from "react"
import { ChatbotUIContext } from "@/context/context"
import { supabase } from "@/lib/supabase/browser-client"
import { Tables } from "@/supabase/types"

const TeamList = () => {
  const { profile, selectedTeamId, setSelectedTeamId } =
    useContext(ChatbotUIContext)
  const [teams, setTeams] = useState<Tables<"teams">[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const fetchTeams = async () => {
    if (!profile?.user_id) return
    setLoading(true)
    setError(null)
    // Get all team memberships for this user
    const { data: memberships, error } = await supabase
      .from("team_members")
      .select("team_id, teams(*)")
      .eq("user_id", profile.user_id)
    if (error) {
      setError("Failed to fetch teams.")
      setLoading(false)
      return
    }
    const teams = (memberships || []).map((m: any) => m.teams).filter(Boolean)
    setTeams(teams)
    setLoading(false)
  }

  useEffect(() => {
    fetchTeams()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.user_id])

  if (!profile?.user_id) {
    return <div className="text-gray-500">Please log in to see your teams.</div>
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-bold">Teams</h3>
        <button
          className="rounded bg-black px-2 py-1 text-white dark:bg-white dark:text-black"
          onClick={() => setShowCreateModal(true)}
        >
          + Create Team
        </button>
      </div>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-500">{error}</div>}
      <ul className="mb-4 space-y-2">
        {teams.map(team => (
          <li
            key={team.id}
            className={`cursor-pointer rounded border p-2 hover:bg-gray-100 dark:hover:bg-gray-800 ${selectedTeamId === team.id ? "bg-blue-100 dark:bg-blue-900" : ""}`}
            onClick={() => setSelectedTeamId(team.id)}
          >
            <div className="font-semibold">{team.name}</div>
            <div className="text-xs text-gray-500">{team.description}</div>
          </li>
        ))}
      </ul>
      {showCreateModal && (
        <div>{/* Place your TeamCreateModal here if needed */}</div>
      )}
    </div>
  )
}

export default TeamList
