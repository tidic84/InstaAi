import { redirect } from "next/navigation"
import { getServerSessionSafe } from "@/lib/get-session"
import { db } from "@/lib/db"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import { Send } from "lucide-react"

interface ConversationPageProps {
  params: {
    accountId: string
    conversationId: string
  }
}

export default async function ConversationPage({ params }: ConversationPageProps) {
  // Extraire les paramètres de l'URL
  const accountId = params.accountId
  const conversationId = params.conversationId
  
  // Récupérer la session utilisateur
  const session = await getServerSessionSafe()

  if (!session) {
    redirect("/login")
  }

  console.log("Tentative de récupération des messages pour la conversation:", conversationId)

  // Récupérer les détails du compte Instagram et vérifier qu'il appartient à l'utilisateur
  const account = await db.instagramAccount.findFirst({
    where: {
      id: accountId,
      userId: session.user.id,
    },
  })

  if (!account) {
    console.log("Compte non trouvé ou n'appartient pas à l'utilisateur")
    redirect("/dashboard/messages")
  }

  // Récupérer la conversation et ses messages avec une requête plus détaillée
  const conversation = await db.conversation.findFirst({
    where: {
      id: conversationId,
      instagramAccountId: accountId,
    },
    include: {
      messages: {
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
          content: true,
          isFromUser: true,
          createdAt: true,
        }
      },
      instagramAccount: {
        select: {
          id: true,
          username: true,
          userId: true,
        }
      }
    },
  })

  if (!conversation) {
    console.log("Conversation non trouvée")
    redirect("/dashboard/messages/" + accountId)
  }

  // Debug: Afficher les informations de la conversation
  console.log("Détails de la conversation:", {
    id: conversation.id,
    participantUsername: conversation.participantUsername,
    messageCount: conversation.messages.length,
    messages: conversation.messages.map(m => ({
      id: m.id,
      content: m.content,
      isFromUser: m.isFromUser,
      createdAt: m.createdAt
    }))
  })

  // Vérifier que la conversation appartient bien au compte Instagram spécifié
  if (conversation.instagramAccountId !== accountId) {
    console.log("La conversation n'appartient pas au compte spécifié")
    redirect("/dashboard/messages")
  }

  console.log(`Conversation trouvée avec ${conversation.messages.length} messages`)

  return (
    <DashboardShell>
      <DashboardHeader
        heading={`Conversation avec ${conversation.participantUsername}`}
        text={`Via ${account.username}`}
      />
      
      <div className="flex flex-col h-[calc(100vh-200px)]">
        <Card className="flex-1 overflow-hidden flex flex-col">
          <CardHeader className="border-b">
            <CardTitle className="text-xl">{conversation.participantUsername}</CardTitle>
            <CardDescription>
              Dernière activité: {formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true, locale: fr })}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {conversation.messages.length === 0 ? (
              <div>
                <p className="text-center text-muted-foreground">Aucun message dans cette conversation</p>
                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    Si vous voyez une conversation sans messages, essayez de cliquer sur "Actualiser" 
                    sur la page des comptes Instagram pour récupérer les messages les plus récents.
                  </p>
                </div>
              </div>
            ) : (
              conversation.messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`flex ${message.isFromUser ? "justify-start" : "justify-end"}`}
                >
                  <div 
                    className={`max-w-[70%] p-3 rounded-lg ${
                      message.isFromUser 
                        ? "bg-muted" 
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    <p>{message.content}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true, locale: fr })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
          <CardFooter className="border-t p-4">
            <form className="flex w-full items-center space-x-2" action={`/api/messages/send?accountId=${accountId}&conversationId=${conversationId}`} method="post">
              <Input
                name="message"
                placeholder="Tapez votre message..."
                className="flex-1"
                required
              />
              <Button type="submit">
                <Send className="h-4 w-4 mr-2" />
                Envoyer
              </Button>
            </form>
          </CardFooter>
        </Card>
      </div>
    </DashboardShell>
  )
}
