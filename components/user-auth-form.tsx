"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icons } from "@/components/icons"
import Link from "next/link"

export function UserAuthForm({ isRegister = false }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [email, setEmail] = React.useState<string>("")
  const [name, setName] = React.useState<string>("")
  const [password, setPassword] = React.useState<string>("")
  const [confirmPassword, setConfirmPassword] = React.useState<string>("")
  const [error, setError] = React.useState<string>("")
  const [success, setSuccess] = React.useState<string>("")
  const searchParams = useSearchParams()

  async function onSubmit(event: React.SyntheticEvent) {
    event.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      if (isRegister) {
        // Vérification des mots de passe
        if (password.length < 8) {
          setError("Le mot de passe doit contenir au moins 8 caractères.")
          setIsLoading(false)
          return
        }
        
        if (password !== confirmPassword) {
          setError("Les mots de passe ne correspondent pas.")
          setIsLoading(false)
          return
        }
        
        // Envoyer l'inscription
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, name, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Erreur lors de l'inscription")
          setIsLoading(false)
          return
        }

        setSuccess("Inscription réussie! Connexion en cours...")
        
        // Utiliser credentials au lieu d'email pour la connexion
        const signInResult = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (signInResult?.error) {
          console.error("Erreur de connexion après inscription:", signInResult.error)
          setError("Inscription réussie mais erreur lors de la connexion automatique. Veuillez vous connecter manuellement.")
        } else {
          // Redirection après connexion réussie
          router.push("/dashboard")
        }
      } else {
        // Ne pas logger les informations sensibles
        const signInResult = await signIn("credentials", {
          email,
          password,
          redirect: false,
          callbackUrl: "/dashboard"
        });

        if (signInResult?.error) {
          // Message d'erreur générique sans détails techniques
          setError("Email ou mot de passe incorrect.");
        } else if (signInResult?.ok) {
          setSuccess("Connexion réussie! Redirection en cours...");
          
          // Redirection vers le tableau de bord
          setTimeout(() => {
            window.location.href = "/dashboard";
          }, 800);
        }
      }
    } catch (error) {
      // Message d'erreur générique sans détails techniques
      setError("Une erreur s'est produite. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={onSubmit}>
        <div className="grid gap-2">
          {isRegister && (
            <div className="grid gap-1">
              <Label htmlFor="name">Nom</Label>
              <Input
                id="name"
                placeholder="Votre nom"
                type="text"
                autoCapitalize="words"
                autoComplete="name"
                autoCorrect="off"
                disabled={isLoading}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}
          
          <div className="grid gap-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              placeholder="nom@exemple.fr"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="grid gap-1">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              placeholder="********"
              type="password"
              autoComplete={isRegister ? "new-password" : "current-password"}
              disabled={isLoading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          
          {isRegister && (
            <div className="grid gap-1">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <Input
                id="confirmPassword"
                placeholder="********"
                type="password"
                autoComplete="new-password"
                disabled={isLoading}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
          )}
          
          {/* Affichage des messages d'erreur - texte rouge clair sans box */}
          {error && (
            <div className="text-red-500 text-sm pt-1">
              {error}
            </div>
          )}
          
          {/* Affichage des messages de succès - texte vert clair sans box */}
          {success && (
            <div className="text-green-500 text-sm pt-1">
              {success}
            </div>
          )}
          
          <Button type="submit" disabled={isLoading}>
            {isLoading && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isRegister ? "S'inscrire" : "Connexion par e-mail"}
          </Button>
        </div>
      </form>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            {isRegister ? "Déjà inscrit ?" : "Pas encore de compte ?"}
          </span>
        </div>
      </div>
      
      <Button variant="outline" type="button" onClick={() => {
        if (isRegister) {
          router.push('/login');
        } else {
          router.push('/register');
        }
      }}>
        {isRegister ? "Se connecter" : "S'inscrire"}
      </Button>
    </div>
  )
}
