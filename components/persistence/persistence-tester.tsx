"use client"

import type React from "react"

import { useState, useMemo } from "react"
import useSWR from "swr"
import { getSupabaseBrowser } from "./supabase-browser"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type NoteRow = {
  note: string | null
  updated_at: string | null
}

export default function PersistenceTester() {
  const supabase = getSupabaseBrowser()

  // Auth state via SWR (no useEffect fetching)
  const {
    data: authData,
    isLoading: authLoading,
    mutate: refetchAuth,
  } = useSWR(
    "auth-user",
    async () => {
      const { data, error } = await supabase.auth.getUser()
      if (error) throw error
      return data.user ?? null
    },
    { revalidateOnFocus: false },
  )

  const userId = useMemo(() => authData?.id ?? null, [authData])

  // Preferences state via SWR, dependent on userId
  const {
    data: noteRow,
    isLoading: noteLoading,
    error: noteError,
    mutate: refetchNote,
  } = useSWR<NoteRow | null>(
    userId ? ["user-prefs", userId] : null,
    async () => {
      const { data, error } = await supabase
        .from("user_prefs")
        .select("note, updated_at")
        .eq("user_id", userId!)
        .maybeSingle() // returns null if not found
      if (error) throw error
      return data ?? { note: null, updated_at: null }
    },
    { revalidateOnFocus: false },
  )

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const [note, setNote] = useState<string>("")
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string>("")

  // Pre-fill textarea when noteRow changes
  const currentNote = noteRow?.note ?? ""
  const hasLoadedNote = !noteLoading && noteRow !== undefined

  // Sign in
  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setSaveMessage("")
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      setSaveMessage(`Gagal login: ${error.message}`)
      return
    }
    await refetchAuth()
    setSaveMessage("Berhasil login.")
  }

  // Sign out
  async function handleSignOut() {
    setSaveMessage("")
    await supabase.auth.signOut()
    await refetchAuth()
  }

  // Save note to Supabase (upsert)
  async function handleSaveNote() {
    if (!userId) {
      setSaveMessage("Silakan login terlebih dahulu.")
      return
    }
    setSaving(true)
    setSaveMessage("")
    const { error } = await supabase
      .from("user_prefs")
      .upsert({ user_id: userId, note, updated_at: new Date().toISOString() }, { onConflict: "user_id" })
    setSaving(false)
    if (error) {
      setSaveMessage(`Gagal menyimpan: ${error.message}`)
      return
    }
    setSaveMessage("Catatan tersimpan.")
    await refetchNote()
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-balance">Tes Persistensi Supabase</h1>
        <p className="text-sm text-muted-foreground text-pretty">
          Login dengan akun Anda, simpan catatan, lalu buka di browser lain—catatan akan tetap ada karena disimpan di
          database Supabase.
        </p>
      </header>

      {!authLoading && !authData && (
        <form onSubmit={handleSignIn} className="space-y-4 rounded-lg border p-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@contoh.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
            <p className="text-xs text-muted-foreground">Gunakan: qurbanjombang@gmail.com</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <p className="text-xs text-muted-foreground">Gunakan: bismillahsukses</p>
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit">Login</Button>
          </div>
          {saveMessage && <p className="text-sm text-muted-foreground">{saveMessage}</p>}
        </form>
      )}

      {authData && (
        <div className="space-y-4 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Login sebagai: <span className="font-medium">{authData.email}</span>
            </div>
            <Button variant="secondary" onClick={handleSignOut}>
              Logout
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Catatan (tersimpan di Supabase)</Label>
            <Textarea
              id="note"
              placeholder="Tulis catatan di sini..."
              value={hasLoadedNote ? note : currentNote}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-32"
            />
            <p className="text-xs text-muted-foreground">
              Terakhir diperbarui: {noteRow?.updated_at ? new Date(noteRow.updated_at).toLocaleString() : "-"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleSaveNote} disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan Catatan"}
            </Button>
            {saveMessage && <p className="text-sm text-muted-foreground">{saveMessage}</p>}
          </div>
        </div>
      )}

      {!authLoading && authData && noteError && (
        <p className="text-sm text-destructive">Gagal memuat catatan: {String(noteError.message ?? noteError)}</p>
      )}
    </div>
  )
}
