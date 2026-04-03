import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest, hasPermission } from '@/lib/auth'
import { BookingStatus } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = getUserFromRequest(request)

    if (!sessionUser) {
      return NextResponse.json({ error: 'غير مصرح بالوصول' }, { status: 401 })
    }

    if (!hasPermission(sessionUser.role, 'bookings:read')) {
      return NextResponse.json({ error: 'ليس لديك صلاحية لعرض بيانات الحجز' }, { status: 403 })
    }

    const { id } = await params

    const booking = await db.booking.findUnique({
      where: { id },
      include: {
        customer: true,
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'الحجز غير موجود' }, { status: 404 })
    }

    const totalPaid = booking.payments
      .filter((p) => p.status !== 'refunded')
      .reduce((sum, p) => sum + p.amount, 0)

    return NextResponse.json({
      booking: {
        ...booking,
        totalPaid,
        remainingAmount: Math.max(0, booking.hallPrice - totalPaid),
      },
    })
  } catch (error) {
    console.error('Get booking error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب بيانات الحجز' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = getUserFromRequest(request)

    if (!sessionUser) {
      return NextResponse.json({ error: 'غير مصرح بالوصول' }, { status: 401 })
    }

    if (!hasPermission(sessionUser.role, 'bookings:write')) {
      return NextResponse.json({ error: 'ليس لديك صلاحية لتعديل الحجز' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { eventDate, eventType, guestCount, hallPrice, status, notes, customerId } = body

    const existing = await db.booking.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'الحجز غير موجود' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (eventDate !== undefined) updateData.eventDate = new Date(eventDate)
    if (eventType !== undefined) updateData.eventType = eventType
    if (guestCount !== undefined) updateData.guestCount = parseInt(guestCount)
    if (hallPrice !== undefined) updateData.hallPrice = parseFloat(hallPrice)
    if (status !== undefined && Object.values(BookingStatus).includes(status)) {
      updateData.status = status
    }
    if (notes !== undefined) updateData.notes = notes || null
    if (customerId !== undefined) {
      const customer = await db.customer.findUnique({ where: { id: customerId } })
      if (!customer) {
        return NextResponse.json({ error: 'الزبون غير موجود' }, { status: 400 })
      }
      updateData.customerId = customerId
    }

    const booking = await db.booking.update({
      where: { id },
      data: updateData,
      include: {
        customer: {
          select: { id: true, name: true, phone: true },
        },
      },
    })

    return NextResponse.json({ booking })
  } catch (error) {
    console.error('Update booking error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحديث الحجز' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = getUserFromRequest(request)

    if (!sessionUser) {
      return NextResponse.json({ error: 'غير مصرح بالوصول' }, { status: 401 })
    }

    if (!hasPermission(sessionUser.role, 'bookings:delete')) {
      return NextResponse.json({ error: 'ليس لديك صلاحية لحذف الحجز' }, { status: 403 })
    }

    const { id } = await params

    const existing = await db.booking.findUnique({
      where: { id },
      include: { _count: { select: { payments: true } } },
    })

    if (!existing) {
      return NextResponse.json({ error: 'الحجز غير موجود' }, { status: 404 })
    }

    if (existing._count.payments > 0) {
      return NextResponse.json(
        { error: 'لا يمكن حذف حجز لديه مدفوعات' },
        { status: 400 }
      )
    }

    await db.booking.delete({ where: { id } })

    return NextResponse.json({ message: 'تم حذف الحجز بنجاح' })
  } catch (error) {
    console.error('Delete booking error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف الحجز' },
      { status: 500 }
    )
  }
}
