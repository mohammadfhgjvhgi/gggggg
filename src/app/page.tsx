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
} from 'lucide-react'

import CustomerManagement from '@/components/customer-management'
import BookingManagement from '@/components/booking-management'
import BillingManagement from '@/components/billing-management'
import UserManagement from '@/components/user-management'
import SettingsPanel from '@/components/settings-panel'
import ControlDashboard from '@/components/control-dashboard'
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
    color: 'from-amber-500 to-orange-600',
    borderColor: 'border-amber-500/40 hover:border-amber-500/70 hover:bg-amber-500/10',
    textColor: 'text-amber-300',
    glowColor: 'shadow-amber-500/20',
  },
  {
    role: 'manager' as const,
    email: 'manager@wedding.com',
    password: 'manager123',
    label: 'مدير',
    icon: UserCog,
    color: 'from-purple-500 to-violet-600',
    borderColor: 'border-purple-500/40 hover:border-purple-500/70 hover:bg-purple-500/10',
    textColor: 'text-purple-300',
    glowColor: 'shadow-purple-500/20',
  },
  {
    role: 'employee' as const,
    email: 'employee@wedding.com',
    password: 'emp123',
    label: 'موظف',
    icon: UserCheck,
    color: 'from-cyan-500 to-blue-600',
    borderColor: 'border-cyan-500/40 hover:border-cyan-500/70 hover:bg-cyan-500/10',
    textColor: 'text-cyan-300',
    glowColor: 'shadow-cyan-500/20',
  },
  {
    role: 'viewer' as const,
    email: 'viewer@wedding.com',
    password: 'view123',
    label: 'مشاهد',
    icon: Eye,
    color: 'from-emerald-500 to-green-600',
    borderColor: 'border-emerald-500/40 hover:border-emerald-500/70 hover:bg-emerald-500/10',
    textColor: 'text-emerald-300',
    glowColor: 'shadow-emerald-500/20',
  },
]

// ═══════════════════════════════════════════════════
//   مكون تسجيل الدخول - نفس ستايل الكراج الذكي
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
    <div dir="rtl" className="min-h-screen relative overflow-hidden bg-[#0a0a0f]">
      {/* خلفية متحركة */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/8 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-orange-500/6 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-500/4 rounded-full blur-[150px]" />
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">

          {/* الشعار */}
          <div className="text-center mb-8" style={{ animation: 'slideUp 0.5s ease-out' }}>
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-600 rounded-3xl shadow-2xl shadow-amber-500/30 mb-4 relative">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-600 animate-pulse opacity-30 blur-sm" />
              <CalendarDays className="w-12 h-12 text-white relative z-10" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-l from-amber-300 via-yellow-200 to-orange-300 bg-clip-text text-transparent mb-2">
              صالات الأفراح
            </h1>
            <p className="text-slate-500 text-sm">Wedding Hall Management System</p>
          </div>

          {/* بطاقة تسجيل الدخول */}
          <div
            className="rounded-3xl p-8 border border-white/[0.06]"
            style={{
              animation: 'slideUp 0.5s ease-out 0.1s both',
              background: 'rgba(20, 20, 30, 0.7)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-1">تسجيل الدخول</h2>
              <p className="text-slate-500 text-sm">أدخل بياناتك أو استخدم الدخول السريع</p>
            </div>

            {/* نموذج تسجيل الدخول */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-sm font-medium mb-2">
                  البريد الإلكتروني
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@wedding.com"
                  dir="ltr"
                  className="text-left bg-white/[0.04] border-white/[0.08] rounded-xl h-11 text-white placeholder-slate-600 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm font-medium mb-2">
                  كلمة المرور
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  dir="ltr"
                  className="text-left bg-white/[0.04] border-white/[0.08] rounded-xl h-11 text-white placeholder-slate-600 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-l from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold h-12 rounded-xl shadow-lg shadow-amber-600/20 transition-all hover:shadow-xl hover:shadow-amber-600/30 hover:-translate-y-0.5 active:translate-y-0"
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

            {/* فاصل */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/[0.06]" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 text-xs text-slate-600 bg-transparent">أو</span>
              </div>
            </div>

            {/* الدخول السريع */}
            <div>
              <p className="text-center text-slate-500 text-sm mb-4 flex items-center justify-center gap-2">
                <Sparkles className="w-3.5 h-3.5" />
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
                      className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-300 group ${user.borderColor} ${isLoading ? 'opacity-80 scale-95' : 'hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98]'}`}
                    >
                      {isLoading && (
                        <div className="absolute inset-0 rounded-2xl bg-white/[0.03] flex items-center justify-center">
                          <Loader2 className="w-5 h-5 animate-spin text-white/60" />
                        </div>
                      )}
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${user.color} flex items-center justify-center shadow-lg ${user.glowColor} group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <span className={`text-xs font-semibold ${user.textColor}`}>
                        {user.label}
                      </span>
                      <span className="text-[10px] text-slate-600 font-mono" dir="ltr">
                        {user.email}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* مميزات */}
          <div
            className="grid grid-cols-3 gap-3 mt-6"
            style={{ animation: 'slideUp 0.5s ease-out 0.2s both' }}
          >
            {[
              { icon: Shield, label: 'نظام صلاحيات', color: 'text-amber-400', bg: 'bg-amber-500/10' },
              { icon: Gamepad2, label: 'تحكم بالأجهزة', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
              { icon: CreditCard, label: 'إدارة الفواتير', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            ].map((f) => (
              <div
                key={f.label}
                className="rounded-xl p-3 text-center border border-white/[0.04]"
                style={{ background: 'rgba(20,20,30,0.5)', backdropFilter: 'blur(10px)' }}
              >
                <div className={`w-9 h-9 mx-auto mb-2 rounded-lg ${f.bg} flex items-center justify-center`}>
                  <f.icon className={`w-4.5 h-4.5 ${f.color}`} />
                </div>
                <p className="text-[10px] text-slate-500">{f.label}</p>
              </div>
            ))}
          </div>

          <p className="text-center text-slate-700 text-xs mt-6">
            © 2024 Wedding Hall System — All Rights Reserved
          </p>
        </div>
      </div>

      {/* أنيميشن مخصص */}
      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

// ═══════════════════════════════════════
//   عناصر القائمة الجانبية
// ═══════════════════════════════════════

interface NavItem {
  key: string
  label: string
  icon: React.ElementType
  roles: string[]
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: 'التحكم بالأجهزة', icon: Gamepad2, roles: ['admin', 'manager', 'employee', 'viewer'] },
  { key: 'customers', label: 'الزبائن', icon: Users, roles: ['admin', 'manager', 'employee', 'viewer'] },
  { key: 'bookings', label: 'الحجوزات', icon: CalendarDays, roles: ['admin', 'manager', 'employee', 'viewer'] },
  { key: 'billing', label: 'الفواتير', icon: CreditCard, roles: ['admin', 'manager', 'employee', 'viewer'] },
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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
            <CalendarDays className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-sm truncate">صالات الأفراح</h2>
            <p className="text-xs text-muted-foreground truncate">{user.name}</p>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

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
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/25'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="h-4.5 w-4.5 shrink-0" />
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* Permissions Card */}
        <div className="mt-4 px-1">
          <Separator className="mb-3" />
          {user && <PermissionsCard role={user.role} />}
        </div>
      </ScrollArea>

      {/* Footer / User */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {user.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{ROLE_LABELS[user.role]}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full mt-1 justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-500/10 h-9 px-3"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          تسجيل الخروج
        </Button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════
//   الصفحة الرئيسية
// ═══════════════════════════════════════

export default function Home() {
  const { isAuthenticated, loading, user, checkAuth } = useAuthStore()
  const { currentPage, sidebarOpen, setSidebarOpen } = useAppStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="text-center space-y-4">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 border-4 border-amber-500/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-transparent border-t-amber-500 rounded-full animate-spin" />
            <div className="absolute inset-3 border-4 border-transparent border-t-orange-500 rounded-full animate-spin" style={{ animationDuration: '0.75s', animationDirection: 'reverse' }} />
          </div>
          <h2 className="text-lg font-bold bg-gradient-to-l from-amber-300 to-orange-300 bg-clip-text text-transparent">
            صالات الأفراح
          </h2>
          <p className="text-sm text-slate-600">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginPage />
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <ControlDashboard />
      case 'customers':
        return <CustomerManagement />
      case 'bookings':
        return <BookingManagement />
      case 'billing':
        return <BillingManagement />
      case 'users':
        return <UserManagement />
      case 'settings':
        return <SettingsPanel />
      default:
        return <ControlDashboard />
    }
  }

  const pageTitle: Record<string, string> = {
    dashboard: 'لوحة التحكم بالأجهزة',
    customers: 'إدارة الزبائن',
    bookings: 'إدارة الحجوزات',
    billing: 'إدارة الفواتير والمدفوعات',
    users: 'إدارة المستخدمين',
    settings: 'الإعدادات',
  }

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:right-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-l border-border bg-card py-4">
          <SidebarContent />
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="right" className="w-72 p-0">
          <SheetTitle className="sr-only">القائمة الجانبية</SheetTitle>
          <SidebarContent onClose={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="lg:pr-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border bg-card/80 backdrop-blur-sm px-4 lg:px-6">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-9 w-9"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Page Title */}
          <h1 className="text-lg font-semibold">
            {pageTitle[currentPage] || 'لوحة التحكم'}
          </h1>

          {/* Spacer */}
          <div className="flex-1" />

          {/* User Info */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="hidden sm:flex gap-1 text-xs">
              {ROLE_LABELS[user?.role || 'viewer']}
            </Badge>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.charAt(0) || 'U'}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6 max-w-7xl mx-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  )
}
