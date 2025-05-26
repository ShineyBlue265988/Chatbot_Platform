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
    <div className="space-y-6 p-4">
      {/* High Usage Warning */}
      {isLimitReached && (
        <div
          className={`rounded-lg border p-4 ${
            isDark
              ? "border-red-800 bg-red-900/20 text-red-300"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          <div className="flex items-center space-x-2">
            <svg className="size-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium">High Usage Detected</span>
          </div>
          <p className="mt-1 text-sm">
            You have high token usage on some days. Consider monitoring your
            usage patterns.
          </p>
        </div>
      )}

      {/* Total Usage Card */}
      <Card
        className={`p-4 ${isDark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}
      >
        <h3
          className={`mb-2 text-lg font-semibold ${isDark ? "text-slate-100" : "text-slate-900"}`}
        >
          Total Usage This Month
        </h3>
        <div
          className={`text-2xl font-bold ${isDark ? "text-slate-50" : "text-slate-900"}`}
        >
          {stats.totalTokens.toLocaleString()} tokens
        </div>
      </Card>

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
        <div className="h-[300px]">
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
