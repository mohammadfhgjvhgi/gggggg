'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  firebaseListen,
  firebaseWrite,
  FIREBASE_PATHS,
  type Mp3State,
} from '@/lib/firebase'

export function useFirebaseMp3() {
  const [mp3, setMp3] = useState<Mp3State>({ playing: false, track: 0 })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const unsubPlaying = firebaseListen(FIREBASE_PATHS.mp3.playing, (val) => {
      setMp3(prev => ({ ...prev, playing: val === true }))
    })

    const unsubTrack = firebaseListen(FIREBASE_PATHS.mp3.track, (val) => {
      setMp3(prev => ({ ...prev, track: typeof val === 'number' ? val : 0 }))
    })

    return () => {
      unsubPlaying()
      unsubTrack()
    }
  }, [])

  const play = useCallback(async (track?: number) => {
    setLoading(true)
    try {
      if (track !== undefined) {
        await firebaseWrite(FIREBASE_PATHS.mp3.track, track)
      }
      await firebaseWrite(FIREBASE_PATHS.mp3.playing, true)
    } catch (error) {
      console.error('MP3 play failed:', error)
    } finally {
      setTimeout(() => setLoading(false), 500)
    }
  }, [])

  const stop = useCallback(async () => {
    setLoading(true)
    try {
      await firebaseWrite(FIREBASE_PATHS.mp3.playing, false)
    } catch (error) {
      console.error('MP3 stop failed:', error)
    } finally {
      setTimeout(() => setLoading(false), 500)
    }
  }, [])

  const togglePlay = useCallback(async () => {
    setLoading(true)
    try {
      await firebaseWrite(FIREBASE_PATHS.mp3.playing, !mp3.playing)
    } catch (error) {
      console.error('MP3 toggle failed:', error)
    } finally {
      setTimeout(() => setLoading(false), 500)
    }
  }, [mp3.playing])

  const setTrack = useCallback(async (track: number) => {
    setLoading(true)
    try {
      await firebaseWrite(FIREBASE_PATHS.mp3.track, track)
    } catch (error) {
      console.error('MP3 set track failed:', error)
    } finally {
      setTimeout(() => setLoading(false), 500)
    }
  }, [])

  const nextTrack = useCallback(async () => {
    setLoading(true)
    try {
      const newTrack = mp3.track + 1
      await firebaseWrite(FIREBASE_PATHS.mp3.track, newTrack)
    } catch (error) {
      console.error('MP3 next track failed:', error)
    } finally {
      setTimeout(() => setLoading(false), 500)
    }
  }, [mp3.track])

  const prevTrack = useCallback(async () => {
    setLoading(true)
    try {
      const newTrack = Math.max(0, mp3.track - 1)
      await firebaseWrite(FIREBASE_PATHS.mp3.track, newTrack)
    } catch (error) {
      console.error('MP3 prev track failed:', error)
    } finally {
      setTimeout(() => setLoading(false), 500)
    }
  }, [mp3.track])

  return { mp3, loading, play, stop, togglePlay, setTrack, nextTrack, prevTrack }
}
