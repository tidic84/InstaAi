import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { db } from "@/lib/db"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"

interface RecentActivityProps {
  userId: string
}

export async function RecentActivity({ userId }: RecentActivityProps) {
  try {
    const recentMessages = await db.message.findMany({
      where: {
        conversation: {
          instagramAccount: {
            userId: userId,
          },
        },
      },
      orderBy: {
        // Utiliser createdAt au lieu de sentAt qui n'existe pas encore dans la DB
        createdAt: "desc",
      },
      take: 5,
      include: {
        conversation: {
          include: {
            instagramAccount: true,
          },
        },
      },
    })

    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Activité récente</CardTitle>
          <CardDescription>
            Les 5 derniers messages reçus sur tous vos comptes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentMessages.length === 0 ? (
            <p className="text-muted-foreground text-sm">Aucune activité récente</p>
          ) : (
            <div className="space-y-4">
              {recentMessages.map((message) => (
                <div key={message.id} className="flex items-start gap-4 border-b pb-4 last:border-0">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {message.conversation.participantUsername}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        via {message.conversation.instagramAccount.username}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {message.content}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {/* Utiliser createdAt au lieu de sentAt */}
                    {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true, locale: fr })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    )
  } catch (error) {
    console.error("Erreur lors de la récupération des messages récents:", error)
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Activité récente</CardTitle>
          <CardDescription>
            Les derniers messages reçus sur tous vos comptes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Impossible de charger l'activité récente. Veuillez réessayer plus tard.
          </p>
        </CardContent>
      </Card>
    )
  }
}
