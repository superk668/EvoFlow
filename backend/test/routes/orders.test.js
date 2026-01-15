const request = require('supertest')

const { createApp } = require('../../src/app')

describe('Order APIs', () => {
  test('GET /api/v1/orders returns 401 when not logged in', async () => {
    const app = createApp()
    const res = await request(app).get('/api/v1/orders')

    expect(res.statusCode).toBe(401)
    expect(res.body).toEqual({ success: false, message: '未登录' })
  })

  test('GET /api/v1/orders returns page list sorted by createdAt desc', async () => {
    const app = createApp()
    const res = await request(app)
      .get('/api/v1/orders?status=all&productType=all&page=1&pageSize=10')
      .set('Authorization', 'Bearer test_token')

    expect(res.statusCode).toBe(200)
    expect(res.body).toMatchObject({
      success: true,
      page: 1,
      pageSize: 10,
      totalCount: expect.any(Number),
      items: expect.any(Array),
    })

    const createdAtList = (res.body.items || []).map((x) => String(x.createdAt))
    const sorted = [...createdAtList].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0))
    expect(createdAtList).toEqual(sorted)
  })

  test('GET /api/v1/orders supports status and productType filtering', async () => {
    const app = createApp()
    const res = await request(app)
      .get('/api/v1/orders?status=pending_payment&productType=flight&page=1&pageSize=10')
      .set('Authorization', 'Bearer test_token')

    expect(res.statusCode).toBe(200)
    for (const item of res.body.items || []) {
      expect(item.status).toBe('pending_payment')
      expect(item.productType).toBe('flight')
    }
  })

  test('GET /api/v1/orders clamps out-of-range page to last or first page', async () => {
    const app = createApp()
    const res = await request(app)
      .get('/api/v1/orders?status=all&productType=all&page=999&pageSize=10')
      .set('Authorization', 'Bearer test_token')

    expect(res.statusCode).toBe(200)
    expect(res.body.success).toBe(true)
    expect([1, 999]).toContain(res.body.page)
  })

  test('GET /api/v1/orders/:orderId returns 404 for non-owned or missing order', async () => {
    const app = createApp()
    const res = await request(app)
      .get('/api/v1/orders/o_not_owned')
      .set('Authorization', 'Bearer test_token')

    expect(res.statusCode).toBe(404)
    expect(res.body).toEqual({ success: false, message: '订单不存在或您没有权限查看' })
  })

  test('GET /api/v1/orders/:orderId masks passenger id and contact info', async () => {
    const app = createApp()
    const res = await request(app)
      .get('/api/v1/orders/o_mask_demo')
      .set('Authorization', 'Bearer test_token')

    expect(res.statusCode).toBe(200)
    expect(res.body.success).toBe(true)
    const order = res.body.order
    expect(order).toBeTruthy()
    const passenger = (order.passengers || [])[0] || {}
    expect(String(passenger.idNumberMasked || '')).toMatch(/\*{4,}/)
    const contact = order.contact || {}
    expect(String(contact.phoneMasked || '')).toMatch(/\*{2,}/)
  })

  test('POST /api/v1/orders/:orderId/cancel returns 409 when status does not allow cancel', async () => {
    const app = createApp()
    const res = await request(app)
      .post('/api/v1/orders/o_not_cancellable/cancel')
      .set('Authorization', 'Bearer test_token')
      .send({ reason: 'test' })

    expect(res.statusCode).toBe(409)
    expect(res.body).toEqual({ success: false, message: '订单当前状态不支持取消' })
  })

  test('POST /api/v1/orders/:orderId/cancel returns 200 and updates future detail to cancelled', async () => {
    const app = createApp()
    const cancelRes = await request(app)
      .post('/api/v1/orders/o_can_cancel/cancel')
      .set('Authorization', 'Bearer test_token')
      .send({ reason: 'test' })

    expect(cancelRes.statusCode).toBe(200)
    expect(cancelRes.body).toMatchObject({
      success: true,
      message: '订单取消成功',
      order: { orderId: expect.any(String), status: 'cancelled' },
    })

    const detailRes = await request(app)
      .get('/api/v1/orders/o_can_cancel')
      .set('Authorization', 'Bearer test_token')

    expect(detailRes.statusCode).toBe(200)
    expect(detailRes.body.order.status).toBe('cancelled')
  })

  test('GET /api/v1/orders/:orderId/download returns txt content without unmasked secrets', async () => {
    const app = createApp()
    const res = await request(app)
      .get('/api/v1/orders/o_download_demo/download')
      .set('Authorization', 'Bearer test_token')

    expect(res.statusCode).toBe(200)
    expect(res.body).toMatchObject({
      success: true,
      fileName: expect.stringMatching(/\.txt$/),
      content: expect.any(String),
    })
    expect(String(res.body.content)).toEqual(expect.stringContaining('订单号'))
    expect(String(res.body.content)).toEqual(expect.stringContaining('金额'))
    expect(String(res.body.content)).not.toMatch(/\b\d{15,18}\b/)
    expect(String(res.body.content)).not.toMatch(/\b1\d{10}\b/)
  })

  test('POST /api/v1/orders/download returns 400 when orderIds is empty', async () => {
    const app = createApp()
    const res = await request(app)
      .post('/api/v1/orders/download')
      .set('Authorization', 'Bearer test_token')
      .send({ orderIds: [] })

    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({ success: false, message: 'orderIds 不能为空' })
  })

  test('POST /api/v1/orders/download ignores non-owned orderIds', async () => {
    const app = createApp()
    const res = await request(app)
      .post('/api/v1/orders/download')
      .set('Authorization', 'Bearer test_token')
      .send({ orderIds: ['o_owned_1', 'o_not_owned'] })

    expect(res.statusCode).toBe(200)
    expect(res.body.success).toBe(true)
    expect(String(res.body.content)).toContain('o_owned_1')
    expect(String(res.body.content)).not.toContain('o_not_owned')
  })

  test('GET /api/v1/orders/download/all defaults to one-year scope; supports scope=all', async () => {
    const app = createApp()

    const res1 = await request(app)
      .get('/api/v1/orders/download/all')
      .set('Authorization', 'Bearer test_token')
    expect(res1.statusCode).toBe(200)

    const res2 = await request(app)
      .get('/api/v1/orders/download/all?scope=all')
      .set('Authorization', 'Bearer test_token')
    expect(res2.statusCode).toBe(200)
  })

  test('POST /api/v1/orders/:orderId/rebook returns redirectUrl on success', async () => {
    const app = createApp()
    const res = await request(app)
      .post('/api/v1/orders/o_rebook_demo/rebook')
      .set('Authorization', 'Bearer test_token')

    expect(res.statusCode).toBe(200)
    expect(res.body).toMatchObject({ success: true, redirectUrl: expect.any(String) })
  })

  test('POST /api/v1/orders/:orderId/pay returns 401 when not logged in', async () => {
    const app = createApp()
    const res = await request(app).post('/api/v1/orders/o_owned_1/pay').send({ paymentMethod: 'default' })

    expect(res.statusCode).toBe(401)
    expect(res.body).toEqual({ success: false, message: '未登录' })
  })

  test('POST /api/v1/orders/:orderId/pay pays pending_payment order and returns pending_review with paidAt', async () => {
    const app = createApp()
    const res = await request(app)
      .post('/api/v1/orders/o_owned_1/pay')
      .set('Authorization', 'Bearer test_token')
      .send({ paymentMethod: 'default' })

    expect(res.statusCode).toBe(200)
    expect(res.body).toMatchObject({
      success: true,
      message: '支付成功',
      order: {
        orderId: 'o_owned_1',
        status: 'pending_review',
        paidAt: expect.any(String),
      },
    })
  })

  test('POST /api/v1/orders/:orderId/pay returns 404 for non-owned order', async () => {
    const app = createApp()
    const res = await request(app)
      .post('/api/v1/orders/o_not_owned/pay')
      .set('Authorization', 'Bearer test_token')
      .send({ paymentMethod: 'default' })

    expect(res.statusCode).toBe(404)
    expect(res.body).toEqual({ success: false, message: '订单不存在或您没有权限支付' })
  })

  test('POST /api/v1/orders/:orderId/pay returns 409 when status does not allow pay', async () => {
    const app = createApp()
    const res = await request(app)
      .post('/api/v1/orders/o_mask_demo/pay')
      .set('Authorization', 'Bearer test_token')
      .send({ paymentMethod: 'default' })

    expect(res.statusCode).toBe(409)
    expect(res.body).toEqual({ success: false, message: '订单当前状态不支持支付' })
  })
})
