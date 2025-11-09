"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Inbox, Plus, Trophy, Users } from "lucide-react"
import Link from "next/link"
import { BottomNav } from "@/components/bottom-nav"
import type { Project, Competition } from "@/lib/types"

function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case "easy":
      return "text-green-500"
    case "medium":
      return "text-yellow-500"
    case "hard":
      return "text-red-500"
    default:
      return "text-gray-500"
  }
}

function getProjectMetadata(project: Project) {
  if (project.attachments && Array.isArray(project.attachments)) {
    const metadata = project.attachments.find((att: any) => att.type === "metadata")
    return metadata || {}
  }
  return {}
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    checkAuth()
    fetchProjects()
    fetchCompetitions()
  }, [])

  async function checkAuth() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth/login")
      return
    }
  }

  async function fetchProjects() {
    try {
      const response = await fetch("/api/projects")
      const data = await response.json()
      setProjects((data.projects || []).slice(0, 3))
    } catch (error) {
      console.error("Failed to fetch projects:", error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchCompetitions() {
    try {
      const response = await fetch("/api/competitions")
      if (response.ok) {
        const data = await response.json()
        setCompetitions((data.competitions || []).slice(0, 3))
      }
    } catch (error) {
      console.error("Failed to fetch competitions:", error)
    }
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-pink-50 pb-20">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 px-4 py-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg overflow-hidden bg-white shadow-md">
            <img src="/logo.png" alt="CollabHub" className="h-full w-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold text-white">CollabHub</h1>
        </div>
        <Button asChild size="icon" variant="ghost" className="text-white hover:bg-white/20 rounded-full">
          <Link href="/messages">
            <Inbox className="h-5 w-5" />
          </Link>
        </Button>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-6 w-6 text-orange-500" />
              <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
                Events
              </h2>
            </div>
            {competitions.length === 0 ? (
              <Card className="p-6 text-center bg-white/80 backdrop-blur-sm border-2 border-orange-200 rounded-2xl shadow-md">
                <p className="text-sm text-muted-foreground">No events at the moment</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {competitions.map((comp) => (
                  <Card
                    key={comp.id}
                    className="transition-all duration-200 hover:shadow-2xl hover:scale-[1.02] cursor-pointer bg-white/90 backdrop-blur-sm border-2 border-orange-100 rounded-2xl overflow-hidden"
                    onClick={() => router.push(`/competitions/${comp.id}`)}
                  >
                    {comp.banner_url && (
                      <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-muted">
                        <img
                          src={comp.banner_url || "/placeholder.svg"}
                          alt={comp.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader className="pb-3">
                      <CardTitle className="line-clamp-1 text-lg">{comp.title}</CardTitle>
                      <CardDescription className="line-clamp-2 text-sm">{comp.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {comp.tags && comp.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {comp.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                <Users className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                Team Task / Request
              </h2>
            </div>
            {loading ? (
              <Card className="p-6 text-center bg-white/80 backdrop-blur-sm border-2 border-purple-200 rounded-2xl shadow-md">
                <p className="text-sm text-muted-foreground">Loading...</p>
              </Card>
            ) : projects.length === 0 ? (
              <Card className="p-6 text-center bg-white/80 backdrop-blur-sm border-2 border-purple-200 rounded-2xl shadow-md">
                <p className="text-sm text-muted-foreground">No team tasks yet</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {projects.map((project) => {
                  const metadata = getProjectMetadata(project)
                  const difficulty = metadata.difficulty
                  const teamSize = metadata.team_size
                  const acceptedCount =
                    (project.applicants as any[])?.filter((a: any) => a.status === "Accepted")?.length || 0
                  const applicationCount = (project.applicants as any[])?.length || 0

                  return (
                    <Card
                      key={project.id}
                      className="transition-all duration-200 hover:shadow-2xl hover:scale-[1.02] cursor-pointer bg-white/90 backdrop-blur-sm border-2 border-purple-100 rounded-2xl overflow-hidden"
                      onClick={() => router.push(`/projects/${project.id}`)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="line-clamp-1 text-lg flex-1">{project.title}</CardTitle>
                          {difficulty && <span className={`text-xl ${getDifficultyColor(difficulty)}`}>●</span>}
                        </div>
                        <CardDescription className="line-clamp-2 text-sm">{project.description}</CardDescription>
                        {applicationCount > 0 && (
                          <p className="text-xs font-medium text-orange-600 mt-1">
                            {applicationCount} {applicationCount === 1 ? "Application" : "Applications"}
                          </p>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {project.author && (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={project.author.profile_picture_url || undefined} />
                              <AvatarFallback className="bg-[#3B82F6] text-white text-xs">
                                {project.author.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">{project.author.name}</p>
                              {project.author.college && (
                                <p className="text-xs text-muted-foreground truncate">{project.author.college}</p>
                              )}
                            </div>
                          </div>
                        )}

                        {(teamSize || difficulty) && (
                          <div className="flex items-center gap-3 text-sm">
                            {teamSize && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Users className="h-4 w-4" />
                                <span>
                                  {acceptedCount} / {teamSize} members
                                </span>
                              </div>
                            )}
                            {difficulty && (
                              <Badge variant="outline" className="text-xs capitalize">
                                {difficulty}
                              </Badge>
                            )}
                          </div>
                        )}

                        {project.required_skills && project.required_skills.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {project.required_skills.slice(0, 3).map((skill, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <Button
                          size="sm"
                          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full shadow-md"
                        >
                          Open
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      <Button
        asChild
        size="lg"
        className="fixed bottom-24 right-6 z-50 h-16 w-16 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 shadow-2xl hover:shadow-3xl transition-all duration-200"
      >
        <Link href="/projects/create">
          <Plus className="h-8 w-8" />
        </Link>
      </Button>

      <BottomNav />
    </div>
  )
}
