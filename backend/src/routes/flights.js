const express = require('express')

function jsonError(res, status, error) {
  return res.status(status).json({ error })
}

function parsePositiveInt(value) {
  const num = Number(value)
  if (!Number.isFinite(num)) return null
  if (!Number.isInteger(num)) return null
  if (num <= 0) return null
  return num
}

function isValidYmd(value) {
  if (typeof value !== 'string') return false
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [y, m, d] = value.split('-').map((v) => Number(v))
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return false
  if (m < 1 || m > 12) return false
  if (d < 1 || d > 31) return false
  const dt = new Date(Date.UTC(y, m - 1, d))
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
}

function buildFlight({ idx, from, to, departDate }) {
  const departAt = `${departDate}T0${8 + idx}:00:00.000Z`
  const arriveAt = `${departDate}T${10 + idx}:10:00.000Z`
  const flightId = `f_${from}_${to}_${departDate}_${idx}`
  const airlineName = idx % 2 === 0 ? '中国国航' : '东方航空'
  const flightNo = (idx % 2 === 0 ? 'CA' : 'MU') + String(1200 + idx)
  const basePrice = 420 + idx * 60
  return {
    flightId,
    airlineName,
    flightNo,
    departAt,
    arriveAt,
    departAirport: `${from}机场T1`,
    arriveAirport: `${to}机场T1`,
    lowestPrice: basePrice,
    packages: [
      {
        packageId: `${flightId}_p0`,
        name: '特惠经济舱',
        price: basePrice,
        baggage: '托运行李额20KG',
        refundPolicy: '退改¥200起',
        priceVersion: `v${idx}_0`,
      },
      {
        packageId: `${flightId}_p1`,
        name: '优选经济舱',
        price: basePrice + 80,
        baggage: '托运行李额25KG',
        refundPolicy: '退改¥150起',
        priceVersion: `v${idx}_1`,
      },
    ],
  }
}

function createFlightsRouter() {
  const router = express.Router()

  router.get('/flights', (req, res) => {
    try {
      const {
        from,
        to,
        departDate,
        sort = '',
        page = '1',
        pageSize = '10',
      } = req.query || {}

      if (typeof from !== 'string' || typeof to !== 'string' || !from.trim() || !to.trim()) {
        return jsonError(res, 400, 'Invalid query.')
      }
      if (!isValidYmd(departDate)) {
        return jsonError(res, 400, 'Invalid query.')
      }

      const pageNum = parsePositiveInt(page)
      const pageSizeNum = parsePositiveInt(pageSize)
      if (!pageNum || !pageSizeNum) {
        return jsonError(res, 400, 'Invalid query.')
      }

      if (departDate >= '2099-01-01') {
        return res.status(200).json({ items: [], page: pageNum, pageSize: pageSizeNum, total: 0 })
      }

      let items = Array.from({ length: 6 }).map((_, idx) => buildFlight({ idx, from, to, departDate }))
      if (sort === 'price') {
        items = items.sort((a, b) => a.lowestPrice - b.lowestPrice)
      } else if (sort === 'departAt') {
        items = items.sort((a, b) => (a.departAt < b.departAt ? -1 : 1))
      }

      const total = items.length
      const start = (pageNum - 1) * pageSizeNum
      const paged = items.slice(start, start + pageSizeNum)
      return res.status(200).json({ items: paged, page: pageNum, pageSize: pageSizeNum, total })
    } catch {
      return jsonError(res, 500, 'Search failed.')
    }
  })

  return router
}

module.exports = {
  createFlightsRouter,
}
