import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { fetchTokenUsageStats, TokenUsageStats } from "@/lib/llm/token-usage"
import BarChart from "@/components/ui/bar-chart"
import { useTheme } from "next-themes"

interface UsageStatsProps {
  userId: string
}

export function UsageStats({ userId }: UsageStatsProps) {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<TokenUsageStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLimitReached, setIsLimitReached] = useState(false)
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted to avoid hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])

  const currentTheme = mounted ? resolvedTheme || theme : "light"
  const isDark = currentTheme === "dark"

  useEffect(() => {
    console.log("🚀 UsageStats useEffect triggered")
    console.log("👤 UserId for fetch:", userId)
    console.log("🌙 Theme:", currentTheme)
    console.log("⏰ Timestamp:", new Date().toISOString())

    if (userId) {
      loadUsageStats()
    } else {
      console.log("❌ No userId provided, skipping fetch")
    }
  }, [userId])

  const loadUsageStats = async () => {
    try {
      console.log("📡 Starting fetch for userId:", userId)
      console.log("🕐 Fetch started at:", new Date().toISOString())

      setLoading(true)
      setError(null)

      const data = await fetchTokenUsageStats(userId)

      console.log("✅ Fetch completed successfully")
      console.log("📈 Data received:", data)
      console.log("📊 Recent usage data:", data.recentUsage)
      console.log("🕑 Fetch completed at:", new Date().toISOString())

      setStats(data)
    } catch (err) {
      console.error("💥 Fetch failed:", err)
      console.log("🕒 Fetch failed at:", new Date().toISOString())
      setError("Failed to load usage statistics")
    } finally {
      console.log("🏁 Fetch process finished")
      setLoading(false)
    }
  }

  const handleLimitReached = (isReached: boolean) => {
    console.log("📊 Chart limit reached status:", isReached)
    setIsLimitReached(isReached)
  }

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="p-4">
        <div className="animate-pulse">Loading...</div>
      </div>
    )
  }

  if (loading) {
    console.log("🔄 Rendering loading state")
    return (
      <div className="p-4">
        <div className={`${isDark ? "text-slate-300" : "text-slate-600"}`}>
          Loading usage statistics...
        </div>
      </div>
    )
  }

  if (error) {
    console.log("❌ Rendering error state:", error)
    return (
      <div className="p-4">
        <div className={`${isDark ? "text-red-400" : "text-red-500"}`}>
          {error}
        </div>
      </div>
    )
  }

  if (!stats) {
    console.log("📭 Rendering no data state")
    return (
      <div className="p-4">
        <div className={`${isDark ? "text-slate-400" : "text-slate-500"}`}>
          No usage data available
        </div>
      </div>
    )
  }

  console.log("✅ Rendering UsageStats with data")

  return (
    <div className="space-y-6 ">
      {/* Usage by Provider */}
      <Card
        className={`p-4 ${isDark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}
      >
        <h3
          className={`mb-4 text-lg font-semibold ${isDark ? "text-slate-100" : "text-slate-900"}`}
        >
          Usage by Provider
        </h3>
        <div className="space-y-4">
          {Object.entries(stats.byProvider || {}).map(([provider, tokens]) => (
            <div key={provider} className="space-y-2">
              <div
                className={`flex justify-between text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}
              >
                <span className="capitalize">{provider}</span>
                <span>{tokens.toLocaleString()} tokens</span>
              </div>
              <Progress
                value={(tokens / stats.totalTokens) * 100}
                className={`h-2 ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Usage Chart */}
      <Card
        className={`p-4 ${isDark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}
      >
        <h3
          className={`mb-4 text-lg font-semibold ${isDark ? "text-slate-100" : "text-slate-900"}`}
        >
          Daily Usage Trend
        </h3>
        <div>
          <BarChart
            data={stats.recentUsage}
            userId={userId}
            onLimitReached={handleLimitReached}
          />
        </div>
      </Card>
    </div>
  )
}
