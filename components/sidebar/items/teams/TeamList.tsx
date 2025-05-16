import React, { useContext, useEffect, useState } from "react"
import { ChatbotUIContext } from "@/context/context"
import { supabase } from "@/lib/supabase/browser-client"
import { Tables } from "@/supabase/types"
import TeamCreateModal from "./TeamCreateModal"
import TeamWorkspaceList from "./TeamWorkspaceList"
import TeamInviteModal from "./TeamInviteModal"
import TeamInvitesList from "./TeamInvitesList"
import TeamMembersList from "./TeamMembersList"

const TeamList = () => {
  const { profile } = useContext(ChatbotUIContext)
  const [teams, setTeams] = useState<Tables<"teams">[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)

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
      <TeamInvitesList />
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
      {selectedTeamId && (
        <>
          <TeamMembersList
            teamId={selectedTeamId}
            currentUserId={profile.user_id}
          />
          <div>
            <button
              className="my-2 rounded bg-black px-2 py-1 text-white dark:bg-white dark:text-black"
              onClick={() => setShowInviteModal(true)}
            >
              + Invite Member
            </button>
            <TeamInviteModal
              open={showInviteModal}
              onClose={() => setShowInviteModal(false)}
              teamId={selectedTeamId}
              invitedBy={profile.user_id}
            />
          </div>
          <TeamWorkspaceList teamId={selectedTeamId} />
        </>
      )}

      {showCreateModal && (
        <TeamCreateModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          userId={profile.user_id}
          onTeamCreated={fetchTeams}
        />
      )}
    </div>
  )
}

export default TeamList
