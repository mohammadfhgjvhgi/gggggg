import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest, hasPermission } from '@/lib/auth'

// GET - Dashboard stats
export async function GET(request: NextRequest) {
  try {
    const sessionUser = getUserFromRequest(request)

    if (!sessionUser) {
      return NextResponse.json({ error: 'غير مصرح بالوصول' }, { status: 401 })
    }

    if (!hasPermission(sessionUser.role, 'control:read')) {
      return NextResponse.json({ error: 'ليس لديك صلاحية لعرض لوحة التحكم' }, { status: 403 })
    }

    // Date calculations
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    const nextWeek = new Date(now)
    nextWeek.setDate(nextWeek.getDate() + 7)
    nextWeek.setHours(23, 59, 59, 999)

    // Revenue chart: last 6 months data
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    const paymentsForChart = await db.payment.findMany({
      where: {
        paidAt: { gte: sixMonthsAgo },
        status: { in: ['paid', 'partial'] },
      },
      select: { amount: true, paidAt: true },
    })

    // Group payments by month
    const revenueByMonth: Record<string, number> = {}
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      revenueByMonth[monthKey] = 0
    }

    const arabicMonths = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
    ]

    for (const p of paymentsForChart) {
      const monthKey = `${p.paidAt.getFullYear()}-${String(p.paidAt.getMonth() + 1).padStart(2, '0')}`
      if (revenueByMonth[monthKey] !== undefined) {
        revenueByMonth[monthKey] += p.amount
      }
    }

    const revenueChart = Object.entries(revenueByMonth).map(([key, total]) => {
      const [year, month] = key.split('-')
      return {
        month: arabicMonths[parseInt(month) - 1],
        year,
        total: Math.round(total * 100) / 100,
      }
    })

    // Run all queries in parallel
    const [
      totalCustomers,
      monthlyBookings,
      monthlyRevenueResult,
      upcomingBookingsCount,
      recentPayments,
      upcomingList,
    ] = await Promise.all([
      // Total customers
      db.customer.count(),

      // Monthly bookings (bookings created this month)
      db.booking.count({
        where: {
          createdAt: { gte: startOfMonth, lte: endOfMonth },
        },
      }),

      // Monthly revenue (sum of paid/partial payments this month)
      db.payment.aggregate({
        where: {
          paidAt: { gte: startOfMonth, lte: endOfMonth },
          status: { in: ['paid', 'partial'] },
        },
        _sum: { amount: true },
      }),

      // Upcoming bookings (next 7 days, non-cancelled)
      db.booking.count({
        where: {
          eventDate: { gte: now, lte: nextWeek },
          status: { not: 'cancelled' },
        },
      }),

      // Recent 5 payments
      db.payment.findMany({
        take: 5,
        orderBy: { paidAt: 'desc' },
        include: {
          booking: {
            include: {
              customer: {
                select: { name: true },
              },
            },
          },
        },
      }),

      // Upcoming bookings list with details
      db.booking.findMany({
        where: {
          eventDate: { gte: now, lte: nextWeek },
          status: { not: 'cancelled' },
        },
        orderBy: { eventDate: 'asc' },
        include: {
          customer: {
            select: { name: true, phone: true },
          },
          _count: {
            select: { payments: true },
          },
        },
      }),
    ])

    return NextResponse.json({
      totalCustomers,
      monthlyBookings,
      monthlyRevenue: monthlyRevenueResult._sum.amount || 0,
      upcomingBookings: upcomingBookingsCount,
      recentPayments: recentPayments.map((p) => ({
        id: p.id,
        amount: p.amount,
        method: p.method,
        status: p.status,
        paidAt: p.paidAt,
        customerName: p.booking.customer.name,
      })),
      upcomingList: upcomingList.map((b) => ({
        id: b.id,
        eventDate: b.eventDate,
        eventType: b.eventType,
        guestCount: b.guestCount,
        hallPrice: b.hallPrice,
        status: b.status,
        customerName: b.customer.name,
        customerPhone: b.customer.phone,
        paymentsCount: b._count.payments,
      })),
      revenueChart,
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب إحصائيات لوحة التحكم' },
      { status: 500 }
    )
  }
}
