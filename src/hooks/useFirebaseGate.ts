'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  firebaseListen,
  firebaseWrite,
  FIREBASE_PATHS,
  type GateState,
} from '@/lib/firebase'

export function useFirebaseGate() {
  const [gate, setGate] = useState<GateState>({ open: false })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const unsub = firebaseListen(FIREBASE_PATHS.gate, (val) => {
      setGate({ open: val === true })
    })
    return () => unsub()
  }, [])

  const toggle = useCallback(async () => {
    setLoading(true)
    try {
      await firebaseWrite(FIREBASE_PATHS.gate, !gate.open)
    } catch (error) {
      console.error('Gate toggle failed:', error)
    } finally {
      setTimeout(() => setLoading(false), 1000)
    }
  }, [gate.open])

  const open = useCallback(async () => {
    setLoading(true)
    try {
      await firebaseWrite(FIREBASE_PATHS.gate, true)
    } catch (error) {
      console.error('Gate open failed:', error)
    } finally {
      setTimeout(() => setLoading(false), 1000)
    }
  }, [])

  const close = useCallback(async () => {
    setLoading(true)
    try {
      await firebaseWrite(FIREBASE_PATHS.gate, false)
    } catch (error) {
      console.error('Gate close failed:', error)
    } finally {
      setTimeout(() => setLoading(false), 1000)
    }
  }, [])

  return { gate, loading, toggle, open, close }
}
