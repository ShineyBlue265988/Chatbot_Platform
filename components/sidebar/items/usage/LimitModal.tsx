import React, { useState } from "react"

interface LimitModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  workspaceId: string
}

const LIMIT_TYPES = [
  { value: "global", label: "Global" },
  { value: "provider", label: "Provider" },
  { value: "model", label: "Model" },
  { value: "user", label: "User" },
  { value: "agent", label: "Agent" }

  // { value: "agent", label: "Agent" }, // For future
]

const AVAILABLE_PROVIDERS = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "google", label: "Google" },
  { value: "mistral", label: "Mistral" },
  { value: "groq", label: "Groq" },
  { value: "perplexity", label: "Perplexity" }
]

export const LimitModal: React.FC<LimitModalProps> = ({
  open,
  onClose,
  onSuccess,
  workspaceId
}) => {
  const [type, setType] = useState("global")
  const [target, setTarget] = useState("")
  const [userId, setUserId] = useState("")
  const [limit, setLimit] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const body: any = {
        workspace_id: workspaceId,
        type,
        usage_limit: parseInt(limit, 10)
      }
      if (type === "provider") body.target = target
      if (type === "user") body.user_id = userId
      const res = await fetch("/api/usage/limits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Failed to save limit")
      } else {
        onSuccess()
        onClose()
      }
    } catch (err: any) {
      setError(err.message || "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="w-full max-w-md rounded bg-white p-6 shadow-lg dark:bg-gray-900">
        <h2 className="mb-4 text-xl font-bold">New Usage Limit</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="mb-1 block font-semibold">Type</label>
            <select
              className="w-full rounded border px-2 py-1"
              value={type}
              onChange={e => setType(e.target.value)}
            >
              {LIMIT_TYPES.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          {type === "provider" && (
            <div className="mb-4">
              <label className="mb-1 block font-semibold">Provider</label>
              <select
                className="w-full rounded border px-2 py-1"
                value={target}
                onChange={e => setTarget(e.target.value)}
                required
              >
                <option value="">Select a provider</option>
                {AVAILABLE_PROVIDERS.map(provider => (
                  <option key={provider.value} value={provider.value}>
                    {provider.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          {type === "user" && (
            <div className="mb-4">
              <label className="mb-1 block font-semibold">User ID</label>
              <input
                className="w-full rounded border px-2 py-1"
                value={userId}
                onChange={e => setUserId(e.target.value)}
                placeholder="User ID"
                required
              />
            </div>
          )}
          <div className="mb-4">
            <label className="mb-1 block font-semibold">Token Limit</label>
            <input
              className="w-full rounded border px-2 py-1"
              type="number"
              min={1}
              value={limit}
              onChange={e => setLimit(e.target.value)}
              required
            />
          </div>
          {error && <div className="mb-2 text-red-600">{error}</div>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="rounded bg-gray-300 px-3 py-1 hover:bg-gray-400"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
