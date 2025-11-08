import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Users, Calendar, BookOpen, MessageCircle } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary" />
            <span className="font-semibold text-xl">CollabHub</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              About
            </a>
            <a href="#contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="border-primary text-primary hover:bg-primary/10 bg-transparent"
            >
              <Link href="/organizer/login">Organizer Login</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/auth/login">Log in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/auth/sign-up">Sign up</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            {"Join thousands of students collaborating on projects"}
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-balance leading-tight">
            {"Collaborate, create, and "}
            <span className="text-primary">{"connect"}</span>
          </h1>
          <p className="text-xl text-muted-foreground text-balance max-w-2xl mx-auto leading-relaxed">
            {
              "Find project partners, discover collaborators, and connect with students who share your vision. CollabHub makes teamwork effortless."
            }
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button size="lg" className="w-full sm:w-auto" asChild>
              <Link href="/auth/sign-up">{"Get started—it's free"}</Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent" asChild>
              <Link href="#features">{"Explore the platform"}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-xl">{"Find Your Team"}</h3>
            <p className="text-muted-foreground leading-relaxed">
              {
                "Connect with students who share your skills and interests. Build the perfect team for your next project."
              }
            </p>
          </Card>

          <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-xl">{"Project Discovery"}</h3>
            <p className="text-muted-foreground leading-relaxed">
              {"Discover exciting projects, join innovative teams, and contribute to ideas that matter to you."}
            </p>
          </Card>

          <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-xl">{"Skill Matching"}</h3>
            <p className="text-muted-foreground leading-relaxed">
              {"Find collaborators with complementary skills. From coding to design, connect with the right people."}
            </p>
          </Card>

          <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-xl">{"Real-Time Chat"}</h3>
            <p className="text-muted-foreground leading-relaxed">
              {"Built-in messaging keeps your team connected. Discuss ideas, share updates, and stay in sync."}
            </p>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-primary text-primary-foreground p-12 md:p-16 text-center space-y-6">
          <h2 className="text-4xl md:text-5xl font-bold text-balance">{"Ready to bring your ideas to life?"}</h2>
          <p className="text-lg text-primary-foreground/90 max-w-2xl mx-auto text-balance leading-relaxed">
            {"Join CollabHub today and turn your vision into reality with the perfect team."}
          </p>
          <Button size="lg" variant="secondary" className="mt-4" asChild>
            <Link href="/auth/sign-up">{"Create your free account"}</Link>
          </Button>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-primary" />
              <span className="font-semibold">CollabHub</span>
            </div>
            <p className="text-sm text-muted-foreground">{"© 2025 CollabHub. All rights reserved."}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
