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
  const [instituteCode, setInstituteCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const verifyResponse = await fetch(`/api/organizer/verify-code?code=${instituteCode}`)
      if (!verifyResponse.ok) {
        throw new Error("Invalid Institute Code")
      }

      const response = await fetch("/api/organizer/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, instituteCode }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to login")
      }

      // Store organizer session
      localStorage.setItem("organizer", JSON.stringify(data.organizer))
      router.push("/organizer/dashboard")
    } catch (err: any) {
      setError(err.message || "Failed to login")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-primary/10 p-3">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-center">Organizer Login</CardTitle>
          <CardDescription className="text-center">
            Login with your verified institute code to manage competitions and events
          </CardDescription>
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
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instituteCode">Institute Code</Label>
              <Input
                id="instituteCode"
                type="text"
                placeholder="INST2025"
                value={instituteCode}
                onChange={(e) => setInstituteCode(e.target.value.toUpperCase())}
                required
              />
              <p className="text-xs text-muted-foreground">
                Contact your institute admin to get your unique institute code
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Verifying..." : "Login as Organizer"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Student?{" "}
            <Link href="/auth/login" className="text-primary hover:underline">
              Login here
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
