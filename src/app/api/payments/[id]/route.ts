import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest, hasPermission } from '@/lib/auth'
import { PaymentStatus, PaymentMethod } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = getUserFromRequest(request)

    if (!sessionUser) {
      return NextResponse.json({ error: 'غير مصرح بالوصول' }, { status: 401 })
    }

    if (!hasPermission(sessionUser.role, 'payments:read')) {
      return NextResponse.json({ error: 'ليس لديك صلاحية لعرض بيانات الدفعة' }, { status: 403 })
    }

    const { id } = await params

    const payment = await db.payment.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            customer: true,
          },
        },
      },
    })

    if (!payment) {
      return NextResponse.json({ error: 'الدفعة غير موجودة' }, { status: 404 })
    }

    return NextResponse.json({ payment })
  } catch (error) {
    console.error('Get payment error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب بيانات الدفعة' },
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

    if (!hasPermission(sessionUser.role, 'payments:write')) {
      return NextResponse.json({ error: 'ليس لديك صلاحية لتعديل الدفعة' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { amount, method, status, receiptNumber, notes, paidAt } = body

    const existing = await db.payment.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'الدفعة غير موجودة' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (amount !== undefined) updateData.amount = parseFloat(amount)
    if (method !== undefined && Object.values(PaymentMethod).includes(method)) {
      updateData.method = method
    }
    if (status !== undefined && Object.values(PaymentStatus).includes(status)) {
      updateData.status = status
    }
    if (receiptNumber !== undefined) updateData.receiptNumber = receiptNumber || null
    if (notes !== undefined) updateData.notes = notes || null
    if (paidAt !== undefined) updateData.paidAt = new Date(paidAt)

    const payment = await db.payment.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({ payment })
  } catch (error) {
    console.error('Update payment error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحديث الدفعة' },
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

    if (!hasPermission(sessionUser.role, 'payments:delete')) {
      return NextResponse.json({ error: 'ليس لديك صلاحية لحذف الدفعة' }, { status: 403 })
    }

    const { id } = await params

    const existing = await db.payment.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'الدفعة غير موجودة' }, { status: 404 })
    }

    await db.payment.delete({ where: { id } })

    return NextResponse.json({ message: 'تم حذف الدفعة بنجاح' })
  } catch (error) {
    console.error('Delete payment error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف الدفعة' },
      { status: 500 }
    )
  }
}
