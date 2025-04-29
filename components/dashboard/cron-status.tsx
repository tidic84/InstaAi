import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

interface CronStatusProps {
  latestLog: {
    jobType: string
    status: string
    createdAt: Date
  } | null
}

export function CronStatus({ latestLog }: CronStatusProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>System Status</CardTitle>
        <CardDescription>Automated message fetching status</CardDescription>
      </CardHeader>
      <CardContent>
        {!latestLog ? (
          <div className="text-sm">
            <p>No automated tasks have run yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="font-medium">Last run:</p>
                <Badge variant={latestLog.status === "completed" ? "default" : "destructive"}>{latestLog.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(latestLog.createdAt), { addSuffix: true })}
              </p>
            </div>
            <Button variant="outline" size="sm" className="mt-2 w-full" asChild>
              <Link href="/system/cron">
                View History
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
