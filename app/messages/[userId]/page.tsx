"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Send } from "lucide-react"
import Link from "next/link"
import type { Message, StudentProfile } from "@/lib/types"

export default function ConversationPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [otherUser, setOtherUser] = useState<StudentProfile | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const params = useParams()
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    if (!params.userId) return

    checkAuth()
    fetchOtherUserProfile()
    fetchMessages()
  }, [params.userId])

  useEffect(() => {
    if (!currentUserId || !params.userId) return

    const roomId = `room-${[currentUserId, params.userId].sort().join("-")}`

    const channel = supabase
      .channel(roomId)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          console.log("[v0] New message received:", payload)
          const newMsg = payload.new as Message

          // Only add if it's part of this conversation
          if (
            (newMsg.sender_id === currentUserId && newMsg.recipient_id === params.userId) ||
            (newMsg.sender_id === params.userId && newMsg.recipient_id === currentUserId)
          ) {
            // Fetch complete message with profile data
            const { data } = await supabase
              .from("messages")
              .select(`
                *,
                sender:student_profiles!messages_sender_id_fkey(*),
                recipient:student_profiles!messages_recipient_id_fkey(*)
              `)
              .eq("id", newMsg.id)
              .single()

            if (data) {
              setMessages((prev) => {
                // Prevent duplicates
                if (prev.some((m) => m.id === data.id)) return prev
                return [...prev, data as Message]
              })
            }
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId, params.userId])

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

    const response = await fetch("/api/profile/me")
    const profile = await response.json()
    setCurrentUserId(profile.id)
  }

  async function fetchOtherUserProfile() {
    try {
      if (!params.userId || typeof params.userId !== "string") {
        console.error("Invalid user ID")
        setLoading(false)
        return
      }

      const response = await fetch(`/api/profile/${params.userId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch user profile")
      }
      const data = await response.json()
      setOtherUser(data)
    } catch (error) {
      console.error("Failed to fetch user profile:", error)
    }
  }

  async function fetchMessages() {
    try {
      if (!params.userId || typeof params.userId !== "string") {
        console.error("Invalid user ID")
        setLoading(false)
        return
      }

      const response = await fetch(`/api/messages/${params.userId}`)
      const data = await response.json()
      setMessages(data)

      // Mark messages as read
      await fetch("/api/messages/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sender_id: params.userId }),
      })
    } catch (error) {
      console.error("Failed to fetch messages:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSend() {
    if (!newMessage.trim()) return

    setSending(true)
    const messageText = newMessage
    setNewMessage("") // Clear immediately for better UX

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient_id: params.userId,
          message: messageText,
        }),
      })

      if (response.ok) {
        const sentMessage = await response.json()
        // The real-time subscription will add it, but we add it here too for instant feedback
        setMessages((prev) => {
          if (prev.some((m) => m.id === sentMessage.id)) return prev
          return [...prev, sentMessage]
        })
      }
    } catch (error) {
      console.error("Failed to send message:", error)
      setNewMessage(messageText) // Restore message on error
    } finally {
      setSending(false)
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" size="icon">
                <Link href="/messages">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={otherUser?.profile_picture_url || undefined} />
                  <AvatarFallback>{otherUser?.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold">{otherUser?.name}</h2>
                  {otherUser?.college && <p className="text-xs text-muted-foreground">{otherUser.college}</p>}
                </div>
              </div>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={`/profile/${params.userId}`}>View Profile</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-4xl space-y-4">
          {messages.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => {
              const isCurrentUser = message.sender_id === currentUserId
              return (
                <div
                  key={message.id}
                  className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    <p className="text-sm">{message.message}</p>
                    <p
                      className={`mt-1 text-xs ${isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                    >
                      {new Date(message.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="border-t bg-background">
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
    </div>
  )
}
