import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const sessionUser = getUserFromRequest(request)

    if (!sessionUser) {
      return NextResponse.json(
        { error: 'غير مصرح بالوصول' },
        { status: 401 }
      )
    }

    return NextResponse.json({ user: sessionUser })
  } catch (error) {
    console.error('Get me error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب بيانات المستخدم' },
      { status: 500 }
    )
  }
}
