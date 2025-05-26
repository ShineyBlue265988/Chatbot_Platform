import { useState, useEffect } from "react"

interface UsageData {
  name: string
  value: number
  limit?: number
}

interface LimitData {
  id: string
  type: "model" | "user" | "agent"
  target: string
  usage_limit: number
  user_id?: string
}

export const useUsageLimits = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchUsageAndLimits = async (): Promise<UsageData[]> => {
    try {
      setIsLoading(true)
      setError(null)

      const [usageData, limitsData] = await Promise.all([
        fetch("/api/usage/record").then(res => {
          if (!res.ok) throw new Error("Failed to fetch usage data")
          return res.json()
        }),
        fetch("/api/usage/limits").then(res => {
          if (!res.ok) throw new Error("Failed to fetch limits data")
          return res.json()
        })
      ])

      // Combine usage and limits data
      const combinedData = usageData.map((usage: any) => {
        const limit = limitsData.find((l: LimitData) => l.target === usage.name)
        return {
          name: usage.name,
          value: usage.value,
          limit: limit?.usage_limit
        }
      })

      return combinedData
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      return []
    } finally {
      setIsLoading(false)
    }
  }

  const checkLimit = async (provider: string): Promise<boolean> => {
    try {
      setError(null)
      const limits = await fetch(`/api/usage/limits?provider=${provider}`).then(
        res => {
          if (!res.ok) throw new Error("Failed to fetch provider limits")
          return res.json()
        }
      )

      const usage = await fetch(`/api/usage/record`).then(res => {
        if (!res.ok) throw new Error("Failed to fetch usage data")
        return res.json()
      })

      const limit = limits[0]?.usage_limit
      const currentUsage =
        usage.find((u: any) => u.name === provider)?.value || 0

      if (limit && currentUsage >= limit) {
        throw new Error(`Usage limit reached for ${provider}`)
      }

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      throw err
    }
  }

  return {
    fetchUsageAndLimits,
    checkLimit,
    isLoading,
    error
  }
}
