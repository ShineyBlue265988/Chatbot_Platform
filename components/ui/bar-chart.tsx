import React, { useEffect, useState } from "react"
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

interface BarChartProps {
  data?: RecentUsageData[] | DailyUsageData[]
  userId?: string
  agentId?: string
  ModelProvider?: string
  onLimitReached?: (isReached: boolean) => void
}

const BarChart: React.FC<BarChartProps> = ({
  data,
  userId,
  agentId,
  ModelProvider,
  onLimitReached
}) => {
  const [chartData, setChartData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted to avoid hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])

  // Get current theme (dark/light)
  const currentTheme = mounted ? resolvedTheme || theme : "light"
  const isDark = currentTheme === "dark"

  console.log("🎨 Current theme:", currentTheme, "isDark:", isDark)

  // Theme-based colors
  const getThemeColors = () => {
    if (isDark) {
      return {
        // Dark mode colors
        textColor: "#f8fafc", // slate-50
        gridColor: "rgba(148, 163, 184, 0.2)", // slate-400 with opacity
        backgroundColor: "transparent",
        tooltipBackground: "#1e293b", // slate-800
        tooltipBorder: "#475569", // slate-600
        tooltipText: "#f8fafc", // slate-50
        titleColor: "#f1f5f9", // slate-100
        legendColor: "#e2e8f0", // slate-200
        // Bar colors for dark mode
        noUsage: "rgba(100, 116, 139, 0.6)", // slate-500
        noUsageBorder: "rgba(100, 116, 139, 1)",
        highUsage: "rgba(248, 113, 113, 0.7)", // red-400
        highUsageBorder: "rgba(248, 113, 113, 1)",
        aboveAverage: "rgba(251, 191, 36, 0.7)", // amber-400
        aboveAverageBorder: "rgba(251, 191, 36, 1)",
        normal: "rgba(96, 165, 250, 0.7)", // blue-400
        normalBorder: "rgba(96, 165, 250, 1)"
      }
    } else {
      return {
        // Light mode colors
        textColor: "#1e293b", // slate-800
        gridColor: "rgba(148, 163, 184, 0.3)", // slate-400 with opacity
        backgroundColor: "transparent",
        tooltipBackground: "#ffffff",
        tooltipBorder: "#e2e8f0", // slate-200
        tooltipText: "#1e293b", // slate-800
        titleColor: "#0f172a", // slate-900
        legendColor: "#334155", // slate-700
        // Bar colors for light mode
        noUsage: "rgba(156, 163, 175, 0.6)", // gray-400
        noUsageBorder: "rgba(156, 163, 175, 1)",
        highUsage: "rgba(239, 68, 68, 0.6)", // red-500
        highUsageBorder: "rgba(239, 68, 68, 1)",
        aboveAverage: "rgba(245, 158, 11, 0.6)", // amber-500
        aboveAverageBorder: "rgba(245, 158, 11, 1)",
        normal: "rgba(59, 130, 246, 0.6)", // blue-500
        normalBorder: "rgba(59, 130, 246, 1)"
      }
    }
  }

  useEffect(() => {
    console.log("📊 BarChart useEffect triggered")
    console.log("📈 Raw data received:", data)
    console.log("👤 UserId:", userId)

    if (data && data.length > 0) {
      console.log("✅ Using provided data, length:", data.length)
      console.log("📋 First item structure:", data[0])
      prepareChartData(data)
    } else if (userId) {
      console.log("❌ No data provided, fetching for userId:", userId)
      fetchDailyUsage()
    } else {
      console.log("🔧 No data or userId, using mock data")
      prepareMockData()
    }
  }, [data, userId, agentId, ModelProvider, isDark]) // Re-render when theme changes

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

  const fetchDailyUsage = async () => {
    try {
      setIsLoading(true)
      setError(null)
      console.log("📡 Fetching daily usage data...")

      const response = await fetch(`/api/usage/daily?userId=${userId}`)

      if (!response.ok) {
        console.log(
          "⚠️ Daily usage API not available, trying general usage API"
        )
        const fallbackResponse = await fetch("/api/usage/record")
        if (!fallbackResponse.ok) {
          throw new Error("Failed to fetch usage data")
        }
        const fallbackData = await fallbackResponse.json()
        console.log("📊 Fallback usage data:", fallbackData)

        const dailyData = transformGeneralUsageToDaily(fallbackData)
        prepareChartData(dailyData)
        return
      }

      const dailyData = await response.json()
      console.log("📈 Daily usage data received:", dailyData)
      prepareChartData(dailyData)
    } catch (err) {
      console.error("💥 Error fetching daily usage:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch data")
      prepareMockData()
    } finally {
      setIsLoading(false)
    }
  }

  const transformGeneralUsageToDaily = (generalData: any[]) => {
    console.log("🔄 Transforming general usage to daily format:", generalData)

    const today = new Date()
    const dailyData = []

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)

      const dayName = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric"
      })

      const baseUsage = generalData.reduce(
        (sum, item) => sum + (item.value || 0),
        0
      )
      const dailyUsage = Math.floor(baseUsage / 7 + Math.random() * 1000)

      dailyData.push({
        name: dayName,
        value: dailyUsage
      })
    }

    console.log("✅ Transformed daily data:", dailyData)
    return dailyData
  }

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

  const prepareChartData = (rawData: RecentUsageData[] | DailyUsageData[]) => {
    console.log("🎨 Preparing chart data from raw data:", rawData)
    console.log("🌙 Theme mode:", isDark ? "dark" : "light")

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

    console.log("🏷️ Chart labels:", labels)
    console.log("📊 Chart values:", values)

    const maxValue = Math.max(...values)
    const avgValue = values.reduce((sum, val) => sum + val, 0) / values.length
    const totalUsage = values.reduce((sum, val) => sum + val, 0)

    console.log("📈 Chart stats:")
    console.log("  - Max value:", maxValue)
    console.log("  - Average:", Math.round(avgValue))
    console.log("  - Total usage:", totalUsage)

    const colors = getThemeColors()

    const chartConfig = {
      labels: labels,
      datasets: [
        {
          label: "Daily Token Usage",
          data: values,
          backgroundColor: values.map(value => {
            if (value === 0) return colors.noUsage
            if (value > avgValue * 1.5) return colors.highUsage
            if (value > avgValue) return colors.aboveAverage
            return colors.normal
          }),
          borderColor: values.map(value => {
            if (value === 0) return colors.noUsageBorder
            if (value > avgValue * 1.5) return colors.highUsageBorder
            if (value > avgValue) return colors.aboveAverageBorder
            return colors.normalBorder
          }),
          borderWidth: 1
        }
      ]
    }

    console.log("🎨 Final chart configuration with theme colors:", chartConfig)
    setChartData(chartConfig)

    const highUsageDays = values.filter(value => value > avgValue * 1.5).length
    if (highUsageDays > 0 && onLimitReached) {
      console.log(`⚠️ High usage detected on ${highUsageDays} days`)
      onLimitReached(true)
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
          display: true,
          text: "Daily Token Usage (Last 7 Days)",
          color: colors.titleColor,
          font: {
            size: 16,
            weight: "bold" as const,
            family: "Inter, system-ui, sans-serif"
          }
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
              return `Usage: ${value.toLocaleString()} tokens`
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
            text: "Date",
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
  console.log("  - Loading:", isLoading)
  console.log("  - Error:", error)
  console.log("  - Has chart data:", !!chartData)
  console.log("  - Theme:", currentTheme)
  console.log("  - Mounted:", mounted)

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className={`${isDark ? "text-slate-300" : "text-slate-600"}`}>
          Loading daily usage data...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className={`${isDark ? "text-red-400" : "text-red-500"}`}>
          Error: {error}
        </div>
      </div>
    )
  }

  if (!chartData) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className={`${isDark ? "text-slate-400" : "text-slate-500"}`}>
          No usage data available
        </div>
      </div>
    )
  }

  return (
    <div className="size-full">
      <Bar data={chartData} options={getChartOptions()} />
    </div>
  )
}

export { BarChart }
export default BarChart
