"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Home, User, MessageCircle, Lightbulb, ClipboardList } from "lucide-react"
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
      icon: Lightbulb,
      label: "Team Recommendation",
      href: "/team-recommendations",
      active: pathname === "/team-recommendations",
    },
    {
      icon: ClipboardList,
      label: "Tasks",
      href: "/your-projects",
      active: pathname === "/your-projects",
    },
    {
      icon: MessageCircle,
      label: "Community Chat",
      href: "/community-chat",
      active: pathname === "/community-chat",
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
                  item.active ? "text-[#60A5FA]" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Avatar className="h-7 w-7 ring-2 ring-transparent" style={item.active ? { ringColor: "#60A5FA" } : {}}>
                  <AvatarImage src={profilePictureUrl || undefined} />
                  <AvatarFallback className="bg-[#60A5FA] text-white">
                    {userName.charAt(0).toUpperCase() || <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs">{item.label}</span>
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
                item.active ? "text-[#60A5FA]" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-6 w-6" />
              <span className="text-xs">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
