const request = require('supertest')

const { createApp } = require('../../src/app')
const { createDb } = require('../../src/db/createDb')

describe('机票预订会话 API - 场景用例', () => {
  function createTestApp() {
    const db = createDb({ filename: ':memory:' })
    return createApp({ db })
  }

  it('API-POST-BookingDraft: 必须写入 bookingDraft 且字段完整', async () => {
    const app = createTestApp()

    const res = await request(app).post('/api/booking/draft').send({
      flightId: 'f1',
      packageId: 'p1',
      departDate: '2026-02-01',
      priceVersion: 'v1',
    })

    expect(res.status).toBe(201)
    expect(res.body).toEqual(
      expect.objectContaining({
        success: true,
        bookingDraft: {
          flightId: 'f1',
          packageId: 'p1',
          departDate: '2026-02-01',
          priceVersion: 'v1',
        },
      })
    )
  })

  it('API-GET-BookingDraft: 当草稿不存在时返回 404', async () => {
    const app = createTestApp()
    const res = await request(app).get('/api/booking/draft')
    expect(res.status).toBe(404)
  })

  it('API-GET-BookingTravelers: 初始化后 travelers 为空且 bookingStage 为 0', async () => {
    const app = createTestApp()
    const res = await request(app).get('/api/booking/travelers')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ travelers: null, bookingStage: 0 })
  })

  it('API-GET-BookingServices: 初始化后 services 为空且 bookingStage 为 0', async () => {
    const app = createTestApp()
    const res = await request(app).get('/api/booking/services')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ services: null, bookingStage: 0 })
  })

  it('API-PUT-BookingTravelers: 当证件号不合法时返回 400 并指明原因', async () => {
    const app = createTestApp()

    const res = await request(app).put('/api/booking/travelers').send({
      passengers: [{ name: '张三', idType: 'id', idNo: '123', phone: '13800138000' }],
      contact: { regionCode: '+86', phone: '13800138000' },
    })

    expect(res.status).toBe(400)
    expect(res.body).toEqual(expect.objectContaining({ error: expect.any(String) }))
  })

  it('API-PUT-BookingServices: 未选择任何服务时也应允许保存并返回 success', async () => {
    const app = createTestApp()

    const res = await request(app).put('/api/booking/services').send({ selectedServices: [], priceBreakdown: [] })

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ success: true })
  })
})
