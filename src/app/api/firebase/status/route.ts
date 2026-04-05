import { NextResponse } from 'next/server'
import { getUserFromRequest, hasPermission } from '@/lib/auth'

// GET - Firebase connection status
export async function GET() {
  try {
    const sessionUser = getUserFromRequest()

    if (!sessionUser) {
      return NextResponse.json({ error: 'غير مصرح بالوصول' }, { status: 401 })
    }

    if (!hasPermission(sessionUser.role, 'control:read')) {
      return NextResponse.json({ error: 'ليس لديك صلاحية' }, { status: 403 })
    }

    // Import Firebase dynamically to avoid server-side issues
    const { getFirebaseConfig, testConnection } = await import('@/lib/firebase')
    const config = getFirebaseConfig()
    const hasConfig = !!(config.apiKey && config.databaseURL)

    return NextResponse.json({
      configured: hasConfig,
      config: hasConfig ? {
        projectId: config.projectId,
        databaseURL: config.databaseURL,
        authDomain: config.authDomain,
      } : null,
    })
  } catch (error) {
    console.error('Firebase status error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء التحقق من حالة Firebase' },
      { status: 500 }
    )
  }
}
