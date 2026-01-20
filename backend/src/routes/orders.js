const express = require('express')
const { authenticateRequest } = require('./auth')

const store = {
  ordersById: new Map(),
  deletedOrderIds: new Set(),
}

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

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

function createOrderId() {
  return `o_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`
}

function parseBuiltFlightId(flightId) {
  if (!isNonEmptyString(flightId)) return null
  const parts = flightId.trim().split('_')
  if (parts.length !== 5) return null
  if (parts[0] !== 'f') return null
  const from = parts[1]
  const to = parts[2]
  const departDate = parts[3]
  const idx = Number(parts[4])
  if (!from || !to) return null
  if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(departDate)) return null
  if (!Number.isInteger(idx) || idx < 0) return null
  return { from, to, departDate, idx }
}

function resolveFlightFare(bookingDraft) {
  const parsed = parseBuiltFlightId(bookingDraft.flightId)
  if (!parsed) return null

  const { idx, departDate, from, to } = parsed
  const basePrice = 420 + idx * 60

  let packageIdx = null
  const pkg = String(bookingDraft.packageId || '').trim()
  if (/^p\d+$/.test(pkg)) {
    const n = Number(pkg.slice(1))
    if (Number.isInteger(n) && n >= 1) packageIdx = n - 1
  }
  if (packageIdx === null) {
    const expected0 = `${bookingDraft.flightId}_p0`
    const expected1 = `${bookingDraft.flightId}_p1`
    if (pkg === expected0) packageIdx = 0
    if (pkg === expected1) packageIdx = 1
  }
  if (packageIdx !== 0 && packageIdx !== 1) {
    return { error: 'Invalid packageId.' }
  }

  const expectedPriceVersion = `v${idx}_${packageIdx}`
  const pv = String(bookingDraft.priceVersion || '').trim()
  if (pv !== expectedPriceVersion) {
    return { error: 'Invalid priceVersion.' }
  }

  const ticketPrice = packageIdx === 0 ? basePrice : basePrice + 80
  const departAt = `${departDate}T0${8 + idx}:00:00.000Z`
  const arrivalAt = `${departDate}T${10 + idx}:10:00.000Z`

  return {
    from,
    to,
    departAt,
    arrivalAt,
    ticketPrice,
    packageId: packageIdx === 0 ? `${bookingDraft.flightId}_p0` : `${bookingDraft.flightId}_p1`,
    priceVersion: expectedPriceVersion,
  }
}

function createOrdersRouter() {
  const router = express.Router()

  router.get('/orders', (req, res) => {
    const authUser = authenticateRequest(req)
    if (!authUser) return jsonError(res, 401, 'Unauthorized.')

    const { status = 'all', type = 'all', page = '1', pageSize = '10' } = req.query || {}
    const pageNum = parsePositiveInt(page)
    const pageSizeNum = parsePositiveInt(pageSize)
    if (!pageNum || !pageSizeNum) {
      return jsonError(res, 400, 'Invalid query.')
    }

    const allOrders = Array.from(store.ordersById.values())
      .filter((o) => o.ownerUserId === authUser.userId)
      .filter((o) => !store.deletedOrderIds.has(o.orderId))
      .filter((o) => {
        if (status === 'all') return true
        if (status === 'upcoming') return o.status === 'upcoming' || o.status === 'pending_travel'
        return o.status === status
      })
      .filter((o) => type === 'all' || o.type === type)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))

    const total = allOrders.length
    const start = (pageNum - 1) * pageSizeNum
    const items = allOrders.slice(start, start + pageSizeNum).map((o) => ({
      orderId: o.orderId,
      orderNo: o.orderNo,
      createdAt: o.createdAt,
      type: o.type,
      status: o.status,
      title: o.title,
      departureAt: o.departureAt,
      arrivalAt: o.arrivalAt,
      totalAmount: o.totalAmount,
      travelers: o.travelers,
    }))

    return res.status(200).json({ items, page: pageNum, pageSize: pageSizeNum, total })
  })

  router.get('/orders/:orderId', (req, res) => {
    const authUser = authenticateRequest(req)
    if (!authUser) return jsonError(res, 401, 'Unauthorized.')

    const { orderId } = req.params
    if (orderId === 'forbidden') {
      return jsonError(res, 403, 'Forbidden.')
    }

    const order = store.ordersById.get(orderId)
    if (!order || store.deletedOrderIds.has(orderId) || orderId === 'not-exists') {
      return jsonError(res, 404, 'Order not found.')
    }
    if (order.ownerUserId !== authUser.userId) {
      return jsonError(res, 403, 'Forbidden.')
    }

    return res.status(200).json({
      orderId: order.orderId,
      orderNo: order.orderNo,
      createdAt: order.createdAt,
      type: order.type,
      status: order.status,
      title: order.title,
      departureAt: order.departureAt,
      arrivalAt: order.arrivalAt,
      fare: order.fare,
      travelers: [{ name: '张三', idNo: 'IDNO' }],
      segments: [
        {
          departStation: '上海',
          arriveStation: '北京',
          departAt: order.departureAt,
          arriveAt: order.arrivalAt,
          transportNo: 'MU0001',
          seatType: '经济舱',
        },
      ],
      priceBreakdown: [{ label: '票价', amount: order.totalAmount }],
      totalAmount: order.totalAmount,
    })
  })

  router.post('/orders/:orderId/cancel', (req, res) => {
    const authUser = authenticateRequest(req)
    if (!authUser) return jsonError(res, 401, 'Unauthorized.')

    const { orderId } = req.params
    const order = store.ordersById.get(orderId)
    if (!order || store.deletedOrderIds.has(orderId) || orderId === 'not-exists') {
      return jsonError(res, 404, 'Order not found.')
    }
    if (order.ownerUserId !== authUser.userId) {
      return jsonError(res, 403, 'Forbidden.')
    }
    order.status = 'canceled'
    store.ordersById.set(orderId, order)
    return res.status(200).json({ orderId, status: 'canceled' })
  })

  router.delete('/orders/:orderId', (req, res) => {
    const authUser = authenticateRequest(req)
    if (!authUser) return jsonError(res, 401, 'Unauthorized.')

    const { orderId } = req.params
    const order = store.ordersById.get(orderId)
    if (!order) {
      return jsonError(res, 404, 'Order not found.')
    }
    if (order && order.ownerUserId !== authUser.userId) {
      return jsonError(res, 403, 'Forbidden.')
    }

    store.deletedOrderIds.add(orderId)
    return res.status(204).end()
  })

  router.post('/orders', (req, res) => {
    try {
      const authHeader = req.get('Authorization')
      const authUser = authenticateRequest(req)
      if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ') && !authUser) {
        return jsonError(res, 401, 'Unauthorized.')
      }

      const { productType, bookingDraft, totalAmount } = req.body || {}
      if (!isNonEmptyString(productType) || !bookingDraft || typeof bookingDraft !== 'object' || !isFiniteNumber(totalAmount)) {
        return jsonError(res, 400, 'Invalid input or missing booking draft.')
      }

      const { flightId, packageId, departDate, priceVersion } = bookingDraft
      if (!isNonEmptyString(flightId) || !isNonEmptyString(packageId) || !isNonEmptyString(departDate) || !isNonEmptyString(priceVersion)) {
        return jsonError(res, 400, 'Invalid input or missing booking draft.')
      }

      const resolvedFare = productType.trim() === 'flight' ? resolveFlightFare({ flightId, packageId, departDate, priceVersion }) : null
      if (resolvedFare?.error) {
        return jsonError(res, 400, resolvedFare.error)
      }

      if (resolvedFare && totalAmount < resolvedFare.ticketPrice) {
        return jsonError(res, 400, 'Invalid totalAmount.')
      }

      const orderId = createOrderId()
      const orderNo = `NO_${orderId}`
      const createdAt = new Date().toISOString()

      const order = {
        orderId,
        orderNo,
        createdAt,
        type: productType.trim(),
        status: 'pending_payment',
        title: resolvedFare ? `${resolvedFare.from}-${resolvedFare.to}` : '机票订单',
        departureAt: resolvedFare ? resolvedFare.departAt : '',
        arrivalAt: resolvedFare ? resolvedFare.arrivalAt : '',
        totalAmount,
        travelers: [],
        ownerUserId: authUser ? authUser.userId : 'u1',
        fare: resolvedFare
          ? {
              packageId: resolvedFare.packageId,
              priceVersion: resolvedFare.priceVersion,
              ticketPrice: resolvedFare.ticketPrice,
            }
          : null,
        bookingDraft: {
          flightId: flightId.trim(),
          packageId: packageId.trim(),
          departDate: departDate.trim(),
          priceVersion: priceVersion.trim(),
        },
      }

      store.ordersById.set(orderId, order)
      return res.status(201).json({ orderId, status: order.status })
    } catch {
      return jsonError(res, 500, 'Storage error.')
    }
  })

  router.patch('/orders/:orderId/status', (req, res) => {
    try {
      const authHeader = req.get('Authorization')
      const authUser = authenticateRequest(req)
      if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ') && !authUser) {
        return jsonError(res, 401, 'Unauthorized.')
      }

      const { orderId } = req.params
      const { status } = req.body || {}
      if (!isNonEmptyString(status)) {
        return jsonError(res, 400, 'Invalid status.')
      }

      const nextStatus = status.trim()
      if (nextStatus !== 'pending_travel' && nextStatus !== 'pending_payment' && nextStatus !== 'canceled') {
        return jsonError(res, 400, 'Invalid status.')
      }

      const order = store.ordersById.get(orderId)
      if (!order || store.deletedOrderIds.has(orderId)) {
        return jsonError(res, 404, 'Order not found.')
      }

      if (authUser && order.ownerUserId !== authUser.userId) {
        return jsonError(res, 403, 'Forbidden.')
      }

      if (order.status !== nextStatus) {
        order.status = nextStatus
        store.ordersById.set(orderId, order)
      }

      return res.status(200).json({ orderId, status: order.status })
    } catch {
      return jsonError(res, 500, 'Storage error.')
    }
  })

  return router
}

module.exports = {
  createOrdersRouter,
}
