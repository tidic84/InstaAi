import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"

interface CronHistoryProps {
  logs: {
    id: string
    jobType: string
    status: string
    details: string
    createdAt: Date
  }[]
}

export function CronHistory({ logs }: CronHistoryProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Cron Job History</CardTitle>
        <CardDescription>Recent automated tasks</CardDescription>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="flex h-[100px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
            <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
              <p className="text-sm text-muted-foreground">No cron jobs have run yet.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="rounded-md border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{log.jobType}</p>
                    <Badge variant={log.status === "completed" ? "default" : "destructive"}>{log.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                  </p>
                </div>
                {log.details && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <details>
                      <summary>Details</summary>
                      <pre className="mt-2 whitespace-pre-wrap rounded bg-muted p-2 text-xs">
                        {JSON.stringify(JSON.parse(log.details), null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
