import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

// PUT /api/messages/mark-read - Mark messages as read
export async function PUT(request: NextRequest) {
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

    const body = await request.json()
    const { sender_id } = body

    if (!sender_id) {
      return NextResponse.json({ error: "Missing sender_id" }, { status: 400 })
    }

    // Mark all messages from sender as read
    const { error } = await supabase
      .from("messages")
      .update({ read: true })
      .eq("sender_id", sender_id)
      .eq("recipient_id", profileId)
      .eq("read", false)

    if (error) {
      console.error("[v0] Error marking messages as read:", error)
      return NextResponse.json({ error: "Failed to mark messages as read" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in PUT /api/messages/mark-read:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
