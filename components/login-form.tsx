"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { FormField, FormInput } from "@/components/ui/form-field"
import { signInWithPassword } from "@/lib/auth-supa"
import { toast } from "sonner"

interface LoginFormProps {
  onLogin: (user: any) => void
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const validateForm = () => {
    const errs: string[] = []
    if (!email.trim()) errs.push("Email wajib diisi")
    if (!password.trim()) errs.push("Password wajib diisi")
    setError(errs.join(" · "))
    return errs.length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!validateForm()) return
    setIsLoading(true)
    try {
      // Initialize local seeds if still used elsewhere
      // Simulate loading for better UX
      await new Promise((resolve) => setTimeout(resolve, 800))

      const user = await signInWithPassword(email.trim(), password)
      toast.success(`Selamat datang, ${user?.name || "User"}!`)
      onLogin(user)
    } catch (err: any) {
      setError(err?.message || "Login gagal")
      toast.error("Login gagal")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rayo-light to-white p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center pb-8">
          <div className="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center mb-6">
            <img src="/rayo-logo.png" alt="Rayo Kurir Logo" className="w-full h-full object-contain" />
          </div>
          <CardTitle className="text-3xl font-bold text-rayo-dark">Rayo Kurir</CardTitle>
          <CardDescription className="text-base">Masuk ke dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormField label="Email" required error={error}>
              <FormInput
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError("")
                }}
                placeholder="admin@contoh.com"
                disabled={isLoading}
                error={error}
                className="h-12"
              />
            </FormField>

            <FormField label="Password" required error={error}>
              <FormInput
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError("")
                }}
                placeholder="••••••••"
                disabled={isLoading}
                error={error}
                className="h-12"
              />
            </FormField>

            <Button
              type="submit"
              disabled={isLoading || !email.trim() || !password.trim()}
              className="w-full h-12 bg-rayo-primary hover:bg-rayo-dark transition-all duration-200 font-medium"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  <span>Memproses...</span>
                </div>
              ) : (
                "Masuk"
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center">
              Belum punya admin?{" "}
              <a
                href="#"
                onClick={async (e) => {
                  e.preventDefault()
                  try {
                    setIsLoading(true)
                    const res = await fetch("/api/bootstrap-admin", { method: "POST" })
                    const j = await res.json()
                    if (j.ok) {
                      setEmail(j.email)
                      setPassword(j.password)
                      toast.success("Admin demo dibuat. Email & password terisi otomatis.")
                    } else {
                      toast.error(j.error || "Gagal membuat admin demo")
                    }
                  } finally {
                    setIsLoading(false)
                  }
                }}
                className="underline"
              >
                Buat admin demo otomatis
              </a>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
