import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { competitionId: string } }) {
  try {
    const supabase = await createServerClient()
    const { competitionId } = params

    const { data: competition, error } = await supabase
      .from("competitions")
      .select("*")
      .eq("id", competitionId)
      .single()

    if (error) {
      console.error("[v0] Competition GET error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!competition) {
      return NextResponse.json({ error: "Competition not found" }, { status: 404 })
    }

    return NextResponse.json(competition)
  } catch (error: any) {
    console.error("[v0] Competition GET catch error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { competitionId: string } }) {
  try {
    const supabase = await createServerClient()
    const { competitionId } = params

    const body = await request.json()

    // Update the competition with the provided data
    const { error } = await supabase.from("competitions").update(body).eq("id", competitionId)

    if (error) {
      console.error("[v0] Competition PUT error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Competition PUT catch error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { competitionId: string } }) {
  try {
    const supabase = await createServerClient()
    const { competitionId } = params

    // Delete the competition
    const { error } = await supabase.from("competitions").delete().eq("id", competitionId)

    if (error) {
      console.error("[v0] Competition DELETE error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Competition DELETE catch error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
