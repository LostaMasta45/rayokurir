import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST() {
  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ ok: false, error: "Missing Supabase server env vars" }, { status: 500 })
    }

    const supabaseAdmin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const email = "admin@rayo.local"
    const password = "admin12345"

    // ensure user exists
    const { data: existing } = await supabaseAdmin.auth.admin.getUserByEmail(email)
    const userId =
      existing?.user?.id ||
      (await (async () => {
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        })
        if (error) throw error
        return data.user!.id
      })())

    // ensure profile exists with ADMIN role
    await supabaseAdmin
      .from("profiles")
      .upsert({ id: userId, name: "Administrator", role: "ADMIN" }, { onConflict: "id" })

    return NextResponse.json({ ok: true, email, password })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "bootstrap failed" }, { status: 500 })
  }
}
