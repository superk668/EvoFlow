const express = require('express')

const router = express.Router()

function requireAuth(req, res, next) {
  const header = req.headers.authorization
  if (typeof header !== 'string' || !header.startsWith('Bearer ') || header.trim() === 'Bearer') {
    return res.status(401).json({ error: '未登录' })
  }
  return next()
}

function isPastDate(dateStr) {
  if (typeof dateStr !== 'string') return true
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return true

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  const d = new Date(year, month - 1, day)
  if (Number.isNaN(d.getTime())) return true

  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return d.getTime() < todayStart.getTime()
}

const flights = [
  {
    flightId: 'FL-1',
    airlineName: 'EvoFlow 航空',
    flightNo: 'EF1234',
    from: 'BJS',
    to: 'SHA',
    departTime: '09:00',
    arriveTime: '11:15',
    lowestPrice: 999,
  },
]

const packagesByFlightId = new Map([
  [
    'FL-1',
    {
      priceVersion: 'pv-1',
      packages: [
        {
          packageId: 'PKG-1',
          name: '经济舱',
          price: 999,
        },
      ],
    },
  ],
])

router.get('/search', requireAuth, (req, res) => {
  const { from, to, departDate } = req.query

  if (typeof from !== 'string' || typeof to !== 'string' || typeof departDate !== 'string') {
    return res.status(400).json({ error: '参数不完整' })
  }
  if (isPastDate(departDate)) {
    return res.status(400).json({ error: '不可选择过去日期' })
  }

  const matched = flights.filter((f) => f.from === from && f.to === to)
  return res.status(200).json({ flights: matched, total: matched.length })
})

router.get('/:flightId/packages', (req, res) => {
  const { flightId } = req.params
  const data = packagesByFlightId.get(flightId)
  if (!data) {
    return res.status(404).json({ error: '航班不存在' })
  }
  return res.status(200).json({ packages: data.packages, priceVersion: data.priceVersion })
})

module.exports = router
