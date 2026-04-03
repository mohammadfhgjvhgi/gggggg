import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest, hasPermission } from '@/lib/auth'
import { Prisma, PaymentStatus, PaymentMethod } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const sessionUser = getUserFromRequest(request)

    if (!sessionUser) {
      return NextResponse.json({ error: 'غير مصرح بالوصول' }, { status: 401 })
    }

    if (!hasPermission(sessionUser.role, 'payments:read')) {
      return NextResponse.json({ error: 'ليس لديك صلاحية لعرض المدفوعات' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get('bookingId') || ''
    const status = searchParams.get('status') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20')))

    const where: Prisma.PaymentWhereInput = {}

    if (bookingId) {
      where.bookingId = bookingId
    }

    if (status && Object.values(PaymentStatus).includes(status as PaymentStatus)) {
      where.status = status as PaymentStatus
    }

    const [payments, total] = await Promise.all([
      db.payment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          booking: {
            include: {
              customer: {
                select: { id: true, name: true, phone: true },
              },
            },
          },
        },
      }),
      db.payment.count({ where }),
    ])

    return NextResponse.json({
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('List payments error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب قائمة المدفوعات' },
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

    if (!hasPermission(sessionUser.role, 'payments:write')) {
      return NextResponse.json({ error: 'ليس لديك صلاحية لإنشاء دفعة' }, { status: 403 })
    }

    const body = await request.json()
    const { bookingId, amount, method, status, receiptNumber, notes, paidAt } = body

    if (!bookingId || !amount) {
      return NextResponse.json(
        { error: 'رقم الحجز والمبلغ مطلوبان' },
        { status: 400 }
      )
    }

    // Verify booking exists
    const booking = await db.booking.findUnique({ where: { id: bookingId } })
    if (!booking) {
      return NextResponse.json({ error: 'الحجز غير موجود' }, { status: 400 })
    }

    const paymentData: Record<string, unknown> = {
      bookingId,
      amount: parseFloat(amount),
      method: method && Object.values(PaymentMethod).includes(method) ? method : 'cash',
      status: status && Object.values(PaymentStatus).includes(status) ? status : 'pending',
      receiptNumber: receiptNumber || null,
      notes: notes || null,
    }

    if (paidAt) {
      paymentData.paidAt = new Date(paidAt)
    }

    const payment = await db.payment.create({
      data: paymentData,
      include: {
        booking: {
          include: {
            customer: {
              select: { id: true, name: true, phone: true },
            },
          },
        },
      },
    })

    return NextResponse.json({ payment }, { status: 201 })
  } catch (error) {
    console.error('Create payment error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء الدفعة' },
      { status: 500 }
    )
  }
}
