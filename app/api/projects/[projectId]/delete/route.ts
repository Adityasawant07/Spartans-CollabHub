import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function DELETE(request: Request, { params }: { params: { projectId: string } }) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("student_profiles").select("id").eq("user_id", user.id).single()

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const { projectId } = params

    // Verify the user is the author of the project
    const { data: projectData } = await supabase.from("projects").select("author_id").eq("id", projectId)

    if (!projectData || projectData.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const project = projectData[0]

    if (project.author_id !== profile.id) {
      return NextResponse.json({ error: "You can only delete your own projects" }, { status: 403 })
    }

    // Delete the project
    const { error: deleteError } = await supabase.from("projects").delete().eq("id", projectId)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Project deleted successfully" })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
