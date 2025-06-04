import { supabase } from "@/lib/supabase/browser-client"

export const getPendingInvitesByEmail = async (email: string) => {
  const { data, error } = await supabase
    .from("team_invites")
    .select("*")
    .eq("email", email)
    .eq("status", "pending")
  if (error) throw new Error(error.message)
  return data
}

export const acceptInvite = async (
  inviteId: string,
  teamId: string,
  userId: string
) => {
  // 1. Add to team_members
  const { error: memberError } = await supabase
    .from("team_members")
    .insert([
      { team_id: teamId, user_id: userId, role: "Member", status: "active" }
    ])
  if (memberError) throw new Error(memberError.message)

  // 2. Update invite status
  const { error: inviteError } = await supabase
    .from("team_invites")
    .update({ status: "accepted" })
    .eq("id", inviteId)
  if (inviteError) throw new Error(inviteError.message)
}

export const declineInvite = async (inviteId: string) => {
  const { error } = await supabase
    .from("team_invites")
    .update({ status: "declined" })
    .eq("id", inviteId)
  if (error) throw new Error(error.message)
}
