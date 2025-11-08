"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Edit, Upload, LogOut, Plus, Trash2, Award, Briefcase } from "lucide-react"
import type { StudentProfile, UserAchievement, UserProject } from "@/lib/types"
import { BottomNav } from "@/components/bottom-nav"

export default function ProfilePage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [achievements, setAchievements] = useState<UserAchievement[]>([])
  const [userProjects, setUserProjects] = useState<UserProject[]>([])
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<StudentProfile>>({})
  const [profilePicture, setProfilePicture] = useState<File | null>(null)
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null)

  const [showAddAchievement, setShowAddAchievement] = useState(false)
  const [showAddProject, setShowAddProject] = useState(false)
  const [newAchievement, setNewAchievement] = useState({ title: "", description: "", date: "", image_url: "" })
  const [newProject, setNewProject] = useState({ title: "", description: "", date: "", banner_url: "", link: "" })

  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    fetchProfile()
    fetchAchievementsAndProjects()
  }, [])

  async function fetchProfile() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }

      const response = await fetch("/api/profile/me")
      const data = await response.json()
      setProfile(data)
      setFormData(data)
      setProfilePicturePreview(data.profile_picture_url || null)
    } catch (error) {
      console.error("Failed to fetch profile:", error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchAchievementsAndProjects() {
    try {
      const response = await fetch("/api/profile/me")
      if (response.ok) {
        const profileData = await response.json()

        const [achievementsRes, projectsRes] = await Promise.all([
          fetch(`/api/achievements?userId=${profileData.id}`),
          fetch(`/api/user-projects?userId=${profileData.id}`),
        ])

        if (achievementsRes.ok) {
          const achievementsData = await achievementsRes.json()
          setAchievements(achievementsData.achievements || [])
        }

        if (projectsRes.ok) {
          const projectsData = await projectsRes.json()
          setUserProjects(projectsData.projects || [])
        }
      }
    } catch (error) {
      console.error("Failed to fetch achievements and projects:", error)
    }
  }

  function handleProfilePictureChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setProfilePicture(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  async function uploadProfilePicture(file: File): Promise<string | null> {
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload-profile-picture", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to upload profile picture")
      }

      const data = await response.json()
      return data.url
    } catch (error) {
      console.error("Failed to upload profile picture:", error)
      return null
    }
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      if (profilePicture) {
        const profilePictureUrl = await uploadProfilePicture(profilePicture)
        if (profilePictureUrl) {
          formData.profile_picture_url = profilePictureUrl
        }
      }

      console.log("[v0] Updating profile with data:", JSON.stringify(formData).substring(0, 200))

      const response = await fetch("/api/profile/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      console.log("[v0] Update response status:", response.status)
      console.log("[v0] Update response content-type:", response.headers.get("content-type"))

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        console.error("[v0] Non-JSON response:", text.substring(0, 200))
        throw new Error("Server returned an invalid response. Please try again.")
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Failed to update profile: ${response.status}`)
      }

      console.log("[v0] Successfully updated profile")

      setProfile(data)
      setEditing(false)
      setProfilePicture(null)
    } catch (error: any) {
      console.error("[v0] Failed to update profile:", error.message)
      setError(error.message || "Failed to update profile. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  async function handleAddAchievement() {
    try {
      const response = await fetch("/api/achievements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAchievement),
      })

      if (response.ok) {
        setShowAddAchievement(false)
        setNewAchievement({ title: "", description: "", date: "", image_url: "" })
        fetchAchievementsAndProjects()
      }
    } catch (error) {
      console.error("Failed to add achievement:", error)
    }
  }

  async function handleDeleteAchievement(id: string) {
    try {
      const response = await fetch(`/api/achievements?id=${id}`, { method: "DELETE" })
      if (response.ok) {
        fetchAchievementsAndProjects()
      }
    } catch (error) {
      console.error("Failed to delete achievement:", error)
    }
  }

  async function handleAddProject() {
    try {
      const response = await fetch("/api/user-projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProject),
      })

      if (response.ok) {
        setShowAddProject(false)
        setNewProject({ title: "", description: "", date: "", banner_url: "", link: "" })
        fetchAchievementsAndProjects()
      }
    } catch (error) {
      console.error("Failed to add project:", error)
    }
  }

  async function handleDeleteProject(id: string) {
    try {
      const response = await fetch(`/api/user-projects?id=${id}`, { method: "DELETE" })
      if (response.ok) {
        fetchAchievementsAndProjects()
      }
    } catch (error) {
      console.error("Failed to delete project:", error)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/")
  }

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>
  if (!profile) return <div className="flex h-screen items-center justify-center">Profile not found</div>

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold text-primary">CollabHub</h1>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-16">
        <div className="container mx-auto px-4 py-8">
          <div className="mx-auto max-w-3xl space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>My Profile</CardTitle>
                  {!editing && (
                    <Button onClick={() => setEditing(true)} variant="outline">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Profile
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {error && <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

                {editing ? (
                  <div className="space-y-4">
                    <div className="flex flex-col items-center space-y-4">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={profilePicturePreview || undefined} />
                        <AvatarFallback>{formData.name ? formData.name[0].toUpperCase() : "?"}</AvatarFallback>
                      </Avatar>
                      <Label
                        htmlFor="profile-picture"
                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-input bg-background px-4 py-2 text-sm hover:bg-accent"
                      >
                        <Upload className="h-4 w-4" />
                        Change Profile Picture
                      </Label>
                      <Input
                        id="profile-picture"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleProfilePictureChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={formData.name || ""}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="college">College</Label>
                        <Input
                          id="college"
                          value={formData.college || ""}
                          onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="branch">Branch</Label>
                        <Input
                          id="branch"
                          value={formData.branch || ""}
                          onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="year">Year</Label>
                      <Input
                        id="year"
                        type="number"
                        value={formData.year || ""}
                        onChange={(e) => setFormData({ ...formData, year: Number.parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="1234567890"
                        pattern="[0-9]{10}"
                        value={formData.phone || ""}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">10-digit phone number</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="skills">Skills (comma-separated)</Label>
                      <Input
                        id="skills"
                        value={formData.skills?.join(", ") || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, skills: e.target.value.split(",").map((s) => s.trim()) })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="interests">Interests (comma-separated)</Label>
                      <Input
                        id="interests"
                        value={formData.interests?.join(", ") || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, interests: e.target.value.split(",").map((s) => s.trim()) })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={formData.bio || ""}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        rows={4}
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="github">GitHub</Label>
                        <Input
                          id="github"
                          value={formData.github || ""}
                          onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="linkedin">LinkedIn</Label>
                        <Input
                          id="linkedin"
                          value={formData.linkedin || ""}
                          onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="portfolio">Portfolio</Label>
                        <Input
                          id="portfolio"
                          value={formData.portfolio || ""}
                          onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSave} disabled={saving}>
                        {saving ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditing(false)
                          setError(null)
                          setProfilePicture(null)
                          setProfilePicturePreview(profile?.profile_picture_url || null)
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={profile.profile_picture_url || undefined} />
                        <AvatarFallback className="text-2xl">
                          {profile.name ? profile.name[0].toUpperCase() : "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-2xl font-bold">{profile.name}</h3>
                        <p className="text-muted-foreground">{profile.email}</p>
                      </div>
                    </div>

                    {profile.bio && (
                      <div>
                        <h4 className="mb-2 font-semibold">Bio</h4>
                        <p className="text-muted-foreground">{profile.bio}</p>
                      </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-3">
                      {profile.college && (
                        <div>
                          <h4 className="mb-1 text-sm font-semibold">College</h4>
                          <p className="text-sm text-muted-foreground">{profile.college}</p>
                        </div>
                      )}
                      {profile.branch && (
                        <div>
                          <h4 className="mb-1 text-sm font-semibold">Branch</h4>
                          <p className="text-sm text-muted-foreground">{profile.branch}</p>
                        </div>
                      )}
                      {profile.year && (
                        <div>
                          <h4 className="mb-1 text-sm font-semibold">Year</h4>
                          <p className="text-sm text-muted-foreground">Year {profile.year}</p>
                        </div>
                      )}
                    </div>

                    {profile.phone && (
                      <div>
                        <h4 className="mb-2 font-semibold">Contact</h4>
                        <p className="text-sm text-muted-foreground">Phone: {profile.phone}</p>
                      </div>
                    )}

                    {profile.skills && profile.skills.length > 0 && (
                      <div>
                        <h4 className="mb-2 font-semibold">Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {profile.skills.map((skill, idx) => (
                            <Badge key={idx} variant="secondary">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {profile.interests && profile.interests.length > 0 && (
                      <div>
                        <h4 className="mb-2 font-semibold">Interests</h4>
                        <div className="flex flex-wrap gap-2">
                          {profile.interests.map((interest, idx) => (
                            <Badge key={idx} variant="outline">
                              {interest}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {(profile.github || profile.linkedin || profile.portfolio) && (
                      <div>
                        <h4 className="mb-2 font-semibold">Links</h4>
                        <div className="flex flex-wrap gap-2">
                          {profile.github && (
                            <Button asChild variant="outline" size="sm">
                              <a href={profile.github} target="_blank" rel="noopener noreferrer">
                                GitHub
                              </a>
                            </Button>
                          )}
                          {profile.linkedin && (
                            <Button asChild variant="outline" size="sm">
                              <a href={profile.linkedin} target="_blank" rel="noopener noreferrer">
                                LinkedIn
                              </a>
                            </Button>
                          )}
                          {profile.portfolio && (
                            <Button asChild variant="outline" size="sm">
                              <a href={profile.portfolio} target="_blank" rel="noopener noreferrer">
                                Portfolio
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    <CardTitle>Past Achievements</CardTitle>
                  </div>
                  <Button onClick={() => setShowAddAchievement(true)} size="sm" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {showAddAchievement && (
                  <div className="space-y-3 rounded-lg border p-4">
                    <Input
                      placeholder="Title"
                      value={newAchievement.title}
                      onChange={(e) => setNewAchievement({ ...newAchievement, title: e.target.value })}
                    />
                    <Textarea
                      placeholder="Description"
                      value={newAchievement.description}
                      onChange={(e) => setNewAchievement({ ...newAchievement, description: e.target.value })}
                    />
                    <Input
                      type="date"
                      value={newAchievement.date}
                      onChange={(e) => setNewAchievement({ ...newAchievement, date: e.target.value })}
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleAddAchievement} size="sm">
                        Save
                      </Button>
                      <Button onClick={() => setShowAddAchievement(false)} size="sm" variant="outline">
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {achievements.length === 0 && !showAddAchievement ? (
                  <p className="text-center text-muted-foreground">No achievements yet. Add your first one!</p>
                ) : (
                  achievements.map((achievement) => (
                    <div key={achievement.id} className="flex items-start justify-between border-b pb-4 last:border-0">
                      <div className="flex-1">
                        <h4 className="font-semibold">{achievement.title}</h4>
                        {achievement.date && (
                          <p className="text-sm text-muted-foreground">
                            {new Date(achievement.date).toLocaleDateString()}
                          </p>
                        )}
                        {achievement.description && <p className="mt-1 text-sm">{achievement.description}</p>}
                      </div>
                      <Button
                        onClick={() => handleDeleteAchievement(achievement.id)}
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    <CardTitle>Past Projects</CardTitle>
                  </div>
                  <Button onClick={() => setShowAddProject(true)} size="sm" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {showAddProject && (
                  <div className="space-y-3 rounded-lg border p-4">
                    <Input
                      placeholder="Project Title"
                      value={newProject.title}
                      onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                    />
                    <Textarea
                      placeholder="Description"
                      value={newProject.description}
                      onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    />
                    <Input
                      type="date"
                      value={newProject.date}
                      onChange={(e) => setNewProject({ ...newProject, date: e.target.value })}
                    />
                    <Input
                      placeholder="Project Link (optional)"
                      value={newProject.link}
                      onChange={(e) => setNewProject({ ...newProject, link: e.target.value })}
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleAddProject} size="sm">
                        Save
                      </Button>
                      <Button onClick={() => setShowAddProject(false)} size="sm" variant="outline">
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {userProjects.length === 0 && !showAddProject ? (
                  <p className="text-center text-muted-foreground">No projects yet. Add your first one!</p>
                ) : (
                  userProjects.map((project) => (
                    <div key={project.id} className="flex items-start justify-between border-b pb-4 last:border-0">
                      <div className="flex-1">
                        <h4 className="font-semibold">{project.title}</h4>
                        {project.date && (
                          <p className="text-sm text-muted-foreground">{new Date(project.date).toLocaleDateString()}</p>
                        )}
                        {project.description && <p className="mt-1 text-sm">{project.description}</p>}
                        {project.link && (
                          <Button asChild className="mt-2" size="sm" variant="link">
                            <a href={project.link} target="_blank" rel="noopener noreferrer">
                              View Project
                            </a>
                          </Button>
                        )}
                      </div>
                      <Button
                        onClick={() => handleDeleteProject(project.id)}
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
