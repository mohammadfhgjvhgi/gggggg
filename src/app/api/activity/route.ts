import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest, hasPermission } from '@/lib/auth'
import { Prisma } from '@prisma/client'

// GET - list activity logs with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const sessionUser = getUserFromRequest(request)

    if (!sessionUser) {
      return NextResponse.json({ error: 'غير مصرح بالوصول' }, { status: 401 })
    }

    if (!hasPermission(sessionUser.role, 'control:write')) {
      return NextResponse.json({ error: 'ليس لديك صلاحية لعرض سجل النشاطات' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20')))
    const userId = searchParams.get('userId')
    const action = searchParams.get('action')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: Prisma.ActivityLogWhereInput = {}

    if (userId) {
      where.userId = userId
    }

    if (action) {
      where.action = { contains: action }
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        // Include the full end date by setting to end of day
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        where.createdAt.lte = end
      }
    }

    const [logs, total] = await Promise.all([
      db.activityLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, role: true },
          },
        },
      }),
      db.activityLog.count({ where }),
    ])

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('List activity logs error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب سجل النشاطات' },
      { status: 500 }
    )
  }
}
