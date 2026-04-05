'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Search, Pencil, Trash2, Users } from 'lucide-react'
import { ReadOnlyBanner, PartialPermissionBanner, usePermissions } from '@/components/permission-banner'

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${useAuthStore.getState().token}`,
})

interface Customer {
  id: string
  name: string
  phone: string
  email: string | null
  notes: string | null
  _count: { bookings: number }
  createdAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const emptyForm = { name: '', phone: '', email: '', notes: '' }

export default function CustomerManagement() {
  const { toast } = useToast()
  const user = useAuthStore((s) => s.user)

  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 })

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Customer | null>(null)
  const [formData, setFormData] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingItem, setDeletingItem] = useState<Customer | null>(null)
  const [deleting, setDeleting] = useState(false)

  const { isReadOnly, hasAnyAction } = usePermissions()
  const canWrite = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'employee'
  const canDelete = user?.role === 'admin' || user?.role === 'manager'
  const showActions = hasAnyAction(user?.role, 'customers')
  const userIsReadOnly = isReadOnly(user?.role, 'customers')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      params.set('page', page.toString())
      params.set('limit', '20')

      const res = await fetch(`/api/customers?${params}`, { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        setCustomers(data.customers)
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
  }, [search, page, toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      fetchData()
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  const openCreate = () => {
    setEditingItem(null)
    setFormData(emptyForm)
    setDialogOpen(true)
  }

  const openEdit = (customer: Customer) => {
    setEditingItem(customer)
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      notes: customer.notes || '',
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast({ title: 'خطأ', description: 'اسم الزبون ورقم الهاتف مطلوبان', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    try {
      const url = editingItem ? `/api/customers/${editingItem.id}` : '/api/customers'
      const method = editingItem ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        toast({ title: editingItem ? 'تم التحديث بنجاح' : 'تم إضافة الزبون بنجاح' })
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

  const openDelete = (customer: Customer) => {
    setDeletingItem(customer)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingItem) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/customers/${deletingItem.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      if (res.ok) {
        toast({ title: 'تم حذف الزبون بنجاح' })
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

  const renderSkeleton = () => (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3">
          <Skeleton key={`av-${i}`} className="h-10 w-10 rounded-full shrink-0 animate-shimmer" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32 animate-shimmer" />
            <Skeleton className="h-3 w-24 animate-shimmer" />
          </div>
          <Skeleton className="h-4 w-16 animate-shimmer" />
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
      {userIsReadOnly && <ReadOnlyBanner message="يمكنك فقط عرض بيانات الزبائن. لإنشاء أو تعديل زبون، تواصل مع المدير." />}
      {!userIsReadOnly && canWrite && !canDelete && (
        <PartialPermissionBanner canWrite={canWrite} canDelete={false} resource="الزبائن" />
      )}

      {/* Header */}
      <div className="animate-fade-up flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-[family-name:var(--font-display)] font-bold flex items-center gap-3">
            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#d4a853] to-[#b8912e] shadow-[0_2px_12px_rgba(212,168,83,0.25)]">
              <Users className="h-5 w-5 text-[#0a0a0f]" />
            </span>
            <span className="text-gold-gradient">إدارة الزبائن</span>
          </h2>
          <p className="text-[#8a8690] text-sm mt-1.5 mr-[52px]">
            إجمالي <span className="text-[#f5f0e8] font-[family-name:var(--font-num)]">{pagination.total}</span> زبون مسجل
          </p>
        </div>
        {canWrite && (
          <Button onClick={openCreate} className="btn-gold gap-2 rounded-xl px-5">
            <Plus className="h-4 w-4" />
            إضافة زبون
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="glass rounded-2xl p-4 animate-fade-up stagger-1">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a8690]" />
          <Input
            placeholder="بحث بالاسم أو الهاتف أو البريد..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10 bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.06)] text-[#f5f0e8] placeholder:text-[rgba(138,134,144,0.6)] focus-visible:ring-[#d4a853] focus-visible:border-[rgba(212,168,83,0.3)] focus-visible:bg-[rgba(255,255,255,0.05)] rounded-xl h-11"
          />
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden animate-fade-up stagger-2">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b-[rgba(255,255,255,0.04)]">
                <TableHead className="text-right font-semibold text-[#8a8690] text-xs uppercase tracking-wider py-3.5 px-4">الاسم</TableHead>
                <TableHead className="text-right font-semibold text-[#8a8690] text-xs uppercase tracking-wider py-3.5 px-4">الهاتف</TableHead>
                <TableHead className="text-right font-semibold text-[#8a8690] text-xs uppercase tracking-wider py-3.5 px-4">البريد</TableHead>
                <TableHead className="text-center font-semibold text-[#8a8690] text-xs uppercase tracking-wider py-3.5 px-4">الحجوزات</TableHead>
                {showActions && <TableHead className="text-center font-semibold text-[#8a8690] text-xs uppercase tracking-wider py-3.5 px-4">الإجراءات</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={showActions ? 5 : 4} className="p-4">{renderSkeleton()}</TableCell>
                </TableRow>
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={showActions ? 5 : 4} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3 animate-fade-in">
                      <div className="w-16 h-16 rounded-2xl bg-[rgba(212,168,83,0.06)] flex items-center justify-center animate-float">
                        <Users className="h-7 w-7 text-[#d4a853] opacity-40" />
                      </div>
                      <div className="text-center">
                        <p className="text-[#8a8690] text-sm">لا يوجد زبائن</p>
                        <p className="text-[rgba(138,134,144,0.5)] text-xs mt-1">اضغط على &quot;إضافة زبون&quot; لبدء الإضافة</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => (
                  <TableRow key={customer.id} className="table-row-hover border-b-[rgba(255,255,255,0.03)]">
                    <TableCell className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#d4a853] to-[#b8912e] flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(212,168,83,0.15)]">
                          <span className="text-[#0a0a0f] font-bold text-sm font-[family-name:var(--font-display)]">
                            {customer.name.charAt(0)}
                          </span>
                        </div>
                        <span className="font-medium text-[#f5f0e8]">{customer.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5 px-4 font-[family-name:var(--font-num)] text-sm text-[#f5f0e8]" dir="ltr">{customer.phone}</TableCell>
                    <TableCell className="py-3.5 px-4 text-[#8a8690] text-sm">{customer.email || '—'}</TableCell>
                    <TableCell className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center justify-center bg-[rgba(212,168,83,0.08)] text-[#d4a853] px-2.5 py-0.5 rounded-full text-xs font-semibold font-[family-name:var(--font-num)]">
                        {customer._count.bookings}
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
                              onClick={() => openEdit(customer)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-[#8a8690] hover:text-[#ef4444] hover:bg-[rgba(239,68,68,0.08)] rounded-lg transition-colors"
                              onClick={() => openDelete(customer)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {renderPagination()}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md glass-strong rounded-2xl border-[rgba(212,168,83,0.1)] p-0 overflow-hidden">
          <div className="bg-gradient-to-l from-[rgba(212,168,83,0.08)] to-transparent p-6 pb-4 border-b-[rgba(255,255,255,0.04)]">
            <DialogHeader>
              <DialogTitle className="text-[#f5f0e8] font-[family-name:var(--font-display)] text-lg text-center">
                {editingItem ? 'تعديل بيانات الزبون' : 'إضافة زبون جديد'}
              </DialogTitle>
            </DialogHeader>
          </div>
          <div className="space-y-4 p-6 pt-5">
            <div className="space-y-2">
              <Label htmlFor="cust-name" className="text-[#8a8690] text-xs uppercase tracking-wider">الاسم *</Label>
              <Input
                id="cust-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="أدخل اسم الزبون"
                className="bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.06)] text-[#f5f0e8] placeholder:text-[rgba(138,134,144,0.5)] focus-visible:ring-[#d4a853] focus-visible:border-[rgba(212,168,83,0.3)] rounded-xl h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cust-phone" className="text-[#8a8690] text-xs uppercase tracking-wider">رقم الهاتف *</Label>
              <Input
                id="cust-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="أدخل رقم الهاتف"
                dir="ltr"
                className="bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.06)] text-[#f5f0e8] font-[family-name:var(--font-num)] placeholder:text-[rgba(138,134,144,0.5)] focus-visible:ring-[#d4a853] focus-visible:border-[rgba(212,168,83,0.3)] rounded-xl h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cust-email" className="text-[#8a8690] text-xs uppercase tracking-wider">البريد الإلكتروني</Label>
              <Input
                id="cust-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="أدخل البريد الإلكتروني"
                dir="ltr"
                className="bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.06)] text-[#f5f0e8] placeholder:text-[rgba(138,134,144,0.5)] focus-visible:ring-[#d4a853] focus-visible:border-[rgba(212,168,83,0.3)] rounded-xl h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cust-notes" className="text-[#8a8690] text-xs uppercase tracking-wider">ملاحظات</Label>
              <Textarea
                id="cust-notes"
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
              {submitting ? 'جاري الحفظ...' : editingItem ? 'حفظ التعديلات' : 'إضافة الزبون'}
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
              هل أنت متأكد من حذف الزبون &quot;{deletingItem?.name}&quot؛؟ لا يمكن التراجع عن هذا الإجراء.
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
