import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function POST(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const supabase = await getSupabaseServerClient()
    const { projectId } = await params

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

    const body = await request.json()
    const { applicant_id } = body

    if (!applicant_id) {
      return NextResponse.json({ error: "Applicant ID is required" }, { status: 400 })
    }

    // Fetch the project
    const { data: project, error: fetchError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single()

    if (fetchError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Verify the user is the author
    if (project.author_id !== profile.id) {
      return NextResponse.json({ error: "Only the task creator can accept applicants" }, { status: 403 })
    }

    const applicants = (project.applicants as any[]) || []
    const updatedApplicants = applicants.map((applicant: any) => {
      if (applicant.user === applicant_id) {
        return { ...applicant, status: "Accepted" }
      }
      return applicant
    })

    const acceptedCount = updatedApplicants.filter((a: any) => a.status === "Accepted").length

    const metadata = (project.attachments as any[])?.find((att: any) => att.type === "metadata") || {}
    const teamSize = metadata.team_size || 0

    const isTeamFull = teamSize > 0 && acceptedCount >= teamSize

    // Update the project
    const { data: updatedProject, error: updateError } = await supabase
      .from("projects")
      .update({
        applicants: updatedApplicants,
        status: isTeamFull ? "Closed" : project.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      project: updatedProject,
      team_full: isTeamFull,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
