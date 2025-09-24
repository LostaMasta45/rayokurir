import useSWR from "swr"
import { getSupabaseBrowser } from "@/lib/supabase/browser"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Package, Users, Truck } from "lucide-react"

export function ReportsPage() {
  const supabase = getSupabaseBrowser()

  const { data: authUser } = useSWR("reports-auth-user", async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user
  })
  const userId = authUser?.id

  const { data: contactsCount } = useSWR(userId ? ["contacts-count", userId] : null, async () => {
    const { count, error } = await supabase
      .from("contacts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
    if (error) throw error
    return count ?? 0
  })

  const { data: orders } = useSWR(userId ? ["orders", userId] : null, async () => {
    const { data, error } = await supabase.from("orders").select("*").eq("user_id", userId)
    if (error) throw error
    return data ?? []
  })

  const { data: expenses } = useSWR(userId ? ["expenses", userId] : null, async () => {
    const { data, error } = await supabase.from("expenses").select("*").eq("user_id", userId)
    if (error) throw error
    return data ?? []
  })

  const { data: codHistory } = useSWR(userId ? ["cod-history", userId] : null, async () => {
    const { data, error } = await supabase.from("cod_history").select("*").eq("user_id", userId)
    if (error) throw error
    return data ?? []
  })

  const { data: couriers } = useSWR(userId ? ["couriers", userId] : null, async () => {
    const { data, error } = await supabase.from("couriers").select("*").eq("user_id", userId)
    if (error) throw error
    return data ?? []
  })

  const filteredOrders = orders ?? []
  const filteredExpenses = expenses ?? []
  const filteredCODHistory = codHistory ?? []
  const filteredCouriers = couriers ?? []

  const overallStats = {
    totalOrders: filteredOrders.length,
    completedOrders: filteredOrders.filter((order) => order.status === "SELESAI").length,
    totalRevenue: filteredOrders.reduce((sum, order) => sum + (order.ongkir || 0), 0),
    totalExpenses: filteredExpenses.reduce((sum, expense) => sum + expense.nominal, 0),
    totalCODCollected: filteredCODHistory.reduce((sum, history) => sum + history.nominal, 0),
    activeCouriers: filteredCouriers.filter((courier) => courier.aktif).length,
    onlineCouriers: filteredCouriers.filter((courier) => courier.aktif && courier.online).length,
    totalContacts: contactsCount ?? 0,
  } as any

  return (
    <div className="p-6 md:p-8 lg:p-10">
      <h1 className="text-3xl font-bold mb-6">Laporan Ringkasan</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pesanan</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">{overallStats.completedOrders} pesanan selesai</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp{overallStats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Rp{overallStats.totalCODCollected.toLocaleString()} COD terkumpul
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp{overallStats.totalExpenses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Pengeluaran operasional</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kurir Aktif</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.activeCouriers}</div>
            <p className="text-xs text-muted-foreground">{overallStats.onlineCouriers} kurir online</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Kontak</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalContacts}</div>
            <p className="text-xs text-muted-foreground">Jumlah kontak terdaftar</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
