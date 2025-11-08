"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Maximize2, Minimize2, Calendar, Users, Inbox, User, MessageCircle, Sparkles, Code, Rocket } from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import type { Project, Event } from "@/lib/types"
import { BottomNav } from "@/components/bottom-nav"

type PanelView = "split" | "requests" | "events"

const statusColors = {
  Open: "bg-green-100 text-green-800 border-green-300",
  "In Progress": "bg-blue-100 text-blue-800 border-blue-300",
  Closed: "bg-gray-100 text-gray-800 border-gray-300",
}

const categoryIcons: Record<string, any> = {
  "Web Development": Code,
  "Mobile App": Sparkles,
  "AI/ML": Rocket,
  Design: Sparkles,
  Other: Code,
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [panelView, setPanelView] = useState<PanelView>("split")
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    checkAuth()
    fetchData()
    fetchUnreadCount()

    const channel = supabase
      .channel("unread-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        () => {
          fetchUnreadCount()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function checkAuth() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth/login")
      return
    }

    const response = await fetch("/api/profile/me")
    if (response.ok) {
      const profile = await response.json()
      setCurrentUserId(profile.id)
    }
  }

  async function fetchData() {
    try {
      const [projectsRes, eventsRes] = await Promise.all([fetch("/api/projects"), fetch("/api/events")])

      const projectsData = await projectsRes.json()
      const eventsData = await eventsRes.json()

      setProjects(projectsData.projects || [])
      setEvents(eventsData.events || [])
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchUnreadCount() {
    try {
      const response = await fetch("/api/messages")
      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data)) {
          const total = data.reduce((sum: number, conv: any) => sum + (conv.unread_count || 0), 0)
          setUnreadCount(total)
        }
      }
    } catch (error) {
      console.error("Failed to fetch unread count:", error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const renderTaskButtons = (project: Project) => {
    const isOwner = currentUserId === project.author_id

    if (isOwner) {
      return (
        <Button asChild size="sm" className="flex-1">
          <Link href={`/projects/${project.id}`}>
            <Users className="mr-2 h-4 w-4" />
            View Applicants
          </Link>
        </Button>
      )
    }

    return (
      <>
        <Button asChild size="sm" variant="outline" className="flex-1 bg-transparent">
          <Link href={`/profile/${project.author_id}`}>
            <User className="mr-2 h-4 w-4" />
            View Profile
          </Link>
        </Button>
        <Button asChild size="sm" className="flex-1">
          <Link href={`/messages/${project.author_id}`}>
            <MessageCircle className="mr-2 h-4 w-4" />
            Message
          </Link>
        </Button>
      </>
    )
  }

  const renderProjectCard = (project: Project) => {
    const CategoryIcon = project.category ? categoryIcons[project.category] || Code : Code

    return (
      <Card
        key={project.id}
        className="group transition-all duration-300 hover:shadow-lg hover:scale-105 border-l-4 border-l-primary"
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CategoryIcon className="h-4 w-4 text-primary" />
                {project.category && (
                  <Badge variant="outline" className="text-xs">
                    {project.category}
                  </Badge>
                )}
              </div>
              <CardTitle className="line-clamp-1 group-hover:text-primary transition-colors">{project.title}</CardTitle>
            </div>
            <Badge className={statusColors[project.status] || statusColors.Open}>{project.status}</Badge>
          </div>
          <CardDescription className="line-clamp-2">{project.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {project.author && (
            <div className="mb-3 flex items-center gap-2">
              <Avatar className="h-8 w-8 ring-2 ring-primary/10">
                <AvatarImage src={project.author.profile_picture_url || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white">
                  {project.author.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground font-medium">{project.author.name}</span>
            </div>
          )}
          {project.required_skills && project.required_skills.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1">
              {project.required_skills.slice(0, 3).map((skill, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {project.required_skills.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{project.required_skills.length - 3}
                </Badge>
              )}
            </div>
          )}
          <div className="flex gap-2">{renderTaskButtons(project)}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b bg-card px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 flex items-center justify-center">
            <span className="font-bold text-white text-sm">CH</span>
          </div>
          <h1 className="text-xl font-bold text-primary">CollabHub</h1>
        </div>
        <Button asChild variant="ghost" size="sm" className="relative">
          <Link href="/messages">
            <Inbox className="h-5 w-5" />
            {unreadCount > 0 && (
              <>
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                  {unreadCount}
                </span>
                <span className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-blue-500 animate-ping opacity-75" />
              </>
            )}
          </Link>
        </Button>
      </header>

      <main className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {panelView === "split" ? (
            <motion.div
              key="split"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-full gap-4 p-4"
            >
              {/* Requests Panel */}
              <motion.div layout className="flex flex-1 flex-col overflow-hidden rounded-lg border bg-card shadow-sm">
                <div className="flex items-center justify-between border-b p-4 bg-gradient-to-r from-primary/5 to-transparent">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">Team Formation Requests</h2>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => setPanelView("requests")}>
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1 space-y-4 overflow-y-auto p-4">
                  {loading ? (
                    <div className="text-center text-muted-foreground">Loading...</div>
                  ) : projects.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">No requests yet</div>
                  ) : (
                    projects.slice(0, 10).map((project) => renderProjectCard(project))
                  )}
                </div>
              </motion.div>

              {/* Events Panel */}
              <motion.div layout className="flex flex-1 flex-col overflow-hidden rounded-lg border bg-card shadow-sm">
                <div className="flex items-center justify-between border-b p-4 bg-gradient-to-r from-primary/5 to-transparent">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">Active Events</h2>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => setPanelView("events")}>
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1 space-y-4 overflow-y-auto p-4">
                  {loading ? (
                    <div className="text-center text-muted-foreground">Loading...</div>
                  ) : events.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">No events scheduled</div>
                  ) : (
                    events.slice(0, 10).map((event) => (
                      <Card key={event.id} className="overflow-hidden transition-all duration-300 hover:shadow-lg">
                        {event.banner_url && (
                          <div className="aspect-video w-full overflow-hidden">
                            <img
                              src={event.banner_url || "/placeholder.svg"}
                              alt={event.name}
                              className="h-full w-full object-cover transition-transform duration-300 hover:scale-110"
                            />
                          </div>
                        )}
                        <CardHeader>
                          <CardTitle className="line-clamp-1">{event.name}</CardTitle>
                          <CardDescription className="line-clamp-2">{event.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(event.date)}</span>
                          </div>
                          {event.location && <div className="mb-3 text-sm text-muted-foreground">{event.location}</div>}
                          {event.organizer && (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={event.organizer.profile_picture_url || undefined} />
                                <AvatarFallback>{event.organizer.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-muted-foreground">Organized by {event.organizer.name}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </motion.div>
            </motion.div>
          ) : panelView === "requests" ? (
            <motion.div
              key="requests-full"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-full p-4"
            >
              <div className="flex h-full flex-col overflow-hidden rounded-lg border bg-card shadow-sm">
                <div className="flex items-center justify-between border-b p-4 bg-gradient-to-r from-primary/5 to-transparent">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">Team Formation Requests</h2>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setPanelView("split")}>
                    <Minimize2 className="mr-2 h-4 w-4" />
                    Split View
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {projects.map((project) => renderProjectCard(project))}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="events-full"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-full p-4"
            >
              <div className="flex h-full flex-col overflow-hidden rounded-lg border bg-card shadow-sm">
                <div className="flex items-center justify-between border-b p-4 bg-gradient-to-r from-primary/5 to-transparent">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">Active Events</h2>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setPanelView("split")}>
                    <Minimize2 className="mr-2 h-4 w-4" />
                    Split View
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {events.map((event) => (
                      <Card key={event.id} className="overflow-hidden transition-all duration-300 hover:shadow-lg">
                        {event.banner_url && (
                          <div className="aspect-video w-full overflow-hidden">
                            <img
                              src={event.banner_url || "/placeholder.svg"}
                              alt={event.name}
                              className="h-full w-full object-cover transition-transform duration-300 hover:scale-110"
                            />
                          </div>
                        )}
                        <CardHeader>
                          <CardTitle className="line-clamp-1">{event.name}</CardTitle>
                          <CardDescription className="line-clamp-2">{event.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(event.date)}</span>
                          </div>
                          {event.location && <div className="mb-3 text-sm text-muted-foreground">{event.location}</div>}
                          {event.organizer && (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={event.organizer.profile_picture_url || undefined} />
                                <AvatarFallback>{event.organizer.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-muted-foreground">Organized by {event.organizer.name}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <BottomNav />
    </div>
  )
}
