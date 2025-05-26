import React, { useEffect, useState, useCallback } from "react"
import { Bar } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from "chart.js"
import { useTheme } from "next-themes"
import { supabase } from "@/lib/supabase/browser-client"
import { useContext } from "react"
import { ChatbotUIContext } from "@/context/context"

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface RecentUsageData {
  date: string
  tokens: number
}

interface DailyUsageData {
  name: string
  value: number
}

interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor: string[]
    borderColor: string[]
    borderWidth: number
  }[]
}

interface ProviderUsageData {
  provider: string
  tokens: number
}

interface BarChartProps {
  data?: RecentUsageData[] | DailyUsageData[]
  agentId?: string
  ModelProvider?: string
  onLimitReached?: (isReached: boolean) => void
}

type ViewType = "daily" | "provider"

interface DailyLimitAlert {
  show: boolean
  message: string
  type: "error"
  percentage: number
}

const BarChart: React.FC<BarChartProps> = ({
  data,
  agentId,
  ModelProvider,
  onLimitReached
}) => {
  // Get current user from context
  const { profile } = useContext(ChatbotUIContext)
  const currentUserId = profile?.user_id

  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewType, setViewType] = useState<ViewType>("daily")
  const [dailyLimitAlert, setDailyLimitAlert] = useState<DailyLimitAlert>({
    show: false,
    message: "",
    type: "error",
    percentage: 0
  })
  const [dailyUsageStats, setDailyUsageStats] = useState<{
    dailyUsage: number
    dailyLimit: number | null
    percentage: number
  }>({
    dailyUsage: 0,
    dailyLimit: null,
    percentage: 0
  })

  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted to avoid hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchDailyUsage = useCallback(async () => {
    if (!currentUserId) {
      console.log("⚠️ No user logged in, showing mock data")
      prepareMockData()
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      console.log(
        "📡 Fetching daily usage data for current user:",
        currentUserId
      )

      const dailyData = []
      const today = new Date()

      // Fetch usage for last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)

        const startOfDay = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate()
        )
        const endOfDay = new Date(startOfDay)
        endOfDay.setDate(endOfDay.getDate() + 1)

        const { data: usageData, error: usageError } = await supabase
          .from("token_usage")
          .select("*")
          .eq("user_id", currentUserId)
          .gte("created_at", startOfDay.toISOString())
          .lt("created_at", endOfDay.toISOString())

        if (usageError) {
          console.error(
            `❌ Error fetching usage for ${date.toDateString()}:`,
            usageError
          )
          continue
        }

        const dayUsage =
          usageData?.reduce((total, record) => {
            return total + (record.total_tokens || 0)
          }, 0) || 0

        const dayName = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric"
        })

        dailyData.push({
          name: dayName,
          value: dayUsage
        })
      }

      console.log("📈 Fetched 7-day usage data:", dailyData)
      prepareChartData(dailyData)
    } catch (err) {
      console.error("💥 Error fetching daily usage:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch data")
      prepareMockData()
    } finally {
      setIsLoading(false)
    }
  }, [currentUserId])

  const fetchProviderUsage = useCallback(async () => {
    if (!currentUserId) {
      console.log("⚠️ No user logged in, showing mock data")
      prepareMockProviderData()
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      console.log(
        "📡 Fetching provider usage data for current user:",
        currentUserId
      )

      // Get current month's date range
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      const { data: usageData, error: usageError } = await supabase
        .from("token_usage")
        .select("*")
        .eq("user_id", currentUserId)
        .gte("created_at", startOfMonth.toISOString())

      if (usageError) {
        console.error("❌ Error fetching provider usage:", usageError)
        return
      }

      // Group by provider
      const providerUsage: { [key: string]: number } = {}

      usageData?.forEach(record => {
        const provider = record.model_provider || "Unknown"
        providerUsage[provider] =
          (providerUsage[provider] || 0) + (record.total_tokens || 0)
      })

      // Convert to chart format
      const providerData = Object.entries(providerUsage).map(
        ([provider, tokens]) => ({
          name: provider,
          value: tokens
        })
      )

      console.log("📈 Fetched provider usage data:", providerData)
      prepareChartData(providerData)
    } catch (err) {
      console.error("💥 Error fetching provider usage:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch data")
      prepareMockProviderData()
    } finally {
      setIsLoading(false)
    }
  }, [currentUserId])

  const checkDailyLimits = useCallback(async () => {
    if (!currentUserId) {
      console.log("⚠️ No user logged in, cannot check limits")
      return
    }

    try {
      console.log("🔍 Checking daily limits for current user:", currentUserId)

      // Get today's date range
      const now = new Date()
      const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      )
      const endOfDay = new Date(startOfDay)
      endOfDay.setDate(endOfDay.getDate() + 1)

      // 1. Fetch today's usage data
      const { data: usageData, error: usageError } = await supabase
        .from("token_usage")
        .select("*")
        .eq("user_id", currentUserId)
        .gte("created_at", startOfDay.toISOString())
        .lt("created_at", endOfDay.toISOString())

      if (usageError) {
        console.error("❌ Error fetching usage data:", usageError)
        return
      }

      // 2. Fetch user's daily limit
      const { data: limits, error: limitsError } = await supabase
        .from("usage_limits")
        .select("*")
        .eq("type", "daily")
        .eq("target", currentUserId)
      console.log("🔍 Fetched limits:---------------?", limits)
      if (limitsError) {
        console.error("❌ Error fetching limits:", limitsError)
        return
      }

      // 3. Calculate today's usage
      const dailyUsage =
        usageData?.reduce((total, record) => {
          return total + (record.total_tokens || 0)
        }, 0) || 0

      // 4. Get daily limit
      const dailyLimit = limits?.[0]?.usage_limit || null

      console.log("📊 Daily stats:", { dailyUsage, dailyLimit })

      if (dailyLimit) {
        const percentageUsed = (dailyUsage / dailyLimit) * 100
        const isLimitReached = dailyUsage >= dailyLimit

        // Update daily usage stats for display
        setDailyUsageStats({
          dailyUsage,
          dailyLimit,
          percentage: percentageUsed
        })

        console.log(
          `📈 Usage: ${dailyUsage}/${dailyLimit} tokens (${Math.round(percentageUsed)}%)`
        )

        // Only show alert if limit is reached or exceeded
        if (isLimitReached) {
          setDailyLimitAlert({
            show: true,
            message: `🚫 Daily limit reached! You've used ${dailyUsage.toLocaleString()} of ${dailyLimit.toLocaleString()} tokens today.`,
            type: "error",
            percentage: percentageUsed
          })
          onLimitReached?.(true)
        } else {
          setDailyLimitAlert({
            show: false,
            message: "",
            type: "error",
            percentage: percentageUsed
          })
          onLimitReached?.(false)
        }
      } else {
        console.log("ℹ️ No daily limit set for this user")
        setDailyUsageStats({
          dailyUsage,
          dailyLimit: null,
          percentage: 0
        })
        setDailyLimitAlert({
          show: false,
          message: "",
          type: "error",
          percentage: 0
        })
      }
    } catch (error) {
      console.error("💥 Error checking daily limits:", error)
    }
  }, [currentUserId, onLimitReached])

  // Update useEffect hooks to use currentUserId instead of userId
  useEffect(() => {
    if (currentUserId && mounted) {
      if (viewType === "daily") {
        fetchDailyUsage()
      } else if (viewType === "provider") {
        fetchProviderUsage()
      }
    } else if (mounted) {
      // Show mock data when no user is logged in
      if (viewType === "daily") {
        prepareMockData()
      } else {
        prepareMockProviderData()
      }
    }
  }, [viewType, currentUserId, mounted, fetchDailyUsage, fetchProviderUsage])

  // Check daily limits when component mounts or currentUserId changes
  useEffect(() => {
    if (currentUserId && mounted) {
      checkDailyLimits()
    }
  }, [currentUserId, mounted, checkDailyLimits])

  // Get current theme (dark/light)
  const currentTheme = mounted ? resolvedTheme || theme : "light"
  const isDark = currentTheme === "dark"

  const prepareMockData = () => {
    console.log("🔧 Preparing mock daily usage data")

    const today = new Date()
    const mockData = []

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)

      const dayName = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric"
      })

      const baseUsage = 1000 + Math.random() * 2000
      mockData.push({
        name: dayName,
        value: Math.floor(baseUsage)
      })
    }

    console.log("🔧 Mock daily data prepared:", mockData)
    prepareChartData(mockData)
  }

  const prepareMockProviderData = () => {
    console.log("🔧 Preparing mock provider usage data")

    const providers = ["OpenAI", "Anthropic", "Google", "Cohere"]
    const mockData = providers.map(provider => ({
      name: provider,
      value: Math.floor(1000 + Math.random() * 5000)
    }))

    console.log("🔧 Mock provider data prepared:", mockData)
    prepareChartData(mockData)
  }

  // Theme-based colors
  const getThemeColors = () => {
    if (isDark) {
      return {
        textColor: "#f8fafc",
        gridColor: "rgba(148, 163, 184, 0.2)",
        backgroundColor: "transparent",
        tooltipBackground: "#1e293b",
        tooltipBorder: "#475569",
        tooltipText: "#f8fafc",
        titleColor: "#f1f5f9",
        legendColor: "#e2e8f0",
        normal: "rgba(96, 165, 250, 0.7)",
        normalBorder: "rgba(96, 165, 250, 1)",
        limitReached: "rgba(248, 113, 113, 0.7)",
        limitReachedBorder: "rgba(248, 113, 113, 1)",
        // Provider colors
        providers: [
          "rgba(96, 165, 250, 0.7)", // Blue
          "rgba(34, 197, 94, 0.7)", // Green
          "rgba(251, 191, 36, 0.7)", // Amber
          "rgba(168, 85, 247, 0.7)", // Purple
          "rgba(236, 72, 153, 0.7)" // Pink
        ]
      }
    } else {
      return {
        textColor: "#1e293b",
        gridColor: "rgba(148, 163, 184, 0.3)",
        backgroundColor: "transparent",
        tooltipBackground: "#ffffff",
        tooltipBorder: "#e2e8f0",
        tooltipText: "#1e293b",
        titleColor: "#0f172a",
        legendColor: "#334155",
        normal: "rgba(59, 130, 246, 0.6)",
        normalBorder: "rgba(59, 130, 246, 1)",
        limitReached: "rgba(239, 68, 68, 0.6)",
        limitReachedBorder: "rgba(239, 68, 68, 1)",
        // Provider colors
        providers: [
          "rgba(59, 130, 246, 0.6)", // Blue
          "rgba(34, 197, 94, 0.6)", // Green
          "rgba(245, 158, 11, 0.6)", // Amber
          "rgba(147, 51, 234, 0.6)", // Purple
          "rgba(219, 39, 119, 0.6)" // Pink
        ]
      }
    }
  }

  const normalizeData = (
    rawData: RecentUsageData[] | DailyUsageData[]
  ): DailyUsageData[] => {
    console.log("🔄 Normalizing data:", rawData)

    if (!rawData || rawData.length === 0) {
      console.log("❌ No data to normalize")
      return []
    }

    if ("date" in rawData[0] && "tokens" in rawData[0]) {
      console.log("📅 Converting RecentUsageData format")
      const converted = (rawData as RecentUsageData[]).map(item => {
        const date = new Date(item.date)
        const formattedDate = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric"
        })

        return {
          name: formattedDate,
          value: item.tokens
        }
      })
      console.log("✅ Converted data:", converted)
      return converted
    }

    if ("name" in rawData[0] && "value" in rawData[0]) {
      console.log("📊 Data already in correct format")
      return rawData as DailyUsageData[]
    }

    console.log("❌ Unknown data format:", rawData[0])
    return []
  }

  const prepareChartData = (rawData: RecentUsageData[] | DailyUsageData[]) => {
    console.log("🎨 Preparing chart data from raw data:", rawData)

    if (!rawData || rawData.length === 0) {
      console.log("❌ No data available for chart")
      setError("No usage data available")
      return
    }

    const normalizedData = normalizeData(rawData)

    if (normalizedData.length === 0) {
      console.log("❌ Failed to normalize data")
      setError("Invalid data format")
      return
    }

    const labels = normalizedData.map(item => item.name)
    const values = normalizedData.map(item => item.value)

    const colors = getThemeColors()

    // Different coloring logic for daily vs provider view
    let backgroundColor: string[]
    let borderColor: string[]

    if (viewType === "daily") {
      // For daily view, color based on daily limit
      backgroundColor = values.map((value, index) => {
        const isToday = index === values.length - 1
        if (
          isToday &&
          dailyUsageStats.dailyLimit &&
          value >= dailyUsageStats.dailyLimit
        ) {
          return colors.limitReached
        }
        return colors.normal
      })

      borderColor = values.map((value, index) => {
        const isToday = index === values.length - 1
        if (
          isToday &&
          dailyUsageStats.dailyLimit &&
          value >= dailyUsageStats.dailyLimit
        ) {
          return colors.limitReachedBorder
        }
        return colors.normalBorder
      })
    } else {
      // For provider view, use different colors for each provider
      backgroundColor = values.map(
        (_, index) => colors.providers[index % colors.providers.length]
      )
      borderColor = backgroundColor.map(color =>
        color.replace("0.6", "1").replace("0.7", "1")
      )
    }

    const chartConfig = {
      labels: labels,
      datasets: [
        {
          label:
            viewType === "daily" ? "Daily Token Usage" : "Provider Token Usage",
          data: values,
          backgroundColor,
          borderColor,
          borderWidth: 1
        }
      ]
    }

    console.log("🎨 Final chart configuration:", chartConfig)
    setChartData(chartConfig)

    // Check if today's usage reaches the limit (only for daily view)
    if (viewType === "daily") {
      const todayUsage = values[values.length - 1]
      if (
        currentUserId &&
        dailyUsageStats.dailyLimit &&
        todayUsage >= dailyUsageStats.dailyLimit
      ) {
        console.log("📊 Daily limit reached, triggering alert...")
        checkDailyLimits()
      }
    }
  }

  // Helper function to get chart title
  const getChartTitle = () => {
    if (viewType === "daily") {
      return (
        <>
          <div>Daily Token Usage </div> <div>(Last 7 Days)</div>
        </>
      )
    } else {
      return "Token Usage by Provider (This Month)"
    }
  }

  // Theme-aware chart options
  const getChartOptions = () => {
    const colors = getThemeColors()

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top" as const,
          labels: {
            color: colors.legendColor,
            font: {
              size: 12,
              family: "Inter, system-ui, sans-serif"
            }
          }
        },
        title: {
          display: false // Remove the chart title
        },
        tooltip: {
          backgroundColor: colors.tooltipBackground,
          titleColor: colors.tooltipText,
          bodyColor: colors.tooltipText,
          borderColor: colors.tooltipBorder,
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            label: function (context: any) {
              const value = context.raw || 0
              const labels = [`Usage: ${value.toLocaleString()} tokens`]

              // Add limit info if available and this is today (for daily view)
              if (
                viewType === "daily" &&
                context.dataIndex === context.dataset.data.length - 1 &&
                dailyUsageStats.dailyLimit
              ) {
                const percentage = Math.round(
                  (value / dailyUsageStats.dailyLimit) * 100
                )
                labels.push(
                  `Limit: ${dailyUsageStats.dailyLimit.toLocaleString()} tokens`
                )
                labels.push(`Percentage: ${percentage}%`)
              }

              return labels
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Tokens Used",
            color: colors.textColor,
            font: {
              size: 12,
              weight: "bold" as const,
              family: "Inter, system-ui, sans-serif"
            }
          },
          ticks: {
            color: colors.textColor,
            font: {
              size: 11,
              family: "Inter, system-ui, sans-serif"
            },
            callback: function (value: any) {
              return value.toLocaleString()
            }
          },
          grid: {
            color: colors.gridColor,
            drawBorder: false
          }
        },
        x: {
          title: {
            display: true,
            text: viewType === "daily" ? "Date" : "Provider",
            color: colors.textColor,
            font: {
              size: 12,
              weight: "bold" as const,
              family: "Inter, system-ui, sans-serif"
            }
          },
          ticks: {
            color: colors.textColor,
            font: {
              size: 11,
              family: "Inter, system-ui, sans-serif"
            },
            maxRotation: 45,
            minRotation: 0
          },
          grid: {
            color: colors.gridColor,
            drawBorder: false
          }
        }
      },
      interaction: {
        intersect: false,
        mode: "index" as const
      },
      animation: {
        duration: 750,
        easing: "easeInOutQuart" as const
      }
    }
  }

  console.log("🖼️ Rendering BarChart:")
  console.log("  - Current User ID:", currentUserId)
  console.log("  - Loading:", isLoading)
  console.log("  - Error:", error)
  console.log("  - Has chart data:", !!chartData)
  console.log("  - View type:", viewType)
  console.log("  - Daily usage stats:", dailyUsageStats)
  console.log("  - Alert:", dailyLimitAlert)

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    )
  }

  // Show message when no user is logged in
  if (!currentUserId) {
    return (
      <div className="flex size-full flex-col space-y-4">
        <div
          className={`rounded-lg border p-4 ${
            isDark
              ? "border-slate-700 bg-slate-800"
              : "border-slate-200 bg-slate-50"
          }`}
        >
          <div className="text-center">
            <h5
              className={`text-lg font-semibold ${
                isDark ? "text-slate-200" : "text-slate-800"
              }`}
            >
              Please Log In
            </h5>
            <p
              className={`mt-2 text-sm ${
                isDark ? "text-slate-400" : "text-slate-600"
              }`}
            >
              You need to be logged in to view your usage statistics and set
              limits.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex size-full flex-col space-y-4">
      {/* Top Section - Today's Usage Stats */}
      <div
        className={`rounded-lg border p-4 ${
          isDark
            ? "border-slate-700 bg-slate-800"
            : "border-slate-200 bg-slate-50"
        }`}
      >
        <div className=" mb-3 items-center justify-between">
          <div>
            <h5
              className={`text-lg font-semibold ${
                isDark ? "text-slate-200" : "text-slate-800"
              }`}
            >
              Today&apos;s Usage
            </h5>
          </div>
          <div>
            <div className="text-sm text-slate-500">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
              })}
            </div>
          </div>
        </div>

        {dailyUsageStats.dailyLimit ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span
                  className={`text-sm font-medium ${
                    isDark ? "text-slate-300" : "text-slate-700"
                  }`}
                >
                  {dailyUsageStats.dailyUsage.toLocaleString()} /{" "}
                  {dailyUsageStats.dailyLimit.toLocaleString()} tokens
                </span>
                <div
                  className={`rounded px-2 py-1 text-xs font-bold ${
                    dailyUsageStats.percentage >= 100
                      ? "bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200"
                      : dailyUsageStats.percentage >= 80
                        ? "bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200"
                        : "bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200"
                  }`}
                >
                  {Math.round(dailyUsageStats.percentage)}%
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-3 w-full rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  dailyUsageStats.percentage >= 100
                    ? "bg-red-600 dark:bg-red-500"
                    : dailyUsageStats.percentage >= 80
                      ? "bg-amber-600 dark:bg-amber-500"
                      : "bg-green-600 dark:bg-green-500"
                }`}
                style={{
                  width: `${Math.min(dailyUsageStats.percentage, 100)}%`
                }}
              ></div>
            </div>
          </div>
        ) : (
          <div
            className={`text-sm ${
              isDark ? "text-slate-400" : "text-slate-600"
            }`}
          >
            Today&apos;s Usage: {dailyUsageStats.dailyUsage.toLocaleString()}{" "}
            tokens
            <br />
            <span className="text-xs">No daily limit set</span>
          </div>
        )}
      </div>

      {/* Daily Limit Alert - Only shows when limit is reached */}
      {dailyLimitAlert.show && (
        <div
          className={`rounded-lg border border-red-200 bg-red-50 p-3 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">
                {dailyLimitAlert.message}
              </span>
              <div
                className={`ml-2 rounded bg-red-200 px-2 py-1 text-xs font-bold text-red-800 dark:bg-red-800 dark:text-red-200`}
              >
                {Math.round(dailyLimitAlert.percentage)}%
              </div>
            </div>
            <button
              onClick={() =>
                setDailyLimitAlert(prev => ({ ...prev, show: false }))
              }
              className={`ml-2 text-lg leading-none text-red-600 hover:opacity-70 dark:text-red-400`}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* View Selector */}
      <div className=" justify-right items-center">
        <h3
          className={`text-lg font-semibold ${
            isDark ? "text-slate-200" : "text-slate-800"
          }`}
        >
          Usage Analytics
        </h3>

        <select
          value={viewType}
          onChange={e => setViewType(e.target.value as ViewType)}
          className={`rounded-md border px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            isDark
              ? "border-slate-600 bg-slate-700 text-slate-200 hover:bg-slate-600"
              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          <option value="daily">Daily Usage</option>
          <option value="provider">By Provider</option>
        </select>
      </div>

      {/* Chart Section - SEPARATE CARD */}
      <div
        className={`flex-1 rounded-lg border p-4 ${
          isDark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"
        }`}
      >
        {/* Chart Title inside the card */}
        <div className="mb-4">
          <h4
            className={`font-small text-base ${
              isDark ? "text-slate-200" : "text-slate-800"
            }`}
          >
            {getChartTitle()}
          </h4>
        </div>

        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className={`${isDark ? "text-slate-300" : "text-slate-600"}`}>
              Loading {viewType} usage data...
            </div>
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center">
            <div className={`${isDark ? "text-red-400" : "text-red-500"}`}>
              Error: {error}
            </div>
          </div>
        ) : !chartData ? (
          <div className="flex h-full items-center justify-center">
            <div className={`${isDark ? "text-slate-400" : "text-slate-500"}`}>
              No usage data available
            </div>
          </div>
        ) : (
          <div className="h-64">
            <Bar data={chartData} options={getChartOptions()} />
          </div>
        )}
      </div>
    </div>
  )
}

export { BarChart }
export default BarChart
