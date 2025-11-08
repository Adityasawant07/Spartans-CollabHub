"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Maximize2, Minimize2, Calendar, Users, Sparkles, Inbox } from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import type { Project, Recommendation, Event } from "@/lib/types"
import { BottomNav } from "@/components/bottom-nav"

type PanelView = "split" | "requests" | "events"

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
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
      const [projectsRes, eventsRes, recommendationsRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/events"),
        fetch("/api/recommendations"),
      ])

      const projectsData = await projectsRes.json()
      const eventsData = await eventsRes.json()
      const recommendationsData = await recommendationsRes.json()

      setProjects(projectsData.projects || [])
      setEvents(eventsData.events || [])
      setRecommendations(recommendationsData.recommendations || [])
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
        const conversations = data.conversations
        if (Array.isArray(conversations)) {
          const total = conversations.reduce((sum: number, conv: any) => sum + (conv.unread_count || 0), 0)
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

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b bg-card px-4 py-3">
        <h1 className="text-xl font-bold text-primary">CollabHub</h1>
        <Button asChild variant="ghost" size="sm" className="relative">
          <Link href="/messages">
            <Inbox className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                {unreadCount}
              </span>
            )}
          </Link>
        </Button>
      </header>

      <main className="flex-1 overflow-hidden">
        {recommendations.length > 0 && (
          <div className="border-b bg-gradient-to-r from-purple-50 to-blue-50 p-4 dark:from-purple-950/20 dark:to-blue-950/20">
            <div className="mx-auto max-w-7xl">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <h2 className="text-lg font-semibold text-purple-900 dark:text-purple-100">
                  AI Suggested Teams for You
                </h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {recommendations.map((rec) => (
                  <Card
                    key={rec.project.id}
                    className="border-purple-200 transition-shadow hover:shadow-md dark:border-purple-800"
                  >
                    <CardHeader className="pb-3">
                      <div className="mb-2 flex items-start justify-between">
                        <CardTitle className="line-clamp-1 text-base">{rec.project.title}</CardTitle>
                        <Badge
                          variant="secondary"
                          className="ml-2 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                        >
                          {rec.matchScore}% Match
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-2 text-xs">{rec.reason}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {rec.matchedSkills.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-1">
                          {rec.matchedSkills.slice(0, 3).map((skill) => (
                            <Badge key={skill} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {rec.project.author && (
                        <div className="mb-3 flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={rec.project.author.profile_picture_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {rec.project.author.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">{rec.project.author.name}</span>
                        </div>
                      )}
                      <Button asChild size="sm" className="w-full bg-purple-600 hover:bg-purple-700">
                        <Link href={`/projects/${rec.project.id}`}>View & Apply</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

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
              <motion.div layout className="flex flex-1 flex-col overflow-hidden rounded-lg border bg-card">
                <div className="flex items-center justify-between border-b p-4">
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
                    <div className="text-center text-muted-foreground">No requests yet</div>
                  ) : (
                    projects.slice(0, 10).map((project) => (
                      <Card key={project.id} className="transition-shadow hover:shadow-md">
                        <CardHeader>
                          <CardTitle className="line-clamp-1">{project.title}</CardTitle>
                          <CardDescription className="line-clamp-2">{project.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {project.author && (
                            <div className="mb-3 flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={project.author.profile_picture_url || undefined} />
                                <AvatarFallback>{project.author.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-muted-foreground">{project.author.name}</span>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <Button asChild size="sm" variant="outline" className="flex-1 bg-transparent">
                              <Link href={`/profile/${project.author?.id}`}>View Profile</Link>
                            </Button>
                            {project.author_id === currentUserId ? (
                              <span className="flex flex-1 items-center justify-center text-xs text-muted-foreground">
                                You created this request
                              </span>
                            ) : (
                              <Button asChild size="sm" className="flex-1">
                                <Link href={`/projects/${project.id}`}>Apply</Link>
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </motion.div>

              {/* Events Panel */}
              <motion.div layout className="flex flex-1 flex-col overflow-hidden rounded-lg border bg-card">
                <div className="flex items-center justify-between border-b p-4">
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
                    <div className="text-center text-muted-foreground">No events scheduled</div>
                  ) : (
                    events.slice(0, 10).map((event) => (
                      <Card key={event.id} className="overflow-hidden transition-shadow hover:shadow-md">
                        {event.banner_url && (
                          <div className="aspect-video w-full overflow-hidden">
                            <img
                              src={event.banner_url || "/placeholder.svg"}
                              alt={event.name}
                              className="h-full w-full object-cover"
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
              <div className="flex h-full flex-col overflow-hidden rounded-lg border bg-card">
                <div className="flex items-center justify-between border-b p-4">
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
                    {projects.map((project) => (
                      <Card key={project.id} className="transition-shadow hover:shadow-md">
                        <CardHeader>
                          <CardTitle className="line-clamp-1">{project.title}</CardTitle>
                          <CardDescription className="line-clamp-3">{project.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {project.author && (
                            <div className="mb-3 flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={project.author.profile_picture_url || undefined} />
                                <AvatarFallback>{project.author.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-muted-foreground">{project.author.name}</span>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <Button asChild size="sm" variant="outline" className="flex-1 bg-transparent">
                              <Link href={`/profile/${project.author?.id}`}>View Profile</Link>
                            </Button>
                            {project.author_id === currentUserId ? (
                              <span className="flex flex-1 items-center justify-center text-xs text-muted-foreground">
                                You created this request
                              </span>
                            ) : (
                              <Button asChild size="sm" className="flex-1">
                                <Link href={`/projects/${project.id}`}>Apply</Link>
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
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
              <div className="flex h-full flex-col overflow-hidden rounded-lg border bg-card">
                <div className="flex items-center justify-between border-b p-4">
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
                      <Card key={event.id} className="transition-shadow hover:shadow-md">
                        {event.banner_url && (
                          <div className="aspect-video w-full overflow-hidden">
                            <img
                              src={event.banner_url || "/placeholder.svg"}
                              alt={event.name}
                              className="h-full w-full object-cover"
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
