import Link from "next/link"
import { Button } from "@/components/ui/button"

interface DashboardHeaderProps {
  heading: string
  text?: string
  children?: React.ReactNode
  buttonText?: string
  buttonLink?: string
}

export function DashboardHeader({
  heading,
  text,
  children,
  buttonText,
  buttonLink,
}: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between px-2">
      <div className="grid gap-1">
        <h1 className="font-heading text-3xl md:text-4xl">{heading}</h1>
        {text && <p className="text-lg text-muted-foreground">{text}</p>}
      </div>
      {children}
      {buttonText && buttonLink && (
        <Button asChild>
          <Link href={buttonLink}>{buttonText}</Link>
        </Button>
      )}
    </div>
  )
}
