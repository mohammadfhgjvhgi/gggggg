'use client'

import { Badge } from '@/components/ui/badge'
import { ROLE_LABELS } from '@/lib/auth'
import type { Role } from '@/store/auth-store'
import { Eye, ShieldCheck, ShieldAlert, Lock, Info } from 'lucide-react'

// ═══════════════════════════════════════════════════
//   تفاصيل الصلاحيات لكل دور
// ═══════════════════════════════════════════════════

interface PermissionDetail {
  key: string
  label: string
  read: Role[]
  write: Role[]
  delete: Role[]
}

const PERMISSIONS_TABLE: PermissionDetail[] = [
  {
    key: 'control',
    label: 'التحكم بالأجهزة',
    read: ['admin', 'manager', 'employee', 'viewer'],
    write: ['admin', 'manager', 'employee'],
    delete: [],
  },
  {
    key: 'customers',
    label: 'الزبائن',
    read: ['admin', 'manager', 'employee', 'viewer'],
    write: ['admin', 'manager', 'employee'],
    delete: ['admin', 'manager'],
  },
  {
    key: 'bookings',
    label: 'الحجوزات',
    read: ['admin', 'manager', 'employee', 'viewer'],
    write: ['admin', 'manager', 'employee'],
    delete: ['admin', 'manager'],
  },
  {
    key: 'payments',
    label: 'المدفوعات',
    read: ['admin', 'manager', 'employee', 'viewer'],
    write: ['admin', 'manager'],
    delete: ['admin', 'manager'],
  },
  {
    key: 'users',
    label: 'المستخدمين',
    read: ['admin'],
    write: ['admin'],
    delete: ['admin'],
  },
  {
    key: 'settings',
    label: 'الإعدادات',
    read: ['admin', 'manager', 'employee', 'viewer'],
    write: ['admin'],
    delete: [],
  },
]

// ═══════════════════════════════════════════════════
//   بانر الصلاحيات المحدود
// ═══════════════════════════════════════════════════

export function ReadOnlyBanner({ message }: { message?: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
        <Eye className="h-4 w-4 text-amber-600" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
          وضع العرض فقط
        </p>
        <p className="text-xs text-amber-600/80 dark:text-amber-500/70">
          {message || 'ليس لديك صلاحية التعديل أو الحذف في هذه الصفحة. يمكنك فقط عرض البيانات.'}
        </p>
      </div>
      <Badge variant="outline" className="shrink-0 border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px]">
        <Lock className="h-3 w-3 ml-1" />
        مقيد
      </Badge>
    </div>
  )
}

// ═══════════════════════════════════════════════════
//   بانر صلاحيات جزئية
// ═══════════════════════════════════════════════════

export function PartialPermissionBanner({ canWrite, canDelete, resource }: { canWrite: boolean; canDelete: boolean; resource: string }) {
  const restrictions: string[] = []
  if (!canWrite) restrictions.push('الإضافة والتعديل')
  if (!canDelete) restrictions.push('الحذف')

  if (restrictions.length === 0) return null

  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10">
        <Info className="h-4 w-4 text-blue-600" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">
          صلاحيات محدودة
        </p>
        <p className="text-xs text-blue-600/80 dark:text-blue-500/70">
          {resource}: لا يمكنك {restrictions.join(' و ')}
        </p>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════
//   بطاقة ملخص الصلاحيات للدور الحالي
// ═══════════════════════════════════════════════════

export function PermissionsCard({ role }: { role: Role }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <ShieldCheck className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-semibold text-muted-foreground">صلاحياتي</span>
      </div>
      <div className="space-y-1">
        {PERMISSIONS_TABLE.map((perm) => {
          const canRead = perm.read.includes(role)
          const canWrite = perm.write.includes(role)
          const canDel = perm.delete.includes(role)

          if (!canRead) return null

          return (
            <div key={perm.key} className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors">
              <span className="text-xs text-muted-foreground">{perm.label}</span>
              <div className="flex items-center gap-1">
                {canRead && (
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
                    قراءة
                  </Badge>
                )}
                {canWrite && (
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20">
                    تعديل
                  </Badge>
                )}
                {canDel && (
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20">
                    حذف
                  </Badge>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════
//   مساعد لتحديد الصلاحيات حسب الدور
// ═══════════════════════════════════════════════════

export function usePermissions() {
  function canRead(role: Role | undefined, resource: string): boolean {
    if (!role) return false
    const perm = PERMISSIONS_TABLE.find((p) => p.key === resource)
    return perm?.read.includes(role) ?? false
  }

  function canWrite(role: Role | undefined, resource: string): boolean {
    if (!role) return false
    const perm = PERMISSIONS_TABLE.find((p) => p.key === resource)
    return perm?.write.includes(role) ?? false
  }

  function canDelete(role: Role | undefined, resource: string): boolean {
    if (!role) return false
    const perm = PERMISSIONS_TABLE.find((p) => p.key === resource)
    return perm?.delete.includes(role) ?? false
  }

  function isReadOnly(role: Role | undefined, resource: string): boolean {
    return canRead(role, resource) && !canWrite(role, resource)
  }

  function hasAnyAction(role: Role | undefined, resource: string): boolean {
    return canWrite(role, resource) || canDelete(role, resource)
  }

  return { canRead, canWrite, canDelete, isReadOnly, hasAnyAction }
}
