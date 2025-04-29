import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface PendingResponsesProps {
  responses: {
    id: string
    suggestedResponse: string
    message: {
      content: string
      conversation: {
        participantUsername: string
        instagramAccount: {
          username: string
        }
      }
    }
  }[]
}

export function PendingResponses({ responses }: PendingResponsesProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Pending Responses</CardTitle>
        <CardDescription>
          {responses.length} {responses.length === 1 ? "response" : "responses"} waiting for approval.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {responses.length === 0 ? (
          <div className="flex h-[100px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
            <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
              <p className="text-sm text-muted-foreground">No pending responses at the moment.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {responses.map((response) => (
              <div key={response.id} className="rounded-md border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{response.message.conversation.participantUsername}</p>
                  <p className="text-xs text-muted-foreground">
                    via {response.message.conversation.instagramAccount.username}
                  </p>
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{response.suggestedResponse}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" asChild>
          <Link href="/responses">View All Responses</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
