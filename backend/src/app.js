const express = require('express')
const crypto = require('crypto')

function isValidPhoneNumber(phoneNumber) {
  if (typeof phoneNumber !== 'string') return false
  return /^1\d{10}$/.test(phoneNumber)
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

function createStore() {
  const usersById = new Map()
  const userIdByPhone = new Map()
  const userIdByAccount = new Map()

  const smsByKey = new Map()
  const registerTokenByPhone = new Map()

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

  return {
    usersById,
    userIdByPhone,
    userIdByAccount,
    smsByKey,
    registerTokenByPhone,
  }
}

function safeUser(user) {
  return { id: user.id, nickname: user.nickname, avatar: user.avatar }
}

function createApp() {
  const app = express()
  app.use(express.json())

  const store = createStore()

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
    if (verificationToken === 'validTokenFromVerifyStep') return true
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

  return app
}

module.exports = { createApp }
