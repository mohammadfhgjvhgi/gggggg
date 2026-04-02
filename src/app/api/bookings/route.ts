import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest, hasPermission } from '@/lib/auth'
import { Prisma, BookingStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const sessionUser = getUserFromRequest(request)

    if (!sessionUser) {
      return NextResponse.json({ error: 'غير مصرح بالوصول' }, { status: 401 })
    }

    if (!hasPermission(sessionUser.role, 'bookings:read')) {
      return NextResponse.json({ error: 'ليس لديك صلاحية لعرض الحجوزات' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || ''
    const customerId = searchParams.get('customerId') || ''
    const search = searchParams.get('search') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20')))

    const where: Prisma.BookingWhereInput = {}

    if (status && Object.values(BookingStatus).includes(status as BookingStatus)) {
      where.status = status as BookingStatus
    }

    if (customerId) {
      where.customerId = customerId
    }

    if (search) {
      where.OR = [
        { customer: { name: { contains: search } } },
        { customer: { phone: { contains: search } } },
        { eventType: { contains: search } },
        { notes: { contains: search } },
      ]
    }

    const [bookings, total] = await Promise.all([
      db.booking.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { id: true, name: true, phone: true },
          },
          payments: {
            select: { amount: true, status: true },
          },
        },
      }),
      db.booking.count({ where }),
    ])

    const bookingsWithTotals = bookings.map((booking) => {
      const totalPaid = booking.payments
        .filter((p) => p.status !== 'refunded')
        .reduce((sum, p) => sum + p.amount, 0)
      return {
        ...booking,
        totalPaid,
        remainingAmount: Math.max(0, booking.hallPrice - totalPaid),
        paymentCount: booking.payments.length,
      }
    })

    return NextResponse.json({
      bookings: bookingsWithTotals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('List bookings error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب قائمة الحجوزات' },
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

    if (!hasPermission(sessionUser.role, 'bookings:write')) {
      return NextResponse.json({ error: 'ليس لديك صلاحية لإنشاء حجز' }, { status: 403 })
    }

    const body = await request.json()
    const { customerId, eventDate, eventType, guestCount, hallPrice, status, notes } = body

    if (!customerId || !eventDate || !eventType || !guestCount || !hallPrice) {
      return NextResponse.json(
        { error: 'جميع الحقول المطلوبة يجب أن تُملأ' },
        { status: 400 }
      )
    }

    // Verify customer exists
    const customer = await db.customer.findUnique({ where: { id: customerId } })
    if (!customer) {
      return NextResponse.json({ error: 'الزبون غير موجود' }, { status: 400 })
    }

    const booking = await db.booking.create({
      data: {
        customerId,
        eventDate: new Date(eventDate),
        eventType,
        guestCount: parseInt(guestCount),
        hallPrice: parseFloat(hallPrice),
        status: status || 'pending',
        notes: notes || null,
      },
      include: {
        customer: {
          select: { id: true, name: true, phone: true },
        },
      },
    })

    return NextResponse.json({ booking }, { status: 201 })
  } catch (error) {
    console.error('Create booking error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء الحجز' },
      { status: 500 }
    )
  }
}
