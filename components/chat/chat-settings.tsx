import { ChatbotUIContext } from "@/context/context"
import { LLM_LIST } from "@/lib/models/llm/llm-list"
import { CHAT_SETTING_LIMITS } from "@/lib/chat-setting-limits"
import { IconAdjustmentsHorizontal } from "@tabler/icons-react"
import { FC, useContext, useEffect, useRef } from "react"
import { Button } from "../ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { ChatSettingsForm } from "../ui/chat-settings-form"
import useHotkey from "@/lib/hooks/use-hotkey"
import type { ChatSettings } from "@/types/chat"

interface ChatSettingsComponentProps {}

export const ChatSettingsComponent: FC<ChatSettingsComponentProps> = () => {
  useHotkey("i", () => handleClick())

  const {
    chatSettings,
    setChatSettings,
    models,
    availableHostedModels,
    availableLocalModels,
    availableOpenRouterModels,
    selectedChat,
    setSelectedChat
  } = useContext(ChatbotUIContext)

  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleClick = () => {
    if (buttonRef.current) {
      buttonRef.current.click()
    }
  }

  useEffect(() => {
    if (!chatSettings) return

    setChatSettings({
      ...chatSettings,
      temperature: Math.min(
        chatSettings.temperature,
        CHAT_SETTING_LIMITS[chatSettings.model]?.MAX_TEMPERATURE || 1
      ),
      contextLength: Math.min(
        chatSettings.contextLength,
        CHAT_SETTING_LIMITS[chatSettings.model]?.MAX_CONTEXT_LENGTH || 4096
      )
    })
  }, [chatSettings?.model])

  const handleModelChange = (value: ChatSettings) => {
    if (!chatSettings) return

    // Update chat settings with new model
    setChatSettings(value)

    // If there's an active chat, update its model
    if (selectedChat) {
      const updatedChat = {
        ...selectedChat,
        model: value.model
      }
      setSelectedChat(updatedChat)
    }
  }

  if (!chatSettings) return null

  const allModels = [
    ...models.map(model => ({
      modelId: model.model_id,
      modelName: model.name,
      provider: "custom" as const,
      hostedId: model.id,
      platformLink: "",
      imageInput: false
    })),
    ...availableHostedModels,
    ...availableLocalModels,
    ...availableOpenRouterModels
  ]

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          ref={buttonRef}
          className="size-[30px] p-0"
          variant="ghost"
          size="icon"
        >
          <IconAdjustmentsHorizontal className="size-4" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80">
        <ChatSettingsForm
          chatSettings={chatSettings}
          onChangeChatSettings={handleModelChange}
        />
      </PopoverContent>
    </Popover>
  )
}
