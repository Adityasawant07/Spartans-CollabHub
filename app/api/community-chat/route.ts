import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createServerClient()

    const { data: messages, error } = await supabase
      .from("community_messages")
      .select(`
        *,
        sender:student_profiles!community_messages_sender_id_fkey(*)
      `)
      .order("created_at", { ascending: true })
      .limit(100)

    if (error) {
      console.error("[v0] Community chat GET error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ messages: messages || [] })
  } catch (error: any) {
    console.error("[v0] Community chat GET catch error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("student_profiles").select("id").eq("user_id", user.id).single()

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const body = await request.json()
    const { message } = body

    const { data: newMessage, error } = await supabase
      .from("community_messages")
      .insert({
        sender_id: profile.id,
        message,
      })
      .select(`
        *,
        sender:student_profiles!community_messages_sender_id_fkey(*)
      `)
      .single()

    if (error) {
      console.error("[v0] Community message creation error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: newMessage })
  } catch (error: any) {
    console.error("[v0] Community chat POST catch error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
