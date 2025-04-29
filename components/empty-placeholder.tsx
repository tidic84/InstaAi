import { Button } from "@/components/ui/button"
import Link from "next/link"

interface EmptyPlaceholderProps {
  title: string
  description: string
  action?: {
    label: string
    href: string
  }
}

export function EmptyPlaceholder({ title, description, action }: EmptyPlaceholderProps) {
  return (
    <div className="flex h-[300px] w-full flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
      <div className="mx-auto max-w-[420px] text-center">
        <h3 className="mt-4 text-lg font-medium">{title}</h3>
        <p className="mt-2 mb-4 text-sm text-muted-foreground">
          {description}
        </p>
        {action && (
          <Button asChild>
            <Link href={action.href}>
              {action.label}
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}
