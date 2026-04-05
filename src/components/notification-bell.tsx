'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Bell,
  Check,
  CheckCheck,
  CalendarDays,
  DollarSign,
  Users,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react'

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${useAuthStore.getState().token}`,
})

interface Notification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  createdAt: string
}

const NOTIFICATION_ICONS: Record<string, React.ElementType> = {
  booking: CalendarDays,
  payment: DollarSign,
  customer: Users,
  alert: AlertTriangle,
  info: Info,
  default: Bell,
}

const NOTIFICATION_ICON_COLORS: Record<string, string> = {
  booking: 'text-blue-400 bg-blue-500/10',
  payment: 'text-emerald-400 bg-emerald-500/10',
  customer: 'text-purple-400 bg-purple-500/10',
  alert: 'text-red-400 bg-red-500/10',
  info: 'text-[#d4a853] bg-[#d4a853]/10',
  default: 'text-[#8a8690] bg-[#8a8690]/10',
}

function getRelativeTime(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'منذ لحظات'
  if (diffMin < 60) return `منذ ${diffMin} د`
  if (diffHour < 24) return `منذ ${diffHour} س`
  if (diffDay < 7) return `منذ ${diffDay} ي`
  return date.toLocaleDateString('ar-SA', {
    month: 'short',
    day: 'numeric',
  })
}

export default function NotificationBell() {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => !n.read).length

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=10', { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
      }
    } catch {
      // Silent
    }
  }, [])

  // Initial fetch + auto-refresh every 30s
  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const markAsRead = async (id: string) => {
    try {
      await fetch('/api/mark-read', {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ notificationId: id }),
      })
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      )
    } catch {
      // Silent
    }
  }

  const markAllAsRead = async () => {
    setLoading(true)
    try {
      await fetch('/api/mark-read', {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ all: true }),
      })
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      toast({ title: 'تم التحديث', description: 'تم تعليم جميع الإشعارات كمقروءة' })
    } catch {
      toast({ title: 'خطأ', description: 'فشل تحديث الإشعارات', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        className="relative h-9 w-9"
        onClick={() => setOpen(!open)}
      >
        <Bell className={`h-[18px] w-[18px] ${unreadCount > 0 ? 'text-[#d4a853]' : 'text-[#8a8690]'}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -left-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-[0_0_8px_rgba(239,68,68,0.4)] px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full mt-2 w-80 sm:w-96 rounded-xl glass-strong border-[#d4a853]/20 shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-50 overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-[#1f1f2e]">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-[#d4a853]" />
              <span className="font-semibold text-sm text-[#f5f0e8]">الإشعارات</span>
              {unreadCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400 font-medium font-[DM_Mono]">
                  {unreadCount} جديد
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs gap-1 text-[#d4a853] hover:text-[#f0d48a] hover:bg-[#d4a853]/10 border border-[#d4a853]/30"
                  onClick={markAllAsRead}
                  disabled={loading}
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  تعيين الكل كمقروء
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-[#8a8690] hover:text-[#f5f0e8] hover:bg-[#1a1a25]"
                onClick={() => setOpen(false)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Notifications List */}
          <ScrollArea className="max-h-80">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-[#8a8690]">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">لا توجد إشعارات</p>
              </div>
            ) : (
              <div className="divide-y divide-[#1f1f2e]/50">
                {notifications.map((notif) => {
                  const Icon = NOTIFICATION_ICONS[notif.type] || NOTIFICATION_ICONS.default
                  const iconColor = NOTIFICATION_ICON_COLORS[notif.type] || NOTIFICATION_ICON_COLORS.default

                  return (
                    <div
                      key={notif.id}
                      className={`flex items-start gap-3 p-3 transition-all duration-200 cursor-pointer group ${
                        !notif.read
                          ? 'bg-[#d4a853]/5 border-s-2 border-s-[#d4a853]/50 hover:bg-[#d4a853]/10'
                          : 'hover:bg-[#1a1a25]'
                      }`}
                      onClick={() => {
                        if (!notif.read) markAsRead(notif.id)
                      }}
                    >
                      {/* Icon */}
                      <div className={`shrink-0 p-1.5 rounded-lg ${iconColor}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium truncate ${!notif.read ? 'text-[#f5f0e8]' : 'text-[#8a8690]'}`}>
                            {notif.title}
                          </p>
                          {!notif.read && (
                            <div className="shrink-0 h-2 w-2 rounded-full bg-[#d4a853]" />
                          )}
                        </div>
                        <p className="text-xs text-[#8a8690] mt-0.5 line-clamp-2">
                          {notif.message}
                        </p>
                        <p className="text-[10px] text-[#8a8690]/50 mt-1 font-[DM_Mono]">
                          {getRelativeTime(notif.createdAt)}
                        </p>
                      </div>

                      {/* Mark read button */}
                      {!notif.read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 h-6 w-6 opacity-0 group-hover:opacity-100 text-[#8a8690] hover:text-[#d4a853]"
                          onClick={(e) => {
                            e.stopPropagation()
                            markAsRead(notif.id)
                          }}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          <Separator className="bg-[#1f1f2e]" />
          <div className="p-2">
            <Button
              variant="ghost"
              className="w-full text-xs text-[#d4a853] hover:text-[#f0d48a] hover:bg-[#d4a853]/10 h-8"
              onClick={() => {
                setOpen(false)
                // Could navigate to notifications page
              }}
            >
              عرض جميع الإشعارات
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
