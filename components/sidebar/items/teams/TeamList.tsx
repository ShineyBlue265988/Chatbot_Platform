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
  const [invites, setInvites] = useState<any[]>([])
  const [showInvites, setShowInvites] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)

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

  // Fetch recent invites for the selected team
  const fetchInvites = async (teamId: string) => {
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    // Get all invites for the team (not just pending)
    const { data: invitesData, error } = await supabase
      .from("team_invites")
      .select("id, email, invited_by, status, created_at")
      .eq("team_id", teamId)
    if (error) return setInvites([])
    // Filter for only those created within last 7 days
    const recentInvites = []
    for (const invite of invitesData || []) {
      const createdAt = new Date(invite.created_at)
      if (createdAt >= oneWeekAgo) {
        // Try to fetch username if user_id exists
        let username = null
        if (invite.id) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("username")
            .eq("user_id", invite.id)
            .single()
          username = profileData?.username || null
        }
        recentInvites.push({ ...invite, username })
      } else {
        // Auto-decline and remove old pending invites
        if (invite.status === "pending") {
          await supabase
            .from("team_invites")
            .update({ status: "declined" })
            .eq("id", invite.id)
        }
      }
    }
    setInvites(recentInvites)
  }

  useEffect(() => {
    fetchTeams()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.user_id])

  useEffect(() => {
    if (selectedTeamId) fetchInvites(selectedTeamId)
  }, [selectedTeamId])

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!selectedTeamId || !profile?.user_id) {
        setUserRole(null)
        return
      }
      const { data, error } = await supabase
        .from("team_members")
        .select("role")
        .eq("team_id", selectedTeamId)
        .eq("user_id", profile.user_id)
        .single()
      if (error) {
        setUserRole(null)
      } else {
        setUserRole(data?.role || null)
      }
    }
    fetchUserRole()
  }, [selectedTeamId, profile?.user_id])

  // Add these handlers inside the TeamList component
  const handleResendInvite = async (inviteId: string) => {
    // Implement resend invite logic here
    alert("Resend invite functionality not implemented yet.")
  }

  const handleCancelInvite = async (inviteId: string) => {
    setLoading(true)
    setError(null)
    const { error } = await supabase
      .from("team_invites")
      .delete()
      .eq("id", inviteId)
    if (error) setError(error.message)
    else setInvites(invites.filter(i => i.id !== inviteId))
    setLoading(false)
  }

  if (!profile?.user_id) {
    return <div className="text-gray-500">Please log in to see your teams.</div>
  }

  return (
    <div>
      <div className="mb-6 rounded-lg border-2 border-gray-400 bg-gray-50 p-4 shadow-md dark:border-gray-600 dark:bg-gray-900/30">
        <div className="mb-2 flex items-center gap-2">
          <svg
            className="size-5 text-black dark:text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z"
            />
          </svg>
          <span className="font-bold text-black dark:text-white">
            Team Invites
          </span>
        </div>
        <TeamInvitesList />
      </div>
      <div className="mb-2 mt-4 flex items-center justify-between">
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
          {/* Toggle for invited users */}

          <TeamMembersList
            teamName={teams.find(t => t.id === selectedTeamId)?.name || ""}
            teamId={selectedTeamId}
            currentUserId={profile.user_id}
          />
          <div className="mb-2">
            <button
              className="text-md font-bold text-black underline hover:text-gray-600 dark:text-white dark:hover:text-gray-300"
              onClick={() => setShowInvites(v => !v)}
            >
              Invited Users ({invites.length})
            </button>
            {showInvites && invites.length > 0 && (
              <ul className="mt-2 space-y-2">
                {invites.map(invite => (
                  <li
                    key={invite.id}
                    className="rounded border bg-yellow-50 p-2 dark:bg-yellow-900/20"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold">
                        {invite.username || invite.email.split("@")[0]}
                      </div>
                      <div
                        className={`inline-block rounded-full border px-2 py-0.5 text-xs ${invite.status === "pending" ? "border-yellow-300 bg-yellow-100 dark:border-yellow-600 dark:bg-yellow-700" : invite.status === "declined" ? "border-red-300 bg-red-100 dark:border-red-600 dark:bg-red-700" : "border-green-300 bg-green-100 dark:border-green-600 dark:bg-green-700"}`}
                      >
                        {invite.status.charAt(0).toUpperCase() +
                          invite.status.slice(1)}
                      </div>
                      {invite.status === "pending" && (
                        <button
                          className="ml-2 rounded bg-red-100 p-1 text-xs text-red-700 hover:bg-red-200"
                          onClick={() => handleCancelInvite(invite.id)}
                          aria-label="Cancel invite"
                          title="Cancel invite"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                    <div className="ml-2 text-xs text-gray-500">
                      {invite.email}
                    </div>
                    <div className="ml-2 text-xs text-gray-400">
                      Invited {new Date(invite.created_at).toLocaleString()}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            {/* Only show Invite Member button if user is owner or admin */}
            {(userRole === "owner" || userRole === "admin") && (
              <button
                className="my-2 rounded bg-black px-2 py-1 text-white dark:bg-white dark:text-black"
                onClick={() => setShowInviteModal(true)}
              >
                + Invite Member
              </button>
            )}
            <TeamInviteModal
              open={showInviteModal}
              onClose={() => setShowInviteModal(false)}
              teamId={selectedTeamId}
              invitedBy={profile.user_id}
            />
          </div>
          {/* <div
            className="text-sm text-blue-600 underline"
          >
            Team Workspaces
          </div>
          <TeamWorkspaceList teamId={selectedTeamId} /> */}
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
