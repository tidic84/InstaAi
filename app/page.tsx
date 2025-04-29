import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { LandingPage } from "@/components/landing-page"

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (session) {
    // Si l'utilisateur est connecté, rediriger vers le tableau de bord
    redirect("/dashboard")
  }

  // Si l'utilisateur n'est pas connecté, afficher la page d'accueil
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <LandingPage />
      </main>
    </div>
  )
}
