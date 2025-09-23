"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Package, CheckCircle, Clock, DollarSign } from "lucide-react"
import { AddOrderModal } from "@/components/add-order-modal"
import { getOrders, getCouriers, formatCurrency, type Order, type Courier } from "@/lib/auth"

export function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [couriers, setCouriers] = useState<Courier[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [uploadedPhotos, setUploadedPhotos] = useState<
    Array<{
      id: string
      kurirId: string
      kurirName: string
      photoUrl: string
      description: string
      timestamp: string
      orderId?: string
    }>
  >([])

  useEffect(() => {
    loadData()
    const savedPhotos = localStorage.getItem("courier_photos")
    if (savedPhotos) {
      setUploadedPhotos(JSON.parse(savedPhotos))
    }
  }, [])

  const loadData = () => {
    setOrders(getOrders())
    setCouriers(getCouriers())
  }

  const today = new Date().toDateString()
  const todayOrders = orders.filter((order) => new Date(order.createdAt).toDateString() === today)

  const stats = {
    totalToday: todayOrders.length,
    completed: todayOrders.filter((order) => order.status === "SELESAI").length,
    pending: todayOrders.filter((order) => order.status !== "SELESAI").length,
    codOutstanding: orders
      .filter((order) => order.cod.isCOD && !order.cod.codPaid)
      .reduce((sum, order) => sum + order.cod.nominal, 0),
  }

  const getStatusBadge = (status: Order["status"]) => {
    switch (status) {
      case "MENUNGGU":
        return <Badge variant="secondary">Menunggu</Badge>
      case "OTW":
        return <Badge className="bg-blue-500 hover:bg-blue-600">OTW</Badge>
      case "SELESAI":
        return <Badge className="bg-green-500 hover:bg-green-600">Selesai</Badge>
    }
  }

  const getCourierName = (kurirId: string | null) => {
    if (!kurirId) return "-"
    const courier = couriers.find((c) => c.id === kurirId)
    return courier?.nama || "-"
  }

  const recentOrders = orders.slice(0, 5)

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-rayo-dark">Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Ringkasan aktivitas hari ini</p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-rayo-primary hover:bg-rayo-dark w-full sm:w-auto h-10 sm:h-11"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          <span className="text-sm sm:text-base">Tambah Order</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <Card className="p-3 sm:p-4 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <CardTitle className="text-xs sm:text-sm font-medium leading-tight">Total Order Hari Ini</CardTitle>
            <Package className="h-3 w-3 sm:h-4 sm:w-4 text-rayo-primary flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="text-lg sm:text-2xl font-bold text-rayo-dark">{stats.totalToday}</div>
            <p className="text-xs text-muted-foreground">Order masuk hari ini</p>
          </CardContent>
        </Card>

        <Card className="p-3 sm:p-4 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <CardTitle className="text-xs sm:text-sm font-medium leading-tight">Order Selesai</CardTitle>
            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="text-lg sm:text-2xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Dari {stats.totalToday} order hari ini</p>
          </CardContent>
        </Card>

        <Card className="p-3 sm:p-4 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <CardTitle className="text-xs sm:text-sm font-medium leading-tight">Order Belum Selesai</CardTitle>
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500 flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="text-lg sm:text-2xl font-bold text-orange-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Menunggu & OTW</p>
          </CardContent>
        </Card>

        <Card className="p-3 sm:p-4 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
            <CardTitle className="text-xs sm:text-sm font-medium leading-tight">COD Outstanding</CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 flex-shrink-0" />
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="text-lg sm:text-2xl font-bold text-red-600">{formatCurrency(stats.codOutstanding)}</div>
            <p className="text-xs text-muted-foreground">Belum disetor</p>
          </CardContent>
        </Card>
      </div>

      {uploadedPhotos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Foto Testimoni Kurir</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {uploadedPhotos.slice(0, 8).map((photo) => (
                <div key={photo.id} className="border rounded-lg p-3 space-y-2 hover:shadow-md transition-shadow">
                  <img
                    src={photo.photoUrl || "/placeholder.svg"}
                    alt="Testimoni kurir"
                    className="w-full h-32 sm:h-40 object-cover rounded-md"
                  />
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{photo.kurirName}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{photo.description}</p>
                    <p className="text-xs text-muted-foreground">{new Date(photo.timestamp).toLocaleString("id-ID")}</p>
                  </div>
                </div>
              ))}
            </div>
            {uploadedPhotos.length > 8 && (
              <p className="text-sm text-muted-foreground mt-4 text-center">
                Dan {uploadedPhotos.length - 8} foto lainnya...
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Orders Terbaru</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-3 sm:px-4 font-medium text-sm">ID</th>
                  <th className="text-left py-3 px-3 sm:px-4 font-medium text-sm">Pengirim</th>
                  <th className="text-left py-3 px-3 sm:px-4 font-medium text-sm">Tujuan</th>
                  <th className="text-left py-3 px-3 sm:px-4 font-medium text-sm">Kurir</th>
                  <th className="text-left py-3 px-3 sm:px-4 font-medium text-sm">Status</th>
                  <th className="text-left py-3 px-3 sm:px-4 font-medium text-sm">COD</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
                      Belum ada order. Klik "Tambah Order" untuk memulai.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-3 sm:px-4 font-mono text-sm">#{order.id.slice(-6)}</td>
                      <td className="py-3 px-3 sm:px-4">
                        <div>
                          <div className="font-medium text-sm">{order.pengirim.nama}</div>
                          {order.pengirim.wa && (
                            <div className="text-xs text-muted-foreground">{order.pengirim.wa}</div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 sm:px-4">
                        <div className="max-w-xs truncate text-sm" title={order.dropoff.alamat}>
                          {order.dropoff.alamat}
                        </div>
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-sm">{getCourierName(order.kurirId)}</td>
                      <td className="py-3 px-3 sm:px-4">{getStatusBadge(order.status)}</td>
                      <td className="py-3 px-3 sm:px-4">
                        {order.cod.isCOD ? (
                          <div className="text-sm">
                            <div className="font-medium">{formatCurrency(order.cod.nominal)}</div>
                            <div className={`text-xs ${order.cod.codPaid ? "text-green-600" : "text-red-600"}`}>
                              {order.cod.codPaid ? "Lunas" : "Belum"}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Non-COD</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <AddOrderModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onOrderAdded={() => {
          loadData()
          setShowAddModal(false)
        }}
      />
    </div>
  )
}
