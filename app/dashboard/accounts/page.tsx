import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { AccountsList } from "@/components/dashboard/accounts-list"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import Link from "next/link"

export default async function AccountsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const accounts = await db.instagramAccount.findMany({
    where: {
      userId: session.user.id,
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
        <Link href="/dashboard/accounts/add">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Ajouter un compte
          </Button>
        </Link>
      </DashboardHeader>
      
      <AccountsList accounts={accounts} />
    </DashboardShell>
  )
}
