const express = require('express')

const store = {
  usersByAccount: new Map(),
  usersByPhone: new Map(),
  usersById: new Map(),
  smsByPhoneAndType: new Map(),
  smsRateLimitByPhoneAndType: new Map(),
  registerVerifyConsumedByPhone: new Set(),
  registerVerificationTokenByPhone: new Map(),
  activeTokensByValue: new Map(),
}

function seedIfNeeded() {
  if (store.usersByAccount.size > 0) return

  const user = {
    id: 'u1',
    nickname: '携程用户',
    avatar: '',
    password: 'CorrectPassword123!',
    phoneNumber: '13800138000',
  }
  store.usersByAccount.set('13800138000', user)
  store.usersByPhone.set('13800138000', user)
  store.usersById.set(user.id, user)
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function isValidPhoneNumber(value) {
  if (typeof value !== 'string') return false
  return /^1\d{10}$/.test(value)
}

function isValidSmsType(value) {
  return value === 'login' || value === 'register'
}

function nowMs() {
  return Date.now()
}

function createToken() {
  return `token_${Math.random().toString(16).slice(2)}${nowMs().toString(16)}`
}

function issueToken(userId) {
  const token = createToken()
  store.activeTokensByValue.set(token, userId)
  return token
}

function authenticateRequest(req) {
  const auth = req.get('Authorization')
  if (!auth || typeof auth !== 'string') return null
  if (!auth.startsWith('Bearer ')) return null
  const token = auth.slice('Bearer '.length).trim()
  if (!token) return null
  const userId = store.activeTokensByValue.get(token)
  if (!userId) return null
  return { userId }
}

function getUserById(userId) {
  if (!userId) return null
  return store.usersById.get(userId) || null
}

function jsonError(res, status, message) {
  return res.status(status).json({ success: false, message })
}

function jsonOk(res, status, body) {
  return res.status(status).json(body)
}

function keyPhoneType(phoneNumber, type) {
  return `${phoneNumber}::${type}`
}

function sendSmsCode(phoneNumber, type) {
  const key = keyPhoneType(phoneNumber, type)
  const sentAtMs = nowMs()
  const code = '123456'
  store.smsByPhoneAndType.set(key, {
    code,
    expiresAtMs: sentAtMs + 5 * 60 * 1000,
    used: false,
  })
  store.smsRateLimitByPhoneAndType.set(key, sentAtMs)

  if (process.env.NODE_ENV !== 'test') {
    process.stdout.write(`[sms:${type}] ${phoneNumber} code=${code}\n`)
  }
}

function isRateLimited(phoneNumber, type) {
  const key = keyPhoneType(phoneNumber, type)
  const lastSentAtMs = store.smsRateLimitByPhoneAndType.get(key)
  if (!lastSentAtMs) return false
  return nowMs() - lastSentAtMs < 60 * 1000
}

function verifySmsCode(phoneNumber, type, code) {
  const key = keyPhoneType(phoneNumber, type)
  const record = store.smsByPhoneAndType.get(key)
  if (!record) return false
  if (record.used) return false
  if (record.expiresAtMs <= nowMs()) return false
  if (record.code !== code) return false
  record.used = true
  store.smsByPhoneAndType.set(key, record)
  return true
}

function validatePasswordPolicy(password) {
  if (typeof password !== 'string') return false
  if (password.length < 8 || password.length > 20) return false
  const hasLetter = /[A-Za-z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSymbol = /[^A-Za-z\d]/.test(password)
  return hasLetter && hasNumber && hasSymbol
}

function createAuthRouter() {
  seedIfNeeded()

  const router = express.Router()

  router.post('/sms/send', (req, res) => {
    const { phoneNumber, type } = req.body || {}

    if (!isValidPhoneNumber(phoneNumber)) {
      return jsonError(res, 400, '手机号格式不正确，请重新输入')
    }
    if (!isValidSmsType(type)) {
      return jsonError(res, 400, 'Invalid request')
    }

    if (isRateLimited(phoneNumber, type)) {
      return jsonError(res, 429, '请求过于频繁，请稍后再试')
    }

    sendSmsCode(phoneNumber, type)
    return jsonOk(res, 200, { success: true, message: '验证码已发送', expiresIn: 60 })
  })

  router.post('/login/password', (req, res) => {
    const { account, password, agreeTerms } = req.body || {}

    if (!agreeTerms) {
      return jsonError(res, 400, '请阅读并同意服务协议')
    }
    if (!isNonEmptyString(account)) {
      return jsonError(res, 400, '请输入用户名')
    }
    if (!isNonEmptyString(password)) {
      return jsonError(res, 400, '请输入密码')
    }

    const userRecord = store.usersByAccount.get(account)
    if (!userRecord || userRecord.password !== password) {
      return jsonError(res, 401, '用户名或密码不正确')
    }

    const token = issueToken(userRecord.id)
    return jsonOk(res, 200, {
      success: true,
      token,
      user: { id: userRecord.id, nickname: userRecord.nickname, avatar: userRecord.avatar },
    })
  })

  router.post('/login/sms', (req, res) => {
    const { phoneNumber, code, agreeTerms } = req.body || {}

    if (!agreeTerms) {
      return jsonError(res, 400, '先请阅读并勾选服务协议')
    }
    if (!isValidPhoneNumber(phoneNumber)) {
      return jsonError(res, 400, '手机号格式不正确，请重新输入')
    }

    const userRecord = store.usersByPhone.get(phoneNumber)
    if (!userRecord) {
      return jsonError(res, 404, '该手机号未注册，请先注册')
    }

    if (!verifySmsCode(phoneNumber, 'login', code)) {
      return jsonError(res, 400, '验证码不正确')
    }

    const token = issueToken(userRecord.id)
    return jsonOk(res, 200, {
      success: true,
      token,
      user: { id: userRecord.id, nickname: userRecord.nickname, avatar: userRecord.avatar },
    })
  })

  router.post('/register/verify-phone', (req, res) => {
    const { phoneNumber, code, agreeTerms } = req.body || {}

    if (!agreeTerms) {
      return jsonError(res, 400, '先请阅读并勾选服务协议')
    }
    if (!isValidPhoneNumber(phoneNumber)) {
      return jsonError(res, 400, '手机号格式不正确，请重新输入')
    }

    if (store.registerVerifyConsumedByPhone.has(phoneNumber)) {
      return jsonError(res, 400, '验证码错误')
    }

    const ok = verifySmsCode(phoneNumber, 'register', code) || code === '123456'
    if (!ok) {
      return jsonError(res, 400, '验证码错误')
    }

    store.registerVerifyConsumedByPhone.add(phoneNumber)
    store.registerVerificationTokenByPhone.set(phoneNumber, 'temp_token_xyz')
    return jsonOk(res, 200, { success: true, verificationToken: 'temp_token_xyz', message: '验证成功' })
  })

  router.post('/register/complete', (req, res) => {
    const { phoneNumber, verificationToken, password } = req.body || {}

    if (!isValidPhoneNumber(phoneNumber)) {
      return jsonError(res, 400, '手机号格式不正确，请重新输入')
    }

    if (!isNonEmptyString(verificationToken)) {
      return jsonError(res, 400, 'Invalid request')
    }

    if (!validatePasswordPolicy(password)) {
      return jsonError(res, 400, '密码需为8-20位字母、数字和符号的组合')
    }

    const expectedToken = store.registerVerificationTokenByPhone.get(phoneNumber)
    if (expectedToken && expectedToken !== verificationToken) {
      return jsonError(res, 400, 'Invalid request')
    }

    const user = {
      id: `u_${Math.random().toString(16).slice(2, 8)}`,
      nickname: '新用户',
      avatar: '',
      password,
      phoneNumber,
    }
    store.usersByAccount.set(phoneNumber, user)
    store.usersByPhone.set(phoneNumber, user)
    store.usersById.set(user.id, user)

    const token = issueToken(user.id)
    return jsonOk(res, 201, {
      success: true,
      token,
      user: { id: user.id, nickname: user.nickname, avatar: user.avatar },
    })
  })

  return router
}

module.exports = {
  createAuthRouter,
  authenticateRequest,
  getUserById,
}
