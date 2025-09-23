import { createClient } from "@supabase/supabase-js"

export function getSupabaseAdmin() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing")
  }
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })
}
