"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { formatDistanceToNow } from "date-fns"
import { Trash2, PlusCircle } from "lucide-react"
import Link from "next/link"

interface AccountListProps {
  accounts: {
    id: string
    username: string
    isActive: boolean
    lastChecked: Date
    createdAt: Date
  }[]
}

export function AccountList({ accounts }: AccountListProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({})

  const toggleAccountStatus = async (accountId: string, currentStatus: boolean) => {
    setIsSubmitting((prev) => ({ ...prev, [accountId]: true }))

    try {
      const response = await fetch("/api/accounts/toggle-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountId,
          isActive: !currentStatus,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update account status")
      }

      toast({
        title: "Account Updated",
        description: `Account ${currentStatus ? "deactivated" : "activated"} successfully.`,
      })

      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update account status",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting((prev) => ({ ...prev, [accountId]: false }))
    }
  }

  const deleteAccount = async (accountId: string) => {
    setIsSubmitting((prev) => ({ ...prev, [accountId]: true }))

    try {
      const response = await fetch("/api/accounts/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete account")
      }

      toast({
        title: "Account Deleted",
        description: "The Instagram account has been removed.",
      })

      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete account",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting((prev) => ({ ...prev, [accountId]: false }))
    }
  }

  if (accounts.length === 0) {
    return (
      <div className="flex h-[300px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
        <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
          <h3 className="mt-4 text-lg font-semibold">No accounts connected</h3>
          <p className="mt-2 text-sm text-muted-foreground">Add your first Instagram account to get started.</p>
          <Button className="mt-4" asChild>
            <Link href="/accounts/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Account
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {accounts.map((account) => (
        <Card key={account.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{account.username}</CardTitle>
              <Switch
                checked={account.isActive}
                onCheckedChange={() => toggleAccountStatus(account.id, account.isActive)}
                disabled={isSubmitting[account.id]}
              />
            </div>
            <CardDescription>
              Added {formatDistanceToNow(new Date(account.createdAt), { addSuffix: true })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              <p>Status: {account.isActive ? "Active" : "Inactive"}</p>
              <p>Last checked: {formatDistanceToNow(new Date(account.lastChecked), { addSuffix: true })}</p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <Link href={`/accounts/${account.id}`}>View Details</Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove the Instagram account from your dashboard. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteAccount(account.id)}
                    className="bg-destructive text-destructive-foreground"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
