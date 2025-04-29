import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { ResponseList } from "@/components/responses/response-list"

export default async function ResponsesPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  // Get pending responses
  const pendingResponses = await db.aIResponse.findMany({
    where: {
      status: "pending",
      message: {
        conversation: {
          instagramAccount: {
            userId: session.user.id as string,
          },
        },
      },
    },
    include: {
      message: {
        include: {
          conversation: {
            include: {
              instagramAccount: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return (
    <DashboardShell>
      <DashboardHeader heading="Réponses en attente" text="Révisez et approuvez les réponses générées par l'IA." />
      <ResponseList responses={pendingResponses} />
    </DashboardShell>
  )
}
