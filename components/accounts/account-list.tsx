"use client"

import { useState } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Trash, MessageCircle, RefreshCw } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface Account {
  id: string
  username: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date // Remplacer lastChecked par updatedAt
  _count: {
    conversations: number
  }
}

interface AccountListProps {
  accounts: Account[]
}

export function AccountList({ accounts }: AccountListProps) {
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({})
  const [debugMode, setDebugMode] = useState(false)
  const [debugOutput, setDebugOutput] = useState("")
  const [accountStatuses, setAccountStatuses] = useState<Record<string, boolean>>(
    accounts.reduce((acc, account) => ({ ...acc, [account.id]: account.isActive }), {})
  )

  const toggleAccountStatus = async (id: string, currentStatus: boolean) => {
    setIsSubmitting(prev => ({ ...prev, [id]: true }))
    
    try {
      const response = await fetch(`/api/accounts/${id}/toggle-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: !currentStatus,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Échec de la mise à jour du compte")
      }

      // Mettre à jour l'état local pour éviter de recharger la page
      setAccountStatuses(prev => ({ ...prev, [id]: !currentStatus }))

      toast({
        title: "Compte mis à jour",
        description: data.message || `Le compte est maintenant ${!currentStatus ? "actif" : "inactif"}.`,
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur s'est produite",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(prev => ({ ...prev, [id]: false }))
    }
  }

  const fetchMessages = async (id: string) => {
    setIsSubmitting(prev => ({ ...prev, [id]: true }))
    setDebugOutput("")
    
    try {
      const response = await fetch("/api/messages/fetch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountId: id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (debugMode) {
          setDebugOutput(JSON.stringify(data, null, 2))
        }
        throw new Error(data.error || "Échec de la récupération des messages")
      }

      toast({
        title: "Messages récupérés",
        description: data.message || `${data.threads?.length || 0} conversations mises à jour.`,
      })

      if (debugMode) {
        setDebugOutput(JSON.stringify(data, null, 2))
      }

      // Rafraîchir la page pour mettre à jour l'état
      window.location.reload()
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur s'est produite",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(prev => ({ ...prev, [id]: false }))
    }
  }

  const deleteAccount = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce compte ? Cette action est irréversible.")) {
      return
    }
    
    setIsSubmitting(prev => ({ ...prev, [id]: true }))
    
    try {
      const response = await fetch(`/api/accounts/${id}/delete`, {
        method: "POST",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Échec de la suppression du compte")
      }

      toast({
        title: "Compte supprimé",
        description: "Le compte a été supprimé avec succès.",
      })

      // Rafraîchir la page pour mettre à jour l'état
      window.location.reload()
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur s'est produite",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(prev => ({ ...prev, [id]: false }))
    }
  }

  if (accounts.length === 0) {
    return (
      <div className="flex h-[200px] w-full flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Vous n'avez pas encore ajouté de compte Instagram.
        </p>
        <Button className="mt-4" asChild>
          <Link href="/accounts/new">Ajouter un compte</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {debugMode && (
        <div className="flex justify-end mb-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setDebugMode(!debugMode)}
          >
            {debugMode ? "Désactiver le mode debug" : "Activer le mode debug"}
          </Button>
        </div>
      )}

      {debugOutput && debugMode && (
        <div className="p-4 border rounded-md mb-4 bg-black text-white overflow-auto max-h-[300px]">
          <pre>{debugOutput}</pre>
        </div>
      )}
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {accounts.map((account) => {
          // Utiliser le statut local ou celui récupéré initialement
          const isActive = accountStatuses[account.id] ?? account.isActive;
          
          return (
            <Card key={account.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg truncate">
                    {account.username}
                  </CardTitle>
                  <Switch 
                    checked={isActive} 
                    onCheckedChange={() => toggleAccountStatus(account.id, isActive)}
                    disabled={isSubmitting[account.id]}
                  />
                </div>
                <CardDescription>
                  Ajouté {formatDistanceToNow(new Date(account.createdAt), { addSuffix: true, locale: fr })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Statut:</span>
                    <span className={isActive ? "text-green-500" : "text-red-500"}>
                      {isActive ? "Actif" : "Inactif"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Conversations:</span>
                    <span>{account._count.conversations}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dernière mise à jour:</span>
                    <span>
                      {formatDistanceToNow(new Date(account.updatedAt), { addSuffix: true, locale: fr })}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-2">
                <div className="flex w-full space-x-2">
                  <Button 
                    className="flex-1" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => fetchMessages(account.id)}
                    disabled={isSubmitting[account.id] || !isActive}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Actualiser
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1" 
                    asChild
                    disabled={!isActive}
                  >
                    <Link href={`/dashboard/messages/${account.id}`}>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Messages
                    </Link>
                  </Button>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => deleteAccount(account.id)}
                  disabled={isSubmitting[account.id]}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Supprimer
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  )
}
