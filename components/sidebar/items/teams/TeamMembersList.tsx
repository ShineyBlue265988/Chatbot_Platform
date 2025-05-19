import React, { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/browser-client"

interface TeamMembersListProps {
  teamId: string
  currentUserId: string // Pass the logged-in user's id to check for owner/admin
}

const ROLE_OPTIONS = ["owner", "admin", "member"]

const TeamMembersList: React.FC<TeamMembersListProps> = ({
  teamId,
  currentUserId
}) => {
  const [members, setMembers] = useState<any[]>([])
  const [invites, setInvites] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showInviteModal, setShowInviteModal] = useState(false)

  useEffect(() => {
    const fetchMembersAndInvites = async () => {
      setLoading(true)
      setError(null)
      // Fetch team members
      const { data: memberData, error: memberError } = await supabase
        .from("team_members")
        .select(
          "id, user_id, role, profiles: user_id (display_name, username, image_url)"
        )
        .eq("team_id", teamId)
      // Fetch team invites
      const { data: inviteData, error: inviteError } = await supabase
        .from("team_invites")
        .select("id, email, invited_by, status, created_at, token, team_id")
        .eq("team_id", teamId)
      if (memberError || inviteError)
        setError((memberError?.message || "") + (inviteError?.message || ""))
      else {
        setMembers(memberData || [])
        setInvites(inviteData || [])
      }
      setLoading(false)
    }
    fetchMembersAndInvites()
  }, [teamId])

  const handleRoleChange = async (memberId: string, newRole: string) => {
    setLoading(true)
    setError(null)
    const { error } = await supabase
      .from("team_members")
      .update({ role: newRole as "admin" | "member" | "viewer" })
      .eq("id", memberId)
    if (error) setError(error.message)
    else
      setMembers(
        members.map(m => (m.id === memberId ? { ...m, role: newRole } : m))
      )
    setLoading(false)
  }

  const handleRemove = async (memberId: string) => {
    setLoading(true)
    setError(null)
    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("id", memberId)
    if (error) setError(error.message)
    else setMembers(members.filter(m => m.id !== memberId))
    setLoading(false)
  }

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

  // Find the owner (there should be only one)
  const owner = members.find(m => m.role === "owner")
  const isCurrentUserOwner = owner && owner.user_id === currentUserId
  const currentUser = members.find(m => m.user_id === currentUserId)
  const isCurrentUserAdmin =
    currentUser &&
    (currentUser.role === "admin" || currentUser.role === "owner")

  if (loading) return <div>Loading team members...</div>
  if (error) return <div className="text-red-500">{error}</div>
  if (!members.length && !invites.length)
    return <div>No team members or invites found.</div>

  return (
    <div>
      <h3 className="mb-2 font-bold">Team Members</h3>
      {(isCurrentUserOwner || isCurrentUserAdmin) && (
        <button
          className="mb-4 rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700 dark:bg-blue-400 dark:text-black dark:hover:bg-blue-500"
          onClick={() => setShowInviteModal(true)}
        >
          + New User
        </button>
      )}
      {showInviteModal && (
        <div className="mb-4">
          {/* <TeamInviteModal open={showInviteModal} onClose={() => setShowInviteModal(false)} teamId={teamId} invitedBy={currentUserId} /> */}
        </div>
      )}
      <ul>
        {/* Active Members */}
        {members.map(member => (
          <li
            key={member.id}
            className="mb-2 flex items-center gap-3 rounded border p-2"
          >
            {/* Avatar/Icon */}
            <span className="inline-block size-8 overflow-hidden rounded-full bg-gray-200">
              {member.profiles?.image_url ? (
                <img
                  src={member.profiles.image_url}
                  alt="avatar"
                  className="size-full object-cover"
                />
              ) : (
                <svg
                  className="size-full text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 8-4 8-4s8 0 8 4" />
                </svg>
              )}
            </span>
            {/* Name & Email */}
            <div className="flex min-w-[120px] flex-col">
              <span className="font-semibold">
                {member.profiles?.display_name || "Unknown"}
                {member.user_id === currentUserId && " (You)"}
              </span>
              <span className="text-xs text-gray-500">
                {member.profiles?.username || "-"}
              </span>
            </div>
            {/* Role */}
            <span className="mx-2">| Role: </span>
            {isCurrentUserOwner && member.role !== "owner" ? (
              <select
                value={member.role}
                onChange={e => handleRoleChange(member.id, e.target.value)}
                className="rounded border px-1 py-0.5 dark:bg-black dark:text-white"
                disabled={loading}
              >
                {ROLE_OPTIONS.filter(role => role !== "owner").map(role => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            ) : (
              <span className="font-semibold">{member.role}</span>
            )}
            {/* Status */}
            <span className="ml-2 rounded-full border border-green-300 bg-green-100 px-2 py-0.5 text-xs dark:border-green-600 dark:bg-green-700">
              Active
            </span>
            {/* Delete button */}
            {isCurrentUserOwner && member.role !== "owner" && (
              <button
                className="ml-4 rounded p-1 hover:bg-red-100 focus:outline-none dark:hover:bg-red-900"
                onClick={() => handleRemove(member.id)}
                disabled={loading}
                aria-label="Remove member"
                title="Remove member"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="size-5 text-red-500"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </li>
        ))}
        {/* Invited Users */}
        {invites.map(invite => (
          <li
            key={invite.id}
            className="mb-2 flex items-center gap-3 rounded border bg-yellow-50 p-2 dark:bg-yellow-900/20"
          >
            {/* Avatar/Icon */}
            <span className="inline-block size-8 overflow-hidden rounded-full bg-gray-200">
              <svg
                className="size-full text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 8-4 8-4s8 0 8 4" />
              </svg>
            </span>
            {/* Email */}
            <div className="flex min-w-[120px] flex-col">
              <span className="font-semibold">{invite.email}</span>
              <span className="text-xs text-gray-500">(Invited)</span>
            </div>
            {/* Status */}
            <span
              className={`ml-2 rounded-full border px-2 py-0.5 text-xs ${invite.status === "pending" ? "border-yellow-300 bg-yellow-100 dark:border-yellow-600 dark:bg-yellow-700" : invite.status === "declined" ? "border-red-300 bg-red-100 dark:border-red-600 dark:bg-red-700" : "border-green-300 bg-green-100 dark:border-green-600 dark:bg-green-700"}`}
            >
              {invite.status.charAt(0).toUpperCase() + invite.status.slice(1)}
            </span>
            {/* Resend/Cancel buttons for pending invites */}
            {invite.status === "pending" &&
              (isCurrentUserOwner || isCurrentUserAdmin) && (
                <>
                  <button
                    className="ml-4 rounded bg-blue-100 p-1 text-xs text-blue-700 hover:bg-blue-200"
                    onClick={() => handleResendInvite(invite.id)}
                    disabled={loading}
                    aria-label="Resend invite"
                    title="Resend invite"
                  >
                    Resend
                  </button>
                  <button
                    className="ml-2 rounded bg-red-100 p-1 text-xs text-red-700 hover:bg-red-200"
                    onClick={() => handleCancelInvite(invite.id)}
                    disabled={loading}
                    aria-label="Cancel invite"
                    title="Cancel invite"
                  >
                    Cancel
                  </button>
                </>
              )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default TeamMembersList
