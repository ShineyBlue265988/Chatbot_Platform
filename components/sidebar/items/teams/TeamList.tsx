import React, { useContext, useEffect, useState } from "react"
import { ChatbotUIContext } from "@/context/context"
import { supabase } from "@/lib/supabase/browser-client"
import { Tables } from "@/supabase/types"
import TeamCreateModal from "./TeamCreateModal"
import TeamInviteModal from "./TeamInviteModal"
import TeamInvitesList from "./TeamInvitesList"
import TeamMembersList from "./TeamMembersList"

const TeamList = () => {
  const { profile, selectedWorkspace } = useContext(ChatbotUIContext)
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

    try {
      console.log("Fetching teams for user:", profile.user_id)

      // Method 1: Try with workspace_id if it exists
      if (selectedWorkspace?.id) {
        try {
          // 1. Get the team_id for the selected workspace
          const { data: workspaceData, error: workspaceError } = await supabase
            .from("workspaces")
            .select("team_id")
            .eq("id", selectedWorkspace.id)
            .single()

          if (workspaceError || !workspaceData?.team_id) {
            // Workspace might not have a team_id or error occurred, proceed to Method 2
            console.log(
              "Workspace has no team_id or error fetching, falling back.",
              workspaceError
            )
          } else {
            const teamId = workspaceData.team_id
            console.log("Workspace team_id:", teamId)

            // 2. Check if the user is a member of this specific team
            const { data: membership, error: memberError } = await supabase
              .from("team_members")
              .select("team_id")
              .eq("user_id", profile.user_id)
              .eq("team_id", teamId)
              .single() // Expecting at most one membership

            if (memberError || !membership) {
              // User is not a member of this team, proceed to Method 2
              console.log(
                "User is not a member of workspace team, falling back.",
                memberError
              )
            } else {
              // 3. User is a member, fetch details for this single team
              const { data: teamData, error: teamError } = await supabase
                .from("teams")
                .select("*")
                .eq("id", teamId)
                .single()

              if (teamError || !teamData) {
                console.error(
                  "Error fetching workspace team details:",
                  teamError
                )
                // Still fall back if fetching team details fails
              } else {
                console.log(
                  "Found and confirmed user is member of workspace team:",
                  teamData
                )
                setTeams([teamData]) // Set teams to just this one team
                setLoading(false)
                return // Stop fetching, we found the relevant team
              }
            }
          }
        } catch (workspaceFetchError) {
          console.error(
            "Error during workspace team fetch process:",
            workspaceFetchError
          )
          // If any part of Method 1 fails unexpectedly, fall back
        }
      }

      // Method 2: Get all teams user is a member of (fallback)
      const { data: memberships, error: memberError } = await supabase
        .from("team_members")
        .select("team_id, role")
        .eq("user_id", profile.user_id)

      if (memberError) {
        throw new Error(
          `Failed to fetch team memberships: ${memberError.message}`
        )
      }

      if (!memberships || memberships.length === 0) {
        console.log("User has no team memberships")
        setTeams([])
        setLoading(false)
        return
      }

      console.log("User memberships:", memberships)

      // Get team details
      const teamIds = memberships.map(m => m.team_id)
      const { data: allTeams, error: teamsError } = await supabase
        .from("teams")
        .select("*")
        .in("id", teamIds)

      if (teamsError) {
        throw new Error(`Failed to fetch teams: ${teamsError.message}`)
      }

      console.log("All user teams:", allTeams)
      setTeams(allTeams || [])
    } catch (err: any) {
      console.error("Fetch team error:", err)
      setError(err.message || "Failed to fetch teams")
    } finally {
      setLoading(false)
    }
  }

  // Fetch recent invites for the selected team
  const fetchInvites = async (teamId: string) => {
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    try {
      const { data: invitesData, error } = await supabase
        .from("team_invites")
        .select("id, email, invited_by, status, created_at")
        .eq("team_id", teamId)

      if (error) {
        console.error("Error fetching invites:", error)
        setInvites([])
        return
      }

      // Filter for recent invites and get usernames
      const recentInvites = []
      for (const invite of invitesData || []) {
        const createdAt = new Date(invite.created_at)
        if (createdAt >= oneWeekAgo) {
          let username = null
          if (invite.invited_by) {
            const { data: profileData } = await supabase
              .from("profiles")
              .select("username")
              .eq("user_id", invite.invited_by)
              .single()
            username = profileData?.username || null
          }
          recentInvites.push({ ...invite, username })
        } else if (invite.status === "pending") {
          // Auto-decline old pending invites
          await supabase
            .from("team_invites")
            .update({ status: "declined" })
            .eq("id", invite.id)
        }
      }
      setInvites(recentInvites)
    } catch (err) {
      console.error("Error in fetchInvites:", err)
      setInvites([])
    }
  }

  // Fetch user's role in selected team
  const fetchUserRole = async () => {
    if (!selectedTeamId || !profile?.user_id) {
      setUserRole(null)
      return
    }

    try {
      const { data, error } = await supabase
        .from("team_members")
        .select("role")
        .eq("team_id", selectedTeamId)
        .eq("user_id", profile.user_id)
        .single()

      if (error) {
        console.error("Error fetching user role:", error)
        setUserRole(null)
      } else {
        setUserRole(data?.role || null)
      }
    } catch (err) {
      console.error("Error in fetchUserRole:", err)
      setUserRole(null)
    }
  }

  useEffect(() => {
    fetchTeams()
  }, [profile?.user_id, selectedWorkspace?.id])

  useEffect(() => {
    if (selectedTeamId) {
      fetchInvites(selectedTeamId)
      fetchUserRole()
    }
  }, [selectedTeamId, profile?.user_id])

  const handleCancelInvite = async (inviteId: string) => {
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase
        .from("team_invites")
        .delete()
        .eq("id", inviteId)

      if (error) {
        setError(error.message)
      } else {
        setInvites(invites.filter(i => i.id !== inviteId))
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!profile?.user_id) {
    return (
      <div className="p-4 text-center">
        <div className="text-gray-500 dark:text-gray-400">
          Please log in to see your teams.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Team Invites Section */}
      <div className="rounded-lg border-2 border-gray-400 bg-gray-50 p-2 shadow-md dark:border-gray-600 dark:bg-gray-900/30">
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

      {/* Teams Section */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">My Teams</h3>
          <button
            className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            onClick={() => setShowCreateModal(true)}
          >
            + Create Team
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="size-6 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600 dark:text-gray-400">
              Loading teams...
            </span>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <div className="flex items-center">
              <svg
                className="mr-2 size-5 text-red-600 dark:text-red-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-red-700 dark:text-red-300">{error}</span>
            </div>
          </div>
        )}

        {!loading && !error && teams.length === 0 && (
          <div className="py-12 text-center">
            <svg
              className="mx-auto mb-4 size-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
              No Teams Found
            </h3>
            <p className="mb-4 text-gray-500 dark:text-gray-400">
              You&apos;re not a member of any teams yet.
            </p>
            <button
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              onClick={() => setShowCreateModal(true)}
            >
              Create Your First Team
            </button>
          </div>
        )}

        {!loading && !error && teams.length > 0 && (
          <ul className="space-y-2">
            {teams.map(team => (
              <li
                key={team.id}
                // IMPROVED STYLING: Consistent padding, border, background, hover, and active state
                className={`cursor-pointer rounded-lg border transition-colors
                                   ${
                                     selectedTeamId === team.id
                                       ? "border-blue-500 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/50" // Highlight color
                                       : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800/50" // Default color
                                   }
                                   p-2 hover:bg-gray-100
                                   dark:hover:bg-gray-700/50 `} // Added consistent padding
                onClick={() => setSelectedTeamId(team.id)}
              >
                <div className="font-semibold text-gray-900 dark:text-gray-100">
                  {" "}
                  {/* Ensure text color is readable */}
                  {team.name}
                </div>
                {team.description && (
                  <div className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                    {" "}
                    {/* Added line-clamp for long descriptions */}
                    {team.description}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Selected Team Details */}
      {selectedTeamId && (
        <div className="space-y-4">
          <TeamMembersList
            teamName={teams.find(t => t.id === selectedTeamId)?.name || ""}
            teamId={selectedTeamId}
            currentUserId={profile.user_id}
          />

          {/* Invited Users Section */}
          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <button
              className="flex w-full items-center justify-between text-left font-medium text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
              onClick={() => setShowInvites(v => !v)}
            >
              <span>Invited Users ({invites.length})</span>
              <svg
                className={`size-5 transition-transform${showInvites ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {showInvites && (
              <div className="mt-4">
                {invites.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No recent invites
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {invites.map(invite => (
                      <li
                        key={invite.id}
                        // Apply styles to the li or its inner div
                        className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-900/20"
                      >
                        <div className="flex flex-col gap-2">
                          {" "}
                          {/* Changed to flex-col */}
                          {/* Top Row: Name/Email and Status */}
                          <div className="flex items-center justify-between gap-3">
                            {" "}
                            {/* Horizontal flex */}
                            <div className="min-w-0 flex-1">
                              {" "}
                              {/* Allow name/email to take space */}
                              <div className="truncate font-medium text-gray-900 dark:text-white">
                                {" "}
                                {/* Truncate name/email */}
                                {invite.email.split("@")[0]}
                              </div>
                              {/* <div className="text-sm text-gray-500 dark:text-gray-400 truncate"> Truncate email */}
                              {/* {invite.email} */}
                              {/* </div> */}
                            </div>
                            {/* Status Badge */}
                            <div className="shrink-0">
                              {" "}
                              {/* Prevent badge from shrinking */}
                              <span
                                className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                  invite.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                    : invite.status === "declined"
                                      ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                      : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                }`}
                              >
                                {invite.status.charAt(0).toUpperCase() +
                                  invite.status.slice(1)}
                              </span>
                            </div>
                          </div>
                          {/* Bottom Row: Invited By, Date, and Cancel Button */}
                          {/* Align items and push button to the right */}
                          <div className="flex items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
                            {" "}
                            {/* Horizontal flex */}
                            {/* Invited Info */}
                            <div className="min-w-0 flex-1 truncate">
                              {" "}
                              {/* Allow text to take space */}
                              Invited by {invite.username ||
                                invite.invited_by}{" "}
                              on{" "}
                              {new Date(invite.created_at).toLocaleDateString()}
                            </div>
                            {/* Cancel Button */}
                            {invite.status === "pending" && (
                              <div className="shrink-0">
                                {" "}
                                {/* Prevent button from shrinking */}
                                <button
                                  className="inline-flex items-center rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800"
                                  onClick={() => handleCancelInvite(invite.id)}
                                  disabled={loading}
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </div>
                        </div>{" "}
                        {/* End of flex-col */}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Invite Member Button */}
          {(userRole === "Owner" || userRole === "Admin") && (
            <div className="flex justify-end">
              <button
                className="inline-flex items-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                onClick={() => setShowInviteModal(true)}
              >
                <svg
                  className="mr-2 size-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Invite Member
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <TeamCreateModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          userId={profile.user_id}
          onTeamCreated={fetchTeams}
        />
      )}

      {showInviteModal && selectedTeamId && (
        <TeamInviteModal
          open={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          teamId={selectedTeamId}
          invitedBy={profile.user_id}
        />
      )}
    </div>
  )
}

export default TeamList
