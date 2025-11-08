"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Building2, Plus, Calendar, Trophy, LogOut } from "lucide-react"
import { put } from "@vercel/blob"
import type { Competition, Organizer } from "@/lib/types"

export default function OrganizerDashboardPage() {
  const [organizer, setOrganizer] = useState<Organizer | null>(null)
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)

  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [bannerUrl, setBannerUrl] = useState("")
  const [bannerFile, setBannerFile] = useState<File | null>(null)

  const router = useRouter()

  useEffect(() => {
    checkAuth()
    fetchCompetitions()
  }, [])

  function checkAuth() {
    const storedOrganizer = localStorage.getItem("organizer")
    if (!storedOrganizer) {
      router.push("/organizer/login")
      return
    }
    setOrganizer(JSON.parse(storedOrganizer))
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
    }
  }

  async function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingBanner(true)
    try {
      const blob = await put(`competition-banners/${Date.now()}-${file.name}`, file, {
        access: "public",
      })
      setBannerUrl(blob.url)
      setBannerFile(file)
    } catch (error) {
      console.error("Failed to upload banner:", error)
      alert("Failed to upload banner")
    } finally {
      setUploadingBanner(false)
    }
  }

  async function handleCreateCompetition(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/competitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          start_date: startDate,
          end_date: endDate,
          banner_url: bannerUrl,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create competition")
      }

      // Reset form
      setTitle("")
      setDescription("")
      setStartDate("")
      setEndDate("")
      setBannerUrl("")
      setBannerFile(null)
      setShowCreateForm(false)

      // Refresh competitions list
      fetchCompetitions()
    } catch (error: any) {
      console.error("Failed to create competition:", error)
      alert(error.message || "Failed to create competition")
    } finally {
      setLoading(false)
    }
  }

  function handleLogout() {
    localStorage.removeItem("organizer")
    router.push("/organizer/login")
  }

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
    const end = new Date(endDate).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
    return `${start} - ${end}`
  }

  if (!organizer) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Organizer Dashboard</h1>
                <p className="text-sm text-muted-foreground">{organizer.institute_name}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Competitions</h2>
            <p className="text-muted-foreground">Manage competitions for your institute</p>
          </div>
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Competition
          </Button>
        </div>

        {showCreateForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Create New Competition</CardTitle>
              <CardDescription>Add a new competition for students to participate in</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateCompetition} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Competition Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Annual Hackathon 2025"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the competition, rules, prizes, etc."
                    rows={4}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="banner">Competition Banner</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="banner"
                      type="file"
                      accept="image/*"
                      onChange={handleBannerUpload}
                      disabled={uploadingBanner}
                    />
                    {uploadingBanner && <p className="text-sm text-muted-foreground">Uploading...</p>}
                  </div>
                  {bannerUrl && (
                    <div className="mt-2">
                      <img
                        src={bannerUrl || "/placeholder.svg"}
                        alt="Banner preview"
                        className="h-32 w-full rounded-lg object-cover"
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={loading || uploadingBanner}>
                    {loading ? "Creating..." : "Create Competition"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {competitions.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="py-12 text-center">
                <Trophy className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">No competitions yet</p>
                <p className="mt-2 text-sm text-muted-foreground">Create your first competition to get started!</p>
              </CardContent>
            </Card>
          ) : (
            competitions.map((competition) => (
              <Card key={competition.id} className="overflow-hidden">
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
                  <CardTitle className="line-clamp-2">{competition.title}</CardTitle>
                  <CardDescription className="line-clamp-3">{competition.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDateRange(competition.start_date, competition.end_date)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">{competition.upvotes || 0} upvotes</Badge>
                    <Button asChild size="sm" variant="outline">
                      <a href={`/competitions/${competition.id}`} target="_blank" rel="noopener noreferrer">
                        View
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
