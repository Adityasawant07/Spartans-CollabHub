"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Calendar, UserIcon, MessageCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import type { Project, StudentProfile } from "@/lib/types"

interface ApplicantWithProfile {
  user: string
  message: string
  status: "Pending" | "Accepted" | "Rejected"
  appliedAt?: string
  profile?: StudentProfile
}

export default function ProjectDetailPage() {
  const [project, setProject] = useState<Project | null>(null)
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [applicationMessage, setApplicationMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const params = useParams()
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    fetchProject()
    fetchUserProfile()

    const channel = supabase
      .channel(`project-${params.projectId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "projects",
          filter: `id=eq.${params.projectId}`,
        },
        () => {
          console.log("[v0] Project updated, refreshing applicants")
          fetchProject()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [params.projectId])

  async function fetchProject() {
    try {
      const response = await fetch(`/api/projects/${params.projectId}`)
      const data = await response.json()
      setProject(data)
    } catch (error) {
      console.error("Failed to fetch project:", error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchUserProfile() {
    try {
      const response = await fetch("/api/profile/me")

      if (!response.ok) {
        const error = await response.json()
        console.error("Failed to fetch profile:", error)
        return
      }

      const data = await response.json()
      setProfile(data)
    } catch (error) {
      console.error("Failed to fetch profile:", error)
    }
  }

  async function handleApply() {
    setError("")
    setApplying(true)

    try {
      const response = await fetch(`/api/projects/${params.projectId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: applicationMessage }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit application")
      }

      setProject(data)
      setApplicationMessage("")
      alert("Application submitted successfully!")
    } catch (err: any) {
      console.error("Application error:", err)
      setError(err.message)
    } finally {
      setApplying(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!project) return <div className="p-8 text-center">Project not found</div>

  const isAuthor = profile?.id === project.author_id
  const hasApplied = project.applicants?.some((a: any) => a.user === profile?.id)
  const applicantsWithProfiles = project.applicants as ApplicantWithProfile[] | undefined

  const metadata = (project?.attachments as any[])?.find((att: any) => att.type === "metadata") || {}
  const teamSize = metadata.team_size || 0
  const difficulty = metadata.difficulty || "medium"
  const acceptedCount = (project?.applicants as any[])?.filter((a: any) => a.status === "Accepted")?.length || 0
  const isTeamFull = teamSize > 0 && acceptedCount >= teamSize

  function getDifficultyBadge(diff: string) {
    switch (diff) {
      case "easy":
        return { text: "🟢 Easy", className: "bg-green-100 text-green-800" }
      case "medium":
        return { text: "🟡 Medium", className: "bg-yellow-100 text-yellow-800" }
      case "hard":
        return { text: "🔴 Hard", className: "bg-red-100 text-red-800" }
      default:
        return { text: diff, className: "bg-gray-100 text-gray-800" }
    }
  }

  const difficultyBadge = getDifficultyBadge(difficulty)

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
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="mb-2 text-3xl">{project.title}</CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4" />
                      <span>{project.author?.name}</span>
                      {!isAuthor && project.author_id && (
                        <Button asChild size="sm" variant="link" className="h-auto p-0 text-sm">
                          <Link href={`/profile/${project.author_id}`}>View Profile</Link>
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(project.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Badge className={difficultyBadge.className}>{difficultyBadge.text}</Badge>
                  <Badge variant={project.status === "Open" ? "default" : "secondary"}>{project.status}</Badge>
                </div>
              </div>
              {teamSize > 0 && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Team Progress</span>
                    <span className="text-sm text-muted-foreground">
                      {acceptedCount} / {teamSize} members
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-[#3B82F6] h-2 rounded-full transition-all"
                      style={{ width: `${(acceptedCount / teamSize) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="mb-2 font-semibold">Description</h3>
                <p className="whitespace-pre-wrap text-muted-foreground">{project.description}</p>
              </div>

              {project.tags && project.tags.length > 0 && (
                <div>
                  <h3 className="mb-2 font-semibold">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag, idx) => (
                      <Badge key={idx} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {project.required_skills && project.required_skills.length > 0 && (
                <div>
                  <h3 className="mb-2 font-semibold">Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {project.required_skills.map((skill, idx) => (
                      <Badge key={idx} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {!isAuthor && project.status === "Open" && !hasApplied && !isTeamFull && (
                <div className="border-t pt-6">
                  <h3 className="mb-4 font-semibold">Apply to this Project</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="message">Application Message</Label>
                      <Textarea
                        id="message"
                        value={applicationMessage}
                        onChange={(e) => setApplicationMessage(e.target.value)}
                        placeholder="Tell the project owner why you'd like to join..."
                        rows={4}
                      />
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <Button onClick={handleApply} disabled={applying} className="bg-[#3B82F6] hover:bg-[#2563EB]">
                      {applying ? "Submitting..." : "Apply"}
                    </Button>
                  </div>
                </div>
              )}

              {!isAuthor && isTeamFull && (
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm font-medium">This team is now full</p>
                  <p className="text-sm text-muted-foreground mt-1">All positions have been filled</p>
                </div>
              )}

              {hasApplied && (
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm">You have already applied to this project</p>
                </div>
              )}

              {isAuthor && (
                <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
                  <p className="font-medium text-primary">You created this project</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    As the project owner, you can view applicants below and contact them directly.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {isAuthor && applicantsWithProfiles && applicantsWithProfiles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Applicants ({applicantsWithProfiles.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {applicantsWithProfiles.map((applicant, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-4 rounded-lg border p-4 transition-shadow hover:shadow-md"
                  >
                    <Avatar className="h-14 w-14 flex-shrink-0">
                      <AvatarImage src={applicant.profile?.profile_picture_url || undefined} />
                      <AvatarFallback className="text-lg font-bold">
                        {applicant.profile?.name?.charAt(0).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-3">
                      <div>
                        <h4 className="text-lg font-semibold">{applicant.profile?.name || "Unknown User"}</h4>
                        {applicant.profile?.college && (
                          <p className="text-sm text-muted-foreground">{applicant.profile.college}</p>
                        )}
                        {applicant.profile?.bio && (
                          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{applicant.profile.bio}</p>
                        )}
                      </div>

                      {applicant.profile && (
                        <>
                          {applicant.profile.skills && applicant.profile.skills.length > 0 && (
                            <div>
                              <p className="mb-1 text-xs font-medium text-muted-foreground">Skills</p>
                              <div className="flex flex-wrap gap-1">
                                {applicant.profile.skills.slice(0, 5).map((skill, skillIdx) => (
                                  <Badge key={skillIdx} variant="secondary" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                                {applicant.profile.skills.length > 5 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{applicant.profile.skills.length - 5}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {applicant.message && (
                        <div className="rounded-md bg-muted p-3">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Application Message:</p>
                          <p className="text-sm">{applicant.message}</p>
                        </div>
                      )}

                      {applicant.appliedAt && (
                        <p className="text-xs text-muted-foreground">
                          Applied on {new Date(applicant.appliedAt).toLocaleDateString()}
                        </p>
                      )}

                      <div className="flex gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/profile/${applicant.user}`}>
                            <UserIcon className="mr-1 h-3 w-3" />
                            View Profile
                          </Link>
                        </Button>
                        <Button asChild size="sm" variant="default" className="bg-primary hover:bg-primary/90">
                          <Link href={`/messages/${applicant.user}`}>
                            <MessageCircle className="mr-1 h-4 w-4" />
                            Message
                          </Link>
                        </Button>
                      </div>
                    </div>
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
