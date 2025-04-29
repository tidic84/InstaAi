import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UsersIcon, MessageCircleIcon, CheckCircleIcon } from "lucide-react"

interface StatsCardsProps {
  totalAccounts: number
  activeAccounts: number
  totalConversations: number
}

export function StatsCards({ totalAccounts, activeAccounts, totalConversations }: StatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Comptes Instagram
          </CardTitle>
          <UsersIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalAccounts}</div>
          <p className="text-xs text-muted-foreground">
            {activeAccounts} actifs
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Conversations
          </CardTitle>
          <MessageCircleIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalConversations}</div>
          <p className="text-xs text-muted-foreground">
            Discussions Instagram
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Taux d'activité
          </CardTitle>
          <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {totalAccounts ? Math.round((activeAccounts / totalAccounts) * 100) : 0}%
          </div>
          <p className="text-xs text-muted-foreground">
            Comptes actifs
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
