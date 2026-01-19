const http = require('http')
const crypto = require('crypto')

const PORT = 5173

const usersById = new Map()
const usersByPhone = new Map()
const sessionsByToken = new Map()
const smsByKey = new Map()
const registerTokens = new Map()

const bookingDraftsByKey = new Map()
const ordersById = new Map()
const createdOrderIdByKey = new Map()

const userProfilesByUserId = new Map()

function nowMs() {
  return Date.now()
}

function isValidPhoneNumber(phoneNumber) {
  return /^1\d{10}$/.test(String(phoneNumber).trim())
}

function isValidIdCardNumber(value) {
  return /^\d{17}[\dXx]$/.test(String(value).trim())
}

function isValidIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value).trim())
}

function isStrictIsoDate(value) {
  const s = String(value ?? '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const d = new Date(`${s}T00:00:00`)
  if (Number.isNaN(d.getTime())) return false
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}` === s
}

function isFutureIsoDate(value) {
  const s = String(value ?? '').trim()
  if (!isStrictIsoDate(s)) return false
  const d = new Date(`${s}T00:00:00`)
  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return d.getTime() > todayStart.getTime()
}

function isValidHumanName(value) {
  const s = String(value ?? '').trim()
  if (!s) return false
  if (s.length > 30) return false
  return /^[\u4e00-\u9fa5A-Za-z\s·]+$/.test(s)
}

function json(res, statusCode, body) {
  const payload = body ? JSON.stringify(body) : ''
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
  })
  res.end(payload)
}

function noContent(res, statusCode) {
  res.writeHead(statusCode)
  res.end()
}

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

function getClientKey(req) {
  const token = getBearerToken(req)
  if (token) return `token:${token}`
  const xff = req.headers['x-forwarded-for']
  const ip = Array.isArray(xff) ? xff[0] : xff
  const remote = req.socket?.remoteAddress
  return `ip:${String(ip || remote || 'unknown')}`
}

function getClientKeyCandidates(req) {
  const token = getBearerToken(req)
  const xff = req.headers['x-forwarded-for']
  const ip = Array.isArray(xff) ? xff[0] : xff
  const remote = req.socket?.remoteAddress
  const ipKey = `ip:${String(ip || remote || 'unknown')}`
  const list = []
  if (token) list.push(`token:${token}`)
  list.push(ipKey)
  return list
}

function normalizeDraft(raw) {
  if (!raw || typeof raw !== 'object') return { ok: false, error: 'Invalid booking draft.' }
  const flightId = String(raw.flightId ?? '').trim()
  const packageId = String(raw.packageId ?? '').trim()
  const departDate = String(raw.departDate ?? '').trim()
  const priceVersion = String(raw.priceVersion ?? '').trim()

  const routeRaw = raw.route && typeof raw.route === 'object' ? raw.route : null
  const fromCity = routeRaw ? String(routeRaw.fromCity ?? '').trim() : ''
  const toCity = routeRaw ? String(routeRaw.toCity ?? '').trim() : ''
  const route = fromCity && toCity ? { fromCity, toCity } : null

  const airline = String(raw.airline ?? '').trim()
  const cabin = String(raw.cabin ?? '').trim()
  const depTime = String(raw.depTime ?? '').trim()
  const arrTime = String(raw.arrTime ?? '').trim()
  const depAirport = String(raw.depAirport ?? '').trim()
  const arrAirport = String(raw.arrAirport ?? '').trim()

  const priceItemsRaw = Array.isArray(raw.priceItems) ? raw.priceItems : null
  const priceItems = priceItemsRaw
    ? priceItemsRaw
        .map((it) => {
          if (!it || typeof it !== 'object') return null
          const name = String(it.name ?? '').trim()
          const unitPrice = Number(it.unitPrice)
          const quantity = Number(it.quantity)
          if (!name) return null
          if (!Number.isFinite(unitPrice) || unitPrice < 0) return null
          if (!Number.isFinite(quantity) || quantity <= 0) return null
          return { name, unitPrice, quantity }
        })
        .filter(Boolean)
    : null

  const totalAmountRaw = raw.totalAmount ?? raw.amount
  const totalAmount = Number(totalAmountRaw)

  const passenger = raw.passenger && typeof raw.passenger === 'object' ? raw.passenger : null
  const contact = raw.contact && typeof raw.contact === 'object' ? raw.contact : null

  const passengerName = passenger ? String(passenger.name ?? '').trim() : ''
  const passengerIdType = passenger ? String(passenger.idType ?? '').trim() : ''
  const passengerIdNumber = passenger ? String(passenger.idNumber ?? '').trim() : ''
  const contactPhoneNumber = contact ? String(contact.phoneNumber ?? '').trim() : ''

  if (!flightId || !packageId || !departDate || !priceVersion) return { ok: false, error: 'Invalid booking draft.' }
  if (!isValidIsoDate(departDate)) return { ok: false, error: 'Invalid booking draft.' }
  if (!passengerName || !passengerIdType || !passengerIdNumber || !contactPhoneNumber) {
    return { ok: false, error: 'Invalid booking draft.' }
  }
  if (passengerIdType === '身份证' && !isValidIdCardNumber(passengerIdNumber)) {
    return { ok: false, error: 'Invalid passenger id number.' }
  }
  if (!isValidPhoneNumber(contactPhoneNumber)) {
    return { ok: false, error: 'Invalid contact phone number.' }
  }

  const draft = {
    flightId,
    packageId,
    departDate,
    priceVersion,
    route,
    airline: airline || null,
    cabin: cabin || null,
    depTime: depTime || null,
    arrTime: arrTime || null,
    depAirport: depAirport || null,
    arrAirport: arrAirport || null,
    totalAmount: Number.isFinite(totalAmount) ? totalAmount : null,
    priceItems,
    passenger: {
      name: passengerName,
      idType: passengerIdType,
      idNumber: passengerIdNumber,
      phoneNumber: passenger ? String(passenger.phoneNumber ?? '').trim() : '',
    },
    contact: {
      phoneNumber: contactPhoneNumber,
    },
    services: Array.isArray(raw.services) ? raw.services : [],
    stage: String(raw.stage ?? '').trim(),
  }

  return { ok: true, draft }
}

function maskIdNumber(value) {
  const s = String(value ?? '').trim()
  if (!s) return ''
  if (s.length <= 5) return s
  return `${s.slice(0, 3)}**********${s.slice(-2)}`
}

function maskPhoneNumberLoose(phoneNumber) {
  const p = String(phoneNumber ?? '').replace(/\D+/g, '')
  if (p.length !== 11) return String(phoneNumber ?? '')
  return `${p.slice(0, 3)}****${p.slice(7)}`
}

function createOrderFromDraft(draft, owner) {
  const orderId = `ORDER_${crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()}`
  const createdAt = new Date().toISOString()
  const expiresAt = new Date(nowMs() + 15 * 60_000).toISOString()

  const departDate = String(draft?.departDate ?? '').trim()
  const departAt = isStrictIsoDate(departDate) ? new Date(`${departDate}T00:00:00`).toISOString() : ''
  const passenger = draft?.passenger || {}
  const contact = draft?.contact || {}
  const totalAmount = Number(draft?.totalAmount ?? 0)

  const details = {
    flightId: String(draft?.flightId ?? '').trim() || null,
    airline: String(draft?.airline ?? '').trim() || null,
    cabin: String(draft?.cabin ?? '').trim() || null,
    departDate: String(draft?.departDate ?? '').trim() || null,
    depTime: String(draft?.depTime ?? '').trim() || null,
    arrTime: String(draft?.arrTime ?? '').trim() || null,
    depAirport: String(draft?.depAirport ?? '').trim() || null,
    arrAirport: String(draft?.arrAirport ?? '').trim() || null,
    route: draft?.route && typeof draft.route === 'object' ? draft.route : null,
    passenger: {
      name: String(passenger.name ?? '').trim(),
      idType: String(passenger.idType ?? '').trim(),
      idNumberMasked: maskIdNumber(passenger.idNumber),
    },
    contact: {
      phoneNumber: maskPhoneNumberLoose(contact.phoneNumber),
    },
    priceItems: Array.isArray(draft?.priceItems) ? draft.priceItems : [],
  }

  const order = {
    orderId,
    status: 'pending_payment',
    createdAt,
    updatedAt: createdAt,
    expiresAt,
    productType: 'flight',
    draft,
    departAt,
    totalAmount: Number.isFinite(totalAmount) ? totalAmount : 0,
    details,
    paidAt: null,
    userId: owner?.userId || null,
  }
  ordersById.set(orderId, order)
  return order
}

async function handlePutBookingDraft(req, res) {
  const body = await readJsonBody(req)
  if (!body) return json(res, 400, { error: 'Invalid input or format.' })

  const normalized = normalizeDraft(body)
  if (!normalized.ok) return json(res, 400, { error: normalized.error })

  const key = getClientKey(req)
  bookingDraftsByKey.set(key, normalized.draft)
  return noContent(res, 204)
}

async function handlePostOrdersFlight(req, res) {
  const body = await readJsonBody(req)
  if (!body) return json(res, 400, { error: 'Invalid input or format.' })

  const draftRaw = body.draft
  const normalized = normalizeDraft(draftRaw)
  if (!normalized.ok) return json(res, 400, { error: normalized.error })

  const session = requireAuthSession(req, res)
  if (!session) return

  const key = getClientKey(req)
  const existingId = createdOrderIdByKey.get(key)
  if (existingId && ordersById.has(existingId)) {
    return json(res, 409, { error: 'Duplicate order create.' })
  }

  const owner = { userId: session.userId }
  const order = createOrderFromDraft(normalized.draft, owner)
  createdOrderIdByKey.set(key, order.orderId)
  return json(res, 201, { orderId: order.orderId, status: order.status, expiresAt: order.expiresAt })
}

async function handlePostOrderPay(req, res, orderId) {
  const session = requireAuthSession(req, res)
  if (!session) return

  const order = ordersById.get(String(orderId))
  if (!order || order.userId !== session.userId) return json(res, 404, { error: 'Order not found.' })

  const expiresAtMs = Date.parse(String(order.expiresAt))
  if (Number.isFinite(expiresAtMs) && nowMs() >= expiresAtMs) {
    return json(res, 409, { error: 'Payment expired.' })
  }

  const body = await readJsonBody(req)
  if (!body) return json(res, 400, { error: 'Invalid input or format.' })
  const payMethod = String(body.payMethod ?? 'saved').trim() || 'saved'
  if (payMethod !== 'saved' && payMethod !== 'new') {
    return json(res, 400, { error: 'Invalid input or format.' })
  }

  if (payMethod === 'new') {
    const card = body.newCard
    if (!card || typeof card !== 'object') return json(res, 400, { error: 'Invalid input or format.' })
    const no = String(card.cardNumber ?? '').replace(/\s+/g, '')
    const name = String(card.cardName ?? card.name ?? '').trim()
    const exp = String(card.cardExpiry ?? card.expiry ?? '').trim()
    const cvv = String(card.cardCvv ?? card.cvv ?? '').trim()
    if (!/^\d{16,19}$/.test(no)) return json(res, 400, { error: 'Invalid input or format.' })
    if (!name) return json(res, 400, { error: 'Invalid input or format.' })
    if (!/^(0[1-9]|1[0-2])\/?\d{2}$/.test(exp)) return json(res, 400, { error: 'Invalid input or format.' })
    if (!/^\d{3,4}$/.test(cvv)) return json(res, 400, { error: 'Invalid input or format.' })
  }

  const storedDraft = getClientKeyCandidates(req)
    .map((k) => bookingDraftsByKey.get(k) || null)
    .find(Boolean)
  const orderDraft = order?.draft
  const orderPassenger = orderDraft?.passenger
  const orderContact = orderDraft?.contact
  const draftPassenger = storedDraft?.passenger
  const draftContact = storedDraft?.contact
  if (storedDraft) {
    const infoOk =
      orderPassenger &&
      orderContact &&
      draftPassenger &&
      draftContact &&
      String(draftPassenger.name ?? '').trim() === String(orderPassenger.name ?? '').trim() &&
      String(draftPassenger.idType ?? '').trim() === String(orderPassenger.idType ?? '').trim() &&
      String(draftPassenger.idNumber ?? '').trim() === String(orderPassenger.idNumber ?? '').trim() &&
      String(draftContact.phoneNumber ?? '').trim() === String(orderContact.phoneNumber ?? '').trim()

    if (!infoOk) {
      return json(res, 422, { error: 'Passenger info inconsistent.' })
    }
  }

  const paidAt = new Date().toISOString()
  order.status = 'paid'
  order.paidAt = paidAt
  order.updatedAt = paidAt
  ordersById.set(String(orderId), order)

  return json(res, 200, { paidAt, nextRoute: '/buy-ticket/step4' })
}

async function handlePatchOrderStatus(req, res, orderId) {
  const session = requireAuthSession(req, res)
  if (!session) return
  const order = ordersById.get(String(orderId))
  if (!order || order.userId !== session.userId) return json(res, 404, { error: 'Order not found.' })

  const body = await readJsonBody(req)
  const status = body && typeof body === 'object' ? String(body.status ?? '').trim() : ''
  const nextStatus = status || 'pending_travel'
  if (nextStatus !== 'pending_travel' && nextStatus !== 'canceled') {
    return json(res, 400, { error: 'Invalid status.' })
  }

  const departAtMs = Date.parse(String(order.departAt || ''))
  const now = nowMs()
  if (nextStatus === 'canceled') {
    if (order.status === 'canceled') return noContent(res, 204)
    const canCancel =
      order.status === 'pending_payment' ||
      (order.status === 'pending_travel' && Number.isFinite(departAtMs) ? departAtMs > now : true)
    if (!canCancel) return json(res, 403, { error: 'Forbidden.' })
  }
  if (nextStatus === 'pending_travel') {
    if (order.status !== 'paid' && order.status !== 'pending_payment' && order.status !== 'pending_travel') {
      return json(res, 403, { error: 'Forbidden.' })
    }
  }

  const nowIso = new Date().toISOString()
  order.status = nextStatus
  order.updatedAt = nowIso
  ordersById.set(String(orderId), order)
  return noContent(res, 204)
}

function requireAuthSession(req, res) {
  const token = getBearerToken(req)
  const session = getSession(token)
  if (!session) {
    json(res, 401, { error: 'Unauthorized.' })
    return null
  }
  return session
}

async function handleGetOrders(req, res) {
  const session = requireAuthSession(req, res)
  if (!session) return
  const rlKey = `orders:${getClientKey(req)}`
  const now = nowMs()
  const windowMs = 5000
  const limit = 10
  const busyLimit = 20
  if (!globalThis.__ordersRate__) globalThis.__ordersRate__ = new Map()
  const rateMap = globalThis.__ordersRate__
  const prev = rateMap.get(rlKey) || []
  const next = prev.filter((t) => now - t < windowMs)
  next.push(now)
  rateMap.set(rlKey, next)
  if (next.length > busyLimit) return json(res, 503, { error: 'Service busy.' })
  if (next.length > limit) return json(res, 429, { error: 'Too many requests.' })

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
  const tab = String(url.searchParams.get('tab') || 'all').trim()
  const productType = String(url.searchParams.get('productType') || 'all').trim()
  const pageRaw = url.searchParams.get('page')
  const pageSizeRaw = url.searchParams.get('pageSize')

  const pageParsed = Number.parseInt(String(pageRaw || '1'), 10)
  const pageSizeParsed = Number.parseInt(String(pageSizeRaw || '10'), 10)
  if (!Number.isFinite(pageParsed) || pageParsed < 1) return json(res, 400, { error: 'Invalid input or format.' })
  if (!Number.isFinite(pageSizeParsed) || pageSizeParsed < 1 || pageSizeParsed > 50) {
    return json(res, 400, { error: 'Invalid input or format.' })
  }
  const page = pageParsed
  const pageSize = pageSizeParsed

  const validTabs = new Set(['all', 'pending_travel', 'pending_payment', 'pending_review', 'paid', 'canceled'])
  if (!validTabs.has(tab)) return json(res, 400, { error: 'Invalid input or format.' })
  const validProductTypes = new Set(['all', 'flight', 'train', 'hotel'])
  if (!validProductTypes.has(productType)) return json(res, 400, { error: 'Invalid input or format.' })

  const all = Array.from(ordersById.values())
    .filter((o) => o && o.userId === session.userId)
    .filter((o) => (productType === 'all' ? true : String(o.productType) === productType))
    .filter((o) => {
      if (tab === 'all') return true
      if (tab === 'pending_payment') return String(o.status) === 'pending_payment'
      if (tab === 'pending_travel') {
        if (String(o.status) !== 'pending_travel') return false
        const ms = Date.parse(String(o.departAt || ''))
        return Number.isFinite(ms) ? ms > now : true
      }
      if (tab === 'pending_review') {
        if (String(o.status) !== 'pending_travel') return false
        const ms = Date.parse(String(o.departAt || ''))
        return Number.isFinite(ms) ? ms <= now : false
      }
      return String(o.status) === tab
    })
    .map((o) => {
      return {
        orderId: o.orderId,
        productType: o.productType,
        status: o.status,
        createdAt: o.createdAt,
        departAt: String(o.departAt ?? '').trim(),
        totalAmount: Number(o.totalAmount ?? 0),
        details: o.details && typeof o.details === 'object' ? o.details : {},
      }
    })
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))

  const start = (page - 1) * pageSize
  const slice = all.slice(start, start + pageSize)
  return json(res, 200, { orders: slice, total: all.length, page, pageSize })
}

async function handleGetOrderById(req, res, orderId) {
  const session = requireAuthSession(req, res)
  if (!session) return
  const id = String(orderId || '').trim()
  const order = ordersById.get(id)
  if (!order || order.userId !== session.userId) return json(res, 404, { error: 'Order not found.' })

  return json(res, 200, {
    order: {
      orderId: order.orderId,
      productType: order.productType,
      status: order.status,
      createdAt: order.createdAt,
      departAt: String(order.departAt ?? '').trim(),
      totalAmount: Number(order.totalAmount ?? 0),
      details: order.details && typeof order.details === 'object' ? order.details : {},
    },
  })
}

async function handleGetOrderExportTxt(req, res, orderId) {
  const session = requireAuthSession(req, res)
  if (!session) return
  const id = String(orderId || '').trim()
  const order = ordersById.get(id)
  if (!order || order.userId !== session.userId) return json(res, 404, { error: 'Order not found.' })

  const route = order?.details?.route
  const passenger = order?.details?.passenger
  const content = [
    `orderId=${order.orderId}`,
    `status=${order.status}`,
    `createdAt=${order.createdAt}`,
    order.departAt ? `departAt=${order.departAt}` : null,
    Number.isFinite(Number(order.totalAmount)) ? `totalAmount=${Number(order.totalAmount)}` : null,
    route?.fromCity && route?.toCity ? `route=${String(route.fromCity)}->${String(route.toCity)}` : null,
    passenger?.name ? `passenger=${String(passenger.name)}` : null,
  ]
    .filter(Boolean)
    .join('\n')
  return json(res, 200, { filename: `${order.orderId}.txt`, content })
}

async function handlePostOrdersExportTxt(req, res) {
  const session = requireAuthSession(req, res)
  if (!session) return
  const body = await readJsonBody(req)
  if (!body || typeof body !== 'object' || !Array.isArray(body.orderIds)) {
    return json(res, 400, { error: 'Invalid input or format.' })
  }

  const idsRaw = body.orderIds.map((v) => String(v || '').trim()).filter(Boolean)
  const picked = idsRaw.length
    ? idsRaw
        .map((id) => ordersById.get(id) || null)
        .filter((o) => o && o.userId === session.userId)
    : Array.from(ordersById.values()).filter((o) => o && o.userId === session.userId)

  const content = picked
    .map((o) => {
      const passengerName = String(o?.details?.passenger?.name ?? '').trim()
      const contactPhone = String(o?.details?.contact?.phoneNumber ?? '').trim()
      const route = o?.details?.route
      const totalAmount = Number(o?.totalAmount ?? 0)
      return [
        `orderId=${o.orderId}`,
        `status=${o.status}`,
        Number.isFinite(totalAmount) ? `totalAmount=${totalAmount}` : null,
        route?.fromCity && route?.toCity ? `route=${String(route.fromCity)}->${String(route.toCity)}` : null,
        passengerName ? `passenger=${passengerName}` : null,
        contactPhone ? `contact=${contactPhone}` : null,
      ]
        .filter(Boolean)
        .join(' ')
    })
    .join('\n')

  return json(res, 200, { filename: 'orders.txt', content })
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', (chunk) => {
      raw += chunk
      if (raw.length > 1_000_000) {
        reject(new Error('Body too large'))
      }
    })
    req.on('end', () => resolve(raw))
    req.on('error', reject)
  })
}

async function readJsonBody(req) {
  const raw = await readBody(req)
  if (!raw) return {}
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex')
}

function makePasswordHash(password) {
  const salt = crypto.randomBytes(16)
  const iterations = 120000
  const keylen = 32
  const digest = 'sha256'
  const derived = crypto.pbkdf2Sync(String(password), salt, iterations, keylen, digest)
  return `pbkdf2$${digest}$${iterations}$${salt.toString('hex')}$${derived.toString('hex')}`
}

function verifyPassword(password, passwordHash) {
  const parts = String(passwordHash || '').split('$')
  if (parts.length !== 5) return false
  const [, digest, iterationsRaw, saltHex, derivedHex] = parts
  const iterations = Number(iterationsRaw)
  if (!digest || !Number.isFinite(iterations) || iterations <= 0 || !saltHex || !derivedHex) return false

  const salt = Buffer.from(saltHex, 'hex')
  const expected = Buffer.from(derivedHex, 'hex')
  const actual = crypto.pbkdf2Sync(String(password), salt, iterations, expected.length, digest)
  if (actual.length !== expected.length) return false
  return crypto.timingSafeEqual(actual, expected)
}

function maskPhoneNumber(phoneNumber) {
  const p = String(phoneNumber)
  if (p.length !== 11) return p
  return `${p.slice(0, 3)}****${p.slice(7)}`
}

function validatePassword(password) {
  const s = String(password)
  if (s.length < 8 || s.length > 20) return false
  const hasLetter = /[A-Za-z]/.test(s)
  const hasNumber = /\d/.test(s)
  const hasSymbol = /[^A-Za-z\d]/.test(s)
  const categories = [hasLetter, hasNumber, hasSymbol].filter(Boolean).length
  return categories >= 2
}

function findUserByAccount(account) {
  const a = String(account).trim()
  if (!a) return null
  for (const user of usersById.values()) {
    if (user.phoneNumber === a) return user
    if (user.username === a) return user
    if (user.email === a) return user
  }
  return null
}

function createSession(userId) {
  const token = randomToken(32)
  sessionsByToken.set(token, {
    userId,
    expiresAtMs: nowMs() + 7 * 24 * 60 * 60 * 1000,
    revokedAtMs: null,
  })
  return token
}

function getBearerToken(req) {
  const h = req.headers['authorization']
  if (!h) return null
  const v = Array.isArray(h) ? h[0] : h
  const m = /^Bearer\s+(.+)$/i.exec(String(v))
  return m ? m[1].trim() : null
}

function getSession(token) {
  if (!token) return null
  const s = sessionsByToken.get(token)
  if (!s) return null
  if (s.revokedAtMs) return null
  if (s.expiresAtMs <= nowMs()) return null
  return s
}

function makeSmsKey(purpose, phoneNumber) {
  return `${purpose}:${String(phoneNumber).trim()}`
}

function generateSmsCode() {
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0')
}

function sendSmsCode(purpose, phoneNumber) {
  const key = makeSmsKey(purpose, phoneNumber)
  const existing = smsByKey.get(key)
  const now = nowMs()
  if (existing && now - existing.createdAtMs < 60_000) {
    return { ok: false, statusCode: 429, error: 'Too many requests.' }
  }

  const code = generateSmsCode()
  smsByKey.set(key, {
    phoneNumber: String(phoneNumber).trim(),
    purpose,
    code,
    createdAtMs: now,
    expiresAtMs: now + 5 * 60_000,
    usedAtMs: null,
  })
  console.log(`[sms] purpose=${purpose} phone=${String(phoneNumber).trim()} code=${code}`)
  return { ok: true }
}

function verifySmsCode(purpose, phoneNumber, code) {
  const key = makeSmsKey(purpose, phoneNumber)
  const row = smsByKey.get(key)
  if (!row) return { ok: false }
  if (row.usedAtMs) return { ok: false }
  if (row.expiresAtMs <= nowMs()) return { ok: false }
  if (String(row.code) !== String(code).trim()) return { ok: false }
  return { ok: true, key }
}

function markSmsUsed(key) {
  const row = smsByKey.get(key)
  if (!row) return
  if (row.usedAtMs) return
  row.usedAtMs = nowMs()
  smsByKey.set(key, row)
}

async function handlePostAuthLoginPassword(req, res) {
  const body = await readJsonBody(req)
  if (!body) return json(res, 400, { error: 'Invalid input or format.' })
  const account = String(body.account ?? '').trim()
  const password = String(body.password ?? '')
  if (!account || !password) return json(res, 400, { error: 'Invalid input or format.' })

  const user = findUserByAccount(account)
  if (!user) return json(res, 401, { error: 'Invalid credentials.' })
  if (!verifyPassword(password, user.passwordHash)) return json(res, 401, { error: 'Invalid credentials.' })

  const token = createSession(user.userId)
  return json(res, 200, {
    token,
    userId: user.userId,
    userDisplayName: user.userDisplayName,
    phoneNumber: user.phoneNumber,
    loginAt: new Date().toISOString(),
  })
}

async function handlePostAuthLoginSmsSend(req, res) {
  const body = await readJsonBody(req)
  if (!body) return json(res, 400, { error: 'Invalid phone number.' })
  const phoneNumber = String(body.phoneNumber ?? '').trim()
  if (!isValidPhoneNumber(phoneNumber)) return json(res, 400, { error: 'Invalid phone number.' })
  const result = sendSmsCode('login', phoneNumber)
  if (!result.ok) return json(res, result.statusCode, { error: result.error })
  return noContent(res, 204)
}

async function handlePostAuthLoginSms(req, res) {
  const body = await readJsonBody(req)
  if (!body) return json(res, 400, { error: 'Invalid phone number.' })
  const phoneNumber = String(body.phoneNumber ?? '').trim()
  const verificationCode = String(body.verificationCode ?? '').trim()
  if (!isValidPhoneNumber(phoneNumber)) return json(res, 400, { error: 'Invalid phone number.' })
  if (!verificationCode) return json(res, 401, { error: 'Invalid verification code.' })

  const user = usersByPhone.get(phoneNumber) || null
  if (!user) return json(res, 404, { error: 'Phone number not registered.' })

  const verified = verifySmsCode('login', phoneNumber, verificationCode)
  if (!verified.ok) return json(res, 401, { error: 'Invalid verification code.' })
  markSmsUsed(verified.key)

  const token = createSession(user.userId)
  return json(res, 200, {
    token,
    userId: user.userId,
    userDisplayName: user.userDisplayName,
    phoneNumber: user.phoneNumber,
    loginAt: new Date().toISOString(),
  })
}

async function handlePostAuthRegisterSmsSend(req, res) {
  const body = await readJsonBody(req)
  if (!body) return json(res, 400, { error: 'Invalid phone number.' })
  const phoneNumber = String(body.phoneNumber ?? '').trim()
  if (!isValidPhoneNumber(phoneNumber)) return json(res, 400, { error: 'Invalid phone number.' })
  const result = sendSmsCode('register', phoneNumber)
  if (!result.ok) return json(res, result.statusCode, { error: result.error })
  return noContent(res, 204)
}

async function handlePostAuthRegisterVerifyPhone(req, res) {
  const body = await readJsonBody(req)
  if (!body) return json(res, 400, { error: 'Invalid input or format.' })
  const phoneNumber = String(body.phoneNumber ?? '').trim()
  const verificationCode = String(body.verificationCode ?? '').trim()
  if (!isValidPhoneNumber(phoneNumber) || !verificationCode) {
    return json(res, 400, { error: 'Invalid input or format.' })
  }

  const verified = verifySmsCode('register', phoneNumber, verificationCode)
  if (!verified.ok) return json(res, 401, { error: 'Invalid verification code.' })
  markSmsUsed(verified.key)

  const registerToken = randomToken(16)
  registerTokens.set(registerToken, {
    phoneNumber,
    expiresAtMs: nowMs() + 10 * 60_000,
    usedAtMs: null,
  })

  return json(res, 200, {
    registerToken,
    phoneNumberMasked: maskPhoneNumber(phoneNumber),
  })
}

async function handlePostAuthRegisterComplete(req, res) {
  const body = await readJsonBody(req)
  if (!body) return json(res, 400, { error: 'Invalid password or mismatch.' })
  const registerToken = String(body.registerToken ?? '').trim()
  const password = String(body.password ?? '')
  const confirmPassword = String(body.confirmPassword ?? '')
  if (!registerToken) return json(res, 401, { error: 'Invalid register token.' })

  const tokenRow = registerTokens.get(registerToken)
  if (!tokenRow || tokenRow.usedAtMs || tokenRow.expiresAtMs <= nowMs()) {
    return json(res, 401, { error: 'Invalid register token.' })
  }

  if (!password || !confirmPassword || password !== confirmPassword || !validatePassword(password)) {
    return json(res, 400, { error: 'Invalid password or mismatch.' })
  }

  const phoneNumber = tokenRow.phoneNumber
  if (usersByPhone.has(phoneNumber)) {
    return json(res, 409, { error: 'Phone number already registered.' })
  }

  const userId = crypto.randomUUID()
  const userDisplayName = `用户${phoneNumber.slice(-4)}`
  const username = `user_${phoneNumber.slice(-4)}`
  const email = `user${phoneNumber.slice(-4)}@example.com`
  const passwordHash = makePasswordHash(password)

  const user = {
    userId,
    userDisplayName,
    phoneNumber,
    username,
    email,
    passwordHash,
    createdAt: new Date().toISOString(),
  }

  usersById.set(userId, user)
  usersByPhone.set(phoneNumber, user)
  tokenRow.usedAtMs = nowMs()
  registerTokens.set(registerToken, tokenRow)

  return json(res, 201, { userId, phoneNumber })
}

async function handlePostAuthLogout(req, res) {
  const token = getBearerToken(req)
  const session = getSession(token)
  if (!session) return json(res, 401, { error: 'Unauthorized.' })
  const row = sessionsByToken.get(token)
  if (row) {
    row.revokedAtMs = nowMs()
    sessionsByToken.set(token, row)
  }
  return noContent(res, 204)
}

async function handleGetAuthMe(req, res) {
  const token = getBearerToken(req)
  const session = getSession(token)
  if (!session) return json(res, 401, { error: 'Unauthorized.' })
  const user = usersById.get(session.userId)
  if (!user) return json(res, 401, { error: 'Unauthorized.' })
  return json(res, 200, {
    userId: user.userId,
    userDisplayName: user.userDisplayName,
    phoneNumber: user.phoneNumber,
  })
}

async function handlePostUserCenterMyInfo(req, res) {
  const token = getBearerToken(req)
  const session = getSession(token)
  if (!session) return json(res, 401, { error: 'Unauthorized.' })

  const body = await readJsonBody(req)
  if (!body) return json(res, 400, { error: 'Invalid input or format.' })

  const nickname = String(body.nickname ?? '').trim()
  const name = String(body.name ?? '').trim()
  const gender = String(body.gender ?? '').trim()
  const birthday = String(body.birthday ?? '').trim()
  const profileVersion = String(body.profileVersion ?? '').trim()

  if (!nickname || nickname.length > 20) return json(res, 400, { error: 'Invalid input or format.' })
  if (!isValidHumanName(name)) return json(res, 400, { error: 'Invalid input or format.' })
  if (gender !== '男' && gender !== '女') return json(res, 400, { error: 'Invalid input or format.' })
  if (birthday) {
    if (!isStrictIsoDate(birthday)) return json(res, 400, { error: 'Invalid input or format.' })
    if (isFutureIsoDate(birthday)) return json(res, 400, { error: 'Invalid input or format.' })
  }

  const existing = userProfilesByUserId.get(session.userId) || {
    nickname: '',
    name: '',
    gender: '',
    birthday: '',
    nicknameStatus: '',
    version: '',
    updatedAt: null,
  }

  if (profileVersion && existing.version && profileVersion !== existing.version) {
    return json(res, 409, { error: 'Profile conflict.' })
  }

  if (existing.nicknameStatus === 'reviewing' && nickname !== existing.nickname) {
    return json(res, 403, { error: 'Forbidden.' })
  }

  const nextVersion = crypto.randomUUID()
  const nowIso = new Date().toISOString()
  const next = {
    nickname,
    name,
    gender,
    birthday,
    nicknameStatus: existing.nicknameStatus,
    version: nextVersion,
    updatedAt: nowIso,
  }
  userProfilesByUserId.set(session.userId, next)

  res.setHeader('x-profile-version', nextVersion)
  return noContent(res, 204)
}

async function handler(req, res) {
  setCorsHeaders(res)

  if (req.method === 'OPTIONS') {
    return noContent(res, 204)
  }

  const url = new URL(req.url, `http://${req.headers.host}`)
  const path = url.pathname

  if (req.method === 'GET' && path === '/api/health') {
    return json(res, 200, { ok: true })
  }

  try {
    if (req.method === 'PUT' && path === '/api/booking/draft') {
      return await handlePutBookingDraft(req, res)
    }
    if (req.method === 'POST' && path === '/api/orders/flight') {
      return await handlePostOrdersFlight(req, res)
    }
    const payMatch = /^\/api\/orders\/([^/]+)\/pay$/.exec(path)
    if (req.method === 'POST' && payMatch) {
      return await handlePostOrderPay(req, res, payMatch[1])
    }
    const statusMatch = /^\/api\/orders\/([^/]+)\/status$/.exec(path)
    if (req.method === 'PATCH' && statusMatch) {
      return await handlePatchOrderStatus(req, res, statusMatch[1])
    }
    if (req.method === 'GET' && path === '/api/orders') {
      return await handleGetOrders(req, res)
    }
    const orderByIdMatch = /^\/api\/orders\/([^/]+)$/.exec(path)
    if (req.method === 'GET' && orderByIdMatch) {
      return await handleGetOrderById(req, res, orderByIdMatch[1])
    }
    const orderExportMatch = /^\/api\/orders\/([^/]+)\/export\/txt$/.exec(path)
    if (req.method === 'GET' && orderExportMatch) {
      return await handleGetOrderExportTxt(req, res, orderExportMatch[1])
    }
    if (req.method === 'POST' && path === '/api/orders/export/txt') {
      return await handlePostOrdersExportTxt(req, res)
    }
    if (req.method === 'POST' && path === '/api/auth/login/password') {
      return await handlePostAuthLoginPassword(req, res)
    }
    if (req.method === 'POST' && path === '/api/auth/login/sms/send') {
      return await handlePostAuthLoginSmsSend(req, res)
    }
    if (req.method === 'POST' && path === '/api/auth/login/sms') {
      return await handlePostAuthLoginSms(req, res)
    }
    if (req.method === 'POST' && path === '/api/auth/register/sms/send') {
      return await handlePostAuthRegisterSmsSend(req, res)
    }
    if (req.method === 'POST' && path === '/api/auth/register/verify-phone') {
      return await handlePostAuthRegisterVerifyPhone(req, res)
    }
    if (req.method === 'POST' && path === '/api/auth/register/complete') {
      return await handlePostAuthRegisterComplete(req, res)
    }
    if (req.method === 'POST' && path === '/api/auth/logout') {
      return await handlePostAuthLogout(req, res)
    }
    if (req.method === 'GET' && path === '/api/auth/me') {
      return await handleGetAuthMe(req, res)
    }
    if (req.method === 'POST' && path === '/api/user-center/my-info') {
      return await handlePostUserCenterMyInfo(req, res)
    }
  } catch {
    return json(res, 500, { error: 'Internal server error.' })
  }

  return json(res, 404, { error: 'Not found.' })
}

const server = http.createServer((req, res) => {
  void handler(req, res)
})

server.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`)
})
