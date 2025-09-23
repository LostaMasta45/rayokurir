"use client"

import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

export type AppRole = "ADMIN" | "KURIR"
export interface AppUser {
  id: string
  name: string
  role: AppRole
}

export async function signInWithPassword(email: string, password: string) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
  return await getCurrentUser()
}

export async function signOut() {
  const supabase = getSupabaseBrowserClient()
  await supabase.auth.signOut()
}

export async function getCurrentUser(): Promise<AppUser | null> {
  const supabase = getSupabaseBrowserClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return null

  const { data: profile } = await supabase.from("profiles").select("name, role").eq("id", auth.user.id).maybeSingle()

  return {
    id: auth.user.id,
    name: profile?.name || auth.user.email || "User",
    role: (profile?.role as AppRole) || "ADMIN",
  }
}
