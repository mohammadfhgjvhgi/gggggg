'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ChevronRight, ChevronLeft, CalendarDays } from 'lucide-react'
import { ReadOnlyBanner, usePermissions } from '@/components/permission-banner'

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${useAuthStore.getState().token}`,
})

interface Booking {
  id: string
  eventDate: string
  eventType: string
  status: string
  customer: { name: string; phone: string }
  hallPrice: number
  guests: number | null
  notes: string | null
}

const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
]

const ARABIC_DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  confirmed: { label: 'مؤكد', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  pending: { label: 'معلق', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  cancelled: { label: 'ملغي', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  completed: { label: 'مكتمل', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
}

const DOT_COLORS: Record<string, string> = {
  confirmed: 'bg-green-500',
  pending: 'bg-yellow-500',
  cancelled: 'bg-red-500',
  completed: 'bg-blue-500',
}

export default function CalendarView() {
  const { toast } = useToast()
  const user = useAuthStore((s) => s.user)
  const { isReadOnly } = usePermissions()

  const [currentDate, setCurrentDate] = useState(new Date())
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const userIsReadOnly = isReadOnly(user?.role, 'bookings')

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/bookings?limit=100', { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        setBookings(data.bookings)
      } else {
        toast({ title: 'خطأ', description: 'فشل في تحميل الحجوزات', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ', description: 'فشل الاتصال بالخادم', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  // Group bookings by day of current month
  const bookingsByDay = useMemo(() => {
    const map: Record<number, Booking[]> = {}
    bookings.forEach((b) => {
      const d = new Date(b.eventDate)
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate()
        if (!map[day]) map[day] = []
        map[day].push(b)
      }
    })
    return map
  }, [bookings, year, month])

  // Calendar grid calculations
  const firstDayOfWeek = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  const handleDayClick = (day: number) => {
    const dayBookings = bookingsByDay[day]
    if (dayBookings && dayBookings.length > 0) {
      setSelectedDay(day)
      setDialogOpen(true)
    }
  }

  const selectedBookings = selectedDay ? bookingsByDay[selectedDay] || [] : []

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Permission Banner */}
      {userIsReadOnly && (
        <ReadOnlyBanner message="يمكنك فقط عرض الحجوزات في التقويم. لإضافة أو تعديل حجز، تواصل مع المدير." />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3 text-gold-gradient font-[Playfair_Display]">
            <CalendarDays className="h-6 w-6 text-[#d4a853]" />
            التقويم
          </h2>
          <p className="text-[#8a8690] text-sm mt-1">عرض الحجوزات الشهرية</p>
        </div>
      </div>

      {/* Calendar Card */}
      <Card className="glass border-[#d4a853]/10 card-hover">
        <CardContent className="p-4 sm:p-6">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={nextMonth}
              className="gap-1.5 text-[#d4a853] hover:text-[#f0d48a] hover:bg-[#d4a853]/10 btn-ghost-gold"
            >
              <ChevronRight className="h-4 w-4" />
              السابق
            </Button>
            <h3 className="text-xl font-bold text-gold-gradient font-[Playfair_Display] tracking-wide">
              {ARABIC_MONTHS[month]} {year}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={prevMonth}
              className="gap-1.5 text-[#d4a853] hover:text-[#f0d48a] hover:bg-[#d4a853]/10 btn-ghost-gold"
            >
              التالي
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          {/* Day Names Header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {ARABIC_DAYS.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-semibold text-[#8a8690] py-2 font-[DM_Sans]"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          {loading ? (
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg bg-[#1a1a25]" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells before first day */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="h-16" />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const dayBookings = bookingsByDay[day]
                const isToday = isCurrentMonth && day === today.getDate()
                const hasBookings = dayBookings && dayBookings.length > 0

                return (
                  <button
                    key={day}
                    onClick={() => handleDayClick(day)}
                    className={`h-16 rounded-lg text-center transition-all duration-200 relative ${
                      isToday
                        ? 'border-2 border-[#d4a853] bg-[#d4a853]/10 shadow-[0_0_12px_rgba(212,168,83,0.15)]'
                        : hasBookings
                        ? 'border border-[#1f1f2e] hover:bg-[#1a1a25] hover:border-[#d4a853]/30 cursor-pointer'
                        : 'border border-transparent hover:bg-[#1a1a25]/50'
                    }`}
                  >
                    <span
                      className={`text-sm font-medium font-[DM_Sans] ${
                        isToday
                          ? 'text-[#d4a853] font-bold'
                          : 'text-[#f5f0e8]'
                      }`}
                    >
                      {day}
                    </span>
                    {/* Booking dots */}
                    {hasBookings && (
                      <div className="flex items-center justify-center gap-0.5 mt-1">
                        {dayBookings.slice(0, 3).map((b) => (
                          <div
                            key={b.id}
                            className={`w-1.5 h-1.5 rounded-full ${DOT_COLORS[b.status] || 'bg-gray-400'}`}
                          />
                        ))}
                        {dayBookings.length > 3 && (
                          <span className="text-[8px] text-[#8a8690] font-[DM_Mono]">
                            +{dayBookings.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                )
              })}

              {/* Empty cells after last day */}
              {Array.from({
                length: (7 - ((firstDayOfWeek + daysInMonth) % 7)) % 7,
              }).map((_, i) => (
                <div key={`empty-end-${i}`} className="h-16" />
              ))}
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center justify-center gap-5 mt-5 pt-4 border-t border-[#1f1f2e]">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <span className="text-xs text-[#8a8690]">مؤكد</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <span className="text-xs text-[#8a8690]">معلق</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-xs text-[#8a8690]">ملغي</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-xs text-[#8a8690]">مكتمل</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Day Booking Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg glass-strong border-[#d4a853]/20">
          <DialogHeader>
            <DialogTitle className="text-gold-gradient font-[Playfair_Display] text-lg flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-[#d4a853]" />
              حجوزات يوم {selectedDay} {ARABIC_MONTHS[month]} {year}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {selectedBookings.length === 0 ? (
              <div className="text-center py-6 text-[#8a8690]">
                <CalendarDays className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">لا توجد حجوزات في هذا اليوم</p>
              </div>
            ) : (
              selectedBookings.map((booking) => {
                const badge = STATUS_BADGE[booking.status] || STATUS_BADGE.pending
                return (
                  <div
                    key={booking.id}
                    className="p-4 rounded-lg border border-[#1f1f2e] hover:bg-[#1a1a25] transition-all duration-200 hover:border-[#d4a853]/20"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-[#f5f0e8]">{booking.eventType}</span>
                      <Badge variant="outline" className={badge.className}>
                        {badge.label}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-[#8a8690]">
                      <p>
                        <span className="font-medium text-[#f5f0e8]">الزبون: </span>
                        {booking.customer.name}
                      </p>
                      <p>
                        <span className="font-medium text-[#f5f0e8]">الهاتف: </span>
                        <span dir="ltr">{booking.customer.phone}</span>
                      </p>
                      {booking.guests && (
                        <p>
                          <span className="font-medium text-[#f5f0e8]">عدد الضيوف: </span>
                          {booking.guests}
                        </p>
                      )}
                      <p>
                        <span className="font-medium text-[#f5f0e8]">السعر: </span>
                        <span className="text-[#d4a853] font-semibold font-[DM_Mono]">
                          {booking.hallPrice.toLocaleString()} ر.س
                        </span>
                      </p>
                      {booking.notes && (
                        <p>
                          <span className="font-medium text-[#f5f0e8]">ملاحظات: </span>
                          {booking.notes}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
