import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Button } from "@/components/ui/button"
import { AccountList } from "@/components/accounts/account-list"
import { PlusCircle } from "lucide-react"

export default async function AccountsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const accounts = await db.instagramAccount.findMany({
    where: {
      userId: session.user.id as string,
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return (
    <DashboardShell>
      <DashboardHeader heading="Instagram Accounts" text="Manage your connected Instagram accounts.">
        <Button asChild>
          <Link href="/accounts/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Account
          </Link>
        </Button>
      </DashboardHeader>
      <AccountList accounts={accounts} />
    </DashboardShell>
  )
}
