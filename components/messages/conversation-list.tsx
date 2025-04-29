import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface Conversation {
  id: string
  participantUsername: string
  lastMessageAt: Date
  accountUsername: string
  messages: {
    id: string
    content: string
    timestamp: Date
  }[]
}

interface ConversationListProps {
  conversations: Conversation[]
}

export function ConversationList({ conversations }: ConversationListProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {conversations.map((conversation) => (
        <Link href={`/messages/${conversation.id}`} key={conversation.id}>
          <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-medium">
                  {conversation.participantUsername}
                </CardTitle>
                <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                  {conversation.accountUsername}
                </span>
              </div>
              <CardDescription>
                {formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true, locale: fr })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm truncate">
                {conversation.messages[0]?.content || "Aucun message"}
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
