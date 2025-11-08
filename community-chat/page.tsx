"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send } from "lucide-react"
import { BottomNav } from "@/components/bottom-nav"

type CommunityMessage = {
  id: string
  sender_id: string
  message: string
  created_at: string
  sender: {
    id: string
    name: string
    profile_picture_url: string | null
  }
}

export default function CommunityChatPage() {
  const [messages, setMessages] = useState<CommunityMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    checkAuth()
    fetchMessages()

    // Subscribe to new messages in real-time
    const channel = supabase
      .channel("community_messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "community_messages",
        },
        async (payload) => {
          console.log("[v0] New community message received:", payload)

          // Fetch the complete message with sender info
          const { data: newMsg } = await supabase
            .from("community_messages")
            .select(`
              *,
              sender:student_profiles!community_messages_sender_id_fkey(*)
            `)
            .eq("id", payload.new.id)
            .single()

          if (newMsg) {
            setMessages((prev) => [...prev, newMsg as CommunityMessage])
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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
    if (response.ok) {
      const profile = await response.json()
      setCurrentUserId(profile.id)
    }
  }

  async function fetchMessages() {
    try {
      const response = await fetch("/api/community-chat")
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSend() {
    if (!newMessage.trim()) return

    setSending(true)
    try {
      const response = await fetch("/api/community-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newMessage }),
      })

      if (response.ok) {
        setNewMessage("")
      }
    } catch (error) {
      console.error("Failed to send message:", error)
    } finally {
      setSending(false)
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-primary">Community Chat</h1>
          <p className="text-sm text-muted-foreground">Connect with the entire CollabHub community</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="mx-auto max-w-4xl space-y-4">
            {loading ? (
              <div className="py-12 text-center text-muted-foreground">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <p>No messages yet. Be the first to say hello!</p>
              </div>
            ) : (
              messages.map((message) => {
                const isCurrentUser = message.sender_id === currentUserId
                return (
                  <div key={message.id} className={`flex gap-3 ${isCurrentUser ? "flex-row-reverse" : ""}`}>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={message.sender.profile_picture_url || undefined} />
                      <AvatarFallback>{message.sender.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className={`flex flex-col ${isCurrentUser ? "items-end" : "items-start"} flex-1`}>
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-xs font-medium">{message.sender.name}</span>
                        <span className="text-xs text-muted-foreground">{formatTime(message.created_at)}</span>
                      </div>
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}
                      >
                        <p className="text-sm">{message.message}</p>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </main>

      <footer className="border-t bg-background pb-16">
        <div className="container mx-auto px-4 py-4">
          <div className="mx-auto flex max-w-4xl gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Type a message..."
              disabled={sending}
            />
            <Button onClick={handleSend} disabled={sending || !newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </footer>

      <BottomNav />
    </div>
  )
}
