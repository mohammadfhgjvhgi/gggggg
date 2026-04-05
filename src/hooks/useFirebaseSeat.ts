'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  firebaseListen,
  firebaseWrite,
  FIREBASE_PATHS,
  type SeatState,
} from '@/lib/firebase'

export function useFirebaseSeat() {
  const [seat, setSeat] = useState<SeatState>({ active: false })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const unsub = firebaseListen(FIREBASE_PATHS.seat, (val) => {
      setSeat({ active: val === true })
    })
    return () => unsub()
  }, [])

  const toggle = useCallback(async () => {
    setLoading(true)
    try {
      await firebaseWrite(FIREBASE_PATHS.seat, !seat.active)
    } catch (error) {
      console.error('Seat toggle failed:', error)
    } finally {
      setTimeout(() => setLoading(false), 1000)
    }
  }, [seat.active])

  const activate = useCallback(async () => {
    setLoading(true)
    try {
      await firebaseWrite(FIREBASE_PATHS.seat, true)
    } catch (error) {
      console.error('Seat activate failed:', error)
    } finally {
      setTimeout(() => setLoading(false), 1000)
    }
  }, [])

  const reset = useCallback(async () => {
    setLoading(true)
    try {
      await firebaseWrite(FIREBASE_PATHS.seat, false)
    } catch (error) {
      console.error('Seat reset failed:', error)
    } finally {
      setTimeout(() => setLoading(false), 1000)
    }
  }, [])

  return { seat, loading, toggle, activate, reset }
}
