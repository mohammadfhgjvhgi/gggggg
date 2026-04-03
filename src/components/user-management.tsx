'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuthStore, type Role } from '@/store/auth-store'
import { ROLE_LABELS } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
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
import { Plus, Pencil, Trash2, Shield, ShieldCheck, ShieldAlert, Eye } from 'lucide-react'

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${useAuthStore.getState().token}`,
})

interface UserItem {
  id: string
  name: string
  email: string
  role: string
  phone: string | null
  active: boolean
  createdAt: string
  updatedAt: string
}

const ROLE_BADGE: Record<string, { label: string; className: string; Icon: typeof Shield }> = {
  admin: { label: 'مدير النظام', className: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400', Icon: ShieldAlert },
  manager: { label: 'مدير', className: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400', Icon: ShieldCheck },
  employee: { label: 'موظف', className: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400', Icon: Shield },
  viewer: { label: 'مشاهد', className: 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-900/30 dark:text-gray-400', Icon: Eye },
}

const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: 'admin', label: 'مدير النظام' },
  { value: 'manager', label: 'مدير' },
  { value: 'employee', label: 'موظف' },
  { value: 'viewer', label: 'مشاهد' },
]

const emptyForm = {
  name: '',
  email: '',
  password: '',
  role: 'viewer',
  phone: '',
}

export default function UserManagement() {
  const { toast } = useToast()
  const currentUser = useAuthStore((s) => s.user)

  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<UserItem | null>(null)
  const [formData, setFormData] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingItem, setDeletingItem] = useState<UserItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  const isAdmin = currentUser?.role === 'admin'

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/users', { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users)
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
    if (isAdmin) {
      fetchData()
    }
  }, [fetchData, isAdmin])

  const openCreate = () => {
    setEditingItem(null)
    setFormData(emptyForm)
    setDialogOpen(true)
  }

  const openEdit = (user: UserItem) => {
    setEditingItem(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      phone: user.phone || '',
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      toast({ title: 'خطأ', description: 'الاسم والبريد الإلكتروني مطلوبان', variant: 'destructive' })
      return
    }
    if (!editingItem && !formData.password.trim()) {
      toast({ title: 'خطأ', description: 'كلمة المرور مطلوبة للمستخدم الجديد', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    try {
      const url = editingItem ? `/api/users/${editingItem.id}` : '/api/users'
      const method = editingItem ? 'PUT' : 'POST'
      const body: Record<string, string> = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
      }
      if (formData.phone) body.phone = formData.phone
      if (formData.password) body.password = formData.password

      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(body),
      })
      if (res.ok) {
        toast({ title: editingItem ? 'تم تحديث المستخدم بنجاح' : 'تم إضافة المستخدم بنجاح' })
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

  const openDelete = (user: UserItem) => {
    setDeletingItem(user)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingItem) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/users/${deletingItem.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      if (res.ok) {
        toast({ title: 'تم حذف المستخدم بنجاح' })
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

  const handleToggleActive = async (user: UserItem) => {
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ active: !user.active }),
      })
      if (res.ok) {
        toast({ title: !user.active ? 'تم تفعيل المستخدم' : 'تم تعطيل المستخدم' })
        fetchData()
      } else {
        const err = await res.json()
        toast({ title: 'خطأ', description: err.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ', description: 'فشل الاتصال بالخادم', variant: 'destructive' })
    }
  }

  const renderSkeleton = () => (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <ShieldAlert className="h-16 w-16 mb-4 opacity-30" />
        <h3 className="text-xl font-semibold mb-2">غير مصرح بالوصول</h3>
        <p>هذه الصفحة متاحة لمديري النظام فقط</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            إدارة المستخدمين
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            إجمالي {users.length} مستخدم
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2 bg-amber-600 hover:bg-amber-700">
          <Plus className="h-4 w-4" />
          إضافة مستخدم
        </Button>
      </div>

      {/* Table */}
      <Card className="border-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-right font-semibold">الاسم</TableHead>
                  <TableHead className="text-right font-semibold">البريد</TableHead>
                  <TableHead className="text-right font-semibold text-center">الدور</TableHead>
                  <TableHead className="text-right font-semibold text-center">الهاتف</TableHead>
                  <TableHead className="text-right font-semibold text-center">الحالة</TableHead>
                  <TableHead className="text-right font-semibold text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6}>{renderSkeleton()}</TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>لا يوجد مستخدمين</p>
                      <p className="text-sm mt-1">اضغط على &quot;إضافة مستخدم&quot; لبدء الإضافة</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => {
                    const badge = ROLE_BADGE[u.role] || ROLE_BADGE.viewer
                    const isSelf = u.id === currentUser?.id
                    return (
                      <TableRow key={u.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {u.name}
                            {isSelf && (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200">
                                أنت
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground" dir="ltr">
                          {u.email}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={`${badge.className} gap-1`}>
                            <badge.Icon className="h-3 w-3" />
                            {badge.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-mono text-sm" dir="ltr">
                          {u.phone || '—'}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Switch
                              checked={u.active}
                              onCheckedChange={() => !isSelf && handleToggleActive(u)}
                              disabled={isSelf}
                              className="data-[state=checked]:bg-green-600"
                            />
                            <span className={`text-xs ${u.active ? 'text-green-600' : 'text-red-500'}`}>
                              {u.active ? 'نشط' : 'معطل'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(u)}>
                              <Pencil className="h-4 w-4 text-blue-600" />
                            </Button>
                            {!isSelf && (
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDelete(u)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="user-name">الاسم *</Label>
              <Input
                id="user-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="أدخل اسم المستخدم"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-email">البريد الإلكتروني *</Label>
              <Input
                id="user-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="أدخل البريد الإلكتروني"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-password">
                {editingItem ? 'كلمة المرور (اتركها فارغة للإبقاء على الحالية)' : 'كلمة المرور *'}
              </Label>
              <Input
                id="user-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={editingItem ? 'كلمة مرور جديدة (اختياري)' : 'أدخل كلمة المرور'}
                dir="ltr"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الدور</Label>
                <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-phone">الهاتف</Label>
                <Input
                  id="user-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="رقم الهاتف"
                  dir="ltr"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSubmit} disabled={submitting} className="bg-amber-600 hover:bg-amber-700">
              {submitting ? 'جاري الحفظ...' : editingItem ? 'حفظ التعديلات' : 'إضافة المستخدم'}
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
              هل أنت متأكد من حذف المستخدم &quot;{deletingItem?.name}&quot؛؟ لا يمكن التراجع عن هذا الإجراء.
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
