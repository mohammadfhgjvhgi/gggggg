import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest, hasPermission } from '@/lib/auth'
import { Prisma } from '@prisma/client'

// GET - list notifications for current user (unread count + list with pagination)
export async function GET(request: NextRequest) {
  try {
    const sessionUser = getUserFromRequest(request)

    if (!sessionUser) {
      return NextResponse.json({ error: 'غير مصرح بالوصول' }, { status: 401 })
    }

    if (!hasPermission(sessionUser.role, 'control:read')) {
      return NextResponse.json({ error: 'ليس لديك صلاحية لعرض الإشعارات' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20')))
    const unreadOnly = searchParams.get('unread') === 'true'

    const where: Prisma.NotificationWhereInput = {
      userId: sessionUser.id,
    }

    if (unreadOnly) {
      where.read = false
    }

    const [notifications, total, unreadCount] = await Promise.all([
      db.notification.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.notification.count({ where }),
      db.notification.count({
        where: { userId: sessionUser.id, read: false },
      }),
    ])

    return NextResponse.json({
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('List notifications error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الإشعارات' },
      { status: 500 }
    )
  }
}

// PUT - mark notification as read / mark all as read
export async function PUT(request: NextRequest) {
  try {
    const sessionUser = getUserFromRequest(request)

    if (!sessionUser) {
      return NextResponse.json({ error: 'غير مصرح بالوصول' }, { status: 401 })
    }

    if (!hasPermission(sessionUser.role, 'control:read')) {
      return NextResponse.json({ error: 'ليس لديك صلاحية لتعديل الإشعارات' }, { status: 403 })
    }

    const body = await request.json()
    const { id, markAll } = body

    if (markAll) {
      await db.notification.updateMany({
        where: { userId: sessionUser.id, read: false },
        data: { read: true },
      })

      return NextResponse.json({ message: 'تم تعليم جميع الإشعارات كمقروءة' })
    }

    if (!id) {
      return NextResponse.json(
        { error: 'معرف الإشعار مطلوب' },
        { status: 400 }
      )
    }

    const notification = await db.notification.findFirst({
      where: { id, userId: sessionUser.id },
    })

    if (!notification) {
      return NextResponse.json(
        { error: 'الإشعار غير موجود' },
        { status: 404 }
      )
    }

    await db.notification.update({
      where: { id },
      data: { read: true },
    })

    return NextResponse.json({ message: 'تم تعليم الإشعار كمقروء' })
  } catch (error) {
    console.error('Update notification error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تعديل الإشعار' },
      { status: 500 }
    )
  }
}
