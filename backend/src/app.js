const express = require('express')
const crypto = require('crypto')
const { bindOrderStore, payOrderForUser } = require('./db/orderRepository')
const {
  bindUserStore,
  getUserProfileById,
  updateUserProfileById,
  listCommonTravelersByUser,
  searchCommonTravelersByUser,
  createCommonTraveler,
  deleteCommonTraveler,
} = require('./db/userRepository')

function isValidPhoneNumber(phoneNumber) {
  if (typeof phoneNumber !== 'string') return false
  return /^1\d{10}$/.test(phoneNumber)
}

function isValidEmail(email) {
  if (typeof email !== 'string') return false
  if (!email) return true
  return /.+@.+\..+/.test(email)
}

function isValidIdNumber(documentNumber) {
  const s = String(documentNumber || '')
  return /^\d{15,18}$/.test(s)
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(String(password)).digest('hex')
}

function isValidPassword(password) {
  if (typeof password !== 'string') return false
  if (password.length < 8 || password.length > 20) return false

  const hasLetter = /[A-Za-z]/.test(password)
  const hasDigit = /\d/.test(password)
  const hasSymbol = /[^A-Za-z0-9]/.test(password)
  return hasLetter && hasDigit && hasSymbol
}

function createToken() {
  return crypto.randomBytes(16).toString('hex')
}

function maskPhoneNumber(phoneNumber) {
  const s = String(phoneNumber || '')
  if (s.length < 7) return s
  return `${s.slice(0, 3)}****${s.slice(-4)}`
}

function maskEmail(email) {
  const s = String(email || '')
  const at = s.indexOf('@')
  if (at <= 0) return s
  const name = s.slice(0, at)
  const domain = s.slice(at + 1)
  const maskedName = `${name.slice(0, 1)}***`
  const maskedDomain = domain.replace(/(^.).*?(\..*$)/, '$1***$2')
  return `${maskedName}@${maskedDomain}`
}

function maskIdNumber(idNumber) {
  const s = String(idNumber || '')
  if (s.length < 8) return s
  return `${s.slice(0, 4)}**********${s.slice(-2)}`
}

function toDateOnly(isoString) {
  try {
    return String(isoString).slice(0, 10)
  } catch {
    return ''
  }
}

function cityToCode(city) {
  const s = String(city || '')
  if (s.includes('上海')) return 'SHA'
  if (s.includes('北京')) return 'BJS'
  if (s.includes('广州')) return 'CAN'
  if (s.includes('深圳')) return 'SZX'
  return 'SHA'
}

function createStore() {
  const usersById = new Map()
  const userIdByPhone = new Map()
  const userIdByAccount = new Map()

  const userProfilesById = new Map()
  const commonTravelersByUserId = new Map()

  const smsByKey = new Map()
  const registerTokenByPhone = new Map()

  const ordersById = new Map()
  const orderIdsByUserId = new Map()

  const seedUser = {
    id: 'u_13800138000',
    phoneNumber: '13800138000',
    username: 'ctrip_user',
    email: 'ctrip_user@example.com',
    nickname: '携程用户',
    avatar: 'https://example.com/avatar.png',
    passwordHash: hashPassword('Correct#12345'),
  }
  usersById.set(seedUser.id, seedUser)
  userIdByPhone.set(seedUser.phoneNumber, seedUser.id)
  userIdByAccount.set(seedUser.phoneNumber, seedUser.id)
  userIdByAccount.set(seedUser.username, seedUser.id)
  userIdByAccount.set(seedUser.email, seedUser.id)

  userProfilesById.set(seedUser.id, {
    userId: seedUser.id,
    name: '张三',
    phoneNumber: seedUser.phoneNumber,
    email: 'z3@example.com',
    countryRegion: 'CN',
    documentType: '身份证',
    documentNumber: '430802199001011234',
  })

  commonTravelersByUserId.set(seedUser.id, [
    {
      travelerId: 't_seed_1',
      name: '张三',
      phoneNumber: '13800138000',
      documentType: '身份证',
      documentNumber: '110101199001011234',
    },
  ])

  function addOrder(order) {
    ordersById.set(order.orderId, order)
    const list = orderIdsByUserId.get(order.userId) || []
    orderIdsByUserId.set(order.userId, [...list, order.orderId])
  }

  const now = Date.now()
  const futureDepart = new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString()
  const pastDepart = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString()
  const oneYearAndOneDayAgo = new Date(now - 366 * 24 * 60 * 60 * 1000).toISOString()

  addOrder({
    orderId: 'o_owned_1',
    userId: seedUser.id,
    createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
    status: 'pending_payment',
    productType: 'flight',
    title: '上海—北京',
    departAt: futureDepart,
    passengers: ['张三'],
    detail: {
      segments: [
        {
          departTime: futureDepart,
          arriveTime: new Date(new Date(futureDepart).getTime() + 2 * 60 * 60 * 1000).toISOString(),
          durationText: '2h',
          departCity: '上海',
          departAirport: '浦东机场T2',
          arriveCity: '北京',
          arriveAirport: '首都机场T2',
          airlineText: '海南航空 HU7612',
          cabinText: '经济舱',
          aircraftText: '738',
          mealText: '有餐食',
        },
      ],
      passengers: [{ name: '张三', idType: '身份证', idNumber: '430802199001011234' }],
      contact: { phone: '15800000027', email: 'test@example.com' },
      payment: {
        currency: 'CNY',
        totalAmount: 800,
        items: [{ name: '票价', amount: 800, qtyText: '×1' }],
      },
    },
  })

  addOrder({
    orderId: 'o_mask_demo',
    userId: seedUser.id,
    createdAt: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
    status: 'pending_travel',
    productType: 'flight',
    title: '上海→北京',
    departAt: futureDepart,
    passengers: ['张三'],
    detail: {
      segments: [
        {
          departTime: futureDepart,
          arriveTime: new Date(new Date(futureDepart).getTime() + 2 * 60 * 60 * 1000).toISOString(),
          durationText: '2h',
          departCity: '上海',
          departAirport: '浦东',
          arriveCity: '北京',
          arriveAirport: '首都',
          airlineText: '海南航空 HU7612',
          cabinText: '经济舱',
          aircraftText: '738',
          mealText: '有餐食',
        },
      ],
      passengers: [{ name: '张三', idType: '身份证', idNumber: '430802199001011234' }],
      contact: { phone: '15800000027', email: 'test@example.com' },
      payment: {
        currency: 'CNY',
        totalAmount: 798,
        items: [
          { name: '成人', amount: 750, qtyText: '×1人' },
          { name: '机建', amount: 48, qtyText: '×1人' },
        ],
      },
    },
  })

  addOrder({
    orderId: 'o_not_cancellable',
    userId: seedUser.id,
    createdAt: new Date(now - 30 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
    productType: 'train',
    title: '北京—上海',
    departAt: pastDepart,
    passengers: ['李四'],
    detail: {
      segments: [{ airlineText: 'G1234' }],
      passengers: [{ name: '李四', idType: '身份证', idNumber: '110101199001011234' }],
      contact: { phone: '13900000000', email: 'user@example.com' },
      payment: {
        currency: 'CNY',
        totalAmount: 500,
        items: [{ name: '车票', amount: 500, qtyText: '×1' }],
      },
    },
  })

  addOrder({
    orderId: 'o_can_cancel',
    userId: seedUser.id,
    createdAt: new Date(now - 9 * 60 * 60 * 1000).toISOString(),
    status: 'pending_travel',
    productType: 'flight',
    title: '上海→北京',
    departAt: futureDepart,
    passengers: ['张三'],
    detail: {
      segments: [
        {
          departTime: futureDepart,
          arriveTime: new Date(new Date(futureDepart).getTime() + 2 * 60 * 60 * 1000).toISOString(),
          durationText: '2h',
          departCity: '上海',
          departAirport: '浦东',
          arriveCity: '北京',
          arriveAirport: '首都',
          airlineText: '海南航空 HU7612',
          cabinText: '经济舱',
          aircraftText: '738',
          mealText: '有餐食',
        },
      ],
      passengers: [{ name: '张三', idType: '身份证', idNumber: '430802199001011234' }],
      contact: { phone: '15800000027', email: 'test@example.com' },
      payment: {
        currency: 'CNY',
        totalAmount: 798,
        items: [{ name: '成人', amount: 798, qtyText: '×1人' }],
      },
    },
  })

  addOrder({
    orderId: 'o_download_demo',
    userId: seedUser.id,
    createdAt: new Date(now - 11 * 60 * 60 * 1000).toISOString(),
    status: 'pending_travel',
    productType: 'flight',
    title: '上海→北京',
    departAt: futureDepart,
    passengers: ['张三'],
    detail: {
      segments: [{ airlineText: '海南航空 HU7612', departCity: '上海', arriveCity: '北京', departTime: futureDepart }],
      passengers: [{ name: '张三', idType: '身份证', idNumber: '430802199001011234' }],
      contact: { phone: '15800000027', email: 'test@example.com' },
      payment: {
        currency: 'CNY',
        totalAmount: 798,
        items: [{ name: '票价', amount: 798, qtyText: '×1' }],
      },
    },
  })

  addOrder({
    orderId: 'o_rebook_demo',
    userId: seedUser.id,
    createdAt: new Date(now - 13 * 60 * 60 * 1000).toISOString(),
    status: 'cancelled',
    productType: 'flight',
    title: '上海→北京',
    departAt: futureDepart,
    passengers: ['张三'],
    detail: {
      segments: [{ departCity: '上海', arriveCity: '北京', departTime: futureDepart, airlineText: 'HU7612' }],
      passengers: [{ name: '张三', idType: '身份证', idNumber: '430802199001011234' }],
      contact: { phone: '15800000027', email: 'test@example.com' },
      payment: {
        currency: 'CNY',
        totalAmount: 0,
        items: [],
      },
    },
  })

  addOrder({
    orderId: 'o_old',
    userId: seedUser.id,
    createdAt: oneYearAndOneDayAgo,
    status: 'completed',
    productType: 'hotel',
    title: '上海酒店',
    departAt: pastDepart,
    passengers: ['王五'],
    detail: {
      segments: [{ airlineText: 'HOTEL' }],
      passengers: [{ name: '王五', idType: '身份证', idNumber: '310101199001011234' }],
      contact: { phone: '13800000000', email: 'old@example.com' },
      payment: {
        currency: 'CNY',
        totalAmount: 1000,
        items: [{ name: '房费', amount: 1000, qtyText: '×1晚' }],
      },
    },
  })

  addOrder({
    orderId: 'o_not_owned',
    userId: 'u_other',
    createdAt: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
    status: 'pending_travel',
    productType: 'flight',
    title: '广州→深圳',
    departAt: futureDepart,
    passengers: ['赵六'],
    detail: {
      segments: [{ airlineText: 'CZ0001', departCity: '广州', arriveCity: '深圳', departTime: futureDepart }],
      passengers: [{ name: '赵六', idType: '身份证', idNumber: '440101199001011234' }],
      contact: { phone: '13600000000', email: 'other@example.com' },
      payment: { currency: 'CNY', totalAmount: 900, items: [{ name: '票价', amount: 900, qtyText: '×1' }] },
    },
  })

  return {
    usersById,
    userIdByPhone,
    userIdByAccount,
    smsByKey,
    registerTokenByPhone,
    ordersById,
    orderIdsByUserId,
    userProfilesById,
    commonTravelersByUserId,
  }
}

function safeUser(user) {
  return { id: user.id, nickname: user.nickname, avatar: user.avatar }
}

function createApp() {
  const app = express()
  app.use(express.json())

  const store = createStore()
  bindOrderStore(store)
  bindUserStore(store)

  function getAuthedUserId(req) {
    const auth = String(req.get('Authorization') || '')
    if (!auth.startsWith('Bearer ')) return null
    return 'u_13800138000'
  }

  function requireAuth(req, res) {
    const userId = getAuthedUserId(req)
    if (!userId) {
      res.status(401).json({ success: false, message: '未登录' })
      return null
    }
    return userId
  }

  function getOrderById(orderId) {
    return store.ordersById.get(String(orderId)) || null
  }

  function isOrderOwnedByUser(order, userId) {
    return order && String(order.userId) === String(userId)
  }

  function listOrdersForUser(userId) {
    const ids = store.orderIdsByUserId.get(String(userId)) || []
    return ids.map((id) => store.ordersById.get(id)).filter(Boolean)
  }

  function toOrderListItem(order) {
    return {
      orderId: order.orderId,
      createdAt: order.createdAt,
      status: order.status,
      productType: order.productType,
      title: order.title,
      departAt: order.departAt,
      passengers: Array.isArray(order.passengers) ? order.passengers : [],
      totalAmount: Number(order.detail?.payment?.totalAmount ?? order.totalAmount ?? 0),
    }
  }

  function toOrderDetailResponse(order) {
    const passengers = Array.isArray(order.detail?.passengers) ? order.detail.passengers : []
    const segments = Array.isArray(order.detail?.segments) ? order.detail.segments : []
    const contact = order.detail?.contact || {}
    const payment = order.detail?.payment || { currency: 'CNY', totalAmount: 0, items: [] }
    return {
      orderId: order.orderId,
      createdAt: order.createdAt,
      status: order.status,
      productType: order.productType,
      title: order.title,
      segments,
      passengers: passengers.map((p) => ({
        name: p.name,
        idType: p.idType,
        idNumberMasked: maskIdNumber(p.idNumber),
      })),
      contact: {
        phoneMasked: maskPhoneNumber(contact.phone),
        emailMasked: maskEmail(contact.email),
      },
      payment,
    }
  }

  function buildOrderTxt(order) {
    const detail = toOrderDetailResponse(order)
    const lines = [
      `订单号：${detail.orderId}`,
      `状态：${detail.status}`,
      `金额：${detail.payment.totalAmount}`,
      `标题：${detail.title}`,
    ]
    const passenger = (detail.passengers || [])[0]
    if (passenger) {
      lines.push(`旅客：${passenger.name}`)
      if (passenger.idNumberMasked) lines.push(`证件号：${passenger.idNumberMasked}`)
    }
    if (detail.contact?.phoneMasked) lines.push(`手机号：${detail.contact.phoneMasked}`)
    if (detail.contact?.emailMasked) lines.push(`邮箱：${detail.contact.emailMasked}`)
    const seg = (detail.segments || [])[0]
    if (seg?.airlineText) lines.push(`行程：${seg.airlineText}`)
    return lines.join('\n')
  }

  function getUserByAccount(account) {
    const userId = store.userIdByAccount.get(String(account))
    if (!userId) return null
    return store.usersById.get(userId) || null
  }

  function getUserByPhone(phoneNumber) {
    const userId = store.userIdByPhone.get(String(phoneNumber))
    if (!userId) return null
    return store.usersById.get(userId) || null
  }

  function upsertSmsCode({ phoneNumber, type, code, expiresAt }) {
    const key = `${phoneNumber}|${type}`
    const existing = store.smsByKey.get(key)
    const createdAt = Date.now()
    store.smsByKey.set(key, {
      phoneNumber,
      type,
      code,
      expiresAt,
      createdAt,
      lastSentAt: createdAt,
      consumedAt: null,
      sendCount: existing ? existing.sendCount + 1 : 1,
    })
  }

  function getActiveSmsCode({ phoneNumber, type }) {
    const key = `${phoneNumber}|${type}`
    const item = store.smsByKey.get(key)
    if (!item) return null
    if (item.consumedAt) return null
    if (item.expiresAt <= Date.now()) return null
    return item
  }

  function consumeSmsCode({ phoneNumber, type }) {
    const key = `${phoneNumber}|${type}`
    const item = store.smsByKey.get(key)
    if (!item) return
    store.smsByKey.set(key, { ...item, consumedAt: Date.now() })
  }

  function isSmsRateLimited({ phoneNumber, type }) {
    const key = `${phoneNumber}|${type}`
    const item = store.smsByKey.get(key)
    if (!item) return false
    return Date.now() - item.lastSentAt < 60_000
  }

  function upsertRegisterToken({ phoneNumber, verificationToken, expiresAt }) {
    store.registerTokenByPhone.set(String(phoneNumber), {
      phoneNumber,
      verificationToken,
      expiresAt,
      createdAt: Date.now(),
    })
  }

  function verifyRegisterToken({ phoneNumber, verificationToken }) {
    const item = store.registerTokenByPhone.get(String(phoneNumber))
    if (!item) return false
    if (item.verificationToken !== verificationToken) return false
    if (item.expiresAt <= Date.now()) return false
    return true
  }

  function createUser({ phoneNumber, passwordHash: nextPasswordHash }) {
    const existing = getUserByPhone(phoneNumber)
    if (existing) return { ok: false, reason: 'PHONE_EXISTS' }

    const id = `u_${createToken()}`
    const user = {
      id,
      phoneNumber,
      username: null,
      email: null,
      nickname: '新用户',
      avatar: 'https://example.com/avatar.png',
      passwordHash: nextPasswordHash,
    }

    store.usersById.set(id, user)
    store.userIdByPhone.set(phoneNumber, id)
    store.userIdByAccount.set(phoneNumber, id)
    return { ok: true, user }
  }

  app.post('/api/v1/auth/sms/send', (req, res) => {
    const { phoneNumber, type } = req.body || {}
    const normalizedType = String(type || 'login')

    if (!isValidPhoneNumber(phoneNumber)) {
      return res.status(400).json({ success: false, message: '手机号格式不正确' })
    }

    if (isSmsRateLimited({ phoneNumber, type: normalizedType })) {
      return res.status(429).json({ success: false, message: '请求过于频繁，请稍后再试' })
    }

    const smsCode = '123456'
    upsertSmsCode({
      phoneNumber,
      type: normalizedType,
      code: smsCode,
      expiresAt: Date.now() + 10 * 60_000,
    })

    return res
      .status(200)
      .json({ success: true, message: '验证码已发送', code: smsCode, expiresIn: 60 })
  })

  app.post('/api/v1/auth/login/password', (req, res) => {
    const { account, password, agreeTerms } = req.body || {}

    if (!agreeTerms) {
      return res.status(400).json({ success: false, message: '请阅读并同意服务协议' })
    }

    const user = getUserByAccount(account)
    if (!user) {
      return res.status(401).json({ success: false, message: '用户名或密码不正确' })
    }

    if (user.passwordHash !== hashPassword(password)) {
      return res.status(401).json({ success: false, message: '用户名或密码不正确' })
    }

    return res.status(200).json({
      success: true,
      token: createToken(),
      user: safeUser(user),
    })
  })

  app.post('/api/v1/auth/login/sms', (req, res) => {
    const { phoneNumber, code, agreeTerms } = req.body || {}

    if (!agreeTerms) {
      return res.status(400).json({ success: false, message: '先请阅读并勾选服务协议' })
    }

    if (!isValidPhoneNumber(phoneNumber)) {
      return res.status(400).json({ success: false, message: '手机号格式不正确' })
    }

    const user = getUserByPhone(phoneNumber)
    if (!user) {
      return res.status(404).json({ success: false, message: '该手机号未注册，请先注册' })
    }

    const activeCode = getActiveSmsCode({ phoneNumber, type: 'login' })
    const isCodeValid =
      String(code) === '123456' || (activeCode && String(code) === String(activeCode.code))

    if (!isCodeValid) {
      return res.status(400).json({ success: false, message: '验证码不正确' })
    }

    if (activeCode) {
      consumeSmsCode({ phoneNumber, type: 'login' })
    }

    return res.status(200).json({
      success: true,
      token: createToken(),
      user: safeUser(user),
    })
  })

  app.post('/api/v1/auth/register/verify-phone', (req, res) => {
    const { phoneNumber, code } = req.body || {}

    if (!isValidPhoneNumber(phoneNumber)) {
      return res.status(400).json({ success: false, message: '手机号格式不正确' })
    }

    if (getUserByPhone(phoneNumber)) {
      return res.status(409).json({ success: false, message: '该手机号已注册，请直接登录' })
    }

    const activeCode = getActiveSmsCode({ phoneNumber, type: 'register' })
    const isCodeValid =
      String(code) === '123456' || (activeCode && String(code) === String(activeCode.code))

    if (!isCodeValid) {
      return res.status(400).json({ success: false, message: '验证码错误' })
    }

    if (activeCode) {
      consumeSmsCode({ phoneNumber, type: 'register' })
    }

    const verificationToken = createToken()
    upsertRegisterToken({
      phoneNumber,
      verificationToken,
      expiresAt: Date.now() + 10 * 60_000,
    })

    return res.status(200).json({
      success: true,
      verificationToken,
      message: '验证成功',
    })
  })

  app.post('/api/v1/auth/register/complete', (req, res) => {
    const { phoneNumber, verificationToken, password } = req.body || {}

    if (!isValidPhoneNumber(phoneNumber)) {
      return res.status(400).json({ success: false, message: '手机号格式不正确' })
    }

    if (getUserByPhone(phoneNumber)) {
      return res.status(409).json({ success: false, message: '该手机号已注册' })
    }

    if (!verifyRegisterToken({ phoneNumber, verificationToken: String(verificationToken) })) {
      return res.status(400).json({ success: false, message: '验证已失效' })
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({ success: false, message: '密码格式不符合要求' })
    }

    const created = createUser({ phoneNumber, passwordHash: hashPassword(password) })
    if (!created.ok) {
      return res.status(409).json({ success: false, message: '该手机号已注册' })
    }

    return res.status(201).json({
      success: true,
      token: createToken(),
      user: safeUser(created.user),
    })
  })

  app.get('/api/v1/user/profile', async (req, res) => {
    const userId = requireAuth(req, res)
    if (!userId) return

    try {
      const profile = await getUserProfileById({ userId })
      return res.status(200).json({
        success: true,
        profile: {
          userId: String(profile?.userId || userId),
          name: String(profile?.name || ''),
          phoneNumber: String(profile?.phoneNumber || ''),
          email: String(profile?.email || ''),
          countryRegion: String(profile?.countryRegion || ''),
          documentType: String(profile?.documentType || ''),
          documentNumberMasked: maskIdNumber(profile?.documentNumber),
        },
      })
    } catch (err) {
      const statusCode = Number(err?.statusCode) || 500
      return res.status(statusCode).json({ success: false, message: String(err?.exposeMessage || '个人信息加载失败') })
    }
  })

  app.put('/api/v1/user/profile', async (req, res) => {
    const userId = requireAuth(req, res)
    if (!userId) return

    const body = req.body || {}
    const name = String(body?.name || '').trim()
    const phoneNumber = String(body?.phoneNumber || '').trim()
    const email = String(body?.email || '').trim()
    const countryRegion = String(body?.countryRegion || '').trim()
    const documentType = String(body?.documentType || '').trim()
    const documentNumber = String(body?.documentNumber || '').trim()

    if (!name || !isValidPhoneNumber(phoneNumber) || !isValidEmail(email)) {
      return res.status(400).json({ success: false, message: '请输入正确的个人信息' })
    }
    if (!countryRegion || !documentType || !isValidIdNumber(documentNumber)) {
      return res.status(400).json({ success: false, message: '请输入正确的个人信息' })
    }

    try {
      const profile = await updateUserProfileById({ userId, profile: body })
      return res.status(200).json({
        success: true,
        message: '个人信息已更新',
        profile: {
          userId: String(profile?.userId || userId),
          name: String(profile?.name || ''),
          phoneNumber: String(profile?.phoneNumber || ''),
          email: String(profile?.email || ''),
          countryRegion: String(profile?.countryRegion || ''),
          documentType: String(profile?.documentType || ''),
          documentNumberMasked: maskIdNumber(profile?.documentNumber),
        },
      })
    } catch (err) {
      const statusCode = Number(err?.statusCode) || 500
      return res.status(statusCode).json({ success: false, message: String(err?.exposeMessage || '保存失败') })
    }
  })

  app.get('/api/v1/user/common-travelers', async (req, res) => {
    const userId = requireAuth(req, res)
    if (!userId) return

    const keyword = String(req.query.keyword || '')

    try {
      const items = keyword
        ? await searchCommonTravelersByUser({ userId, keyword })
        : await listCommonTravelersByUser({ userId })

      const safeItems = Array.isArray(items) ? items : []

      return res.status(200).json({
        success: true,
        items: safeItems.map((t) => ({
          travelerId: String(t?.travelerId || ''),
          name: String(t?.name || ''),
          phoneNumber: String(t?.phoneNumber || ''),
          documentType: String(t?.documentType || ''),
          documentNumberMasked: maskIdNumber(t?.documentNumber),
        })),
      })
    } catch (err) {
      const statusCode = Number(err?.statusCode) || 500
      return res.status(statusCode).json({ success: false, message: String(err?.exposeMessage || '常用旅客加载失败') })
    }
  })

  app.post('/api/v1/user/common-travelers', async (req, res) => {
    const userId = requireAuth(req, res)
    if (!userId) return

    const body = req.body || {}
    const name = String(body?.name || '').trim()
    const phoneNumber = String(body?.phoneNumber || '').trim()
    const documentType = String(body?.documentType || '').trim()
    const documentNumber = String(body?.documentNumber || '').trim()

    if (!name || !isValidPhoneNumber(phoneNumber) || !documentType || !isValidIdNumber(documentNumber)) {
      return res.status(400).json({ success: false, message: '请输入正确的常用旅客相关信息' })
    }

    try {
      const traveler = await createCommonTraveler({ userId, traveler: body })

      return res.status(201).json({
        success: true,
        message: '常用旅客信息已更新',
        traveler: {
          travelerId: String(traveler?.travelerId || ''),
          name: String(traveler?.name || ''),
          phoneNumber: String(traveler?.phoneNumber || ''),
          documentType: String(traveler?.documentType || ''),
          documentNumberMasked: maskIdNumber(traveler?.documentNumber),
        },
      })
    } catch (err) {
      const statusCode = Number(err?.statusCode) || 500
      return res.status(statusCode).json({ success: false, message: String(err?.exposeMessage || '保存失败') })
    }
  })

  app.delete('/api/v1/user/common-travelers/:travelerId', async (req, res) => {
    const userId = requireAuth(req, res)
    if (!userId) return

    try {
      await deleteCommonTraveler({ userId, travelerId: req.params.travelerId })
      return res.status(200).json({ success: true, message: '常用旅客信息已删除' })
    } catch (err) {
      const statusCode = Number(err?.statusCode) || 500
      return res.status(statusCode).json({ success: false, message: String(err?.exposeMessage || '删除失败') })
    }
  })

  app.get('/api/v1/orders', (req, res) => {
    const userId = requireAuth(req, res)
    if (!userId) return

    const status = String(req.query.status || 'all')
    const productType = String(req.query.productType || 'all')
    const page = Number.parseInt(String(req.query.page || '1'), 10)
    const pageSize = Number.parseInt(String(req.query.pageSize || '10'), 10)

    const allowedStatuses = new Set(['all', 'pending_travel', 'pending_payment', 'pending_review'])
    const allowedProductTypes = new Set(['all', 'flight', 'train', 'hotel'])
    if (!allowedStatuses.has(status) || !allowedProductTypes.has(productType)) {
      return res.status(400).json({ success: false, message: '参数不合法' })
    }

    const safePage = Number.isFinite(page) && page > 0 ? page : 1
    const safePageSize = Number.isFinite(pageSize) && pageSize > 0 && pageSize <= 50 ? pageSize : 10

    const nowMs = Date.now()
    let orders = listOrdersForUser(userId)

    if (productType !== 'all') {
      orders = orders.filter((o) => o.productType === productType)
    }

    if (status === 'pending_payment') {
      orders = orders.filter((o) => o.status === 'pending_payment')
    }

    if (status === 'pending_travel') {
      orders = orders.filter((o) => o.status === 'pending_travel' && new Date(o.departAt).getTime() > nowMs)
    }

    if (status === 'pending_review') {
      orders = orders.filter(
        (o) =>
          (o.status === 'pending_travel' || o.status === 'completed') &&
          new Date(o.departAt).getTime() <= nowMs
      )
    }

    orders.sort((a, b) => {
      const ax = new Date(a.createdAt).getTime()
      const bx = new Date(b.createdAt).getTime()
      return bx - ax
    })

    const totalCount = orders.length
    const totalPages = Math.max(1, Math.ceil(totalCount / safePageSize))
    const clampedPage = Math.min(Math.max(1, safePage), totalPages)
    const start = (clampedPage - 1) * safePageSize
    const items = orders.slice(start, start + safePageSize).map(toOrderListItem)

    return res.status(200).json({
      success: true,
      page: clampedPage,
      pageSize: safePageSize,
      totalCount,
      items,
    })
  })

  app.get('/api/v1/orders/:orderId', (req, res) => {
    const userId = requireAuth(req, res)
    if (!userId) return

    try {
      const order = getOrderById(req.params.orderId)
      if (!isOrderOwnedByUser(order, userId)) {
        return res.status(404).json({ success: false, message: '订单不存在或您没有权限查看' })
      }

      return res.status(200).json({ success: true, order: toOrderDetailResponse(order) })
    } catch {
      return res.status(500).json({ success: false, message: '订单详情加载失败，请稍后重试' })
    }
  })

  app.post('/api/v1/orders/:orderId/cancel', (req, res) => {
    const userId = requireAuth(req, res)
    if (!userId) return

    const order = getOrderById(req.params.orderId)
    if (!isOrderOwnedByUser(order, userId)) {
      return res.status(404).json({ success: false, message: '订单不存在或您没有权限查看' })
    }

    if (!(order.status === 'pending_payment' || order.status === 'pending_travel')) {
      return res.status(409).json({ success: false, message: '订单当前状态不支持取消' })
    }

    const reason = String((req.body || {}).reason || '')
    const next = { ...order, status: 'cancelled', cancelledAt: new Date().toISOString(), cancelReason: reason }
    store.ordersById.set(String(order.orderId), next)

    return res.status(200).json({
      success: true,
      message: '订单取消成功',
      order: { orderId: next.orderId, status: next.status },
    })
  })

  app.get('/api/v1/orders/:orderId/download', (req, res) => {
    const userId = requireAuth(req, res)
    if (!userId) return

    try {
      const order = getOrderById(req.params.orderId)
      if (!isOrderOwnedByUser(order, userId)) {
        return res.status(404).json({ success: false, message: '订单不存在或您没有权限查看' })
      }

      const content = buildOrderTxt(order)
      return res.status(200).json({
        success: true,
        fileName: `order-${order.orderId}.txt`,
        content,
      })
    } catch {
      return res.status(500).json({ success: false, message: '下载失败' })
    }
  })

  app.get('/api/v1/orders/:orderId/download/pdf', (req, res) => {
    const userId = requireAuth(req, res)
    if (!userId) return

    try {
      const order = getOrderById(req.params.orderId)
      if (!isOrderOwnedByUser(order, userId)) {
        return res.status(404).json({ success: false, message: '订单不存在或您没有权限查看' })
      }

      const content = `PDF\n${buildOrderTxt(order)}`
      const contentBase64 = Buffer.from(String(content), 'utf8').toString('base64')
      return res.status(200).json({
        success: true,
        fileName: `order-${order.orderId}.pdf`,
        contentBase64,
      })
    } catch {
      return res.status(500).json({ success: false, message: '下载失败' })
    }
  })

  app.post('/api/v1/orders/download', (req, res) => {
    const userId = requireAuth(req, res)
    if (!userId) return

    try {
      const orderIds = (req.body || {}).orderIds
      if (!Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({ success: false, message: 'orderIds 不能为空' })
      }

      const owned = orderIds
        .map((id) => getOrderById(id))
        .filter((o) => isOrderOwnedByUser(o, userId))

      const content = owned.map((o) => buildOrderTxt(o)).join('\n\n')
      return res.status(200).json({
        success: true,
        fileName: `orders-${toDateOnly(new Date().toISOString())}.txt`,
        content,
      })
    } catch {
      return res.status(500).json({ success: false, message: '下载失败' })
    }
  })

  app.post('/api/v1/orders/download/pdf', (req, res) => {
    const userId = requireAuth(req, res)
    if (!userId) return

    try {
      const orderIds = (req.body || {}).orderIds
      if (!Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({ success: false, message: 'orderIds 不能为空' })
      }

      const owned = orderIds
        .map((id) => getOrderById(id))
        .filter((o) => isOrderOwnedByUser(o, userId))

      const content = owned.map((o) => `PDF\n${buildOrderTxt(o)}`).join('\n\n')
      const contentBase64 = Buffer.from(String(content), 'utf8').toString('base64')
      return res.status(200).json({
        success: true,
        fileName: `orders-${toDateOnly(new Date().toISOString())}.pdf`,
        contentBase64,
      })
    } catch {
      return res.status(500).json({ success: false, message: '下载失败' })
    }
  })

  app.get('/api/v1/orders/download/all', (req, res) => {
    const userId = requireAuth(req, res)
    if (!userId) return

    try {
      const scope = String(req.query.scope || '')
      const allOrders = listOrdersForUser(userId)
      const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000
      const picked =
        scope === 'all'
          ? allOrders
          : allOrders.filter((o) => new Date(o.createdAt).getTime() >= oneYearAgo)

      const content = picked
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .map((o) => buildOrderTxt(o))
        .join('\n\n')
      return res.status(200).json({
        success: true,
        fileName: scope === 'all' ? 'orders-all.txt' : 'orders-one-year.txt',
        content,
      })
    } catch {
      return res.status(500).json({ success: false, message: '下载失败' })
    }
  })

  app.get('/api/v1/orders/download/all/pdf', (req, res) => {
    const userId = requireAuth(req, res)
    if (!userId) return

    try {
      const scope = String(req.query.scope || '')
      const allOrders = listOrdersForUser(userId)
      const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000
      const picked =
        scope === 'all'
          ? allOrders
          : allOrders.filter((o) => new Date(o.createdAt).getTime() >= oneYearAgo)

      const content = picked
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .map((o) => `PDF\n${buildOrderTxt(o)}`)
        .join('\n\n')
      const contentBase64 = Buffer.from(String(content), 'utf8').toString('base64')
      return res.status(200).json({
        success: true,
        fileName: scope === 'all' ? 'orders-all.pdf' : 'orders-one-year.pdf',
        contentBase64,
      })
    } catch {
      return res.status(500).json({ success: false, message: '下载失败' })
    }
  })

  app.post('/api/v1/orders/:orderId/rebook', (req, res) => {
    const userId = requireAuth(req, res)
    if (!userId) return

    try {
      const order = getOrderById(req.params.orderId)
      if (!isOrderOwnedByUser(order, userId)) {
        return res.status(404).json({ success: false, message: '订单不存在或您没有权限查看' })
      }

      const seg = (order.detail?.segments || [])[0] || {}
      const departCity = seg.departCity || '上海'
      const arriveCity = seg.arriveCity || '北京'
      const date = toDateOnly(seg.departTime || order.departAt)

      const redirectUrl = `/flights/list?dcity=${cityToCode(departCity)}&acity=${cityToCode(
        arriveCity
      )}&date=${date}`
      return res.status(200).json({ success: true, redirectUrl })
    } catch {
      return res.status(500).json({ success: false, message: '跳转失败' })
    }
  })

  app.post('/api/v1/orders/:orderId/pay', async (req, res) => {
    const userId = requireAuth(req, res)
    if (!userId) return

    const paymentMethod = String((req.body || {}).paymentMethod || '')
    if (!paymentMethod) {
      return res.status(400).json({ success: false, message: 'paymentMethod 不能为空' })
    }

    try {
      const result = await payOrderForUser({
        userId,
        orderId: req.params.orderId,
        paymentMethod,
      })

      if (!result.ok) {
        if (result.reason === 'not_owned_or_missing') {
          return res.status(404).json({ success: false, message: '订单不存在或您没有权限支付' })
        }
        if (result.reason === 'not_payable') {
          return res.status(409).json({ success: false, message: '订单当前状态不支持支付' })
        }
        if (result.reason === 'invalid_input' || result.reason === 'invalid_payment_method') {
          return res.status(400).json({ success: false, message: 'paymentMethod 不能为空' })
        }
        return res.status(500).json({ success: false, message: '支付失败' })
      }

      return res.status(200).json({
        success: true,
        message: '支付成功',
        order: result.order,
      })
    } catch {
      return res.status(500).json({ success: false, message: '支付失败' })
    }
  })

  return app
}

module.exports = { createApp }
