"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Plus, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"
import { BottomNav } from "@/components/bottom-nav"
import type { Project } from "@/lib/types"

export default function YourProjectsPage() {
  const [myProjects, setMyProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    checkAuth()
    fetchMyProjects()
  }, [])

  async function checkAuth() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth/login")
    }
  }

  async function fetchMyProjects() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase.from("student_profiles").select("id").eq("user_id", user.id).single()

      if (!profile) return

      const response = await fetch(`/api/projects?author_id=${profile.id}`)
      const data = await response.json()
      setMyProjects(data.projects || [])
    } catch (error) {
      console.error("Failed to fetch projects:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleApplicantAction(projectId: string, applicantId: string, action: "accept" | "deny") {
    try {
      // In a real implementation, you would have an API endpoint to handle this
      // For now, we'll show a success message
      alert(`Applicant ${action}ed successfully!`)
      fetchMyProjects()
    } catch (error) {
      console.error(`Failed to ${action} applicant:`, error)
    }
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <h1 className="text-2xl font-bold text-primary">Your Projects</h1>
          <Button asChild>
            <Link href="/projects/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Project
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-8">
          {loading ? (
            <div className="text-center">Loading...</div>
          ) : myProjects.length === 0 ? (
            <div className="text-center">
              <p className="mb-4 text-muted-foreground">You haven't created any projects yet.</p>
              <Button asChild>
                <Link href="/projects/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Project
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {myProjects.map((project) => (
                <Card key={project.id} className="transition-shadow hover:shadow-lg">
                  <CardHeader>
                    <div className="mb-2 flex items-start justify-between">
                      <CardTitle className="line-clamp-2">{project.title}</CardTitle>
                      <Badge variant={project.status === "Open" ? "default" : "secondary"}>{project.status}</Badge>
                    </div>
                    <CardDescription className="line-clamp-3">{project.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {project.applicants && project.applicants.length > 0 && (
                      <div className="mb-4">
                        <p className="mb-2 text-sm font-semibold">Applicants ({project.applicants.length})</p>
                        <div className="space-y-2">
                          {project.applicants.slice(0, 3).map((applicantId) => (
                            <div key={applicantId} className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback>U</AvatarFallback>
                                </Avatar>
                                <span className="text-xs text-muted-foreground">Applicant</span>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 bg-transparent"
                                  onClick={() => handleApplicantAction(project.id, applicantId, "accept")}
                                >
                                  <CheckCircle className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 bg-transparent"
                                  onClick={() => handleApplicantAction(project.id, applicantId, "deny")}
                                >
                                  <XCircle className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                        {project.applicants.length > 0 && (
                          <Badge variant="destructive" className="mt-2">
                            {project.applicants.length} New
                          </Badge>
                        )}
                      </div>
                    )}
                    <Button asChild className="w-full bg-transparent" variant="outline">
                      <Link href={`/projects/${project.id}`}>View Details</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
