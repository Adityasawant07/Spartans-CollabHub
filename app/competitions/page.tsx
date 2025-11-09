"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Trophy, ThumbsUp, Inbox } from "lucide-react"
import Link from "next/link"
import type { Competition } from "@/lib/types"
import { BottomNav } from "@/components/bottom-nav"

export default function CompetitionsPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)
  const [upvotedCompetitions, setUpvotedCompetitions] = useState<Set<string>>(new Set())
  const [upvotingState, setUpvotingState] = useState<Map<string, boolean>>(new Map())
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
    if (upvotingState.get(competitionId)) {
      console.log("[v0] Upvote already in progress for", competitionId)
      return
    }

    const isUpvoted = upvotedCompetitions.has(competitionId)

    try {
      // Set loading state to prevent duplicate requests
      setUpvotingState((prev) => new Map(prev).set(competitionId, true))

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
      } else {
        const errorData = await response.json()
        console.error("[v0] Upvote error:", errorData.error)

        if (errorData.error && errorData.error.includes("duplicate")) {
          setUpvotedCompetitions((prev) => new Set(prev).add(competitionId))
        } else if (errorData.error && errorData.error.includes("Already upvoted")) {
          setUpvotedCompetitions((prev) => new Set(prev).add(competitionId))
        }
      }
    } catch (error) {
      console.error("[v0] Failed to toggle upvote:", error)
    } finally {
      setUpvotingState((prev) => {
        const newMap = new Map(prev)
        newMap.delete(competitionId)
        return newMap
      })
    }
  }

  const formatDateRange = (startDate: string | null | undefined, endDate: string | null | undefined) => {
    if (!startDate || !endDate) {
      return "Date not specified"
    }

    try {
      const start = new Date(startDate)
      const end = new Date(endDate)

      // Check if dates are valid
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return "Invalid date"
      }

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
    } catch (error) {
      return "Invalid date"
    }
  }

  const isOngoing = (startDate: string | null | undefined, endDate: string | null | undefined) => {
    if (!startDate || !endDate) return false

    try {
      const now = new Date()
      const start = new Date(startDate)
      const end = new Date(endDate)

      if (isNaN(start.getTime()) || isNaN(end.getTime())) return false

      return now >= start && now <= end
    } catch {
      return false
    }
  }

  const isUpcoming = (startDate: string | null | undefined) => {
    if (!startDate) return false

    try {
      const now = new Date()
      const start = new Date(startDate)

      if (isNaN(start.getTime())) return false

      return now < start
    } catch {
      return false
    }
  }

  return (
    <div className="flex h-screen flex-col bg-gradient-to-br from-orange-50 via-yellow-50 to-pink-50 pb-20">
      <header className="flex items-center justify-between border-b bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 px-4 py-4 shadow-lg">
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

      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-7 w-7 text-orange-500" />
              <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
                All Events
              </h2>
            </div>
            <p className="text-gray-700">Browse all active events</p>
          </div>

          {loading ? (
            <div className="text-center text-muted-foreground py-12">Loading events...</div>
          ) : competitions.length === 0 ? (
            <Card className="bg-white/90 backdrop-blur-sm border-2 border-orange-200 rounded-2xl shadow-lg">
              <CardContent className="py-12 text-center">
                <Trophy className="mx-auto mb-4 h-12 w-12 text-orange-500" />
                <p className="text-gray-700">No active events at the moment.</p>
                <p className="mt-2 text-sm text-gray-600">Check back later for new events!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {competitions.map((competition) => (
                <Card
                  key={competition.id}
                  className="overflow-hidden transition-shadow hover:shadow-xl bg-white/90 backdrop-blur-sm border-2 border-orange-100 rounded-2xl"
                >
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
                        <Badge className="ml-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white">Upcoming</Badge>
                      ) : null}
                    </div>
                    {competition.description && (
                      <CardDescription className="line-clamp-3">{competition.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4 text-orange-500" />
                      <span>{formatDateRange(competition.start_date, competition.end_date)}</span>
                    </div>
                    {competition.organizer && (
                      <div className="text-sm">
                        <span className="text-gray-600">Organized by: </span>
                        <Button
                          asChild
                          variant="link"
                          className="h-auto p-0 text-sm text-orange-600 hover:text-orange-700"
                        >
                          <Link href={`/profile/${competition.organizer.id}`}>{competition.organizer.name}</Link>
                        </Button>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Button
                        variant={upvotedCompetitions.has(competition.id) ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleUpvote(competition.id)}
                        disabled={upvotingState.get(competition.id) || false}
                        className={
                          upvotedCompetitions.has(competition.id)
                            ? "flex-1 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
                            : "flex-1 border-orange-300 text-orange-600 hover:bg-orange-50"
                        }
                      >
                        <ThumbsUp className="mr-2 h-4 w-4" />
                        {upvotedCompetitions.has(competition.id) ? "Upvoted" : "Upvote"}
                        <span className="ml-2 font-bold">{competition.upvotes || 0}</span>
                      </Button>
                    </div>
                    <Button
                      asChild
                      className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white rounded-full shadow-md"
                    >
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
