import { Metadata } from "next"
import { UserAuthForm } from "@/components/user-auth-form"

export const metadata: Metadata = {
  title: "Inscription | InstaApp",
  description: "Créez un compte pour utiliser InstaApp",
}

export default function RegisterPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Créer un compte
          </h1>
          <p className="text-sm text-muted-foreground">
            Inscrivez-vous pour commencer à utiliser InstaApp
          </p>
        </div>
        <UserAuthForm isRegister={true} />
      </div>
    </div>
  )
}
