import { ChatbotUIContext } from "@/context/context"
import { WORKSPACE_INSTRUCTIONS_MAX } from "@/db/limits"

import { supabase } from "@/lib/supabase/browser-client"

import {
  getWorkspaceImageFromStorage,
  uploadWorkspaceImage
} from "@/db/storage/workspace-images"
import { updateWorkspace } from "@/db/workspaces"
import { convertBlobToBase64 } from "@/lib/blob-to-b64"
import {
  IconHome,
  IconSettings,
  IconUsers,
  IconLock
} from "@tabler/icons-react"
import { FC, useContext, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { Button } from "../ui/button"
import { ChatSettingsForm } from "../ui/chat-settings-form"
import ImagePicker from "../ui/image-picker"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { LimitDisplay } from "../ui/limit-display"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "../ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { TextareaAutosize } from "../ui/textarea-autosize"
import { WithTooltip } from "../ui/with-tooltip"
import { DeleteWorkspace } from "./delete-workspace"

interface WorkspaceSettingsProps {}

export const WorkspaceSettings: FC<WorkspaceSettingsProps> = ({}) => {
  const {
    profile,
    selectedWorkspace,
    setSelectedWorkspace,
    setWorkspaces,
    setChatSettings,
    workspaceImages,
    setWorkspaceImages
  } = useContext(ChatbotUIContext)

  const buttonRef = useRef<HTMLButtonElement>(null)

  const [isOpen, setIsOpen] = useState(false)

  const [name, setName] = useState(selectedWorkspace?.name || "")
  const [imageLink, setImageLink] = useState("")
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [description, setDescription] = useState(
    selectedWorkspace?.description || ""
  )
  const [instructions, setInstructions] = useState(
    selectedWorkspace?.instructions || ""
  )

  // Add team name state
  const [teamName, setTeamName] = useState("")

  // Determine workspace type based on team_id - handle the type properly
  const [isTeamWorkspace, setIsTeamWorkspace] = useState(() => {
    const workspace = selectedWorkspace as any
    return workspace?.team_id !== null && workspace?.team_id !== undefined
  })

  const [defaultChatSettings, setDefaultChatSettings] = useState({
    model: selectedWorkspace?.default_model,
    prompt: selectedWorkspace?.default_prompt,
    temperature: selectedWorkspace?.default_temperature,
    contextLength: selectedWorkspace?.default_context_length,
    includeProfileContext: selectedWorkspace?.include_profile_context,
    includeWorkspaceInstructions:
      selectedWorkspace?.include_workspace_instructions,
    embeddingsProvider: selectedWorkspace?.embeddings_provider
  })

  useEffect(() => {
    const workspaceImage =
      workspaceImages.find(
        image => image.path === selectedWorkspace?.image_path
      )?.base64 || ""

    setImageLink(workspaceImage)
  }, [workspaceImages])

  const handleSave = async () => {
    if (!selectedWorkspace) {
      console.error("❌ No selected workspace")
      toast.error("No workspace selected")
      return
    }

    console.log("💾 Starting save process for workspace:", selectedWorkspace.id)

    try {
      // Get current user
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error("User not authenticated")
        return
      }

      let imagePath = selectedWorkspace.image_path || ""

      if (selectedImage) {
        console.log("🖼️ Uploading new image...")
        imagePath = await uploadWorkspaceImage(selectedWorkspace, selectedImage)

        const url = (await getWorkspaceImageFromStorage(imagePath)) || ""

        if (url) {
          const response = await fetch(url)
          const blob = await response.blob()
          const base64 = await convertBlobToBase64(blob)

          setWorkspaceImages(prev => [
            ...prev,
            {
              workspaceId: selectedWorkspace.id,
              path: imagePath,
              base64,
              url
            }
          ])
        }
      }

      // Cast workspace to any to access team_id
      const workspace = selectedWorkspace as any

      // Prepare update data based on workspace type
      let updateData: any = {
        name,
        description,
        instructions,
        default_model: defaultChatSettings.model,
        default_prompt: defaultChatSettings.prompt,
        default_temperature: defaultChatSettings.temperature,
        default_context_length: defaultChatSettings.contextLength,
        embeddings_provider: defaultChatSettings.embeddingsProvider,
        include_profile_context: defaultChatSettings.includeProfileContext,
        include_workspace_instructions:
          defaultChatSettings.includeWorkspaceInstructions,
        updated_at: new Date().toISOString()
      }

      if (isTeamWorkspace) {
        // Converting to team workspace
        let teamId = workspace.team_id

        if (!teamId) {
          // Create a new team first
          console.log("🏗️ Creating new team...")

          // Use teamName if provided, otherwise use original workspace name + "Team"
          const finalTeamName =
            teamName.trim() || `${selectedWorkspace.name} Team`

          // Create team - use raw query to avoid TypeScript issues
          const { data: newTeam, error: teamError } = await supabase
            .from("teams")
            .insert([
              {
                description: `Team workspace for ${selectedWorkspace.name}`,
                creator_id: user.id,
                created_at: new Date().toISOString(),
                name: finalTeamName
              }
            ])
            .select()
            .single()

          if (teamError) {
            console.error("❌ Failed to create team:", teamError)
            throw new Error(`Failed to create team: ${teamError.message}`)
          }

          teamId = newTeam.id
          console.log(
            "✅ Team created successfully:",
            teamId,
            "with name:",
            finalTeamName
          )

          // Add the user as a team member (owner)
          const { error: memberError } = await supabase
            .from("team_members")
            .insert({
              team_id: teamId,
              user_id: user.id,
              role: "owner"
            })

          if (memberError) {
            console.error("❌ Failed to add user as team member:", memberError)
          } else {
            console.log("✅ User added as team owner")
          }
        }

        console.log("👥 Converting to team workspace with team_id:", teamId)

        updateData.team_id = teamId
        updateData.user_id = user.id
      } else {
        // Converting to private workspace - CLEANUP TEAM STUFF
        console.log(
          "🔒 Converting to private workspace - cleaning up team associations..."
        )

        const currentTeamId = workspace.team_id

        if (currentTeamId) {
          console.log(
            "🧹 Cleaning up team associations for team:",
            currentTeamId
          )

          // 1. Remove the user from team_members for this team
          const { error: removeMemberError } = await supabase
            .from("team_members")
            .delete()
            .eq("team_id", currentTeamId)
            .eq("user_id", user.id)

          if (removeMemberError) {
            console.error(
              "⚠️ Failed to remove user from team members:",
              removeMemberError
            )
          } else {
            console.log("✅ User removed from team members")
          }

          // 2. Check if this team has any other members or workspaces
          const { data: remainingMembers } = await supabase
            .from("team_members")
            .select("user_id")
            .eq("team_id", currentTeamId)

          const { data: remainingWorkspaces } = await supabase
            .from("workspaces")
            .select("id")
            .eq("team_id", currentTeamId)
            .neq("id", selectedWorkspace.id) // Exclude current workspace

          console.log("🔍 Remaining members:", remainingMembers?.length || 0)
          console.log(
            "🔍 Remaining workspaces:",
            remainingWorkspaces?.length || 0
          )

          // 3. If no other members and no other workspaces, delete the team
          if (
            (!remainingMembers || remainingMembers.length === 0) &&
            (!remainingWorkspaces || remainingWorkspaces.length === 0)
          ) {
            console.log(
              "🗑️ Team has no other members or workspaces, deleting team..."
            )

            const { error: deleteTeamError } = await supabase
              .from("teams")
              .delete()
              .eq("id", currentTeamId)

            if (deleteTeamError) {
              console.error("⚠️ Failed to delete empty team:", deleteTeamError)
            } else {
              console.log("✅ Empty team deleted successfully")
            }
          } else {
            console.log(
              "ℹ️ Team has other members/workspaces, keeping team but removing this workspace"
            )
          }
        }

        updateData.user_id = user.id
        updateData.team_id = null
      }

      // Only include image_path if it was updated
      if (imagePath && imagePath !== selectedWorkspace.image_path) {
        updateData.image_path = imagePath
      }

      console.log("📝 Update data prepared:", updateData)
      console.log("🆔 Updating workspace ID:", selectedWorkspace.id)

      // Use direct Supabase update
      const { data: updatedWorkspace, error: updateError } = await supabase
        .from("workspaces")
        .update(updateData)
        .eq("id", selectedWorkspace.id)
        .select()
        .single()

      if (updateError) {
        console.error("❌ Supabase update error:", updateError)
        throw new Error(`Failed to update workspace: ${updateError.message}`)
      }

      if (!updatedWorkspace) {
        throw new Error("No workspace was updated")
      }

      console.log("✅ Workspace updated successfully:", updatedWorkspace)

      // Update chat settings if all required fields are present
      if (
        defaultChatSettings.model &&
        defaultChatSettings.prompt &&
        defaultChatSettings.temperature &&
        defaultChatSettings.contextLength &&
        defaultChatSettings.includeProfileContext &&
        defaultChatSettings.includeWorkspaceInstructions &&
        defaultChatSettings.embeddingsProvider
      ) {
        setChatSettings({
          model: defaultChatSettings.model as string,
          prompt: defaultChatSettings.prompt,
          temperature: defaultChatSettings.temperature,
          contextLength: defaultChatSettings.contextLength,
          includeProfileContext: defaultChatSettings.includeProfileContext,
          includeWorkspaceInstructions:
            defaultChatSettings.includeWorkspaceInstructions,
          embeddingsProvider: defaultChatSettings.embeddingsProvider as
            | "openai"
            | "local"
        })
      }

      setIsOpen(false)
      setSelectedWorkspace(updatedWorkspace)
      setWorkspaces(workspaces => {
        return workspaces.map(workspace => {
          if (workspace.id === selectedWorkspace.id) {
            return updatedWorkspace
          }
          return workspace
        })
      })

      toast.success(
        `Workspace ${isTeamWorkspace ? "converted to team workspace" : "converted to private workspace"}!`
      )
    } catch (error: any) {
      console.error("❌ Error updating workspace:", error)
      toast.error(`Failed to update workspace: ${error.message}`)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      buttonRef.current?.click()
    }
  }

  const handleWorkspaceTypeChange = (isTeam: boolean) => {
    setIsTeamWorkspace(isTeam)
    // Reset team name when switching
    if (!isTeam) {
      setTeamName("")
    }
  }

  if (!selectedWorkspace || !profile) return null

  // Cast workspace for team_id access
  const workspace = selectedWorkspace as any

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <WithTooltip
          display={<div>Workspace Settings</div>}
          trigger={
            <IconSettings
              className="ml-3 cursor-pointer pr-[5px] hover:opacity-50"
              size={32}
              onClick={() => setIsOpen(true)}
            />
          }
        />
      </SheetTrigger>

      <SheetContent
        className="flex flex-col justify-between"
        side="left"
        onKeyDown={handleKeyDown}
      >
        <div className="grow overflow-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span>Workspace Settings</span>
                {selectedWorkspace?.is_home && <IconHome size={20} />}
                {isTeamWorkspace ? (
                  <IconUsers size={20} />
                ) : (
                  <IconLock size={20} />
                )}
              </div>
            </SheetTitle>

            {selectedWorkspace?.is_home && (
              <div className="text-sm font-light">
                This is your home workspace for personal use.
              </div>
            )}
          </SheetHeader>

          <Tabs defaultValue="main">
            <TabsList className="mt-4 grid w-full grid-cols-2">
              <TabsTrigger value="main">Main</TabsTrigger>
              <TabsTrigger value="defaults">Defaults</TabsTrigger>
            </TabsList>

            <TabsContent className="mt-4 space-y-4" value="main">
              <>
                <div className="space-y-1">
                  <Label>Workspace Name</Label>

                  <Input
                    placeholder="Name..."
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>

                {/* Workspace Type Toggle */}
                {!selectedWorkspace?.is_home && (
                  <div className="space-y-2">
                    <Label>Workspace Type</Label>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant={!isTeamWorkspace ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleWorkspaceTypeChange(false)}
                        className="flex items-center space-x-2"
                      >
                        <IconLock size={16} />
                        <span>Private</span>
                      </Button>

                      <Button
                        variant={isTeamWorkspace ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleWorkspaceTypeChange(true)}
                        className="flex items-center space-x-2"
                      >
                        <IconUsers size={16} />
                        <span>Team</span>
                      </Button>
                    </div>

                    <div className="text-muted-foreground text-xs">
                      {!isTeamWorkspace
                        ? "Only you can access this workspace"
                        : "Team members can access this workspace"}
                      {workspace?.team_id && (
                        <div className="mt-1 font-mono text-xs">
                          Team ID: {workspace.team_id}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Team Name Input - Only show when converting to team workspace */}
                {isTeamWorkspace && !workspace.team_id && (
                  <div className="space-y-1">
                    <Label>Team Name</Label>
                    <Input
                      placeholder="Enter team name..."
                      value={teamName}
                      onChange={e => setTeamName(e.target.value)}
                    />
                    <div className="text-muted-foreground text-xs">
                      {teamName.trim()
                        ? `Team will be named: "${teamName}"`
                        : `Team will be named: "${selectedWorkspace.name} Team"`}
                    </div>
                  </div>
                )}

                {/* <div className="space-y-1">
                  <Label>Description</Label>

                  <Input
                    placeholder="Description... (optional)"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                </div> */}

                <div className="space-y-1">
                  <Label>Workspace Image</Label>

                  <ImagePicker
                    src={imageLink}
                    image={selectedImage}
                    onSrcChange={setImageLink}
                    onImageChange={setSelectedImage}
                    width={50}
                    height={50}
                  />
                </div>
              </>

              <div className="space-y-1">
                <Label>
                  How would you like the AI to respond in this workspace?
                </Label>

                <TextareaAutosize
                  placeholder="Instructions... (optional)"
                  value={instructions}
                  onValueChange={setInstructions}
                  minRows={5}
                  maxRows={10}
                  maxLength={1500}
                />

                <LimitDisplay
                  used={instructions.length}
                  limit={WORKSPACE_INSTRUCTIONS_MAX}
                />
              </div>
            </TabsContent>

            <TabsContent className="mt-5" value="defaults">
              <div className="mb-4 text-sm">
                These are the settings your workspace begins with when selected.
              </div>

              <ChatSettingsForm
                chatSettings={defaultChatSettings as any}
                onChangeChatSettings={setDefaultChatSettings}
              />
            </TabsContent>
          </Tabs>
        </div>

        <div className="mt-6 flex justify-between">
          <div>
            {!selectedWorkspace.is_home && (
              <DeleteWorkspace
                workspace={selectedWorkspace}
                onDelete={() => setIsOpen(false)}
              />
            )}
          </div>

          <div className="space-x-2">
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>

            <Button ref={buttonRef} onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
