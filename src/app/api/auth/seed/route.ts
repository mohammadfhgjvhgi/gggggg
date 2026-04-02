import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

export async function POST() {
  try {
    const existingAdmin = await db.user.findUnique({
      where: { email: 'admin@wedding.com' },
    })

    if (existingAdmin) {
      return NextResponse.json({
        message: 'مدير النظام موجود بالفعل',
        user: {
          id: existingAdmin.id,
          name: existingAdmin.name,
          email: existingAdmin.email,
          role: existingAdmin.role,
        },
      })
    }

    const admin = await db.user.create({
      data: {
        name: 'مدير النظام',
        email: 'admin@wedding.com',
        password: hashPassword('admin123'),
        role: 'admin',
        phone: '0500000000',
      },
    })

    return NextResponse.json({
      message: 'تم إنشاء مدير النظام بنجاح',
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    })
  } catch (error) {
    console.error('Seed admin error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء مدير النظام' },
      { status: 500 }
    )
  }
}
