import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest, hasPermission, hashPassword } from '@/lib/auth'
import { Role } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const sessionUser = getUserFromRequest(request)

    if (!sessionUser) {
      return NextResponse.json({ error: 'غير مصرح بالوصول' }, { status: 401 })
    }

    if (!hasPermission(sessionUser.role, 'users:read')) {
      return NextResponse.json({ error: 'ليس لديك صلاحية لعرض المستخدمين' }, { status: 403 })
    }

    const users = await db.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('List users error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب قائمة المستخدمين' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = getUserFromRequest(request)

    if (!sessionUser) {
      return NextResponse.json({ error: 'غير مصرح بالوصول' }, { status: 401 })
    }

    if (!hasPermission(sessionUser.role, 'users:write')) {
      return NextResponse.json({ error: 'ليس لديك صلاحية لإنشاء مستخدم' }, { status: 403 })
    }

    const body = await request.json()
    const { name, email, password, role, phone } = body

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'الاسم والبريد الإلكتروني وكلمة المرور مطلوبة' },
        { status: 400 }
      )
    }

    if (!Object.values(Role).includes(role)) {
      return NextResponse.json(
        { error: 'الدور غير صالح' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existing = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني مستخدم بالفعل' },
        { status: 400 }
      )
    }

    const user = await db.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        password: hashPassword(password),
        role,
        phone: phone || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        active: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء المستخدم' },
      { status: 500 }
    )
  }
}
