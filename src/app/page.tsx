'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuthStore, useAppStore } from '@/store/auth-store'
import { ROLE_LABELS } from '@/lib/auth'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Users,
  CalendarDays,
  CreditCard,
  Shield,
  Settings,
  LogOut,
  Menu,
  X,
  Gamepad2,
  Crown,
  UserCog,
  UserCheck,
  Eye,
  Loader2,
  Sparkles,
  LayoutDashboard,
  Calendar,
  ClipboardList,
  UserCircle,
} from 'lucide-react'

import CustomerManagement from '@/components/customer-management'
import BookingManagement from '@/components/booking-management'
import BillingManagement from '@/components/billing-management'
import UserManagement from '@/components/user-management'
import SettingsPanel from '@/components/settings-panel'
import ControlDashboard from '@/components/control-dashboard'
import DashboardPage from '@/components/dashboard-page'
import CalendarView from '@/components/calendar-view'
import ActivityLogPage from '@/components/activity-log-page'
import ProfilePage from '@/components/profile-page'
import NotificationBell from '@/components/notification-bell'
import { PermissionsCard } from '@/components/permission-banner'

// ═══════════════════════════════════════════════════
//   ألوان كل صفحة في القائمة الجانبية
// ═══════════════════════════════════════════════════

const PAGE_COLORS: Record<string, { accent: string; bg: string; border: string; shadow: string; gradient: string }> = {
  home:        { accent: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.2)',  shadow: '0 2px 12px rgba(245,158,11,0.2)',  gradient: 'from-amber-500 to-amber-600' },
  dashboard:   { accent: '#06b6d4', bg: 'rgba(6,182,212,0.08)',   border: 'rgba(6,182,212,0.2)',   shadow: '0 2px 12px rgba(6,182,212,0.2)',   gradient: 'from-cyan-500 to-cyan-600' },
  customers:   { accent: '#f97316', bg: 'rgba(249,115,22,0.08)',  border: 'rgba(249,115,22,0.2)',  shadow: '0 2px 12px rgba(249,115,22,0.2)',  gradient: 'from-orange-500 to-orange-600' },
  bookings:    { accent: '#a855f7', bg: 'rgba(168,85,247,0.08)',  border: 'rgba(168,85,247,0.2)',  shadow: '0 2px 12px rgba(168,85,247,0.2)',  gradient: 'from-purple-500 to-purple-600' },
  billing:     { accent: '#10b981', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.2)',  shadow: '0 2px 12px rgba(16,185,129,0.2)',  gradient: 'from-emerald-500 to-emerald-600' },
  calendar:    { accent: '#ec4899', bg: 'rgba(236,72,153,0.08)',  border: 'rgba(236,72,153,0.2)',  shadow: '0 2px 12px rgba(236,72,153,0.2)',  gradient: 'from-pink-500 to-pink-600' },
  activity:    { accent: '#6366f1', bg: 'rgba(99,102,241,0.08)',  border: 'rgba(99,102,241,0.2)',  shadow: '0 2px 12px rgba(99,102,241,0.2)',  gradient: 'from-indigo-500 to-indigo-600' },
  users:       { accent: '#f43f5e', bg: 'rgba(244,63,94,0.08)',   border: 'rgba(244,63,94,0.2)',   shadow: '0 2px 12px rgba(244,63,94,0.2)',   gradient: 'from-rose-500 to-rose-600' },
  settings:    { accent: '#64748b', bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.2)', shadow: '0 2px 12px rgba(100,116,139,0.2)', gradient: 'from-slate-500 to-slate-600' },
  profile:     { accent: '#e879f9', bg: 'rgba(232,121,249,0.08)', border: 'rgba(232,121,249,0.2)', shadow: '0 2px 12px rgba(232,121,249,0.2)', gradient: 'from-fuchsia-500 to-fuchsia-600' },
}

// ═══════════════════════════════════════════════════
//   بيانات الدخول السريع
// ═══════════════════════════════════════════════════

const QUICK_USERS = [
  {
    role: 'admin' as const,
    email: 'admin@wedding.com',
    password: 'admin123',
    label: 'مدير النظام',
    icon: Crown,
    color: 'from-amber-500 to-amber-600',
    borderColor: 'border-amber-500/25 hover:border-amber-500/50',
    textColor: 'text-amber-400',
    glowColor: 'shadow-[0_0_15px_rgba(245,158,11,0.2)]',
  },
  {
    role: 'manager' as const,
    email: 'manager@wedding.com',
    password: 'manager123',
    label: 'مدير',
    icon: UserCog,
    color: 'from-cyan-500 to-cyan-600',
    borderColor: 'border-cyan-500/25 hover:border-cyan-500/50',
    textColor: 'text-cyan-400',
    glowColor: 'shadow-[0_0_15px_rgba(6,182,212,0.2)]',
  },
  {
    role: 'employee' as const,
    email: 'employee@wedding.com',
    password: 'emp123',
    label: 'موظف',
    icon: UserCheck,
    color: 'from-slate-400 to-slate-500',
    borderColor: 'border-slate-400/25 hover:border-slate-400/50',
    textColor: 'text-slate-300',
    glowColor: 'shadow-[0_0_15px_rgba(148,163,184,0.15)]',
  },
  {
    role: 'viewer' as const,
    email: 'viewer@wedding.com',
    password: 'view123',
    label: 'مشاهد',
    icon: Eye,
    color: 'from-emerald-500 to-emerald-600',
    borderColor: 'border-emerald-500/25 hover:border-emerald-500/50',
    textColor: 'text-emerald-400',
    glowColor: 'shadow-[0_0_15px_rgba(16,185,129,0.15)]',
  },
]

// ═══════════════════════════════════════════════════
//   مكون تسجيل الدخول
// ═══════════════════════════════════════════════════

function LoginPage() {
  const { login } = useAuthStore()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [quickLoading, setQuickLoading] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast({ title: 'خطأ', description: 'يرجى إدخال البريد الإلكتروني وكلمة المرور', variant: 'destructive' })
      return
    }
    setLoading(true)
    const success = await login(email, password)
    if (!success) {
      toast({ title: 'خطأ', description: 'البريد الإلكتروني أو كلمة المرور غير صحيحة', variant: 'destructive' })
    }
    setLoading(false)
  }

  const handleQuickLogin = useCallback(async (user: typeof QUICK_USERS[number]) => {
    setQuickLoading(user.role)
    setEmail(user.email)
    setPassword(user.password)
    const success = await login(user.email, user.password)
    if (!success) {
      toast({ title: 'خطأ', description: 'فشل تسجيل الدخول', variant: 'destructive' })
      setQuickLoading(null)
    }
  }, [login, toast])

  return (
    <div dir="rtl" className="min-h-screen relative overflow-hidden bg-[#0f0f17] mesh-bg-login">
      {/* Gradient blobs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-amber-500/[0.07] rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] bg-amber-500/[0.05] rounded-full blur-[130px] animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-[40%] left-[30%] w-[400px] h-[400px] bg-purple-500/[0.04] rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] right-[20%] w-[300px] h-[300px] bg-cyan-500/[0.03] rounded-full blur-[100px]" style={{ animationDelay: '2.5s' }} />
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">

          {/* Logo */}
          <div className="text-center mb-8 animate-fade-up">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 animate-glow mb-5 relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-300 to-amber-600 opacity-20 blur-md animate-pulse" />
              <CalendarDays className="w-11 h-11 text-[#0f0f17] relative z-10" strokeWidth={1.8} />
            </div>
            <h1
              className="text-5xl font-bold text-gold-gradient mb-2"
              style={{ fontFamily: '"Playfair Display", serif' }}
            >
              صالات الأفراح
            </h1>
            <p
              className="text-[#9490a0] text-sm tracking-wide"
              style={{ fontFamily: '"Cormorant Garamond", serif' }}
            >
              Wedding Hall Management System
            </p>
          </div>

          {/* Login Card */}
          <div className="glass-strong rounded-2xl p-8 animate-fade-up stagger-2">
            <div className="text-center mb-6">
              <h2
                className="text-2xl font-bold text-[#f0ece4] mb-1"
                style={{ fontFamily: '"Playfair Display", serif' }}
              >
                تسجيل الدخول
              </h2>
              <p className="text-[#9490a0] text-sm">أدخل بياناتك أو استخدم الدخول السريع</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[#9490a0] text-sm font-medium mb-2">
                  البريد الإلكتروني
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@wedding.com"
                  dir="ltr"
                  className="text-left h-11 rounded-xl bg-[rgba(22,22,34,0.6)] border-[rgba(255,255,255,0.08)] text-[#f0ece4] placeholder-[rgba(148,144,160,0.5)] focus:border-[rgba(232,184,74,0.4)] focus:ring-1 focus:ring-[rgba(232,184,74,0.15)] transition-colors duration-200"
                />
              </div>
              <div>
                <label className="block text-[#9490a0] text-sm font-medium mb-2">
                  كلمة المرور
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  dir="ltr"
                  className="text-left h-11 rounded-xl bg-[rgba(22,22,34,0.6)] border-[rgba(255,255,255,0.08)] text-[#f0ece4] placeholder-[rgba(148,144,160,0.5)] focus:border-[rgba(232,184,74,0.4)] focus:ring-1 focus:ring-[rgba(232,184,74,0.15)] transition-colors duration-200"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="btn-gold w-full h-12 rounded-xl text-base"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    جاري تسجيل الدخول...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogOut className="w-5 h-5 rotate-180" />
                    تسجيل الدخول
                  </span>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full divider-gold" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 text-xs text-[#9490a0] bg-transparent">أو</span>
              </div>
            </div>

            {/* Quick Login */}
            <div>
              <p className="text-center text-[#9490a0] text-sm mb-4 flex items-center justify-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                دخول سريع — اختر الدور المطلوب
              </p>
              <div className="grid grid-cols-2 gap-3">
                {QUICK_USERS.map((user) => {
                  const Icon = user.icon
                  const isLoading = quickLoading === user.role
                  return (
                    <button
                      key={user.role}
                      onClick={() => handleQuickLogin(user)}
                      disabled={!!quickLoading}
                      className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border glass transition-all duration-300 group ${user.borderColor} ${isLoading ? 'opacity-80 scale-95' : 'hover:scale-[1.03] hover:-translate-y-0.5 active:scale-[0.98]'}`}
                    >
                      {isLoading && (
                        <div className="absolute inset-0 rounded-2xl bg-[rgba(15,15,23,0.6)] flex items-center justify-center">
                          <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
                        </div>
                      )}
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${user.color} flex items-center justify-center ${user.glowColor} group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-5 h-5 text-white" strokeWidth={2} />
                      </div>
                      <span className={`text-xs font-semibold ${user.textColor}`}>
                        {user.label}
                      </span>
                      <span className="text-[10px] text-[#9490a0]" dir="ltr" style={{ fontFamily: '"DM Mono", monospace' }}>
                        {user.email}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Feature Icons */}
          <div className="grid grid-cols-3 gap-3 mt-6 animate-fade-up stagger-4">
            {[
              { icon: Shield, label: 'نظام صلاحيات', color: 'text-amber-400', bg: 'bg-amber-500/10' },
              { icon: Gamepad2, label: 'تحكم بالأجهزة', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
              { icon: CreditCard, label: 'إدارة الفواتير', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            ].map((f) => (
              <div
                key={f.label}
                className="glass rounded-xl p-3 text-center card-hover"
              >
                <div className={`w-9 h-9 mx-auto mb-2 rounded-lg ${f.bg} flex items-center justify-center`}>
                  <f.icon className={`w-4 h-4 ${f.color}`} />
                </div>
                <p className="text-[10px] text-[#9490a0]">{f.label}</p>
              </div>
            ))}
          </div>

          <p className="text-center text-[rgba(148,144,160,0.5)] text-xs mt-6 animate-fade-up stagger-5">
            © 2025 Wedding Hall System — جميع الحقوق محفوظة
          </p>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════
//   عناصر القائمة الجانبية
// ═══════════════════════════════════════════════════

interface NavItem {
  key: string
  label: string
  icon: React.ElementType
  roles: string[]
}

const NAV_ITEMS: NavItem[] = [
  { key: 'home', label: 'لوحة المعلومات', icon: LayoutDashboard, roles: ['admin', 'manager', 'employee', 'viewer'] },
  { key: 'dashboard', label: 'التحكم بالأجهزة', icon: Gamepad2, roles: ['admin', 'manager', 'employee', 'viewer'] },
  { key: 'customers', label: 'الزبائن', icon: Users, roles: ['admin', 'manager', 'employee', 'viewer'] },
  { key: 'bookings', label: 'الحجوزات', icon: CalendarDays, roles: ['admin', 'manager', 'employee', 'viewer'] },
  { key: 'billing', label: 'الفواتير', icon: CreditCard, roles: ['admin', 'manager', 'employee', 'viewer'] },
  { key: 'calendar', label: 'التقويم', icon: Calendar, roles: ['admin', 'manager', 'employee', 'viewer'] },
  { key: 'activity', label: 'سجل النشاطات', icon: ClipboardList, roles: ['admin', 'manager'] },
  { key: 'users', label: 'المستخدمون', icon: Shield, roles: ['admin'] },
  { key: 'settings', label: 'الإعدادات', icon: Settings, roles: ['admin', 'manager', 'employee', 'viewer'] },
]

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { user, logout } = useAuthStore()
  const { currentPage, setCurrentPage } = useAppStore()

  const handleNav = (key: string) => {
    setCurrentPage(key as typeof currentPage)
    onClose?.()
  }

  if (!user) return null

  const userNavItems = NAV_ITEMS.filter((item) => item.roles.includes(user.role))

  return (
    <div className="flex flex-col h-full bg-[#0d0d15]">
      {/* Logo Header */}
      <div className="p-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
            <CalendarDays className="w-5 h-5 text-[#0f0f17]" strokeWidth={1.8} />
          </div>
          <div className="flex-1 min-w-0">
            <h2
              className="font-bold text-sm truncate text-[#f0ece4]"
              style={{ fontFamily: '"Playfair Display", serif' }}
            >
              صالات الأفراح
            </h2>
            <p className="text-xs text-[#9490a0] truncate">{user.name}</p>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-[#9490a0] hover:text-[#f0ece4] hover:bg-[rgba(255,255,255,0.06)]" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="divider-gold mx-4" />

      {/* Navigation */}
      <ScrollArea className="flex-1 py-3 px-3">
        <nav className="space-y-1">
          {userNavItems.map((item) => {
            const isActive = currentPage === item.key
            const Icon = item.icon
            const colors = PAGE_COLORS[item.key]
            return (
              <button
                key={item.key}
                onClick={() => handleNav(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? `text-white border-r-2`
                    : 'text-[#9490a0] hover:text-[#f0ece4] hover:bg-[rgba(255,255,255,0.04)]'
                }`}
                style={isActive ? {
                  backgroundColor: colors?.bg,
                  borderColor: colors?.accent,
                } : undefined}
              >
                <Icon className={`h-[18px] w-[18px] shrink-0`} style={isActive ? { color: colors?.accent } : undefined} />
                <span>{item.label}</span>
                {isActive && (
                  <span
                    className="mr-auto w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: colors?.accent, boxShadow: `0 0 6px ${colors?.accent}` }}
                  />
                )}
              </button>
            )
          })}
        </nav>

        {/* Permissions Card */}
        <div className="mt-4 px-1">
          <div className="divider-gold mb-3" />
          {user && <PermissionsCard role={user.role} />}
        </div>
      </ScrollArea>

      {/* Footer / User */}
      <div className="p-3 pt-2">
        <div className="divider-gold mb-3" />
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-[#0f0f17] text-xs font-bold shrink-0 shadow-md shadow-amber-500/20">
            {user.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-[#f0ece4]">{user.name}</p>
            <span className="inline-block text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 font-medium mt-0.5">
              {ROLE_LABELS[user.role]}
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full mt-1 justify-start gap-2 text-[#9490a0] hover:text-rose-400 hover:bg-rose-500/10 h-9 px-3 rounded-lg transition-colors duration-200"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          تسجيل الخروج
        </Button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════
//   الصفحة الرئيسية
// ═══════════════════════════════════════════════════

export default function Home() {
  const { isAuthenticated, loading, user, checkAuth } = useAuthStore()
  const { currentPage, sidebarOpen, setSidebarOpen, setCurrentPage } = useAppStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f17]">
        <div className="text-center space-y-4">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 border-2 border-amber-500/20 rounded-full" />
            <div className="absolute inset-0 border-2 border-transparent border-t-amber-400 rounded-full animate-spin" />
            <div className="absolute inset-3 border-2 border-transparent border-t-amber-600 rounded-full animate-spin" style={{ animationDuration: '0.75s', animationDirection: 'reverse' }} />
          </div>
          <h2
            className="text-lg font-bold text-gold-gradient"
            style={{ fontFamily: '"Playfair Display", serif' }}
          >
            صالات الأفراح
          </h2>
          <p className="text-sm text-[#9490a0]">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginPage />
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'home': return <DashboardPage />
      case 'dashboard': return <ControlDashboard />
      case 'customers': return <CustomerManagement />
      case 'bookings': return <BookingManagement />
      case 'billing': return <BillingManagement />
      case 'calendar': return <CalendarView />
      case 'activity': return <ActivityLogPage />
      case 'users': return <UserManagement />
      case 'settings': return <SettingsPanel />
      case 'profile': return <ProfilePage />
      default: return <DashboardPage />
    }
  }

  const pageTitle: Record<string, string> = {
    home: 'لوحة المعلومات',
    dashboard: 'لوحة التحكم بالأجهزة',
    customers: 'إدارة الزبائن',
    bookings: 'إدارة الحجوزات',
    billing: 'إدارة الفواتير والمدفوعات',
    calendar: 'تقويم الأفراح',
    activity: 'سجل النشاطات',
    users: 'إدارة المستخدمين',
    settings: 'الإعدادات',
    profile: 'الملف الشخصي',
  }

  const currentColors = PAGE_COLORS[currentPage] || PAGE_COLORS.home
  const pageGradientClass = `page-gradient-${currentPage}`

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:right-0 lg:z-50 lg:flex lg:w-64 lg:flex-col border-l border-[rgba(255,255,255,0.05)]">
        <div className="flex grow flex-col overflow-y-auto bg-[#0d0d15]">
          <SidebarContent />
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="right" className="w-72 p-0 glass-strong border-l border-[rgba(255,255,255,0.05)]">
          <SheetTitle className="sr-only">القائمة الجانبية</SheetTitle>
          <SidebarContent onClose={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="lg:pr-64">
        {/* Header */}
        <header
          className="sticky top-0 z-40 flex h-14 items-center gap-4 glass border-b px-4 lg:px-6 transition-colors duration-300"
          style={{ borderColor: currentColors.border }}
        >
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-9 w-9 text-[#9490a0] hover:text-[#f0ece4] hover:bg-[rgba(255,255,255,0.06)]"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Page Title with colored dot */}
          <div className="flex items-center gap-2.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: currentColors.accent, boxShadow: `0 0 8px ${currentColors.accent}` }}
            />
            <h1
              className="text-lg font-semibold text-[#f0ece4]"
              style={{ fontFamily: '"Playfair Display", serif' }}
            >
              {pageTitle[currentPage] || 'لوحة التحكم'}
            </h1>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Notification Bell */}
          <NotificationBell />

          {/* User Info */}
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className="hidden sm:flex gap-1 text-xs transition-colors duration-300"
              style={{ borderColor: currentColors.border, color: currentColors.accent, backgroundColor: currentColors.bg }}
            >
              {ROLE_LABELS[user?.role || 'viewer']}
            </Badge>
            <button
              onClick={() => setCurrentPage('profile')}
              className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-[#0f0f17] text-xs font-bold hover:scale-105 transition-all duration-200 shadow-md shadow-amber-500/20"
            >
              {user?.name?.charAt(0) || 'U'}
            </button>
          </div>
        </header>

        {/* Page Content with themed gradient */}
        <main className={`p-4 lg:p-6 max-w-7xl mx-auto min-h-[calc(100vh-3.5rem)] ${pageGradientClass}`}>
          {renderPage()}
        </main>
      </div>
    </div>
  )
}
