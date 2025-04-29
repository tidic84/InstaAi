import { redirect } from "next/navigation"
import { getServerSessionSafe } from "@/lib/get-session"
import { db } from "@/lib/db"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

interface AccountMessagesPageProps {
  params: {
    accountId: string
  }
}

export default async function AccountMessagesPage({ params }: AccountMessagesPageProps) {
  // Attendre que la déstructuration de params soit terminée
  const accountId = params.accountId
  const session = await getServerSessionSafe()

  if (!session) {
    redirect("/login")
  }

  // Vérifier si le compte appartient à l'utilisateur
  const account = await db.instagramAccount.findFirst({
    where: {
      id: accountId,
      userId: session.user.id,
    },
    include: {
      conversations: {
        orderBy: {
          lastMessageAt: "desc"
        },
        include: {
          messages: {
            orderBy: {
              createdAt: "desc"
            },
            take: 1
          }
        }
      }
    }
  })

  if (!account) {
    redirect("/dashboard/messages")
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading={`Messages de ${account.username}`}
        text="Consultez les conversations de ce compte Instagram."
      >
        <form action={`/api/refresh-messages?accountId=${accountId}`} method="post">
          <Button type="submit">
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualiser les messages
          </Button>
        </form>
      </DashboardHeader>
      
      <div className="grid gap-4">
        {account.conversations.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Aucune conversation</CardTitle>
              <CardDescription>
                Ce compte n'a pas encore de conversations ou elles n'ont pas encore été récupérées.
                Cliquez sur "Actualiser les messages" pour récupérer les conversations récentes.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          account.conversations.map((conversation) => (
            <Link 
              key={conversation.id} 
              href={`/dashboard/messages/${accountId}/${conversation.id}`}
            >
              <Card className="hover:bg-accent/10 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">{conversation.participantUsername}</CardTitle>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true, locale: fr })}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  {conversation.messages[0] ? (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {conversation.messages[0].isFromUser ? "Eux: " : "Vous: "}
                      {conversation.messages[0].content}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Aucun message récent</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </DashboardShell>
  )
}
