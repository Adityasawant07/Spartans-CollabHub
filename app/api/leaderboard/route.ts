import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createServerClient()

    const { data: profiles, error: profilesError } = await supabase.from("student_profiles").select("*")

    if (profilesError) throw profilesError

    const leaderboardData = profiles.map((profile) => {
      // Calculate points from achievements (10 points each)
      const achievementsCount = Array.isArray(profile.achievements) ? profile.achievements.length : 0

      // Calculate points from past projects (20 points each)
      const projectsCount = Array.isArray(profile.past_projects) ? profile.past_projects.length : 0

      // Calculate points from skills (5 points each)
      const skillsCount = Array.isArray(profile.skills) ? profile.skills.length : 0

      const totalPoints = achievementsCount * 10 + projectsCount * 20 + skillsCount * 5

      return {
        profile,
        skill_points: totalPoints,
        badges: [], // Empty for now until badges system is implemented
      }
    })

    const sortedLeaderboard = leaderboardData
      .sort((a, b) => b.skill_points - a.skill_points)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }))
      .slice(0, 50) // Limit to top 50

    return NextResponse.json({ leaderboard: sortedLeaderboard })
  } catch (error: any) {
    console.error("Leaderboard error:", error.message)
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 })
  }
}
