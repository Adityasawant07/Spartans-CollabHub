import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

// GET /api/messages/[userId] - Get conversation with specific user
export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId: otherUserId } = await params
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

    // Get messages between these two users
    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select(`
        id,
        sender_id,
        recipient_id,
        message,
        read,
        created_at,
        sender:student_profiles!messages_sender_id_fkey(id, name, email, avatar_url),
        recipient:student_profiles!messages_recipient_id_fkey(id, name, email, avatar_url)
      `)
      .or(
        `and(sender_id.eq.${profileId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${profileId})`,
      )
      .order("created_at", { ascending: true })

    if (messagesError) {
      console.error("[v0] Error fetching conversation:", messagesError)
      return NextResponse.json({ error: "Failed to fetch conversation" }, { status: 500 })
    }

    // Mark all messages from other user as read
    await supabase
      .from("messages")
      .update({ read: true })
      .eq("sender_id", otherUserId)
      .eq("recipient_id", profileId)
      .eq("read", false)

    return NextResponse.json(messages || [])
  } catch (error) {
    console.error("[v0] Error in GET /api/messages/[userId]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
