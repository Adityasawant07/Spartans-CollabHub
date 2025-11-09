import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest, { params }: { params: { competitionId: string } }) {
  try {
    const supabase = await createServerClient()
    const { competitionId } = await Promise.resolve(params)

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user already upvoted
    const { data: existingUpvote } = await supabase
      .from("competition_upvotes")
      .select("id")
      .eq("competition_id", competitionId)
      .eq("user_id", user.id)
      .maybeSingle()

    if (existingUpvote) {
      console.log("[v0] User already upvoted this competition")
      return NextResponse.json({ error: "Already upvoted" }, { status: 400 })
    }

    // Add upvote
    const { error: upvoteError } = await supabase.from("competition_upvotes").insert({
      competition_id: competitionId,
      user_id: user.id,
    })

    if (upvoteError) {
      console.error("[v0] Upvote insert error:", upvoteError)
      if (upvoteError.code === "23505") {
        return NextResponse.json({ error: "Already upvoted" }, { status: 400 })
      }
      return NextResponse.json({ error: upvoteError.message }, { status: 500 })
    }

    // Increment upvotes count directly
    const { data: competition } = await supabase.from("competitions").select("upvotes").eq("id", competitionId).single()

    const currentUpvotes = competition?.upvotes || 0

    const { error: updateError } = await supabase
      .from("competitions")
      .update({ upvotes: currentUpvotes + 1 })
      .eq("id", competitionId)

    if (updateError) {
      console.error("[v0] Upvote increment error:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Upvote POST catch error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { competitionId: string } }) {
  try {
    const supabase = await createServerClient()
    const { competitionId } = await Promise.resolve(params)

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Remove upvote
    const { error: deleteError } = await supabase
      .from("competition_upvotes")
      .delete()
      .eq("competition_id", competitionId)
      .eq("user_id", user.id)

    if (deleteError) {
      console.error("[v0] Upvote delete error:", deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // Decrement upvotes count directly
    const { data: competition } = await supabase.from("competitions").select("upvotes").eq("id", competitionId).single()

    const currentUpvotes = competition?.upvotes || 0

    const { error: updateError } = await supabase
      .from("competitions")
      .update({ upvotes: Math.max(0, currentUpvotes - 1) })
      .eq("id", competitionId)

    if (updateError) {
      console.error("[v0] Upvote decrement error:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Upvote DELETE catch error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
