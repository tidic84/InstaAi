import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { CronHistory } from "@/components/dashboard/cron-history"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

export default async function CronPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  // Verify user is admin (you might want to add an isAdmin field to your User model)
  const user = await db.user.findUnique({
    where: {
      id: session.user.id as string,
    },
  })

  if (!user) {
    redirect("/dashboard")
  }

  // Get cron logs
  const logs = await db.cronLog.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 20,
  })

  return (
    <DashboardShell>
      <DashboardHeader heading="Cron Jobs" text="Monitor and manage automated tasks.">
        <form action={`/api/cron/fetch-messages?secret=${process.env.CRON_SECRET}`} method="GET">
          <Button type="submit">
            <RefreshCw className="mr-2 h-4 w-4" />
            Run Message Fetch
          </Button>
        </form>
      </DashboardHeader>
      <div className="grid gap-4">
        <CronHistory logs={logs} />
      </div>
    </DashboardShell>
  )
}
