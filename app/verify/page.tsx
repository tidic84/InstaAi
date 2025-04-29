import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Vérification de l'e-mail",
  description: "Vérifiez votre e-mail pour vous connecter",
}

export default function VerifyPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Vérifiez votre e-mail
          </h1>
          <p className="text-sm text-muted-foreground">
            Un lien de connexion a été envoyé à votre adresse e-mail.
            Veuillez vérifier votre boîte de réception.
          </p>
        </div>
        <Button asChild>
          <Link href="/login">
            Retour à la connexion
          </Link>
        </Button>
      </div>
    </div>
  )
}
