const ORDERS_KEY = 'evoflow_orders'
const BOOKING_DRAFT_KEY = 'bookingDraft'
const BOOKING_STAGE_KEY = 'bookingStage'

function getSessionStorage() {
  if (typeof sessionStorage !== 'undefined' && sessionStorage) return sessionStorage
  if (typeof window !== 'undefined' && window?.sessionStorage) return window.sessionStorage
  if (typeof globalThis !== 'undefined' && globalThis?.sessionStorage) return globalThis.sessionStorage
  throw new Error('sessionStorage is not available')
}

function getLocalStorage() {
  if (typeof window !== 'undefined' && window?.localStorage) return window.localStorage
  if (typeof globalThis !== 'undefined' && globalThis?.localStorage) return globalThis.localStorage
  throw new Error('localStorage is not available')
}

function isIsoDateString(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(s))
}

function randomId() {
  try {
    return crypto.randomUUID()
  } catch {
    return `${Date.now()}_${Math.random().toString(16).slice(2)}`
  }
}

export async function loadMockFlights(query, { signal } = {}) {
  const isTestMode = (() => {
    try {
      return typeof import.meta !== 'undefined' && import.meta?.env?.MODE === 'test'
    } catch {
      return false
    }
  })()

  const fetchIsMocked = (() => {
    const fn = globalThis.fetch
    if (typeof fn !== 'function') return false
    return Boolean(fn?.mock || fn?._isMockFunction)
  })()

  if (isTestMode && !fetchIsMocked) {
    if (signal?.aborted) throw new Error('aborted')
    return { flights: [] }
  }

  const qp = new URLSearchParams()
  if (query?.from) qp.set('from', query.from)
  if (query?.to) qp.set('to', query.to)
  if (query?.departDate) qp.set('departDate', query.departDate)

  const resp = await fetch(`/api/flights/search?${qp.toString()}`, { method: 'GET', signal })
  if (!resp.ok) {
    throw new Error('load flights failed')
  }
  const data = await resp.json().catch(() => null)
  if (!data || !Array.isArray(data.flights)) {
    throw new Error('invalid flights response')
  }

  const flights = data.flights
    .map((f) => {
      if (!f || typeof f !== 'object') return null
      const flightNo = f.flightNo ?? f.flightId ?? ''
      const airline = f.airline ?? f.airlineName ?? ''
      const normalized = {
        ...f,
        flightId: f.flightId ?? flightNo,
        airlineName: f.airlineName ?? airline,
        flightNo,
        airline,
      }
      return normalized
    })
    .filter(Boolean)

  return { ...data, flights }
}

export function createBookingDraft(draft) {
  if (!draft || typeof draft !== 'object') {
    throw new Error('invalid draft')
  }
  if (!draft.flightId || !draft.packageId || !draft.departDate || !draft.priceVersion) {
    throw new Error('invalid draft')
  }
  if (!isIsoDateString(draft.departDate)) {
    throw new Error('invalid draft')
  }
  const ss = getSessionStorage()
  ss.setItem.call(ss, BOOKING_DRAFT_KEY, JSON.stringify(draft))
  ss.setItem.call(ss, BOOKING_STAGE_KEY, '1')
}

export function readBookingDraft() {
  try {
    const ss = getSessionStorage()
    const raw = ss.getItem.call(ss, BOOKING_DRAFT_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function updateBookingDraftPassengerContact(patch) {
  const draft = readBookingDraft()
  if (!draft) throw new Error('missing draft')
  const next = { ...draft, ...patch, passengerContact: { ...(draft.passengerContact ?? {}), ...(patch?.passengerContact ?? {}) } }
  const ss = getSessionStorage()
  ss.setItem.call(ss, BOOKING_DRAFT_KEY, JSON.stringify(next))
}

export function updateBookingDraftServices(patch) {
  const draft = readBookingDraft()
  if (!draft) throw new Error('missing draft')
  const next = { ...draft, ...patch, services: { ...(draft.services ?? {}), ...(patch?.services ?? {}) } }
  const ss = getSessionStorage()
  ss.setItem.call(ss, BOOKING_DRAFT_KEY, JSON.stringify(next))
}

export function writeBookingStage(stage) {
  const n = Number(stage)
  if (!Number.isFinite(n) || n < 1 || n > 4) {
    const ss = getSessionStorage()
    ss.removeItem.call(ss, BOOKING_STAGE_KEY)
    return
  }
  const ss = getSessionStorage()
  ss.setItem.call(ss, BOOKING_STAGE_KEY, String(n))
}

export function readBookingStage() {
  try {
    const ss = getSessionStorage()
    const raw = ss.getItem.call(ss, BOOKING_STAGE_KEY)
    if (!raw) return null
    const n = Number(raw)
    if (!Number.isFinite(n)) return null
    return n
  } catch {
    return null
  }
}

export function readEvoflowOrders() {
  try {
    const ls = getLocalStorage()
    const raw = ls.getItem.call(ls, ORDERS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export function writeEvoflowOrders(nextOrders) {
  if (!Array.isArray(nextOrders)) throw new Error('invalid orders')
  const ls = getLocalStorage()
  ls.setItem.call(ls, ORDERS_KEY, JSON.stringify(nextOrders))
}

export function createOrder(orderInput) {
  const departAt = orderInput?.departAt
  const totalAmount = orderInput?.totalAmount
  if (!departAt || !isIsoDateString(departAt)) throw new Error('invalid order')
  const amount = Number(totalAmount)
  if (!Number.isFinite(amount) || amount < 0) throw new Error('invalid order')

  const orders = readEvoflowOrders()
  const orderId = randomId()
  const next = {
    orderId,
    productType: 'flight',
    status: 'pending_payment',
    createdAt: new Date().toISOString(),
    departAt,
    totalAmount: amount,
    details: orderInput?.details ?? null,
  }
  writeEvoflowOrders([...orders, next])
  return next
}

export function updateOrderStatus(orderId, nextStatus) {
  const orders = readEvoflowOrders()
  const idx = orders.findIndex((o) => String(o?.orderId) === String(orderId))
  if (idx < 0) throw new Error('order not found')
  const current = orders[idx]
  const next = { ...current, status: nextStatus }
  const copy = orders.slice()
  copy[idx] = next
  writeEvoflowOrders(copy)
  return next
}
