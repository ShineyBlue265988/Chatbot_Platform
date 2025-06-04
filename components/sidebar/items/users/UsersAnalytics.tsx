"use client"

import { FC, useEffect, useState, useContext } from "react"
import { supabase } from "@/lib/supabase/browser-client"
import { ChatbotUIContext } from "@/context/context"
import { useCanViewAnalytics } from "@/lib/permissions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Loader2 } from "lucide-react"

interface UserTokenUsage {
  user_id: string
  user_email: string
  user_name: string
  total_tokens: number
}

export const UsersAnalytics: FC = () => {
  const { profile, selectedWorkspace } = useContext(ChatbotUIContext)
  const [usageData, setUsageData] = useState<UserTokenUsage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { canViewAnalytics, loading: permissionLoading } = useCanViewAnalytics(
    profile?.user_id || "",
    selectedWorkspace?.id || ""
  )

  useEffect(() => {
    if (!profile?.user_id || !selectedWorkspace?.id || permissionLoading) {
      return
    }

    if (!canViewAnalytics) {
      setError("You don't have permission to view analytics")
      setLoading(false)
      return
    }

    fetchUsersTokenUsage()
  }, [
    profile?.user_id,
    selectedWorkspace?.id,
    canViewAnalytics,
    permissionLoading
  ])

  const fetchUsersTokenUsage = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!selectedWorkspace?.id) {
        throw new Error("No workspace selected")
      }

      // Check if user is workspace owner
      const { data: workspace, error: workspaceError } = await supabase
        .from("workspaces")
        .select("team_id, user_id")
        .eq("id", selectedWorkspace.id)
        .single()

      if (workspaceError) {
        throw new Error(`Failed to fetch workspace: ${workspaceError.message}`)
      }

      if (workspace?.user_id !== profile?.user_id) {
        throw new Error("Only workspace owners can view analytics")
      }

      if (!workspace?.team_id) {
        throw new Error("Workspace has no associated team")
      }

      // Get team members with their token usage
      const { data: teamMembers, error: membersError } = await supabase
        .from("team_members")
        .select(
          `
          user_id,
          profiles:user_id (
            email,
            display_name
          )
        `
        )
        .eq("team_id", workspace.team_id)

      if (membersError) {
        throw new Error(`Failed to fetch team members: ${membersError.message}`)
      }

      // Get token usage for each team member
      const usagePromises = teamMembers.map(async member => {
        const { data: tokenUsage, error: tokenError } = await supabase
          .from("token_usage")
          .select("total_tokens")
          .eq("user_id", member.user_id)
          .eq("workspace_id", selectedWorkspace.id)

        const totalTokens =
          tokenUsage?.reduce(
            (sum, usage) => sum + (usage.total_tokens || 0),
            0
          ) || 0

        return {
          user_id: member.user_id,
          user_email: (member.profiles as any)?.email || "Unknown",
          user_name: (member.profiles as any)?.display_name || "Unknown",
          total_tokens: totalTokens
        }
      })

      const results = await Promise.all(usagePromises)

      // Sort by total tokens descending
      results.sort((a, b) => b.total_tokens - a.total_tokens)

      setUsageData(results)
    } catch (err: any) {
      console.error("Error fetching users token usage:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num)
  }

  if (permissionLoading || loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="size-8 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalTokens = usageData.reduce(
    (sum, user) => sum + user.total_tokens,
    0
  )

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-2xl font-bold">Team Token Usage</h2>

      <Card>
        <CardHeader>
          <CardTitle>Total: {formatNumber(totalTokens)} tokens</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Tokens Used</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usageData.map(user => (
                <TableRow key={user.user_id}>
                  <TableCell className="font-medium">
                    {user.user_name}
                  </TableCell>
                  <TableCell>{user.user_email}</TableCell>
                  <TableCell className="text-right">
                    {formatNumber(user.total_tokens)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {usageData.length === 0 && (
            <div className="text-muted-foreground py-8 text-center">
              No token usage data available.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default UsersAnalytics
