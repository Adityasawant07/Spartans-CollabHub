"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, Clock, ExternalLink, FileText, ThumbsUp, Phone } from "lucide-react"
import Link from "next/link"
import type { Competition } from "@/lib/types"

export default function CompetitionDetailPage() {
  const [competition, setCompetition] = useState<Competition | null>(null)
  const [loading, setLoading] = useState(true)
  const [isUpvoted, setIsUpvoted] = useState(false)
  const [upvoting, setUpvoting] = useState(false)
  const router = useRouter()
  const params = useParams()
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    fetchCompetition()
    checkUpvoteStatus()
  }, [params.competitionId])

  async function fetchCompetition() {
    try {
      const { data, error } = await supabase.from("competitions").select("*").eq("id", params.competitionId).single()

      if (error) throw error
      setCompetition(data)
    } catch (error) {
      console.error("Failed to fetch competition:", error)
    } finally {
      setLoading(false)
    }
  }

  async function checkUpvoteStatus() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from("competition_upvotes")
        .select("id")
        .eq("competition_id", params.competitionId)
        .eq("user_id", user.id)
        .maybeSingle()

      if (error) throw error
      setIsUpvoted(!!data)
    } catch (error) {
      // Not upvoted or error occurred
      setIsUpvoted(false)
    }
  }

  async function handleUpvote() {
    if (upvoting) return

    try {
      setUpvoting(true)
      const response = await fetch(`/api/competitions/${params.competitionId}/upvote`, {
        method: isUpvoted ? "DELETE" : "POST",
      })

      if (response.ok) {
        setIsUpvoted(!isUpvoted)
        setCompetition((prev) => (prev ? { ...prev, upvotes: (prev.upvotes || 0) + (isUpvoted ? -1 : 1) } : null))
      } else {
        const errorData = await response.json()
        console.error("[v0] Upvote error:", errorData.error)

        if (!isUpvoted && (errorData.error.includes("duplicate") || errorData.error.includes("Already upvoted"))) {
          setIsUpvoted(true)
        }
      }
    } catch (error) {
      console.error("[v0] Failed to toggle upvote:", error)
    } finally {
      setUpvoting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading event details...</div>
      </div>
    )
  }

  if (!competition) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Event not found</p>
          <Button asChild className="mt-4">
            <Link href="/competitions">Back to Events</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-pink-50">
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Button asChild variant="ghost">
            <Link href="/competitions">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Events
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Banner Image */}
          {competition.banner_url && (
            <div className="overflow-hidden rounded-xl shadow-lg">
              <img
                src={competition.banner_url || "/placeholder.svg"}
                alt={competition.title}
                className="h-64 w-full object-cover md:h-96"
              />
            </div>
          )}

          {/* Main Info Card */}
          <Card className="border-2 shadow-lg">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="mb-3 text-3xl md:text-4xl bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                    {competition.title}
                  </CardTitle>
                  <div className="flex flex-wrap gap-2">
                    {isOngoing(competition.start_date, competition.end_date) ? (
                      <Badge className="bg-green-600 text-white">🔴 Live Now</Badge>
                    ) : isUpcoming(competition.start_date) ? (
                      <Badge className="bg-blue-600 text-white">📅 Upcoming</Badge>
                    ) : (
                      <Badge variant="secondary">Ended</Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant={isUpvoted ? "default" : "outline"}
                  size="lg"
                  onClick={handleUpvote}
                  disabled={upvoting}
                  className={
                    isUpvoted
                      ? "bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
                      : ""
                  }
                >
                  <ThumbsUp className="mr-2 h-5 w-5" />
                  {competition.upvotes || 0}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Description */}
              <div>
                <h3 className="mb-2 text-lg font-semibold">About this Event</h3>
                <p className="whitespace-pre-wrap text-muted-foreground">{competition.description}</p>
              </div>

              {/* Event Details Grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3 rounded-lg border bg-gradient-to-br from-orange-50 to-yellow-50 p-4">
                  <Calendar className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-600" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                    <p className="text-lg font-semibold">{formatDate(competition.start_date)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg border bg-gradient-to-br from-pink-50 to-orange-50 p-4">
                  <Calendar className="mt-0.5 h-5 w-5 flex-shrink-0 text-pink-600" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">End Date</p>
                    <p className="text-lg font-semibold">{formatDate(competition.end_date)}</p>
                  </div>
                </div>

                {competition.timing && (
                  <div className="flex items-start gap-3 rounded-lg border bg-gradient-to-br from-yellow-50 to-pink-50 p-4">
                    <Clock className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Timing</p>
                      <p className="text-lg font-semibold">{competition.timing}</p>
                    </div>
                  </div>
                )}

                {competition.contact_number && (
                  <div className="flex items-start gap-3 rounded-lg border bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
                    <Phone className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Contact</p>
                      <p className="text-lg font-semibold">{competition.contact_number}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                {competition.event_url && (
                  <Button
                    asChild
                    size="lg"
                    className="flex-1 bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700"
                  >
                    <a href={competition.event_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-5 w-5" />
                      Visit Event Website
                    </a>
                  </Button>
                )}

                {competition.info_file_url && (
                  <Button asChild size="lg" variant="outline" className="flex-1 border-2 bg-transparent">
                    <a href={competition.info_file_url} target="_blank" rel="noopener noreferrer">
                      <FileText className="mr-2 h-5 w-5" />
                      Download Info File
                    </a>
                  </Button>
                )}
              </div>

              {/* View-Only Notice */}
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-center">
                <p className="text-sm font-medium text-blue-900">
                  📢 To register for this event, please visit the event website or contact the organizer directly
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
