const request = require('supertest')

const { createApp } = require('../../src/app')

describe('Order PDF APIs', () => {
  test('GET /api/v1/orders/:orderId/download/pdf returns 401 when not logged in', async () => {
    const app = createApp()
    const res = await request(app).get('/api/v1/orders/o_owned_1/download/pdf')

    expect(res.statusCode).toBe(401)
    expect(res.body).toEqual({ success: false, message: '未登录' })
  })

  test('GET /api/v1/orders/:orderId/download/pdf returns pdf base64 and does not leak secrets', async () => {
    const app = createApp()
    const res = await request(app)
      .get('/api/v1/orders/o_mask_demo/download/pdf')
      .set('Authorization', 'Bearer test_token')

    expect(res.statusCode).toBe(200)
    expect(res.body).toMatchObject({
      success: true,
      fileName: expect.stringMatching(/\.pdf$/),
      contentBase64: expect.any(String),
    })

    const decoded = Buffer.from(String(res.body.contentBase64 || ''), 'base64').toString('utf8')
    expect(decoded).not.toContain('430802199001011234')
    expect(decoded).not.toContain('15800000027')
  })

  test('POST /api/v1/orders/download/pdf returns 400 when orderIds is empty', async () => {
    const app = createApp()
    const res = await request(app)
      .post('/api/v1/orders/download/pdf')
      .set('Authorization', 'Bearer test_token')
      .send({ orderIds: [] })

    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({ success: false, message: 'orderIds 不能为空' })
  })

  test('POST /api/v1/orders/download/pdf ignores non-owned orderIds', async () => {
    const app = createApp()
    const res = await request(app)
      .post('/api/v1/orders/download/pdf')
      .set('Authorization', 'Bearer test_token')
      .send({ orderIds: ['o_owned_1', 'o_not_owned'] })

    expect(res.statusCode).toBe(200)
    expect(res.body).toMatchObject({
      success: true,
      fileName: expect.stringMatching(/\.pdf$/),
      contentBase64: expect.any(String),
    })
    const decoded = Buffer.from(String(res.body.contentBase64 || ''), 'base64').toString('utf8')
    expect(decoded).toContain('o_owned_1')
    expect(decoded).not.toContain('o_not_owned')
  })

  test('GET /api/v1/orders/download/all/pdf defaults to one-year scope; supports scope=all', async () => {
    const app = createApp()

    const res1 = await request(app)
      .get('/api/v1/orders/download/all/pdf')
      .set('Authorization', 'Bearer test_token')
    expect(res1.statusCode).toBe(200)
    expect(res1.body).toMatchObject({ success: true, fileName: expect.any(String), contentBase64: expect.any(String) })

    const res2 = await request(app)
      .get('/api/v1/orders/download/all/pdf?scope=all')
      .set('Authorization', 'Bearer test_token')
    expect(res2.statusCode).toBe(200)
  })
})
