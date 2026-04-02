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
        <Skeleton key={i} className="h-12 w-full" />
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
      <div className="flex items-center justify-between pt-4 border-t">
        <span className="text-sm text-muted-foreground">
          عرض {((page - 1) * pagination.limit) + 1} - {Math.min(page * pagination.limit, pagination.total)} من {pagination.total}
        </span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            السابق
          </Button>
          {pages.map((p) => (
            <Button key={p} variant={p === page ? 'default' : 'outline'} size="sm" className="w-8 h-8 p-0" onClick={() => setPage(p)}>
              {p}
            </Button>
          ))}
          <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>
            التالي
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Permission Banner */}
      {userIsReadOnly && <ReadOnlyBanner message="يمكنك فقط عرض المدفوعات والفواتير. لتسجيل دفعة جديدة، تواصل مع المدير." />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            إدارة الفواتير والمدفوعات
          </h2>
          <p className="text-muted-foreground text-sm mt-1">متابعة المدفوعات والفواتير</p>
        </div>
        {canWrite && (
          <Button onClick={openCreate} className="gap-2 bg-amber-600 hover:bg-amber-700">
            <Plus className="h-4 w-4" />
            إضافة دفعة
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
              <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي الفواتير</p>
              <p className="text-xl font-bold">{summary.totalInvoices.toLocaleString()} <span className="text-xs text-muted-foreground">ر.س</span></p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">المدفوع</p>
              <p className="text-xl font-bold text-green-600">{summary.totalPaid.toLocaleString()} <span className="text-xs">ر.س</span></p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30">
              <Clock className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">المتبقي</p>
              <p className="text-xl font-bold text-red-600">{summary.totalRemaining.toLocaleString()} <span className="text-xs">ر.س</span></p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30">
              <CreditCard className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">حجوزات نشطة</p>
              <p className="text-xl font-bold">{summary.activeBookings}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Select value={bookingFilter || '__all__'} onValueChange={(v) => setBookingFilter(v === '__all__' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="تصفية بالحجز" />
                </SelectTrigger>
                <SelectContent>
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
                <SelectTrigger>
                  <SelectValue placeholder="تصفية بحالة الدفع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">جميع الحالات</SelectItem>
                  <SelectItem value="pending">معلق</SelectItem>
                  <SelectItem value="partial">مدفوع جزئياً</SelectItem>
                  <SelectItem value="paid">مدفوع</SelectItem>
                  <SelectItem value="refunded">مسترد</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-right font-semibold">رقم الفاتورة</TableHead>
                  <TableHead className="text-right font-semibold">الحجز</TableHead>
                  <TableHead className="text-right font-semibold">الزبون</TableHead>
                  <TableHead className="text-right font-semibold text-center">المبلغ</TableHead>
                  <TableHead className="text-right font-semibold text-center">طريقة الدفع</TableHead>
                  <TableHead className="text-right font-semibold text-center">الحالة</TableHead>
                  <TableHead className="text-right font-semibold text-center">التاريخ</TableHead>
                  {showActions && <TableHead className="text-right font-semibold text-center">الإجراءات</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={showActions ? 8 : 7}>{renderSkeleton()}</TableCell>
                  </TableRow>
                ) : payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={showActions ? 8 : 7} className="text-center py-12 text-muted-foreground">
                      <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>لا يوجد مدفوعات</p>
                      <p className="text-sm mt-1">اضغط على &quot;إضافة دفعة&quot; لتسجيل دفعة جديدة</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((payment) => {
                    const badge = PAYMENT_STATUS_BADGE[payment.status] || PAYMENT_STATUS_BADGE.pending
                    return (
                      <TableRow key={payment.id} className="hover:bg-muted/50">
                        <TableCell className="font-mono text-xs" dir="ltr">
                          {payment.id.slice(0, 8)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {payment.booking.eventType}
                        </TableCell>
                        <TableCell className="font-medium">{payment.booking.customer.name}</TableCell>
                        <TableCell className="text-center font-mono font-semibold">
                          {payment.amount.toLocaleString()} <span className="text-xs text-muted-foreground">ر.س</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-sm">{PAYMENT_METHOD_LABELS[payment.method] || payment.method}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={badge.className}>
                            {badge.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center text-sm">
                          {formatDate(payment.paidAt)}
                        </TableCell>
                        {showActions && (
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              {canWrite && (
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(payment)}>
                                  <Pencil className="h-4 w-4 text-blue-600" />
                                </Button>
                              )}
                              {canDelete && (
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDelete(payment)}>
                                  <Trash2 className="h-4 w-4 text-red-500" />
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
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'تعديل الدفعة' : 'إضافة دفعة جديدة'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>الحجز *</Label>
              <Select
                value={formData.bookingId}
                onValueChange={(v) => setFormData({ ...formData, bookingId: v })}
                disabled={!!editingItem}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحجز" />
                </SelectTrigger>
                <SelectContent>
                  {bookings.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.customerName} - {b.eventType} ({b.hallPrice.toLocaleString()} ر.س)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pay-amount">المبلغ *</Label>
              <Input
                id="pay-amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="أدخل المبلغ"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>طريقة الدفع</Label>
                <Select value={formData.method} onValueChange={(v) => setFormData({ ...formData, method: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">نقدي</SelectItem>
                    <SelectItem value="transfer">تحويل بنكي</SelectItem>
                    <SelectItem value="card">بطاقة</SelectItem>
                    <SelectItem value="cheque">شيك</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>الحالة</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">معلق</SelectItem>
                    <SelectItem value="partial">مدفوع جزئياً</SelectItem>
                    <SelectItem value="paid">مدفوع</SelectItem>
                    <SelectItem value="refunded">مسترد</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pay-receipt">رقم الإيصال</Label>
              <Input
                id="pay-receipt"
                value={formData.receiptNumber}
                onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
                placeholder="رقم الإيصال (اختياري)"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pay-notes">ملاحظات</Label>
              <Textarea
                id="pay-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="ملاحظات إضافية..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSubmit} disabled={submitting} className="bg-amber-600 hover:bg-amber-700">
              {submitting ? 'جاري الحفظ...' : editingItem ? 'حفظ التعديلات' : 'إضافة الدفعة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذه الدفعة؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'جاري الحذف...' : 'حذف'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
