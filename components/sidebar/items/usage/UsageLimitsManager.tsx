import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { LLM_LIST_MAP } from "@/lib/models/llm/llm-list"

const AVAILABLE_PROVIDERS = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "google", label: "Google" },
  { value: "mistral", label: "Mistral" },
  { value: "groq", label: "Groq" },
  { value: "perplexity", label: "Perplexity" }
]

const limitSchema = z.object({
  type: z.enum(["model", "user", "agent", "provider"]),
  target: z.string().min(1, "Target is required"),
  usage_limit: z.number().min(1000, "Limit must be at least 1000 tokens")
})

type LimitFormValues = z.infer<typeof limitSchema>

export function UsageLimitsManager() {
  const [limits, setLimits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const form = useForm<LimitFormValues>({
    resolver: zodResolver(limitSchema),
    defaultValues: {
      type: "model",
      target: "",
      usage_limit: 100000
    }
  })

  // Get available models for all providers
  const getAvailableModels = () => {
    const allModels = Object.values(LLM_LIST_MAP).flat()
    return allModels.map(model => ({
      value: model.modelId,
      label: `${model.modelName} (${model.provider})`
    }))
  }

  useEffect(() => {
    fetchLimits()
  }, [])

  const fetchLimits = async () => {
    try {
      const response = await fetch("/api/usage/limits")
      if (!response.ok) {
        throw new Error("Failed to fetch limits")
      }
      const data = await response.json()
      setLimits(data)
    } catch (error) {
      toast.error("Failed to fetch usage limits")
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (values: LimitFormValues) => {
    try {
      console.log("Submitting form values:", values)

      // Ensure all required fields are present and valid
      if (!values.type || !values.target || !values.usage_limit) {
        throw new Error("All fields are required")
      }

      const response = await fetch("/api/usage/limits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          type: values.type,
          target: values.target,
          usage_limit: Number(values.usage_limit) // Ensure it's a number
        })
      })

      const responseData = await response.json()
      console.log("Response data:", responseData)

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to create usage limit")
      }

      toast.success("Usage limit created successfully")
      form.reset({
        type: "model",
        target: "",
        usage_limit: 100000
      })
      fetchLimits()
    } catch (error: any) {
      toast.error(error.message || "Failed to create usage limit")
    }
  }

  return (
    <div className="space-y-6 p-4">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Usage Limits</h2>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Limit Type</FormLabel>
                  <Select
                    onValueChange={value => {
                      field.onChange(value)
                      form.setValue("target", "") // Reset target when type changes
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a limit type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="model">Model-specific</SelectItem>
                      <SelectItem value="provider">
                        Provider-specific
                      </SelectItem>
                      <SelectItem value="user">User-specific</SelectItem>
                      <SelectItem value="agent">Agent-specific</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="target"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target</FormLabel>
                  <FormControl>
                    {form.watch("type") === "provider" ? (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a provider" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {AVAILABLE_PROVIDERS.map(provider => (
                            <SelectItem
                              key={provider.value}
                              value={provider.value}
                            >
                              {provider.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : form.watch("type") === "model" ? (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a model" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {getAvailableModels().map(model => (
                            <SelectItem key={model.value} value={model.value}>
                              {model.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        placeholder={`Enter ${form.watch("type")} identifier`}
                        {...field}
                        required
                      />
                    )}
                  </FormControl>
                  <FormDescription>
                    {form.watch("type") === "user" && "Enter the user ID"}
                    {form.watch("type") === "agent" && "Enter the agent ID"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="usage_limit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Token Limit</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={e => field.onChange(Number(e.target.value))}
                      required
                      min="1000"
                    />
                  </FormControl>
                  <FormDescription>
                    Maximum number of tokens allowed for this limit
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit">Add Limit</Button>
          </form>
        </Form>
      </div>

      {/* Display current limits */}
      <div className="space-y-4">
        <h3 className="text-md font-medium">Current Limits</h3>
        {loading ? (
          <div className="text-muted-foreground text-sm">Loading...</div>
        ) : limits.length === 0 ? (
          <div className="text-muted-foreground text-sm">
            No limits configured
          </div>
        ) : (
          <div className="space-y-2">
            {limits.map(limit => (
              <div
                key={limit.id}
                className="bg-background flex items-center justify-between rounded-lg border p-3"
              >
                <div className="space-y-1">
                  <div className="font-medium">
                    {limit.type.charAt(0).toUpperCase() + limit.type.slice(1)}{" "}
                    Limit
                  </div>
                  <div className="text-muted-foreground text-sm">
                    Target: {limit.target}
                  </div>
                  <div className="text-sm">
                    {limit.usage_limit.toLocaleString()} tokens
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    // Add delete functionality
                    fetch(`/api/usage/limits?id=${limit.id}`, {
                      method: "DELETE"
                    })
                      .then(() => {
                        toast.success("Limit deleted successfully")
                        fetchLimits()
                      })
                      .catch(() => {
                        toast.error("Failed to delete limit")
                      })
                  }}
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
