import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle } from "lucide-react"

interface AccountsOverviewProps {
  accounts: {
    id: string
    username: string
    isActive: boolean
    _count: {
      conversations: number
    }
  }[]
}

export function AccountsOverview({ accounts }: AccountsOverviewProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle>Instagram Accounts</CardTitle>
          <CardDescription>
            You have {accounts.length} connected {accounts.length === 1 ? "account" : "accounts"}.
          </CardDescription>
        </div>
        <Button size="sm" variant="outline" asChild>
          <Link href="/accounts/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Account
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {accounts.length === 0 ? (
          <div className="flex h-[100px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
            <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
              <p className="text-sm text-muted-foreground">You haven&apos;t added any Instagram accounts yet.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {accounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between rounded-md border p-3">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                    {account.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{account.username}</p>
                    <p className="text-xs text-muted-foreground">{account._count.conversations} conversations</p>
                  </div>
                </div>
                <div className={`h-2 w-2 rounded-full ${account.isActive ? "bg-green-500" : "bg-red-500"}`} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" asChild>
          <Link href="/accounts">Manage Accounts</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
