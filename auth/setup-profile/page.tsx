"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Upload } from "lucide-react"

export default function SetupProfilePage() {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [college, setCollege] = useState("")
  const [branch, setBranch] = useState("")
  const [year, setYear] = useState("")
  const [skills, setSkills] = useState("")
  const [interests, setInterests] = useState("")
  const [bio, setBio] = useState("")
  const [profilePicture, setProfilePicture] = useState<File | null>(null)
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
      }
    }
    checkAuth()
  }, [router, supabase])

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

  async function uploadProfilePicture(userId: string): Promise<string | null> {
    if (!profilePicture) return null

    const fileExt = profilePicture.name.split(".").pop()
    const fileName = `${userId}/${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage.from("profile-pictures").upload(fileName, profilePicture)

    if (uploadError) {
      console.error("Failed to upload profile picture:", uploadError)
      return null
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("profile-pictures").getPublicUrl(fileName)

    return publicUrl
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const skillsArray = skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
      const interestsArray = interests
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)

      const profilePictureUrl = await uploadProfilePicture(user.id)

      const { error: insertError } = await supabase.from("student_profiles").insert({
        user_id: user.id,
        email: user.email!,
        name,
        phone: phone || null,
        profile_picture_url: profilePictureUrl,
        college: college || null,
        branch: branch || null,
        year: year ? Number.parseInt(year) : null,
        skills: skillsArray,
        interests: interestsArray,
        bio: bio || null,
      })

      if (insertError) throw insertError

      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message || "Failed to create profile")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Complete Your Profile</CardTitle>
          <CardDescription>Tell us about yourself to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profilePicturePreview || undefined} />
                <AvatarFallback>{name ? name[0].toUpperCase() : "?"}</AvatarFallback>
              </Avatar>
              <Label
                htmlFor="profile-picture"
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-input bg-background px-4 py-2 text-sm hover:bg-accent"
              >
                <Upload className="h-4 w-4" />
                Upload Profile Picture
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
              <Label htmlFor="name">Full Name *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="1234567890"
                pattern="[0-9]{10}"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">10-digit phone number for contact</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="college">College</Label>
                <Input id="college" value={college} onChange={(e) => setCollege(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branch">Branch/Major</Label>
                <Input id="branch" value={branch} onChange={(e) => setBranch(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Year of Study</Label>
              <Input id="year" type="number" min="1" max="6" value={year} onChange={(e) => setYear(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="skills">Skills (comma-separated)</Label>
              <Input
                id="skills"
                placeholder="React, Python, Machine Learning"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="interests">Interests (comma-separated)</Label>
              <Input
                id="interests"
                placeholder="Web Development, AI, Robotics"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating profile..." : "Complete Setup"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
