"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Building2 } from "lucide-react"

export default function OrganizerLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!email || !password) {
      alert("Email and password are required")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/organizer/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || "Invalid email or password")
        alert(errorData.error || "Invalid email or password")
        return
      }

      const data = await response.json()

      // Store organizer info in localStorage
      localStorage.setItem("organizer", JSON.stringify(data.organizer))

      router.push("/organizer/dashboard")
    } catch (err: any) {
      alert(err.message || "Failed to login")
      setError(err.message || "Failed to login")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 via-yellow-50 to-pink-50 p-4">
      <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm border-2 border-orange-200 shadow-xl">
        <CardHeader>
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-gradient-to-br from-orange-500 to-pink-500 p-4 shadow-lg">
              <Building2 className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-center text-2xl bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
            Organizer Login
          </CardTitle>
          <CardDescription className="text-center">Login with your credentials to manage competitions</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="organizer@institute.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-lg"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Login as Organizer"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-600">
            Student?{" "}
            <Link href="/auth/login" className="text-orange-600 hover:text-orange-700 hover:underline font-medium">
              Login here
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
