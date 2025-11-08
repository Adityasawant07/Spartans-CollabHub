"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageCircle, ArrowLeft, Clock, User } from "lucide-react"
import Link from "next/link"
import type { Conversation } from "@/lib/types"

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    checkAuth()
    fetchConversations()
  }, [])

  useEffect(() => {
    if (!currentUserId) return

    const channel = supabase
      .channel("conversations")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `recipient_id=eq.${currentUserId}`,
        },
        () => {
          console.log("[v0] New message notification")
          fetchConversations()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId])

  async function checkAuth() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth/login")
      return
    }

    const response = await fetch("/api/profile/me")
    const profile = await response.json()
    setCurrentUserId(profile.id)
  }

  async function fetchConversations() {
    try {
      const response = await fetch("/api/messages")
      const data = await response.json()
      if (Array.isArray(data)) {
        setConversations(data)
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Button asChild variant="ghost">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-6 w-6" />
                Private Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              {conversations.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <MessageCircle className="mx-auto mb-4 h-12 w-12 opacity-20" />
                  <p>No messages yet</p>
                  <p className="text-sm">Start a conversation by messaging someone from their profile</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conv) => (
                    <Link key={conv.other_user.id} href={`/messages/${conv.other_user.id}`}>
                      <div className="flex items-start gap-4 rounded-lg border p-4 transition-all duration-200 hover:bg-muted hover:shadow-md relative group">
                        <Avatar className="h-14 w-14 flex-shrink-0 ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all">
                          <AvatarImage src={conv.other_user.profile_picture_url || undefined} />
                          <AvatarFallback className="text-lg bg-gradient-to-br from-primary to-primary/60 text-white">
                            {conv.other_user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 overflow-hidden min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div>
                              <h3 className="font-semibold text-base truncate">{conv.other_user.name}</h3>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {conv.other_user.college || "College not specified"}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>{formatMessageTime(conv.last_message.created_at)}</span>
                              </div>
                              {conv.unread_count > 0 && (
                                <div className="relative">
                                  <Badge className="bg-blue-500 text-white hover:bg-blue-600 text-xs px-2">
                                    {conv.unread_count}
                                  </Badge>
                                  <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                                </div>
                              )}
                            </div>
                          </div>
                          <p
                            className={`text-sm truncate ${
                              conv.unread_count > 0 ? "font-semibold text-foreground" : "text-muted-foreground"
                            }`}
                          >
                            {conv.last_message.message}
                          </p>
                        </div>
                        <MessageCircle className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
