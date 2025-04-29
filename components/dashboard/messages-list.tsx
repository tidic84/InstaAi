import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import Link from "next/link"
import { InstagramIcon } from "lucide-react"

interface MessagesListProps {
  accounts: any[]
}

export function MessagesList({ accounts }: MessagesListProps) {
  return (
    <div className="grid gap-6">
      {accounts.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Aucun compte actif</CardTitle>
            <CardDescription>
              Vous devez avoir au moins un compte Instagram actif pour voir les messages.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        accounts.map((account) => (
          <Card key={account.id} className="mb-6">
            <CardHeader>
              <div className="flex items-center">
                <InstagramIcon className="mr-2 h-5 w-5" />
                <CardTitle>{account.username}</CardTitle>
              </div>
              <CardDescription>
                {account.conversations.length} conversation(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {account.conversations.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune conversation</p>
              ) : (
                <div className="space-y-4">
                  {account.conversations.map((conversation: any) => (
                    <Link 
                      key={conversation.id} 
                      href={`/dashboard/messages/${account.id}/${conversation.id}`}
                      className="block"
                    >
                      <div className="flex items-center justify-between p-3 rounded-md hover:bg-accent cursor-pointer">
                        <div>
                          <h4 className="font-medium">{conversation.participantUsername}</h4>
                          {conversation.messages[0] && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {conversation.messages[0].isFromUser ? "Vous: " : ""}{conversation.messages[0].content}
                            </p>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true, locale: fr })}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
