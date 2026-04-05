'use client'

import { initializeApp, getApps, getApp } from 'firebase/app'
import { getDatabase, ref, set, get, onValue, off, type Database } from 'firebase/database'

// ═══════════════════════════════════════
//   إعدادات Firebase
// ═══════════════════════════════════════

const FIREBASE_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDPzZv-4QDyoDcBHhgEmhLsoptPTCJOVu8',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'wedding-hall-24f25.firebaseapp.com',
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || 'https://wedding-hall-24f25-default-rtdb.firebaseio.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'wedding-hall-24f25',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'wedding-hall-24f25.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '575973595286',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:575973595286:web:b16c4ca0c3a31f4e864ab7',
}

let _app: ReturnType<typeof initializeApp> | null = null
let _database: Database | null = null

export function initializeFirebase() {
  if (!_app) {
    _app = getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApp()
    _database = getDatabase(_app)
  }
  return { app: _app!, database: _database! }
}

export function getFirebaseConfig() {
  return FIREBASE_CONFIG
}

export { _database as database }

// ═══════════════════════════════════════
//   مسارات Firebase Realtime Database
// ═══════════════════════════════════════

const BASE_PATH = '/wedding_hall'

export const FIREBASE_PATHS = {
  gate: `${BASE_PATH}/gate/open`,
  door: `${BASE_PATH}/door/open`,
  seat: `${BASE_PATH}/seat/active`,
  lights: {
    street: `${BASE_PATH}/lights/street`,
    ship: `${BASE_PATH}/lights/ship`,
    ceiling: `${BASE_PATH}/lights/ceiling`,
    floor: `${BASE_PATH}/lights/floor`,
    pillar_outer: `${BASE_PATH}/lights/pillar_outer`,
    pillar_inner: `${BASE_PATH}/lights/pillar_inner`,
  },
  mp3: {
    playing: `${BASE_PATH}/mp3/playing`,
    track: `${BASE_PATH}/mp3/track`,
  },
  status: {
    online: `${BASE_PATH}/status/online`,
    lastSeen: `${BASE_PATH}/status/lastSeen`,
  },
} as const

// ═══════════════════════════════════════
//   أنواع بيانات الأجهزة
// ═══════════════════════════════════════

export interface Esp32Status {
  online: boolean
  lastSeen: number
}

export interface GateState {
  open: boolean
}

export interface DoorState {
  open: boolean
}

export interface SeatState {
  active: boolean
}

export interface LightKey {
  key: keyof typeof FIREBASE_PATHS.lights
  label: string
  inverted: boolean  // true = LOW means ON (ريليه ثنائي), false = HIGH means ON (ريليه رباعي)
}

export const LIGHT_DEFINITIONS: LightKey[] = [
  { key: 'street', label: 'إضاءة الشارع', inverted: true },
  { key: 'ship', label: 'إضاءة السفينة', inverted: true },
  { key: 'ceiling', label: 'سقف الصالة', inverted: false },
  { key: 'floor', label: 'أرضية الصالة', inverted: false },
  { key: 'pillar_outer', label: 'عمود خارجي', inverted: false },
  { key: 'pillar_inner', label: 'عمود داخلي', inverted: false },
]

export interface LightsState {
  street: boolean
  ship: boolean
  ceiling: boolean
  floor: boolean
  pillar_outer: boolean
  pillar_inner: boolean
}

export interface Mp3State {
  playing: boolean
  track: number
}

export interface WeddingHallState {
  status: Esp32Status
  gate: GateState
  door: DoorState
  seat: SeatState
  lights: LightsState
  mp3: Mp3State
}

export const DEFAULT_STATE: WeddingHallState = {
  status: { online: false, lastSeen: 0 },
  gate: { open: false },
  door: { open: false },
  seat: { active: false },
  lights: {
    street: false,
    ship: false,
    ceiling: false,
    floor: false,
    pillar_outer: false,
    pillar_inner: false,
  },
  mp3: { playing: false, track: 0 },
}

// ═══════════════════════════════════════
//   دوال القراءة والكتابة
// ═══════════════════════════════════════

export function firebaseWrite(path: string, value: boolean | number | string | null) {
  const { database } = initializeFirebase()
  if (!database) return Promise.reject(new Error('Firebase not initialized'))
  return set(ref(database, path), value)
}

export function firebaseRead(path: string) {
  const { database } = initializeFirebase()
  if (!database) return Promise.reject(new Error('Firebase not initialized'))
  return get(ref(database, path)).then(snapshot => snapshot.val())
}

export function firebaseListen(path: string, callback: (value: any) => void) {
  const { database } = initializeFirebase()
  if (!database) return () => {}
  const dbRef = ref(database, path)
  onValue(dbRef, (snapshot) => {
    callback(snapshot.val())
  })
  return () => off(dbRef)
}

// ═══════════════════════════════════════
//   تحويل قيم الريليه
// ═══════════════════════════════════════

// التحويل بين واجهة المستخدم وقيمة Firebase
// inverted=true (شارع، سفينة): UI ON = Firebase false (LOW)
// inverted=false (سقف، أرضية، أعمدة): UI ON = Firebase true (HIGH)
export function uiToFirebase(uiOn: boolean, inverted: boolean): boolean {
  return inverted ? !uiOn : uiOn
}

export function firebaseToUi(firebaseValue: boolean | null | undefined, inverted: boolean): boolean {
  if (firebaseValue === null || firebaseValue === undefined) return false
  return inverted ? !firebaseValue : firebaseValue
}

// ═══════════════════════════════════════
//   دوال إعادة التعيين
// ═══════════════════════════════════════

export async function resetAllDevices() {
  const operations: Promise<void>[] = []

  // إغلاق البوابة والباب
  operations.push(firebaseWrite(FIREBASE_PATHS.gate, false))
  operations.push(firebaseWrite(FIREBASE_PATHS.door, false))

  // إعادة تعيين جلوس العريس
  operations.push(firebaseWrite(FIREBASE_PATHS.seat, false))

  // إطفاء كل الأضواء (كلها false يعني: شارع وسفينة طافية، سقف وأرضية وأعمدة طافية)
  Object.values(FIREBASE_PATHS.lights).forEach(path => {
    operations.push(firebaseWrite(path, false))
  })

  // إيقاف MP3
  operations.push(firebaseWrite(FIREBASE_PATHS.mp3.playing, false))
  operations.push(firebaseWrite(FIREBASE_PATHS.mp3.track, 0))

  await Promise.all(operations)
}

export async function testConnection(): Promise<boolean> {
  try {
    const { database } = initializeFirebase()
    if (!database) return false

    // كتابة قيمة اختبار
    const testRef = ref(database, `${BASE_PATH}/_test`)
    await set(testRef, Date.now())

    // قراءة القيمة
    const snapshot = await get(testRef)
    return snapshot.exists()
  } catch {
    return false
  }
}
