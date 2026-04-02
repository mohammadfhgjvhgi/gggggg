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
            <Button
              key={p}
              variant={p === page ? 'default' : 'outline'}
              size="sm"
              className="w-8 h-8 p-0"
              onClick={() => setPage(p)}
            >
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
      {userIsReadOnly && <ReadOnlyBanner message="يمكنك فقط عرض الحجوزات. لإنشاء أو تعديل حجز، تواصل مع المدير." />}
      {!userIsReadOnly && canWrite && !canDelete && (
        <PartialPermissionBanner canWrite={canWrite} canDelete={false} resource="الحجوزات" />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CalendarDays className="h-6 w-6" />
            إدارة الحجوزات
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            إجمالي {pagination.total} حجز
          </p>
        </div>
        {canWrite && (
          <Button onClick={openCreate} className="gap-2 bg-amber-600 hover:bg-amber-700">
            <Plus className="h-4 w-4" />
            إضافة حجز
          </Button>
        )}
      </div>

      {/* Status Tabs */}
      <Card className="border-border">
        <CardContent className="p-2">
          <div className="flex flex-wrap gap-2">
            {STATUS_TABS.map((tab) => (
              <Button
                key={tab.key}
                variant={statusFilter === tab.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(tab.key)}
                className={
                  statusFilter === tab.key
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : ''
                }
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search & Filter */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم أو نوع الحدث..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>
            <div className="relative sm:w-56">
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Select value={customerFilter} onValueChange={(v) => setCustomerFilter(v)}>
                <SelectTrigger className="pr-10">
                  <SelectValue placeholder="تصفية بالزبون" />
                </SelectTrigger>
                <SelectContent>
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
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-right font-semibold">الزبون</TableHead>
                  <TableHead className="text-right font-semibold">تاريخ الحدث</TableHead>
                  <TableHead className="text-right font-semibold">نوع الحدث</TableHead>
                  <TableHead className="text-right font-semibold text-center">الضيوف</TableHead>
                  <TableHead className="text-right font-semibold text-center">السعر</TableHead>
                  <TableHead className="text-right font-semibold text-center">المدفوع</TableHead>
                  <TableHead className="text-right font-semibold text-center">الحالة</TableHead>
                  {showActions && <TableHead className="text-right font-semibold text-center">الإجراءات</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={showActions ? 8 : 7}>{renderSkeleton()}</TableCell>
                  </TableRow>
                ) : bookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={showActions ? 8 : 7} className="text-center py-12 text-muted-foreground">
                      <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>لا يوجد حجوزات</p>
                      <p className="text-sm mt-1">اضغط على &quot;إضافة حجز&quot; لبدء الإضافة</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  bookings.map((booking) => {
                    const badge = STATUS_BADGE[booking.status] || STATUS_BADGE.pending
                    const paidPercent = booking.hallPrice > 0
                      ? Math.round((booking.totalPaid / booking.hallPrice) * 100)
                      : 0
                    return (
                      <TableRow key={booking.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{booking.customer.name}</TableCell>
                        <TableCell className="text-sm">{formatDate(booking.eventDate)}</TableCell>
                        <TableCell>{booking.eventType}</TableCell>
                        <TableCell className="text-center">{booking.guestCount}</TableCell>
                        <TableCell className="text-center font-mono">{booking.hallPrice.toLocaleString()}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-mono text-sm">{booking.totalPaid.toLocaleString()}</span>
                            <span className="text-xs text-muted-foreground">({paidPercent}%)</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={badge.variant} className={badge.className}>
                            {badge.label}
                          </Badge>
                        </TableCell>
                        {showActions && (
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              {canWrite && (
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(booking)}>
                                  <Pencil className="h-4 w-4 text-blue-600" />
                                </Button>
                              )}
                              {canDelete && (
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDelete(booking)}>
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
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'تعديل الحجز' : 'إضافة حجز جديد'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>الزبون *</Label>
              <Select
                value={formData.customerId}
                onValueChange={(v) => setFormData({ ...formData, customerId: v })}
                disabled={!!editingItem}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الزبون" />
                </SelectTrigger>
                <SelectContent>
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
                <Label htmlFor="bk-date">تاريخ الحدث *</Label>
                <Input
                  id="bk-date"
                  type="date"
                  value={formData.eventDate}
                  onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bk-guests">عدد الضيوف *</Label>
                <Input
                  id="bk-guests"
                  type="number"
                  value={formData.guestCount}
                  onChange={(e) => setFormData({ ...formData, guestCount: e.target.value })}
                  placeholder="مثال: 200"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bk-type">نوع الحدث *</Label>
              <Input
                id="bk-type"
                value={formData.eventType}
                onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                placeholder="زفاف، خطوبة، حفل..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bk-price">سعر الصالة *</Label>
                <Input
                  id="bk-price"
                  type="number"
                  value={formData.hallPrice}
                  onChange={(e) => setFormData({ ...formData, hallPrice: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>الحالة</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">معلق</SelectItem>
                    <SelectItem value="confirmed">مؤكد</SelectItem>
                    <SelectItem value="completed">مكتمل</SelectItem>
                    <SelectItem value="cancelled">ملغي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bk-notes">ملاحظات</Label>
              <Textarea
                id="bk-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="ملاحظات إضافية..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSubmit} disabled={submitting} className="bg-amber-600 hover:bg-amber-700">
              {submitting ? 'جاري الحفظ...' : editingItem ? 'حفظ التعديلات' : 'إضافة الحجز'}
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
              هل أنت متأكد من حذف هذا الحجز؟ لا يمكن التراجع عن هذا الإجراء.
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
