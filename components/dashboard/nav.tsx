"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"

interface DashboardNavProps {
  items: {
    href: string
    title: string
  }[]
  className?: string
}

export function DashboardNav({ items, className }: DashboardNavProps) {
  if (!items?.length) {
    return null
  }

  return (
    <nav className={cn("grid items-start gap-2", className)}>
      {items.map((item, index) => (
        <Link
          key={index}
          href={item.href}
          className={cn(
            "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
            "transparent",
          )}
        >
          <span>{item.title}</span>
        </Link>
      ))}
    </nav>
  )
}
