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
  WifiOff,
  Lightbulb,
  TrendingUp,
  ArrowUpLeft,
  Cpu,
  DoorOpen,
  Music,
  ShieldAlert,
} from 'lucide-react'
import { ReadOnlyBanner } from '@/components/permission-banner'
import { useFirebaseStatus } from '@/hooks/useFirebaseStatus'
import { useFirebaseLights } from '@/hooks/useFirebaseLights'

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
    gateOpen: boolean
    doorOpen: boolean
    seatActive: boolean
    mp3Playing: boolean
  }
}

const STATUS_BADGE: Record<string, { label: string; dotColor: string; className: string }> = {
  confirmed: { label: 'مؤكد', dotColor: 'bg-green-400', className: 'bg-green-500/10 text-green-400 border-green-500/20' },
  pending: { label: 'معلق', dotColor: 'bg-yellow-400', className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  cancelled: { label: 'ملغي', dotColor: 'bg-red-400', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
  completed: { label: 'مكتمل', dotColor: 'bg-blue-400', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'نقدي',
  transfer: 'تحويل بنكي',
  card: 'بطاقة',
  cheque: 'شيك',
}

const DASHBOARD_ALLOWED_ROLES = ['admin', 'manager', 'viewer']

export default function DashboardPage() {
  const { toast } = useToast()
  const user = useAuthStore((s) => s.user)
  const userRole = user?.role
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  // Real-time ESP32 data from Firebase
  const firebaseStatus = useFirebaseStatus()
  const { activeCount: firebaseActiveLights } = useFirebaseLights()

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

  // Employee can't access dashboard at all
  if (!DASHBOARD_ALLOWED_ROLES.includes(userRole)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 animate-fade-up">
        <ShieldAlert className="h-16 w-16 text-muted-foreground/30" />
        <h2 className="text-xl font-bold text-muted-foreground">غير مصرح</h2>
        <p className="text-sm text-muted-foreground/70">ليس لديك صلاحية للوصول إلى هذه الصفحة</p>
      </div>
    )
  }

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

  const isViewer = userRole === 'viewer'

  return (
    <div className="space-y-8">
      {/* Permission Banner */}
      {isViewer && (
        <ReadOnlyBanner message="وضع العرض فقط — ليس لديك صلاحية التعديل أو الحذف في لوحة المعلومات." />
      )}

      {/* Header */}
      <div className="animate-fade-up">
        <h2 className="text-3xl font-bold font-[Playfair_Display] flex items-center gap-3">
          مرحباً، <span className="text-gold-gradient">{user?.name || 'المستخدم'}</span>
        </h2>
        <p className="text-[#8a8690] text-base mt-2 font-[Cormorant_Garamond] text-lg tracking-wide">
          نظرة عامة على أداء صالة الأفراح
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Customers */}
        {loading ? (
          <Skeleton className="h-28 rounded-xl" />
        ) : (
          <div className="animate-fade-up stagger-1 glass card-hover rounded-xl p-5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/8 to-transparent pointer-events-none" />
            <div className="relative flex items-center gap-4">
              <div className="p-3.5 rounded-xl bg-amber-500/15 ring-1 ring-amber-500/25">
                <Users className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-[#8a8690] mb-1">إجمالي الزبائن</p>
                <p className="text-2xl font-bold font-[DM_Mono] text-[#f5f0e8]">{data?.totalCustomers ?? 0}</p>
              </div>
            </div>
          </div>
        )}

        {/* Monthly Bookings */}
        {loading ? (
          <Skeleton className="h-28 rounded-xl" />
        ) : (
          <div className="animate-fade-up stagger-2 glass card-hover rounded-xl p-5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/8 to-transparent pointer-events-none" />
            <div className="relative flex items-center gap-4">
              <div className="p-3.5 rounded-xl bg-cyan-500/15 ring-1 ring-cyan-500/25">
                <CalendarDays className="h-6 w-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm text-[#8a8690] mb-1">حجوزات الشهر</p>
                <p className="text-2xl font-bold font-[DM_Mono] text-[#f5f0e8]">{data?.monthlyBookings ?? 0}</p>
              </div>
            </div>
          </div>
        )}

        {/* Monthly Revenue */}
        {loading ? (
          <Skeleton className="h-28 rounded-xl" />
        ) : (
          <div className="animate-fade-up stagger-3 glass card-hover rounded-xl p-5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/8 to-transparent pointer-events-none" />
            <div className="relative flex items-center gap-4">
              <div className="p-3.5 rounded-xl bg-emerald-500/15 ring-1 ring-emerald-500/25">
                <DollarSign className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-[#8a8690] mb-1">إيرادات الشهر</p>
                <p className="text-2xl font-bold font-[DM_Mono] text-green-400">
                  {(data?.monthlyRevenue ?? 0).toLocaleString()}{' '}
                  <span className="text-xs text-[#8a8690] font-[DM_Sans]">ر.س</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Bookings */}
        {loading ? (
          <Skeleton className="h-28 rounded-xl" />
        ) : (
          <div className="animate-fade-up stagger-4 glass card-hover rounded-xl p-5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/8 to-transparent pointer-events-none" />
            <div className="relative flex items-center gap-4">
              <div className="p-3.5 rounded-xl bg-purple-500/15 ring-1 ring-purple-500/25">
                <Clock className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-[#8a8690] mb-1">حجوزات قادمة</p>
                <p className="text-2xl font-bold font-[DM_Mono] text-[#f5f0e8]">{data?.upcomingBookings ?? 0}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Revenue Chart + ESP32 Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 glass rounded-xl border-0 overflow-hidden animate-fade-up stagger-3">
          <CardHeader className="pb-4 border-b border-white/5">
            <CardTitle className="text-base flex items-center gap-2 text-gradient-dashboard font-[Playfair_Display]">
              <ArrowUpLeft className="h-4 w-4 text-amber-400" />
              الإيرادات - آخر 6 أشهر
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            {loading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <div className="flex items-end gap-3 h-52" dir="ltr">
                {data?.revenueChart.map((item, idx) => {
                  const heightPercent = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                      <span className="text-xs text-[#8a8690] font-[DM_Mono] opacity-0 group-hover:opacity-100 transition-opacity">
                        {(item.revenue / 1000).toFixed(0)} ألف
                      </span>
                      <div className="w-full relative" style={{ height: '160px' }}>
                        <div
                          className="absolute bottom-0 w-full rounded-t-lg bg-gradient-to-t from-amber-500 to-amber-300 transition-all duration-500 hover:from-amber-300 hover:to-amber-500 cursor-pointer min-h-[4px] opacity-80 hover:opacity-100 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                          style={{ height: `${Math.max(heightPercent, 3)}%` }}
                        />
                      </div>
                      <span className="text-xs text-[#8a8690] font-[DM_Mono]">{item.month}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ESP32 Real-time Status */}
        <Card className="glass-gold rounded-xl border-0 overflow-hidden animate-fade-up stagger-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-gold-gradient-light font-[Playfair_Display]">
              <Cpu className="h-4 w-4 text-amber-400" />
              حالة ESP32
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium backdrop-blur-sm ${
                firebaseStatus.online
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {firebaseStatus.online ? 'متصل' : 'غير متصل'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* Connection */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  {firebaseStatus.online ? (
                    <Wifi className="h-4 w-4 text-green-400" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-red-400" />
                  )}
                  {firebaseStatus.online && (
                    <span className="absolute -top-0.5 -right-0.5 inline-block size-1.5 rounded-full bg-green-400 animate-pulse-dot" />
                  )}
                </div>
                <span className="text-xs text-[#8a8690]">الاتصال</span>
              </div>
              <span className={`text-xs font-semibold font-[DM_Mono] ${
                firebaseStatus.online ? 'text-green-400' : 'text-red-400'
              }`}>
                {firebaseStatus.online
                  ? firebaseStatus.lastSeen
                    ? `منذ ${Math.max(0, Math.floor((Date.now() - firebaseStatus.lastSeen) / 1000))}ث`
                    : 'متصل'
                  : 'غير متصل'
                }
              </span>
            </div>

            {/* Gate */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
              <div className="flex items-center gap-2.5">
                <DoorOpen className="h-4 w-4 text-[#8a8690]" />
                <span className="text-xs text-[#8a8690]">البوابة</span>
              </div>
              <span className={`text-xs font-semibold ${
                data?.esp32Status?.gateOpen ? 'text-green-400' : 'text-[#9490a0]'
              }`}>
                {data?.esp32Status?.gateOpen ? 'مفتوحة' : 'مغلقة'}
              </span>
            </div>

            {/* Door */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
              <div className="flex items-center gap-2.5">
                <DoorOpen className="h-4 w-4 text-[#8a8690]" />
                <span className="text-xs text-[#8a8690]">باب الصالة</span>
              </div>
              <span className={`text-xs font-semibold ${
                data?.esp32Status?.doorOpen ? 'text-green-400' : `text-[#9490a0]'`
              }`}>
                {data?.esp32Status?.doorOpen ? 'مفتوح' : 'مغلق'}
              </span>
            </div>

            {/* Lights */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
              <div className="flex items-center gap-2.5">
                <Lightbulb className="h-4 w-4 text-amber-400" />
                <span className="text-xs text-[#8a8690]">الأضواء</span>
              </div>
              <span className={`text-xs font-bold font-[DM_Mono] ${
                firebaseActiveLights > 0 ? 'text-amber-400' : `text-[#9490a0]'`
              }`}>
                {firebaseActiveLights} / 6
              </span>
            </div>

            {/* MP3 */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
              <div className="flex items-center gap-2.5">
                <Music className="h-4 w-4 text-[#8a8690]" />
                <span className="text-xs text-[#8a8690]">المشغل</span>
              </div>
              <span className={`text-xs font-semibold ${
                data?.esp32Status?.mp3Playing ? 'text-pink-400' : `text-[#9490a0]'`
              }`}>
                {data?.esp32Status?.mp3Playing ? 'يشغل' : 'متوقف'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Bookings + Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Bookings */}
        <Card className="glass rounded-xl border-0 overflow-hidden animate-fade-up stagger-5">
          <CardHeader className="pb-4 border-b border-white/5">
            <CardTitle className="text-base flex items-center gap-2 text-gold-gradient-light font-[Playfair_Display]">
              <CalendarDays className="h-4 w-4 text-amber-400" />
              الحجوزات القادمة (7 أيام)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : !data?.upcomingList?.length ? (
              <div className="text-center py-10">
                <CalendarDays className="h-10 w-10 mx-auto mb-3 text-[#8a8690]/30" />
                <p className="text-sm text-[#8a8690] font-[Cormorant_Garamond] text-base">لا توجد حجوزات قادمة</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {data.upcomingList.map((booking) => {
                  const badge = STATUS_BADGE[booking.status] || STATUS_BADGE.pending
                  return (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-4 rounded-xl glass card-hover"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className={`shrink-0 inline-block size-2 rounded-full ${badge.dotColor}`} />
                        <div className="min-w-0">
                          <span className="font-medium text-sm text-[#f5f0e8] truncate block">
                            {booking.customer.name}
                          </span>
                          <p className="text-xs text-[#8a8690] mt-0.5 truncate">
                            {booking.eventType} — {formatFullDate(booking.eventDate)}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold font-[DM_Mono] text-amber-400 shrink-0 mr-3">
                        {booking.hallPrice.toLocaleString()} <span className="text-[10px] text-[#8a8690] font-[DM_Sans]">ر.س</span>
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card className="glass rounded-xl border-0 overflow-hidden animate-fade-up stagger-6">
          <CardHeader className="pb-4 border-b border-white/5">
            <CardTitle className="text-base flex items-center gap-2 text-gold-gradient-light font-[Playfair_Display]">
              <DollarSign className="h-4 w-4 text-amber-400" />
              آخر المدفوعات
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : !data?.recentPayments?.length ? (
              <div className="text-center py-10">
                <DollarSign className="h-10 w-10 mx-auto mb-3 text-[#8a8690]/30" />
                <p className="text-sm text-[#8a8690] font-[Cormorant_Garamond] text-base">لا توجد مدفوعات حديثة</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {data.recentPayments.slice(0, 5).map((payment) => {
                  const statusBadge = STATUS_BADGE[payment.status]
                  return (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-4 rounded-xl glass card-hover"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className={`shrink-0 inline-block size-2 rounded-full ${statusBadge?.dotColor || 'bg-[#8a8690]'}`} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-[#f5f0e8] truncate">
                              {payment.booking.customer.name}
                            </span>
                            <span className="text-[#8a8690]/40 text-xs">—</span>
                            <span className="text-xs text-[#8a8690] truncate">
                              {payment.booking.eventType}
                            </span>
                          </div>
                          <p className="text-xs text-[#8a8690] mt-0.5">
                            {PAYMENT_METHOD_LABELS[payment.method] || payment.method} — {formatDate(payment.paidAt)}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold font-[DM_Mono] text-green-400 shrink-0 mr-3">
                        {payment.amount.toLocaleString()} <span className="text-[10px] text-[#8a8690] font-[DM_Sans]">ر.س</span>
                      </span>
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
