import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest, { params }: { params: { competitionId: string } }) {
  try {
    const supabase = await createServerClient()
    const { competitionId } = params

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
      .single()

    if (existingUpvote) {
      return NextResponse.json({ error: "Already upvoted" }, { status: 400 })
    }

    // Add upvote
    const { error: upvoteError } = await supabase.from("competition_upvotes").insert({
      competition_id: competitionId,
      user_id: user.id,
    })

    if (upvoteError) {
      console.error("[v0] Upvote insert error:", upvoteError)
      return NextResponse.json({ error: upvoteError.message }, { status: 500 })
    }

    // Increment upvotes count
    const { error: updateError } = await supabase.rpc("increment_competition_upvotes", {
      competition_id: competitionId,
    })

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
    const { competitionId } = params

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

    // Decrement upvotes count
    const { error: updateError } = await supabase.rpc("decrement_competition_upvotes", {
      competition_id: competitionId,
    })

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
