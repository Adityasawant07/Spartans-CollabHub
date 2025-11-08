import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profiles, error } = await supabase.from("student_profiles").select("*").eq("user_id", user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    return NextResponse.json(profiles[0])
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    console.log("[v0] Profile PUT - Starting update")

    const supabase = await getSupabaseServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log("[v0] Profile PUT - Unauthorized")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Profile PUT - User authenticated:", user.id)

    const body = await request.json()
    console.log("[v0] Profile PUT - Request body:", JSON.stringify(body).substring(0, 200))

    const { id, user_id, email, created_at, updated_at, ...updateData } = body

    // Remove undefined/null values to avoid database issues
    const cleanedData = Object.fromEntries(Object.entries(updateData).filter(([_, v]) => v !== undefined && v !== null))

    console.log("[v0] Profile PUT - Cleaned update data:", JSON.stringify(cleanedData).substring(0, 200))

    const { data: profiles, error } = await supabase
      .from("student_profiles")
      .update(cleanedData)
      .eq("user_id", user.id)
      .select()

    if (error) {
      console.error("[v0] Profile PUT - Supabase error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!profiles || profiles.length === 0) {
      console.log("[v0] Profile PUT - No profiles updated")
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    console.log("[v0] Profile PUT - Successfully updated profile")
    return new NextResponse(JSON.stringify(profiles[0]), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error: any) {
    console.error("[v0] Profile PUT - Caught error:", error)
    return NextResponse.json({ error: error.message || "Failed to update profile" }, { status: 500 })
  }
}
