import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createServerClient()

    const { data: events, error } = await supabase
      .from("events")
      .select(`
        *,
        organizer:student_profiles!events_organizer_id_fkey(*)
      `)
      .order("date", { ascending: true })

    if (error) {
      console.error("[v0] Events GET error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ events: events || [] })
  } catch (error: any) {
    console.error("[v0] Events GET catch error:", error)
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
    const { name, description, date, location } = body

    const { data: event, error } = await supabase
      .from("events")
      .insert({
        name,
        description,
        date,
        location,
        organizer_id: profile.id,
      })
      .select(`
        *,
        organizer:student_profiles!events_organizer_id_fkey(*)
      `)
      .single()

    if (error) {
      console.error("[v0] Event creation error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ event })
  } catch (error: any) {
    console.error("[v0] Event POST catch error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
