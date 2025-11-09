import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createServerClient()

    const today = new Date().toISOString().split("T")[0]

    const { data: competitions, error } = await supabase
      .from("competitions")
      .select("*")
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

    const body = await request.json()
    const { title, description, start_date, end_date, organizer_id } = body

    if (!title || !description || !start_date || !end_date || !organizer_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const competitionData: any = {
      title,
      description,
      start_date,
      end_date,
      organizer_id, // Use the organizer_id from the request
    }

    // Add optional fields only if provided
    if (body.end_session) competitionData.end_session = body.end_session
    if (body.timing) competitionData.timing = body.timing
    if (body.contact_number) competitionData.contact_number = body.contact_number
    if (body.email) competitionData.email = body.email
    if (body.banner_url) competitionData.banner_url = body.banner_url
    if (body.info_file_url) competitionData.info_file_url = body.info_file_url

    const { data: competition, error } = await supabase
      .from("competitions")
      .insert(competitionData)
      .select("*")
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
