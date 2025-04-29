import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { UserAuthForm } from "@/components/user-auth-form"

export default async function LoginPage() {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Connexion à votre compte
          </h1>
          <p className="text-sm text-muted-foreground">
            Entrez votre email pour vous connecter
          </p>
        </div>
        <UserAuthForm />
      </div>
    </div>
  )
}
