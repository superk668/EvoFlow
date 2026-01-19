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

function normalizeDraft(raw) {
  if (!raw || typeof raw !== 'object') return { ok: false, error: 'Invalid booking draft.' }
  const flightId = String(raw.flightId ?? '').trim()
  const packageId = String(raw.packageId ?? '').trim()
  const departDate = String(raw.departDate ?? '').trim()
  const priceVersion = String(raw.priceVersion ?? '').trim()

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

function createOrderFromDraft(draft) {
  const orderId = `ORDER_${crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()}`
  const createdAt = new Date().toISOString()
  const expiresAt = new Date(nowMs() + 15 * 60_000).toISOString()
  const order = {
    orderId,
    status: 'pending_payment',
    createdAt,
    updatedAt: createdAt,
    expiresAt,
    productType: 'flight',
    draft,
    paidAt: null,
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

  const order = createOrderFromDraft(normalized.draft)
  return json(res, 201, { orderId: order.orderId, status: order.status, expiresAt: order.expiresAt })
}

async function handlePostOrderPay(req, res, orderId) {
  const order = ordersById.get(String(orderId))
  if (!order) return json(res, 404, { error: 'Order not found.' })
  const expiresAtMs = Date.parse(String(order.expiresAt))
  if (Number.isFinite(expiresAtMs) && nowMs() >= expiresAtMs) {
    return json(res, 409, { error: 'Order expired.' })
  }

  const body = await readJsonBody(req)
  if (!body) return json(res, 400, { error: 'Invalid input or format.' })
  const payMethod = String(body.payMethod ?? '').trim()
  if (payMethod && payMethod !== 'saved' && payMethod !== 'new') {
    return json(res, 400, { error: 'Invalid pay method.' })
  }

  const paidAt = new Date().toISOString()
  order.status = 'paid'
  order.paidAt = paidAt
  order.updatedAt = paidAt
  ordersById.set(String(orderId), order)

  return json(res, 200, { paidAt, nextRoute: '/buy-ticket/step4' })
}

async function handlePatchOrderStatus(req, res, orderId) {
  const order = ordersById.get(String(orderId))
  if (!order) return json(res, 404, { error: 'Order not found.' })

  const nowIso = new Date().toISOString()
  order.status = 'pending_travel'
  order.updatedAt = nowIso
  ordersById.set(String(orderId), order)
  return noContent(res, 204)
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
