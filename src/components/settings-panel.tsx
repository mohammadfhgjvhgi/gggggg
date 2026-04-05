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
  const [resetting, setResetting] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  const canWrite = user?.role === 'admin'
  const canControl = user?.role === 'admin' || user?.role === 'manager'
  const canRead = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'employee' || user?.role === 'viewer'

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
      const res = await fetch('/api/firebase/test', {
        method: 'POST',
        headers: authHeaders(),
      })
      if (res.ok) {
        const data = await res.json()
        setTestResult({ success: data.success, message: data.message })
        toast({
          title: data.success ? 'اتصال ناجح' : 'فشل الاتصال',
          description: data.message,
          variant: data.success ? 'default' : 'destructive',
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

  const updateField = (key: keyof SettingsData, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    setTestResult(null)
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-up">
        <Skeleton className="h-8 w-48 bg-[#1a1a25]" />
        <div className="grid gap-6">
          <Skeleton className="h-64 w-full bg-[#1a1a25]" />
          <Skeleton className="h-48 w-full bg-[#1a1a25]" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Permission Banner */}
      {!canWrite && canRead && (
        <ReadOnlyBanner message="يمكنك فقط عرض الإعدادات. لتعديل إعدادات النظام أو Firebase، تواصل مع مدير النظام." />
      )}

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-3 text-gold-gradient font-[Playfair_Display]">
          <Settings className="h-6 w-6 text-[#d4a853]" />
          الإعدادات
        </h2>
        <p className="text-[#8a8690] text-sm mt-1">
          إعدادات النظام والصالة و Firebase
        </p>
      </div>

      {/* Firebase Configuration Status */}
      <Card className="glass border-[#d4a853]/10 border-r-4 border-r-[#d4a853] card-hover">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-[#f5f0e8]">
            <Flame className="h-5 w-5 text-[#d4a853]" />
            حالة Firebase
          </CardTitle>
          <CardDescription className="text-[#8a8690]">
            حالة الاتصال بـ Firebase Realtime Database للتحكم بـ ESP32
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Status */}
          <div className="glass flex items-center justify-between rounded-lg px-4 py-3">
            <div className="flex items-center gap-3">
              <Cpu className={`h-5 w-5 ${isFirebaseConfigured ? 'text-emerald-500' : 'text-red-400'}`} />
              <div>
                <p className="text-sm font-medium text-[#f5f0e8]">
                  {isFirebaseConfigured ? 'Firebase مُعد ومتصل' : 'Firebase غير مُعد'}
                </p>
                <p className="text-xs text-[#8a8690] font-[DM_Mono]" dir="ltr">
                  {isFirebaseConfigured ? `Project: ${firebaseConfig.projectId}` : 'يحتاج تهيئة'}
                </p>
              </div>
            </div>
            {isFirebaseConfigured ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-400" />
            )}
          </div>

          {/* Test Connection */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={testing}
              className="gap-2 border-[#d4a853]/30 text-[#d4a853] hover:bg-[#d4a853]/10 hover:text-[#f0d48a]"
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
                <span className={testResult.success ? 'text-emerald-500' : 'text-red-500'}>
                  {testResult.message}
                </span>
              </div>
            )}
          </div>

          <Separator className="bg-[#1f1f2e]" />

          {/* Config Fields (Admin Only) */}
          {canWrite && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fb-project-id" className="text-[#8a8690]">معرف المشروع (Project ID)</Label>
                  <Input
                    id="fb-project-id"
                    value={settings.firebaseProjectId}
                    onChange={(e) => updateField('firebaseProjectId', e.target.value)}
                    placeholder="your-project-id"
                    dir="ltr"
                    className="bg-[#12121a] border-[#1f1f2e] text-[#f5f0e8] placeholder:text-[#8a8690]/50 focus:border-[#d4a853]/50 focus:ring-[#d4a853]/20 font-[DM_Mono]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fb-db-url" className="text-[#8a8690]">رابط قاعدة البيانات</Label>
                  <Input
                    id="fb-db-url"
                    value={settings.firebaseDatabaseUrl}
                    onChange={(e) => updateField('firebaseDatabaseUrl', e.target.value)}
                    placeholder="https://your-project.firebaseio.com"
                    dir="ltr"
                    className="bg-[#12121a] border-[#1f1f2e] text-[#f5f0e8] placeholder:text-[#8a8690]/50 focus:border-[#d4a853]/50 focus:ring-[#d4a853]/20 font-[DM_Mono]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fb-api-key" className="text-[#8a8690]">مفتاح API</Label>
                  <Input
                    id="fb-api-key"
                    value={settings.firebaseApiKey}
                    onChange={(e) => updateField('firebaseApiKey', e.target.value)}
                    placeholder="AIzaSy..."
                    dir="ltr"
                    className="bg-[#12121a] border-[#1f1f2e] text-[#f5f0e8] placeholder:text-[#8a8690]/50 focus:border-[#d4a853]/50 focus:ring-[#d4a853]/20 font-[DM_Mono]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fb-auth-domain" className="text-[#8a8690]">نطاق المصادقة</Label>
                  <Input
                    id="fb-auth-domain"
                    value={settings.firebaseAuthDomain}
                    onChange={(e) => updateField('firebaseAuthDomain', e.target.value)}
                    placeholder="your-project.firebaseapp.com"
                    dir="ltr"
                    className="bg-[#12121a] border-[#1f1f2e] text-[#f5f0e8] placeholder:text-[#8a8690]/50 focus:border-[#d4a853]/50 focus:ring-[#d4a853]/20 font-[DM_Mono]"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="gap-2 btn-gold"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saving ? 'جاري الحفظ...' : 'حفظ إعدادات Firebase'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Device Reset */}
      {canControl && (
        <Card className="glass border-red-500/10 border-r-4 border-r-red-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-[#f5f0e8]">
              <RotateCcw className="h-5 w-5 text-[#d4a853]" />
              إعادة تعيين الأجهزة
            </CardTitle>
            <CardDescription className="text-[#8a8690]">
              إعادة جميع الأجهزة المتصلة بـ ESP32 إلى حالتها الافتراضية
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-3 text-sm">
              <div className="flex items-center gap-2 rounded-lg border border-[#1f1f2e] bg-red-500/5 px-3 py-2">
                <div className="h-2 w-2 rounded-full bg-red-400" />
                <span className="text-[#8a8690]">إغلاق البوابة والباب</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-[#1f1f2e] bg-yellow-500/5 px-3 py-2">
                <div className="h-2 w-2 rounded-full bg-yellow-400" />
                <span className="text-[#8a8690]">إطفاء كل الأضواء</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-[#1f1f2e] bg-violet-500/5 px-3 py-2">
                <div className="h-2 w-2 rounded-full bg-violet-400" />
                <span className="text-[#8a8690]">إيقاف جلوس + MP3</span>
              </div>
            </div>

            {!confirmReset ? (
              <Button
                onClick={() => setConfirmReset(true)}
                disabled={resetting}
                variant="outline"
                className="gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
              >
                <RotateCcw className="h-4 w-4" />
                إعادة تعيين كل الأجهزة
              </Button>
            ) : (
              <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/5 p-3">
                <ShieldAlert className="h-5 w-5 text-red-500 shrink-0" />
                <p className="text-sm text-red-400 flex-1">
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
                    className="border-[#1f1f2e] text-[#8a8690] hover:text-[#f5f0e8] hover:bg-[#1a1a25]"
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
      <Card className="glass border-[#d4a853]/10 border-r-4 border-r-[#d4a853] card-hover">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-[#f5f0e8]">
            <Building2 className="h-5 w-5 text-[#d4a853]" />
            معلومات الصالة
          </CardTitle>
          <CardDescription className="text-[#8a8690]">
            بيانات الصالة التي ستظهر في النظام والفواتير
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hall-name" className="flex items-center gap-2 text-[#8a8690]">
              <Building2 className="h-4 w-4 text-[#d4a853]" />
              اسم الصالة
            </Label>
            <Input
              id="hall-name"
              value={settings.hallName}
              onChange={(e) => updateField('hallName', e.target.value)}
              placeholder="أدخل اسم الصالة"
              disabled={!canWrite}
              className="bg-[#12121a] border-[#1f1f2e] text-[#f5f0e8] placeholder:text-[#8a8690]/50 focus:border-[#d4a853]/50 focus:ring-[#d4a853]/20"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hall-phone" className="flex items-center gap-2 text-[#8a8690]">
              <Phone className="h-4 w-4 text-[#d4a853]" />
              رقم الهاتف
            </Label>
            <Input
              id="hall-phone"
              value={settings.hallPhone}
              onChange={(e) => updateField('hallPhone', e.target.value)}
              placeholder="أدخل رقم هاتف الصالة"
              dir="ltr"
              disabled={!canWrite}
              className="bg-[#12121a] border-[#1f1f2e] text-[#f5f0e8] placeholder:text-[#8a8690]/50 focus:border-[#d4a853]/50 focus:ring-[#d4a853]/20 font-[DM_Mono]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hall-address" className="flex items-center gap-2 text-[#8a8690]">
              <MapPin className="h-4 w-4 text-[#d4a853]" />
              العنوان
            </Label>
            <Textarea
              id="hall-address"
              value={settings.hallAddress}
              onChange={(e) => updateField('hallAddress', e.target.value)}
              placeholder="أدخل عنوان الصالة بالتفصيل"
              rows={3}
              disabled={!canWrite}
              className="bg-[#12121a] border-[#1f1f2e] text-[#f5f0e8] placeholder:text-[#8a8690]/50 focus:border-[#d4a853]/50 focus:ring-[#d4a853]/20"
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
            className="gap-2 btn-gold min-w-[160px]"
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
      <Separator className="bg-[#1f1f2e]" />

      <Card className="glass border-[#1f1f2e]">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-[#d4a853] mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-semibold text-[#f5f0e8] font-[Playfair_Display]">حول النظام</h3>
              <p className="text-sm text-[#8a8690]">
                نظام إدارة صالات الأفراح - الإصدار 2.0.0
              </p>
              <p className="text-xs text-[#8a8690]/70">
                نظام متكامل لإدارة الحجوزات والزبائن والمدفوعات مع التحكم بـ ESP32 عبر Firebase
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
