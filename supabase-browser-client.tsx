import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr"

export function createBrowserClient(url: string, anonKey: string) {
  return createSupabaseBrowserClient(url, anonKey)
}
