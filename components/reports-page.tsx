import useSWR from "swr"
import { getSupabaseBrowser } from "@/lib/supabase/browser"

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

  const overallStats = {
    totalOrders: filteredOrders.length,
    completedOrders: filteredOrders.filter((order) => order.status === "SELESAI").length,
    totalRevenue: filteredOrders.reduce((sum, order) => sum + (order.ongkir || 0), 0),
    totalExpenses: filteredExpenses.reduce((sum, expense) => sum + expense.nominal, 0),
    totalCODCollected: filteredCODHistory.reduce((sum, history) => sum + history.nominal, 0),
    activeCouriers: couriers.filter((courier) => courier.aktif).length,
    onlineCouriers: couriers.filter((courier) => courier.aktif && courier.online).length,
    totalContacts: contactsCount ?? 0,
  } as any
}
