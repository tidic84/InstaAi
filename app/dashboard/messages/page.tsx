import { redirect } from "next/navigation"
import { getServerSessionSafe } from "@/lib/get-session"
import { db } from "@/lib/db"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { MessagesList } from "@/components/dashboard/messages-list"

export default async function MessagesPage() {
  const session = await getServerSessionSafe()

  if (!session) {
    redirect("/login")
  }

  const accounts = await db.instagramAccount.findMany({
    where: {
      userId: session.user.id,
      isActive: true,
    },
    include: {
      conversations: {
        include: {
          messages: {
            orderBy: {
              createdAt: "desc" // Utiliser createdAt au lieu de timestamp ou sentAt
            },
            take: 1,
          },
        },
        orderBy: {
          lastMessageAt: "desc",
        },
      },
    },
  })

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Messages"
        text="Consultez et répondez à vos messages Instagram."
      />
      
      <MessagesList accounts={accounts} />
    </DashboardShell>
  )
}
