import React, { useState, useContext } from "react"
import { supabase } from "@/lib/supabase/browser-client"
import { ChatbotUIContext } from "@/context/context"

interface TeamInviteModalProps {
  open: boolean
  onClose: () => void
  teamId: string
  invitedBy: string // user id of the inviter
}

const TeamInviteModal: React.FC<TeamInviteModalProps> = ({
  open,
  onClose,
  teamId,
  invitedBy
}) => {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    if (!email.trim()) {
      setError("Email is required.")
      setLoading(false)
      return
    }
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.")
      setLoading(false)
      return
    }
    const { error } = await supabase
      .from("team_invites")
      .insert([
        { team_id: teamId, email, invited_by: invitedBy, status: "pending" }
      ])
    if (error) {
      setError(error.message)
    } else {
      setSuccess("Invitation sent!")
      setEmail("")
      onClose() // Close the modal on success
    }
    setLoading(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-bold">Invite User to Team</h2>
        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">
              User Email *
            </label>
            <input
              className="w-full rounded border px-3 py-2"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              type="email"
              disabled={loading}
            />
          </div>
          {error && <div className="text-sm text-red-500">{error}</div>}
          {success && <div className="text-sm text-green-500">{success}</div>}
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
              {loading ? "Inviting..." : "Invite"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TeamInviteModal
