"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageCircle, ArrowLeft } from "lucide-react"
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

    // Get current user's profile ID
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
                Messages
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
                      <div className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-muted">
                        <Avatar className="h-12 w-12 flex-shrink-0">
                          <AvatarImage src={conv.other_user.profile_picture_url || undefined} />
                          <AvatarFallback className="text-lg">
                            {conv.other_user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 overflow-hidden">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold">{conv.other_user.name}</h3>
                            {conv.unread_count > 0 && (
                              <Badge variant="default" className="ml-2">
                                {conv.unread_count}
                              </Badge>
                            )}
                          </div>
                          <p className="truncate text-sm text-muted-foreground">{conv.last_message.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(conv.last_message.created_at).toLocaleDateString()}
                          </p>
                        </div>
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
