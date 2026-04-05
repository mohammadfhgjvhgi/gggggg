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
//   بيانات الدخول السريع
// ═══════════════════════════════════════════════════

const QUICK_USERS = [
  {
    role: 'admin' as const,
    email: 'admin@wedding.com',
    password: 'admin123',
    label: 'مدير النظام',
    icon: Crown,
    color: 'from-[#d4a853] to-[#b8912e]',
    borderColor: 'border-[rgba(212,168,83,0.25)] hover:border-[rgba(212,168,83,0.5)]',
    textColor: 'text-[#f0d48a]',
    glowColor: 'shadow-[0_0_15px_rgba(212,168,83,0.15)]',
  },
  {
    role: 'manager' as const,
    email: 'manager@wedding.com',
    password: 'manager123',
    label: 'مدير',
    icon: UserCog,
    color: 'from-[#c0a060] to-[#a08040]',
    borderColor: 'border-[rgba(192,160,96,0.25)] hover:border-[rgba(192,160,96,0.5)]',
    textColor: 'text-[#e0c878]',
    glowColor: 'shadow-[0_0_15px_rgba(192,160,96,0.15)]',
  },
  {
    role: 'employee' as const,
    email: 'employee@wedding.com',
    password: 'emp123',
    label: 'موظف',
    icon: UserCheck,
    color: 'from-[#9090a0] to-[#707080]',
    borderColor: 'border-[rgba(160,160,180,0.2)] hover:border-[rgba(160,160,180,0.4)]',
    textColor: 'text-[#b0b0c0]',
    glowColor: 'shadow-[0_0_15px_rgba(160,160,180,0.1)]',
  },
  {
    role: 'viewer' as const,
    email: 'viewer@wedding.com',
    password: 'view123',
    label: 'مشاهد',
    icon: Eye,
    color: 'from-[#708070] to-[#506050]',
    borderColor: 'border-[rgba(130,150,130,0.2)] hover:border-[rgba(130,150,130,0.4)]',
    textColor: 'text-[#a0b0a0]',
    glowColor: 'shadow-[0_0_15px_rgba(130,150,130,0.1)]',
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
      toast({ title: 'خطأ', description: 'يرجى إدخال البريد وكلمة المرور', variant: 'destructive' })
      return
    }
    setLoading(true)
    const success = await login(email, password)
    if (!success) {
      toast({ title: 'خطأ', description: 'البريد أو كلمة المرور غير صحيحة', variant: 'destructive' })
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
    <div dir="rtl" className="min-h-screen relative overflow-hidden bg-[#0a0a0f] mesh-bg-login">
      {/* Mesh gradient blobs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-[rgba(212,168,83,0.07)] rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] bg-[rgba(212,168,83,0.05)] rounded-full blur-[130px] animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-[40%] left-[30%] w-[400px] h-[400px] bg-[rgba(180,140,60,0.03)] rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] right-[20%] w-[300px] h-[300px] bg-[rgba(240,212,138,0.03)] rounded-full blur-[100px]" style={{ animationDelay: '2.5s' }} />
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">

          {/* Logo */}
          <div className="text-center mb-8 animate-fade-up">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-[#d4a853] via-[#c49a48] to-[#b8912e] animate-glow mb-5 relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#f0d48a] to-[#b8912e] opacity-20 blur-md animate-pulse" />
              <CalendarDays className="w-11 h-11 text-[#0a0a0f] relative z-10" strokeWidth={1.8} />
            </div>
            <h1
              className="text-5xl font-bold text-gold-gradient mb-2"
              style={{ fontFamily: '"Playfair Display", serif' }}
            >
              صالات الأفراح
            </h1>
            <p
              className="text-[#8a8690] text-sm tracking-wide"
              style={{ fontFamily: '"Cormorant Garamond", serif' }}
            >
              Wedding Hall Management System
            </p>
          </div>

          {/* Login Card */}
          <div className="glass-strong rounded-2xl p-8 animate-fade-up stagger-2">
            <div className="text-center mb-6">
              <h2
                className="text-2xl font-bold text-[#f5f0e8] mb-1"
                style={{ fontFamily: '"Playfair Display", serif' }}
              >
                تسجيل الدخول
              </h2>
              <p className="text-[#8a8690] text-sm">أدخل بياناتك أو استخدم الدخول السريع</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[#8a8690] text-sm font-medium mb-2">
                  البريد الإلكتروني
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@wedding.com"
                  dir="ltr"
                  className="text-left h-11 rounded-xl bg-[rgba(20,20,30,0.6)] border-[rgba(255,255,255,0.06)] text-[#f5f0e8] placeholder-[rgba(138,134,144,0.5)] focus:border-[rgba(212,168,83,0.4)] focus:ring-1 focus:ring-[rgba(212,168,83,0.15)] transition-colors duration-200"
                />
              </div>
              <div>
                <label className="block text-[#8a8690] text-sm font-medium mb-2">
                  كلمة المرور
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  dir="ltr"
                  className="text-left h-11 rounded-xl bg-[rgba(20,20,30,0.6)] border-[rgba(255,255,255,0.06)] text-[#f5f0e8] placeholder-[rgba(138,134,144,0.5)] focus:border-[rgba(212,168,83,0.4)] focus:ring-1 focus:ring-[rgba(212,168,83,0.15)] transition-colors duration-200"
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
                <span className="px-3 text-xs text-[#8a8690] bg-transparent">أو</span>
              </div>
            </div>

            {/* Quick Login */}
            <div>
              <p className="text-center text-[#8a8690] text-sm mb-4 flex items-center justify-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#d4a853]" />
                دخول سريع - اضغط على الدور المطلوب
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
                        <div className="absolute inset-0 rounded-2xl bg-[rgba(20,20,30,0.5)] flex items-center justify-center">
                          <Loader2 className="w-5 h-5 animate-spin text-[#d4a853]" />
                        </div>
                      )}
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${user.color} flex items-center justify-center ${user.glowColor} group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-5 h-5 text-[#0a0a0f]" strokeWidth={2} />
                      </div>
                      <span className={`text-xs font-semibold ${user.textColor}`}>
                        {user.label}
                      </span>
                      <span className="text-[10px] text-[#8a8690]" dir="ltr" style={{ fontFamily: '"DM Mono", monospace' }}>
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
              { icon: Shield, label: 'نظام صلاحيات', color: 'text-[#d4a853]', bg: 'bg-[rgba(212,168,83,0.08)]' },
              { icon: Gamepad2, label: 'تحكم بالأجهزة', color: 'text-[#d4a853]', bg: 'bg-[rgba(212,168,83,0.08)]' },
              { icon: CreditCard, label: 'إدارة الفواتير', color: 'text-[#d4a853]', bg: 'bg-[rgba(212,168,83,0.08)]' },
            ].map((f) => (
              <div
                key={f.label}
                className="glass rounded-xl p-3 text-center card-hover"
              >
                <div className={`w-9 h-9 mx-auto mb-2 rounded-lg ${f.bg} flex items-center justify-center`}>
                  <f.icon className={`w-4 h-4 ${f.color}`} />
                </div>
                <p className="text-[10px] text-[#8a8690]">{f.label}</p>
              </div>
            ))}
          </div>

          <p className="text-center text-[rgba(138,134,144,0.5)] text-xs mt-6 animate-fade-up stagger-5">
            © 2024 Wedding Hall System — All Rights Reserved
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
  { key: 'users', label: 'المستخدمين', icon: Shield, roles: ['admin'] },
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
    <div className="flex flex-col h-full bg-[#0d0d12]">
      {/* Logo Header */}
      <div className="p-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#d4a853] to-[#b8912e] flex items-center justify-center shadow-lg shadow-[rgba(212,168,83,0.15)] shrink-0">
            <CalendarDays className="w-5 h-5 text-[#0a0a0f]" strokeWidth={1.8} />
          </div>
          <div className="flex-1 min-w-0">
            <h2
              className="font-bold text-sm truncate text-[#f5f0e8]"
              style={{ fontFamily: '"Playfair Display", serif' }}
            >
              صالات الأفراح
            </h2>
            <p className="text-xs text-[#8a8690] truncate">{user.name}</p>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-[#8a8690] hover:text-[#f5f0e8] hover:bg-[rgba(255,255,255,0.04)]" onClick={onClose}>
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
            return (
              <button
                key={item.key}
                onClick={() => handleNav(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[rgba(212,168,83,0.1)] text-[#d4a853] border-r-2 border-[#d4a853]'
                    : 'text-[#8a8690] hover:bg-[rgba(212,168,83,0.05)] hover:text-[#f5f0e8]'
                }`}
              >
                <Icon className={`h-[18px] w-[18px] shrink-0 ${isActive ? 'text-[#d4a853]' : ''}`} />
                {item.label}
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
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#d4a853] to-[#b8912e] flex items-center justify-center text-[#0a0a0f] text-xs font-bold shrink-0 shadow-md shadow-[rgba(212,168,83,0.15)]">
            {user.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-[#f5f0e8]">{user.name}</p>
            <span className="inline-block text-[10px] px-1.5 py-0.5 rounded-md bg-[rgba(212,168,83,0.1)] text-[#d4a853] font-medium mt-0.5">
              {ROLE_LABELS[user.role]}
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full mt-1 justify-start gap-2 text-[#8a8690] hover:text-red-400 hover:bg-[rgba(239,68,68,0.06)] h-9 px-3 rounded-lg transition-colors duration-200"
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
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="text-center space-y-4">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 border-2 border-[rgba(212,168,83,0.15)] rounded-full" />
            <div className="absolute inset-0 border-2 border-transparent border-t-[#d4a853] rounded-full animate-spin" />
            <div className="absolute inset-3 border-2 border-transparent border-t-[#b8912e] rounded-full animate-spin" style={{ animationDuration: '0.75s', animationDirection: 'reverse' }} />
          </div>
          <h2
            className="text-lg font-bold text-gold-gradient"
            style={{ fontFamily: '"Playfair Display", serif' }}
          >
            صالات الأفراح
          </h2>
          <p className="text-sm text-[#8a8690]">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginPage />
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <DashboardPage />
      case 'dashboard':
        return <ControlDashboard />
      case 'customers':
        return <CustomerManagement />
      case 'bookings':
        return <BookingManagement />
      case 'billing':
        return <BillingManagement />
      case 'calendar':
        return <CalendarView />
      case 'activity':
        return <ActivityLogPage />
      case 'users':
        return <UserManagement />
      case 'settings':
        return <SettingsPanel />
      case 'profile':
        return <ProfilePage />
      default:
        return <DashboardPage />
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

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:right-0 lg:z-50 lg:flex lg:w-64 lg:flex-col border-l border-[rgba(255,255,255,0.04)]">
        <div className="flex grow flex-col overflow-y-auto bg-[#0d0d12]">
          <SidebarContent />
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="right" className="w-72 p-0 glass-strong border-l border-[rgba(255,255,255,0.04)]">
          <SheetTitle className="sr-only">القائمة الجانبية</SheetTitle>
          <SidebarContent onClose={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="lg:pr-64">
        {/* Header */}
        <header className="sticky top-0 z-40 flex h-14 items-center gap-4 glass border-b border-[rgba(212,168,83,0.1)] px-4 lg:px-6">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-9 w-9 text-[#8a8690] hover:text-[#f5f0e8] hover:bg-[rgba(255,255,255,0.04)]"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Page Title */}
          <h1
            className="text-lg font-semibold text-[#f5f0e8]"
            style={{ fontFamily: '"Playfair Display", serif' }}
          >
            {pageTitle[currentPage] || 'لوحة التحكم'}
          </h1>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Notification Bell */}
          <NotificationBell />

          {/* User Info */}
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className="hidden sm:flex gap-1 text-xs border-[rgba(212,168,83,0.25)] text-[#d4a853] bg-[rgba(212,168,83,0.06)] hover:bg-[rgba(212,168,83,0.1)] transition-colors duration-200"
            >
              {ROLE_LABELS[user?.role || 'viewer']}
            </Badge>
            <button
              onClick={() => setCurrentPage('profile')}
              className="w-9 h-9 rounded-full bg-gradient-to-br from-[#d4a853] to-[#b8912e] flex items-center justify-center text-[#0a0a0f] text-xs font-bold hover:scale-105 transition-all duration-200 shadow-md shadow-[rgba(212,168,83,0.15)]"
            >
              {user?.name?.charAt(0) || 'U'}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6 max-w-7xl mx-auto mesh-bg min-h-[calc(100vh-3.5rem)]">
          {renderPage()}
        </main>
      </div>
    </div>
  )
}
