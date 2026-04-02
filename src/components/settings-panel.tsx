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
  WifiOff,
  Building2,
  Phone,
  MapPin,
  Info,
  Loader2,
  CheckCircle2,
  XCircle,
  Flame,
} from 'lucide-react'
import { ReadOnlyBanner } from '@/components/permission-banner'

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${useAuthStore.getState().token}`,
})

interface SettingsData {
  firebaseApiKey: string
  firebaseDatabaseUrl: string
  firebaseAuthDomain: string
  firebaseProjectId: string
  hallName: string
  hallPhone: string
  hallAddress: string
}

const defaultSettings: SettingsData = {
  firebaseApiKey: '',
  firebaseDatabaseUrl: '',
  firebaseAuthDomain: '',
  firebaseProjectId: '',
  hallName: '',
  hallPhone: '',
  hallAddress: '',
}

export default function SettingsPanel() {
  const { toast } = useToast()
  const user = useAuthStore((s) => s.user)

  const [settings, setSettings] = useState<SettingsData>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const canWrite = user?.role === 'admin'
  const canRead = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'employee' || user?.role === 'viewer'

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/settings', { headers: authHeaders() })
      if (res.ok) {
        const data = await res.json()
        setSettings({
          firebaseApiKey: data.settings.firebaseApiKey || '',
          firebaseDatabaseUrl: data.settings.firebaseDatabaseUrl || '',
          firebaseAuthDomain: data.settings.firebaseAuthDomain || '',
          firebaseProjectId: data.settings.firebaseProjectId || '',
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
      // We test Firebase connection by calling the settings API with a test parameter
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
          settings,
          testConnection: true,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.connectionTest) {
          setTestResult({ success: true, message: 'تم الاتصال بنجاح! Firebase يعمل بشكل صحيح.' })
        } else {
          setTestResult({ success: false, message: 'فشل الاتصال. تأكد من صحة بيانات Firebase.' })
        }
      } else {
        setTestResult({ success: false, message: 'فشل في اختبار الاتصال' })
      }
    } catch {
      setTestResult({ success: false, message: 'فشل الاتصال بالخادم' })
    } finally {
      setTesting(false)
    }
  }

  const updateField = (key: keyof SettingsData, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    // Clear test result when settings change
    setTestResult(null)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Permission Banner */}
      {!canWrite && canRead && (
        <ReadOnlyBanner message="يمكنك فقط عرض الإعدادات. لتعديل إعدادات النظام أو Firebase، تواصل مع مدير النظام." />
      )}

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" />
          الإعدادات
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          إعدادات النظام والصالة
        </p>
      </div>

      {/* Firebase Configuration */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Flame className="h-5 w-5 text-orange-500" />
            إعدادات Firebase
          </CardTitle>
          <CardDescription>
            تكوين الاتصال بقاعدة بيانات Firebase لخدمة الإشعارات
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fb-api-key">مفتاح API</Label>
            <Input
              id="fb-api-key"
              value={settings.firebaseApiKey}
              onChange={(e) => updateField('firebaseApiKey', e.target.value)}
              placeholder="AIzaSy..."
              dir="ltr"
              disabled={!canWrite}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fb-db-url">رابط قاعدة البيانات</Label>
            <Input
              id="fb-db-url"
              value={settings.firebaseDatabaseUrl}
              onChange={(e) => updateField('firebaseDatabaseUrl', e.target.value)}
              placeholder="https://your-project.firebaseio.com"
              dir="ltr"
              disabled={!canWrite}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fb-auth-domain">نطاق المصادقة</Label>
            <Input
              id="fb-auth-domain"
              value={settings.firebaseAuthDomain}
              onChange={(e) => updateField('firebaseAuthDomain', e.target.value)}
              placeholder="your-project.firebaseapp.com"
              dir="ltr"
              disabled={!canWrite}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fb-project-id">معرف المشروع</Label>
            <Input
              id="fb-project-id"
              value={settings.firebaseProjectId}
              onChange={(e) => updateField('firebaseProjectId', e.target.value)}
              placeholder="your-project-id"
              dir="ltr"
              disabled={!canWrite}
            />
          </div>

          {/* Test Result */}
          {testResult && (
            <div
              className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                testResult.success
                  ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 shrink-0" />
              )}
              {testResult.message}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            {canWrite && (
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={testing || !settings.firebaseApiKey}
                className="gap-2"
              >
                {testing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wifi className="h-4 w-4" />
                )}
                {testing ? 'جاري الاختبار...' : 'اختبار الاتصال'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Hall Information */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5 text-amber-600" />
            معلومات الصالة
          </CardTitle>
          <CardDescription>
            بيانات الصالة التي ستظهر في النظام والفواتير
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hall-name" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
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
              <Phone className="h-4 w-4" />
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
              <MapPin className="h-4 w-4" />
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
            className="gap-2 bg-amber-600 hover:bg-amber-700 min-w-[160px]"
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

      <Card className="border-border bg-muted/30">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-semibold">حول النظام</h3>
              <p className="text-sm text-muted-foreground">
                نظام إدارة صالات الأفراح - الإصدار 1.0.0
              </p>
              <p className="text-xs text-muted-foreground">
                نظام متكامل لإدارة الحجوزات والزبائن والمدفوعات
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
