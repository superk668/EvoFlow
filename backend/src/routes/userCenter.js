function json(res, statusCode, body) {
  const payload = body ? JSON.stringify(body) : ''
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
  })
  res.end(payload)
}

function nowIso() {
  return new Date().toISOString()
}

function isYmd(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''))
}

function ymdToday() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

function isNotFutureYmd(s) {
  if (!isYmd(s)) return false
  return String(s) <= ymdToday()
}

function isValidNickname(s) {
  const v = String(s || '').trim()
  return Boolean(v) && v.length <= 20
}

function isValidName(s) {
  const v = String(s || '').trim()
  if (!v) return false
  if (v.length > 30) return false
  if (/\d/.test(v)) return false
  if (/[^a-zA-Z\u4e00-\u9fa5·\s]/.test(v)) return false
  return true
}

function isValidGender(s) {
  const v = String(s || '').trim()
  return v === '男' || v === '女' || v === '未知'
}

const userProfileStore = {
  nickname: '未设置',
  name: '未设置',
  gender: '未设置',
  birthday: '未设置',
  updatedAt: null,
}

const ordersById = new Map(
  [
    [
      'o_pending_payment',
      {
        orderId: 'o_pending_payment',
        productType: 'flight',
        status: 'pending_payment',
        createdAt: nowIso(),
        updatedAt: nowIso(),
        canceledAt: null,
      },
    ],
    [
      'o_pending_travel',
      {
        orderId: 'o_pending_travel',
        productType: 'flight',
        status: 'pending_travel',
        createdAt: nowIso(),
        updatedAt: nowIso(),
        canceledAt: null,
      },
    ],
  ].map(([id, order]) => [id, order]),
)

const commonTravelers = []

function randomId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

async function readJsonBody(req) {
  return await new Promise((resolve) => {
    let raw = ''
    req.on('data', (chunk) => {
      raw += chunk
    })
    req.on('end', () => {
      if (!raw) return resolve({})
      try {
        resolve(JSON.parse(raw))
      } catch {
        resolve(null)
      }
    })
    req.on('error', () => resolve(null))
  })
}

async function handlePostUserCenterMyInfo(req, res) {
  const body = await readJsonBody(req)
  if (body == null) return json(res, 400, { error: 'Invalid input or format.' })

  const nickname = String(body.nickname || '').trim()
  const name = String(body.name || '').trim()
  const gender = String(body.gender || '').trim()
  const birthday = body.birthday == null ? '' : String(body.birthday).trim()

  if (!isValidNickname(nickname)) return json(res, 400, { error: 'Invalid nickname.' })
  if (!isValidName(name)) return json(res, 400, { error: 'Invalid name.' })
  if (!isValidGender(gender)) return json(res, 400, { error: 'Invalid gender.' })
  if (birthday) {
    if (!isNotFutureYmd(birthday)) return json(res, 400, { error: 'Invalid birthday.' })
  }

  userProfileStore.nickname = nickname
  userProfileStore.name = name
  userProfileStore.gender = gender
  userProfileStore.birthday = birthday || '未设置'
  userProfileStore.updatedAt = nowIso()

  return json(res, 200, { ok: true, profile: userProfileStore })
}

async function handlePostUserCenterOrdersCancel(req, res) {
  const body = await readJsonBody(req)
  if (body == null) return json(res, 400, { error: 'Invalid input or format.' })

  const orderId = String(body.orderId || '').trim()
  if (!orderId) return json(res, 400, { error: 'Invalid orderId.' })

  const order = ordersById.get(orderId)
  if (!order) return json(res, 404, { error: 'Order not found.' })

  const status = String(order.status || '')
  if (status === 'canceled') return json(res, 200, { ok: true, order })
  if (status !== 'pending_payment' && status !== 'pending_travel') {
    return json(res, 400, { error: 'Order is not cancelable.' })
  }

  const next = {
    ...order,
    status: 'canceled',
    canceledAt: nowIso(),
    updatedAt: nowIso(),
  }
  ordersById.set(orderId, next)
  return json(res, 200, { ok: true, order: next })
}

async function handlePostUserCenterCommonTravelers(req, res) {
  const body = await readJsonBody(req)
  if (body == null) return json(res, 400, { error: 'Invalid input or format.' })

  const nameZh = String(body.nameZh || '').trim()
  const lastName = String(body.lastName || '').trim()
  const firstName = String(body.firstName || '').trim()
  const isSelf = Boolean(body.isSelf)
  const idType = body.idType == null ? '' : String(body.idType).trim()
  const idNumber = body.idNumber == null ? '' : String(body.idNumber).trim()
  const birthday = body.birthday == null ? '' : String(body.birthday).trim()

  if (!nameZh && !(lastName || firstName)) {
    return json(res, 400, { error: 'Missing required name.' })
  }
  if (birthday && !isNotFutureYmd(birthday)) {
    return json(res, 400, { error: 'Invalid birthday.' })
  }

  if (isSelf && commonTravelers.some((t) => t.isSelf)) {
    return json(res, 409, { error: 'Self traveler already exists.' })
  }

  if (idType && idNumber) {
    const dup = commonTravelers.some((t) => String(t.idType || '') === idType && String(t.idNumber || '') === idNumber)
    if (dup) return json(res, 409, { error: 'Duplicate idNumber.' })
  }

  const travelerId = randomId('traveler')
  const record = {
    travelerId,
    isSelf,
    nameZh: nameZh || null,
    lastName: lastName || null,
    firstName: firstName || null,
    idType: idType || null,
    idNumber: idNumber || null,
    birthday: birthday || null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }

  if (isSelf) {
    for (const t of commonTravelers) t.isSelf = false
  }
  commonTravelers.push(record)

  return json(res, 200, { ok: true, travelerId })
}

module.exports = {
  handlePostUserCenterMyInfo,
  handlePostUserCenterOrdersCancel,
  handlePostUserCenterCommonTravelers,
}
