import { redirect } from "next/navigation"
import { getServerSessionSafe } from "@/lib/get-session"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { MessagesList } from "@/components/messages/conversation-list"
import { db } from "@/lib/db"

export default async function MessagesPage() {
  const session = await getServerSessionSafe()

  if (!session) {
    redirect("/login")
  }

  // Rediriger vers la version dans le dossier dashboard
  redirect("/dashboard/messages")
}
