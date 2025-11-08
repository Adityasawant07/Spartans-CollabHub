import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase.from("student_profiles").select("*").eq("user_id", user.id).single()

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // Get all open projects (excluding user's own projects)
    const { data: projects, error } = await supabase
      .from("projects")
      .select(`
        *,
        author:student_profiles!projects_author_id_fkey(*)
      `)
      .eq("status", "Open")
      .neq("author_id", profile.id)

    if (error) {
      console.error("[v0] Recommendations error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!projects || projects.length === 0) {
      return NextResponse.json({ recommendations: [] })
    }

    // Calculate match scores based on skills overlap
    const userSkills = profile.skills || []
    const userInterests = profile.interests || []
    const userBranch = profile.branch || ""

    const recommendations = projects
      .map((project) => {
        const requiredSkills = project.required_skills || []
        const projectTags = project.tags || []

        // Calculate skill matches
        const matchedSkills = requiredSkills.filter((skill: string) =>
          userSkills.some(
            (userSkill: string) =>
              userSkill.toLowerCase().includes(skill.toLowerCase()) ||
              skill.toLowerCase().includes(userSkill.toLowerCase()),
          ),
        )

        // Calculate interest matches
        const matchedInterests = projectTags.filter((tag: string) =>
          userInterests.some(
            (interest: string) =>
              interest.toLowerCase().includes(tag.toLowerCase()) || tag.toLowerCase().includes(interest.toLowerCase()),
          ),
        )

        // Calculate match score (0-100)
        let matchScore = 0

        // Skill matches are weighted heavily (60% of score)
        if (requiredSkills.length > 0) {
          matchScore += (matchedSkills.length / requiredSkills.length) * 60
        }

        // Interest matches contribute (30% of score)
        if (projectTags.length > 0) {
          matchScore += (matchedInterests.length / projectTags.length) * 30
        }

        // Branch match bonus (10% of score)
        if (project.author?.branch === userBranch && userBranch) {
          matchScore += 10
        }

        // Generate recommendation reason
        let reason = ""
        if (matchedSkills.length > 0) {
          reason = `Your skills in ${matchedSkills.slice(0, 3).join(", ")} match this project's requirements.`
        } else if (matchedInterests.length > 0) {
          reason = `This project aligns with your interests in ${matchedInterests.slice(0, 2).join(" and ")}.`
        } else {
          reason = "This project might be a good learning opportunity for you."
        }

        return {
          project,
          matchScore: Math.round(matchScore),
          matchedSkills,
          reason,
        }
      })
      .filter((rec) => rec.matchScore > 20) // Only show recommendations with >20% match
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 3) // Return top 3

    return NextResponse.json({ recommendations })
  } catch (error: any) {
    console.error("[v0] Recommendations catch error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
