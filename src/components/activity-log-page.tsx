'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuthStore, type Role } from '@/store/auth-store'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ClipboardList, Filter } from 'lucide-react'

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${useAuthStore.getState().token}`,
})

interface ActivityLog {
  id: string
  userId: string
  userName: string
  userRole: Role
  action: string
  details: string
  createdAt: string
}

interface UserOption {
  id: string
  name: string
  role: Role
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const ACTION_LABELS: Record<string, string> = {
  create_customer: 'إنشاء زبون',
  update_customer: 'تعديل زبون',
  delete_customer: 'حذف زبون',
  create_booking: 'إنشاء حجز',
  update_booking: 'تعديل حجز',
  delete_booking: 'حذف حجز',
  create_payment: 'تسجيل دفعة',
  update_payment: 'تعديل دفعة',
  delete_payment: 'حذف دفعة',
  control_gate: 'تحكم بالبوابة',
  control_door: 'تحكم بالباب',
  control_lights: 'تحكم بالإضاءة',
  user_action: 'إجراء مستخدم',
}

const ACTION_COLORS: Record<string, string> = {
  create_customer: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  update_customer: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  delete_customer: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  create_booking: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  update_booking: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  delete_booking: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  create_payment: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  update_payment: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  delete_payment: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  control_gate: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  control_door: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  control_lights: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  user_action: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
}

const ACTION_DOT_COLORS: Record<string, string> = {
  create_customer: 'bg-emerald-500',
  update_customer: 'bg-blue-500',
  delete_customer: 'bg-red-500',
  create_booking: 'bg-emerald-500',
  update_booking: 'bg-blue-500',
  delete_booking: 'bg-red-500',
  create_payment: 'bg-green-500',
  update_payment: 'bg-blue-500',
  delete_payment: 'bg-red-500',
  control_gate: 'bg-amber-500',
  control_door: 'bg-amber-500',
  control_lights: 'bg-yellow-500',
  user_action: 'bg-gray-500',
}

const ROLE_BADGE_COLORS: Record<Role, string> = {
  admin: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  manager: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  employee: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
  viewer: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
}

const ROLE_LABELS_MAP: Record<Role, string> = {
  admin: 'مدير النظام',
  manager: 'مدير',
  employee: 'موظف',
  viewer: 'مشاهد',
}

function getRelativeTime(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)
  const diffWeek = Math.floor(diffDay / 7)

  if (diffSec < 60) return 'منذ لحظات'
  if (diffMin < 60) return `منذ ${diffMin} دقائق`
  if (diffHour < 24) return `منذ ${diffHour} ساعة`
  if (diffDay < 7) return `منذ ${diffDay} يوم`
  if (diffWeek < 4) return `منذ ${diffWeek} أسبوع`

  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('ar-SA', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ActivityLogPage() {
  const { toast } = useToast()
  const user = useAuthStore((s) => s.user)

  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [users, setUsers] = useState<UserOption[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [userIdFilter, setUserIdFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')

  const isAdmin = user?.role === 'admin' || user?.role === 'manager'

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users', { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        setUsers(
          (data.users || []).map((u: { id: string; name: string; role: Role }) => ({
            id: u.id,
            name: u.name,
            role: u.role,
          }))
        )
      }
    } catch {
      // Silent
    }
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', '20')
      if (userIdFilter && userIdFilter !== '__all__') params.set('userId', userIdFilter)
      if (actionFilter && actionFilter !== '__all__') params.set('action', actionFilter)

      const res = await fetch(`/api/activity?${params}`, { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs || [])
        setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 })
      } else {
        const err = await res.json()
        toast({ title: 'خطأ', description: err.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ', description: 'فشل الاتصال بالخادم', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [page, userIdFilter, actionFilter, toast])

  useEffect(() => {
    if (!isAdmin) return
    fetchUsers()
  }, [fetchUsers, isAdmin])

  useEffect(() => {
    if (!isAdmin) return
    fetchData()
  }, [fetchData, isAdmin])

  useEffect(() => {
    setPage(1)
  }, [userIdFilter, actionFilter])

  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null
    const pages: number[] = []
    const start = Math.max(1, page - 2)
    const end = Math.min(pagination.totalPages, page + 2)
    for (let i = start; i <= end; i++) pages.push(i)

    return (
      <div className="flex items-center justify-between pt-4 border-t border-[#1f1f2e]">
        <span className="text-sm text-[#8a8690] font-[DM_Mono]">
          {((page - 1) * pagination.limit) + 1} - {Math.min(page * pagination.limit, pagination.total)} / {pagination.total}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="text-[#8a8690] hover:text-[#f5f0e8] hover:bg-[#1a1a25]"
          >
            السابق
          </Button>
          {pages.map((p) => (
            <Button
              key={p}
              variant={p === page ? 'default' : 'ghost'}
              size="sm"
              className={`w-8 h-8 p-0 font-[DM_Mono] text-xs ${
                p === page
                  ? 'bg-[#d4a853] text-[#0a0a0f] hover:bg-[#d4a853]'
                  : 'text-[#8a8690] hover:text-[#f5f0e8] hover:bg-[#1a1a25]'
              }`}
              onClick={() => setPage(p)}
            >
              {p}
            </Button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage(page + 1)}
            className="text-[#8a8690] hover:text-[#f5f0e8] hover:bg-[#1a1a25]"
          >
            التالي
          </Button>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6 animate-fade-up">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3 text-gold-gradient font-[Playfair_Display]">
            <ClipboardList className="h-6 w-6 text-[#d4a853]" />
            سجل النشاطات
          </h2>
        </div>
        <Card className="glass border-[#d4a853]/10">
          <CardContent className="p-12 text-center text-[#8a8690]">
            <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>ليس لديك صلاحية الوصول إلى سجل النشاطات</p>
            <p className="text-sm mt-1">هذه الصفحة متاحة فقط للمدراء</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-3 text-gold-gradient font-[Playfair_Display]">
          <ClipboardList className="h-6 w-6 text-[#d4a853]" />
          سجل النشاطات
        </h2>
        <p className="text-[#8a8690] text-sm mt-1">متابعة جميع العمليات والإجراءات في النظام</p>
      </div>

      {/* Filters */}
      <Card className="glass border-[#d4a853]/10">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 text-sm text-[#d4a853]">
              <Filter className="h-4 w-4" />
              تصفية:
            </div>
            <div className="flex-1">
              <Select value={userIdFilter || '__all__'} onValueChange={(v) => setUserIdFilter(v === '__all__' ? '' : v)}>
                <SelectTrigger className="bg-[#12121a] border-[#1f1f2e] text-[#f5f0e8] focus:border-[#d4a853]/50 focus:ring-[#d4a853]/20">
                  <SelectValue placeholder="جميع المستخدمين" />
                </SelectTrigger>
                <SelectContent className="bg-[#12121a] border-[#1f1f2e]">
                  <SelectItem value="__all__">جميع المستخدمين</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} ({ROLE_LABELS_MAP[u.role]})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select value={actionFilter || '__all__'} onValueChange={(v) => setActionFilter(v === '__all__' ? '' : v)}>
                <SelectTrigger className="bg-[#12121a] border-[#1f1f2e] text-[#f5f0e8] focus:border-[#d4a853]/50 focus:ring-[#d4a853]/20">
                  <SelectValue placeholder="جميع الإجراءات" />
                </SelectTrigger>
                <SelectContent className="bg-[#12121a] border-[#1f1f2e]">
                  <SelectItem value="__all__">جميع الإجراءات</SelectItem>
                  {Object.entries(ACTION_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Log */}
      <Card className="glass border-[#d4a853]/10">
        <CardContent className="p-4 sm:p-6">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full bg-[#1a1a25]" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-[#8a8690]">
              <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>لا توجد سجلات نشاطات</p>
            </div>
          ) : (
            <div className="relative">
              {/* Vertical timeline line */}
              <div className="absolute top-0 bottom-0 start-6 w-px bg-[#1f1f2e]" />

              <div className="space-y-1">
                {logs.map((log) => {
                  const dotColor = ACTION_DOT_COLORS[log.action] || 'bg-gray-500'
                  const firstLetter = log.userName.charAt(0)

                  return (
                    <div
                      key={log.id}
                      className="relative flex gap-4 p-3 rounded-lg hover:bg-[#1a1a25]/50 transition-colors duration-200 group"
                    >
                      {/* Timeline dot */}
                      <div className="relative shrink-0 z-10">
                        <div className={`w-10 h-10 rounded-full bg-[#12121a] border-2 border-[#1f1f2e] flex items-center justify-center text-xs font-bold text-[#f5f0e8]`}>
                          {firstLetter}
                        </div>
                        <div className={`absolute -start-[1px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full ${dotColor} border-2 border-[#0a0a0f]`} style={{ left: '-5px' }} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pt-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-sm text-[#f5f0e8]">{log.userName}</span>
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 h-5 ${ROLE_BADGE_COLORS[log.userRole] || ''}`}
                          >
                            {ROLE_LABELS_MAP[log.userRole] || log.userRole}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-2 py-0.5 ${ACTION_COLORS[log.action] || ''}`}
                          >
                            {ACTION_LABELS[log.action] || log.action}
                          </Badge>
                        </div>
                        <p className="text-sm text-[#8a8690] truncate">{log.details}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] text-[#8a8690] font-[DM_Mono]">
                            {formatTime(log.createdAt)}
                          </span>
                          <span className="text-[11px] text-[#8a8690]/60">
                            {getRelativeTime(log.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {renderPagination()}
        </CardContent>
      </Card>
    </div>
  )
}
