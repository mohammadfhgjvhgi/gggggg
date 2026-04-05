'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  firebaseListen,
  firebaseWrite,
  FIREBASE_PATHS,
  type DoorState,
} from '@/lib/firebase'

export function useFirebaseDoor() {
  const [door, setDoor] = useState<DoorState>({ open: false })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const unsub = firebaseListen(FIREBASE_PATHS.door, (val) => {
      setDoor({ open: val === true })
    })
    return () => unsub()
  }, [])

  const toggle = useCallback(async () => {
    setLoading(true)
    try {
      await firebaseWrite(FIREBASE_PATHS.door, !door.open)
    } catch (error) {
      console.error('Door toggle failed:', error)
    } finally {
      setTimeout(() => setLoading(false), 1000)
    }
  }, [door.open])

  const open = useCallback(async () => {
    setLoading(true)
    try {
      await firebaseWrite(FIREBASE_PATHS.door, true)
    } catch (error) {
      console.error('Door open failed:', error)
    } finally {
      setTimeout(() => setLoading(false), 1000)
    }
  }, [])

  const close = useCallback(async () => {
    setLoading(true)
    try {
      await firebaseWrite(FIREBASE_PATHS.door, false)
    } catch (error) {
      console.error('Door close failed:', error)
    } finally {
      setTimeout(() => setLoading(false), 1000)
    }
  }, [])

  return { door, loading, toggle, open, close }
}
