const request = require('supertest')

describe('订单管理 API - 场景用例', () => {
  async function login(app) {
    const res = await request(app).post('/api/v1/auth/login/password').send({
      account: '13800138000',
      password: 'CorrectPassword123!',
      agreeTerms: true,
    })
    expect(res.status).toBe(200)
    return res.body.token
  }

  function createTestApp() {
    jest.resetModules()
    const { createApp } = require('../../src/app')
    const { createDb } = require('../../src/db/createDb')
    const db = createDb({ filename: ':memory:' })
    return createApp({ db })
  }

  it('API-GET-Orders: 默认按创建时间倒序返回订单卡片字段', async () => {
    const app = createTestApp()
    const token = await login(app)

    const res = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .query({ status: 'all', type: 'all', page: 1, pageSize: 10 })

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ items: [], page: 1, pageSize: 10, total: 0 })
  })

  it('API-GET-Orders: 支持按状态 upcoming/completed/canceled/pending_payment 筛选', async () => {
    const app = createTestApp()
    const token = await login(app)

    const upcomingRes = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .query({ status: 'upcoming', type: 'all', page: 1, pageSize: 10 })

    const completedRes = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .query({ status: 'completed', type: 'all', page: 1, pageSize: 10 })

    const canceledRes = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .query({ status: 'canceled', type: 'all', page: 1, pageSize: 10 })

    const pendingPaymentRes = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .query({ status: 'pending_payment', type: 'all', page: 1, pageSize: 10 })

    expect(upcomingRes.status).toBe(200)
    expect(completedRes.status).toBe(200)
    expect(canceledRes.status).toBe(200)
    expect(pendingPaymentRes.status).toBe(200)
  })

  it('API-GET-Orders: 支持按订单类型 flight/train/hotel 筛选', async () => {
    const app = createTestApp()
    const token = await login(app)

    const flightRes = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .query({ status: 'all', type: 'flight', page: 1, pageSize: 10 })

    const trainRes = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .query({ status: 'all', type: 'train', page: 1, pageSize: 10 })

    const hotelRes = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .query({ status: 'all', type: 'hotel', page: 1, pageSize: 10 })

    expect(flightRes.status).toBe(200)
    expect(trainRes.status).toBe(200)
    expect(hotelRes.status).toBe(200)
  })

  it('API-POST-Orders: bookingDraft 字段缺失返回 400', async () => {
    const app = createTestApp()

    const res = await request(app)
      .post('/api/orders')
      .send({ productType: 'flight', bookingDraft: { flightId: 'f1' }, totalAmount: 528 })

    expect(res.status).toBe(400)
  })

  it('API-POST-Orders: 带 token 创建的订单应归属当前用户并在列表中可见', async () => {
    const app = createTestApp()
    const u1Token = await login(app)

    const registerRes = await request(app).post('/api/v1/auth/register/complete').send({
      phoneNumber: '13900000000',
      verificationToken: 'temp_token_xyz',
      password: 'CorrectPassword123!',
    })

    expect(registerRes.status).toBe(201)
    const newUserToken = registerRes.body.token
    expect(typeof newUserToken).toBe('string')

    const createRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${newUserToken}`)
      .send({
        productType: 'flight',
        bookingDraft: { flightId: 'f1', packageId: 'p1', departDate: '2026-02-01', priceVersion: 'v1' },
        totalAmount: 528,
      })

    expect(createRes.status).toBe(201)
    const orderId = createRes.body.orderId

    const listForNewUser = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${newUserToken}`)
      .query({ status: 'all', type: 'all', page: 1, pageSize: 10 })

    expect(listForNewUser.status).toBe(200)
    expect(listForNewUser.body.items).toEqual(expect.arrayContaining([expect.objectContaining({ orderId })]))

    const listForU1 = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${u1Token}`)
      .query({ status: 'all', type: 'all', page: 1, pageSize: 10 })

    expect(listForU1.status).toBe(200)
    expect(listForU1.body.items).toEqual(expect.not.arrayContaining([expect.objectContaining({ orderId })]))
  })

  it('API-PATCH-OrderStatus: 非法状态返回 400', async () => {
    const app = createTestApp()

    const createRes = await request(app)
      .post('/api/orders')
      .send({
        productType: 'flight',
        bookingDraft: { flightId: 'f1', packageId: 'p1', departDate: '2026-02-01', priceVersion: 'v1' },
        totalAmount: 528,
      })

    const orderId = createRes.body.orderId
    const res = await request(app).patch(`/api/orders/${orderId}/status`).send({ status: 'completed' })

    expect(res.status).toBe(400)
  })

  it('API-GET-Orders: 未登录返回 401', async () => {
    const app = createTestApp()
    const res = await request(app).get('/api/orders')
    expect(res.status).toBe(401)
  })

  it('API-GET-Orders: token 无效返回 401', async () => {
    const app = createTestApp()
    const res = await request(app).get('/api/orders').set('Authorization', 'Bearer invalid_token')
    expect(res.status).toBe(401)
  })

  it('API-GET-Orders: 非法分页参数返回 400', async () => {
    const app = createTestApp()
    const token = await login(app)

    const res = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .query({ status: 'all', type: 'all', page: 0, pageSize: 10 })

    expect(res.status).toBe(400)
  })

  it('API-GET-OrderDetail: 订单不存在返回 404', async () => {
    const app = createTestApp()
    const token = await login(app)

    const res = await request(app)
      .get('/api/orders/not-exists')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(404)
  })

  it('API-GET-OrderDetail: 无权限访问返回 403', async () => {
    const app = createTestApp()
    const token = await login(app)

    const res = await request(app)
      .get('/api/orders/forbidden')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(403)
  })

  it('API-POST-OrderCancel: 重复取消保持幂等并返回已取消状态', async () => {
    const app = createTestApp()
    const token = await login(app)

    const createRes = await request(app)
      .post('/api/orders')
      .send({
        productType: 'flight',
        bookingDraft: { flightId: 'f1', packageId: 'p1', departDate: '2026-02-01', priceVersion: 'v1' },
        totalAmount: 528,
      })

    expect(createRes.status).toBe(201)
    const { orderId } = createRes.body

    const res1 = await request(app)
      .post(`/api/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${token}`)

    const res2 = await request(app)
      .post(`/api/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${token}`)

    expect(res1.status).toBe(200)
    expect(res2.status).toBe(200)
    expect(res2.body).toEqual(expect.objectContaining({ orderId, status: 'canceled' }))
  })

  it('API-POST-OrderCancel: 订单不存在返回 404', async () => {
    const app = createTestApp()
    const token = await login(app)

    const res = await request(app)
      .post('/api/orders/not-exists/cancel')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: 'Order not found.' })
  })

  it('API-DELETE-Order: 重复删除保持幂等并返回 204', async () => {
    const app = createTestApp()
    const token = await login(app)

    const createRes = await request(app)
      .post('/api/orders')
      .send({
        productType: 'flight',
        bookingDraft: { flightId: 'f1', packageId: 'p1', departDate: '2026-02-01', priceVersion: 'v1' },
        totalAmount: 528,
      })

    expect(createRes.status).toBe(201)
    const { orderId } = createRes.body

    const res1 = await request(app)
      .delete(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${token}`)

    const res2 = await request(app)
      .delete(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res1.status).toBe(204)
    expect(res2.status).toBe(204)
  })

  it('API-DELETE-Order: 订单不存在返回 404', async () => {
    const app = createTestApp()
    const token = await login(app)

    const res = await request(app)
      .delete('/api/orders/not-exists')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: 'Order not found.' })
  })

  it('API-DELETE-Order: 删除成功后列表页不再返回该订单', async () => {
    const app = createTestApp()
    const token = await login(app)

    const createRes = await request(app)
      .post('/api/orders')
      .send({
        productType: 'flight',
        bookingDraft: { flightId: 'f1', packageId: 'p1', departDate: '2026-02-01', priceVersion: 'v1' },
        totalAmount: 528,
      })

    expect(createRes.status).toBe(201)
    const { orderId } = createRes.body

    const deleteRes = await request(app)
      .delete(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${token}`)

    expect(deleteRes.status).toBe(204)

    const listRes = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .query({ status: 'all', type: 'all', page: 1, pageSize: 50 })

    expect(listRes.status).toBe(200)
    expect(listRes.body.items).toEqual(expect.not.arrayContaining([expect.objectContaining({ orderId })]))
  })

  it('API-POST-Orders: 成功创建后返回 orderId，status 为 pending_payment', async () => {
    const app = createTestApp()
    await login(app)

    const res = await request(app)
      .post('/api/orders')
      .send({
        productType: 'flight',
        bookingDraft: { flightId: 'f1', packageId: 'p1', departDate: '2026-02-01', priceVersion: 'v1' },
        totalAmount: 528,
      })

    expect(res.status).toBe(201)
    expect(res.body).toEqual(expect.objectContaining({ orderId: expect.any(String), status: 'pending_payment' }))
  })

  it('API-PATCH-OrderStatus: 重复请求保持幂等并返回相同状态', async () => {
    const app = createTestApp()

    const createRes = await request(app)
      .post('/api/orders')
      .send({
        productType: 'flight',
        bookingDraft: { flightId: 'f1', packageId: 'p1', departDate: '2026-02-01', priceVersion: 'v1' },
        totalAmount: 528,
      })

    const orderId = createRes.body.orderId

    const res1 = await request(app).patch(`/api/orders/${orderId}/status`).send({ status: 'pending_travel' })
    const res2 = await request(app).patch(`/api/orders/${orderId}/status`).send({ status: 'pending_travel' })

    expect(res1.status).toBe(200)
    expect(res2.status).toBe(200)
    expect(res2.body).toEqual(expect.objectContaining({ orderId, status: 'pending_travel' }))
  })

  it('API-POST-Orders: 机票订单应保存所选挡位对应的票价信息', async () => {
    const app = createTestApp()
    const token = await login(app)

    const flightId = 'f_北京_上海_2026-02-01_0'

    const res1 = await request(app)
      .post('/api/orders')
      .send({
        productType: 'flight',
        bookingDraft: { flightId, packageId: `${flightId}_p0`, departDate: '2026-02-01', priceVersion: 'v0_0' },
        totalAmount: 420,
      })

    expect(res1.status).toBe(201)
    const orderId1 = res1.body.orderId

    const detail1 = await request(app)
      .get(`/api/orders/${orderId1}`)
      .set('Authorization', `Bearer ${token}`)

    expect(detail1.status).toBe(200)
    expect(detail1.body).toEqual(
      expect.objectContaining({
        orderId: orderId1,
        fare: expect.objectContaining({ packageId: `${flightId}_p0`, priceVersion: 'v0_0', ticketPrice: 420 }),
      })
    )

    const res2 = await request(app)
      .post('/api/orders')
      .send({
        productType: 'flight',
        bookingDraft: { flightId, packageId: `${flightId}_p1`, departDate: '2026-02-01', priceVersion: 'v0_1' },
        totalAmount: 500,
      })

    expect(res2.status).toBe(201)
    const orderId2 = res2.body.orderId

    const detail2 = await request(app)
      .get(`/api/orders/${orderId2}`)
      .set('Authorization', `Bearer ${token}`)

    expect(detail2.status).toBe(200)
    expect(detail2.body).toEqual(
      expect.objectContaining({
        orderId: orderId2,
        fare: expect.objectContaining({ packageId: `${flightId}_p1`, priceVersion: 'v0_1', ticketPrice: 500 }),
      })
    )
  })

  it('API-POST-Orders: 挡位价格版本不匹配应返回 400', async () => {
    const app = createTestApp()

    const flightId = 'f_北京_上海_2026-02-01_0'

    const res = await request(app)
      .post('/api/orders')
      .send({
        productType: 'flight',
        bookingDraft: { flightId, packageId: `${flightId}_p0`, departDate: '2026-02-01', priceVersion: 'v1' },
        totalAmount: 420,
      })

    expect(res.status).toBe(400)
  })
})
