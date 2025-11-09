import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const { data: organizer, error } = await supabase
      .from("organizers")
      .select("*")
      .eq("email", email)
      .eq("password_hash", password) // Compare password directly with password_hash field
      .single()

    if (error || !organizer) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    const { password_hash, ...organizerData } = organizer

    return NextResponse.json({
      organizer: {
        organizer_id: organizerData.id,
        institute_id: organizerData.institute_code || organizerData.institute_id,
        institute_name: organizerData.institute_name,
        ...organizerData,
      },
    })
  } catch (error: any) {
    console.error("[v0] Organizer login error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
