import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { projectId } = await request.json()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get current user profile
    const { data: currentProfile } = await supabase.from("student_profiles").select("*").eq("user_id", user.id).single()

    if (!currentProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // Get project details
    const { data: project } = await supabase.from("projects").select("*").eq("id", projectId).single()

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Get all users except current user
    const { data: allProfiles } = await supabase
      .from("student_profiles")
      .select("*")
      .neq("id", currentProfile.id)
      .limit(50)

    if (!allProfiles || allProfiles.length === 0) {
      return NextResponse.json({ teamMembers: [] })
    }

    const currentUserSkills = currentProfile.skills || []
    const requiredSkills = project.required_skills || []

    // Calculate complementary scores for each potential team member
    const teamSuggestions = allProfiles
      .map((profile) => {
        const candidateSkills = profile.skills || []

        // Find skills the candidate has that current user doesn't
        const complementarySkills = candidateSkills.filter(
          (skill: string) =>
            !currentUserSkills.some((userSkill: string) => userSkill.toLowerCase() === skill.toLowerCase()),
        )

        // Check if candidate has required skills
        const hasRequiredSkills = requiredSkills.filter((reqSkill: string) =>
          candidateSkills.some((candSkill: string) => candSkill.toLowerCase().includes(reqSkill.toLowerCase())),
        )

        // Calculate match score
        let matchScore = 0

        // Complementary skills (40%)
        if (complementarySkills.length > 0) {
          matchScore += Math.min((complementarySkills.length / 5) * 40, 40)
        }

        // Required skills coverage (40%)
        if (requiredSkills.length > 0) {
          matchScore += (hasRequiredSkills.length / requiredSkills.length) * 40
        }

        // Skill diversity bonus (20%)
        if (candidateSkills.length >= 3) {
          matchScore += 20
        }

        // Determine suggested role based on skills
        let role = "Team Member"
        const skillsLower = candidateSkills.map((s: string) => s.toLowerCase())

        if (skillsLower.some((s: string) => s.includes("design") || s.includes("ui"))) {
          role = "Designer"
        } else if (
          skillsLower.some((s: string) => s.includes("backend") || s.includes("api") || s.includes("database"))
        ) {
          role = "Backend Developer"
        } else if (
          skillsLower.some((s: string) => s.includes("frontend") || s.includes("react") || s.includes("vue"))
        ) {
          role = "Frontend Developer"
        } else if (skillsLower.some((s: string) => s.includes("research") || s.includes("data"))) {
          role = "Researcher"
        } else if (skillsLower.some((s: string) => s.includes("manage") || s.includes("lead"))) {
          role = "Project Manager"
        }

        return {
          id: profile.id,
          name: profile.name,
          skills: candidateSkills,
          profile_picture_url: profile.profile_picture_url,
          matchScore: Math.round(matchScore),
          role,
          complementarySkills,
        }
      })
      .filter((suggestion) => suggestion.matchScore > 30) // Only show decent matches
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5) // Top 5 suggestions

    return NextResponse.json({ teamMembers: teamSuggestions })
  } catch (error: any) {
    console.error("[v0] Team suggestions error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
