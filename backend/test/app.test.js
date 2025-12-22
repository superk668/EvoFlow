const request = require('supertest')

const { createApp } = require('../src/app')

describe('Auth API', () => {
  test('POST /api/v1/auth/sms/send rejects invalid phoneNumber with 400', async () => {
    const app = createApp()
    const res = await request(app).post('/api/v1/auth/sms/send').send({
      phoneNumber: '123',
      type: 'login',
    })

    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({ success: false, message: '手机号格式不正确' })
  })

  test('POST /api/v1/auth/sms/send rate limits with 429', async () => {
    const app = createApp()

    await request(app).post('/api/v1/auth/sms/send').send({
      phoneNumber: '13800138000',
      type: 'login',
    })

    const res = await request(app).post('/api/v1/auth/sms/send').send({
      phoneNumber: '13800138000',
      type: 'login',
    })

    expect(res.statusCode).toBe(429)
    expect(res.body).toEqual({ success: false, message: '请求过于频繁，请稍后再试' })
  })

  test('POST /api/v1/auth/sms/send returns expiresIn=60 on success', async () => {
    const app = createApp()
    const res = await request(app).post('/api/v1/auth/sms/send').send({
      phoneNumber: '13800138000',
      type: 'register',
    })

    expect(res.statusCode).toBe(200)
    expect(res.body).toMatchObject({
      success: true,
      message: '验证码已发送',
      code: expect.any(String),
      expiresIn: 60,
    })
  })

  test('POST /api/v1/auth/login/password returns 400 when agreeTerms=false', async () => {
    const app = createApp()
    const res = await request(app).post('/api/v1/auth/login/password').send({
      account: '13800138000',
      password: 'Any#12345',
      agreeTerms: false,
    })

    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({ success: false, message: '请阅读并同意服务协议' })
  })

  test('POST /api/v1/auth/login/password returns 401 on wrong credentials', async () => {
    const app = createApp()
    const res = await request(app).post('/api/v1/auth/login/password').send({
      account: '13800138000',
      password: 'Wrong#12345',
      agreeTerms: true,
    })

    expect(res.statusCode).toBe(401)
    expect(res.body).toEqual({ success: false, message: '用户名或密码不正确' })
  })

  test('POST /api/v1/auth/login/password returns token and user on success', async () => {
    const app = createApp()
    const res = await request(app).post('/api/v1/auth/login/password').send({
      account: '13800138000',
      password: 'Correct#12345',
      agreeTerms: true,
    })

    expect(res.statusCode).toBe(200)
    expect(res.body).toMatchObject({
      success: true,
      token: expect.any(String),
      user: {
        id: expect.any(String),
        nickname: expect.any(String),
        avatar: expect.any(String),
      },
    })
  })

  test('POST /api/v1/auth/login/sms returns 400 when agreeTerms=false', async () => {
    const app = createApp()
    const res = await request(app).post('/api/v1/auth/login/sms').send({
      phoneNumber: '13800138000',
      code: '123456',
      agreeTerms: false,
    })

    expect(res.statusCode).toBe(400)
    expect(res.body.success).toBe(false)
    expect(String(res.body.message)).toContain('服务协议')
  })

  test('POST /api/v1/auth/login/sms returns 404 when phone is not registered', async () => {
    const app = createApp()
    const res = await request(app).post('/api/v1/auth/login/sms').send({
      phoneNumber: '13900139000',
      code: '123456',
      agreeTerms: true,
    })

    expect(res.statusCode).toBe(404)
    expect(res.body).toEqual({ success: false, message: '该手机号未注册，请先注册' })
  })

  test('POST /api/v1/auth/login/sms returns 400 when code is wrong or expired', async () => {
    const app = createApp()
    const res = await request(app).post('/api/v1/auth/login/sms').send({
      phoneNumber: '13800138000',
      code: '000000',
      agreeTerms: true,
    })

    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({ success: false, message: '验证码不正确' })
  })

  test('POST /api/v1/auth/login/sms returns token and user on success', async () => {
    const app = createApp()
    const res = await request(app).post('/api/v1/auth/login/sms').send({
      phoneNumber: '13800138000',
      code: '123456',
      agreeTerms: true,
    })

    expect(res.statusCode).toBe(200)
    expect(res.body).toMatchObject({
      success: true,
      token: expect.any(String),
      user: {
        id: expect.any(String),
        nickname: expect.any(String),
        avatar: expect.any(String),
      },
    })
  })

  test('POST /api/v1/auth/register/verify-phone returns 409 when phone is already registered', async () => {
    const app = createApp()
    const res = await request(app).post('/api/v1/auth/register/verify-phone').send({
      phoneNumber: '13800138000',
      code: '123456',
      agreeTerms: true,
    })

    expect(res.statusCode).toBe(409)
    expect(res.body).toEqual({ success: false, message: '该手机号已注册，请直接登录' })
  })

  test('POST /api/v1/auth/register/verify-phone returns 400 when code is wrong or expired', async () => {
    const app = createApp()
    const res = await request(app).post('/api/v1/auth/register/verify-phone').send({
      phoneNumber: '13900139000',
      code: '000000',
      agreeTerms: true,
    })

    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({ success: false, message: '验证码错误' })
  })

  test('POST /api/v1/auth/register/verify-phone returns verificationToken on success', async () => {
    const app = createApp()
    const res = await request(app).post('/api/v1/auth/register/verify-phone').send({
      phoneNumber: '13900139000',
      code: '123456',
      agreeTerms: true,
    })

    expect(res.statusCode).toBe(200)
    expect(res.body).toMatchObject({
      success: true,
      message: '验证成功',
      verificationToken: expect.any(String),
    })
  })

  test('POST /api/v1/auth/register/complete returns 400 when verificationToken is invalid or expired', async () => {
    const app = createApp()
    const res = await request(app).post('/api/v1/auth/register/complete').send({
      phoneNumber: '13900139000',
      verificationToken: 'invalid',
      password: 'Valid#12345',
    })

    expect(res.statusCode).toBe(400)
    expect(res.body.success).toBe(false)
  })

  test('POST /api/v1/auth/register/complete returns 400 when password format is invalid', async () => {
    const app = createApp()
    const res = await request(app).post('/api/v1/auth/register/complete').send({
      phoneNumber: '13900139000',
      verificationToken: 'validTokenFromVerifyStep',
      password: 'short',
    })

    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({ success: false, message: '密码格式不符合要求' })
  })

  test('POST /api/v1/auth/register/complete returns 409 when phone is already registered', async () => {
    const app = createApp()
    const res = await request(app).post('/api/v1/auth/register/complete').send({
      phoneNumber: '13800138000',
      verificationToken: 'validTokenFromVerifyStep',
      password: 'Valid#12345',
    })

    expect(res.statusCode).toBe(409)
    expect(res.body).toEqual({ success: false, message: '该手机号已注册' })
  })

  test('POST /api/v1/auth/register/complete returns 201 with token and user on success', async () => {
    const app = createApp()
    const res = await request(app).post('/api/v1/auth/register/complete').send({
      phoneNumber: '13900139000',
      verificationToken: 'validTokenFromVerifyStep',
      password: 'Valid#12345',
    })

    expect(res.statusCode).toBe(201)
    expect(res.body).toMatchObject({
      success: true,
      token: expect.any(String),
      user: {
        id: expect.any(String),
        nickname: expect.any(String),
        avatar: expect.any(String),
      },
    })
  })
})
