"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { FormField, FormInput, FormTextarea } from "@/components/ui/form-field"
import { getOrders, saveOrders, generateId, type Order, SERVICE_TYPE_PRICING } from "@/lib/auth"
import { toast } from "sonner"
import { getSupabaseBrowser } from "@/lib/supabase/browser"

interface AddOrderModalProps {
  isOpen: boolean
  onClose: () => void
  onOrderAdded: () => void
}

export function AddOrderModal({ isOpen, onClose, onOrderAdded }: AddOrderModalProps) {
  const [formData, setFormData] = useState({
    pengirimNama: "",
    pengirimWa: "",
    pickupAlamat: "",
    dropoffAlamat: "",
    jenisOrder: "",
    serviceType: "",
    ongkir: "",
    danaTalangan: "",
    codNominal: "",
    bayarOngkir: "NON_COD",
    notes: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetForm = () => {
    setFormData({
      pengirimNama: "",
      pengirimWa: "",
      pickupAlamat: "",
      dropoffAlamat: "",
      jenisOrder: "",
      serviceType: "",
      ongkir: "",
      danaTalangan: "",
      codNominal: "",
      bayarOngkir: "NON_COD",
      notes: "",
    })
    setErrors({})
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.pengirimNama.trim()) {
      newErrors.pengirimNama = "Nama pengirim wajib diisi"
    } else if (formData.pengirimNama.trim().length < 2) {
      newErrors.pengirimNama = "Nama pengirim minimal 2 karakter"
    }

    if (!formData.pickupAlamat.trim()) {
      newErrors.pickupAlamat = "Alamat pickup wajib diisi"
    } else if (formData.pickupAlamat.trim().length < 10) {
      newErrors.pickupAlamat = "Alamat pickup minimal 10 karakter"
    }

    if (!formData.dropoffAlamat.trim()) {
      newErrors.dropoffAlamat = "Alamat dropoff wajib diisi"
    } else if (formData.dropoffAlamat.trim().length < 10) {
      newErrors.dropoffAlamat = "Alamat dropoff minimal 10 karakter"
    }

    if (!formData.jenisOrder) {
      newErrors.jenisOrder = "Jenis order wajib dipilih"
    }

    if (!formData.serviceType) {
      newErrors.serviceType = "Service type wajib dipilih"
    }

    if (!formData.ongkir || Number.parseFloat(formData.ongkir) <= 0) {
      newErrors.ongkir = "Ongkir wajib diisi dan harus lebih dari 0"
    } else if (Number.parseFloat(formData.ongkir) < 5000) {
      newErrors.ongkir = "Ongkir minimal Rp 5.000"
    }

    if (formData.pengirimWa && !/^(\+62|62|0)[0-9]{9,13}$/.test(formData.pengirimWa.replace(/\s/g, ""))) {
      newErrors.pengirimWa = "Format nomor WhatsApp tidak valid (contoh: 08123456789)"
    }

    const codNominal = Number.parseFloat(formData.codNominal) || 0
    if (codNominal < 0) {
      newErrors.codNominal = "Nominal COD tidak boleh negatif"
    }

    const danaTalangan = Number.parseFloat(formData.danaTalangan) || 0
    if (danaTalangan < 0) {
      newErrors.danaTalangan = "Dana talangan tidak boleh negatif"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error("Mohon periksa kembali form yang diisi")
      return
    }

    setIsSubmitting(true)

    try {
      const codNominal = Number.parseFloat(formData.codNominal) || 0
      const danaTalangan = Number.parseFloat(formData.danaTalangan) || 0
      const ongkir = Number.parseFloat(formData.ongkir) || 0
      const now = new Date()

      try {
        const supabase = getSupabaseBrowser()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user && formData.pengirimNama.trim() && formData.pickupAlamat.trim()) {
          await supabase.from("contacts").upsert(
            {
              user_id: user.id,
              name: formData.pengirimNama.trim(),
              whatsapp: formData.pengirimWa.trim() || "Tidak ada",
              address: formData.pickupAlamat.trim(),
              tags: [], // keep empty from order flow
              notes: formData.notes.trim() || null,
            },
            { onConflict: "user_id, name_lower, normalized_whatsapp" },
          )
        }
      } catch (contactErr: any) {
        console.log("[v0] Contact upsert during order creation:", contactErr?.message)
      }

      const newOrder: Order = {
        id: generateId(),
        createdAt: now.toISOString(),
        createdDate: now.toDateString(),
        pengirim: {
          nama: formData.pengirimNama.trim(),
          wa: formData.pengirimWa.trim(),
        },
        pickup: {
          alamat: formData.pickupAlamat.trim(),
        },
        dropoff: {
          alamat: formData.dropoffAlamat.trim(),
        },
        kurirId: null,
        status: "MENUNGGU_PICKUP",
        jenisOrder: formData.jenisOrder as "Barang" | "Makanan" | "Dokumen" | "Antar Jemput",
        serviceType: formData.serviceType as "Reguler" | "Express" | "Same Day",
        ongkir: ongkir,
        danaTalangan: danaTalangan,
        bayarOngkir: formData.bayarOngkir as "NON_COD" | "COD",
        talanganReimbursed: false,
        cod: {
          nominal: codNominal,
          isCOD: codNominal > 0,
          codPaid: false,
        },
        nonCodPaid: codNominal === 0 && formData.bayarOngkir === "NON_COD",
        notes: formData.notes.trim(),
      }

      const orders = getOrders()
      orders.unshift(newOrder)
      saveOrders(orders)

      toast.success("Order berhasil ditambahkan!")
      resetForm()
      onOrderAdded()
    } catch (error) {
      console.error("Error adding order:", error)
      toast.error("Gagal menambahkan order. Silakan coba lagi.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (isSubmitting) return
    resetForm()
    onClose()
  }

  const calculateSuggestedOngkir = (serviceType: string) => {
    const basePrice = 15000 // Base price for regular service
    const additionalPrice = SERVICE_TYPE_PRICING[serviceType as keyof typeof SERVICE_TYPE_PRICING] || 0
    return basePrice + additionalPrice
  }

  const handleServiceTypeChange = (value: string) => {
    setFormData({ ...formData, serviceType: value, ongkir: calculateSuggestedOngkir(value).toString() })
    // Clear service type error when user selects
    if (errors.serviceType) {
      setErrors({ ...errors, serviceType: "" })
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[95vh] overflow-y-auto mx-4 sm:mx-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-rayo-dark">Tambah Order Baru</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <FormField label="Nama Pengirim" required error={errors.pengirimNama}>
              <FormInput
                id="pengirimNama"
                value={formData.pengirimNama}
                onChange={(e) => handleInputChange("pengirimNama", e.target.value)}
                placeholder="Masukkan nama pengirim"
                error={errors.pengirimNama}
                disabled={isSubmitting}
                className="h-10 sm:h-11"
              />
            </FormField>

            <FormField label="Nomor WhatsApp" error={errors.pengirimWa}>
              <FormInput
                id="pengirimWa"
                value={formData.pengirimWa}
                onChange={(e) => handleInputChange("pengirimWa", e.target.value)}
                placeholder="08123456789"
                error={errors.pengirimWa}
                disabled={isSubmitting}
                className="h-10 sm:h-11"
              />
            </FormField>
          </div>

          <FormField label="Alamat Pickup" required error={errors.pickupAlamat}>
            <FormTextarea
              id="pickupAlamat"
              value={formData.pickupAlamat}
              onChange={(e) => handleInputChange("pickupAlamat", e.target.value)}
              placeholder="Masukkan alamat pickup lengkap dengan patokan"
              rows={3}
              error={errors.pickupAlamat}
              disabled={isSubmitting}
              className="min-h-[80px] resize-none"
            />
          </FormField>

          <FormField label="Alamat Dropoff" required error={errors.dropoffAlamat}>
            <FormTextarea
              id="dropoffAlamat"
              value={formData.dropoffAlamat}
              onChange={(e) => handleInputChange("dropoffAlamat", e.target.value)}
              placeholder="Masukkan alamat dropoff lengkap dengan patokan"
              rows={3}
              error={errors.dropoffAlamat}
              disabled={isSubmitting}
              className="min-h-[80px] resize-none"
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <FormField label="Jenis Order" required error={errors.jenisOrder}>
              <Select
                value={formData.jenisOrder}
                onValueChange={(value) => handleInputChange("jenisOrder", value)}
                disabled={isSubmitting}
              >
                <SelectTrigger className={`h-10 sm:h-11 ${errors.jenisOrder ? "border-red-500" : ""}`}>
                  <SelectValue placeholder="Pilih jenis order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Barang">📦 Barang</SelectItem>
                  <SelectItem value="Makanan">🍔 Makanan</SelectItem>
                  <SelectItem value="Dokumen">📄 Dokumen</SelectItem>
                  <SelectItem value="Antar Jemput">🚗 Antar Jemput</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Service Type" required error={errors.serviceType}>
              <Select value={formData.serviceType} onValueChange={handleServiceTypeChange} disabled={isSubmitting}>
                <SelectTrigger className={`h-10 sm:h-11 ${errors.serviceType ? "border-red-500" : ""}`}>
                  <SelectValue placeholder="Pilih service type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Reguler">🚚 Reguler</SelectItem>
                  <SelectItem value="Express">⚡ Express (+Rp 5.000)</SelectItem>
                  <SelectItem value="Same Day">🏃 Same Day (+Rp 10.000)</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <FormField label="Ongkir (Rp)" required error={errors.ongkir}>
              <FormInput
                id="ongkir"
                type="number"
                min="0"
                value={formData.ongkir}
                onChange={(e) => handleInputChange("ongkir", e.target.value)}
                placeholder="15000"
                error={errors.ongkir}
                disabled={isSubmitting}
                className="h-10 sm:h-11"
              />
              <p className="text-xs text-muted-foreground mt-1">Biaya jasa antar. Masuk ke pendapatan saat dibayar.</p>
            </FormField>

            <FormField label="Dana Talangan (Rp)" error={errors.danaTalangan}>
              <FormInput
                id="danaTalangan"
                type="number"
                min="0"
                value={formData.danaTalangan}
                onChange={(e) => handleInputChange("danaTalangan", e.target.value)}
                placeholder="0"
                error={errors.danaTalangan}
                disabled={isSubmitting}
                className="h-10 sm:h-11"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Uang yang kurir keluarkan di muka (titip beli). Bukan pendapatan. Tandai 'Talangan Diganti' setelah
                customer mengganti.
              </p>
            </FormField>

            <FormField label="Nominal COD (Rp)" error={errors.codNominal}>
              <FormInput
                id="codNominal"
                type="number"
                min="0"
                value={formData.codNominal}
                onChange={(e) => handleInputChange("codNominal", e.target.value)}
                placeholder="0"
                error={errors.codNominal}
                disabled={isSubmitting}
                className="h-10 sm:h-11"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Harga barang titipan dari toko/merchant. Bukan pendapatan. Kurir wajib setor ke toko. Jika tidak ada COD
                → isi 0.
              </p>
            </FormField>
          </div>

          <FormField label="Cara Bayar Ongkir" required>
            <Select
              value={formData.bayarOngkir}
              onValueChange={(value) => handleInputChange("bayarOngkir", value)}
              disabled={isSubmitting}
            >
              <SelectTrigger className="h-10 sm:h-11">
                <SelectValue placeholder="Pilih cara bayar ongkir" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NON_COD">💳 Non-COD (dibayar langsung)</SelectItem>
                <SelectItem value="COD">💰 COD (ongkir digabung dengan COD, masuk kas saat setoran COD)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Non-COD: Ongkir dibayar langsung. COD: Ongkir digabung dengan COD, masuk kas saat setoran COD.
            </p>
          </FormField>

          <FormField label="Catatan (Opsional)">
            <FormTextarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Catatan tambahan untuk order ini"
              rows={3}
              disabled={isSubmitting}
              className="min-h-[80px] resize-none"
            />
          </FormField>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 bg-transparent h-10 sm:h-11"
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-rayo-primary hover:bg-rayo-dark h-10 sm:h-11"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  <span>Menyimpan...</span>
                </div>
              ) : (
                "Simpan Order"
              )}
            </Button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
            <p className="text-sm text-blue-800">
              💡 <strong>Hint:</strong> Isi Nominal COD hanya jika ada barang titipan dari toko. Jika hanya talangan +
              ongkir → COD = 0.
            </p>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
