import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

let supabaseBrowser: SupabaseClient | null = null

export function getSupabaseBrowserClient() {
  if (!supabaseBrowser) {
    supabaseBrowser = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
  }
  return supabaseBrowser
}

export function getSupabaseBrowser() {
  return getSupabaseBrowserClient()
}
