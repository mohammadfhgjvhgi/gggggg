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
    <div className="space-y-6 max-w-2xl mx-auto animate-fade-up">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-3 text-gradient-profile font-[Playfair_Display]">
          <User className="h-6 w-6 text-fuchsia-400" />
          الملف الشخصي
        </h2>
        <p className="text-[#8a8690] text-sm mt-1">إدارة بياناتك الشخصية وكلمة المرور</p>
      </div>

      {/* User Info Card */}
      <Card className="glass border-fuchsia-500/12 card-hover">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-b from-fuchsia-400 via-fuchsia-500 to-fuchsia-600 flex items-center justify-center text-[#0a0a0f] text-3xl font-bold shadow-[0_0_20px_rgba(232,121,249,0.3)] ring-2 ring-fuchsia-500/30 ring-offset-[#0f0f17]">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-[#f5f0e8] font-[Playfair_Display]">{user?.name}</h3>
                <Badge
                  variant="outline"
                  className={`text-xs ${ROLE_BADGE_COLORS[user?.role || 'viewer'] || ''}`}
                >
                  {ROLE_LABELS[user?.role || 'viewer']}
                </Badge>
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-[#8a8690]">
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-fuchsia-400" />
                  <span dir="ltr">{user?.email}</span>
                </div>
                {user?.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-fuchsia-400" />
                    <span dir="ltr">{user.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile Form */}
      <Card className="glass border-fuchsia-500/12 card-hover">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2 text-[#f5f0e8]">
            <User className="h-4 w-4 text-fuchsia-400" />
            تعديل البيانات الشخصية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profile-name" className="text-[#8a8690]">الاسم الكامل</Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="أدخل اسمك"
              className="bg-[#12121a] border-[#1f1f2e] text-[#f5f0e8] placeholder:text-[#8a8690]/50 focus:border-fuchsia-500/50 focus:ring-fuchsia-500/20"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-phone" className="text-[#8a8690]">رقم الهاتف</Label>
            <Input
              id="profile-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="أدخل رقم الهاتف"
              dir="ltr"
              className="bg-[#12121a] border-[#1f1f2e] text-[#f5f0e8] placeholder:text-[#8a8690]/50 focus:border-fuchsia-500/50 focus:ring-fuchsia-500/20 font-[DM_Mono]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-email" className="text-[#8a8690]">البريد الإلكتروني</Label>
            <Input
              id="profile-email"
              value={user?.email || ''}
              disabled
              className="bg-[#1a1a25] border-[#1f1f2e] text-[#8a8690] font-[DM_Mono]"
              dir="ltr"
            />
            <p className="text-xs text-[#8a8690]/60">لا يمكن تغيير البريد الإلكتروني</p>
          </div>
          <Button
            onClick={handleSaveProfile}
            disabled={saving}
            className="bg-gradient-to-b from-fuchsia-500 to-fuchsia-600 text-white hover:from-fuchsia-400 hover:to-fuchsia-500 shadow-[0_2px_12px_rgba(232,121,249,0.3)] gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
          </Button>
        </CardContent>
      </Card>

      {/* Change Password Form */}
      <Card className="glass border-fuchsia-500/12 card-hover">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2 text-[#f5f0e8]">
            <Lock className="h-4 w-4 text-fuchsia-400" />
            تغيير كلمة المرور
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password" className="text-[#8a8690]">كلمة المرور الحالية</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="أدخل كلمة المرور الحالية"
              className="bg-[#12121a] border-[#1f1f2e] text-[#f5f0e8] placeholder:text-[#8a8690]/50 focus:border-fuchsia-500/50 focus:ring-fuchsia-500/20"
            />
          </div>
          <Separator className="bg-[#1f1f2e]" />
          <div className="space-y-2">
            <Label htmlFor="new-password" className="text-[#8a8690]">كلمة المرور الجديدة</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="أدخل كلمة المرور الجديدة (6 أحرف على الأقل)"
              className="bg-[#12121a] border-[#1f1f2e] text-[#f5f0e8] placeholder:text-[#8a8690]/50 focus:border-fuchsia-500/50 focus:ring-fuchsia-500/20"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="text-[#8a8690]">تأكيد كلمة المرور الجديدة</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="أعد إدخال كلمة المرور الجديدة"
              className="bg-[#12121a] border-[#1f1f2e] text-[#f5f0e8] placeholder:text-[#8a8690]/50 focus:border-fuchsia-500/50 focus:ring-fuchsia-500/20"
            />
          </div>
          <Button
            onClick={handleChangePassword}
            disabled={changingPassword}
            className="bg-gradient-to-b from-fuchsia-500 to-fuchsia-600 text-white hover:from-fuchsia-400 hover:to-fuchsia-500 shadow-[0_2px_12px_rgba(232,121,249,0.3)] gap-2"
          >
            <Shield className="h-4 w-4" />
            {changingPassword ? 'جاري التغيير...' : 'تغيير كلمة المرور'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
