import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const supabase = await getSupabaseServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("student_profiles").select("id").eq("user_id", user.id).single()

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const tags = searchParams.get("tags")?.split(",").filter(Boolean) || []
    const skills = searchParams.get("skills")?.split(",").filter(Boolean) || []
    const authorId = searchParams.get("author_id")

    let query = supabase.from("projects").select(
      `
        *,
        author:student_profiles!projects_author_id_fkey(*)
      `,
      { count: "exact" },
    )

    if (authorId) {
      query = query.eq("author_id", authorId)
    } else if (profile) {
      // For dashboard view: exclude tasks created by current user
      query = query.neq("author_id", profile.id)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    if (status) {
      query = query.eq("status", status)
    }

    if (tags.length > 0) {
      query = query.contains("tags", tags)
    }

    if (skills.length > 0) {
      query = query.contains("required_skills", skills)
    }

    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.order("created_at", { ascending: false }).range(from, to)

    const { data: projects, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      projects,
      total: count,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseServerClient()

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
    const { title, description, tags, required_skills, attachments, category } = body

    if (!title || !description) {
      return NextResponse.json({ error: "Title and description are required" }, { status: 400 })
    }

    const { data: project, error } = await supabase
      .from("projects")
      .insert({
        title,
        description,
        tags: tags || [],
        required_skills: required_skills || [],
        author_id: profile.id,
        attachments: attachments || [],
        status: "Open",
      })
      .select(`
        *,
        author:student_profiles!projects_author_id_fkey(*)
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(project, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
