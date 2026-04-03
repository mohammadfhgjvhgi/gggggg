import { db } from '@/lib/db'

// Log an activity
export async function logActivity(userId: string | null | undefined, action: string, details: string) {
  try {
    await db.activityLog.create({
      data: { userId: userId || null, action, details }
    })
  } catch (error) {
    console.error('Failed to log activity:', error)
  }
}

// Create a notification
export async function createNotification(data: { userId?: string | null; title: string; message: string; type?: 'info' | 'warning' | 'error' | 'success'; link?: string }) {
  try {
    await db.notification.create({
      data: {
        userId: data.userId || null,
        title: data.title,
        message: data.message,
        type: data.type || 'info',
        link: data.link || null,
      }
    })
  } catch (error) {
    console.error('Failed to create notification:', error)
  }
}

// Notify all admins
export async function notifyAdmins(title: string, message: string, type?: 'info' | 'warning' | 'error' | 'success') {
  try {
    const admins = await db.user.findMany({ where: { role: 'admin', active: true }, select: { id: true } })
    await Promise.all(admins.map(a => createNotification({ userId: a.id, title, message, type })))
  } catch (error) {
    console.error('Failed to notify admins:', error)
  }
}
