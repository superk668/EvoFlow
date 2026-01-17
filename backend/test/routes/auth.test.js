const request = require('supertest')
const { createApp } = require('../../src/app')

describe('Auth API', () => {
  const app = createApp()

  describe('POST /api/auth/login/password', () => {
    it('账号密码正确时返回 200 并包含 userId 与 token', async () => {
      const res = await request(app).post('/api/auth/login/password').send({
        account: '13800138000',
        password: 'Correct#123',
      })

      expect(res.status).toBe(200)
      expect(res.body).toEqual(
        expect.objectContaining({
          userId: expect.any(String),
          token: expect.any(String),
        })
      )
    })

    it('账号不存在或密码不匹配时返回 401 并提示用户名或密码不正确', async () => {
      const res = await request(app).post('/api/auth/login/password').send({
        account: '13800138001',
        password: 'Wrong#123',
      })

      expect(res.status).toBe(401)
      expect(res.body).toEqual(expect.objectContaining({ error: '用户名或密码不正确' }))
    })
  })

  describe('POST /api/auth/sms/send', () => {
    it('合法手机号且不在冷却期内时返回 200，并返回 cooldownSeconds=60', async () => {
      const res = await request(app).post('/api/auth/sms/send').send({
        phoneNumber: '13800138000',
        purpose: 'login',
      })

      expect(res.status).toBe(200)
      expect(res.body).toEqual(expect.objectContaining({ sent: true, cooldownSeconds: 60 }))
    })

    it('60 秒内重复请求时返回 429 且不生成新验证码', async () => {
      await request(app).post('/api/auth/sms/send').send({ phoneNumber: '13800138000', purpose: 'login' })
      const res2 = await request(app).post('/api/auth/sms/send').send({ phoneNumber: '13800138000', purpose: 'login' })

      expect(res2.status).toBe(429)
    })
  })

  describe('POST /api/auth/login/code', () => {
    it('手机号已注册且验证码正确时返回 200，并返回 userId 与 token', async () => {
      const res = await request(app).post('/api/auth/login/code').send({
        phoneNumber: '13800138000',
        verificationCode: '123456',
      })

      expect(res.status).toBe(200)
      expect(res.body).toEqual(expect.objectContaining({ userId: expect.any(String), token: expect.any(String) }))
    })

    it('手机号未注册时返回 404，并提示该手机号未注册，请先注册', async () => {
      const res = await request(app).post('/api/auth/login/code').send({
        phoneNumber: '13800138001',
        verificationCode: '123456',
      })

      expect(res.status).toBe(404)
      expect(res.body).toEqual(expect.objectContaining({ error: '该手机号未注册，请先注册' }))
    })

    it('验证码不正确时返回 401，并提示验证码不正确', async () => {
      const res = await request(app).post('/api/auth/login/code').send({
        phoneNumber: '13800138000',
        verificationCode: '000000',
      })

      expect(res.status).toBe(401)
      expect(res.body).toEqual(expect.objectContaining({ error: '验证码不正确' }))
    })
  })

  describe('POST /api/auth/register/verify-code', () => {
    it('手机号已注册时返回 409，并提示该手机号已注册，请直接登录', async () => {
      const res = await request(app).post('/api/auth/register/verify-code').send({
        phoneNumber: '13800138000',
        verificationCode: '123456',
      })

      expect(res.status).toBe(409)
      expect(res.body).toEqual(expect.objectContaining({ error: '该手机号已注册，请直接登录' }))
    })

    it('手机号未注册且验证码正确时返回 200，并返回 registerToken', async () => {
      const res = await request(app).post('/api/auth/register/verify-code').send({
        phoneNumber: '13800138001',
        verificationCode: '123456',
      })

      expect(res.status).toBe(200)
      expect(res.body).toEqual(expect.objectContaining({ registerToken: expect.any(String) }))
    })

    it('验证码错误时返回 401，并提示验证码错误', async () => {
      const res = await request(app).post('/api/auth/register/verify-code').send({
        phoneNumber: '13800138001',
        verificationCode: '000000',
      })

      expect(res.status).toBe(401)
      expect(res.body).toEqual(expect.objectContaining({ error: '验证码错误' }))
    })
  })

  describe('POST /api/auth/register/complete', () => {
    it('密码格式非法时返回 400', async () => {
      const res = await request(app).post('/api/auth/register/complete').send({
        registerToken: 'rt-1',
        password: '1234567',
      })

      expect(res.status).toBe(400)
    })

    it('注册令牌无效或过期时返回 401', async () => {
      const res = await request(app).post('/api/auth/register/complete').send({
        registerToken: 'invalid',
        password: 'Correct#123',
      })

      expect(res.status).toBe(401)
    })

    it('手机号未注册且信息合法时返回 201 并创建用户', async () => {
      const res = await request(app).post('/api/auth/register/complete').send({
        registerToken: 'rt-2',
        password: 'Correct#123',
      })

      expect(res.status).toBe(201)
      expect(res.body).toEqual(expect.objectContaining({ userId: expect.any(String) }))
    })

    it('重复注册应返回 409', async () => {
      await request(app).post('/api/auth/register/complete').send({ registerToken: 'rt-3', password: 'Correct#123' })
      const res2 = await request(app).post('/api/auth/register/complete').send({ registerToken: 'rt-3', password: 'Correct#123' })

      expect(res2.status).toBe(409)
    })
  })
})

