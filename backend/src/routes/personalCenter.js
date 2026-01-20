const express = require('express')
const { authenticateRequest, getUserById } = require('./auth')

function jsonError(res, status, error) {
  return res.status(status).json({ error })
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function isValidPhoneNumber(value) {
  if (typeof value !== 'string') return false
  return /^1\d{10}$/.test(value)
}

function isValidGender(value) {
  return value === 'male' || value === 'female'
}

function isValidBirthday(value) {
  if (value == null || value === '') return true
  if (typeof value !== 'string') return false
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const d = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(d.getTime())) return false
  return d.toISOString().slice(0, 10) === value
}

function normalizeIdType(value) {
  if (value == null || value === '') return 'idcard'
  if (value === 'id') return 'id'
  if (value === 'idcard') return 'idcard'
  if (value === 'passport') return 'passport'
  return null
}

function isValidIdNo(idType, idNo) {
  if (typeof idNo !== 'string') return false
  const trimmed = idNo.trim()
  if (!trimmed) return false
  if (idType === 'passport') {
    return /^[A-Za-z0-9]{5,17}$/.test(trimmed)
  }
  return /^(\d{15}|\d{17}[\dXx])$/.test(trimmed)
}

function createTravelerId() {
  return `t_${Math.random().toString(16).slice(2, 10)}`
}

function createPersonalCenterRouter() {
  const store = {
    profileByUserId: new Map(),
    travelersById: new Map(),
    deletedTravelerIds: new Set(),
  }

  const router = express.Router()

  function ensureProfile(userId) {
    const existing = store.profileByUserId.get(userId)
    if (existing) return existing

    const user = getUserById(userId)
    const profile = {
      userId,
      phoneNumber: user?.phoneNumber || '',
      email: '',
      nickname: user?.nickname || '',
      fullName: user?.nickname || '',
      gender: '',
      birthday: '',
    }
    store.profileByUserId.set(userId, profile)
    return profile
  }

  router.get('/user/profile', (req, res) => {
    const authUser = authenticateRequest(req)
    if (!authUser) return jsonError(res, 401, 'Unauthorized.')

    const profile = ensureProfile(authUser.userId)
    return res.status(200).json(profile)
  })

  router.put('/user/profile', (req, res) => {
    const authUser = authenticateRequest(req)
    if (!authUser) return jsonError(res, 401, 'Unauthorized.')

    const profile = ensureProfile(authUser.userId)

    const { nickname, fullName, gender, birthday } = req.body || {}
    if (!isNonEmptyString(nickname) || !isNonEmptyString(fullName) || !isValidGender(gender) || !isValidBirthday(birthday)) {
      return jsonError(res, 400, 'Invalid input.')
    }

    const next = {
      ...profile,
      nickname: nickname.trim(),
      fullName: fullName.trim(),
      gender,
      birthday: birthday ? birthday.trim() : '',
    }
    store.profileByUserId.set(authUser.userId, next)
    return res.status(200).json({ success: true, message: '个人信息已更新', profile: next })
  })

  router.get('/user/travelers', (req, res) => {
    const authUser = authenticateRequest(req)
    if (!authUser) return jsonError(res, 401, 'Unauthorized.')

    const keywordRaw = (req.query || {}).keyword
    if (keywordRaw != null && typeof keywordRaw !== 'string') {
      return jsonError(res, 400, 'Invalid query.')
    }
    const keyword = typeof keywordRaw === 'string' ? keywordRaw.trim() : ''

    const allItems = Array.from(store.travelersById.values())
      .filter((t) => t.ownerUserId === authUser.userId)
      .filter((t) => !store.deletedTravelerIds.has(t.travelerId))

    const items = keyword
      ? allItems.filter((t) => (t.cnName || '').includes(keyword) || (t.phone || '').includes(keyword))
      : allItems

    return res.status(200).json({ items })
  })

  router.post('/user/travelers', (req, res) => {
    const authUser = authenticateRequest(req)
    if (!authUser) return jsonError(res, 401, 'Unauthorized.')

    const body = req.body || {}
    const cnName = typeof body.cnName === 'string' ? body.cnName.trim() : ''
    const enName = typeof body.enName === 'string' ? body.enName.trim() : ''
    const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
    const idType = normalizeIdType(body.idType)
    const idNo = typeof body.idNo === 'string' ? body.idNo.trim() : ''
    const nationality = typeof body.nationality === 'string' ? body.nationality.trim() : ''
    const gender = typeof body.gender === 'string' ? body.gender.trim() : ''
    const birthday = typeof body.birthday === 'string' ? body.birthday.trim() : ''
    const frequentFlyerNo = typeof body.frequentFlyerNo === 'string' ? body.frequentFlyerNo.trim() : ''

    if (!cnName || !idType || !isValidIdNo(idType, idNo)) {
      return jsonError(res, 400, 'Invalid input.')
    }
    if (phone && !isValidPhoneNumber(phone)) {
      return jsonError(res, 400, 'Invalid input.')
    }

    const conflict = Array.from(store.travelersById.values()).some((t) => {
      if (t.ownerUserId !== authUser.userId) return false
      if (store.deletedTravelerIds.has(t.travelerId)) return false
      return t.idType === idType && t.idNo === idNo
    })
    if (conflict) {
      return jsonError(res, 409, 'Conflict.')
    }

    const travelerId = createTravelerId()
    store.travelersById.set(travelerId, {
      travelerId,
      ownerUserId: authUser.userId,
      cnName,
      enName,
      phone,
      idType,
      idNo,
      nationality,
      gender,
      birthday,
      frequentFlyerNo,
    })

    return res.status(201).json({ travelerId })
  })

  router.put('/user/travelers/:travelerId', (req, res) => {
    const authUser = authenticateRequest(req)
    if (!authUser) return jsonError(res, 401, 'Unauthorized.')

    const { travelerId } = req.params
    const current = store.travelersById.get(travelerId)
    if (!current || store.deletedTravelerIds.has(travelerId) || current.ownerUserId !== authUser.userId) {
      return jsonError(res, 404, 'Traveler not found.')
    }

    const body = req.body || {}
    const cnName = typeof body.cnName === 'string' ? body.cnName.trim() : ''
    const enName = typeof body.enName === 'string' ? body.enName.trim() : ''
    const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
    const idType = normalizeIdType(body.idType)
    const idNo = typeof body.idNo === 'string' ? body.idNo.trim() : ''
    const nationality = typeof body.nationality === 'string' ? body.nationality.trim() : ''
    const gender = typeof body.gender === 'string' ? body.gender.trim() : ''
    const birthday = typeof body.birthday === 'string' ? body.birthday.trim() : ''
    const frequentFlyerNo = typeof body.frequentFlyerNo === 'string' ? body.frequentFlyerNo.trim() : ''

    if (!cnName || !idType || !isValidIdNo(idType, idNo)) {
      return jsonError(res, 400, 'Invalid input.')
    }
    if (phone && !isValidPhoneNumber(phone)) {
      return jsonError(res, 400, 'Invalid input.')
    }

    const conflict = Array.from(store.travelersById.values()).some((t) => {
      if (t.ownerUserId !== authUser.userId) return false
      if (store.deletedTravelerIds.has(t.travelerId)) return false
      if (t.travelerId === travelerId) return false
      return t.idType === idType && t.idNo === idNo
    })
    if (conflict) {
      return jsonError(res, 409, 'Conflict.')
    }

    store.travelersById.set(travelerId, {
      travelerId,
      ownerUserId: authUser.userId,
      cnName,
      enName,
      phone,
      idType,
      idNo,
      nationality,
      gender,
      birthday,
      frequentFlyerNo,
    })
    return res.status(200).json({ travelerId })
  })

  router.delete('/user/travelers', (req, res) => {
    const authUser = authenticateRequest(req)
    if (!authUser) return jsonError(res, 401, 'Unauthorized.')

    const { ids } = req.body || {}
    if (!Array.isArray(ids)) {
      return jsonError(res, 400, 'Invalid input.')
    }

    let deletedCount = 0
    for (const id of ids) {
      if (typeof id !== 'string') continue
      const traveler = store.travelersById.get(id)
      if (!traveler) continue
      if (traveler.ownerUserId !== authUser.userId) continue
      if (store.deletedTravelerIds.has(id)) continue
      store.deletedTravelerIds.add(id)
      deletedCount += 1
    }

    return res.status(200).json({ deletedCount })
  })

  return router
}

module.exports = {
  createPersonalCenterRouter,
}
