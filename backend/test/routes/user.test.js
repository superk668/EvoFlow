const request = require('supertest')

const { createApp } = require('../../src/app')

describe('User APIs', () => {
  test('GET /api/v1/user/profile returns 401 when not logged in', async () => {
    const app = createApp()
    const res = await request(app).get('/api/v1/user/profile')

    expect(res.statusCode).toBe(401)
    expect(res.body).toEqual({ success: false, message: '未登录' })
  })

  test('GET /api/v1/user/profile returns masked profile on success', async () => {
    const app = createApp()
    const res = await request(app).get('/api/v1/user/profile').set('Authorization', 'Bearer test_token')

    expect(res.statusCode).toBe(200)
    expect(res.body).toMatchObject({
      success: true,
      profile: {
        userId: expect.any(String),
        name: expect.any(String),
        phoneNumber: expect.any(String),
        email: expect.any(String),
        countryRegion: expect.any(String),
        documentType: expect.any(String),
        documentNumberMasked: expect.any(String),
      },
    })
    expect(String(res.body.profile.documentNumberMasked || '')).toMatch(/\*{4,}/)
    expect(String(res.body.profile.documentNumberMasked || '')).not.toMatch(/\b\d{15,18}\b/)
  })

  test('PUT /api/v1/user/profile returns 400 on invalid input', async () => {
    const app = createApp()
    const res = await request(app)
      .put('/api/v1/user/profile')
      .set('Authorization', 'Bearer test_token')
      .send({ name: '', phoneNumber: '123' })

    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({ success: false, message: '请输入正确的个人信息' })
  })

  test('PUT /api/v1/user/profile returns updated masked profile on success', async () => {
    const app = createApp()
    const res = await request(app)
      .put('/api/v1/user/profile')
      .set('Authorization', 'Bearer test_token')
      .send({
        name: '张三',
        phoneNumber: '13800138000',
        email: 'z3@example.com',
        countryRegion: 'CN',
        documentType: '身份证',
        documentNumber: '430802199001011234',
      })

    expect(res.statusCode).toBe(200)
    expect(res.body).toMatchObject({
      success: true,
      message: '个人信息已更新',
      profile: {
        userId: expect.any(String),
        name: '张三',
        phoneNumber: '13800138000',
        email: 'z3@example.com',
        countryRegion: 'CN',
        documentType: '身份证',
        documentNumberMasked: expect.stringMatching(/\*{4,}/),
      },
    })
  })

  test('GET /api/v1/user/common-travelers returns masked list and supports keyword', async () => {
    const app = createApp()
    const res = await request(app)
      .get('/api/v1/user/common-travelers?keyword=张')
      .set('Authorization', 'Bearer test_token')

    expect(res.statusCode).toBe(200)
    expect(res.body).toMatchObject({ success: true, items: expect.any(Array) })
    const item = (res.body.items || [])[0] || {}
    if (item.documentNumberMasked) {
      expect(String(item.documentNumberMasked)).toMatch(/\*{4,}/)
      expect(String(item.documentNumberMasked)).not.toMatch(/\b\d{15,18}\b/)
    }
  })

  test('POST /api/v1/user/common-travelers returns 201 on success', async () => {
    const app = createApp()
    const res = await request(app)
      .post('/api/v1/user/common-travelers')
      .set('Authorization', 'Bearer test_token')
      .send({ name: '李四', phoneNumber: '13800138001', documentType: '身份证', documentNumber: '110101199001011234' })

    expect(res.statusCode).toBe(201)
    expect(res.body).toMatchObject({
      success: true,
      message: '常用旅客信息已更新',
      traveler: {
        travelerId: expect.any(String),
        name: '李四',
        phoneNumber: '13800138001',
        documentType: '身份证',
        documentNumberMasked: expect.stringMatching(/\*{4,}/),
      },
    })
  })

  test('DELETE /api/v1/user/common-travelers/:travelerId returns 404 when traveler missing', async () => {
    const app = createApp()
    const res = await request(app)
      .delete('/api/v1/user/common-travelers/t_missing')
      .set('Authorization', 'Bearer test_token')

    expect(res.statusCode).toBe(404)
    expect(res.body).toEqual({ success: false, message: '常用旅客不存在' })
  })
})

