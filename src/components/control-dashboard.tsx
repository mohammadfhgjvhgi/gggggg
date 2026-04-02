'use client'

import { useEffect, useState, useCallback } from 'react'
import { ref, onValue, set, get } from 'firebase/database'
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
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { ReadOnlyBanner } from '@/components/permission-banner'

import {
  initializeFirebase,
  DEFAULT_HALL_STATE,
  type GateStatus,
  type HallDoorStatus,
  type SeatingStatus,
  type LightsStatus,
} from '@/lib/firebase'
import { useAuthStore, type Role } from '@/store/auth-store'

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

function formatTimestamp(timestamp: number | undefined): string {
  if (!timestamp) return '—'
  const date = new Date(timestamp)
  return date.toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

// ═══════════════════════════════════════════════════════════════
//   مكون حالة الاتصال
// ═══════════════════════════════════════════════════════════════

function ConnectionStatus({ connected, lastUpdate }: { connected: boolean; lastUpdate: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
    >
      <div className="flex items-center gap-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={connected ? 'on' : 'off'}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            {connected ? (
              <Wifi className="size-5 text-emerald-500" />
            ) : (
              <WifiOff className="size-5 text-red-500" />
            )}
          </motion.div>
        </AnimatePresence>
        <span className="text-sm font-medium">
          {connected ? 'متصل بـ ESP32' : 'غير متصل'}
        </span>
        <AnimatePresence mode="wait">
          <motion.div
            key={connected ? 'green' : 'red'}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <span
              className={`inline-block size-2 rounded-full ${
                connected ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]'
              }`}
            />
          </motion.div>
        </AnimatePresence>
      </div>
      {lastUpdate > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3.5" />
          <span>آخر تحديث: {formatTimestamp(lastUpdate)}</span>
        </div>
      )}
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════
//   مكون البوابة / الباب
// ═══════════════════════════════════════════════════════════════

function DoorControlCard({
  title,
  status,
  command,
  lastUpdate,
  onOpen,
  onClose,
  disabled,
  icon: Icon,
}: {
  title: string
  status: 'open' | 'closed' | undefined
  command: 'open' | 'close' | 'none' | undefined
  lastUpdate: number
  onOpen: () => void
  onClose: () => void
  disabled: boolean
  icon: React.ElementType
}) {
  const isOpen = status === 'open'
  const isCommanding = command && command !== 'none'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-r-4 border-r-yellow-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-yellow-500/10">
                <Icon className="size-5 text-yellow-600" />
              </div>
              <CardTitle className="text-base">{title}</CardTitle>
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
                  {isOpen ? 'مفتوحة' : 'مسكرة'}
                </Badge>
              </motion.div>
            </AnimatePresence>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="size-3" />
            <span>آخر تحديث: {formatTimestamp(lastUpdate)}</span>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={onOpen}
              disabled={disabled || isCommanding}
              className="flex-1 bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
            >
              <DoorOpen className="size-4" />
              {isCommanding && command === 'open' ? 'جاري التنفيذ...' : 'فتح البوابة'}
            </Button>
            <Button
              onClick={onClose}
              disabled={disabled || isCommanding}
              className="flex-1 bg-red-600 text-white shadow-sm hover:bg-red-700"
            >
              <DoorClosed className="size-4" />
              {isCommanding && command === 'close' ? 'جاري التنفيذ...' : 'إغلاق البوابة'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════
//   مكون حالة الجلوس
// ═══════════════════════════════════════════════════════════════

function SeatingCard({
  triggered,
  lastUpdate,
  canReset,
  onReset,
  disabled,
}: {
  triggered: boolean | undefined
  lastUpdate: number
  canReset: boolean
  onReset: () => void
  disabled: boolean
}) {
  const isTriggered = triggered === true

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
    >
      <Card className="border-r-4 border-r-yellow-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-yellow-500/10">
                <Armchair className="size-5 text-yellow-600" />
              </div>
              <div>
                <CardTitle className="text-base">جلوس العريس</CardTitle>
                <CardDescription className="mt-0.5 text-xs">
                  حالة تشغيل نظام جلوس العريس
                </CardDescription>
              </div>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={isTriggered ? 'active' : 'inactive'}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
              >
                <Badge
                  className={`text-xs ${
                    isTriggered
                      ? 'border-transparent bg-emerald-500/15 text-emerald-600'
                      : 'border-transparent bg-muted text-muted-foreground'
                  }`}
                >
                  {isTriggered ? 'تم التفعيل' : 'لم يتم التفعيل'}
                </Badge>
              </motion.div>
            </AnimatePresence>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="size-3" />
              <span>آخر تحديث: {formatTimestamp(lastUpdate)}</span>
            </div>
            {canReset && (
              <Button
                variant="outline"
                size="sm"
                onClick={onReset}
                disabled={disabled}
                className="gap-1.5 text-xs"
              >
                <RotateCcw className="size-3.5" />
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
//   تعريفات الإضاءة
// ═══════════════════════════════════════════════════════════════

interface LightItem {
  key: keyof LightsStatus
  label: string
  icon: React.ElementType
}

const LIGHT_ITEMS: LightItem[] = [
  { key: 'street', label: 'إضاءة الشارع', icon: LampDesk },
  { key: 'ship', label: 'إضاءة السفينة', icon: Ship },
  { key: 'ceiling', label: 'سقف الصالة', icon: Lightbulb },
  { key: 'floor', label: 'أرضية الصالة', icon: Square },
  { key: 'pillar_out', label: 'عمود خارجي', icon: Columns3 },
  { key: 'pillar_in', label: 'عمود داخلي', icon: Columns3 },
]

// ═══════════════════════════════════════════════════════════════
//   مكون الإضاءة
// ═══════════════════════════════════════════════════════════════

function LightsCard({
  lights,
  disabled,
  onToggle,
  onAllOn,
  onAllOff,
}: {
  lights: LightsStatus
  disabled: boolean
  onToggle: (key: keyof LightsStatus, value: boolean) => void
  onAllOn: () => void
  onAllOff: () => void
}) {
  const activeCount = Object.values(lights).filter(Boolean).length

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
                  التحكم في إضاءة قاعة الأفراح
                </CardDescription>
              </div>
            </div>
            <Badge
              className={`text-xs ${
                activeCount > 0
                  ? 'border-transparent bg-amber-500/15 text-amber-600'
                  : 'border-transparent bg-muted text-muted-foreground'
              }`}
            >
              {activeCount} من 6 مفعّل
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* شبكة المفاتيح */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {LIGHT_ITEMS.map((item) => {
              const isOn = lights[item.key] === true
              const Icon = item.icon
              return (
                <motion.div
                  key={item.key}
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
                        className={`flex size-8 items-center justify-center rounded-md ${
                          isOn ? 'bg-yellow-500/20' : 'bg-muted'
                        }`}
                      >
                        <Icon
                          className={`size-4 ${
                            isOn ? 'text-yellow-500' : 'text-muted-foreground'
                          }`}
                        />
                      </motion.div>
                    </AnimatePresence>
                    <span
                      className={`text-sm font-medium ${
                        isOn ? 'text-yellow-700' : 'text-muted-foreground'
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                  <Switch
                    checked={isOn}
                    onCheckedChange={(checked) => onToggle(item.key, checked)}
                    disabled={disabled}
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
              disabled={disabled || activeCount === 6}
              className="flex-1 gap-2 bg-yellow-500 text-white shadow-sm hover:bg-yellow-600"
            >
              <Power className="size-4" />
              تشغيل الكل
            </Button>
            <Button
              onClick={onAllOff}
              disabled={disabled || activeCount === 0}
              variant="outline"
              className="flex-1 gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <PowerOff className="size-4" />
              إطفاء الكل
            </Button>
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
  const canControl = hasControlPermission(user?.role)

  // حالة الاتصال
  const [connected, setConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(0)

  // حالة الأجهزة
  const [gateStatus, setGateStatus] = useState<GateStatus>(DEFAULT_HALL_STATE.gate)
  const [doorStatus, setDoorStatus] = useState<HallDoorStatus>(DEFAULT_HALL_STATE.hall_door)
  const [seatingStatus, setSeatingStatus] = useState<SeatingStatus>(DEFAULT_HALL_STATE.seating)
  const [lightsStatus, setLightsStatus] = useState<LightsStatus>(DEFAULT_HALL_STATE.lights)

  // ═══════════════════════════════════════════════════
  //   إرسال الأوامر إلى Firebase
  // ═══════════════════════════════════════════════════

  const sendCommand = useCallback(async (path: string, value: string | boolean) => {
    const { database } = initializeFirebase()
    if (!database) return
    await set(ref(database, path), value)
  }, [])

  // ═══════════════════════════════════════════════════
  //   أوامر البوابة
  // ═══════════════════════════════════════════════════

  const openGate = useCallback(async () => {
    await sendCommand('/wedding_hall/gate/command', 'open')
    setTimeout(() => {
      sendCommand('/wedding_hall/gate/command', 'none')
    }, 3000)
  }, [sendCommand])

  const closeGate = useCallback(async () => {
    await sendCommand('/wedding_hall/gate/command', 'close')
    setTimeout(() => {
      sendCommand('/wedding_hall/gate/command', 'none')
    }, 3000)
  }, [sendCommand])

  // ═══════════════════════════════════════════════════
  //   أوامر باب الصالة
  // ═══════════════════════════════════════════════════

  const openDoor = useCallback(async () => {
    await sendCommand('/wedding_hall/hall_door/command', 'open')
    setTimeout(() => {
      sendCommand('/wedding_hall/hall_door/command', 'none')
    }, 3000)
  }, [sendCommand])

  const closeDoor = useCallback(async () => {
    await sendCommand('/wedding_hall/hall_door/command', 'close')
    setTimeout(() => {
      sendCommand('/wedding_hall/hall_door/command', 'none')
    }, 3000)
  }, [sendCommand])

  // ═══════════════════════════════════════════════════
  //   إعادة تعيين الجلوس
  // ═══════════════════════════════════════════════════

  const resetSeating = useCallback(async () => {
    await sendCommand('/wedding_hall/seating/triggered', false)
    await sendCommand('/wedding_hall/seating/last_update', Date.now())
  }, [sendCommand])

  // ═══════════════════════════════════════════════════
  //   التحكم بالإضاءة
  // ═══════════════════════════════════════════════════

  const toggleLight = useCallback(
    (key: keyof LightsStatus, value: boolean) => {
      sendCommand(`/wedding_hall/lights/${key}`, value)
    },
    [sendCommand]
  )

  const allLightsOn = useCallback(() => {
    LIGHT_ITEMS.forEach((item) => {
      sendCommand(`/wedding_hall/lights/${item.key}`, true)
    })
  }, [sendCommand])

  const allLightsOff = useCallback(() => {
    LIGHT_ITEMS.forEach((item) => {
      sendCommand(`/wedding_hall/lights/${item.key}`, false)
    })
  }, [sendCommand])

  // ═══════════════════════════════════════════════════
  //   الاستماع للتغييرات في الوقت الحقيقي
  // ═══════════════════════════════════════════════════

  useEffect(() => {
    const { database } = initializeFirebase()
    if (!database) return

    // مستمع البوابة
    const gateRef = ref(database, '/wedding_hall/gate')
    const unsubGate = onValue(gateRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        setGateStatus(data)
        if (data.last_update) setLastUpdate(data.last_update)
      }
    })

    // مستمع باب الصالة
    const doorRef = ref(database, '/wedding_hall/hall_door')
    const unsubDoor = onValue(doorRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        setDoorStatus(data)
        if (data.last_update) setLastUpdate(data.last_update)
      }
    })

    // مستمع الجلوس
    const seatingRef = ref(database, '/wedding_hall/seating')
    const unsubSeating = onValue(seatingRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        setSeatingStatus(data)
        if (data.last_update) setLastUpdate(data.last_update)
      }
    })

    // مستمع الإضاءة
    const lightsRef = ref(database, '/wedding_hall/lights')
    const unsubLights = onValue(lightsRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        setLightsStatus(data)
        setLastUpdate(Date.now())
      }
      // التحقق من الاتصال عند أول استقبال للبيانات
      setConnected(true)
    })

    return () => {
      unsubGate()
      unsubDoor()
      unsubSeating()
      unsubLights()
    }
  }, [])

  // ═══════════════════════════════════════════════════
  //   عرض لوحة التحكم
  // ═══════════════════════════════════════════════════

  return (
    <div dir="rtl" className="space-y-6">
      {/* Permission Banner for viewer */}
      {!canControl && (
        <ReadOnlyBanner message="يمكنك فقط مشاهدة حالة الأجهزة. للتحكم بالبوابات والأبواب والإضاءة، تواصل مع المدير." />
      )}

      {/* مؤشر حالة الاتصال */}
      <ConnectionStatus connected={connected} lastUpdate={lastUpdate} />

      {/* بطاقات الأبواب */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <DoorControlCard
          title="بوابة الشارع"
          status={gateStatus.status}
          command={gateStatus.command}
          lastUpdate={gateStatus.last_update}
          onOpen={openGate}
          onClose={closeGate}
          disabled={!connected || !canControl}
          icon={DoorOpen}
        />
        <DoorControlCard
          title="باب الصالة"
          status={doorStatus.status}
          command={doorStatus.command}
          lastUpdate={doorStatus.last_update}
          onOpen={openDoor}
          onClose={closeDoor}
          disabled={!connected || !canControl}
          icon={DoorClosed}
        />
      </div>

      {/* بطاقة الجلوس */}
      <SeatingCard
        triggered={seatingStatus.triggered}
        lastUpdate={seatingStatus.last_update}
        canReset={canControl}
        onReset={resetSeating}
        disabled={!connected}
      />

      {/* بطاقة الإضاءة */}
      <LightsCard
        lights={lightsStatus}
        disabled={!connected || !canControl}
        onToggle={toggleLight}
        onAllOn={allLightsOn}
        onAllOff={allLightsOff}
      />
    </div>
  )
}
