import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function GET(request: Request, { params }: { params: { userId: string } }) {
  try {
    const supabase = await getSupabaseServerClient()
    const { userId } = await params

    console.log("[v0] Profile GET - userId param:", userId)

    if (userId === "me") {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        console.log("[v0] Profile GET - Authentication failed:", authError?.message)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      console.log("[v0] Profile GET - Fetching profile for authenticated user:", user.id)
      const { data: profiles, error } = await supabase.from("student_profiles").select("*").eq("user_id", user.id)

      if (error) {
        console.log("[v0] Profile GET - Database error:", error.message)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      if (!profiles || profiles.length === 0) {
        console.log("[v0] Profile GET - Profile not found for user:", user.id)
        return NextResponse.json({ error: "Profile not found. Please complete your profile setup." }, { status: 404 })
      }

      console.log("[v0] Profile GET - Successfully fetched profile:", profiles[0].id)
      return NextResponse.json(profiles[0])
    }

    console.log("[v0] Profile GET - Fetching public profile by ID:", userId)
    const { data: profiles, error } = await supabase.from("student_profiles").select("*").eq("id", userId)

    if (error) {
      console.log("[v0] Profile GET - Database error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!profiles || profiles.length === 0) {
      console.log("[v0] Profile GET - Profile not found for ID:", userId)
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    console.log("[v0] Profile GET - Successfully fetched profile:", profiles[0].id)
    return NextResponse.json(profiles[0])
  } catch (error: any) {
    console.log("[v0] Profile GET - Unexpected error:", error.message)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
