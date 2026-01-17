const express = require('express')

const router = express.Router()

const COOLDOWN_SECONDS = 60

const usersByPhoneNumber = new Map([
  [
    '13800138000',
    {
      userId: 'u-1',
      phoneNumber: '13800138000',
      password: 'Correct#123',
    },
  ],
])

const smsStateByKey = new Map()

const registerTokens = new Map([
  ['rt-1', { phoneNumber: '13800138001', used: false }],
  ['rt-2', { phoneNumber: '13800138001', used: false }],
  ['rt-3', { phoneNumber: '13800138002', used: false }],
])

function isValidChinaPhoneNumber(phoneNumber) {
  return typeof phoneNumber === 'string' && /^1\d{10}$/.test(phoneNumber)
}

function isValidPurpose(purpose) {
  return purpose === 'login' || purpose === 'register'
}

function isValidPassword(password) {
  if (typeof password !== 'string') return false
  if (password.length < 8 || password.length > 20) return false

  const hasLetter = /[A-Za-z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSymbol = /[^A-Za-z\d]/.test(password)

  return hasLetter && hasNumber && hasSymbol
}

function createToken(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function getSmsKey(phoneNumber, purpose) {
  return `${purpose}:${phoneNumber}`
}

router.post('/login/password', (req, res) => {
  const { account, password } = req.body ?? {}

  if (typeof account !== 'string' || account.trim() === '') {
    return res.status(400).json({ error: '请输入用户名' })
  }
  if (typeof password !== 'string' || password === '') {
    return res.status(400).json({ error: '请输入密码' })
  }

  const phoneNumber = account.trim()
  const user = usersByPhoneNumber.get(phoneNumber)
  if (!user || user.password !== password) {
    return res.status(401).json({ error: '用户名或密码不正确' })
  }

  return res.status(200).json({ userId: user.userId, token: createToken('t') })
})

router.post('/sms/send', (req, res) => {
  const { phoneNumber, purpose } = req.body ?? {}

  if (!isValidChinaPhoneNumber(phoneNumber)) {
    return res.status(400).json({ error: '手机号格式不正确，请重新输入' })
  }
  if (!isValidPurpose(purpose)) {
    return res.status(400).json({ error: '验证码用途不正确' })
  }

  const key = getSmsKey(phoneNumber, purpose)
  const now = Date.now()
  const existing = smsStateByKey.get(key)
  if (existing && now - existing.lastSentAtMs < COOLDOWN_SECONDS * 1000) {
    return res.status(429).json({ error: '验证码发送过于频繁' })
  }

  const verificationCode = '123456'
  smsStateByKey.set(key, {
    lastSentAtMs: now,
    verificationCode,
  })

  process.stdout.write(`[sms] purpose=${purpose} phone=${phoneNumber} code=${verificationCode}\n`)

  return res.status(200).json({ sent: true, cooldownSeconds: COOLDOWN_SECONDS })
})

router.post('/login/code', (req, res) => {
  const { phoneNumber, verificationCode } = req.body ?? {}

  if (!isValidChinaPhoneNumber(phoneNumber)) {
    return res.status(400).json({ error: '手机号格式不正确，请重新输入' })
  }
  if (typeof verificationCode !== 'string' || verificationCode.trim() === '') {
    return res.status(400).json({ error: '请输入验证码' })
  }

  const user = usersByPhoneNumber.get(phoneNumber)
  if (!user) {
    return res.status(404).json({ error: '该手机号未注册，请先注册' })
  }

  const smsState = smsStateByKey.get(getSmsKey(phoneNumber, 'login'))
  const expectedCode = smsState?.verificationCode ?? '123456'
  if (verificationCode !== expectedCode) {
    return res.status(401).json({ error: '验证码不正确' })
  }

  return res.status(200).json({ userId: user.userId, token: createToken('t') })
})

router.post('/register/verify-code', (req, res) => {
  const { phoneNumber, verificationCode } = req.body ?? {}

  if (!isValidChinaPhoneNumber(phoneNumber)) {
    return res.status(400).json({ error: '手机号格式不正确，请重新输入' })
  }
  if (typeof verificationCode !== 'string' || verificationCode.trim() === '') {
    return res.status(400).json({ error: '请输入验证码' })
  }
  if (usersByPhoneNumber.has(phoneNumber)) {
    return res.status(409).json({ error: '该手机号已注册，请直接登录' })
  }

  const smsState = smsStateByKey.get(getSmsKey(phoneNumber, 'register'))
  const expectedCode = smsState?.verificationCode ?? '123456'
  if (verificationCode !== expectedCode) {
    return res.status(401).json({ error: '验证码错误' })
  }

  const registerToken = createToken('rt')
  registerTokens.set(registerToken, { phoneNumber, used: false })
  return res.status(200).json({ registerToken })
})

router.post('/register/complete', (req, res) => {
  const { registerToken, password } = req.body ?? {}

  if (typeof registerToken !== 'string' || registerToken.trim() === '') {
    return res.status(400).json({ error: '注册令牌不能为空' })
  }
  if (!isValidPassword(password)) {
    return res.status(400).json({ error: '密码格式不正确' })
  }

  const tokenRecord = registerTokens.get(registerToken)
  if (!tokenRecord) {
    return res.status(401).json({ error: '注册令牌无效或过期' })
  }
  if (tokenRecord.used) {
    return res.status(409).json({ error: '重复注册' })
  }

  const { phoneNumber } = tokenRecord
  if (usersByPhoneNumber.has(phoneNumber)) {
    tokenRecord.used = true
    return res.status(409).json({ error: '该手机号已注册' })
  }

  const userId = createToken('u')
  usersByPhoneNumber.set(phoneNumber, { userId, phoneNumber, password })
  tokenRecord.used = true

  return res.status(201).json({ userId })
})

module.exports = router
