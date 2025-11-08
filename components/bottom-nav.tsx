"use client"

import { usePathname, useRouter } from "next/navigation"
import { Briefcase, User, Home, Sparkles, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()

  const navItems = [
    {
      icon: Home,
      label: "Home",
      href: "/dashboard",
      active: pathname === "/dashboard",
    },
    {
      icon: Briefcase,
      label: "Projects",
      href: "/your-projects",
      active: pathname === "/your-projects",
    },
    {
      icon: MessageCircle,
      label: "Chat",
      href: "/community-chat",
      active: pathname === "/community-chat",
      isCenter: true,
    },
    {
      icon: Sparkles,
      label: "AI Teams",
      href: "/team-recommendations",
      active: pathname === "/team-recommendations",
    },
    {
      icon: User,
      label: "Profile",
      href: "/profile",
      active: pathname === "/profile",
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background">
      <div className="flex h-16 items-center justify-around px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-medium transition-colors",
                item.active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                item.isCenter && "scale-110",
              )}
            >
              <Icon className={cn("h-5 w-5", item.active && "fill-primary", item.isCenter && "h-6 w-6")} />
              <span className="text-[10px]">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
