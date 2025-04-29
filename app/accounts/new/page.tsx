import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { AddAccountForm } from "@/components/accounts/add-account-form"

export default async function NewAccountPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Ajouter un compte Instagram"
        text="Connectez un nouveau compte Instagram à votre tableau de bord."
      />
      <div className="grid gap-4">
        <div className="rounded-lg border p-4">
          <AddAccountForm userId={session.user.id as string} />
        </div>
      </div>
    </DashboardShell>
  )
}
