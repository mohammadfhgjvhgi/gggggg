import bcrypt from 'bcryptjs'
import type { Role } from '@prisma/client'

// ═══════════════════════════════════════
//   صلاحيات الأدوار
// ═══════════════════════════════════════

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'مدير النظام',
  manager: 'مدير',
  employee: 'موظف',
  viewer: 'مشاهد',
}

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  admin: [
    'dashboard:read', 'dashboard:write',
    'control:read', 'control:write',
    'customers:read', 'customers:write', 'customers:delete',
    'bookings:read', 'bookings:write', 'bookings:delete',
    'payments:read', 'payments:write', 'payments:delete',
    'calendar:read', 'calendar:write',
    'activity:read',
    'notifications:read', 'notifications:write',
    'users:read', 'users:write', 'users:delete',
    'settings:read', 'settings:write',
  ],
  manager: [
    'dashboard:read', 'dashboard:write',
    'control:read', 'control:write',
    'customers:read', 'customers:write', 'customers:delete',
    'bookings:read', 'bookings:write', 'bookings:delete',
    'payments:read', 'payments:write', 'payments:delete',
    'calendar:read', 'calendar:write',
    'activity:read',
    'notifications:read', 'notifications:write',
    'settings:read',
  ],
  employee: [
    'control:read', 'control:write',
    'customers:read', 'customers:write',
    'bookings:read', 'bookings:write',
    'notifications:read', 'notifications:write',
  ],
  viewer: [
    'dashboard:read',
    'customers:read',
    'bookings:read',
    'calendar:read',
    'notifications:read',
  ],
}

export function hasPermission(role: Role, permission: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 12)
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash)
}

// ═══════════════════════════════════════
//   التحقق من الجلسة
// ═══════════════════════════════════════

export interface SessionUser {
  id: string
  name: string
  email: string
  role: Role
  phone?: string | null
}

export function createToken(user: SessionUser): string {
  return Buffer.from(JSON.stringify({ ...user, exp: Date.now() + 24 * 60 * 60 * 1000 })).toString('base64')
}

export function verifyToken(token: string): SessionUser | null {
  try {
    const data = JSON.parse(Buffer.from(token, 'base64').toString())
    if (data.exp && data.exp < Date.now()) return null
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role as Role,
      phone: data.phone,
    }
  } catch {
    return null
  }
}

export function getUserFromRequest(request: Request): SessionUser | null {
  const auth = request.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return verifyToken(auth.slice(7))
}
