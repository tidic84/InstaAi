import { redirect } from "next/navigation"
import Link from "next/link"
import { getServerSessionSafe } from "@/lib/get-session"
import { db } from "@/lib/db"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { AccountList } from "@/components/accounts/account-list"

export default async function AccountsPage() {
  const session = await getServerSessionSafe()

  if (!session) {
    redirect("/login")
  }

  const accounts = await db.instagramAccount.findMany({
    where: {
      userId: session.user.id,
    },
    select: {
      id: true,
      username: true,
      isActive: true,
      createdAt: true,
      updatedAt: true, // Utilisation de updatedAt au lieu de lastChecked
      _count: {
        select: {
          conversations: true
        }
      }
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Comptes Instagram"
        text="Gérez vos comptes Instagram connectés."
      >
        <Button asChild>
          <Link href="/accounts/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Ajouter un compte
          </Link>
        </Button>
      </DashboardHeader>
      <div>
        <AccountList accounts={accounts} />
      </div>
    </DashboardShell>
  )
}
