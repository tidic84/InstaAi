"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { AlertCircle } from "lucide-react"

interface AddAccountFormProps {
  userId: string
}

export function AddAccountForm({ userId }: AddAccountFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/accounts/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          username: formData.username,
          password: formData.password,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Échec de l'ajout du compte Instagram")
      }

      toast({
        title: "Compte ajouté",
        description: "Votre compte Instagram a été connecté avec succès.",
      })

      router.push("/accounts")
      router.refresh()
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Échec de l'ajout du compte Instagram",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      // Effacer le mot de passe pour des raisons de sécurité
      setFormData((prev) => ({
        ...prev,
        password: "",
      }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-md bg-yellow-50 p-4 dark:bg-yellow-900/20">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Avis de sécurité</h3>
            <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
              <p>
                Vos identifiants Instagram sont chiffrés avant d'être stockés et ne sont utilisés que pour accéder à vos
                DM. Nous ne stockons jamais votre mot de passe en texte brut et ne partageons pas vos identifiants avec
                des tiers.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Nom d'utilisateur Instagram</Label>
        <Input
          id="username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          placeholder="votre_nom_utilisateur"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe Instagram</Label>
        <Input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="••••••••"
          required
        />
        <p className="text-xs text-muted-foreground">
          Votre mot de passe est chiffré avant d'être stocké et n'est utilisé que pour accéder à vos DM Instagram.
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Connexion en cours..." : "Connecter le compte"}
      </Button>
    </form>
  )
}
