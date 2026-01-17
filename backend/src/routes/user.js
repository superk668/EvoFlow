const express = require('express')

const router = express.Router()

function requireAuth(req, res, next) {
  const header = req.headers.authorization
  if (typeof header !== 'string' || !header.startsWith('Bearer ') || header.trim() === 'Bearer') {
    return res.status(401).json({ error: '未登录' })
  }
  return next()
}

function maskPhoneNumber(phoneNumber) {
  if (typeof phoneNumber !== 'string' || phoneNumber.length < 11) return ''
  return `${phoneNumber.slice(0, 3)}****${phoneNumber.slice(-4)}`
}

function isValidNickname(nickname) {
  return typeof nickname === 'string' && nickname.trim().length > 0 && nickname.trim().length <= 20
}

function isValidDate(dateStr) {
  return typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
}

const profileState = {
  phoneNumber: '13800138000',
  nickname: '用户',
  version: 'v1',
}

const travellers = new Map([
  [
    'T-1',
    {
      travellerId: 'T-1',
      chineseName: '张三',
      lastName: 'Zhang',
      firstName: 'San',
      idDocumentType: 'ID',
      idDocumentNumber: 'A1',
      birthday: '1990-01-01',
    },
  ],
])

router.get('/profile', requireAuth, (_req, res) => {
  return res.status(200).json({
    profile: {
      maskedPhone: maskPhoneNumber(profileState.phoneNumber),
      emailStatusText: '未绑定',
      nicknameReviewStatus: '审核通过',
    },
  })
})

router.put('/profile', requireAuth, (req, res) => {
  const { nickname, version } = req.body ?? {}

  if (!isValidNickname(nickname)) {
    return res.status(400).json({ error: '昵称不合法' })
  }
  if (typeof version !== 'string' || version.trim() === '') {
    return res.status(400).json({ error: '版本号不能为空' })
  }
  if (version !== profileState.version) {
    return res.status(409).json({ error: '版本冲突' })
  }

  profileState.nickname = nickname.trim()
  profileState.version = `v${Date.now()}`
  return res.status(200).json({ ok: true, version: profileState.version })
})

router.get('/common-travellers', requireAuth, (req, res) => {
  const { keyword } = req.query
  if (typeof keyword === 'string' && keyword.trim() !== '') {
    const hasLetterOrChinese = /[A-Za-z\u4e00-\u9fa5]/.test(keyword)
    if (!hasLetterOrChinese) {
      return res.status(400).json({ error: '请输入合法的姓名关键字' })
    }
  }

  return res.status(200).json({ travellers: Array.from(travellers.values()) })
})

router.get('/common-travellers/:travellerId', requireAuth, (req, res) => {
  const t = travellers.get(req.params.travellerId)
  if (!t) {
    return res.status(404).json({ error: '常用旅客不存在' })
  }
  return res.status(200).json({ traveller: t })
})

router.post('/common-travellers', requireAuth, (req, res) => {
  const { traveller } = req.body ?? {}
  const chineseName = typeof traveller?.chineseName === 'string' ? traveller.chineseName.trim() : ''
  const lastName = typeof traveller?.lastName === 'string' ? traveller.lastName.trim() : ''
  const firstName = typeof traveller?.firstName === 'string' ? traveller.firstName.trim() : ''

  if (chineseName === '' && (lastName === '' || firstName === '')) {
    return res.status(400).json({ error: '中文名与英文名两者至少填写一项' })
  }

  const travellerId = `T-${Math.random().toString(36).slice(2, 7).toUpperCase()}`
  travellers.set(travellerId, { travellerId, ...traveller })
  return res.status(201).json({ travellerId })
})

router.put('/common-travellers/:travellerId', requireAuth, (req, res) => {
  const { traveller } = req.body ?? {}

  if (traveller?.birthday !== undefined && traveller?.birthday !== null) {
    if (!isValidDate(traveller.birthday)) {
      return res.status(400).json({ error: '日期格式应为 yyyy-MM-dd' })
    }
  }
  if (traveller?.idDocumentNumber === 'DUPLICATE') {
    return res.status(409).json({ error: '证件号已存在' })
  }

  const existing = travellers.get(req.params.travellerId)
  if (!existing) {
    return res.status(404).json({ error: '常用旅客不存在' })
  }

  const updated = { ...existing, ...traveller }
  travellers.set(req.params.travellerId, updated)
  return res.status(200).json({ traveller: updated })
})

router.delete('/common-travellers', requireAuth, (req, res) => {
  const { travellerIds } = req.body ?? {}
  if (!Array.isArray(travellerIds) || travellerIds.length === 0) {
    return res.status(400).json({ error: '请先选择要删除的记录' })
  }

  let deletedCount = 0
  for (const id of travellerIds) {
    if (travellers.delete(id)) deletedCount += 1
  }

  return res.status(200).json({ deletedCount })
})

module.exports = router
