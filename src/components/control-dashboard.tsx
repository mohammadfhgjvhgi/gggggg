'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DoorOpen,
  DoorClosed,
  Armchair,
  Lightbulb,
  Ship,
  Square,
  Columns3,
  LampDesk,
  Wifi,
  WifiOff,
  Power,
  PowerOff,
  RotateCcw,
  Clock,
  Music,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  Cpu,
  Loader2,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { ReadOnlyBanner } from '@/components/permission-banner'
import { useToast } from '@/hooks/use-toast'

import { useAuthStore, type Role } from '@/store/auth-store'
import { useFirebaseStatus } from '@/hooks/useFirebaseStatus'
import { useFirebaseGate } from '@/hooks/useFirebaseGate'
import { useFirebaseDoor } from '@/hooks/useFirebaseDoor'
import { useFirebaseSeat } from '@/hooks/useFirebaseSeat'
import { useFirebaseLights } from '@/hooks/useFirebaseLights'
import { useFirebaseMp3 } from '@/hooks/useFirebaseMp3'
import { LIGHT_DEFINITIONS } from '@/lib/firebase'

// ═══════════════════════════════════════════════════════════════
//   التحقق من الصلاحيات
// ═══════════════════════════════════════════════════════════════

const CONTROL_ROLES: Role[] = ['admin', 'manager', 'employee']

function hasControlPermission(role: Role | undefined): boolean {
  if (!role) return false
  return CONTROL_ROLES.includes(role)
}

// ═══════════════════════════════════════════════════════════════
//   تنسيق الوقت
// ═══════════════════════════════════════════════════════════════

function formatTimestamp(timestamp: number): string {
  if (!timestamp) return '--:--:--'
  const date = new Date(timestamp)
  return date.toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function formatRelativeTime(timestamp: number): string {
  if (!timestamp) return 'غير متصل'
  const now = Date.now()
  const diffSec = Math.floor((now - timestamp) / 1000)

  if (diffSec < 10) return 'الآن'
  if (diffSec < 60) return `منذ ${diffSec} ثانية`
  if (diffSec < 3600) return `منذ ${Math.floor(diffSec / 60)} دقيقة`
  if (diffSec < 86400) return `منذ ${Math.floor(diffSec / 3600)} ساعة`
  return `منذ ${Math.floor(diffSec / 86400)} يوم`
}

// ═══════════════════════════════════════════════════════════════
//   أيقونات الإضاءة
// ═══════════════════════════════════════════════════════════════

const LIGHT_ICONS: Record<string, React.ElementType> = {
  street: LampDesk,
  ship: Ship,
  ceiling: Lightbulb,
  floor: Square,
  pillar_outer: Columns3,
  pillar_inner: Columns3,
}

// ═══════════════════════════════════════════════════════════════
//   مكون حالة ESP32
// ═══════════════════════════════════════════════════════════════

function Esp32StatusCard({ online, lastSeen }: { online: boolean; lastSeen: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border border-border overflow-hidden">
        <div className={`h-1 ${online ? 'bg-emerald-500' : 'bg-red-500'}`} />
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex size-10 items-center justify-center rounded-lg ${online ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                <Cpu className={`size-5 ${online ? 'text-emerald-500' : 'text-red-500'}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">ESP32</span>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={online ? 'on' : 'off'}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    >
                      {online ? (
                        <Badge className="border-transparent bg-emerald-500/15 text-emerald-600 text-[10px] px-1.5">
                          متصل
                        </Badge>
                      ) : (
                        <Badge className="border-transparent bg-red-500/15 text-red-600 text-[10px] px-1.5">
                          غير متصل
                        </Badge>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {online ? formatRelativeTime(lastSeen) : 'في انتظار الاتصال...'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={online ? 'wifi-on' : 'wifi-off'}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                >
                  {online ? (
                    <Wifi className="size-5 text-emerald-500" />
                  ) : (
                    <WifiOff className="size-5 text-red-400" />
                  )}
                </motion.div>
              </AnimatePresence>

              <AnimatePresence mode="wait">
                <motion.div
                  key={online ? 'dot-green' : 'dot-red'}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <span
                    className={`inline-block size-2 rounded-full ${
                      online
                        ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'
                        : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'
                    }`}
                    style={{
                      animation: online ? 'pulse-dot 2s ease-in-out infinite' : 'none',
                    }}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {lastSeen > 0 && (
            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
              <Clock className="size-3" />
              <span>آخر ظهور: {formatTimestamp(lastSeen)}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════
//   مكون البوابة / الباب
// ═══════════════════════════════════════════════════════════════

function GateDoorCard({
  title,
  isOpen,
  isLoading,
  onOpen,
  onClose,
  disabled,
  icon: Icon,
  description,
}: {
  title: string
  isOpen: boolean
  isLoading: boolean
  onOpen: () => void
  onClose: () => void
  disabled: boolean
  icon: React.ElementType
  description?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-r-4 border-r-amber-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10">
                <Icon className="size-5 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-base">{title}</CardTitle>
                {description && (
                  <CardDescription className="mt-0.5 text-xs">{description}</CardDescription>
                )}
              </div>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={isOpen ? 'open' : 'closed'}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
              >
                <Badge
                  className={`text-xs ${
                    isOpen
                      ? 'border-transparent bg-emerald-500/15 text-emerald-600'
                      : 'border-transparent bg-red-500/15 text-red-600'
                  }`}
                >
                  {isOpen ? 'مفتوحة' : 'مغلقة'}
                </Badge>
              </motion.div>
            </AnimatePresence>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <Button
              onClick={onOpen}
              disabled={disabled || isLoading}
              className="flex-1 bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
              size="lg"
            >
              {isLoading && isOpen === false ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <DoorOpen className="size-4" />
              )}
              فتح
            </Button>
            <Button
              onClick={onClose}
              disabled={disabled || isLoading}
              className="flex-1 bg-red-600 text-white shadow-sm hover:bg-red-700"
              size="lg"
            >
              {isLoading && isOpen === true ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <DoorClosed className="size-4" />
              )}
              إغلاق
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════
//   مكون جلوس العريس
// ═══════════════════════════════════════════════════════════════

function SeatCard({
  active,
  isLoading,
  onToggle,
  onReset,
  disabled,
  canControl: canCtrl,
}: {
  active: boolean
  isLoading: boolean
  onToggle: () => void
  onReset: () => void
  disabled: boolean
  canControl: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
    >
      <Card className="border-r-4 border-r-violet-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex size-10 items-center justify-center rounded-lg transition-colors ${active ? 'bg-violet-500/20' : 'bg-violet-500/10'}`}>
                <Armchair className={`size-5 transition-colors ${active ? 'text-violet-500' : 'text-violet-400'}`} />
              </div>
              <div>
                <CardTitle className="text-base">جلوس العريس</CardTitle>
                <CardDescription className="mt-0.5 text-xs">
                  تراسونيك داخلي - تفعيل / إعادة تعيين
                </CardDescription>
              </div>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={active ? 'active' : 'inactive'}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
              >
                <Badge
                  className={`text-xs ${
                    active
                      ? 'border-transparent bg-violet-500/15 text-violet-600'
                      : 'border-transparent bg-muted text-muted-foreground'
                  }`}
                >
                  {active ? 'مفعّل' : 'غير مفعّل'}
                </Badge>
              </motion.div>
            </AnimatePresence>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button
              onClick={onToggle}
              disabled={disabled || isLoading}
              variant={active ? 'outline' : 'default'}
              className={`flex-1 gap-2 ${active ? 'text-violet-600 border-violet-300 hover:bg-violet-50' : 'bg-violet-600 hover:bg-violet-700 text-white'}`}
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Armchair className="size-4" />
              )}
              {active ? 'إيقاف' : 'تفعيل'}
            </Button>
            {canCtrl && active && (
              <Button
                onClick={onReset}
                disabled={disabled || isLoading}
                variant="outline"
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="size-4" />
                إعادة تعيين
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════
//   مكون الإضاءة
// ═══════════════════════════════════════════════════════════════

function LightsCard({
  lights,
  loading,
  onToggle,
  onAllOn,
  onAllOff,
  activeCount,
  disabled,
}: {
  lights: Record<string, boolean>
  loading: string | null
  onToggle: (key: string) => void
  onAllOn: () => void
  onAllOff: () => void
  activeCount: number
  disabled: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
    >
      <Card className="border-r-4 border-r-yellow-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-yellow-500/10">
                <Lightbulb className="size-5 text-yellow-600" />
              </div>
              <div>
                <CardTitle className="text-base">الإضاءة</CardTitle>
                <CardDescription className="mt-0.5 text-xs">
                  6 مناطق إضاءة - ريليه ثنائي (LOW) + رباعي (HIGH)
                </CardDescription>
              </div>
            </div>
            <Badge
              className={`text-xs ${
                activeCount > 0
                  ? 'border-transparent bg-yellow-500/15 text-yellow-600'
                  : 'border-transparent bg-muted text-muted-foreground'
              }`}
            >
              {activeCount} / 6
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* شبكة المفاتيح */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {LIGHT_DEFINITIONS.map((def) => {
              const isOn = lights[def.key] === true
              const Icon = LIGHT_ICONS[def.key] || Lightbulb
              const isLoading = loading === def.key || loading === 'all'

              return (
                <motion.div
                  key={def.key}
                  layout
                  className={`flex items-center justify-between rounded-lg border px-4 py-3 transition-colors ${
                    isOn
                      ? 'border-yellow-500/30 bg-yellow-500/5'
                      : 'border-border bg-muted/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={isOn ? 'on' : 'off'}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        className={`flex size-8 items-center justify-center rounded-md transition-colors ${
                          isOn ? 'bg-yellow-500/20' : 'bg-muted'
                        }`}
                      >
                        {isLoading ? (
                          <Loader2 className="size-4 animate-spin text-muted-foreground" />
                        ) : (
                          <Icon
                            className={`size-4 transition-colors ${
                              isOn ? 'text-yellow-500' : 'text-muted-foreground'
                            }`}
                          />
                        )}
                      </motion.div>
                    </AnimatePresence>
                    <div className="flex flex-col">
                      <span
                        className={`text-sm font-medium transition-colors ${
                          isOn ? 'text-yellow-700 dark:text-yellow-400' : 'text-muted-foreground'
                        }`}
                      >
                        {def.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground/60">
                        {def.inverted ? 'ريليه ثنائي' : 'ريليه رباعي'}
                      </span>
                    </div>
                  </div>
                  <Switch
                    checked={isOn}
                    onCheckedChange={() => onToggle(def.key)}
                    disabled={disabled || isLoading}
                    className="data-[state=checked]:bg-yellow-500"
                  />
                </motion.div>
              )
            })}
          </div>

          <Separator />

          {/* أزرار التحكم بالجملة */}
          <div className="flex gap-3">
            <Button
              onClick={onAllOn}
              disabled={disabled || activeCount === 6 || loading === 'all'}
              className="flex-1 gap-2 bg-yellow-500 text-white shadow-sm hover:bg-yellow-600"
            >
              {loading === 'all' ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Power className="size-4" />
              )}
              تشغيل الكل
            </Button>
            <Button
              onClick={onAllOff}
              disabled={disabled || activeCount === 0 || loading === 'all'}
              variant="outline"
              className="flex-1 gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              {loading === 'all' ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <PowerOff className="size-4" />
              )}
              إطفاء الكل
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════
//   مكون تشغيل MP3
// ═══════════════════════════════════════════════════════════════

function Mp3Card({
  playing,
  track,
  isLoading,
  onTogglePlay,
  onNextTrack,
  onPrevTrack,
  onPlay,
  disabled,
}: {
  playing: boolean
  track: number
  isLoading: boolean
  onTogglePlay: () => void
  onNextTrack: () => void
  onPrevTrack: () => void
  onPlay: (track: number) => void
  disabled: boolean
}) {
  const [trackInput, setTrackInput] = useState(track.toString())

  useEffect(() => {
    setTrackInput(track.toString())
  }, [track])

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const num = parseInt(trackInput)
    if (!isNaN(num) && num >= 0) {
      onPlay(num)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.45 }}
    >
      <Card className="border-r-4 border-r-pink-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex size-10 items-center justify-center rounded-lg transition-colors ${playing ? 'bg-pink-500/20' : 'bg-pink-500/10'}`}>
                <Music className={`size-5 transition-colors ${playing ? 'text-pink-500' : 'text-pink-400'}`} />
              </div>
              <div>
                <CardTitle className="text-base">مشغل الصوت</CardTitle>
                <CardDescription className="mt-0.5 text-xs">
                  DFPlayer - التحكم بالمسارات الصوتية
                </CardDescription>
              </div>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={playing ? 'playing' : 'stopped'}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
              >
                <Badge
                  className={`text-xs ${
                    playing
                      ? 'border-transparent bg-pink-500/15 text-pink-600'
                      : 'border-transparent bg-muted text-muted-foreground'
                  }`}
                >
                  {playing ? 'يشغل' : 'متوقف'}
                </Badge>
              </motion.div>
            </AnimatePresence>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* معلومات المسار */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-4 py-3">
            <div className="flex items-center gap-3">
              <Volume2 className="size-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">المسار الحالي</p>
                <p className="text-sm font-semibold">#{track}</p>
              </div>
            </div>

            {/* اختيار المسار */}
            <form onSubmit={handleTrackSubmit} className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={trackInput}
                onChange={(e) => setTrackInput(e.target.value)}
                disabled={disabled}
                dir="ltr"
                className="w-16 h-8 text-center text-sm rounded-md border border-border bg-background px-2 focus:outline-none focus:ring-1 focus:ring-pink-500/30"
              />
              <Button
                type="submit"
                size="sm"
                variant="outline"
                disabled={disabled || isLoading}
                className="h-8 px-2 text-xs"
              >
                تشغيل
              </Button>
            </form>
          </div>

          {/* أزرار التحكم */}
          <div className="flex items-center justify-center gap-3">
            <Button
              onClick={onPrevTrack}
              disabled={disabled || isLoading}
              variant="outline"
              size="icon"
              className="size-10 rounded-full"
            >
              <SkipBack className="size-4" />
            </Button>

            <Button
              onClick={onTogglePlay}
              disabled={disabled || isLoading}
              className={`size-14 rounded-full shadow-lg ${
                playing
                  ? 'bg-pink-600 hover:bg-pink-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : playing ? (
                <Pause className="size-5" />
              ) : (
                <Play className="size-5" />
              )}
            </Button>

            <Button
              onClick={onNextTrack}
              disabled={disabled || isLoading}
              variant="outline"
              size="icon"
              className="size-10 rounded-full"
            >
              <SkipForward className="size-4" />
            </Button>
          </div>

          {/* مسارات سريعة */}
          <div className="flex gap-2 flex-wrap">
            {[1, 2, 3, 4, 5].map((t) => (
              <Button
                key={t}
                onClick={() => onPlay(t)}
                disabled={disabled || isLoading}
                variant={track === t ? 'default' : 'outline'}
                size="sm"
                className={`h-7 px-3 text-xs ${track === t ? 'bg-pink-600 hover:bg-pink-700' : ''}`}
              >
                {t}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════
//   لوحة التحكم الرئيسية
// ═══════════════════════════════════════════════════════════════

export default function ControlDashboard() {
  const user = useAuthStore((s) => s.user)
  const { toast } = useToast()
  const canControl = hasControlPermission(user?.role)

  // Firebase Hooks
  const status = useFirebaseStatus()
  const gate = useFirebaseGate()
  const door = useFirebaseDoor()
  const seat = useFirebaseSeat()
  const { lights, loading: lightsLoading, toggle: toggleLight, allOn, allOff, activeCount } = useFirebaseLights()
  const { mp3, loading: mp3Loading, togglePlay, play, stop, nextTrack, prevTrack } = useFirebaseMp3()

  // تتبع الحالة السابقة للإشعارات
  const prevOnlineRef = useRef(status.online)
  const prevGateRef = useRef(gate.gate.open)
  const prevDoorRef = useRef(door.door.open)
  const prevSeatRef = useRef(seat.seat.active)

  const connected = status.online
  const disabled = !connected

  // ═══════════════════════════════════════════════════
  //   إشعارات التغييرات
  // ═══════════════════════════════════════════════════

  useEffect(() => {
    // إشعار قطع الاتصال
    if (prevOnlineRef.current && !status.online) {
      toast({
        title: 'قطع الاتصال',
        description: 'ESP32 غير متصل حالياً',
        variant: 'destructive',
      })
    }

    // إشعار عودة الاتصال
    if (!prevOnlineRef.current && status.online) {
      toast({
        title: 'تم الاتصال',
        description: 'ESP32 متصل الآن',
      })
    }

    prevOnlineRef.current = status.online
  }, [status.online, toast])

  useEffect(() => {
    if (prevGateRef.current !== gate.gate.open) {
      const action = gate.gate.open ? 'فتح' : 'إغلاق'
      toast({
        title: `بوابة الشارع - ${action}`,
        description: `تم ${action} بوابة الشارع${gate.gate.open ? '' : ''}`,
        variant: gate.gate.open ? 'default' : 'destructive',
      })
    }
    prevGateRef.current = gate.gate.open
  }, [gate.gate.open, toast])

  useEffect(() => {
    if (prevDoorRef.current !== door.door.open) {
      const action = door.door.open ? 'فتح' : 'إغلاق'
      toast({
        title: `باب الصالة - ${action}`,
        description: `تم ${action} باب الصالة`,
        variant: door.door.open ? 'default' : 'destructive',
      })
    }
    prevDoorRef.current = door.door.open
  }, [door.door.open, toast])

  useEffect(() => {
    if (prevSeatRef.current !== seat.seat.active && seat.seat.active) {
      toast({
        title: 'جلوس العريس',
        description: 'تم تفعيل نظام جلوس العريس',
      })
    }
    prevSeatRef.current = seat.seat.active
  }, [seat.seat.active, toast])

  // ═══════════════════════════════════════════════════
  //   عرض لوحة التحكم
  // ═══════════════════════════════════════════════════

  return (
    <div dir="rtl" className="space-y-6">
      {/* Permission Banner for viewer */}
      {!canControl && (
        <ReadOnlyBanner message="يمكنك فقط مشاهدة حالة الأجهزة. للتحكم بالبوابات والأبواب والإضاءة، تواصل مع المدير." />
      )}

      {/* حالة ESP32 */}
      <Esp32StatusCard online={status.online} lastSeen={status.lastSeen} />

      {/* بطاقات الأبواب */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <GateDoorCard
          title="بوابة الشارع"
          isOpen={gate.gate.open}
          isLoading={gate.loading}
          onOpen={gate.open}
          onClose={gate.close}
          disabled={disabled || !canControl}
          icon={DoorOpen}
          description="كبسة toggle + حساس IR + إغلاق تلقائي 10 ثواني"
        />
        <GateDoorCard
          title="باب الصالة"
          isOpen={door.door.open}
          isLoading={door.loading}
          onOpen={door.open}
          onClose={door.close}
          disabled={disabled || !canControl}
          icon={DoorClosed}
          description="تراسونيك خارجي + إغلاق تلقائي 20 ثانية"
        />
      </div>

      {/* بطاقة جلوس العريس */}
      <SeatCard
        active={seat.seat.active}
        isLoading={seat.loading}
        onToggle={seat.toggle}
        onReset={seat.reset}
        disabled={disabled}
        canControl={canControl}
      />

      {/* بطاقة الإضاءة */}
      <LightsCard
        lights={lights}
        loading={lightsLoading}
        onToggle={(key) => toggleLight(key as keyof typeof lights)}
        onAllOn={allOn}
        onAllOff={allOff}
        activeCount={activeCount}
        disabled={disabled || !canControl}
      />

      {/* بطاقة مشغل الصوت */}
      <Mp3Card
        playing={mp3.playing}
        track={mp3.track}
        isLoading={mp3Loading}
        onTogglePlay={togglePlay}
        onNextTrack={nextTrack}
        onPrevTrack={prevTrack}
        onPlay={play}
        disabled={disabled || !canControl}
      />
    </div>
  )
}
