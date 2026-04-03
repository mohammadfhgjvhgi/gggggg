'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { User, Save, Lock, Shield, Mail, Phone } from 'lucide-react'
import { ROLE_LABELS } from '@/lib/auth'

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${useAuthStore.getState().token}`,
})

const ROLE_BADGE_COLORS: Record<string, string> = {
  admin: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  manager: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  employee: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
  viewer: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
}

export default function ProfilePage() {
  const { toast } = useToast()
  const user = useAuthStore((s) => s.user)
  const { checkAuth } = useAuthStore()

  // Profile form
  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [saving, setSaving] = useState(false)

  // Password form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name)
      setPhone(user.phone || '')
    }
  }, [user])

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      toast({ title: 'خطأ', description: 'الاسم مطلوب', variant: 'destructive' })
      return
    }

    if (!user?.id) return

    setSaving(true)
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ name, phone }),
      })
      if (res.ok) {
        toast({ title: 'تم بنجاح', description: 'تم تحديث البيانات الشخصية' })
        await checkAuth()
      } else {
        const err = await res.json()
        toast({ title: 'خطأ', description: err.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ', description: 'فشل الاتصال بالخادم', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: 'خطأ', description: 'جميع الحقول مطلوبة', variant: 'destructive' })
      return
    }

    if (newPassword.length < 6) {
      toast({ title: 'خطأ', description: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل', variant: 'destructive' })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({ title: 'خطأ', description: 'كلمة المرور الجديدة غير متطابقة', variant: 'destructive' })
      return
    }

    if (!user?.id) return

    setChangingPassword(true)
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })
      if (res.ok) {
        toast({ title: 'تم بنجاح', description: 'تم تغيير كلمة المرور' })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        const err = await res.json()
        toast({ title: 'خطأ', description: err.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ', description: 'فشل الاتصال بالخادم', variant: 'destructive' })
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <User className="h-6 w-6 text-amber-600" />
          الملف الشخصي
        </h2>
        <p className="text-muted-foreground text-sm mt-1">إدارة بياناتك الشخصية وكلمة المرور</p>
      </div>

      {/* User Info Card */}
      <Card className="border-border">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">{user?.name}</h3>
                <Badge
                  variant="outline"
                  className={`text-xs ${ROLE_BADGE_COLORS[user?.role || 'viewer'] || ''}`}
                >
                  {ROLE_LABELS[user?.role || 'viewer']}
                </Badge>
              </div>
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  <span dir="ltr">{user?.email}</span>
                </div>
                {user?.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    <span dir="ltr">{user.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile Form */}
      <Card className="border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4 text-amber-600" />
            تعديل البيانات الشخصية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profile-name">الاسم الكامل</Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="أدخل اسمك"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-phone">رقم الهاتف</Label>
            <Input
              id="profile-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="أدخل رقم الهاتف"
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-email">البريد الإلكتروني</Label>
            <Input
              id="profile-email"
              value={user?.email || ''}
              disabled
              className="bg-muted/50"
              dir="ltr"
            />
            <p className="text-xs text-muted-foreground">لا يمكن تغيير البريد الإلكتروني</p>
          </div>
          <Button
            onClick={handleSaveProfile}
            disabled={saving}
            className="bg-amber-600 hover:bg-amber-700 gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
          </Button>
        </CardContent>
      </Card>

      {/* Change Password Form */}
      <Card className="border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4 text-amber-600" />
            تغيير كلمة المرور
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">كلمة المرور الحالية</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="أدخل كلمة المرور الحالية"
            />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="أدخل كلمة المرور الجديدة (6 أحرف على الأقل)"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">تأكيد كلمة المرور الجديدة</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="أعد إدخال كلمة المرور الجديدة"
            />
          </div>
          <Button
            onClick={handleChangePassword}
            disabled={changingPassword}
            className="bg-amber-600 hover:bg-amber-700 gap-2"
          >
            <Shield className="h-4 w-4" />
            {changingPassword ? 'جاري التغيير...' : 'تغيير كلمة المرور'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
