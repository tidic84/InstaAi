import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Tableau de bord"
        text="Gérez vos comptes Instagram en un seul endroit."
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Contenu de votre tableau de bord */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="text-xl font-semibold mb-2">Bienvenue</h3>
          <p>Vous êtes connecté en tant que {session.user?.email || 'utilisateur'}</p>
        </div>
      </div>
    </DashboardShell>
  )
}
