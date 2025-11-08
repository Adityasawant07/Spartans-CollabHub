import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const { data: achievements, error } = await supabase
      .from("user_achievements")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false })

    if (error) {
      console.error("[v0] Achievements GET error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ achievements: achievements || [] })
  } catch (error: any) {
    console.error("[v0] Achievements GET catch error:", error)
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
    const { title, description, date, image_url } = body

    const { data: achievement, error } = await supabase
      .from("user_achievements")
      .insert({
        user_id: profile.id,
        title,
        description,
        date,
        image_url,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Achievement creation error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ achievement })
  } catch (error: any) {
    console.error("[v0] Achievements POST catch error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const achievementId = searchParams.get("id")

    if (!achievementId) {
      return NextResponse.json({ error: "Achievement ID is required" }, { status: 400 })
    }

    const { error } = await supabase.from("user_achievements").delete().eq("id", achievementId)

    if (error) {
      console.error("[v0] Achievement deletion error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Achievements DELETE catch error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
