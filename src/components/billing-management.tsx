'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Plus, Pencil, Trash2, CreditCard, DollarSign, Clock, CheckCircle2 } from 'lucide-react'
import { ReadOnlyBanner, PartialPermissionBanner, usePermissions } from '@/components/permission-banner'

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${useAuthStore.getState().token}`,
})

interface Payment {
  id: string
  bookingId: string
  booking: {
    id: string
    eventType: string
    hallPrice: number
    customer: { id: string; name: string; phone: string }
  }
  amount: number
  method: string
  status: string
  receiptNumber: string | null
  notes: string | null
  paidAt: string
  createdAt: string
}

interface BookingOption {
  id: string
  eventType: string
  hallPrice: number
  customerName: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const PAYMENT_STATUS_BADGE: Record<string, { label: string; className: string }> = {
  pending: { label: 'معلق', className: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400' },
  partial: { label: 'جزئي', className: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400' },
  paid: { label: 'مدفوع', className: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400' },
  refunded: { label: 'مسترد', className: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/30 dark:text-gray-400' },
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'نقدي',
  transfer: 'تحويل بنكي',
  card: 'بطاقة',
  cheque: 'شيك',
}

const emptyForm = {
  bookingId: '',
  amount: '',
  method: 'cash',
  status: 'paid',
  receiptNumber: '',
  notes: '',
}

export default function BillingManagement() {
  const { toast } = useToast()
  const user = useAuthStore((s) => s.user)

  const [payments, setPayments] = useState<Payment[]>([])
  const [bookings, setBookings] = useState<BookingOption[]>([])
  const [loading, setLoading] = useState(true)
  const [bookingFilter, setBookingFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 })

  // Summary stats
  const [summary, setSummary] = useState({ totalInvoices: 0, totalPaid: 0, totalRemaining: 0, activeBookings: 0 })

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Payment | null>(null)
  const [formData, setFormData] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingItem, setDeletingItem] = useState<Payment | null>(null)
  const [deleting, setDeleting] = useState(false)

  const { isReadOnly, hasAnyAction } = usePermissions()
  const canWrite = user?.role === 'admin' || user?.role === 'manager'
  const canDelete = user?.role === 'admin' || user?.role === 'manager'
  const showActions = hasAnyAction(user?.role, 'payments')
  const userIsReadOnly = isReadOnly(user?.role, 'payments')

  const fetchBookings = useCallback(async () => {
    try {
      const res = await fetch('/api/bookings?limit=100&status=confirmed,pending', { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        setBookings(
          data.bookings.map((b: { id: string; eventType: string; hallPrice: number; customer: { name: string } }) => ({
            id: b.id,
            eventType: b.eventType,
            hallPrice: b.hallPrice,
            customerName: b.customer.name,
          }))
        )
      }
    } catch {
      // Silent
    }
  }, [])

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch('/api/bookings?limit=1000', { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        const allBookings = data.bookings
        const totalInvoices = allBookings.reduce((sum: number, b: { hallPrice: number }) => sum + b.hallPrice, 0)
        const totalPaid = allBookings.reduce((sum: number, b: { totalPaid: number }) => sum + (b.totalPaid || 0), 0)
        const activeBookings = allBookings.filter((b: { status: string }) => b.status === 'confirmed' || b.status === 'pending').length
        setSummary({
          totalInvoices,
          totalPaid,
          totalRemaining: Math.max(0, totalInvoices - totalPaid),
          activeBookings,
        })
      }
    } catch {
      // Silent
    }
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (bookingFilter && bookingFilter !== '__all__') params.set('bookingId', bookingFilter)
      if (statusFilter) params.set('status', statusFilter)
      params.set('page', page.toString())
      params.set('limit', '20')

      const res = await fetch(`/api/payments?${params}`, { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        setPayments(data.payments)
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
  }, [bookingFilter, statusFilter, page, toast])

  useEffect(() => {
    fetchBookings()
    fetchSummary()
    fetchData()
  }, [fetchBookings, fetchSummary, fetchData])

  useEffect(() => {
    setPage(1)
  }, [bookingFilter, statusFilter])

  const openCreate = () => {
    setEditingItem(null)
    setFormData(emptyForm)
    setDialogOpen(true)
  }

  const openEdit = (payment: Payment) => {
    setEditingItem(payment)
    setFormData({
      bookingId: payment.bookingId,
      amount: payment.amount.toString(),
      method: payment.method,
      status: payment.status,
      receiptNumber: payment.receiptNumber || '',
      notes: payment.notes || '',
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.bookingId || !formData.amount) {
      toast({ title: 'خطأ', description: 'رقم الحجز والمبلغ مطلوبان', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    try {
      const url = editingItem ? `/api/payments/${editingItem.id}` : '/api/payments'
      const method = editingItem ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        toast({ title: editingItem ? 'تم تحديث الدفعة بنجاح' : 'تم إضافة الدفعة بنجاح' })
        setDialogOpen(false)
        fetchData()
        fetchSummary()
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

  const openDelete = (payment: Payment) => {
    setDeletingItem(payment)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingItem) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/payments/${deletingItem.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      if (res.ok) {
        toast({ title: 'تم حذف الدفعة بنجاح' })
        setDeleteDialogOpen(false)
        setDeletingItem(null)
        fetchData()
        fetchSummary()
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
      month: 'short',
      day: 'numeric',
    })
  }

  const renderSkeleton = () => (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3">
          <Skeleton className="h-4 w-16 animate-shimmer" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32 animate-shimmer" />
            <Skeleton className="h-3 w-24 animate-shimmer" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full animate-shimmer" />
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
            className="text-[#8a8690] hover:text-emerald-400 hover:bg-emerald-500/10 text-xs"
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
                  ? 'bg-gradient-to-b from-emerald-500 to-emerald-600 text-[#0a0a0f] font-semibold shadow-[0_2px_12px_rgba(16,185,129,0.3)]'
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
            className="text-[#8a8690] hover:text-emerald-400 hover:bg-emerald-500/10 text-xs"
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
      {userIsReadOnly && <ReadOnlyBanner message="يمكنك فقط عرض المدفوعات والفواتير. لتسجيل دفعة جديدة، تواصل مع المدير." />}

      {/* Header */}
      <div className="animate-fade-up flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-[family-name:var(--font-display)] font-bold flex items-center gap-3">
            <span className="page-icon page-icon-billing">
              <CreditCard className="h-5 w-5 text-[#0a0a0f]" />
            </span>
            <span className="text-gradient-billing">إدارة الفواتير والمدفوعات</span>
          </h2>
          <p className="text-[#8a8690] text-sm mt-1.5 mr-[52px]">
            متابعة المدفوعات والفواتير
          </p>
        </div>
        {canWrite && (
          <Button onClick={openCreate} className="btn-billing gap-2 rounded-xl px-5">
            <Plus className="h-4 w-4" />
            إضافة دفعة
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-up stagger-1">
        <div className="glass card-hover rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-[rgba(59,130,246,0.1)]">
              <DollarSign className="h-5 w-5 text-[#3b82f6]" />
            </div>
            <div>
              <p className="text-xs text-[#8a8690]">إجمالي الفواتير</p>
              <p className="text-xl font-bold font-[family-name:var(--font-num)] text-[#f5f0e8]">
                {summary.totalInvoices.toLocaleString()}
                <span className="text-xs text-[#8a8690] mr-1">ر.س</span>
              </p>
            </div>
          </div>
        </div>
        <div className="glass card-hover rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-[rgba(34,197,94,0.1)]">
              <CheckCircle2 className="h-5 w-5 text-[#22c55e]" />
            </div>
            <div>
              <p className="text-xs text-[#8a8690]">المدفوع</p>
              <p className="text-xl font-bold font-[family-name:var(--font-num)] text-[#22c55e]">
                {summary.totalPaid.toLocaleString()}
                <span className="text-xs text-[#8a8690] mr-1">ر.س</span>
              </p>
            </div>
          </div>
        </div>
        <div className="glass card-hover rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-[rgba(239,68,68,0.1)]">
              <Clock className="h-5 w-5 text-[#ef4444]" />
            </div>
            <div>
              <p className="text-xs text-[#8a8690]">المتبقي</p>
              <p className="text-xl font-bold font-[family-name:var(--font-num)] text-[#ef4444]">
                {summary.totalRemaining.toLocaleString()}
                <span className="text-xs text-[#8a8690] mr-1">ر.س</span>
              </p>
            </div>
          </div>
        </div>
        <div className="glass card-hover rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/10">
              <CreditCard className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-[#8a8690]">حجوزات نشطة</p>
              <p className="text-xl font-bold font-[family-name:var(--font-num)] text-[#f5f0e8]">
                {summary.activeBookings}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass rounded-2xl p-4 animate-fade-up stagger-2">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Select value={bookingFilter || '__all__'} onValueChange={(v) => setBookingFilter(v === '__all__' ? '' : v)}>
              <SelectTrigger className="bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.06)] text-[#f5f0e8] rounded-xl h-11 focus:ring-emerald-500">
                <SelectValue placeholder="تصفية بالحجز" />
              </SelectTrigger>
              <SelectContent className="bg-[#14141e] border-[rgba(255,255,255,0.08)] rounded-xl max-h-64 overflow-y-auto">
                <SelectItem value="__all__">جميع الحجوزات</SelectItem>
                {bookings.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.customerName} - {b.eventType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Select value={statusFilter || '__all__'} onValueChange={(v) => setStatusFilter(v === '__all__' ? '' : v)}>
              <SelectTrigger className="bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.06)] text-[#f5f0e8] rounded-xl h-11 focus:ring-emerald-500">
                <SelectValue placeholder="تصفية بحالة الدفع" />
              </SelectTrigger>
              <SelectContent className="bg-[#14141e] border-[rgba(255,255,255,0.08)] rounded-xl">
                <SelectItem value="__all__">جميع الحالات</SelectItem>
                <SelectItem value="pending">معلق</SelectItem>
                <SelectItem value="partial">مدفوع جزئياً</SelectItem>
                <SelectItem value="paid">مدفوع</SelectItem>
                <SelectItem value="refunded">مسترد</SelectItem>
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
                <TableHead className="text-right font-semibold text-[#8a8690] text-xs uppercase tracking-wider py-3.5 px-4">رقم الفاتورة</TableHead>
                <TableHead className="text-right font-semibold text-[#8a8690] text-xs uppercase tracking-wider py-3.5 px-4">الحجز</TableHead>
                <TableHead className="text-right font-semibold text-[#8a8690] text-xs uppercase tracking-wider py-3.5 px-4">الزبون</TableHead>
                <TableHead className="text-center font-semibold text-[#8a8690] text-xs uppercase tracking-wider py-3.5 px-4">المبلغ</TableHead>
                <TableHead className="text-center font-semibold text-[#8a8690] text-xs uppercase tracking-wider py-3.5 px-4">طريقة الدفع</TableHead>
                <TableHead className="text-center font-semibold text-[#8a8690] text-xs uppercase tracking-wider py-3.5 px-4">الحالة</TableHead>
                <TableHead className="text-center font-semibold text-[#8a8690] text-xs uppercase tracking-wider py-3.5 px-4">التاريخ</TableHead>
                {showActions && <TableHead className="text-center font-semibold text-[#8a8690] text-xs uppercase tracking-wider py-3.5 px-4">الإجراءات</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={showActions ? 8 : 7} className="p-4">{renderSkeleton()}</TableCell>
                </TableRow>
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={showActions ? 8 : 7} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3 animate-fade-in">
                      <div className="w-16 h-16 rounded-2xl bg-emerald-500/8 flex items-center justify-center animate-float">
                        <CreditCard className="h-7 w-7 text-emerald-500 opacity-40" />
                      </div>
                      <div className="text-center">
                        <p className="text-[#8a8690] text-sm">لا يوجد مدفوعات</p>
                        <p className="text-[rgba(138,134,144,0.5)] text-xs mt-1">اضغط على &quot;إضافة دفعة&quot; لتسجيل دفعة جديدة</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => {
                  const badge = PAYMENT_STATUS_BADGE[payment.status] || PAYMENT_STATUS_BADGE.pending
                  return (
                    <TableRow key={payment.id} className="table-row-hover border-b-[rgba(255,255,255,0.03)]">
                      <TableCell className="py-3.5 px-4">
                        <span className="font-[family-name:var(--font-num)] text-xs text-[#8a8690]" dir="ltr">
                          {payment.id.slice(0, 8)}
                        </span>
                      </TableCell>
                      <TableCell className="py-3.5 px-4">
                        <span className="text-sm text-[#f5f0e8]">{payment.booking.eventType}</span>
                      </TableCell>
                      <TableCell className="py-3.5 px-4">
                        <span className="font-medium text-[#f5f0e8]">{payment.booking.customer.name}</span>
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-center">
                        <span className={`font-[family-name:var(--font-num)] font-semibold text-sm ${
                          payment.status === 'paid' ? 'text-[#22c55e]' : payment.status === 'pending' ? 'text-[#ef4444]' : 'text-[#f5f0e8]'
                        }`}>
                          {payment.amount.toLocaleString()}
                          <span className="text-[10px] text-[#8a8690] mr-1">ر.س</span>
                        </span>
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-center">
                        <span className="glass inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs text-[#f5f0e8] font-medium">
                          {PAYMENT_METHOD_LABELS[payment.method] || payment.method}
                        </span>
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                          payment.status === 'paid'
                            ? 'bg-[rgba(34,197,94,0.1)] text-[#22c55e] border-[rgba(34,197,94,0.15)]'
                            : payment.status === 'pending'
                            ? 'bg-[rgba(234,179,8,0.1)] text-[#eab308] border-[rgba(234,179,8,0.15)]'
                            : payment.status === 'partial'
                            ? 'bg-[rgba(249,115,22,0.1)] text-[#f97316] border-[rgba(249,115,22,0.15)]'
                            : payment.status === 'refunded'
                            ? 'bg-[rgba(138,134,144,0.1)] text-[#8a8690] border-[rgba(138,134,144,0.15)]'
                            : 'bg-[rgba(255,255,255,0.04)] text-[#8a8690] border-[rgba(255,255,255,0.06)]'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            payment.status === 'paid' ? 'bg-[#22c55e]'
                            : payment.status === 'pending' ? 'bg-[#eab308]'
                            : payment.status === 'partial' ? 'bg-[#f97316]'
                            : payment.status === 'refunded' ? 'bg-[#8a8690]'
                            : 'bg-[#8a8690]'
                          }`} />
                          {badge.label}
                        </span>
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-center">
                        <span className="text-sm text-[#8a8690]">{formatDate(payment.paidAt)}</span>
                      </TableCell>
                      {showActions && (
                        <TableCell className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-1">
                            {canWrite && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-[#8a8690] hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                onClick={() => openEdit(payment)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-[#8a8690] hover:text-[#ef4444] hover:bg-[rgba(239,68,68,0.08)] rounded-lg transition-colors"
                                onClick={() => openDelete(payment)}
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
        <DialogContent className="sm:max-w-md glass-strong rounded-2xl border-emerald-500/15 p-0 overflow-hidden">
          <div className="bg-gradient-to-l from-emerald-500/8 to-transparent p-6 pb-4 border-b-[rgba(255,255,255,0.04)]">
            <DialogHeader>
              <DialogTitle className="text-[#f5f0e8] font-[family-name:var(--font-display)] text-lg text-center">
                {editingItem ? 'تعديل الدفعة' : 'إضافة دفعة جديدة'}
              </DialogTitle>
            </DialogHeader>
          </div>
          <div className="space-y-4 p-6 pt-5">
            <div className="space-y-2">
              <Label className="text-[#8a8690] text-xs uppercase tracking-wider">الحجز *</Label>
              <Select
                value={formData.bookingId}
                onValueChange={(v) => setFormData({ ...formData, bookingId: v })}
                disabled={!!editingItem}
              >
                <SelectTrigger className="bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.06)] text-[#f5f0e8] rounded-xl h-11 focus:ring-emerald-500">
                  <SelectValue placeholder="اختر الحجز" />
                </SelectTrigger>
                <SelectContent className="bg-[#14141e] border-[rgba(255,255,255,0.08)] rounded-xl max-h-64 overflow-y-auto">
                  {bookings.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.customerName} - {b.eventType} ({b.hallPrice.toLocaleString()} ر.س)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pay-amount" className="text-[#8a8690] text-xs uppercase tracking-wider">المبلغ *</Label>
              <Input
                id="pay-amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="أدخل المبلغ"
                className="bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.06)] text-[#f5f0e8] font-[family-name:var(--font-num)] placeholder:text-[rgba(138,134,144,0.5)] focus-visible:ring-emerald-500 focus-visible:border-emerald-500/30 rounded-xl h-11"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#8a8690] text-xs uppercase tracking-wider">طريقة الدفع</Label>
                <Select value={formData.method} onValueChange={(v) => setFormData({ ...formData, method: v })}>
                  <SelectTrigger className="bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.06)] text-[#f5f0e8] rounded-xl h-11 focus:ring-emerald-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#14141e] border-[rgba(255,255,255,0.08)] rounded-xl">
                    <SelectItem value="cash">نقدي</SelectItem>
                    <SelectItem value="transfer">تحويل بنكي</SelectItem>
                    <SelectItem value="card">بطاقة</SelectItem>
                    <SelectItem value="cheque">شيك</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[#8a8690] text-xs uppercase tracking-wider">الحالة</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger className="bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.06)] text-[#f5f0e8] rounded-xl h-11 focus:ring-emerald-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#14141e] border-[rgba(255,255,255,0.08)] rounded-xl">
                    <SelectItem value="pending">معلق</SelectItem>
                    <SelectItem value="partial">مدفوع جزئياً</SelectItem>
                    <SelectItem value="paid">مدفوع</SelectItem>
                    <SelectItem value="refunded">مسترد</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pay-receipt" className="text-[#8a8690] text-xs uppercase tracking-wider">رقم الإيصال</Label>
              <Input
                id="pay-receipt"
                value={formData.receiptNumber}
                onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
                placeholder="رقم الإيصال (اختياري)"
                dir="ltr"
                className="bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.06)] text-[#f5f0e8] font-[family-name:var(--font-num)] placeholder:text-[rgba(138,134,144,0.5)] focus-visible:ring-emerald-500 focus-visible:border-emerald-500/30 rounded-xl h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pay-notes" className="text-[#8a8690] text-xs uppercase tracking-wider">ملاحظات</Label>
              <Textarea
                id="pay-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="ملاحظات إضافية..."
                rows={2}
                className="bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.06)] text-[#f5f0e8] placeholder:text-[rgba(138,134,144,0.5)] focus-visible:ring-emerald-500 focus-visible:border-emerald-500/30 rounded-xl resize-none"
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
              className="btn-billing rounded-xl px-6"
            >
              {submitting ? 'جاري الحفظ...' : editingItem ? 'حفظ التعديلات' : 'إضافة الدفعة'}
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
              هل أنت متأكد من حذف هذه الدفعة؟ لا يمكن التراجع عن هذا الإجراء.
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
