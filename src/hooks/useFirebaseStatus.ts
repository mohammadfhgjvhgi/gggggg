'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  firebaseListen,
  firebaseWrite,
  FIREBASE_PATHS,
  type Esp32Status,
} from '@/lib/firebase'

export function useFirebaseStatus() {
  const [status, setStatus] = useState<Esp32Status>({ online: false, lastSeen: 0 })

  useEffect(() => {
    const unsubOnline = firebaseListen(FIREBASE_PATHS.status.online, (val) => {
      setStatus(prev => ({ ...prev, online: val === true }))
    })

    const unsubLastSeen = firebaseListen(FIREBASE_PATHS.status.lastSeen, (val) => {
      setStatus(prev => ({ ...prev, lastSeen: typeof val === 'number' ? val : 0 }))
    })

    return () => {
      unsubOnline()
      unsubLastSeen()
    }
  }, [])

  return status
}
