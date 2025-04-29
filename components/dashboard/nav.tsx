"use client"

import { LucideIcon, Home, Users, MessageCircle, Settings } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

interface NavProps {
  className?: string
}

interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  variant: "default" | "ghost"
}

export function DashboardNav({ className }: NavProps) {
  const pathname = usePathname()

  const navItems: NavItem[] = [
    {
      title: "Tableau de bord",
      href: "/dashboard",
      icon: Home,
      variant: "default",
    },
    {
      title: "Comptes Instagram",
      href: "/accounts",
      icon: Users,
      variant: "ghost",
    },
    {
      title: "Messages",
      href: "/dashboard/messages", // Correction du chemin vers /dashboard/messages
      icon: MessageCircle,
      variant: "ghost",
    },
    {
      title: "Paramètres",
      href: "/settings",
      icon: Settings,
      variant: "ghost",
    },
  ]

  return (
    <nav className={cn("grid items-start gap-2", className)}>
      {navItems.map((item, index) => (
        <Link
          key={index}
          href={item.href}
        >
          <span
            className={cn(
              "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
              pathname === item.href ? "bg-accent" : "transparent",
            )}
          >
            <item.icon className="mr-2 h-4 w-4" />
            <span>{item.title}</span>
          </span>
        </Link>
      ))}
    </nav>
  )
}
