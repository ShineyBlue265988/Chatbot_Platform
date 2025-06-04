import { ContentType } from "@/types"
import {
  IconAdjustmentsHorizontal,
  IconBolt,
  IconBooks,
  IconFile,
  IconMessage,
  IconPencil,
  IconRobotFace,
  IconSparkles,
  IconUsers,
  IconShield,
  IconChartBar,
  IconGauge,
  IconAnalyze
} from "@tabler/icons-react"
import { FC } from "react"
import { TabsList } from "../ui/tabs"
import { WithTooltip } from "../ui/with-tooltip"
import { ProfileSettings } from "../utility/profile-settings"
import { SidebarSwitchItem } from "./sidebar-switch-item"
import { PermissionGuard } from "../ui/PermissionGuard"

export const SIDEBAR_ICON_SIZE = 28

interface SidebarSwitcherProps {
  onContentTypeChange: (contentType: ContentType) => void
}

export const SidebarSwitcher: FC<SidebarSwitcherProps> = ({
  onContentTypeChange
}) => {
  return (
    <div className="flex h-full flex-col justify-between border-r-2 pb-5">
      <TabsList className="bg-background flex h-full flex-col">
        {/* Main icons */}
        <SidebarSwitchItem
          icon={<IconMessage size={SIDEBAR_ICON_SIZE} />}
          contentType="chats"
          onContentTypeChange={onContentTypeChange}
        />
        {/* Content sections - protected by permissions */}
        <PermissionGuard permission="prompts.read">
          <SidebarSwitchItem
            icon={<IconAdjustmentsHorizontal size={SIDEBAR_ICON_SIZE} />}
            contentType="presets"
            onContentTypeChange={onContentTypeChange}
          />
        </PermissionGuard>

        <PermissionGuard permission="prompts.read">
          <SidebarSwitchItem
            icon={<IconPencil size={SIDEBAR_ICON_SIZE} />}
            contentType="prompts"
            onContentTypeChange={onContentTypeChange}
          />
        </PermissionGuard>

        <PermissionGuard permission="models.read">
          <SidebarSwitchItem
            icon={<IconSparkles size={SIDEBAR_ICON_SIZE} />}
            contentType="models"
            onContentTypeChange={onContentTypeChange}
          />
        </PermissionGuard>

        <PermissionGuard permission="files.read">
          <SidebarSwitchItem
            icon={<IconFile size={SIDEBAR_ICON_SIZE} />}
            contentType="files"
            onContentTypeChange={onContentTypeChange}
          />
        </PermissionGuard>

        <PermissionGuard permission="collections.read">
          <SidebarSwitchItem
            icon={<IconBooks size={SIDEBAR_ICON_SIZE} />}
            contentType="collections"
            onContentTypeChange={onContentTypeChange}
          />
        </PermissionGuard>

        <PermissionGuard permission="assistants.read">
          <SidebarSwitchItem
            icon={<IconRobotFace size={SIDEBAR_ICON_SIZE} />}
            contentType="assistants"
            onContentTypeChange={onContentTypeChange}
          />
        </PermissionGuard>

        <PermissionGuard permission="tools.read">
          <SidebarSwitchItem
            icon={<IconBolt size={SIDEBAR_ICON_SIZE} />}
            contentType="tools"
            onContentTypeChange={onContentTypeChange}
          />
        </PermissionGuard>

        {/* Spacer to push bottom icons down */}
        <div className="flex-1" />

        {/* Management sections - bottom of sidebar */}
        <PermissionGuard permission="team.view">
          <SidebarSwitchItem
            icon={<IconUsers size={SIDEBAR_ICON_SIZE} />}
            contentType="teams"
            onContentTypeChange={onContentTypeChange}
          />
        </PermissionGuard>

        <PermissionGuard permission="roles.read">
          <SidebarSwitchItem
            icon={<IconShield size={SIDEBAR_ICON_SIZE} />}
            contentType="roles"
            onContentTypeChange={onContentTypeChange}
          />
        </PermissionGuard>

        {/* <PermissionGuard permission="users.analytics">
          <SidebarSwitchItem
            icon={<IconAnalyze size={SIDEBAR_ICON_SIZE} />}
            contentType="users-analytics"
            onContentTypeChange={onContentTypeChange}
          />
        </PermissionGuard> */}

        <PermissionGuard permission="usage.read">
          <SidebarSwitchItem
            icon={<IconChartBar size={SIDEBAR_ICON_SIZE} />}
            contentType="usage-limits"
            onContentTypeChange={onContentTypeChange}
          />
        </PermissionGuard>
      </TabsList>
      <div className="flex flex-col items-center space-y-4">
        <WithTooltip
          display={<div>Profile Settings</div>}
          trigger={<ProfileSettings />}
        />
      </div>
    </div>
  )
}
