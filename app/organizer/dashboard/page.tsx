"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Building2, Calendar, Trophy, LogOut, FileText } from "lucide-react"
import { put } from "@vercel/blob"
import type { Competition, Organizer } from "@/lib/types"

export default function OrganizerDashboardPage() {
  const [organizer, setOrganizer] = useState<Organizer | null>(null)
  const [events, setEvents] = useState<Competition[]>([])
  const [loading, setLoading] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [uploadingInfo, setUploadingInfo] = useState(false)

  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [timing, setTiming] = useState("")
  const [eventUrl, setEventUrl] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [contactNumber, setContactNumber] = useState("")
  const [bannerUrl, setBannerUrl] = useState("")
  const [infoFileUrl, setInfoFileUrl] = useState("")

  const router = useRouter()

  useEffect(() => {
    checkAuth()
    fetchEvents()
  }, [])

  function checkAuth() {
    const storedOrganizer = localStorage.getItem("organizer")
    if (!storedOrganizer) {
      router.push("/organizer/login")
      return
    }
    setOrganizer(JSON.parse(storedOrganizer))
  }

  async function fetchEvents() {
    try {
      const response = await fetch("/api/competitions")
      if (response.ok) {
        const data = await response.json()
        setEvents(data.competitions || [])
      }
    } catch (error) {
      console.error("Failed to fetch events:", error)
    }
  }

  async function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingBanner(true)
    try {
      const blob = await put(`event-banners/${Date.now()}-${file.name}`, file, {
        access: "public",
      })
      setBannerUrl(blob.url)
    } catch (error) {
      console.error("Failed to upload banner:", error)
      alert("Failed to upload banner")
    } finally {
      setUploadingBanner(false)
    }
  }

  async function handleInfoFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingInfo(true)
    try {
      const blob = await put(`event-files/${Date.now()}-${file.name}`, file, {
        access: "public",
      })
      setInfoFileUrl(blob.url)
    } catch (error) {
      console.error("Failed to upload info file:", error)
      alert("Failed to upload info file")
    } finally {
      setUploadingInfo(false)
    }
  }

  async function handleCreateEvent(e: React.FormEvent) {
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
          timing,
          event_url: eventUrl,
          contact_email: contactEmail,
          contact_number: contactNumber,
          banner_url: bannerUrl,
          info_file_url: infoFileUrl,
          institute_id: organizer?.institute_id,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create event")
      }

      // Reset form
      setTitle("")
      setDescription("")
      setStartDate("")
      setEndDate("")
      setTiming("")
      setEventUrl("")
      setContactEmail("")
      setContactNumber("")
      setBannerUrl("")
      setInfoFileUrl("")

      // Refresh events list
      fetchEvents()
      alert("Event created successfully!")
    } catch (error: any) {
      console.error("Failed to create event:", error)
      alert(error.message || "Failed to create event")
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
                <p className="text-xs text-muted-foreground">Institute ID: {organizer.institute_id}</p>
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
        <Tabs defaultValue="home" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="home">Home</TabsTrigger>
            <TabsTrigger value="create">Create Event</TabsTrigger>
            <TabsTrigger value="active">Active Events</TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Welcome, {organizer.institute_name}!</CardTitle>
                <CardDescription>Manage your institute's events and competitions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{events.length}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Active Events</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {events.filter((e) => new Date(e.end_date) >= new Date()).length}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Total Upvotes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{events.reduce((sum, e) => sum + (e.upvotes || 0), 0)}</div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Create New Event</CardTitle>
                <CardDescription>Add a new event or competition for students</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateEvent} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Event Name *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Annual Tech Fest 2025"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the event, rules, prizes, eligibility, etc."
                      rows={4}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="banner">Event Banner * (Image Upload)</Label>
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

                  <div className="space-y-2">
                    <Label htmlFor="infoFile">Info File (PDF/Document Upload - Optional)</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="infoFile"
                        type="file"
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={handleInfoFileUpload}
                        disabled={uploadingInfo}
                      />
                      {uploadingInfo && <p className="text-sm text-muted-foreground">Uploading...</p>}
                    </div>
                    {infoFileUrl && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <a href={infoFileUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          View uploaded file
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timing">Event Timing *</Label>
                    <Input
                      id="timing"
                      value={timing}
                      onChange={(e) => setTiming(e.target.value)}
                      placeholder="e.g., 9:00 AM - 5:00 PM"
                      required
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date *</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date *</Label>
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
                    <Label htmlFor="eventUrl">Event URL (Optional)</Label>
                    <Input
                      id="eventUrl"
                      type="url"
                      value={eventUrl}
                      onChange={(e) => setEventUrl(e.target.value)}
                      placeholder="https://example.com/event"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="contactEmail">Contact Email *</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="contact@institute.edu"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contactNumber">Contact Number *</Label>
                      <Input
                        id="contactNumber"
                        type="tel"
                        value={contactNumber}
                        onChange={(e) => setContactNumber(e.target.value)}
                        placeholder="+91 1234567890"
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={loading || uploadingBanner || uploadingInfo} className="w-full">
                    {loading ? "Creating..." : "Create Event"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="active" className="space-y-6 mt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {events.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="py-12 text-center">
                    <Trophy className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground">No events yet</p>
                    <p className="mt-2 text-sm text-muted-foreground">Create your first event to get started!</p>
                  </CardContent>
                </Card>
              ) : (
                events.map((event) => (
                  <Card key={event.id} className="overflow-hidden">
                    {event.banner_url && (
                      <div className="aspect-video w-full overflow-hidden bg-muted">
                        <img
                          src={event.banner_url || "/placeholder.svg"}
                          alt={event.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="line-clamp-2">{event.title}</CardTitle>
                      <CardDescription className="line-clamp-3">{event.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDateRange(event.start_date, event.end_date)}</span>
                      </div>
                      {event.timing && (
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">Timing:</span> {event.timing}
                        </div>
                      )}
                      {event.contact_email && (
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">Contact:</span> {event.contact_email}
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">{event.upvotes || 0} upvotes</Badge>
                        {event.event_url && (
                          <Button asChild size="sm" variant="outline">
                            <a href={event.event_url} target="_blank" rel="noopener noreferrer">
                              Visit
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
