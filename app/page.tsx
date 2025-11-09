"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Trophy } from "lucide-react"
import Link from "next/link"

type Competition = {
  id: string
  title: string
  description: string
  start_date: string
  end_date: string
  tags: string[]
  upvotes: number
  banner_url?: string
}

export default function HomePage() {
  const [competitions, setCompetitions] = useState<Competition[]>([])

  useEffect(() => {
    fetchCompetitions()
  }, [])

  async function fetchCompetitions() {
    try {
      const response = await fetch("/api/competitions")
      if (response.ok) {
        const data = await response.json()
        setCompetitions((data.competitions || []).slice(0, 4))
      }
    } catch (error) {
      console.error("Failed to fetch competitions:", error)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-orange-50 via-yellow-50 to-pink-50 px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="flex justify-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl overflow-hidden shadow-2xl">
            <img src="/logo.png" alt="CollabHub Logo" className="h-full w-full object-cover" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">
            CollabHub
          </h1>
          <p className="text-lg text-gray-700">Connect. Collaborate. Create.</p>
        </div>

        <div className="space-y-4 pt-8">
          <Button
            asChild
            size="lg"
            className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white text-lg font-semibold h-14 shadow-lg"
          >
            <Link href="/auth/sign-up">Sign Up</Link>
          </Button>

          <Button
            asChild
            size="lg"
            variant="outline"
            className="w-full border-2 border-orange-500 text-orange-600 hover:bg-orange-50 bg-white"
          >
            <Link href="/auth/login">Login</Link>
          </Button>

          <div className="pt-4">
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full border-2 border-purple-500 text-purple-600 hover:bg-purple-50 bg-white"
            >
              <Link href="/organizer/login">Organizer Login</Link>
            </Button>
          </div>
        </div>
      </div>

      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold text-balance leading-tight bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">
            {"Collaborate, create, and "}
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              {"connect"}
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-700 text-balance max-w-2xl mx-auto leading-relaxed">
            {"Find project partners and join teams across colleges. Build amazing things together."}
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Trophy className="h-6 w-6 text-orange-500" />
            <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
              Upcoming Events
            </h2>
          </div>
          {competitions.length === 0 ? (
            <Card className="p-8 text-center bg-white/90 backdrop-blur-sm border-2 border-orange-200 rounded-2xl shadow-lg">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-orange-500 opacity-50" />
              <p className="text-gray-600">No upcoming events at the moment</p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {competitions.map((comp) => (
                <Card
                  key={comp.id}
                  className="overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all bg-white/90 backdrop-blur-sm border-2 border-orange-100 rounded-2xl"
                >
                  {comp.banner_url && (
                    <div className="aspect-video w-full overflow-hidden bg-muted">
                      <img
                        src={comp.banner_url || "/placeholder.svg"}
                        alt={comp.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4 space-y-3">
                    <h3 className="font-semibold text-lg line-clamp-1 text-gray-900">{comp.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{comp.description}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4 text-orange-500" />
                      <span>
                        {new Date(comp.start_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    {comp.tags && comp.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {comp.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs border-orange-300 text-orange-700">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 text-white mt-20 w-full">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="CollabHub" className="w-8 h-8 rounded" />
              <span className="font-semibold">CollabHub</span>
            </div>
            <p className="text-sm text-white/90">{"© 2025 CollabHub. All rights reserved."}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
