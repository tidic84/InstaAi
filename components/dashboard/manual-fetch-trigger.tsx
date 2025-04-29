"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { RefreshCw } from "lucide-react"

export function ManualFetchTrigger({ cronSecret }: { cronSecret: string }) {
  const [isLoading, setIsLoading] = useState(false)

  const triggerFetch = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/cron/fetch-messages?secret=${cronSecret}`)

      if (!response.ok) {
        throw new Error("Failed to trigger message fetch")
      }

      const data = await response.json()

      toast({
        title: "Message Fetch Completed",
        description: data.message,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to trigger message fetch",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={triggerFetch} disabled={isLoading}>
      <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
      {isLoading ? "Fetching..." : "Fetch Messages Now"}
    </Button>
  )
}
