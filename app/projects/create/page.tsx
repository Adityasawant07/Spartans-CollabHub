"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

const PROJECT_CATEGORIES = ["Hackathon", "Web Dev", "Mobile App", "AI/ML", "Research", "Other"]

export default function CreateProjectPage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [requiredSkills, setRequiredSkills] = useState("")
  const [category, setCategory] = useState("")
  const [teamSize, setTeamSize] = useState("")
  const [difficulty, setDifficulty] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [authChecking, setAuthChecking] = useState(true)
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
      } else {
        setAuthChecking(false)
      }
    }
    checkAuth()
  }, [router, supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!category) {
      setError("Please select a category")
      return
    }

    if (!teamSize) {
      setError("Please enter team size")
      return
    }

    if (!difficulty) {
      setError("Please select difficulty level")
      return
    }

    setLoading(true)

    try {
      const skillsArray = requiredSkills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          tags: [category],
          required_skills: skillsArray,
          category,
          attachments: [
            {
              type: "metadata",
              team_size: Number.parseInt(teamSize),
              difficulty: difficulty,
            },
          ],
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create project")
      }

      setShowSuccess(true)
      setTimeout(() => {
        router.push(`/projects/${data.id}`)
      }, 1500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (authChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 via-yellow-50 to-pink-50">
        <p className="text-lg text-gray-600">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-pink-50">
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-5">
          <Card className="border-2 border-green-500 bg-white shadow-2xl">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-full bg-gradient-to-r from-green-500 to-emerald-500 p-2">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-green-700">Success!</p>
                <p className="text-sm text-gray-600">Task created successfully</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Button asChild variant="ghost" className="text-gray-700 hover:text-gray-900">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="mx-auto max-w-2xl bg-white/90 backdrop-blur-sm border-2 border-orange-200 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
              Create New Task
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Task Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter task title"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your task..."
                  rows={6}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger className="bg-white focus:bg-white">
                    <SelectValue placeholder="Select a category (required)" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {PROJECT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">This helps AI match you with teammates</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="teamSize">Team Size *</Label>
                <Input
                  id="teamSize"
                  type="number"
                  min="2"
                  max="20"
                  value={teamSize}
                  onChange={(e) => setTeamSize(e.target.value)}
                  placeholder="Enter team size (e.g., 3, 5)"
                  required
                />
                <p className="text-xs text-muted-foreground">How many people do you need for this task?</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty Level *</Label>
                <Select value={difficulty} onValueChange={setDifficulty} required>
                  <SelectTrigger className="bg-white focus:bg-white">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="easy">
                      <div className="flex items-center gap-2">
                        <span className="text-green-500">●</span>
                        Easy
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-500">●</span>
                        Medium
                      </div>
                    </SelectItem>
                    <SelectItem value="hard">
                      <div className="flex items-center gap-2">
                        <span className="text-red-500">●</span>
                        Hard
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">How challenging is this task?</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="requiredSkills">Required Skills (comma-separated)</Label>
                <Input
                  id="requiredSkills"
                  value={requiredSkills}
                  onChange={(e) => setRequiredSkills(e.target.value)}
                  placeholder="React, Node.js, Python"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-lg"
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Task"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
