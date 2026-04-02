'use client'

import { initializeApp, getApps, getApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

let app = null
let database = null

export function getFirebaseConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  }
}

export function initializeFirebase() {
  if (!app) {
    const config = getFirebaseConfig()
    if (config.apiKey && config.databaseURL) {
      app = getApps().length === 0 ? initializeApp(config) : getApp()
      database = getDatabase(app)
    }
  }
  return { app, database }
}

export { database }

// ═══════════════════════════════════════
//   أنواع بيانات Firebase
// ═══════════════════════════════════════

export interface GateStatus {
  status: 'open' | 'closed'
  command: 'open' | 'close' | 'none'
  last_update: number
}

export interface HallDoorStatus {
  status: 'open' | 'closed'
  command: 'open' | 'close' | 'none'
  last_update: number
}

export interface SeatingStatus {
  triggered: boolean
  last_update: number
}

export interface LightsStatus {
  street: boolean
  ship: boolean
  ceiling: boolean
  floor: boolean
  pillar_out: boolean
  pillar_in: boolean
}

export interface WeddingHallState {
  gate: GateStatus
  hall_door: HallDoorStatus
  seating: SeatingStatus
  lights: LightsStatus
}

export const DEFAULT_HALL_STATE: WeddingHallState = {
  gate: { status: 'closed', command: 'none', last_update: 0 },
  hall_door: { status: 'closed', command: 'none', last_update: 0 },
  seating: { triggered: false, last_update: 0 },
  lights: {
    street: false,
    ship: false,
    ceiling: false,
    floor: false,
    pillar_out: false,
    pillar_in: false,
  },
}
