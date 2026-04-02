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
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
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
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage(page + 1)}
          >
            التالي
          </Button>
        </div>
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            إدارة الزبائن
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            إجمالي {pagination.total} زبون مسجل
          </p>
        </div>
        {canWrite && (
          <Button onClick={openCreate} className="gap-2 bg-amber-600 hover:bg-amber-700">
            <Plus className="h-4 w-4" />
            إضافة زبون
          </Button>
        )}
      </div>

      {/* Search */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم أو الهاتف أو البريد..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10"
            />
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
                  <TableHead className="text-right font-semibold">الاسم</TableHead>
                  <TableHead className="text-right font-semibold">الهاتف</TableHead>
                  <TableHead className="text-right font-semibold">البريد</TableHead>
                  <TableHead className="text-right font-semibold text-center">عدد الحجوزات</TableHead>
                  {showActions && <TableHead className="text-right font-semibold text-center">الإجراءات</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={showActions ? 5 : 4}>{renderSkeleton()}</TableCell>
                  </TableRow>
                ) : customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={showActions ? 5 : 4} className="text-center py-12 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>لا يوجد زبائن</p>
                      <p className="text-sm mt-1">اضغط على &quot;إضافة زبون&quot; لبدء الإضافة</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((customer) => (
                    <TableRow key={customer.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell className="font-mono text-sm" dir="ltr">{customer.phone}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{customer.email || '—'}</TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center bg-primary/10 text-primary px-2 py-0.5 rounded-full text-sm font-medium">
                          {customer._count.bookings}
                        </span>
                      </TableCell>
                      {showActions && (
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            {canWrite && (
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(customer)}>
                                <Pencil className="h-4 w-4 text-blue-600" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDelete(customer)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
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
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'تعديل بيانات الزبون' : 'إضافة زبون جديد'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="cust-name">الاسم *</Label>
              <Input
                id="cust-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="أدخل اسم الزبون"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cust-phone">رقم الهاتف *</Label>
              <Input
                id="cust-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="أدخل رقم الهاتف"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cust-email">البريد الإلكتروني</Label>
              <Input
                id="cust-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="أدخل البريد الإلكتروني"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cust-notes">ملاحظات</Label>
              <Textarea
                id="cust-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="ملاحظات إضافية..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {submitting ? 'جاري الحفظ...' : editingItem ? 'حفظ التعديلات' : 'إضافة الزبون'}
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
              هل أنت متأكد من حذف الزبون &quot;{deletingItem?.name}&quot؛؟ لا يمكن التراجع عن هذا الإجراء.
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
