import { redirect } from "next/navigation"
import { getServerSessionSafe } from "@/lib/get-session"
import { NewAccountForm } from "@/components/accounts/new-account-form"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"

export default async function NewAccountPage() {
  const session = await getServerSessionSafe()

  if (!session) {
    redirect("/login")
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Ajouter un compte Instagram"
        text="Connectez un nouveau compte Instagram pour gérer ses messages directs."
      />
      <div className="grid gap-8">
        <NewAccountForm />
      </div>
    </DashboardShell>
  )
}
