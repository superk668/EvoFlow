const express = require('express')

function jsonError(res, status, error) {
  return res.status(status).json({ error })
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function isValidYmd(value) {
  if (typeof value !== 'string') return false
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [y, m, d] = value.split('-').map((v) => Number(v))
  const dt = new Date(Date.UTC(y, m - 1, d))
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
}

function validateIdNo(idType, idNo) {
  if (!isNonEmptyString(idType) || !isNonEmptyString(idNo)) {
    return { ok: false, reason: '证件类型或证件号不能为空。' }
  }

  const normalizedType = idType.trim().toLowerCase()
  const value = idNo.trim()

  if (normalizedType === 'id') {
    if (!/^\d{17}[\dXx]$/.test(value)) {
      return { ok: false, reason: '身份证号格式不合法。' }
    }
    return { ok: true }
  }

  if (normalizedType === 'passport') {
    if (!/^[A-Za-z0-9]{5,20}$/.test(value)) {
      return { ok: false, reason: '护照号格式不合法。' }
    }
    return { ok: true }
  }

  if (value.length < 4) {
    return { ok: false, reason: '证件号长度不合法。' }
  }
  return { ok: true }
}

function createBookingRouter() {
  const router = express.Router()

  const session = {
    bookingDraft: null,
    bookingStage: 0,
    travelers: null,
    services: null,
  }

  router.post('/booking/draft', (req, res) => {
    try {
      const { flightId, packageId, departDate, priceVersion } = req.body || {}
      if (!isNonEmptyString(flightId) || !isNonEmptyString(packageId) || !isValidYmd(departDate) || !isNonEmptyString(priceVersion)) {
        return jsonError(res, 400, 'Invalid input.')
      }

      session.bookingDraft = {
        flightId: flightId.trim(),
        packageId: packageId.trim(),
        departDate: departDate.trim(),
        priceVersion: priceVersion.trim(),
      }

      session.bookingStage = 1

      return res.status(201).json({ success: true, bookingDraft: session.bookingDraft })
    } catch {
      return jsonError(res, 500, 'Storage error.')
    }
  })

  router.get('/booking/draft', (req, res) => {
    try {
      if (!session.bookingDraft) {
        return jsonError(res, 404, 'Booking draft not found.')
      }
      return res.status(200).json({ bookingDraft: session.bookingDraft, bookingStage: session.bookingStage })
    } catch {
      return jsonError(res, 500, 'Storage error.')
    }
  })

  router.put('/booking/travelers', (req, res) => {
    try {
      const { passengers, contact } = req.body || {}
      if (!Array.isArray(passengers) || !contact || typeof contact !== 'object') {
        return jsonError(res, 400, 'Validation failed.')
      }

      for (const p of passengers) {
        const idType = p?.idType
        const idNo = p?.idNo
        const check = validateIdNo(idType, idNo)
        if (!check.ok) {
          return jsonError(res, 400, check.reason)
        }
      }

      session.travelers = { passengers, contact }
      session.bookingStage = Math.max(session.bookingStage, 2)
      return res.status(200).json({ success: true })
    } catch {
      return jsonError(res, 500, 'Storage error.')
    }
  })

  router.get('/booking/travelers', (req, res) => {
    try {
      return res.status(200).json({ travelers: session.travelers, bookingStage: session.bookingStage })
    } catch {
      return jsonError(res, 500, 'Storage error.')
    }
  })

  router.put('/booking/services', (req, res) => {
    try {
      const { selectedServices, priceBreakdown } = req.body || {}
      if (!Array.isArray(selectedServices) || !Array.isArray(priceBreakdown)) {
        return jsonError(res, 400, 'Invalid input.')
      }

      session.services = { selectedServices, priceBreakdown }
      session.bookingStage = Math.max(session.bookingStage, 3)
      return res.status(200).json({ success: true })
    } catch {
      return jsonError(res, 500, 'Storage error.')
    }
  })

  router.get('/booking/services', (req, res) => {
    try {
      return res.status(200).json({ services: session.services, bookingStage: session.bookingStage })
    } catch {
      return jsonError(res, 500, 'Storage error.')
    }
  })

  return router
}

module.exports = {
  createBookingRouter,
}
