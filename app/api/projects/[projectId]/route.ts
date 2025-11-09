import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function GET(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
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

    const { data: projects, error } = await supabase.from("projects").select("*").eq("id", projectId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!projects || projects.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const project = projects[0]

    if (project.applicants && Array.isArray(project.applicants) && project.applicants.length > 0) {
      const applicantIds = project.applicants.map((a: any) => a.user)

      const { data: applicantProfiles } = await supabase.from("student_profiles").select("*").in("id", applicantIds)

      if (applicantProfiles) {
        project.applicants = project.applicants.map((applicant: any) => ({
          ...applicant,
          profile: applicantProfiles.find((p) => p.id === applicant.user),
        }))
      }
    }

    return NextResponse.json(project)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
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

    const { data: profiles } = await supabase.from("student_profiles").select("id").eq("user_id", user.id)

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const profile = profiles[0]

    const { data: existingProjects } = await supabase.from("projects").select("author_id").eq("id", projectId)

    if (!existingProjects || existingProjects.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const existingProject = existingProjects[0]

    if (existingProject.author_id !== profile.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { id, author_id, created_at, ...updateData } = body

    const { data: updatedProjects, error } = await supabase
      .from("projects")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId)
      .select("*")

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!updatedProjects || updatedProjects.length === 0) {
      return NextResponse.json({ error: "Failed to update project" }, { status: 500 })
    }

    return NextResponse.json(updatedProjects[0])
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
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

    const { data: profiles } = await supabase.from("student_profiles").select("id").eq("user_id", user.id)

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const profile = profiles[0]

    const { data: existingProjects } = await supabase.from("projects").select("author_id").eq("id", projectId)

    if (!existingProjects || existingProjects.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const existingProject = existingProjects[0]

    if (existingProject.author_id !== profile.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { error } = await supabase.from("projects").delete().eq("id", projectId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: "Project deleted" })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
