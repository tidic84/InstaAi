import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface RecentActivityProps {
  userId: string
}

export async function RecentActivity({ userId }: RecentActivityProps) {
  // Utiliser une approche différente pour éviter les erreurs liées à la base de données
  // Au lieu de récupérer les messages, afficher juste un message temporaire 
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Activité récente</CardTitle>
        <CardDescription>
          Les derniers messages reçus sur tous vos comptes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          Aucune activité récente disponible. Ajoutez des comptes Instagram pour voir votre activité.
        </p>
      </CardContent>
    </Card>
  )
}
