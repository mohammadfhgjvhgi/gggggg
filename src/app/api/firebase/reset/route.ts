import { NextResponse, NextRequest } from 'next/server'
import { getUserFromRequest, hasPermission } from '@/lib/auth'
import { logActivity } from '@/lib/activity'

// POST - Reset all devices
export async function POST(request: NextRequest) {
  try {
    const sessionUser = getUserFromRequest()

    if (!sessionUser) {
      return NextResponse.json({ error: 'غير مصرح بالوصول' }, { status: 401 })
    }

    if (!hasPermission(sessionUser.role, 'control:write')) {
      return NextResponse.json({ error: 'ليس لديك صلاحية للتحكم بالأجهزة' }, { status: 403 })
    }

    const { resetAll } = await request.json()

    if (!resetAll) {
      return NextResponse.json(
        { error: 'معلمة resetAll مطلوبة' },
        { status: 400 }
      )
    }

    // Import Firebase dynamically
    const { resetAllDevices } = await import('@/lib/firebase')
    await resetAllDevices()

    // Log activity
    await logActivity(
      sessionUser.id,
      'reset_devices',
      `${sessionUser.name} قام بإعادة تعيين جميع الأجهزة`
    )

    return NextResponse.json({
      message: 'تم إعادة تعيين جميع الأجهزة بنجاح',
      devices: ['gate', 'door', 'seat', 'lights', 'mp3'],
    })
  } catch (error) {
    console.error('Firebase reset error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إعادة تعيين الأجهزة' },
      { status: 500 }
    )
  }
}
