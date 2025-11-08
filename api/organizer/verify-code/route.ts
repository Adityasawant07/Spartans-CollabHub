import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get("code")

    if (!code) {
      return NextResponse.json({ error: "Institute code is required" }, { status: 400 })
    }

    const supabase = await createServerClient()

    // Check if institute code exists
    const { data, error } = await supabase
      .from("institute_ids")
      .select("*")
      .eq("institute_code", code.toUpperCase())
      .single()

    if (error || !data) {
      return NextResponse.json({ error: "Invalid institute code" }, { status: 404 })
    }

    return NextResponse.json({ valid: true, institute: data })
  } catch (error) {
    console.error("Institute code verification error:", error)
    return NextResponse.json({ error: "Verification failed" }, { status: 500 })
  }
}
