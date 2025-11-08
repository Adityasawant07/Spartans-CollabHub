"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Trophy, ThumbsUp } from "lucide-react"
import Link from "next/link"
import type { Competition } from "@/lib/types"
import { BottomNav } from "@/components/bottom-nav"

export default function CompetitionsPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)
  const [upvotedCompetitions, setUpvotedCompetitions] = useState<Set<string>>(new Set())
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    checkAuth()
    fetchCompetitions()
    fetchUserUpvotes()
  }, [])

  async function checkAuth() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth/login")
    }
  }

  async function fetchCompetitions() {
    try {
      const response = await fetch("/api/competitions")
      if (response.ok) {
        const data = await response.json()
        setCompetitions(data.competitions || [])
      }
    } catch (error) {
      console.error("Failed to fetch competitions:", error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchUserUpvotes() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: upvotes } = await supabase
        .from("competition_upvotes")
        .select("competition_id")
        .eq("user_id", user.id)

      if (upvotes) {
        setUpvotedCompetitions(new Set(upvotes.map((u) => u.competition_id)))
      }
    } catch (error) {
      console.error("Failed to fetch user upvotes:", error)
    }
  }

  async function handleUpvote(competitionId: string) {
    const isUpvoted = upvotedCompetitions.has(competitionId)

    try {
      const response = await fetch(`/api/competitions/${competitionId}/upvote`, {
        method: isUpvoted ? "DELETE" : "POST",
      })

      if (response.ok) {
        // Update local state
        setUpvotedCompetitions((prev) => {
          const newSet = new Set(prev)
          if (isUpvoted) {
            newSet.delete(competitionId)
          } else {
            newSet.add(competitionId)
          }
          return newSet
        })

        // Update competition upvote count locally
        setCompetitions((prev) =>
          prev.map((comp) =>
            comp.id === competitionId ? { ...comp, upvotes: (comp.upvotes || 0) + (isUpvoted ? -1 : 1) } : comp,
          ),
        )
      }
    } catch (error) {
      console.error("Failed to toggle upvote:", error)
    }
  }

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)

    const startFormatted = start.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })

    const endFormatted = end.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })

    return `From ${startFormatted} to ${endFormatted}`
  }

  const isOngoing = (startDate: string, endDate: string) => {
    const now = new Date()
    const start = new Date(startDate)
    const end = new Date(endDate)
    return now >= start && now <= end
  }

  const isUpcoming = (startDate: string) => {
    const now = new Date()
    const start = new Date(startDate)
    return now < start
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-primary">Active Events</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-16">
        <div className="container mx-auto px-4 py-8">
          {loading ? (
            <div className="text-center text-muted-foreground">Loading events...</div>
          ) : competitions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Trophy className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">No active events at the moment.</p>
                <p className="mt-2 text-sm text-muted-foreground">Check back later for new events!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {competitions.map((competition) => (
                <Card key={competition.id} className="overflow-hidden transition-shadow hover:shadow-lg">
                  {competition.banner_url && (
                    <div className="aspect-video w-full overflow-hidden bg-muted">
                      <img
                        src={competition.banner_url || "/placeholder.svg"}
                        alt={competition.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="mb-2 flex items-start justify-between">
                      <CardTitle className="line-clamp-2">{competition.title}</CardTitle>
                      {isOngoing(competition.start_date, competition.end_date) ? (
                        <Badge className="ml-2 bg-green-600">Ongoing</Badge>
                      ) : isUpcoming(competition.start_date) ? (
                        <Badge className="ml-2 bg-blue-600">Upcoming</Badge>
                      ) : null}
                    </div>
                    {competition.description && (
                      <CardDescription className="line-clamp-3">{competition.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDateRange(competition.start_date, competition.end_date)}</span>
                    </div>
                    {competition.organizer && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Organized by: </span>
                        <Button asChild variant="link" className="h-auto p-0 text-sm">
                          <Link href={`/profile/${competition.organizer.id}`}>{competition.organizer.name}</Link>
                        </Button>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Button
                        variant={upvotedCompetitions.has(competition.id) ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleUpvote(competition.id)}
                        className="flex-1"
                      >
                        <ThumbsUp className="mr-2 h-4 w-4" />
                        {upvotedCompetitions.has(competition.id) ? "Upvoted" : "Upvote"}
                        <span className="ml-2 font-bold">{competition.upvotes || 0}</span>
                      </Button>
                    </div>
                    <Button asChild className="w-full">
                      <Link href={`/competitions/${competition.id}`}>View Details</Link>
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
