export interface User {
  username: string
  role: "ADMIN" | "KURIR"
  name: string
  courierId?: string
}

export interface Order {
  id: string
  createdAt: string
  createdDate: string
  pengirim: {
    nama: string
    wa: string
  }
  pickup: {
    alamat: string
  }
  dropoff: {
    alamat: string
  }
  kurirId: string | null
  status: "MENUNGGU_PICKUP" | "PICKUP_OTW" | "BARANG_DIAMBIL" | "SEDANG_DIKIRIM" | "SELESAI"
  jenisOrder: "Barang" | "Makanan" | "Dokumen" | "Antar Jemput"
  serviceType: "Reguler" | "Express" | "Same Day"
  ongkir: number
  danaTalangan: number
  bayarOngkir: "NON_COD" | "COD"
  talanganReimbursed?: boolean
  cod: {
    nominal: number
    isCOD: boolean
    codPaid: boolean
  }
  nonCodPaid: boolean
  notes?: string
}

export interface Courier {
  id: string
  nama: string
  wa: string
  aktif: boolean
  online: boolean
}

export interface CODHistory {
  id: string
  orderId: string
  kurirId: string
  nominal: number
  tanggal: string
  buktiUrl?: string
}

export interface Expense {
  id: string
  tanggal: string
  kategori: string
  deskripsi: string
  nominal: number
}

export interface Contact {
  id: string
  name: string
  whatsapp: string
  address: string
  tags: string[]
  notes?: string
  createdAt: string
  lastContacted?: string
}

// Storage keys
const STORAGE_KEYS = {
  ORDERS: "rk_orders",
  COURIERS: "rk_couriers",
  COD_HISTORY: "rk_cod_history",
  EXPENSES: "rk_expenses",
  USERS: "rk_users",
  CURRENT_USER: "rk_current_user",
  CONTACTS: "rayo-contacts", // Added contacts storage key
}

// Initialize default data
export function initializeData() {
  if (typeof window === "undefined") return

  // Initialize users
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    const defaultUsers: User[] = [
      { username: "admin", role: "ADMIN", name: "Administrator" },
      { username: "kurir1", role: "KURIR", name: "Budi Santoso", courierId: "1" },
      { username: "kurir2", role: "KURIR", name: "Sari Dewi", courierId: "2" },
    ]
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers))
  }

  // Initialize couriers
  if (!localStorage.getItem(STORAGE_KEYS.COURIERS)) {
    const defaultCouriers: Courier[] = [
      { id: "1", nama: "Budi Santoso", wa: "081234567890", aktif: true, online: true },
      { id: "2", nama: "Sari Dewi", wa: "081234567891", aktif: true, online: false },
    ]
    localStorage.setItem(STORAGE_KEYS.COURIERS, JSON.stringify(defaultCouriers))
  }

  // Initialize empty arrays for other data
  if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]))
  }
  if (!localStorage.getItem(STORAGE_KEYS.COD_HISTORY)) {
    localStorage.setItem(STORAGE_KEYS.COD_HISTORY, JSON.stringify([]))
  }
  if (!localStorage.getItem(STORAGE_KEYS.EXPENSES)) {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify([]))
  }
  if (!localStorage.getItem(STORAGE_KEYS.CONTACTS)) {
    localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify([]))
  }
}

// Authentication functions
export function login(username: string): User | null {
  if (typeof window === "undefined") return null

  const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]")
  const user = users.find((u) => u.username === username)

  if (user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user))
    return user
  }
  return null
}

export function logout() {
  if (typeof window === "undefined") return
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER)
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null
  const userStr = localStorage.getItem(STORAGE_KEYS.CURRENT_USER)
  return userStr ? JSON.parse(userStr) : null
}

// Data access functions
export function getOrders(): Order[] {
  if (typeof window === "undefined") return []
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || "[]")
}

export function saveOrders(orders: Order[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders))
}

export function getCouriers(): Courier[] {
  if (typeof window === "undefined") return []
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.COURIERS) || "[]")
}

export function saveCouriers(couriers: Courier[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEYS.COURIERS, JSON.stringify(couriers))
}

export function getCODHistory(): CODHistory[] {
  if (typeof window === "undefined") return []
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.COD_HISTORY) || "[]")
}

export function saveCODHistory(history: CODHistory[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEYS.COD_HISTORY, JSON.stringify(history))
}

export function getExpenses(): Expense[] {
  if (typeof window === "undefined") return []
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.EXPENSES) || "[]")
}

export function saveExpenses(expenses: Expense[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses))
}

export function getContacts(): Contact[] {
  if (typeof window === "undefined") return []
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.CONTACTS) || "[]")
}

export function saveContacts(contacts: Contact[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(contacts))
}

export function addOrUpdateContact(
  name: string,
  whatsapp: string,
  address: string,
  tags: string[],
  notes?: string,
  lastContacted?: string,
) {
  if (typeof window === "undefined") return

  const contacts = getContacts()

  // Check if contact already exists (by name and whatsapp)
  const existingContactIndex = contacts.findIndex(
    (contact) =>
      contact.name.toLowerCase() === name.toLowerCase() &&
      contact.whatsapp.replace(/\D/g, "") === whatsapp.replace(/\D/g, ""),
  )

  if (existingContactIndex >= 0) {
    // Update existing contact with new address, tags, notes, and lastContacted if different
    const existingContact = contacts[existingContactIndex]
    if (
      existingContact.address !== address ||
      existingContact.tags !== tags ||
      existingContact.notes !== notes ||
      existingContact.lastContacted !== lastContacted
    ) {
      contacts[existingContactIndex] = {
        ...existingContact,
        address: address.trim(),
        tags: tags.map((tag) => tag.trim()),
        notes: notes?.trim(),
        lastContacted: lastContacted ? new Date(lastContacted).toISOString() : undefined,
      }
      saveContacts(contacts)
    }
  } else {
    // Add new contact
    const newContact: Contact = {
      id: generateId(),
      name: name.trim(),
      whatsapp: whatsapp.trim(),
      address: address.trim(),
      tags: tags.map((tag) => tag.trim()),
      notes: notes?.trim(),
      createdAt: new Date().toISOString(),
      lastContacted: lastContacted ? new Date(lastContacted).toISOString() : undefined,
    }
    contacts.push(newContact)
    saveContacts(contacts)
  }
}

// Utility functions
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export function exportContactsToCSV(contacts: Contact[]) {
  if (typeof window === "undefined") return

  const headers = ["Nama", "WhatsApp", "Alamat", "Tags", "Catatan", "Tanggal Dibuat", "Terakhir Dihubungi"]
  const csvContent = [
    headers.join(","),
    ...contacts.map((contact) =>
      [
        `"${contact.name}"`,
        `"${contact.whatsapp}"`,
        `"${contact.address}"`,
        `"${contact.tags.join("; ")}"`,
        `"${contact.notes || ""}"`,
        `"${formatDate(contact.createdAt)}"`,
        `"${contact.lastContacted ? formatDate(contact.lastContacted) : ""}"`,
      ].join(","),
    ),
  ].join("\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", `contacts-${new Date().toISOString().split("T")[0]}.csv`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function exportContactsToJSON(contacts: Contact[]) {
  if (typeof window === "undefined") return

  const dataStr = JSON.stringify(contacts, null, 2)
  const blob = new Blob([dataStr], { type: "application/json" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", `contacts-${new Date().toISOString().split("T")[0]}.json`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function getContactTags(): string[] {
  if (typeof window === "undefined") return []

  const contacts = getContacts()
  const allTags = contacts.flatMap((contact) => contact.tags || [])
  return [...new Set(allTags)].sort()
}

// Service type pricing configuration
export const SERVICE_TYPE_PRICING = {
  Reguler: 0,
  Express: 5000,
  "Same Day": 10000,
}

// Status badge configuration with colors
export const ORDER_STATUS_CONFIG = {
  MENUNGGU_PICKUP: { label: "Menunggu Pickup", color: "bg-gray-100 text-gray-800" },
  PICKUP_OTW: { label: "Pickup OTW", color: "bg-blue-100 text-blue-800" },
  BARANG_DIAMBIL: { label: "Barang Diambil", color: "bg-yellow-100 text-yellow-800" },
  SEDANG_DIKIRIM: { label: "Sedang Dikirim", color: "bg-orange-100 text-orange-800" },
  SELESAI: { label: "Selesai", color: "bg-green-100 text-green-800" },
}

export function toggleCourierOnlineStatus(courierId: string) {
  if (typeof window === "undefined") return

  const couriers = getCouriers()
  const updatedCouriers = couriers.map((courier) => {
    if (courier.id === courierId) {
      return { ...courier, online: !courier.online }
    }
    return courier
  })
  saveCouriers(updatedCouriers)
  return updatedCouriers
}

export function getCourierPerformanceMetrics(courierId: string) {
  if (typeof window === "undefined") return null

  const orders = getOrders()
  const codHistory = getCODHistory()

  const courierOrders = orders.filter((order) => order.kurirId === courierId)
  const completedOrders = courierOrders.filter((order) => order.status === "SELESAI")

  const totalOngkir = courierOrders.reduce((sum, order) => sum + (order.ongkir || 0), 0)
  const codDeposited = codHistory
    .filter((history) => history.kurirId === courierId)
    .reduce((sum, history) => sum + history.nominal, 0)
  const danaTalanganDiganti = courierOrders
    .filter((order) => order.status === "SELESAI" && order.danaTalangan > 0)
    .reduce((sum, order) => sum + order.danaTalangan, 0)

  return {
    totalOrderSelesai: completedOrders.length,
    codDisetor: codDeposited,
    ongkirDikumpulkan: totalOngkir,
    danaTalanganDiganti: danaTalanganDiganti,
    onTimePercentage: 95, // Dummy percentage for now
  }
}

export function markTalanganReimbursed(orderId: string) {
  if (typeof window === "undefined") return false

  const orders = getOrders()
  const orderIndex = orders.findIndex((order) => order.id === orderId)

  if (orderIndex === -1) return false

  orders[orderIndex] = {
    ...orders[orderIndex],
    talanganReimbursed: true,
  }

  saveOrders(orders)
  return true
}

export function updateOrderStatus(orderId: string, newStatus: Order["status"], userRole: "ADMIN" | "KURIR") {
  if (typeof window === "undefined") return false

  const orders = getOrders()
  const orderIndex = orders.findIndex((order) => order.id === orderId)

  if (orderIndex === -1) return false

  const currentOrder = orders[orderIndex]

  // Define allowed status transitions for couriers
  const courierAllowedTransitions: Record<Order["status"], Order["status"][]> = {
    MENUNGGU_PICKUP: ["PICKUP_OTW"],
    PICKUP_OTW: ["BARANG_DIAMBIL"],
    BARANG_DIAMBIL: ["SEDANG_DIKIRIM"],
    SEDANG_DIKIRIM: ["SELESAI"],
    SELESAI: [],
  }

  // Check if courier can make this transition
  if (userRole === "KURIR") {
    const allowedNextStatuses = courierAllowedTransitions[currentOrder.status] || []
    if (!allowedNextStatuses.includes(newStatus)) {
      return false // Courier cannot make this transition
    }
  }
  // Admin can override any status

  orders[orderIndex] = {
    ...orders[orderIndex],
    status: newStatus,
  }

  saveOrders(orders)
  return true
}
