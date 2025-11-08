"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sparkles, Loader2, Send, User, AlertCircle } from "lucide-react"
import Link from "next/link"
import { BottomNav } from "@/components/bottom-nav"

interface TeamRecommendation {
  id: string
  name: string
  college: string
  skills: string[]
  profile_picture_url?: string
  bio?: string
  matchingSkills: string[]
  complementarySkills: string[]
}

interface RecentTask {
  id: string
  title: string
  description: string
  tags: string[]
  category?: string
}

export default function TeamRecommendationsPage() {
  const [recommendations, setRecommendations] = useState<TeamRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [recentTask, setRecentTask] = useState<RecentTask | null>(null)
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth/login")
      return
    }
    await fetchRecommendations(user.id)
  }

  async function fetchRecommendations(userId: string) {
    try {
      const { data: userProfile } = await supabase.from("student_profiles").select("id").eq("user_id", userId).single()

      if (!userProfile) {
        setLoading(false)
        return
      }

      // Get the user's most recent task/project
      const { data: recentProjects } = await supabase
        .from("projects")
        .select("*")
        .eq("author_id", userProfile.id)
        .order("created_at", { ascending: false })
        .limit(1)

      const mostRecentTask = recentProjects?.[0]

      if (!mostRecentTask) {
        setLoading(false)
        return
      }

      setRecentTask({
        id: mostRecentTask.id,
        title: mostRecentTask.title,
        description: mostRecentTask.description,
        tags: mostRecentTask.tags || [],
        category: mostRecentTask.category,
      })

      const taskCategory = mostRecentTask.category
      const taskTags = mostRecentTask.tags || []

      const { data: profiles } = await supabase.from("student_profiles").select("*").neq("id", userProfile.id).limit(50)

      if (profiles && profiles.length > 0) {
        const matchedProfiles = profiles
          .map((profile) => {
            const theirSkills = profile.skills || []
            const matchingSkills = theirSkills.filter(
              (skill: string) =>
                taskTags.some((tag: string) => tag.toLowerCase() === skill.toLowerCase()) ||
                (taskCategory && skill.toLowerCase().includes(taskCategory.toLowerCase())),
            )
            const complementarySkills = theirSkills.filter((skill: string) => !matchingSkills.includes(skill))

            return {
              id: profile.id,
              name: profile.name,
              college: profile.college || "College not specified",
              skills: theirSkills,
              profile_picture_url: profile.profile_picture_url,
              bio: profile.bio,
              matchingSkills,
              complementarySkills,
              matchScore: matchingSkills.length,
            }
          })
          .filter((profile) => profile.matchScore > 0)
          .sort((a, b) => b.matchScore - a.matchScore)

        setRecommendations(matchedProfiles)
      } else {
        setRecommendations([])
      }
    } catch (error) {
      console.error("Failed to fetch recommendations:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-[#3B82F6]" />
            <div>
              <h1 className="text-xl font-bold text-primary">AI Team Recommendations</h1>
              <p className="text-xs text-muted-foreground">Based on your most recent task</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-16">
        <div className="container mx-auto px-4 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#3B82F6]" />
            </div>
          ) : !recentTask ? (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="font-semibold text-lg mb-2">No Tasks Created Yet</p>
                <p className="text-muted-foreground mb-2">
                  You need to create a task first to get AI-powered team recommendations.
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Create a task with a specific category to find teammates!
                </p>
                <Button asChild className="bg-[#3B82F6] hover:bg-[#2563EB]">
                  <Link href="/projects/create">Create Your First Task</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="mb-6 border-2 border-[#3B82F6]/20 bg-gradient-to-br from-[#3B82F6]/5 to-transparent">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-[#3B82F6]" />
                    Showing suggestions based on your most recent task:
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{recentTask.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{recentTask.description}</p>
                    </div>
                    {recentTask.tags.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Task Category:</p>
                        <div className="flex flex-wrap gap-1">
                          {recentTask.tags.map((tag) => (
                            <Badge key={tag} className="text-xs bg-[#3B82F6] hover:bg-[#2563EB]">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {recommendations.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Sparkles className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                    <p className="font-semibold text-lg mb-2">No suggestions found for this category</p>
                    <p className="text-muted-foreground mb-2">
                      We couldn't find any users with matching skills for your task category.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Try creating a new task with a different category or check back later!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <h2 className="text-lg font-semibold mb-4">Suggested Teammates</h2>
                  <div className="space-y-4">
                    {recommendations.map((rec) => (
                      <Card key={rec.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-16 w-16 flex-shrink-0 ring-2 ring-[#3B82F6]/20">
                              <AvatarImage src={rec.profile_picture_url || undefined} />
                              <AvatarFallback className="bg-[#3B82F6] text-white text-xl">
                                {rec.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="mb-2">
                                <h3 className="font-semibold text-lg">{rec.name}</h3>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {rec.college}
                                </p>
                              </div>
                              {rec.bio && <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{rec.bio}</p>}

                              {rec.matchingSkills.length > 0 && (
                                <div className="mb-2">
                                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Has:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {rec.matchingSkills.map((skill) => (
                                      <Badge key={skill} className="text-xs bg-[#3B82F6] hover:bg-[#2563EB]">
                                        {skill}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {rec.complementarySkills.length > 0 && (
                                <div className="mb-4">
                                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Brings:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {rec.complementarySkills.slice(0, 5).map((skill) => (
                                      <Badge key={skill} variant="secondary" className="text-xs">
                                        {skill}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="flex gap-2">
                                <Button asChild variant="outline" size="sm" className="flex-1 bg-transparent">
                                  <Link href={`/profile/${rec.id}`}>
                                    <User className="h-3 w-3 mr-2" />
                                    View Profile
                                  </Link>
                                </Button>
                                <Button asChild size="sm" className="flex-1 bg-[#3B82F6] hover:bg-[#2563EB]">
                                  <Link href={`/messages/${rec.id}`}>
                                    <Send className="h-3 w-3 mr-2" />
                                    Invite to Team
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
