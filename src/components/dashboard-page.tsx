'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users,
  CalendarDays,
  DollarSign,
  Clock,
  Wifi,
  Lightbulb,
  TrendingUp,
  ArrowUpLeft,
} from 'lucide-react'

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${useAuthStore.getState().token}`,
})

interface DashboardData {
  totalCustomers: number
  monthlyBookings: number
  monthlyRevenue: number
  upcomingBookings: number
  upcomingList: Array<{
    id: string
    eventDate: string
    eventType: string
    status: string
    customer: { name: string; phone: string }
    hallPrice: number
  }>
  recentPayments: Array<{
    id: string
    amount: number
    status: string
    method: string
    paidAt: string
    booking: { eventType: string; customer: { name: string } }
  }>
  revenueChart: Array<{
    month: string
    revenue: number
  }>
  esp32Status: {
    connected: boolean
    activeLights: number
  }
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  confirmed: { label: 'مؤكد', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  pending: { label: 'معلق', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  cancelled: { label: 'ملغي', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  completed: { label: 'مكتمل', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'نقدي',
  transfer: 'تحويل بنكي',
  card: 'بطاقة',
  cheque: 'شيك',
}

export default function DashboardPage() {
  const { toast } = useToast()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/dashboard', { headers: authHeaders() })
      if (res.ok) {
        const json = await res.json()
        setData(json)
      } else {
        const err = await res.json()
        toast({ title: 'خطأ', description: err.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ', description: 'فشل الاتصال بالخادم', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ar-SA', {
      month: 'short',
      day: 'numeric',
    })
  }

  const formatFullDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const maxRevenue = data ? Math.max(...data.revenueChart.map((c) => c.revenue), 1) : 1

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-amber-600" />
          لوحة المعلومات
        </h2>
        <p className="text-muted-foreground text-sm mt-1">نظرة عامة على أداء صالة الأفراح</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Customers */}
        {loading ? (
          <Skeleton className="h-24 rounded-lg" />
        ) : (
          <Card className="border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                <Users className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الزبائن</p>
                <p className="text-xl font-bold">{data?.totalCustomers ?? 0}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Monthly Bookings */}
        {loading ? (
          <Skeleton className="h-24 rounded-lg" />
        ) : (
          <Card className="border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <CalendarDays className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">حجوزات الشهر</p>
                <p className="text-xl font-bold">{data?.monthlyBookings ?? 0}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Monthly Revenue */}
        {loading ? (
          <Skeleton className="h-24 rounded-lg" />
        ) : (
          <Card className="border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إيرادات الشهر</p>
                <p className="text-xl font-bold text-green-600">
                  {(data?.monthlyRevenue ?? 0).toLocaleString()}{' '}
                  <span className="text-xs text-muted-foreground">ر.س</span>
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Bookings */}
        {loading ? (
          <Skeleton className="h-24 rounded-lg" />
        ) : (
          <Card className="border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">حجوزات قادمة</p>
                <p className="text-xl font-bold">{data?.upcomingBookings ?? 0}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Revenue Chart + ESP32 Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="border-border lg:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowUpLeft className="h-4 w-4 text-amber-600" />
              الإيرادات - آخر 6 أشهر
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <div className="flex items-end gap-3 h-48" dir="ltr">
                {data?.revenueChart.map((item, idx) => {
                  const heightPercent = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                      <span className="text-xs text-muted-foreground font-mono">
                        {(item.revenue / 1000).toFixed(0)}K
                      </span>
                      <div className="w-full relative group" style={{ height: '140px' }}>
                        <div
                          className="absolute bottom-0 w-full rounded-t-md bg-gradient-to-t from-amber-600 to-amber-400 transition-all duration-500 hover:from-amber-500 hover:to-amber-300 cursor-pointer min-h-[4px]"
                          style={{ height: `${Math.max(heightPercent, 3)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{item.month}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ESP32 Quick Status */}
        <Card className="border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Wifi className="h-4 w-4 text-amber-600" />
              حالة ESP32
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Connection */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2.5 w-2.5 rounded-full ${
                        data?.esp32Status?.connected
                          ? 'bg-green-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]'
                          : 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]'
                      }`}
                    />
                    <span className="text-sm font-medium">حالة الاتصال</span>
                  </div>
                  <span
                    className={`text-sm font-semibold ${
                      data?.esp32Status?.connected ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {data?.esp32Status?.connected ? 'متصل' : 'غير متصل'}
                  </span>
                </div>

                {/* Active Lights */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium">الأضواء المفعّلة</span>
                  </div>
                  <span className="text-sm font-bold text-amber-600">
                    {data?.esp32Status?.activeLights ?? 0} / 6
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Bookings + Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Bookings */}
        <Card className="border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-amber-600" />
              الحجوزات القادمة (7 أيام)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : !data?.upcomingList?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarDays className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">لا توجد حجوزات قادمة</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {data.upcomingList.map((booking) => {
                  const badge = STATUS_BADGE[booking.status] || STATUS_BADGE.pending
                  return (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">
                            {booking.customer.name}
                          </span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {booking.eventType} — {formatFullDate(booking.eventDate)}
                        </p>
                      </div>
                      <span className="text-sm font-mono font-semibold text-amber-600 shrink-0 mr-3">
                        {booking.hallPrice.toLocaleString()} ر.س
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card className="border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-amber-600" />
              آخر المدفوعات
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : !data?.recentPayments?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">لا توجد مدفوعات حديثة</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {data.recentPayments.slice(0, 5).map((payment) => {
                  const statusBadge = STATUS_BADGE[payment.status]
                  return (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">
                            {payment.booking.customer.name}
                          </span>
                          <span className="text-xs text-muted-foreground">—</span>
                          <span className="text-xs text-muted-foreground truncate">
                            {payment.booking.eventType}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {PAYMENT_METHOD_LABELS[payment.method] || payment.method} — {formatDate(payment.paidAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 mr-3">
                        {statusBadge && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusBadge.className}`}
                          >
                            {statusBadge.label}
                          </span>
                        )}
                        <span className="text-sm font-mono font-semibold text-green-600">
                          {payment.amount.toLocaleString()} ر.س
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
