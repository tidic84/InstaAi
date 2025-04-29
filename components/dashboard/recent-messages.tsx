import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"

interface RecentMessagesProps {
  messages: {
    id: string
    content: string
    isFromUser: boolean
    timestamp: Date
    conversation: {
      participantUsername: string
      instagramAccount: {
        username: string
      }
    }
  }[]
}

export function RecentMessages({ messages }: RecentMessagesProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Recent Messages</CardTitle>
        <CardDescription>Your latest Instagram direct messages.</CardDescription>
      </CardHeader>
      <CardContent>
        {messages.length === 0 ? (
          <div className="flex h-[100px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
            <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
              <p className="text-sm text-muted-foreground">No messages retrieved yet.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((message) => (
              <div key={message.id} className="rounded-md border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{message.conversation.participantUsername}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                  </p>
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                  {message.isFromUser ? "Them: " : "You: "}
                  {message.content}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  via {message.conversation.instagramAccount.username}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" asChild>
          <Link href="/messages">View All Messages</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
