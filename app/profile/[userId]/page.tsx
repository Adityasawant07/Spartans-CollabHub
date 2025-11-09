"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Github, Linkedin, Globe, MessageCircle } from "lucide-react"
import Link from "next/link"
import type { StudentProfile, UserAchievement, UserProject } from "@/lib/types"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export default function PublicProfilePage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [achievements, setAchievements] = useState<UserAchievement[]>([])
  const [userProjects, setUserProjects] = useState<UserProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const params = useParams()
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    if (!params.userId) return

    fetchProfile()
    checkIfOwnProfile()
  }, [params.userId])

  async function checkIfOwnProfile() {
    try {
      const response = await fetch("/api/profile/me")
      if (response.ok) {
        const myProfile = await response.json()
        setIsOwnProfile(myProfile.id === params.userId)
      }
    } catch (error) {
      console.error("Failed to check profile ownership:", error)
    }
  }

  async function fetchProfile() {
    try {
      if (!params.userId || typeof params.userId !== "string") {
        setError("Invalid user ID")
        setLoading(false)
        return
      }

      const response = await fetch(`/api/profile/${params.userId}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch profile")
      }

      const data = await response.json()
      setProfile(data)

      const [achievementsRes, projectsRes] = await Promise.all([
        fetch(`/api/achievements?userId=${params.userId}`),
        fetch(`/api/user-projects?userId=${params.userId}`),
      ])

      if (achievementsRes.ok) {
        const achievementsData = await achievementsRes.json()
        setAchievements(achievementsData.achievements || [])
      }

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json()
        setUserProjects(projectsData.projects || [])
      }
    } catch (err: any) {
      console.error("Failed to fetch profile:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">{error || "Profile not found"}</p>
            <Button asChild className="mt-4 w-full bg-transparent" variant="outline">
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const mailtoLink = profile.email
    ? `mailto:${profile.email}?subject=${encodeURIComponent("Inquiry from CollabHub")}&body=${encodeURIComponent(
        `Hi ${profile.name},\n\nI saw your profile on CollabHub and would like to connect regarding...`,
      )}`
    : ""

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Button asChild variant="ghost">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Profile Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile.profile_picture_url || undefined} />
                  <AvatarFallback className="text-3xl">{profile.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="mb-2 text-3xl">{profile.name}</CardTitle>
                  <div className="mb-4 flex flex-wrap gap-2 text-sm text-muted-foreground">
                    {profile.college && <span>{profile.college}</span>}
                    {profile.branch && <span>• {profile.branch}</span>}
                    {profile.year && <span>• Year {profile.year}</span>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!isOwnProfile && (
                      <Button asChild>
                        <Link href={`/messages/${profile.id}`}>
                          <MessageCircle className="mr-2 h-4 w-4" />
                          Message
                        </Link>
                      </Button>
                    )}
                    {profile.github && (
                      <Button asChild size="icon" variant="outline">
                        <a href={profile.github} target="_blank" rel="noopener noreferrer">
                          <Github className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {profile.linkedin && (
                      <Button asChild size="icon" variant="outline">
                        <a href={profile.linkedin} target="_blank" rel="noopener noreferrer">
                          <Linkedin className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {profile.portfolio && (
                      <Button asChild size="icon" variant="outline">
                        <a href={profile.portfolio} target="_blank" rel="noopener noreferrer">
                          <Globe className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            {profile.bio && (
              <CardContent>
                <p className="text-muted-foreground">{profile.bio}</p>
              </CardContent>
            )}
          </Card>

          {/* Skills */}
          {profile.skills && profile.skills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, idx) => (
                    <Badge key={idx} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Interests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest, idx) => (
                    <Badge key={idx} variant="outline">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Past Projects */}
          {userProjects.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Past Projects</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {userProjects.map((project) => (
                  <div key={project.id} className="border-b pb-4 last:border-0 last:pb-0">
                    <h4 className="font-semibold">{project.title}</h4>
                    {project.date && (
                      <p className="text-sm text-muted-foreground">{new Date(project.date).toLocaleDateString()}</p>
                    )}
                    {project.description && <p className="mt-1 text-sm">{project.description}</p>}
                    {project.link && (
                      <Button asChild className="mt-2" size="sm" variant="link">
                        <a href={project.link} target="_blank" rel="noopener noreferrer">
                          View Project
                        </a>
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Achievements */}
          {achievements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Achievements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {achievements.map((achievement) => (
                  <div key={achievement.id} className="border-b pb-4 last:border-0 last:pb-0">
                    <h4 className="font-semibold">{achievement.title}</h4>
                    {achievement.date && (
                      <p className="text-sm text-muted-foreground">{new Date(achievement.date).toLocaleDateString()}</p>
                    )}
                    {achievement.description && <p className="mt-1 text-sm">{achievement.description}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
