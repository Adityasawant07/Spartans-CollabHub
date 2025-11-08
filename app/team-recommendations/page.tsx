"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sparkles, Loader2, Users } from "lucide-react"
import Link from "next/link"
import { BottomNav } from "@/components/bottom-nav"

interface Recommendation {
  project: any
  matchScore: number
  matchedSkills: string[]
  reason: string
}

interface TeamMember {
  id: string
  name: string
  skills: string[]
  profile_picture_url?: string
  matchScore: number
  role: string
}

export default function TeamRecommendationsPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [generatingTeam, setGeneratingTeam] = useState(false)
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    checkAuth()
    fetchRecommendations()
  }, [])

  async function checkAuth() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth/login")
    }
  }

  async function fetchRecommendations() {
    try {
      const response = await fetch("/api/recommendations")
      if (response.ok) {
        const data = await response.json()
        setRecommendations(data.recommendations || [])
      }
    } catch (error) {
      console.error("Failed to fetch recommendations:", error)
    } finally {
      setLoading(false)
    }
  }

  async function generateTeamForProject(project: any) {
    setGeneratingTeam(true)
    setSelectedProject(project)

    try {
      const response = await fetch("/api/team-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id }),
      })

      if (response.ok) {
        const data = await response.json()
        setTeamMembers(data.teamMembers || [])
      }
    } catch (error) {
      console.error("Failed to generate team:", error)
    } finally {
      setGeneratingTeam(false)
    }
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-primary">AI Team Recommendations</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Discover projects that match your skills and get AI-powered team suggestions
          </p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-16">
        <div className="container mx-auto px-4 py-8">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : recommendations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Sparkles className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">No project recommendations available.</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Complete your profile with skills and interests to get personalized recommendations!
                </p>
                <Button asChild className="mt-4">
                  <Link href="/profile">Update Profile</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="rounded-lg bg-primary/10 p-4">
                <h2 className="font-semibold text-primary">Projects Matched to Your Skills</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  These projects align with your expertise. Click "Find Team" to get AI-powered teammate suggestions.
                </p>
              </div>

              {recommendations.map((rec) => (
                <Card key={rec.project.id} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="mb-2">{rec.project.title}</CardTitle>
                        <CardDescription>{rec.project.description}</CardDescription>
                      </div>
                      <Badge variant="secondary" className="ml-4 text-lg font-bold">
                        {rec.matchScore}% Match
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium">Why this matches you:</p>
                      <p className="mt-1 text-sm text-muted-foreground">{rec.reason}</p>
                    </div>

                    {rec.matchedSkills.length > 0 && (
                      <div>
                        <p className="mb-2 text-sm font-medium">Your matching skills:</p>
                        <div className="flex flex-wrap gap-2">
                          {rec.matchedSkills.map((skill) => (
                            <Badge key={skill} variant="outline">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button asChild variant="outline" className="flex-1 bg-transparent">
                        <Link href={`/projects/${rec.project.id}`}>View Project</Link>
                      </Button>
                      <Button onClick={() => generateTeamForProject(rec.project)} className="flex-1">
                        <Users className="mr-2 h-4 w-4" />
                        Find Team
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {generatingTeam && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <Card className="w-full max-w-md">
                <CardContent className="py-12 text-center">
                  <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
                  <p className="font-medium">Analyzing team compatibility...</p>
                  <p className="mt-2 text-sm text-muted-foreground">Finding the best teammates for you</p>
                </CardContent>
              </Card>
            </div>
          )}

          {teamMembers.length > 0 && selectedProject && (
            <Card className="mt-6 border-primary">
              <CardHeader>
                <CardTitle>Recommended Team for: {selectedProject.title}</CardTitle>
                <CardDescription>AI-suggested teammates based on complementary skills</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-muted"
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={member.profile_picture_url || "/placeholder.svg"} />
                        <AvatarFallback>{member.name?.charAt(0) || "?"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{member.name}</h3>
                          <Badge variant="secondary">{member.matchScore}% Match</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{member.role}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {member.skills.slice(0, 3).map((skill) => (
                            <Badge key={skill} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button asChild size="sm">
                        <Link href={`/profile/${member.id}`}>View Profile</Link>
                      </Button>
                    </div>
                  ))}
                </div>
                <Button asChild className="mt-4 w-full">
                  <Link href={`/projects/${selectedProject.id}`}>Apply to Project</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
