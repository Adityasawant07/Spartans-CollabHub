"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { BottomNav } from "@/components/bottom-nav"
import type { Project } from "@/lib/types"

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

function getStatusBadge(status: string) {
  switch (status) {
    case "Accepted":
      return { text: "Accepted", className: "bg-green-100 text-green-800" }
    case "Rejected":
      return { text: "Declined", className: "bg-red-100 text-red-800" }
    case "Pending":
    default:
      return { text: "Pending", className: "bg-yellow-100 text-yellow-800" }
  }
}

export default function AppliedTasksPage() {
  const [appliedTasks, setAppliedTasks] = useState<(Project & { myApplication?: any })[]>([])
  const [loading, setLoading] = useState(true)
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    checkAuth()
    fetchAppliedTasks()
  }, [])

  async function checkAuth() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth/login")
    }
  }

  async function fetchAppliedTasks() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase.from("student_profiles").select("id").eq("user_id", user.id).single()

      if (!profile) return

      setCurrentProfileId(profile.id)

      // Fetch all projects
      const response = await fetch("/api/projects?limit=100")
      const data = await response.json()
      const allProjects = data.projects || []

      // Filter projects where user has applied
      const tasksWithApplications = allProjects
        .map((project: Project) => {
          const myApplication = project.applicants?.find((a: any) => a.user === profile.id)
          return myApplication ? { ...project, myApplication } : null
        })
        .filter(Boolean)

      setAppliedTasks(tasksWithApplications)
    } catch (error) {
      console.error("Failed to fetch applied tasks:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center gap-4 border-b bg-[#3B82F6] px-4 py-4">
        <Button asChild size="icon" variant="ghost" className="text-white hover:bg-white/10">
          <Link href="/dashboard">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-white">My Applications</h1>
      </header>

      {/* Task List */}
      <main className="flex-1 overflow-y-auto pb-20">
        <div className="container mx-auto px-4 py-6">
          {loading ? (
            <div className="text-center text-muted-foreground">Loading your applications...</div>
          ) : appliedTasks.length === 0 ? (
            <div className="py-16 text-center">
              <p className="mb-4 text-muted-foreground">You haven't applied to any tasks yet.</p>
              <Button asChild className="bg-[#3B82F6] hover:bg-[#2563EB]">
                <Link href="/dashboard">Browse Tasks</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {appliedTasks.map((task) => {
                if (!task) return null
                const difficultyBadge = getDifficultyBadge(task.difficulty || "medium")
                const statusBadge = getStatusBadge(task.myApplication?.status || "Pending")

                return (
                  <Card key={task.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <CardTitle className="line-clamp-1 text-lg">{task.title}</CardTitle>
                          <CardDescription className="line-clamp-2 mt-1">{task.description}</CardDescription>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Badge className={difficultyBadge.className}>{difficultyBadge.text}</Badge>
                          <Badge className={statusBadge.className}>{statusBadge.text}</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Posted By */}
                      {task.author && (
                        <div className="flex items-center gap-2 mb-4">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={task.author.profile_picture_url || undefined} />
                            <AvatarFallback className="bg-[#3B82F6] text-white">
                              {task.author.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{task.author.name}</p>
                            {task.author.college && (
                              <p className="text-xs text-muted-foreground truncate">{task.author.college}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Application Date */}
                      {task.myApplication?.appliedAt && (
                        <p className="text-xs text-muted-foreground mb-4">
                          Applied on {new Date(task.myApplication.appliedAt).toLocaleDateString()}
                        </p>
                      )}

                      <Button asChild className="w-full bg-transparent" variant="outline">
                        <Link href={`/projects/${task.id}`}>View Task Details</Link>
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  )
}
