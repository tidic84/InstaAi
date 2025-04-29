import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { InstagramAccount } from "@prisma/client"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import { Trash, MessageCircle } from "lucide-react"
import Link from "next/link"

interface AccountsListProps {
  accounts: InstagramAccount[]
}

export function AccountsList({ accounts }: AccountsListProps) {
  const toggleAccountStatus = async (accountId: string, isActive: boolean) => {
    try {
      await fetch("/api/accounts/toggle-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accountId, isActive }),
      })
    } catch (error) {
      console.error("Error toggling account status:", error)
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {accounts.length === 0 ? (
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle>Aucun compte Instagram</CardTitle>
            <CardDescription>
              Vous n'avez pas encore connecté de compte Instagram.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/dashboard/accounts/add">
              <Button>Ajouter un compte</Button>
            </Link>
          </CardFooter>
        </Card>
      ) : (
        accounts.map((account) => (
          <Card key={account.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg truncate">
                  {account.username}
                </CardTitle>
                <Switch 
                  checked={account.isActive} 
                  onCheckedChange={(checked) => toggleAccountStatus(account.id, checked)}
                />
              </div>
              <CardDescription>
                Ajouté {formatDistanceToNow(new Date(account.createdAt), { addSuffix: true, locale: fr })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                Statut: <span className={account.isActive ? "text-green-500" : "text-red-500"}>
                  {account.isActive ? "Actif" : "Inactif"}
                </span>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/messages/${account.id}`}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Messages
                </Link>
              </Button>
              <Button variant="destructive" size="sm">
                <Trash className="mr-2 h-4 w-4" />
                Supprimer
              </Button>
            </CardFooter>
          </Card>
        ))
      )}
    </div>
  )
}
