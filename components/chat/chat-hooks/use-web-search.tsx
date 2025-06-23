import { ChatbotUIContext } from "@/context/context"
import { FC, useContext } from "react"
import { useChatHandler } from "./use-chat-handler"

export const useWebSearch = () => {
  const { userInput, setUserInput, chatMessages } = useContext(ChatbotUIContext)
  const { handleSendMessage } = useChatHandler()

  const handleWebSearch = async (query: string) => {
    try {
      // Call Serper API to get search results
      const response = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
          "X-API-KEY": process.env.NEXT_PUBLIC_SERPER_API_KEY || "",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          q: query,
          num: 10 // Number of results to return
        })
      })

      if (!response.ok) {
        throw new Error("Search failed")
      }

      const searchResults = await response.json()

      // Format the search results into a hidden collapsible format
      let searchContext = `[WEB_SEARCH_RESULTS_START]\n`

      if (searchResults.organic) {
        searchResults.organic.forEach((result: any, index: number) => {
          searchContext += `[SOURCE_${index + 1}]\n`
          searchContext += `TITLE: ${result.title}\n`
          searchContext += `URL: ${result.link}\n`
          searchContext += `CONTENT: ${result.snippet}\n`
          searchContext += `[SOURCE_${index + 1}_END]\n\n`
        })
      }

      searchContext += `[WEB_SEARCH_RESULTS_END]\n\n`

      // Add instructions for the AI to analyze and synthesize the information
      searchContext += `[INSTRUCTIONS_START]\n`
      searchContext += `Based on the above search results, provide a comprehensive answer that:\n`
      searchContext += `1. Synthesizes the key information from multiple sources\n`
      searchContext += `2. Provides relevant details and context\n`
      searchContext += `3. Cites specific sources when referencing information\n`
      searchContext += `4. Maintains a clear and organized structure\n`
      searchContext += `5. Focuses on the most relevant and reliable information\n`
      searchContext += `[INSTRUCTIONS_END]\n\n`
      searchContext += `[USER_QUERY_START]${query}[USER_QUERY_END]\n\n`
      // searchContext += `Answer:`;

      // Store the original user input
      const originalInput = query
      console.log("Chat Messages:=============>", chatMessages)

      // Send the formatted prompt to the chat
      await handleSendMessage(searchContext, chatMessages, false)
      // Restore the original user input
      setUserInput("")
    } catch (error) {
      console.error("Web search error:", error)
      await handleSendMessage(
        "Sorry, I encountered an error while searching the web. Please try again later.",
        chatMessages,
        false
      )
    }
  }

  return {
    handleWebSearch
  }
}
