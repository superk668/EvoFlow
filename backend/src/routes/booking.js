const express = require('express')

const router = express.Router()

const drafts = new Map()

function requireAuth(req, res, next) {
  const header = req.headers.authorization
  if (typeof header !== 'string' || !header.startsWith('Bearer ') || header.trim() === 'Bearer') {
    return res.status(401).json({ error: '未登录' })
  }
  return next()
}

function isValidChinaPhoneNumber(phoneNumber) {
  return typeof phoneNumber === 'string' && /^1\d{10}$/.test(phoneNumber)
}

function isValidChinaIdCard(idNumber) {
  return typeof idNumber === 'string' && /^\d{17}[\dXx]$/.test(idNumber)
}

function getOrCreateDraft(bookingDraftId) {
  const existing = drafts.get(bookingDraftId)
  if (existing) return existing

  const created = {
    bookingDraftId,
    bookingStage: 1,
    paid: false,
    orderId: null,
    createdAtMs: Date.now(),
  }
  drafts.set(bookingDraftId, created)
  return created
}

router.post('/drafts', requireAuth, (req, res) => {
  const { flightId, packageId, departDate, priceVersion } = req.body ?? {}

  if (
    typeof flightId !== 'string' ||
    typeof packageId !== 'string' ||
    typeof departDate !== 'string' ||
    typeof priceVersion !== 'string' ||
    flightId.trim() === '' ||
    packageId.trim() === '' ||
    departDate.trim() === '' ||
    priceVersion.trim() === ''
  ) {
    return res.status(400).json({ error: '套餐信息异常' })
  }

  if (priceVersion === 'expired') {
    return res.status(409).json({ error: '价格已更新，请确认最新价格' })
  }

  const bookingDraftId = `DRAFT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
  drafts.set(bookingDraftId, {
    bookingDraftId,
    bookingStage: 1,
    flightId,
    packageId,
    departDate,
    priceVersion,
    passengers: [],
    contact: null,
    selectedServiceIds: [],
    priceSummary: null,
    paid: false,
    orderId: null,
    createdAtMs: Date.now(),
  })

  return res.status(201).json({ bookingDraftId, bookingStage: 1 })
})

router.get('/drafts/:bookingDraftId', requireAuth, (req, res) => {
  const draft = drafts.get(req.params.bookingDraftId)
  if (!draft) {
    return res.status(404).json({ error: '草稿不存在' })
  }
  return res.status(200).json(draft)
})

router.put('/drafts/:bookingDraftId/passengers-contact', requireAuth, (req, res) => {
  const { bookingDraftId } = req.params
  const { passengers, contact } = req.body ?? {}

  if (!Array.isArray(passengers) || passengers.length === 0) {
    return res.status(400).json({ error: '乘机人信息异常' })
  }

  for (const p of passengers) {
    if (p?.idType === 'id_card') {
      if (!isValidChinaIdCard(p?.idNumber)) {
        return res.status(400).json({ error: '证件号码格式不正确' })
      }
    }
  }

  if (!isValidChinaPhoneNumber(contact?.phoneNumber)) {
    return res.status(400).json({ error: '联系人手机号格式不正确' })
  }

  const draft = getOrCreateDraft(bookingDraftId)
  draft.passengers = passengers
  draft.contact = contact
  draft.bookingStage = 2

  return res.status(200).json({ bookingStage: draft.bookingStage })
})

router.get('/drafts/:bookingDraftId/services', requireAuth, (req, res) => {
  const draft = getOrCreateDraft(req.params.bookingDraftId)
  return res.status(200).json({ services: [{ serviceId: 'SVC-1', name: '值机礼包', price: 20 }], selectedServiceIds: draft.selectedServiceIds })
})

router.put('/drafts/:bookingDraftId/services', requireAuth, (req, res) => {
  const { bookingDraftId } = req.params
  const { selectedServiceIds } = req.body ?? {}

  if (!Array.isArray(selectedServiceIds)) {
    return res.status(400).json({ error: '服务选择信息异常' })
  }
  if (selectedServiceIds.includes('SVC-OFFLINE')) {
    return res.status(400).json({ error: '服务暂不可用' })
  }

  const draft = getOrCreateDraft(bookingDraftId)
  draft.selectedServiceIds = selectedServiceIds
  draft.bookingStage = 3
  draft.priceSummary = { totalAmount: 1000, currency: 'CNY' }

  return res.status(200).json({ bookingStage: draft.bookingStage, priceSummary: draft.priceSummary })
})

router.post('/drafts/:bookingDraftId/pay', requireAuth, (req, res) => {
  const { bookingDraftId } = req.params

  if (bookingDraftId === 'DRAFT-TIMEOUT') {
    return res.status(408).json({ error: '超出时间，请重新开始订单' })
  }
  if (bookingDraftId === 'DRAFT-FAIL') {
    return res.status(500).json({ error: '支付失败，请稍后重试' })
  }

  const { paymentMethod, newCard } = req.body ?? {}
  if (paymentMethod === 'new_card') {
    const ok =
      typeof newCard?.cardNumber === 'string' &&
      newCard.cardNumber.trim() !== '' &&
      typeof newCard?.name === 'string' &&
      newCard.name.trim() !== '' &&
      typeof newCard?.expiry === 'string' &&
      newCard.expiry.trim() !== '' &&
      typeof newCard?.cvv === 'string' &&
      newCard.cvv.trim() !== ''
    if (!ok) {
      return res.status(400).json({ error: '银行卡信息不完整' })
    }
  }

  const draft = getOrCreateDraft(bookingDraftId)
  draft.paid = true
  return res.status(200).json({ paid: true })
})

router.post('/drafts/:bookingDraftId/complete', requireAuth, (req, res) => {
  const { bookingDraftId } = req.params

  if (bookingDraftId === 'DRAFT-CREATE-FAIL') {
    return res.status(500).json({ error: '订单创建失败，稍后查看订单中心' })
  }

  const draft = getOrCreateDraft(bookingDraftId)
  if (!draft.orderId) {
    draft.orderId = `ORD-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
  }

  const createdAt = new Date().toISOString()
  const totalAmount = typeof draft.priceSummary?.totalAmount === 'number' ? draft.priceSummary.totalAmount : 1000

  return res.status(200).json({
    orderId: draft.orderId,
    status: 'PAID',
    createdAt,
    totalAmount,
  })
})

module.exports = router
