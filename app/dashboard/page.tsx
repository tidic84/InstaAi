import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { RecentActivity } from "@/components/dashboard/recent-activity"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  // Récupérer les statistiques de l'utilisateur
  const stats = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      _count: {
        select: {
          igAccounts: true,
        },
      },
      igAccounts: {
        select: {
          id: true,
          username: true,
          isActive: true,
          _count: {
            select: {
              conversations: true,
            },
          },
        },
      },
    },
  })

  // Calculer les statistiques globales
  const totalAccounts = stats?._count.igAccounts || 0
  const activeAccounts = stats?.igAccounts.filter(account => account.isActive).length || 0
  const totalConversations = stats?.igAccounts.reduce((sum, account) => sum + account._count.conversations, 0) || 0

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Tableau de bord"
        text="Une vue d'ensemble de votre activité Instagram."
      />
      
      <StatsCards
        totalAccounts={totalAccounts}
        activeAccounts={activeAccounts}
        totalConversations={totalConversations}
      />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <RecentActivity userId={session.user.id} />
      </div>
    </DashboardShell>
  )
}
