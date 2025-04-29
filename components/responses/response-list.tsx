"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import { CheckCircle, XCircle } from "lucide-react"

interface ResponseListProps {
  responses: {
    id: string
    suggestedResponse: string
    createdAt: Date
    message: {
      id: string
      content: string
      timestamp: Date
      conversation: {
        participantUsername: string
        instagramAccount: {
          username: string
        }
      }
    }
  }[]
}

export function ResponseList({ responses }: ResponseListProps) {
  const router = useRouter()
  const [editedResponses, setEditedResponses] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({})

  const handleResponseChange = (id: string, text: string) => {
    setEditedResponses((prev) => ({
      ...prev,
      [id]: text,
    }))
  }

  const approveResponse = async (responseId: string) => {
    setIsSubmitting((prev) => ({ ...prev, [responseId]: true }))

    try {
      const response = await fetch("/api/responses/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          responseId,
          modifiedText: editedResponses[responseId],
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Échec de l'approbation de la réponse")
      }

      toast({
        title: "Réponse approuvée",
        description: "Votre réponse a été envoyée à Instagram.",
      })

      router.refresh()
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Échec de l'approbation de la réponse",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting((prev) => ({ ...prev, [responseId]: false }))
    }
  }

  const rejectResponse = async (responseId: string) => {
    setIsSubmitting((prev) => ({ ...prev, [responseId]: true }))

    try {
      const response = await fetch("/api/responses/reject", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          responseId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Échec du rejet de la réponse")
      }

      toast({
        title: "Réponse rejetée",
        description: "La réponse a été rejetée.",
      })

      router.refresh()
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Échec du rejet de la réponse",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting((prev) => ({ ...prev, [responseId]: false }))
    }
  }

  if (responses.length === 0) {
    return (
      <div className="flex h-[300px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
        <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
          <h3 className="mt-4 text-lg font-semibold">Aucune réponse en attente</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Toutes les réponses ont été examinées. Revenez plus tard pour de nouveaux messages.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {responses.map((response) => (
        <Card key={response.id}>
          <CardHeader>
            <CardTitle className="text-lg">Message de {response.message.conversation.participantUsername}</CardTitle>
            <CardDescription>
              via {response.message.conversation.instagramAccount.username} •
              {formatDistanceToNow(new Date(response.message.timestamp), { addSuffix: true, locale: fr })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md bg-muted p-3">
              <p className="text-sm">{response.message.content}</p>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Réponse suggérée par l'IA :</h4>
              <Textarea
                value={editedResponses[response.id] ?? response.suggestedResponse}
                onChange={(e) => handleResponseChange(response.id, e.target.value)}
                className="min-h-[100px]"
                placeholder="Modifiez la réponse si nécessaire..."
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => rejectResponse(response.id)} disabled={isSubmitting[response.id]}>
              <XCircle className="mr-2 h-4 w-4" />
              Rejeter
            </Button>
            <Button onClick={() => approveResponse(response.id)} disabled={isSubmitting[response.id]}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Approuver et envoyer
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
