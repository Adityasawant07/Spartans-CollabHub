import Link from "next/link"
import { Button } from "@/components/ui/button"
export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 via-pink-500 to-purple-500 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-2xl">
            <img src="/logo.png" alt="CollabHub Logo" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Title and Tagline */}
        <div className="space-y-3">
          <h1 className="text-5xl font-bold text-white tracking-tight">CollabHub</h1>
          <p className="text-xl text-white/90 font-medium">Connect. Collaborate. Create.</p>
        </div>

        {/* Call to Action Buttons */}
        <div className="space-y-4 pt-8">
          <Button
            asChild
            size="lg"
            className="w-full bg-white text-indigo-600 hover:bg-indigo-50 font-semibold text-lg py-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            <Link href="/auth/sign-up">Sign Up</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="w-full bg-transparent border-2 border-white text-white hover:bg-white/10 font-semibold text-lg py-6 rounded-xl"
          >
            <Link href="/auth/login">Login</Link>
          </Button>
        </div>

        {/* Organizer Link */}
        <div className="pt-4">
          <Link href="/organizer/login" className="text-indigo-100 hover:text-white text-sm underline">
            Are you an organizer?
          </Link>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl" />
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
    </div>
  )
}
