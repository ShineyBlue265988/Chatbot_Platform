// components/sidebar/items/usage/UsageSidebar.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UsageLimitsManager } from "./UsageLimitsManager"
import { UsageStats } from "./UsageStats"
import { ChatbotUIContext } from "@/context/context"
import { useContext } from "react"

export function UsageSidebar() {
  const { profile } = useContext(ChatbotUIContext)

  if (!profile) {
    return <div className="p-4">Loading...</div>
  }

  return (
    <Tabs defaultValue="usage" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="usage">Usage</TabsTrigger>
        <TabsTrigger value="limits">Limits</TabsTrigger>
      </TabsList>
      <TabsContent value="usage">
        <UsageStats userId={profile.user_id} />
      </TabsContent>
      <TabsContent value="limits">
        <UsageLimitsManager />
      </TabsContent>
    </Tabs>
  )
}
