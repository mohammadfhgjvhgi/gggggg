'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  firebaseListen,
  firebaseWrite,
  FIREBASE_PATHS,
  LIGHT_DEFINITIONS,
  uiToFirebase,
  firebaseToUi,
  type LightsState,
} from '@/lib/firebase'

export function useFirebaseLights() {
  const [lights, setLights] = useState<LightsState>({
    street: false,
    ship: false,
    ceiling: false,
    floor: false,
    pillar_outer: false,
    pillar_inner: false,
  })
  const [loading, setLoading] = useState<string | null>(null)

  useEffect(() => {
    const unsubs = LIGHT_DEFINITIONS.map(def => {
      const path = FIREBASE_PATHS.lights[def.key]
      return firebaseListen(path, (val) => {
        const uiValue = firebaseToUi(val, def.inverted)
        setLights(prev => ({ ...prev, [def.key]: uiValue }))
      })
    })
    return () => unsubs.forEach(unsub => unsub())
  }, [])

  const toggle = useCallback(async (key: keyof LightsState) => {
    setLoading(key)
    try {
      const def = LIGHT_DEFINITIONS.find(d => d.key === key)
      if (!def) return
      const currentUi = lights[key]
      const newUi = !currentUi
      const firebaseValue = uiToFirebase(newUi, def.inverted)
      await firebaseWrite(FIREBASE_PATHS.lights[key], firebaseValue)
    } catch (error) {
      console.error(`Light ${key} toggle failed:`, error)
    } finally {
      setTimeout(() => setLoading(null), 500)
    }
  }, [lights])

  const allOn = useCallback(async () => {
    setLoading('all')
    try {
      const ops = LIGHT_DEFINITIONS.map(def => {
        const firebaseValue = uiToFirebase(true, def.inverted)
        return firebaseWrite(FIREBASE_PATHS.lights[def.key], firebaseValue)
      })
      await Promise.all(ops)
    } catch (error) {
      console.error('All lights on failed:', error)
    } finally {
      setTimeout(() => setLoading(null), 500)
    }
  }, [])

  const allOff = useCallback(async () => {
    setLoading('all')
    try {
      const ops = LIGHT_DEFINITIONS.map(def => {
        const firebaseValue = uiToFirebase(false, def.inverted)
        return firebaseWrite(FIREBASE_PATHS.lights[def.key], firebaseValue)
      })
      await Promise.all(ops)
    } catch (error) {
      console.error('All lights off failed:', error)
    } finally {
      setTimeout(() => setLoading(null), 500)
    }
  }, [])

  const activeCount = Object.values(lights).filter(Boolean).length

  return { lights, loading, toggle, allOn, allOff, activeCount }
}
