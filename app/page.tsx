"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageCircle, Calendar, Sparkles, Trophy, Send, User, Clock } from "lucide-react"
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

type TeamRecommendation = {
  id: string
  name: string
  college: string
  skills: string[]
  project_type: string
  profile_picture_url: string | null
}

export default function HomePage() {
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [recommendations, setRecommendations] = useState<TeamRecommendation[]>([])
  const [activeTab, setActiveTab] = useState("private-chat")
  const [conversations, setConversations] = useState<any[]>([])

  useEffect(() => {
    fetchCompetitions()
    fetchMockData()
    fetchSampleConversations()
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

  function fetchMockData() {
    setRecommendations([
      {
        id: "1",
        name: "Emily Rodriguez",
        college: "UC Berkeley",
        skills: ["Python", "Machine Learning", "Data Science"],
        project_type: "Hackathon",
        profile_picture_url: null,
      },
      {
        id: "2",
        name: "Michael Kumar",
        college: "Carnegie Mellon",
        skills: ["React", "Node.js", "UI/UX Design"],
        project_type: "Startup Project",
        profile_picture_url: null,
      },
      {
        id: "3",
        name: "Jessica Lee",
        college: "Harvard University",
        skills: ["Business Strategy", "Marketing", "Product Management"],
        project_type: "Research Project",
        profile_picture_url: null,
      },
    ])
  }

  function fetchSampleConversations() {
    setConversations([
      {
        id: "1",
        name: "Sarah Johnson",
        college: "Stanford University",
        profile_picture_url: null,
        last_message: "Hey! Are you interested in the AI hackathon?",
        time: "2h ago",
        unread: true,
      },
      {
        id: "2",
        name: "David Chen",
        college: "MIT",
        profile_picture_url: null,
        last_message: "Thanks for connecting! Let's discuss the project.",
        time: "1d ago",
        unread: false,
      },
      {
        id: "3",
        name: "Maya Patel",
        college: "Georgia Tech",
        profile_picture_url: null,
        last_message: "I'd love to collaborate on the sustainability challenge",
        time: "3d ago",
        unread: false,
      },
    ])
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-[#16a085] to-[#1abc9c] shadow-2xl">
            <span className="text-5xl font-bold text-white">CH</span>
          </div>
        </div>

        {/* App Name */}
        <div className="space-y-2">
          <h1 className="text-5xl font-bold text-white">CollabHub</h1>
          <p className="text-lg text-gray-300">Connect. Collaborate. Create.</p>
        </div>

        {/* Auth Buttons */}
        <div className="space-y-4 pt-8">
          <Button
            asChild
            size="lg"
            className="w-full bg-[#16a085] hover:bg-[#1abc9c] text-white text-lg font-semibold h-14 shadow-lg"
          >
            <Link href="/auth/sign-up">Sign Up</Link>
          </Button>

          <Button
            asChild
            size="lg"
            variant="outline"
            className="w-full border-2 border-[#16a085] text-[#16a085] hover:bg-[#16a085]/10 text-lg font-semibold h-14 bg-transparent"
          >
            <Link href="/auth/login">Login</Link>
          </Button>

          <div className="pt-4">
            <Button asChild variant="link" className="text-gray-400 hover:text-gray-300">
              <Link href="/organizer/login">Organizer Login</Link>
            </Button>
          </div>
        </div>
      </div>

      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold text-balance leading-tight text-primary">
            {"Collaborate, create, and "}
            <span className="text-accent">{"connect"}</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground text-balance max-w-2xl mx-auto leading-relaxed">
            {"Find project partners and join teams across colleges. Build amazing things together."}
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-8">
        <div className="max-w-5xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-auto">
              <TabsTrigger value="community-chat" className="py-3">
                <MessageCircle className="h-4 w-4 mr-2" />
                Community Chat
              </TabsTrigger>
              <TabsTrigger value="private-chat" className="py-3">
                <MessageCircle className="h-4 w-4 mr-2" />
                Private Chat
              </TabsTrigger>
              <TabsTrigger value="ai-recommendations" className="py-3">
                <Sparkles className="h-4 w-4 mr-2" />
                Team Recommendations
              </TabsTrigger>
            </TabsList>

            <TabsContent value="community-chat" className="mt-6">
              <Card className="p-6">
                <div className="text-center py-8 space-y-4">
                  <MessageCircle className="h-16 w-16 mx-auto text-primary opacity-50" />
                  <h3 className="text-xl font-semibold">Join the Community</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Connect with students from colleges worldwide. Share ideas, ask questions, and collaborate.
                  </p>
                  <Button asChild className="mt-4">
                    <Link href="/auth/sign-up">Sign Up to Join</Link>
                  </Button>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="private-chat" className="mt-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  Your Conversations
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Connect directly with students from colleges worldwide
                </p>
                <div className="space-y-3 mb-6">
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className="flex items-start gap-4 p-4 rounded-lg border hover:shadow-md transition-all"
                    >
                      <Avatar className="h-12 w-12 flex-shrink-0 ring-2 ring-primary/10">
                        <AvatarImage src={conv.profile_picture_url || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white">
                          {conv.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <div>
                            <h4 className="font-semibold">{conv.name}</h4>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {conv.college}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {conv.time}
                            </span>
                            {conv.unread && <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">{conv.last_message}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-center">
                  <Button asChild>
                    <Link href="/auth/sign-up">Sign Up to Start Chatting</Link>
                  </Button>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="ai-recommendations" className="mt-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI-Powered Team Matches
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Find teammates with complementary skills for your next project
                </p>
                <div className="space-y-4">
                  {recommendations.map((rec) => (
                    <div
                      key={rec.id}
                      className="flex items-start gap-4 p-4 rounded-lg border hover:shadow-md transition-all"
                    >
                      <Avatar className="h-14 w-14 flex-shrink-0 ring-2 ring-primary/20">
                        <AvatarImage src={rec.profile_picture_url || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white text-lg">
                          {rec.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold">{rec.name}</h4>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {rec.college}
                            </p>
                          </div>
                          <Badge variant="outline" className="ml-2">
                            Working on: {rec.project_type}
                          </Badge>
                        </div>
                        <div className="mb-3">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Skills & Needs:</p>
                          <div className="flex flex-wrap gap-1">
                            {rec.skills.map((skill, index) => (
                              <Badge key={skill} variant={index < 2 ? "default" : "secondary"} className="text-xs">
                                {index < 2 ? "Has: " : "Needs: "}
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Button size="sm" className="w-full sm:w-auto">
                          <Send className="h-3 w-3 mr-2" />
                          Invite to Team
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 text-center">
                  <Button asChild variant="outline">
                    <Link href="/auth/sign-up">Join to See More Recommendations</Link>
                  </Button>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Upcoming Events & Competitions</h2>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/competitions">View All</Link>
            </Button>
          </div>
          {competitions.length === 0 ? (
            <Card className="p-8 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No upcoming events at the moment</p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {competitions.map((comp) => (
                <Card key={comp.id} className="overflow-hidden hover:shadow-lg transition-shadow">
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
                    <h3 className="font-semibold text-lg line-clamp-1">{comp.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{comp.description}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
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
                          <Badge key={tag} variant="outline" className="text-xs">
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

      <footer className="bg-[#4a634a] text-white mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gradient-to-r from-[#6a11cb] via-violet-600 to-[#00c4cc]" />
              <span className="font-semibold">College Connect</span>
            </div>
            <p className="text-sm text-white/80">{"© 2025 College Connect. All rights reserved."}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
