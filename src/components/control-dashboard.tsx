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
      <div className="glass-strong rounded-xl border-0 overflow-hidden border-r-4 border-r-cyan-400">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`flex size-12 items-center justify-center rounded-xl ${
                online
                  ? 'bg-cyan-500/10 ring-1 ring-cyan-500/20'
                  : 'bg-red-500/10 ring-1 ring-red-500/20'
              }`}>
                <Cpu className={`size-6 ${online ? 'text-cyan-400' : 'text-red-400'}`} />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-base text-[#f5f0e8] font-[Playfair_Display]">ESP32</span>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={online ? 'on' : 'off'}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    >
                      {online ? (
                        <Badge className="border border-green-500/20 bg-green-500/10 text-green-400 text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm">
                          متصل
                        </Badge>
                      ) : (
                        <Badge className="border border-red-500/20 bg-red-500/10 text-red-400 text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm">
                          غير متصل
                        </Badge>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
                <p className="text-xs text-[#8a8690] mt-0.5">
                  {online ? formatRelativeTime(lastSeen) : 'في انتظار الاتصال...'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <AnimatePresence mode="wait">
                <motion.div
                  key={online ? 'wifi-on' : 'wifi-off'}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                >
                  {online ? (
                    <Wifi className="size-5 text-green-400" />
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
                    className={`inline-block size-2.5 rounded-full ${
                      online
                        ? 'bg-green-400 shadow-[0_0_10px_rgba(34,197,94,0.6)]'
                        : 'bg-red-400 shadow-[0_0_10px_rgba(239,68,68,0.6)]'
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
            <div className="mt-3 flex items-center gap-2 text-[11px] text-[#8a8690]/60">
              <Clock className="size-3.5" />
              <span>آخر ظهور: <span className="font-[DM_Mono] text-[#8a8690]">{formatTimestamp(lastSeen)}</span></span>
            </div>
          )}
        </CardContent>
      </div>
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
      <div className={`glass rounded-xl overflow-hidden transition-all duration-300 ${
        isOpen ? 'ring-1 ring-green-500/20' : ''
      }`}>
        <div className="p-5 pb-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <div className={`flex size-11 items-center justify-center rounded-xl transition-colors ${
                isOpen
                  ? 'bg-green-500/15 ring-1 ring-green-500/25'
                  : 'bg-white/5 ring-1 ring-white/10'
              }`}>
                <Icon className={`size-5 transition-colors ${isOpen ? 'text-green-400' : 'text-[#8a8690]'}`} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#f5f0e8] font-[Playfair_Display]">{title}</h3>
                {description && (
                  <p className="text-[11px] text-[#8a8690]/70 mt-0.5 leading-relaxed">{description}</p>
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
                  className={`text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm ${
                    isOpen
                      ? 'border border-green-500/25 bg-green-500/10 text-green-400'
                      : 'border border-white/10 bg-white/5 text-[#8a8690]'
                  }`}
                >
                  {isOpen ? 'مفتوحة' : 'مغلقة'}
                </Badge>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="px-5 pb-5 space-y-3">
          <button
            onClick={onOpen}
            disabled={disabled || isLoading}
            className={`w-full py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
              isOpen
                ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg shadow-green-500/20 ring-1 ring-green-400/30'
                : 'bg-white/[0.04] text-[#8a8690] hover:bg-white/[0.07] hover:text-[#f5f0e8] border border-white/[0.06]'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {isLoading && isOpen === false ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <DoorOpen className="size-4" />
            )}
            فتح
          </button>
          <button
            onClick={onClose}
            disabled={disabled || isLoading}
            className={`w-full py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
              !isOpen
                ? 'bg-gradient-to-r from-[#2a2a35] to-[#1e1e28] text-[#8a8690] ring-1 ring-white/[0.06]'
                : 'bg-red-500/10 text-red-400 hover:bg-red-500/15 border border-red-500/20'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {isLoading && isOpen === true ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <DoorClosed className="size-4" />
            )}
            إغلاق
          </button>
        </div>
      </div>
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
      <div className={`glass rounded-xl overflow-hidden border-r-4 transition-all duration-300 ${
        active ? 'border-r-violet-500 ring-1 ring-violet-500/20' : 'border-r-violet-500/40'
      }`}>
        <div className="p-5 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex size-11 items-center justify-center rounded-xl transition-all duration-300 ${
                active
                  ? 'bg-violet-500/15 ring-1 ring-violet-500/25'
                  : 'bg-violet-500/5 ring-1 ring-violet-500/10'
              }`}>
                <Armchair className={`size-5 transition-colors ${active ? 'text-violet-400' : 'text-violet-400/50'}`} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#f5f0e8] font-[Playfair_Display]">جلوس العريس</h3>
                <p className="text-[11px] text-[#8a8690]/70 mt-0.5">
                  تراسونيك داخلي - تفعيل / إعادة تعيين
                </p>
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
                  className={`text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm ${
                    active
                      ? 'border border-violet-500/25 bg-violet-500/10 text-violet-400'
                      : 'border border-white/10 bg-white/5 text-[#8a8690]'
                  }`}
                >
                  {active ? 'مفعّل' : 'غير مفعّل'}
                </Badge>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="px-5 pb-5 space-y-3">
          <button
            onClick={onToggle}
            disabled={disabled || isLoading}
            className={`w-full py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
              active
                ? 'bg-gradient-to-r from-violet-600 to-violet-500 text-white shadow-lg shadow-violet-500/20 ring-1 ring-violet-400/30'
                : 'bg-white/[0.04] text-[#8a8690] hover:bg-white/[0.07] hover:text-[#f5f0e8] border border-white/[0.06]'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Armchair className="size-4" />
            )}
            {active ? 'إيقاف' : 'تفعيل'}
          </button>

          {canCtrl && active && (
            <button
              onClick={onReset}
              disabled={disabled || isLoading}
              className="w-full py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 bg-white/[0.03] text-[#8a8690] hover:bg-white/[0.06] hover:text-[#f5f0e8] border border-white/[0.06] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RotateCcw className="size-4" />
              إعادة تعيين
            </button>
          )}
        </div>
      </div>
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
      <div className="glass rounded-xl overflow-hidden border-0">
        <div className="p-5 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex size-11 items-center justify-center rounded-xl transition-all duration-300 ${
                activeCount > 0
                  ? 'bg-cyan-500/10 ring-1 ring-cyan-500/20'
                  : 'bg-white/5 ring-1 ring-white/10'
              }`}>
                <Lightbulb className={`size-5 transition-colors ${activeCount > 0 ? 'text-cyan-400' : 'text-[#8a8690]'}`} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#f5f0e8] font-[Playfair_Display]">الإضاءة</h3>
                <p className="text-[11px] text-[#8a8690]/70 mt-0.5">
                  6 مناطق إضاءة - ريليه ثنائي (LOW) + رباعي (HIGH)
                </p>
              </div>
            </div>
            <Badge
              className={`text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm font-[DM_Mono] ${
                activeCount > 0
                  ? 'border border-cyan-500/25 bg-cyan-500/10 text-cyan-400'
                  : 'border border-white/10 bg-white/5 text-[#8a8690]'
              }`}
            >
              {activeCount} / 6
            </Badge>
          </div>
        </div>

        <div className="px-5 pb-5 space-y-4">
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
                  className={`flex items-center justify-between rounded-xl px-4 py-3.5 transition-all duration-300 ${
                    isOn
                      ? 'bg-cyan-500/5 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.08)]'
                      : 'bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04]'
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
                        className={`flex size-9 items-center justify-center rounded-lg transition-all duration-300 ${
                          isOn
                            ? 'bg-cyan-500/15 ring-1 ring-cyan-500/25 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                            : 'bg-white/5'
                        }`}
                      >
                        {isLoading ? (
                          <Loader2 className="size-4 animate-spin text-[#8a8690]" />
                        ) : (
                          <Icon
                            className={`size-4 transition-colors ${
                              isOn ? 'text-cyan-400' : 'text-[#8a8690]'
                            }`}
                          />
                        )}
                      </motion.div>
                    </AnimatePresence>
                    <div className="flex flex-col">
                      <span
                        className={`text-sm font-medium transition-colors ${
                          isOn ? 'text-cyan-300' : 'text-[#8a8690]'
                        }`}
                      >
                        {def.label}
                      </span>
                      <span className="text-[9px] text-[#8a8690]/50 font-[DM_Mono]">
                        {def.inverted ? 'ثنائي' : 'رباعي'}
                      </span>
                    </div>
                  </div>
                  <Switch
                    checked={isOn}
                    onCheckedChange={() => onToggle(def.key)}
                    disabled={disabled || isLoading}
                    className="data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                  />
                </motion.div>
              )
            })}
          </div>

          <div className="divider-gold" />

          {/* أزرار التحكم بالجملة */}
          <div className="flex gap-3">
            <button
              onClick={onAllOn}
              disabled={disabled || activeCount === 6 || loading === 'all'}
              className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 btn-gold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading === 'all' ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Power className="size-4" />
              )}
              تشغيل الكل
            </button>
            <button
              onClick={onAllOff}
              disabled={disabled || activeCount === 0 || loading === 'all'}
              className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 bg-transparent text-red-400 border border-red-500/20 hover:bg-red-500/10 hover:border-red-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading === 'all' ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <PowerOff className="size-4" />
              )}
              إطفاء الكل
            </button>
          </div>
        </div>
      </div>
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
      <div className={`glass rounded-xl overflow-hidden border-0 transition-all duration-300 ${
        playing ? 'ring-1 ring-pink-500/20' : ''
      }`}>
        <div className="p-5 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex size-11 items-center justify-center rounded-xl transition-all duration-300 ${
                playing
                  ? 'bg-pink-500/15 ring-1 ring-pink-500/25'
                  : 'bg-pink-500/5 ring-1 ring-pink-500/10'
              }`}>
                <Music className={`size-5 transition-colors ${playing ? 'text-pink-400' : 'text-pink-400/50'}`} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#f5f0e8] font-[Playfair_Display]">مشغل الصوت</h3>
                <p className="text-[11px] text-[#8a8690]/70 mt-0.5">
                  DFPlayer - التحكم بالمسارات الصوتية
                </p>
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
                  className={`text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm ${
                    playing
                      ? 'border border-pink-500/25 bg-pink-500/10 text-pink-400'
                      : 'border border-white/10 bg-white/5 text-[#8a8690]'
                  }`}
                >
                  {playing ? 'يشغل' : 'متوقف'}
                </Badge>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="px-5 pb-5 space-y-5">
          {/* معلومات المسار */}
          <div className="flex items-center justify-between rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-3.5">
            <div className="flex items-center gap-3">
              <Volume2 className="size-4 text-[#8a8690]" />
              <div>
                <p className="text-[11px] text-[#8a8690]">المسار الحالي</p>
                <p className="text-lg font-bold font-[DM_Mono] text-[#f5f0e8]">#{track}</p>
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
                className="w-16 h-8 text-center text-sm font-[DM_Mono] rounded-lg border border-white/[0.08] bg-white/[0.03] text-[#f5f0e8] px-2 focus:outline-none focus:ring-1 focus:ring-pink-500/30 placeholder:text-[#8a8690]/40"
              />
              <button
                type="submit"
                disabled={disabled || isLoading}
                className="h-8 px-3 text-xs font-medium rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/20 hover:bg-pink-500/15 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                تشغيل
              </button>
            </form>
          </div>

          {/* أزرار التحكم */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={onPrevTrack}
              disabled={disabled || isLoading}
              className="size-11 rounded-full flex items-center justify-center bg-white/[0.04] border border-white/[0.08] text-[#8a8690] hover:bg-white/[0.08] hover:text-[#f5f0e8] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <SkipBack className="size-4" />
            </button>

            <button
              onClick={onTogglePlay}
              disabled={disabled || isLoading}
              className={`size-16 rounded-full flex items-center justify-center shadow-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
                playing
                  ? 'bg-gradient-to-br from-pink-500 to-pink-600 text-white shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-105'
                  : 'bg-gradient-to-br from-[#06b6d4] to-[#0891b2] text-[#0a0a0f] shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-105'
              }`}
            >
              {isLoading ? (
                <Loader2 className="size-6 animate-spin" />
              ) : playing ? (
                <Pause className="size-6" />
              ) : (
                <Play className="size-6" />
              )}
            </button>

            <button
              onClick={onNextTrack}
              disabled={disabled || isLoading}
              className="size-11 rounded-full flex items-center justify-center bg-white/[0.04] border border-white/[0.08] text-[#8a8690] hover:bg-white/[0.08] hover:text-[#f5f0e8] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <SkipForward className="size-4" />
            </button>
          </div>

          {/* مسارات سريعة */}
          <div className="flex gap-2 flex-wrap">
            {[1, 2, 3, 4, 5].map((t) => (
              <button
                key={t}
                onClick={() => onPlay(t)}
                disabled={disabled || isLoading}
                className={`h-8 px-3.5 text-xs font-medium rounded-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
                  track === t
                    ? 'bg-pink-500/15 text-pink-400 border border-pink-500/25 shadow-[0_0_10px_rgba(236,72,153,0.1)]'
                    : 'bg-white/[0.03] text-[#8a8690] border border-white/[0.06] hover:bg-white/[0.06] hover:text-[#f5f0e8]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>
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
