'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Search, Pencil, Trash2, CalendarDays, Filter } from 'lucide-react'
import { ReadOnlyBanner, PartialPermissionBanner, usePermissions } from '@/components/permission-banner'

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${useAuthStore.getState().token}`,
})

interface Booking {
  id: string
  customerId: string
  customer: { id: string; name: string; phone: string }
  eventDate: string
  eventType: string
  guestCount: number
  hallPrice: number
  status: string
  notes: string | null
  totalPaid: number
  remainingAmount: number
  paymentCount: number
  createdAt: string
}

interface CustomerOption {
  id: string
  name: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const STATUS_TABS = [
  { key: '', label: 'الكل' },
  { key: 'pending', label: 'معلق' },
  { key: 'confirmed', label: 'مؤكد' },
  { key: 'cancelled', label: 'ملغي' },
  { key: 'completed', label: 'مكتمل' },
]

const STATUS_BADGE: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
  pending: { label: 'معلق', variant: 'outline', className: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400' },
  confirmed: { label: 'مؤكد', variant: 'default', className: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400' },
  cancelled: { label: 'ملغي', variant: 'destructive', className: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400' },
  completed: { label: 'مكتمل', variant: 'default', className: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400' },
}

const emptyForm = {
  customerId: '',
  eventDate: '',
  eventType: '',
  guestCount: '',
  hallPrice: '',
  status: 'pending',
  notes: '',
}

export default function BookingManagement() {
  const { toast } = useToast()
  const user = useAuthStore((s) => s.user)

  const [bookings, setBookings] = useState<Booking[]>([])
  const [customers, setCustomers] = useState<CustomerOption[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [customerFilter, setCustomerFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 })

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Booking | null>(null)
  const [formData, setFormData] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingItem, setDeletingItem] = useState<Booking | null>(null)
  const [deleting, setDeleting] = useState(false)

  const { isReadOnly, hasAnyAction } = usePermissions()
  const canWrite = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'employee'
  const canDelete = user?.role === 'admin' || user?.role === 'manager'
  const showActions = hasAnyAction(user?.role, 'bookings')
  const userIsReadOnly = isReadOnly(user?.role, 'bookings')

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch('/api/customers?limit=100', { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        setCustomers(data.customers.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })))
      }
    } catch {
      // Silent fail for customer dropdown
    }
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      if (customerFilter) params.set('customerId', customerFilter)
      if (search) params.set('search', search)
      params.set('page', page.toString())
      params.set('limit', '20')

      const res = await fetch(`/api/bookings?${params}`, { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        setBookings(data.bookings)
        setPagination(data.pagination)
      } else {
        const err = await res.json()
        toast({ title: 'خطأ', description: err.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ', description: 'فشل الاتصال بالخادم', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [statusFilter, customerFilter, search, page, toast])

  useEffect(() => {
    fetchCustomers()
    fetchData()
  }, [fetchCustomers, fetchData])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      fetchData()
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [statusFilter, customerFilter])

  const openCreate = () => {
    setEditingItem(null)
    setFormData(emptyForm)
    setDialogOpen(true)
  }

  const openEdit = (booking: Booking) => {
    setEditingItem(booking)
    setFormData({
      customerId: booking.customerId,
      eventDate: new Date(booking.eventDate).toISOString().split('T')[0],
      eventType: booking.eventType,
      guestCount: booking.guestCount.toString(),
      hallPrice: booking.hallPrice.toString(),
      status: booking.status,
      notes: booking.notes || '',
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.customerId || !formData.eventDate || !formData.eventType || !formData.guestCount || !formData.hallPrice) {
      toast({ title: 'خطأ', description: 'جميع الحقول المطلوبة يجب أن تُملأ', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    try {
      const url = editingItem ? `/api/bookings/${editingItem.id}` : '/api/bookings'
      const method = editingItem ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        toast({ title: editingItem ? 'تم تحديث الحجز بنجاح' : 'تم إضافة الحجز بنجاح' })
        setDialogOpen(false)
        fetchData()
      } else {
        const err = await res.json()
        toast({ title: 'خطأ', description: err.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ', description: 'فشل الاتصال بالخادم', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const openDelete = (booking: Booking) => {
    setDeletingItem(booking)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingItem) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/bookings/${deletingItem.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      if (res.ok) {
        toast({ title: 'تم حذف الحجز بنجاح' })
        setDeleteDialogOpen(false)
        setDeletingItem(null)
        fetchData()
      } else {
        const err = await res.json()
        toast({ title: 'خطأ', description: err.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ', description: 'فشل الاتصال بالخادم', variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const renderSkeleton = () => (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40 animate-shimmer" />
            <Skeleton className="h-3 w-28 animate-shimmer" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full animate-shimmer" />
          <Skeleton className="h-4 w-14 animate-shimmer" />
          <Skeleton className="h-8 w-8 rounded animate-shimmer" />
        </div>
      ))}
    </div>
  )

  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null
    const pages: number[] = []
    const start = Math.max(1, page - 2)
    const end = Math.min(pagination.totalPages, page + 2)
    for (let i = start; i <= end; i++) pages.push(i)

    return (
      <div className="flex items-center justify-between pt-4">
        <div className="divider-gold flex-1" />
        <span className="text-xs px-4 text-[#8a8690] font-[family-name:var(--font-num)]" dir="ltr">
          {((page - 1) * pagination.limit) + 1} - {Math.min(page * pagination.limit, pagination.total)} / {pagination.total}
        </span>
        <div className="flex items-center gap-1 px-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="text-[#8a8690] hover:text-[#d4a853] hover:bg-[rgba(212,168,83,0.06)] text-xs"
          >
            السابق
          </Button>
          {pages.map((p) => (
            <Button
              key={p}
              variant="ghost"
              size="sm"
              className={`w-8 h-8 p-0 text-xs font-[family-name:var(--font-num)] rounded-lg ${
                p === page
                  ? 'bg-gradient-to-b from-[#d4a853] to-[#b8912e] text-[#0a0a0f] font-semibold shadow-[0_2px_12px_rgba(212,168,83,0.3)]'
                  : 'text-[#8a8690] hover:text-[#f5f0e8] hover:bg-[rgba(255,255,255,0.04)]'
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
            className="text-[#8a8690] hover:text-[#d4a853] hover:bg-[rgba(212,168,83,0.06)] text-xs"
          >
            التالي
          </Button>
        </div>
        <div className="divider-gold flex-1" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Permission Banner */}
      {userIsReadOnly && <ReadOnlyBanner message="يمكنك فقط عرض الحجوزات. لإنشاء أو تعديل حجز، تواصل مع المدير." />}
      {!userIsReadOnly && canWrite && !canDelete && (
        <PartialPermissionBanner canWrite={canWrite} canDelete={false} resource="الحجوزات" />
      )}

      {/* Header */}
      <div className="animate-fade-up flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-[family-name:var(--font-display)] font-bold flex items-center gap-3">
            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#d4a853] to-[#b8912e] shadow-[0_2px_12px_rgba(212,168,83,0.25)]">
              <CalendarDays className="h-5 w-5 text-[#0a0a0f]" />
            </span>
            <span className="text-gold-gradient">إدارة الحجوزات</span>
          </h2>
          <p className="text-[#8a8690] text-sm mt-1.5 mr-[52px]">
            إجمالي <span className="text-[#f5f0e8] font-[family-name:var(--font-num)]">{pagination.total}</span> حجز
          </p>
        </div>
        {canWrite && (
          <Button onClick={openCreate} className="btn-gold gap-2 rounded-xl px-5">
            <Plus className="h-4 w-4" />
            إضافة حجز
          </Button>
        )}
      </div>

      {/* Status Tabs */}
      <div className="glass rounded-2xl p-2 animate-fade-up stagger-1">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                statusFilter === tab.key
                  ? 'bg-gradient-to-b from-[#d4a853] to-[#b8912e] text-[#0a0a0f] shadow-[0_2px_12px_rgba(212,168,83,0.25)]'
                  : 'text-[#8a8690] hover:text-[#f5f0e8] hover:bg-[rgba(255,255,255,0.04)] bg-[rgba(255,255,255,0.02)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search & Filter */}
      <div className="glass rounded-2xl p-4 animate-fade-up stagger-2">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a8690]" />
            <Input
              placeholder="بحث بالاسم أو نوع الحدث..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10 bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.06)] text-[#f5f0e8] placeholder:text-[rgba(138,134,144,0.6)] focus-visible:ring-[#d4a853] focus-visible:border-[rgba(212,168,83,0.3)] focus-visible:bg-[rgba(255,255,255,0.05)] rounded-xl h-11"
            />
          </div>
          <div className="relative sm:w-56">
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a8690] pointer-events-none" />
            <Select value={customerFilter} onValueChange={(v) => setCustomerFilter(v)}>
              <SelectTrigger className="pr-10 bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.06)] text-[#f5f0e8] rounded-xl h-11 focus:ring-[#d4a853]">
                <SelectValue placeholder="تصفية بالزبون" />
              </SelectTrigger>
              <SelectContent className="bg-[#14141e] border-[rgba(255,255,255,0.08)] rounded-xl">
                <SelectItem value="__all__">جميع الزبائن</SelectItem>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden animate-fade-up stagger-3">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b-[rgba(255,255,255,0.04)]">
                <TableHead className="text-right font-semibold text-[#8a8690] text-xs uppercase tracking-wider py-3.5 px-4">الزبون</TableHead>
                <TableHead className="text-right font-semibold text-[#8a8690] text-xs uppercase tracking-wider py-3.5 px-4">تاريخ الحدث</TableHead>
                <TableHead className="text-right font-semibold text-[#8a8690] text-xs uppercase tracking-wider py-3.5 px-4">نوع الحدث</TableHead>
                <TableHead className="text-center font-semibold text-[#8a8690] text-xs uppercase tracking-wider py-3.5 px-4">الضيوف</TableHead>
                <TableHead className="text-center font-semibold text-[#8a8690] text-xs uppercase tracking-wider py-3.5 px-4">السعر</TableHead>
                <TableHead className="text-center font-semibold text-[#8a8690] text-xs uppercase tracking-wider py-3.5 px-4">المدفوع</TableHead>
                <TableHead className="text-center font-semibold text-[#8a8690] text-xs uppercase tracking-wider py-3.5 px-4">الحالة</TableHead>
                {showActions && <TableHead className="text-center font-semibold text-[#8a8690] text-xs uppercase tracking-wider py-3.5 px-4">الإجراءات</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={showActions ? 8 : 7} className="p-4">{renderSkeleton()}</TableCell>
                </TableRow>
              ) : bookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={showActions ? 8 : 7} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3 animate-fade-in">
                      <div className="w-16 h-16 rounded-2xl bg-[rgba(212,168,83,0.06)] flex items-center justify-center animate-float">
                        <CalendarDays className="h-7 w-7 text-[#d4a853] opacity-40" />
                      </div>
                      <div className="text-center">
                        <p className="text-[#8a8690] text-sm">لا يوجد حجوزات</p>
                        <p className="text-[rgba(138,134,144,0.5)] text-xs mt-1">اضغط على &quot;إضافة حجز&quot; لبدء الإضافة</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                bookings.map((booking) => {
                  const badge = STATUS_BADGE[booking.status] || STATUS_BADGE.pending
                  const paidPercent = booking.hallPrice > 0
                    ? Math.round((booking.totalPaid / booking.hallPrice) * 100)
                    : 0
                  return (
                    <TableRow key={booking.id} className="table-row-hover border-b-[rgba(255,255,255,0.03)]">
                      <TableCell className="py-3.5 px-4">
                        <span className="font-medium text-[#f5f0e8]">{booking.customer.name}</span>
                      </TableCell>
                      <TableCell className="py-3.5 px-4">
                        <span className="text-sm text-[#f5f0e8]">
                          {formatDate(booking.eventDate)}
                        </span>
                      </TableCell>
                      <TableCell className="py-3.5 px-4">
                        <span className="text-[#f5f0e8]">{booking.eventType}</span>
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-center">
                        <span className="font-[family-name:var(--font-num)] text-sm text-[#f5f0e8]">{booking.guestCount}</span>
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-center">
                        <span className="font-[family-name:var(--font-num)] text-sm text-[#f5f0e8]">{booking.hallPrice.toLocaleString()}</span>
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <span className="font-[family-name:var(--font-num)] text-sm text-[#f5f0e8]">{booking.totalPaid.toLocaleString()}</span>
                          <div className="w-16 h-1 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-l from-[#d4a853] to-[#b8912e] transition-all duration-500"
                              style={{ width: `${Math.min(paidPercent, 100)}%` }}
                            />
                          </div>
                          <span className="font-[family-name:var(--font-num)] text-[10px] text-[#8a8690]" dir="ltr">{paidPercent}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          booking.status === 'confirmed'
                            ? 'bg-[rgba(34,197,94,0.1)] text-[#22c55e] border border-[rgba(34,197,94,0.15)]'
                            : booking.status === 'pending'
                            ? 'bg-[rgba(234,179,8,0.1)] text-[#eab308] border border-[rgba(234,179,8,0.15)]'
                            : booking.status === 'cancelled'
                            ? 'bg-[rgba(239,68,68,0.1)] text-[#ef4444] border border-[rgba(239,68,68,0.15)]'
                            : booking.status === 'completed'
                            ? 'bg-[rgba(59,130,246,0.1)] text-[#3b82f6] border border-[rgba(59,130,246,0.15)]'
                            : 'bg-[rgba(255,255,255,0.04)] text-[#8a8690] border border-[rgba(255,255,255,0.06)]'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            booking.status === 'confirmed' ? 'bg-[#22c55e]'
                            : booking.status === 'pending' ? 'bg-[#eab308]'
                            : booking.status === 'cancelled' ? 'bg-[#ef4444]'
                            : booking.status === 'completed' ? 'bg-[#3b82f6]'
                            : 'bg-[#8a8690]'
                          }`} />
                          {badge.label}
                        </span>
                      </TableCell>
                      {showActions && (
                        <TableCell className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-1">
                            {canWrite && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-[#8a8690] hover:text-[#d4a853] hover:bg-[rgba(212,168,83,0.08)] rounded-lg transition-colors"
                                onClick={() => openEdit(booking)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-[#8a8690] hover:text-[#ef4444] hover:bg-[rgba(239,68,68,0.08)] rounded-lg transition-colors"
                                onClick={() => openDelete(booking)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
        {renderPagination()}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto glass-strong rounded-2xl border-[rgba(212,168,83,0.1)] p-0">
          <div className="bg-gradient-to-l from-[rgba(212,168,83,0.08)] to-transparent p-6 pb-4 border-b-[rgba(255,255,255,0.04)] sticky top-0 z-10">
            <DialogHeader>
              <DialogTitle className="text-[#f5f0e8] font-[family-name:var(--font-display)] text-lg text-center">
                {editingItem ? 'تعديل الحجز' : 'إضافة حجز جديد'}
              </DialogTitle>
            </DialogHeader>
          </div>
          <div className="space-y-4 p-6 pt-5">
            <div className="space-y-2">
              <Label className="text-[#8a8690] text-xs uppercase tracking-wider">الزبون *</Label>
              <Select
                value={formData.customerId}
                onValueChange={(v) => setFormData({ ...formData, customerId: v })}
                disabled={!!editingItem}
              >
                <SelectTrigger className="bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.06)] text-[#f5f0e8] rounded-xl h-11 focus:ring-[#d4a853]">
                  <SelectValue placeholder="اختر الزبون" />
                </SelectTrigger>
                <SelectContent className="bg-[#14141e] border-[rgba(255,255,255,0.08)] rounded-xl">
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bk-date" className="text-[#8a8690] text-xs uppercase tracking-wider">تاريخ الحدث *</Label>
                <Input
                  id="bk-date"
                  type="date"
                  value={formData.eventDate}
                  onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                  className="bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.06)] text-[#f5f0e8] font-[family-name:var(--font-num)] focus-visible:ring-[#d4a853] focus-visible:border-[rgba(212,168,83,0.3)] rounded-xl h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bk-guests" className="text-[#8a8690] text-xs uppercase tracking-wider">عدد الضيوف *</Label>
                <Input
                  id="bk-guests"
                  type="number"
                  value={formData.guestCount}
                  onChange={(e) => setFormData({ ...formData, guestCount: e.target.value })}
                  placeholder="مثال: 200"
                  className="bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.06)] text-[#f5f0e8] font-[family-name:var(--font-num)] placeholder:text-[rgba(138,134,144,0.5)] focus-visible:ring-[#d4a853] focus-visible:border-[rgba(212,168,83,0.3)] rounded-xl h-11"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bk-type" className="text-[#8a8690] text-xs uppercase tracking-wider">نوع الحدث *</Label>
              <Input
                id="bk-type"
                value={formData.eventType}
                onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                placeholder="زفاف، خطوبة، حفل..."
                className="bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.06)] text-[#f5f0e8] placeholder:text-[rgba(138,134,144,0.5)] focus-visible:ring-[#d4a853] focus-visible:border-[rgba(212,168,83,0.3)] rounded-xl h-11"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bk-price" className="text-[#8a8690] text-xs uppercase tracking-wider">سعر الصالة *</Label>
                <Input
                  id="bk-price"
                  type="number"
                  value={formData.hallPrice}
                  onChange={(e) => setFormData({ ...formData, hallPrice: e.target.value })}
                  placeholder="0"
                  className="bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.06)] text-[#f5f0e8] font-[family-name:var(--font-num)] placeholder:text-[rgba(138,134,144,0.5)] focus-visible:ring-[#d4a853] focus-visible:border-[rgba(212,168,83,0.3)] rounded-xl h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#8a8690] text-xs uppercase tracking-wider">الحالة</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v })}
                >
                  <SelectTrigger className="bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.06)] text-[#f5f0e8] rounded-xl h-11 focus:ring-[#d4a853]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#14141e] border-[rgba(255,255,255,0.08)] rounded-xl">
                    <SelectItem value="pending">معلق</SelectItem>
                    <SelectItem value="confirmed">مؤكد</SelectItem>
                    <SelectItem value="completed">مكتمل</SelectItem>
                    <SelectItem value="cancelled">ملغي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bk-notes" className="text-[#8a8690] text-xs uppercase tracking-wider">ملاحظات</Label>
              <Textarea
                id="bk-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="ملاحظات إضافية..."
                rows={3}
                className="bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.06)] text-[#f5f0e8] placeholder:text-[rgba(138,134,144,0.5)] focus-visible:ring-[#d4a853] focus-visible:border-[rgba(212,168,83,0.3)] rounded-xl resize-none"
              />
            </div>
          </div>
          <div className="p-6 pt-2 flex gap-2 justify-end border-t-[rgba(255,255,255,0.04)]">
            <Button
              variant="ghost"
              onClick={() => setDialogOpen(false)}
              className="text-[#8a8690] hover:text-[#f5f0e8] hover:bg-[rgba(255,255,255,0.04)] rounded-xl"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-gold rounded-xl px-6"
            >
              {submitting ? 'جاري الحفظ...' : editingItem ? 'حفظ التعديلات' : 'إضافة الحجز'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="glass-strong rounded-2xl border-[rgba(239,68,68,0.1)] p-0 overflow-hidden">
          <div className="bg-gradient-to-l from-[rgba(239,68,68,0.06)] to-transparent p-6 pb-4 border-b-[rgba(255,255,255,0.04)]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-[#f5f0e8] font-[family-name:var(--font-display)] text-lg text-center">
                تأكيد الحذف
              </AlertDialogTitle>
            </AlertDialogHeader>
          </div>
          <div className="p-6 pt-5">
            <AlertDialogDescription className="text-[#8a8690] text-center text-sm leading-relaxed">
              هل أنت متأكد من حذف هذا الحجز؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </div>
          <div className="p-6 pt-2 flex gap-2 justify-center border-t-[rgba(255,255,255,0.04)]">
            <AlertDialogCancel
              disabled={deleting}
              className="text-[#8a8690] hover:text-[#f5f0e8] hover:bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.06)] rounded-xl"
            >
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-gradient-to-b from-[#ef4444] to-[#dc2626] text-white hover:from-[#f87171] hover:to-[#ef4444] shadow-[0_2px_12px_rgba(239,68,68,0.25)] rounded-xl px-6"
            >
              {deleting ? 'جاري الحذف...' : 'حذف'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
