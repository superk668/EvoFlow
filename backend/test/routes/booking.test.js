const request = require('supertest')
const { createApp } = require('../../src/app')

describe('Booking API', () => {
  const app = createApp()

  describe('POST /api/booking/drafts', () => {
    it('信息完整且价格版本有效时返回 201，并返回 bookingDraftId 与 bookingStage=1', async () => {
      const res = await request(app)
        .post('/api/booking/drafts')
        .set('Authorization', 'Bearer test-token')
        .send({
          flightId: 'FL-1',
          packageId: 'PKG-1',
          departDate: '2099-12-31',
          priceVersion: 'pv-1',
        })

      expect(res.status).toBe(201)
      expect(res.body).toEqual(
        expect.objectContaining({
          bookingDraftId: expect.any(String),
          bookingStage: 1,
        })
      )
    })

    it('参数缺失或无效时返回 400，并提示套餐信息异常', async () => {
      const res = await request(app)
        .post('/api/booking/drafts')
        .set('Authorization', 'Bearer test-token')
        .send({
          flightId: 'FL-1',
          departDate: '2099-12-31',
          priceVersion: 'pv-1',
        })

      expect(res.status).toBe(400)
      expect(res.body).toEqual(expect.objectContaining({ error: expect.stringContaining('套餐信息异常') }))
    })

    it('priceVersion 过期时返回 409 并要求确认最新价格', async () => {
      const res = await request(app)
        .post('/api/booking/drafts')
        .set('Authorization', 'Bearer test-token')
        .send({
          flightId: 'FL-1',
          packageId: 'PKG-1',
          departDate: '2099-12-31',
          priceVersion: 'expired',
        })

      expect(res.status).toBe(409)
      expect(res.body).toEqual(expect.objectContaining({ error: expect.any(String) }))
    })
  })

  describe('PUT /api/booking/drafts/:bookingDraftId/passengers-contact', () => {
    it('证件号不合法时返回 400，并提示证件号码格式不正确', async () => {
      const res = await request(app)
        .put('/api/booking/drafts/DRAFT-1/passengers-contact')
        .set('Authorization', 'Bearer test-token')
        .send({
          passengers: [
            {
              name: '张三',
              idType: 'id_card',
              idNumber: '123',
            },
          ],
          contact: { countryCode: '86', phoneNumber: '13800138000' },
        })

      expect(res.status).toBe(400)
      expect(res.body).toEqual(expect.objectContaining({ error: expect.stringContaining('证件号码格式不正确') }))
    })

    it('联系人手机号非法时返回 400，并提示联系人手机号格式不正确', async () => {
      const res = await request(app)
        .put('/api/booking/drafts/DRAFT-1/passengers-contact')
        .set('Authorization', 'Bearer test-token')
        .send({
          passengers: [
            {
              name: '张三',
              idType: 'id_card',
              idNumber: '11010519491231002X',
            },
          ],
          contact: { countryCode: '86', phoneNumber: '123' },
        })

      expect(res.status).toBe(400)
      expect(res.body).toEqual(expect.objectContaining({ error: expect.stringContaining('联系人手机号格式不正确') }))
    })

    it('保存成功后返回 200 并推进 bookingStage=2', async () => {
      const res = await request(app)
        .put('/api/booking/drafts/DRAFT-1/passengers-contact')
        .set('Authorization', 'Bearer test-token')
        .send({
          passengers: [
            {
              name: '张三',
              idType: 'id_card',
              idNumber: '11010519491231002X',
            },
          ],
          contact: { countryCode: '86', phoneNumber: '13800138000' },
        })

      expect(res.status).toBe(200)
      expect(res.body).toEqual(expect.objectContaining({ bookingStage: 2 }))
    })
  })

  describe('PUT /api/booking/drafts/:bookingDraftId/services', () => {
    it('服务不可用时返回 400 并提示服务暂不可用', async () => {
      const res = await request(app)
        .put('/api/booking/drafts/DRAFT-1/services')
        .set('Authorization', 'Bearer test-token')
        .send({
          selectedServiceIds: ['SVC-OFFLINE'],
        })

      expect(res.status).toBe(400)
      expect(res.body).toEqual(expect.objectContaining({ error: expect.stringContaining('服务暂不可用') }))
    })

    it('保存成功后返回 200 并推进 bookingStage=3', async () => {
      const res = await request(app)
        .put('/api/booking/drafts/DRAFT-1/services')
        .set('Authorization', 'Bearer test-token')
        .send({
          selectedServiceIds: ['SVC-1'],
        })

      expect(res.status).toBe(200)
      expect(res.body).toEqual(
        expect.objectContaining({
          bookingStage: 3,
          priceSummary: expect.anything(),
        })
      )
    })
  })

  describe('POST /api/booking/drafts/:bookingDraftId/pay', () => {
    it('新卡信息不完整或格式错误时返回 400 并阻止支付', async () => {
      const res = await request(app)
        .post('/api/booking/drafts/DRAFT-1/pay')
        .set('Authorization', 'Bearer test-token')
        .send({
          paymentMethod: 'new_card',
          newCard: { cardNumber: '', name: '', expiry: '', cvv: '' },
        })

      expect(res.status).toBe(400)
      expect(res.body).toEqual(expect.objectContaining({ error: expect.any(String) }))
    })

    it('倒计时到期时返回 408 并提示超出时间，请重新开始订单', async () => {
      const res = await request(app)
        .post('/api/booking/drafts/DRAFT-TIMEOUT/pay')
        .set('Authorization', 'Bearer test-token')
        .send({
          paymentMethod: 'saved_card',
        })

      expect(res.status).toBe(408)
      expect(res.body).toEqual(expect.objectContaining({ error: expect.stringContaining('超出时间') }))
    })

    it('支付失败时返回 500 并提示支付失败，请稍后重试', async () => {
      const res = await request(app)
        .post('/api/booking/drafts/DRAFT-FAIL/pay')
        .set('Authorization', 'Bearer test-token')
        .send({
          paymentMethod: 'saved_card',
        })

      expect(res.status).toBe(500)
      expect(res.body).toEqual(expect.objectContaining({ error: expect.stringContaining('支付失败') }))
    })

    it('支付成功时返回 200 且 paid=true', async () => {
      const res = await request(app)
        .post('/api/booking/drafts/DRAFT-1/pay')
        .set('Authorization', 'Bearer test-token')
        .send({
          paymentMethod: 'saved_card',
        })

      expect(res.status).toBe(200)
      expect(res.body).toEqual(expect.objectContaining({ paid: true }))
    })
  })

  describe('POST /api/booking/drafts/:bookingDraftId/complete', () => {
    it('支付成功后创建订单并返回订单号/状态/下单时间/总金额', async () => {
      const res = await request(app)
        .post('/api/booking/drafts/DRAFT-1/complete')
        .set('Authorization', 'Bearer test-token')

      expect(res.status).toBe(200)
      expect(res.body).toEqual(
        expect.objectContaining({
          orderId: expect.any(String),
          status: expect.any(String),
          createdAt: expect.any(String),
          totalAmount: expect.any(Number),
        })
      )
    })

    it('重复触发时不重复创建，仍返回已有 orderId', async () => {
      const res1 = await request(app)
        .post('/api/booking/drafts/DRAFT-IDEMPOTENT/complete')
        .set('Authorization', 'Bearer test-token')
      const res2 = await request(app)
        .post('/api/booking/drafts/DRAFT-IDEMPOTENT/complete')
        .set('Authorization', 'Bearer test-token')

      expect(res1.status).toBe(200)
      expect(res2.status).toBe(200)
      expect(res1.body).toEqual(expect.objectContaining({ orderId: expect.any(String) }))
      expect(res2.body).toEqual(expect.objectContaining({ orderId: res1.body.orderId }))
    })

    it('创建失败时返回 500，并提示订单创建失败，稍后查看订单中心', async () => {
      const res = await request(app)
        .post('/api/booking/drafts/DRAFT-CREATE-FAIL/complete')
        .set('Authorization', 'Bearer test-token')

      expect(res.status).toBe(500)
      expect(res.body).toEqual(expect.objectContaining({ error: expect.stringContaining('订单创建失败') }))
    })
  })
})
