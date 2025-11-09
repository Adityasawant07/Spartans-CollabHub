import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

// GET /api/messages - Get all conversations for the current user
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's profile
    const { data: profiles, error: profileError } = await supabase
      .from("student_profiles")
      .select("id")
      .eq("user_id", user.id)

    if (profileError || !profiles || profiles.length === 0) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const profileId = profiles[0].id

    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select(`
        id,
        sender_id,
        recipient_id,
        message,
        read,
        created_at,
        sender:sender_id(id, name, email, profile_picture_url, college, avatar_url),
        recipient:recipient_id(id, name, email, profile_picture_url, college, avatar_url)
      `)
      .or(`sender_id.eq.${profileId},recipient_id.eq.${profileId}`)
      .order("created_at", { ascending: false })

    if (messagesError) {
      console.error("[v0] Error fetching messages:", messagesError)
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
    }

    // Group messages by conversation (other user)
    const conversationsMap = new Map()

    for (const message of messages || []) {
      const otherUserId = message.sender_id === profileId ? message.recipient_id : message.sender_id
      const otherUser = message.sender_id === profileId ? message.recipient : message.sender

      if (!conversationsMap.has(otherUserId)) {
        conversationsMap.set(otherUserId, {
          other_user: otherUser,
          last_message: message,
          unread_count: 0,
        })
      }

      // Count unread messages from the other user
      if (message.recipient_id === profileId && !message.read) {
        conversationsMap.get(otherUserId).unread_count++
      }
    }

    const conversations = Array.from(conversationsMap.values())

    return NextResponse.json(conversations)
  } catch (error) {
    console.error("[v0] Error in GET /api/messages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/messages - Send a new message
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's profile
    const { data: profiles, error: profileError } = await supabase
      .from("student_profiles")
      .select("id")
      .eq("user_id", user.id)

    if (profileError || !profiles || profiles.length === 0) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const senderId = profiles[0].id

    const body = await request.json()
    const { recipient_id, message } = body

    if (!recipient_id || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Insert message
    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_id: senderId,
        recipient_id,
        message,
      })
      .select(`
        id,
        sender_id,
        recipient_id,
        message,
        read,
        created_at,
        sender:sender_id(id, name, email, profile_picture_url, college, avatar_url),
        recipient:recipient_id(id, name, email, profile_picture_url, college, avatar_url)
      `)

    if (error) {
      console.error("[v0] Error sending message:", error)
      return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
    }

    return NextResponse.json(data[0])
  } catch (error) {
    console.error("[v0] Error in POST /api/messages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
