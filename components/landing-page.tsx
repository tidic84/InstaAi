"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { signIn } from "next-auth/react"

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="px-4 lg:px-6 h-14 flex items-center">
        <Link className="flex items-center justify-center" href="/">
          <span className="font-bold text-xl">InstaDM AI</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Button variant="ghost" onClick={() => signIn()}>
            Se connecter
          </Button>
          <Button onClick={() => signIn()}>Commencer</Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Automatisez vos DM Instagram avec l'IA
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  Connectez vos comptes Instagram, laissez l'IA générer des réponses, et approuvez-les avant l'envoi.
                </p>
              </div>
              <div className="space-x-4">
                <Link href="/dashboard" passHref>
                  <Button size="lg">
                    Commencer
                  </Button>
                </Link>
                <Link href="/login" passHref>
                  <Button variant="outline" size="lg">
                    Se connecter
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Fonctionnalités clés</h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Tout ce dont vous avez besoin pour gérer efficacement vos DM Instagram
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
              {[
                {
                  title: "Comptes multiples",
                  description: "Connectez et gérez plusieurs comptes Instagram depuis un seul tableau de bord.",
                },
                {
                  title: "Réponses alimentées par l'IA",
                  description: "Générez des réponses contextuelles aux DM en utilisant la technologie Mistral AI.",
                },
                {
                  title: "Flux d'approbation",
                  description: "Révisez, modifiez et approuvez les réponses générées par l'IA avant l'envoi.",
                },
              ].map((feature, index) => (
                <div key={index} className="grid gap-1">
                  <h3 className="text-lg font-bold">{feature.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} InstaDM AI. Tous droits réservés.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Conditions d'utilisation
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Confidentialité
          </Link>
        </nav>
      </footer>
    </div>
  )
}
