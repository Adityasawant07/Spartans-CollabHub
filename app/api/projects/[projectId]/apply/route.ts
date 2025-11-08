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
      return NextResponse.json({ error: "Unauthorized. Please log in to apply." }, { status: 401 })
    }

    const { data: profiles, error: profileError } = await supabase
      .from("student_profiles")
      .select("id")
      .eq("user_id", user.id)

    if (profileError) {
      return NextResponse.json({ error: `Failed to fetch profile: ${profileError.message}` }, { status: 500 })
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json(
        { error: "Profile not found. Please complete your profile setup before applying." },
        { status: 404 },
      )
    }

    const profile = profiles[0]

    const body = await request.json()
    const { message } = body

    const { data: projects, error: fetchError } = await supabase
      .from("projects")
      .select("applicants, author_id")
      .eq("id", projectId)

    if (fetchError) {
      return NextResponse.json({ error: `Failed to fetch project: ${fetchError.message}` }, { status: 500 })
    }

    if (!projects || projects.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const project = projects[0]

    const applicants = (project.applicants as any[]) || []

    const alreadyApplied = applicants.some((a: any) => a.user === profile.id)

    if (alreadyApplied) {
      return NextResponse.json({ error: "You have already applied to this project" }, { status: 400 })
    }

    if (project.author_id === profile.id) {
      return NextResponse.json({ error: "You cannot apply to your own project" }, { status: 400 })
    }

    const newApplicant = {
      user: profile.id,
      message: message || "",
      status: "Pending",
      appliedAt: new Date().toISOString(),
    }

    const { data: updatedProjects, error: updateError } = await supabase
      .from("projects")
      .update({
        applicants: [...applicants, newApplicant],
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId)
      .select()

    if (updateError) {
      return NextResponse.json({ error: `Failed to update project: ${updateError.message}` }, { status: 500 })
    }

    if (!updatedProjects || updatedProjects.length === 0) {
      return NextResponse.json(
        { error: "Failed to update project. This may be due to permissions. Please try again." },
        { status: 500 },
      )
    }

    const { data: fullProject } = await supabase
      .from("projects")
      .select(`
        *,
        author:student_profiles!projects_author_id_fkey(*)
      `)
      .eq("id", projectId)
      .single()

    if (fullProject && fullProject.applicants && Array.isArray(fullProject.applicants)) {
      const applicantIds = fullProject.applicants.map((a: any) => a.user)

      const { data: applicantProfiles } = await supabase.from("student_profiles").select("*").in("id", applicantIds)

      if (applicantProfiles) {
        fullProject.applicants = fullProject.applicants.map((applicant: any) => ({
          ...applicant,
          profile: applicantProfiles.find((p) => p.id === applicant.user),
        }))
      }
    }

    return NextResponse.json(fullProject || updatedProjects[0])
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
