import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest, hasPermission } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = getUserFromRequest(request)

    if (!sessionUser) {
      return NextResponse.json({ error: 'غير مصرح بالوصول' }, { status: 401 })
    }

    if (!hasPermission(sessionUser.role, 'customers:read')) {
      return NextResponse.json({ error: 'ليس لديك صلاحية لعرض بيانات الزبون' }, { status: 403 })
    }

    const { id } = await params

    const customer = await db.customer.findUnique({
      where: { id },
      include: {
        _count: { select: { bookings: true } },
        bookings: {
          orderBy: { eventDate: 'desc' },
          include: {
            _count: { select: { payments: true } },
          },
        },
      },
    })

    if (!customer) {
      return NextResponse.json({ error: 'الزبون غير موجود' }, { status: 404 })
    }

    return NextResponse.json({ customer })
  } catch (error) {
    console.error('Get customer error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب بيانات الزبون' },
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

    if (!hasPermission(sessionUser.role, 'customers:write')) {
      return NextResponse.json({ error: 'ليس لديك صلاحية لتعديل بيانات الزبون' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, phone, email, notes } = body

    const existing = await db.customer.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'الزبون غير موجود' }, { status: 404 })
    }

    const customer = await db.customer.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        phone: phone ?? existing.phone,
        email: email !== undefined ? email || null : existing.email,
        notes: notes !== undefined ? notes || null : existing.notes,
      },
    })

    return NextResponse.json({ customer })
  } catch (error) {
    console.error('Update customer error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحديث بيانات الزبون' },
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

    if (!hasPermission(sessionUser.role, 'customers:delete')) {
      return NextResponse.json({ error: 'ليس لديك صلاحية لحذف الزبون' }, { status: 403 })
    }

    const { id } = await params

    const existing = await db.customer.findUnique({
      where: { id },
      include: { _count: { select: { bookings: true } } },
    })

    if (!existing) {
      return NextResponse.json({ error: 'الزبون غير موجود' }, { status: 404 })
    }

    if (existing._count.bookings > 0) {
      return NextResponse.json(
        { error: 'لا يمكن حذف زبون لديه حجوزات' },
        { status: 400 }
      )
    }

    await db.customer.delete({ where: { id } })

    return NextResponse.json({ message: 'تم حذف الزبون بنجاح' })
  } catch (error) {
    console.error('Delete customer error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف الزبون' },
      { status: 500 }
    )
  }
}
