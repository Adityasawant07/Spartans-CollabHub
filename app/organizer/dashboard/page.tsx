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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Building2, CalendarIcon, Trophy, LogOut, ArrowLeft, FileText, Download } from "lucide-react"
import type { Competition } from "@/lib/types"
import { cn } from "@/lib/utils"

export default function OrganizerDashboardPage() {
  const [organizer, setOrganizer] = useState<any | null>(null)
  const [events, setEvents] = useState<Competition[]>([])
  const [loading, setLoading] = useState(false)
  const [authChecking, setAuthChecking] = useState(true)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [endSession, setEndSession] = useState<Date | undefined>(undefined)
  const [timing, setTiming] = useState("")
  const [contactNumber, setContactNumber] = useState("")
  const [email, setEmail] = useState("")
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [infoFile, setInfoFile] = useState<File | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("home")

  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const organizerData = localStorage.getItem("organizer")

      if (!organizerData) {
        router.push("/organizer/login")
        return
      }

      const parsedOrganizer = JSON.parse(organizerData)
      setOrganizer(parsedOrganizer)
      fetchEvents()
    } catch (error) {
      console.error("Auth check failed:", error)
      router.push("/organizer/login")
    } finally {
      setAuthChecking(false)
    }
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

  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      let bannerUrl = ""
      let infoFileUrl = ""

      if (bannerFile) {
        const formData = new FormData()
        formData.append("file", bannerFile)
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          bannerUrl = uploadData.url
        }
      }

      if (infoFile) {
        const formData = new FormData()
        formData.append("file", infoFile)
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          infoFileUrl = uploadData.url
        }
      }

      const eventData: any = {
        title,
        description,
        start_date: startDate?.toISOString().split("T")[0],
        end_date: endDate?.toISOString().split("T")[0],
        organizer_id: organizer.organizer_id || organizer.id,
      }

      if (endSession) eventData.end_session = endSession.toISOString()
      if (timing) eventData.timing = timing
      if (contactNumber) eventData.contact_number = contactNumber
      if (email) eventData.email = email
      if (bannerUrl) eventData.banner_url = bannerUrl
      if (infoFileUrl) eventData.info_file_url = infoFileUrl

      const method = editingEventId ? "PUT" : "POST"
      const url = editingEventId ? `/api/competitions/${editingEventId}` : "/api/competitions"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to ${editingEventId ? "update" : "create"} event`)
      }

      // Reset form
      setTitle("")
      setDescription("")
      setStartDate(undefined)
      setEndDate(undefined)
      setEndSession(undefined)
      setTiming("")
      setContactNumber("")
      setEmail("")
      setBannerFile(null)
      setInfoFile(null)
      setEditingEventId(null)

      fetchEvents()
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)

      // Switch to active events tab after success
      setActiveTab("active")
    } catch (error: any) {
      console.error("Failed to create/update event:", error)
      alert(error.message || "Failed to create/update event")
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    localStorage.removeItem("organizer")
    router.push("/organizer/login")
  }

  async function handleDeleteEvent(eventId: string) {
    if (!confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/competitions/${eventId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete event")
      }

      fetchEvents()
      alert("Event deleted successfully")
    } catch (error) {
      console.error("Failed to delete event:", error)
      alert("Failed to delete event")
    }
  }

  async function handleEditEvent(event: Competition) {
    setTitle(event.title)
    setDescription(event.description)
    setStartDate(new Date(event.start_date))
    setEndDate(new Date(event.end_date))
    setTiming(event.timing || "")
    setContactNumber(event.contact_number || "")
    setEmail(event.email || "")
    setEditingEventId(event.id)
    setActiveTab("create")

    // Scroll to top for better UX
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }, 100)
  }

  function handleCancelEdit() {
    setTitle("")
    setDescription("")
    setStartDate(undefined)
    setEndDate(undefined)
    setEndSession(undefined)
    setTiming("")
    setContactNumber("")
    setEmail("")
    setBannerFile(null)
    setInfoFile(null)
    setEditingEventId(null)
    setActiveTab("active")
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

  if (authChecking) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-orange-50 via-yellow-50 to-pink-50">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (!organizer) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-pink-50">
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-5">
          <Card className="border-2 border-green-500 bg-white shadow-2xl">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-full bg-gradient-to-r from-green-500 to-emerald-500 p-2">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-green-700">Success!</p>
                <p className="text-sm text-gray-600">
                  {editingEventId ? "Event updated" : "Event created"} successfully
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-gradient-to-br from-orange-500 to-pink-500 p-2">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                  Organizer Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">{organizer.organization_name || organizer.full_name}</p>
                <p className="text-xs text-muted-foreground">Email: {organizer.email}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-orange-200 hover:bg-orange-50 bg-transparent"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3 bg-white">
            <TabsTrigger value="home">Home</TabsTrigger>
            <TabsTrigger value="create">{editingEventId ? "Edit Event" : "Create Event"}</TabsTrigger>
            <TabsTrigger value="active">Active Events</TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="space-y-6 mt-6">
            <Card className="bg-white/80 backdrop-blur-sm border-orange-100">
              <CardHeader>
                <CardTitle className="bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                  Welcome, {organizer.organization_name || organizer.full_name}!
                </CardTitle>
                <CardDescription>Manage your institute's events</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="border-orange-100">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                        {events.length}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-orange-100">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Active Events</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                        {events.filter((e) => new Date(e.end_date) >= new Date()).length}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-orange-100">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Total Upvotes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                        {events.reduce((sum, e) => sum + (e.upvotes || 0), 0)}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create" className="space-y-6 mt-6">
            {editingEventId && (
              <div className="mb-4 flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelEdit}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Events
                </Button>
              </div>
            )}

            <Card className="bg-white/80 backdrop-blur-sm border-orange-100">
              <CardHeader>
                <CardTitle className="bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                  {editingEventId ? "Edit Event" : "Create New Event"}
                </CardTitle>
                <CardDescription>
                  {editingEventId ? "Update event details" : "Add a new event for students"}
                </CardDescription>
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
                      className="bg-white focus:bg-white"
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
                      className="bg-white focus:bg-white"
                      required
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal bg-white hover:bg-white",
                              !startDate && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? (
                              startDate.toLocaleDateString("en-US", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })
                            ) : (
                              <span>Pick start date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-white" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="endDate">Event End Date *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal bg-white hover:bg-white",
                              !endDate && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? (
                              endDate.toLocaleDateString("en-US", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })
                            ) : (
                              <span>Pick end date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-white" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            disabled={(date) => (startDate ? date < startDate : date < new Date())}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endSession">Registration Close Date (Optional)</Label>
                    <p className="text-xs text-muted-foreground">
                      When will registrations/applications automatically close?
                    </p>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal bg-white hover:bg-white",
                            !endSession && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endSession ? (
                            endSession.toLocaleDateString("en-US", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })
                          ) : (
                            <span>Pick registration close date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-white" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={endSession}
                          onSelect={setEndSession}
                          disabled={(date) => {
                            if (startDate && endDate) {
                              return date < startDate || date > endDate
                            }
                            return date < new Date()
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timing">Event Timing (Optional)</Label>
                    <Input
                      id="timing"
                      value={timing}
                      onChange={(e) => setTiming(e.target.value)}
                      placeholder="e.g., 9:00 AM - 5:00 PM IST"
                      className="bg-white focus:bg-white"
                    />
                  </div>

                  <div className="space-y-4 border-t pt-4">
                    <h3 className="font-semibold text-sm">Event Media (Optional)</h3>

                    <div className="space-y-2">
                      <Label htmlFor="banner">Banner Image</Label>
                      <p className="text-xs text-muted-foreground">Maximum file size: 10MB</p>
                      <div className="flex items-center gap-2">
                        <Input
                          id="banner"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file && file.size > 10 * 1024 * 1024) {
                              alert(`File size (${(file.size / (1024 * 1024)).toFixed(2)}MB) exceeds 10MB limit`)
                              e.target.value = ""
                            } else {
                              setBannerFile(file || null)
                            }
                          }}
                          className="bg-white focus:bg-white"
                        />
                        {bannerFile && <Badge variant="secondary">{bannerFile.name}</Badge>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="infoFile">Info Document/PDF</Label>
                      <p className="text-xs text-muted-foreground">
                        Maximum file size: 10MB. Supported: PDF, DOC, DOCX
                      </p>
                      <div className="flex items-center gap-2">
                        <Input
                          id="infoFile"
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file && file.size > 10 * 1024 * 1024) {
                              alert(`File size (${(file.size / (1024 * 1024)).toFixed(2)}MB) exceeds 10MB limit`)
                              e.target.value = ""
                            } else {
                              setInfoFile(file || null)
                            }
                          }}
                          className="bg-white focus:bg-white"
                        />
                        {infoFile && <Badge variant="secondary">{infoFile.name}</Badge>}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 border-t pt-4">
                    <h3 className="font-semibold text-sm">Contact Information (Optional)</h3>

                    <div className="space-y-2">
                      <Label htmlFor="email">Contact Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="event@example.com"
                        className="bg-white focus:bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contactNumber">Contact Number</Label>
                      <Input
                        id="contactNumber"
                        type="tel"
                        value={contactNumber}
                        onChange={(e) => setContactNumber(e.target.value)}
                        placeholder="+1 234 567 8900"
                        className="bg-white focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
                    >
                      {loading
                        ? editingEventId
                          ? "Updating..."
                          : "Creating..."
                        : editingEventId
                          ? "Update Event"
                          : "Create Event"}
                    </Button>
                    {editingEventId && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancelEdit}
                        className="flex-1 bg-transparent"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="active" className="space-y-6 mt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {events.length === 0 ? (
                <Card className="col-span-full bg-white/80 backdrop-blur-sm border-orange-100">
                  <CardContent className="py-12 text-center">
                    <Trophy className="mx-auto mb-4 h-12 w-12 text-orange-400" />
                    <p className="text-muted-foreground">No events yet</p>
                    <p className="mt-2 text-sm text-muted-foreground">Create your first event to get started!</p>
                  </CardContent>
                </Card>
              ) : (
                events.map((event) => (
                  <Card key={event.id} className="overflow-hidden bg-white/80 backdrop-blur-sm border-orange-100">
                    <CardHeader>
                      <CardTitle className="line-clamp-2">{event.title}</CardTitle>
                      <CardDescription className="line-clamp-3">{event.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarIcon className="h-4 w-4" />
                        <span>{formatDateRange(event.start_date, event.end_date)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge
                          variant="secondary"
                          className="bg-gradient-to-r from-orange-100 to-pink-100 text-orange-700"
                        >
                          {event.upvotes || 0} upvotes
                        </Badge>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() => handleEditEvent(event)}
                          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                        >
                          Edit
                        </Button>
                        {/* Removed delete button as requested */}
                      </div>
                      {(event.banner_url || event.info_file_url) && (
                        <div className="flex gap-2 pt-2">
                          {event.banner_url && (
                            <Button size="sm" variant="outline" asChild className="flex-1 bg-transparent">
                              <a href={event.banner_url} download target="_blank" rel="noopener noreferrer">
                                <Download className="mr-2 h-4 w-4" />
                                Banner
                              </a>
                            </Button>
                          )}
                          {event.info_file_url && (
                            <Button size="sm" variant="outline" asChild className="flex-1 bg-transparent">
                              <a href={event.info_file_url} download target="_blank" rel="noopener noreferrer">
                                <FileText className="mr-2 h-4 w-4" />
                                File
                              </a>
                            </Button>
                          )}
                        </div>
                      )}
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
