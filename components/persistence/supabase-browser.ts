"use client"

import { createBrowserClient } from "@supabase/ssr"

let supabaseSingleton: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseBrowser() {
  if (!supabaseSingleton) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    supabaseSingleton = createBrowserClient(url, anon)
  }
  return supabaseSingleton
}
