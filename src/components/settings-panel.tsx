'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Settings,
  Save,
  Wifi,
  Building2,
  Phone,
  MapPin,
  Info,
  Loader2,
  CheckCircle2,
  XCircle,
  Flame,
  RotateCcw,
  Cpu,
  ShieldAlert,
} from 'lucide-react'
import { ReadOnlyBanner } from '@/components/permission-banner'
import { getFirebaseConfig } from '@/lib/firebase'

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${useAuthStore.getState().token}`,
})

interface HallSettings {
  hallName: string
  hallPhone: string
  hallAddress: string
}

const defaultSettings: HallSettings = {
  hallName: '',
  hallPhone: '',
  hallAddress: '',
}

export default function SettingsPanel() {
  const { toast } = useToast()
  const user = useAuthStore((s) => s.user)

  const [settings, setSettings] = useState<HallSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [resetting, setResetting] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  const canWrite = user?.role === 'admin'
  const canControl = user?.role === 'admin' || user?.role === 'manager'
  const userRole = user?.role

  // Firebase config status
  const firebaseConfig = getFirebaseConfig()
  const isFirebaseConfigured = !!(firebaseConfig.apiKey && firebaseConfig.databaseURL)

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/settings', { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        setSettings({
          hallName: data.settings.hallName || '',
          hallPhone: data.settings.hallPhone || '',
          hallAddress: data.settings.hallAddress || '',
        })
      }
    } catch {
      toast({ title: 'خطأ', description: 'فشل في جلب الإعدادات', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  // Employee and viewer can't access settings at all
  const SETTINGS_ALLOWED_ROLES = ['admin', 'manager']
  if (!SETTINGS_ALLOWED_ROLES.includes(userRole)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 animate-fade-up">
        <ShieldAlert className="h-16 w-16 text-muted-foreground/30" />
        <h2 className="text-xl font-bold text-muted-foreground">غير مصرح</h2>
        <p className="text-sm text-muted-foreground/70">ليس لديك صلاحية للوصول إلى هذه الصفحة</p>
      </div>
    )
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ settings }),
      })
      if (res.ok) {
        toast({ title: 'تم بنجاح', description: 'تم حفظ الإعدادات بنجاح' })
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

  const handleTestConnection = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/firebase/status', {
        headers: authHeaders(),
      })
      if (res.ok) {
        const data = await res.json()
        setTestResult({ success: true, message: 'اتصال Firebase يعمل بنجاح' })
        toast({
          title: 'اتصال ناجح',
          description: 'Firebase Realtime Database متصل',
        })
      } else {
        setTestResult({ success: false, message: 'فشل في اختبار الاتصال' })
      }
    } catch {
      setTestResult({ success: false, message: 'فشل الاتصال بالخادم' })
    } finally {
      setTesting(false)
    }
  }

  const handleResetDevices = async () => {
    setResetting(true)
    try {
      const res = await fetch('/api/firebase/reset', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ resetAll: true }),
      })
      if (res.ok) {
        toast({
          title: 'تم بنجاح',
          description: 'تم إعادة تعيين جميع الأجهزة (بوابة، باب، جلوس، إضاءة، MP3)',
        })
      } else {
        const err = await res.json()
        toast({ title: 'خطأ', description: err.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ', description: 'فشل إعادة تعيين الأجهزة', variant: 'destructive' })
    } finally {
      setResetting(false)
      setConfirmReset(false)
    }
  }

  const updateField = (key: keyof HallSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-up">
        <Skeleton className="h-8 w-48 bg-muted" />
        <div className="grid gap-6">
          <Skeleton className="h-64 w-full bg-muted" />
          <Skeleton className="h-48 w-full bg-muted" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Permission Banner - manager is read-only */}
      {!canWrite && canControl && (
        <ReadOnlyBanner message="وضع العرض فقط — للوصول إلى الإعدادات، تواصل مع مدير النظام." />
      )}

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <Settings className="h-6 w-6 text-primary" />
          الإعدادات
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          إعدادات النظام والصالة
        </p>
      </div>

      {/* Firebase Configuration Status */}
      <Card className="border-r-4 border-r-orange-400">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Flame className="h-5 w-5 text-orange-500" />
            حالة Firebase
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            حالة الاتصال بـ Firebase Realtime Database للتحكم بـ ESP32
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Status */}
          <div className="flex items-center justify-between rounded-lg border px-4 py-3 bg-muted/30">
            <div className="flex items-center gap-3">
              <Cpu className={`h-5 w-5 ${isFirebaseConfigured ? 'text-emerald-500' : 'text-red-400'}`} />
              <div>
                <p className="text-sm font-medium">
                  {isFirebaseConfigured ? 'Firebase مُعد ومتصل' : 'Firebase غير مُعد'}
                </p>
                <p className="text-xs text-muted-foreground font-mono" dir="ltr">
                  {isFirebaseConfigured
                    ? `المشروع: ${firebaseConfig.projectId}`
                    : 'يحتاج تهيئة'}
                </p>
              </div>
            </div>
            {isFirebaseConfigured ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-400" />
            )}
          </div>

          {/* Project Info */}
          {isFirebaseConfigured && (
            <div className="grid gap-2 text-xs text-muted-foreground font-mono" dir="ltr">
              <div className="flex items-center gap-2">
                <span className="w-24 shrink-0">قاعدة البيانات:</span>
                <span className="text-foreground/80 truncate">{firebaseConfig.databaseURL}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-24 shrink-0">نطاق المصادقة:</span>
                <span className="text-foreground/80 truncate">{firebaseConfig.authDomain}</span>
              </div>
            </div>
          )}

          {/* Test Connection */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={testing}
              className="gap-2 border-orange-500/30 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-500/10"
            >
              {testing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wifi className="h-4 w-4" />
              )}
              {testing ? 'جاري الاختبار...' : 'اختبار الاتصال'}
            </Button>

            {testResult && (
              <div className="flex items-center gap-1.5 text-xs">
                {testResult.success ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 text-red-500" />
                )}
                <span className={testResult.success ? 'text-emerald-600' : 'text-red-500'}>
                  {testResult.message}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Device Reset */}
      {canControl && (
        <Card className="border-r-4 border-r-red-400">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <RotateCcw className="h-5 w-5 text-red-500" />
              إعادة تعيين الأجهزة
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              إعادة جميع الأجهزة المتصلة بـ ESP32 إلى حالتها الافتراضية
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-3 text-sm">
              <div className="flex items-center gap-2 rounded-lg border bg-red-50 dark:bg-red-500/5 px-3 py-2">
                <div className="h-2 w-2 rounded-full bg-red-400" />
                <span className="text-muted-foreground">إغلاق البوابة والباب</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border bg-yellow-50 dark:bg-yellow-500/5 px-3 py-2">
                <div className="h-2 w-2 rounded-full bg-yellow-400" />
                <span className="text-muted-foreground">إطفاء كل الأضواء</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border bg-purple-50 dark:bg-purple-500/5 px-3 py-2">
                <div className="h-2 w-2 rounded-full bg-purple-400" />
                <span className="text-muted-foreground">إيقاف جلوس + MP3</span>
              </div>
            </div>

            {!confirmReset ? (
              <Button
                onClick={() => setConfirmReset(true)}
                disabled={resetting}
                variant="outline"
                className="gap-2 border-red-500/30 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
              >
                <RotateCcw className="h-4 w-4" />
                إعادة تعيين كل الأجهزة
              </Button>
            ) : (
              <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-50 dark:bg-red-500/5 p-3">
                <ShieldAlert className="h-5 w-5 text-red-500 shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400 flex-1">
                  هل أنت متأكد؟ سيتم إغلاق كل الأبواب وإطفاء كل الأضواء وإيقاف كل الأجهزة.
                </p>
                <div className="flex gap-2 shrink-0">
                  <Button
                    onClick={handleResetDevices}
                    disabled={resetting}
                    size="sm"
                    className="gap-1.5 bg-red-600 hover:bg-red-700 text-white"
                  >
                    {resetting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                    تأكيد
                  </Button>
                  <Button
                    onClick={() => setConfirmReset(false)}
                    variant="outline"
                    size="sm"
                    disabled={resetting}
                    className="text-muted-foreground"
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Hall Information */}
      <Card className="border-r-4 border-r-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5 text-primary" />
            معلومات الصالة
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            بيانات الصالة التي ستظهر في النظام والفواتير
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hall-name" className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              اسم الصالة
            </Label>
            <Input
              id="hall-name"
              value={settings.hallName}
              onChange={(e) => updateField('hallName', e.target.value)}
              placeholder="أدخل اسم الصالة"
              disabled={!canWrite}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hall-phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              رقم الهاتف
            </Label>
            <Input
              id="hall-phone"
              value={settings.hallPhone}
              onChange={(e) => updateField('hallPhone', e.target.value)}
              placeholder="أدخل رقم هاتف الصالة"
              dir="ltr"
              disabled={!canWrite}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hall-address" className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              العنوان
            </Label>
            <Textarea
              id="hall-address"
              value={settings.hallAddress}
              onChange={(e) => updateField('hallAddress', e.target.value)}
              placeholder="أدخل عنوان الصالة بالتفصيل"
              rows={3}
              disabled={!canWrite}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      {canWrite && (
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-2 min-w-[160px]"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </Button>
        </div>
      )}

      {/* About Section */}
      <Separator />

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-semibold">حول النظام</h3>
              <p className="text-sm text-muted-foreground">
                نظام إدارة صالات الأفراح - الإصدار 2.0.0
              </p>
              <p className="text-xs text-muted-foreground/70">
                نظام متكامل لإدارة الحجوزات والزبائن والمدفوعات مع التحكم بـ ESP32 عبر Firebase
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
