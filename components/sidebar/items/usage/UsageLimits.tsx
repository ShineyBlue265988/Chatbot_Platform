import React, { useEffect, useState } from "react"
import { LimitDisplay } from "@/components/ui/limit-display"
import { fetchTokenUsage } from "@/lib/llm/fetchTokenUsage"
import { useContext } from "react"
import { ChatbotUIContext } from "@/context/context"
import { LimitModal } from "./LimitModal"

const UsageLimits = () => {
  const { selectedWorkspace, profile, workspaces } =
    useContext(ChatbotUIContext)
  const [usage, setUsage] = useState<any>(null)
  const [limits, setLimits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const fetchAll = async () => {
    if (!selectedWorkspace?.id) return
    setLoading(true)
    try {
      const [usageData, limitsData] = await Promise.all([
        fetchTokenUsage(selectedWorkspace.id),
        fetch(`/api/usage/limits?workspaceId=${selectedWorkspace.id}`).then(
          res => res.json()
        )
      ])
      setUsage(usageData)
      setLimits(limitsData)
    } catch (err) {
      console.error("[UsageLimits] Error fetching usage/limits:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedWorkspace?.id) {
      fetchAll()
    }
  }, [selectedWorkspace?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Helper to get limit for a type/target
  const getLimit = (type: string, target?: string, userId?: string) => {
    if (type === "user" && userId) {
      return (
        limits.find(l => l.type === "user" && l.user_id === userId)?.limit ||
        "—"
      )
    }
    if (type === "model" && target) {
      return (
        limits.find(l => l.type === "model" && l.target === target)?.limit ||
        "—"
      )
    }
    if (type === "global") {
      return limits.find(l => l.type === "global")?.limit || "—"
    }
    if (type === "provider" && target) {
      return (
        limits.find(l => l.type === "provider" && l.target === target)?.limit ||
        "—"
      )
    }
    return "—"
  }

  if (!selectedWorkspace) {
    return <div className="p-4">Please select a workspace</div>
  }

  if (loading) {
    return <div className="p-4">Loading usage/limits data...</div>
  }

  if (!usage) {
    return <div className="p-4">No usage data found.</div>
  }

  return (
    <div className="space-y-6 p-4">
      <LimitModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={fetchAll}
        workspaceId={selectedWorkspace.id}
      />

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Usage Limits</h2>
        <button
          className="rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700"
          onClick={() => setShowModal(true)}
        >
          New Limits
        </button>
      </div>

      <div>
        <h3 className="mb-2 text-lg font-semibold">Global Limit</h3>
        <div className="flex items-center justify-between">
          <span>Total Tokens Used</span>
          <LimitDisplay used={usage.global} limit={getLimit("global")} />
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-lg font-semibold">Provider Limits</h3>
        {Object.entries(usage.byProvider || {}).map(([provider, used]) => (
          <div key={provider} className="flex items-center justify-between">
            <span>{provider}</span>
            <LimitDisplay
              used={used as number}
              limit={getLimit("provider", provider)}
            />
          </div>
        ))}
      </div>

      <div>
        <h3 className="mb-2 text-lg font-semibold">User Limits</h3>
        {Object.entries(usage.byUser).map(([userId, used]) => (
          <div key={userId} className="flex items-center justify-between">
            <span>
              {profile && profile.user_id === userId
                ? profile.display_name || userId
                : userId}
            </span>
            <LimitDisplay
              used={used as number}
              limit={getLimit("user", undefined, userId)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default UsageLimits
