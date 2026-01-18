const http = require('http')
const crypto = require('crypto')

const {
  handlePostUserCenterMyInfo,
  handlePostUserCenterOrdersCancel,
  handlePostUserCenterCommonTravelers,
} = require('./routes/userCenter')

const PORT = 5173

const usersById = new Map()
const usersByPhone = new Map()
const sessionsByToken = new Map()
const smsByKey = new Map()
const registerTokens = new Map()

function isoDateToday() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

function isIsoDateString(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(s))
}

function normalizeCityParam(v) {
  return String(v ?? '').trim()
}

function buildMockFlights({ from, to, departDate }) {
  const f = from.split('(')[0] || from
  const t = to.split('(')[0] || to
  const seedBase = `${from}|${to}|${departDate}`

  function hashCode(str) {
    let h = 0
    for (let i = 0; i < str.length; i += 1) {
      h = (h << 5) - h + str.charCodeAt(i)
      h |= 0
    }
    return Math.abs(h)
  }

  const seed = hashCode(seedBase)
  const airlines = ['东方航空', '中国联合航空', '春秋航空', '吉祥航空', '南方航空']
  const aircrafts = ['A320', 'A321', 'B737', 'A319', 'B787']
  const basePrice = 380 + (seed % 220)

  const templates = [
    { flightNo: 'MU5185', depTime: '21:05', arrTime: '23:20', depAirport: `${f}浦东国际机场T1`, arrAirport: `${t}首都国际机场T2` },
    { flightNo: 'KN5987', depTime: '20:50', arrTime: '22:55', depAirport: `${f}大兴国际机场`, arrAirport: `${t}浦东国际机场T1` },
    { flightNo: 'HO1253', depTime: '18:00', arrTime: '20:30', depAirport: `${f}浦东国际机场T2`, arrAirport: `${t}大兴国际机场` },
  ]

  const flights = templates.map((tpl, idx) => {
    const price = basePrice + idx * 30
    return {
      airline: airlines[(seed + idx) % airlines.length],
      flightNo: tpl.flightNo,
      aircraft: aircrafts[(seed + idx * 3) % aircrafts.length],
      depTime: tpl.depTime,
      arrTime: tpl.arrTime,
      depAirport: tpl.depAirport,
      arrAirport: tpl.arrAirport,
      price,
    }
  })

  return flights
}

function nowMs() {
  return Date.now()
}

function isValidPhoneNumber(phoneNumber) {
  return /^1\d{10}$/.test(String(phoneNumber).trim())
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
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
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

async function handleGetFlightsSearch(req, res, url) {
  const from = normalizeCityParam(url.searchParams.get('from'))
  const to = normalizeCityParam(url.searchParams.get('to'))
  const departDate = normalizeCityParam(url.searchParams.get('departDate'))

  if (!from || !to || !departDate) {
    return json(res, 400, { error: 'Invalid input or format.' })
  }
  if (!isIsoDateString(departDate)) {
    return json(res, 400, { error: 'Invalid input or format.' })
  }
  if (departDate < isoDateToday()) {
    return json(res, 400, { error: 'Invalid input or format.' })
  }

  const flights = buildMockFlights({ from, to, departDate })
  return json(res, 200, { flights })
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
    if (req.method === 'GET' && path === '/api/flights/search') {
      return await handleGetFlightsSearch(req, res, url)
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
    if (req.method === 'POST' && path === '/api/user-center/orders/cancel') {
      return await handlePostUserCenterOrdersCancel(req, res)
    }
    if (req.method === 'POST' && path === '/api/user-center/common-travelers') {
      return await handlePostUserCenterCommonTravelers(req, res)
    }
  } catch {
    return json(res, 500, { error: 'Internal server error.' })
  }

  return json(res, 404, { error: 'Not found.' })
}

function createServer() {
  return http.createServer((req, res) => {
    void handler(req, res)
  })
}

module.exports = {
  createServer,
  handler,
}

if (require.main === module) {
  const server = createServer()
  server.listen(PORT, () => {
    console.log(`Backend listening on http://localhost:${PORT}`)
  })
}
