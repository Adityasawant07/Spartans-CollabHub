"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trophy, Medal, ArrowLeft, Crown, Star } from "lucide-react"
import Link from "next/link"
import { BottomNav } from "@/components/bottom-nav"
import type { LeaderboardEntry } from "@/lib/types"

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    checkAuth()
    fetchLeaderboard()
  }, [])

  async function checkAuth() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth/login")
    }
  }

  async function fetchLeaderboard() {
    try {
      const response = await fetch("/api/leaderboard")
      const data = await response.json()
      setLeaderboard(data.leaderboard || [])
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error)
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-6 w-6 text-yellow-500" />
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />
    if (rank === 3) return <Medal className="h-6 w-6 text-amber-600" />
    return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>
  }

  const getRankBgColor = (rank: number) => {
    if (rank === 1) return "bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300"
    if (rank === 2) return "bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300"
    if (rank === 3) return "bg-gradient-to-r from-amber-50 to-amber-100 border-amber-300"
    return "bg-card"
  }

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            <h1 className="text-xl font-bold">Leaderboard</h1>
          </div>
          <div className="w-20"></div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-16">
        <div className="container mx-auto px-4 py-8">
          <Card className="mb-6 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Star className="h-5 w-5 text-primary mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium mb-1">How Points Are Calculated:</p>
                  <p className="text-muted-foreground">Achievements (10 pts) • Projects (20 pts) • Skills (5 pts)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mx-auto max-w-4xl space-y-4">
            {leaderboard.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Trophy className="mx-auto mb-4 h-12 w-12 opacity-20" />
                  <p>No leaderboard data yet</p>
                  <p className="text-sm">Start earning skill points to appear on the leaderboard!</p>
                </CardContent>
              </Card>
            ) : (
              leaderboard.map((entry) => (
                <Card key={entry.profile.id} className={`transition-all hover:shadow-lg ${getRankBgColor(entry.rank)}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center">
                        {getRankIcon(entry.rank)}
                      </div>

                      <Link href={`/profile/${entry.profile.id}`} className="flex-1">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-16 w-16 ring-2 ring-primary/20">
                            <AvatarImage src={entry.profile.avatar_url || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white text-xl">
                              {entry.profile.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1">
                            <h3 className="text-lg font-bold">{entry.profile.name}</h3>
                            {entry.profile.college && (
                              <p className="text-sm text-muted-foreground">{entry.profile.college}</p>
                            )}
                            <div className="mt-2 flex flex-wrap gap-2">
                              {entry.profile.skills?.slice(0, 3).map((skill: string, idx: number) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                              {(entry.profile.skills?.length || 0) > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{entry.profile.skills.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>

                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <div className="flex items-center gap-1 text-2xl font-bold text-primary">
                          <Star className="h-6 w-6 fill-primary" />
                          {entry.skill_points}
                        </div>
                        <span className="text-xs text-muted-foreground">skill points</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
