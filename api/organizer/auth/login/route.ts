import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { email, password, instituteCode } = await request.json()

    if (!email || !password || !instituteCode) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    // Verify organizer credentials
    const { data: organizer, error } = await supabase
      .from("organizers")
      .select("*")
      .eq("email", email)
      .eq("institute_code", instituteCode)
      .single()

    if (error || !organizer) {
      return NextResponse.json({ error: "Invalid credentials or institute code" }, { status: 401 })
    }

    // In production, you should hash passwords using bcrypt or similar
    // For now, we'll do a simple comparison (NOT SECURE FOR PRODUCTION)
    if (organizer.password_hash !== password) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 })
    }

    // Return organizer data (excluding password)
    const { password_hash, ...organizerData } = organizer

    return NextResponse.json({ organizer: organizerData })
  } catch (error: any) {
    console.error("[v0] Organizer login error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
