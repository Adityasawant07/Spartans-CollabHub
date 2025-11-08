import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createServerClient()

    const today = new Date().toISOString().split("T")[0]

    const { data: competitions, error } = await supabase
      .from("competitions")
      .select(`
        *,
        organizer:student_profiles!competitions_organizer_id_fkey(*)
      `)
      .gte("end_date", today)
      .order("start_date", { ascending: true })

    if (error) {
      console.error("[v0] Competitions GET error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ competitions: competitions || [] })
  } catch (error: any) {
    console.error("[v0] Competitions GET catch error:", error)
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
    const { title, description, start_date, end_date, banner_url } = body

    const { data: competition, error } = await supabase
      .from("competitions")
      .insert({
        title,
        description,
        start_date,
        end_date,
        banner_url,
        organizer_id: profile.id,
      })
      .select(`
        *,
        organizer:student_profiles!competitions_organizer_id_fkey(*)
      `)
      .single()

    if (error) {
      console.error("[v0] Competition creation error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ competition })
  } catch (error: any) {
    console.error("[v0] Competition POST catch error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
