"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, MessageCircle, Check, X, Trash2 } from "lucide-react"
import Link from "next/link"
import { BottomNav } from "@/components/bottom-nav"
import type { Project } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

function getDifficultyBadge(difficulty: string) {
  switch (difficulty) {
    case "easy":
      return { text: "🟢 Easy", className: "bg-green-100 text-green-800" }
    case "medium":
      return { text: "🟡 Medium", className: "bg-yellow-100 text-yellow-800" }
    case "hard":
      return { text: "🔴 Hard", className: "bg-red-100 text-red-800" }
    default:
      return { text: difficulty, className: "bg-gray-100 text-gray-800" }
  }
}

function getProjectMetadata(project: Project) {
  if (project.attachments && Array.isArray(project.attachments)) {
    const metadata = project.attachments.find((att: any) => att.type === "metadata")
    return metadata || {}
  }
  return {}
}

export default function YourProjectsPage() {
  const [myProjects, setMyProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [processingApplicant, setProcessingApplicant] = useState<string | null>(null)
  const [deletingProject, setDeletingProject] = useState<string | null>(null)
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()
  const { toast } = useToast()

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

  async function handleAccept(projectId: string, applicantId: string) {
    setProcessingApplicant(applicantId)
    try {
      const response = await fetch(`/api/projects/${projectId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicant_id: applicantId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to accept applicant")
      }

      toast({
        title: "Success",
        description: data.team_full ? "Applicant accepted! Your team is now full." : "Applicant accepted successfully!",
      })

      fetchMyProjects()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setProcessingApplicant(null)
    }
  }

  async function handleDecline(projectId: string, applicantId: string) {
    setProcessingApplicant(applicantId)
    try {
      const response = await fetch(`/api/projects/${projectId}/decline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicant_id: applicantId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to decline applicant")
      }

      toast({
        title: "Success",
        description: "Applicant declined.",
      })

      fetchMyProjects()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setProcessingApplicant(null)
    }
  }

  async function handleDelete(projectId: string) {
    if (!confirm("Are you sure you want to delete this task? This action cannot be undone.")) {
      return
    }

    setDeletingProject(projectId)
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete task")
      }

      toast({
        title: "Success",
        description: "Task deleted successfully.",
      })

      fetchMyProjects()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setDeletingProject(null)
    }
  }

  return (
    <div className="flex h-screen flex-col bg-gradient-to-br from-orange-50 via-yellow-50 to-pink-50">
      <header className="flex items-center justify-between border-b bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 px-4 py-4 shadow-lg">
        <h1 className="text-2xl font-bold text-white">Task Manager</h1>
        <Button
          asChild
          size="sm"
          className="bg-white text-orange-500 hover:bg-orange-50 font-semibold rounded-full shadow-md"
        >
          <Link href="/projects/create">
            <Plus className="mr-2 h-4 w-4" />
            Create New Task
          </Link>
        </Button>
      </header>

      <main className="flex-1 overflow-y-auto pb-20">
        <div className="container mx-auto px-4 py-6">
          {loading ? (
            <div className="text-center text-muted-foreground">Loading your tasks...</div>
          ) : myProjects.length === 0 ? (
            <div className="py-16 text-center">
              <p className="mb-4 text-muted-foreground">You haven't created any tasks yet.</p>
              <Button
                asChild
                className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 rounded-full shadow-lg"
              >
                <Link href="/projects/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Task
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {myProjects.map((project) => {
                const metadata = getProjectMetadata(project) as any
                const difficulty = metadata?.difficulty || "medium"
                const teamSize = metadata?.team_size || 0
                const difficultyBadge = getDifficultyBadge(difficulty)
                const pendingApplicants =
                  (project.applicants as any[])?.filter((a: any) => a.status === "Pending") || []
                const acceptedApplicants =
                  (project.applicants as any[])?.filter((a: any) => a.status === "Accepted") || []
                const acceptedCount = acceptedApplicants.length
                const isTeamFull = teamSize > 0 && acceptedCount >= teamSize
                const totalApplications = (project.applicants as any[])?.length || 0

                return (
                  <Card
                    key={project.id}
                    className="bg-white/90 backdrop-blur-sm border-2 border-orange-100 rounded-2xl shadow-lg"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <CardTitle className="line-clamp-1 text-xl">{project.title}</CardTitle>
                          <CardDescription className="line-clamp-2 mt-2">{project.description}</CardDescription>
                          {totalApplications > 0 && (
                            <p className="text-sm font-semibold text-orange-600 mt-2">
                              {totalApplications} {totalApplications === 1 ? "Application" : "Applications"}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <Badge className={difficultyBadge.className}>{difficultyBadge.text}</Badge>
                          <Badge className={!isTeamFull ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                            {!isTeamFull ? "Active" : "Team Full"}
                          </Badge>
                        </div>
                      </div>
                      {teamSize > 0 && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Team: {acceptedCount}/{teamSize} members
                        </p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <h3 className="mb-3 text-sm font-semibold text-orange-600">
                          Pending Applicants ({pendingApplicants.length})
                        </h3>
                        {pendingApplicants.length > 0 ? (
                          <div className="space-y-3">
                            {pendingApplicants.map((applicant: any) => (
                              <div
                                key={applicant.user}
                                className="flex items-center gap-3 rounded-xl border-2 border-orange-100 p-3 bg-white/50"
                              >
                                <Avatar className="h-12 w-12 border-2 border-orange-200">
                                  <AvatarImage src={applicant.profile?.profile_picture_url || undefined} />
                                  <AvatarFallback className="bg-gradient-to-r from-orange-500 to-pink-500 text-white">
                                    {applicant.profile?.name?.charAt(0).toUpperCase() || "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <p className="font-medium">{applicant.profile?.name || "Applicant"}</p>
                                  {applicant.profile?.skills && applicant.profile.skills.length > 0 && (
                                    <div className="mt-1 flex flex-wrap gap-1">
                                      {applicant.profile.skills.slice(0, 3).map((skill: string, skillIdx: number) => (
                                        <Badge
                                          key={skillIdx}
                                          variant="secondary"
                                          className="text-xs bg-orange-100 text-orange-700"
                                        >
                                          {skill}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-full shadow-md"
                                    onClick={() => handleAccept(project.id, applicant.user)}
                                    disabled={processingApplicant === applicant.user || isTeamFull}
                                  >
                                    <Check className="h-4 w-4 mr-1" />
                                    Accept
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-full shadow-md"
                                    onClick={() => handleDecline(project.id, applicant.user)}
                                    disabled={processingApplicant === applicant.user}
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Decline
                                  </Button>
                                  <Button
                                    asChild
                                    size="sm"
                                    variant="outline"
                                    className="rounded-full border-2 border-purple-200 hover:bg-purple-50 bg-transparent"
                                  >
                                    <Link href={`/messages/${applicant.user}`}>
                                      <MessageCircle className="h-4 w-4" />
                                    </Link>
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="py-4 text-center text-sm text-muted-foreground">No pending applicants</p>
                        )}
                      </div>

                      {acceptedApplicants.length > 0 && (
                        <div className="mb-4">
                          <h3 className="mb-3 text-sm font-semibold text-green-600">
                            Accepted Members ({acceptedApplicants.length})
                          </h3>
                          <div className="space-y-2">
                            {acceptedApplicants.map((applicant: any) => (
                              <div
                                key={applicant.user}
                                className="flex items-center gap-3 rounded-xl border-2 border-green-100 p-2 bg-green-50/50"
                              >
                                <Avatar className="h-10 w-10 border-2 border-green-200">
                                  <AvatarImage src={applicant.profile?.profile_picture_url || undefined} />
                                  <AvatarFallback className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs">
                                    {applicant.profile?.name?.charAt(0).toUpperCase() || "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{applicant.profile?.name || "Member"}</p>
                                </div>
                                <Badge className="bg-green-100 text-green-800 rounded-full">Accepted</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          asChild
                          variant="outline"
                          className="flex-1 bg-transparent border-2 border-purple-200 hover:bg-purple-50 rounded-full"
                        >
                          <Link href={`/projects/${project.id}`}>View Full Details</Link>
                        </Button>
                        <Button
                          className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-full shadow-md"
                          onClick={() => handleDelete(project.id)}
                          disabled={deletingProject === project.id}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
