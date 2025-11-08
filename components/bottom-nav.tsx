"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Briefcase, User, Home, Sparkles, MessageCircle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>("")

  useEffect(() => {
    fetchUserProfile()
  }, [])

  async function fetchUserProfile() {
    try {
      const response = await fetch("/api/profile/me")
      if (response.ok) {
        const profile = await response.json()
        setProfilePictureUrl(profile.profile_picture_url)
        setUserName(profile.name || "User")
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error)
    }
  }

  const navItems = [
    {
      icon: Home,
      label: "Home",
      href: "/dashboard",
      active: pathname === "/dashboard",
    },
    {
      icon: Briefcase,
      label: "Tasks",
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
      label: "Profile",
      href: "/profile",
      active: pathname === "/profile",
      isProfile: true,
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background">
      <div className="flex h-16 items-center justify-around px-2">
        {navItems.map((item) => {
          if (item.isProfile) {
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-medium transition-colors",
                  item.active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Avatar className="h-5 w-5">
                  <AvatarImage src={profilePictureUrl || undefined} />
                  <AvatarFallback className="text-[10px]">
                    <User className="h-3 w-3" />
                  </AvatarFallback>
                </Avatar>
                <span className="text-[10px]">{item.label}</span>
              </button>
            )
          }

          const Icon = item.icon!
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
