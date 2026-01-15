const crypto = require('crypto')

let boundStore = null

function bindUserStore(store) {
  boundStore = store
}

function createHttpError(statusCode, message) {
  const err = new Error(String(message || ''))
  err.statusCode = Number(statusCode) || 500
  err.exposeMessage = String(message || '')
  return err
}

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

function isValidGender(gender) {
  const s = String(gender || '').trim()
  return ['男', '女', '未知', ''].includes(s)
}

function normalizeString(value) {
  return String(value || '').trim()
}

async function getUserProfileById({ userId }) {
  if (!boundStore) throw createHttpError(500, 'User store not bound')
  const uid = String(userId || '')
  if (!uid) throw createHttpError(400, '请输入正确的个人信息')

  const existing = boundStore.userProfilesById?.get(uid)
  if (existing) return existing

  const user = boundStore.usersById?.get(uid)
  const next = {
    userId: uid,
    name: '',
    phoneNumber: String(user?.phoneNumber || ''),
    email: String(user?.email || ''),
    gender: '未知',
    countryRegion: 'CN',
    documentType: '身份证',
    documentNumber: '430802199001011234',
  }

  if (boundStore.userProfilesById) {
    boundStore.userProfilesById.set(uid, next)
  }
  return next
}

async function updateUserProfileById({ userId, profile }) {
  if (!boundStore) throw createHttpError(500, 'User store not bound')
  const uid = String(userId || '')
  if (!uid) throw createHttpError(400, '请输入正确的个人信息')

  const existing = await getUserProfileById({ userId: uid })
  const next = {
    ...existing,
    userId: uid,
    name: profile?.name !== undefined ? normalizeString(profile?.name) : existing.name,
    phoneNumber: profile?.phoneNumber !== undefined ? normalizeString(profile?.phoneNumber) : existing.phoneNumber,
    email: profile?.email !== undefined ? normalizeString(profile?.email) : existing.email,
    gender: profile?.gender !== undefined ? normalizeString(profile?.gender) : String(existing.gender || '未知'),
    countryRegion: profile?.countryRegion !== undefined ? normalizeString(profile?.countryRegion) : existing.countryRegion,
    documentType: profile?.documentType !== undefined ? normalizeString(profile?.documentType) : existing.documentType,
    documentNumber: profile?.documentNumber !== undefined ? normalizeString(profile?.documentNumber) : existing.documentNumber,
  }

  if (!next.name || !isValidPhoneNumber(next.phoneNumber) || !isValidEmail(next.email) || !isValidGender(next.gender)) {
    throw createHttpError(400, '请输入正确的个人信息')
  }
  if (!next.countryRegion || !next.documentType || !isValidIdNumber(next.documentNumber)) {
    throw createHttpError(400, '请输入正确的个人信息')
  }

  if (boundStore.userProfilesById) {
    boundStore.userProfilesById.set(uid, next)
  }

  const user = boundStore.usersById?.get(uid)
  if (user) {
    const updatedUser = { ...user, phoneNumber: next.phoneNumber, email: next.email }
    boundStore.usersById.set(uid, updatedUser)
  }

  return next
}

async function listCommonTravelersByUser({ userId }) {
  if (!boundStore) throw createHttpError(500, 'User store not bound')
  const uid = String(userId || '')
  const list = boundStore.commonTravelersByUserId?.get(uid) || []
  return Array.isArray(list) ? list : []
}

async function searchCommonTravelersByUser({ userId, keyword }) {
  const list = await listCommonTravelersByUser({ userId })
  const kw = normalizeString(keyword)
  if (!kw) return list
  return list.filter((t) => String(t?.name || '').includes(kw) || String(t?.phoneNumber || '').includes(kw))
}

async function createCommonTraveler({ userId, traveler }) {
  if (!boundStore) throw createHttpError(500, 'User store not bound')
  const uid = String(userId || '')
  if (!uid) throw createHttpError(400, '请输入正确的常用旅客相关信息')

  const next = {
    travelerId: `t_${crypto.randomBytes(8).toString('hex')}`,
    name: normalizeString(traveler?.name),
    phoneNumber: normalizeString(traveler?.phoneNumber),
    documentType: normalizeString(traveler?.documentType),
    documentNumber: normalizeString(traveler?.documentNumber),
  }

  if (!next.name || !isValidPhoneNumber(next.phoneNumber) || !next.documentType || !isValidIdNumber(next.documentNumber)) {
    throw createHttpError(400, '请输入正确的常用旅客相关信息')
  }

  const prev = boundStore.commonTravelersByUserId?.get(uid) || []
  const list = Array.isArray(prev) ? prev : []
  const updated = [...list, next]
  if (boundStore.commonTravelersByUserId) {
    boundStore.commonTravelersByUserId.set(uid, updated)
  }

  return next
}

async function deleteCommonTraveler({ userId, travelerId }) {
  if (!boundStore) throw createHttpError(500, 'User store not bound')
  const uid = String(userId || '')
  const tid = String(travelerId || '')
  const prev = boundStore.commonTravelersByUserId?.get(uid) || []
  const list = Array.isArray(prev) ? prev : []
  const idx = list.findIndex((t) => String(t?.travelerId || '') === tid)
  if (idx < 0) throw createHttpError(404, '常用旅客不存在')

  const updated = [...list.slice(0, idx), ...list.slice(idx + 1)]
  boundStore.commonTravelersByUserId.set(uid, updated)
}

module.exports = {
  bindUserStore,
  getUserProfileById,
  updateUserProfileById,
  listCommonTravelersByUser,
  searchCommonTravelersByUser,
  createCommonTraveler,
  deleteCommonTraveler,
}
