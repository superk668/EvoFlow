const request = require('supertest')

const { createApp } = require('../../src/app')

describe('Auth API - 登录与注册模块', () => {
  it('Scenario: 1.1.3 用户使用有效的账号和密码成功登录', async () => {
    const app = createApp()
    const res = await request(app).post('/api/v1/auth/login/password').send({
      account: '13800138000',
      password: 'CorrectPassword123!',
      agreeTerms: true,
    })

    expect(res.status).toBe(200)
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

  it('Scenario: 1.1.4 用户使用无效的账号或密码登录失败', async () => {
    const app = createApp()
    const res = await request(app).post('/api/v1/auth/login/password').send({
      account: '13900000000',
      password: 'AnyPassword',
      agreeTerms: true,
    })

    expect(res.status).toBe(401)
    expect(res.body).toMatchObject({ success: false, message: '用户名或密码不正确' })
  })

  it('Scenario: 1.1.5 用户未输入账号点击登录', async () => {
    const app = createApp()
    const res = await request(app).post('/api/v1/auth/login/password').send({
      account: '',
      password: 'AnyPassword',
      agreeTerms: true,
    })

    expect(res.status).toBe(400)
    expect(res.body).toMatchObject({ success: false, message: '请输入用户名' })
  })

  it('Scenario: 1.1.6 用户未输入密码点击登录', async () => {
    const app = createApp()
    const res = await request(app).post('/api/v1/auth/login/password').send({
      account: 'someone@example.com',
      password: '',
      agreeTerms: true,
    })

    expect(res.status).toBe(400)
    expect(res.body).toMatchObject({ success: false, message: '请输入密码' })
  })

  it('Scenario: 1.1.7 用户未勾选服务协议点击登录', async () => {
    const app = createApp()
    const res = await request(app).post('/api/v1/auth/login/password').send({
      account: '13800138000',
      password: 'CorrectPassword123!',
      agreeTerms: false,
    })

    expect(res.status).toBe(400)
    expect(res.body).toMatchObject({ success: false, message: '请阅读并同意服务协议' })
  })

  it('Scenario: 1.2.3 用户使用有效的手机号和验证码成功登录', async () => {
    const app = createApp()
    const sendRes = await request(app).post('/api/v1/auth/sms/send').send({
      phoneNumber: '13800138000',
      type: 'login',
    })

    expect(sendRes.status).toBe(200)
    expect(sendRes.body).toMatchObject({ success: true, message: '验证码已发送', expiresIn: 60 })

    const loginRes = await request(app).post('/api/v1/auth/login/sms').send({
      phoneNumber: '13800138000',
      code: '123456',
      agreeTerms: true,
    })

    expect(loginRes.status).toBe(200)
    expect(loginRes.body).toMatchObject({
      success: true,
      token: expect.any(String),
      user: {
        id: expect.any(String),
        nickname: expect.any(String),
        avatar: expect.any(String),
      },
    })
  })

  it('Scenario: 1.2.4 用户输入的手机号不合法', async () => {
    const app = createApp()
    const res = await request(app).post('/api/v1/auth/sms/send').send({
      phoneNumber: '123',
      type: 'login',
    })

    expect(res.status).toBe(400)
    expect(res.body).toMatchObject({ success: false, message: '手机号格式不正确，请重新输入' })
  })

  it('Scenario: 1.2.4 用户输入错误的验证码', async () => {
    const app = createApp()
    const res = await request(app).post('/api/v1/auth/login/sms').send({
      phoneNumber: '13800138000',
      code: '000000',
      agreeTerms: true,
    })

    expect(res.status).toBe(400)
    expect(res.body).toMatchObject({ success: false, message: '验证码不正确' })
  })

  it('Scenario: 1.2.5 用户未勾选服务协议点击登录', async () => {
    const app = createApp()
    const res = await request(app).post('/api/v1/auth/login/sms').send({
      phoneNumber: '13800138000',
      code: '123456',
      agreeTerms: false,
    })

    expect(res.status).toBe(400)
    expect(res.body).toMatchObject({ success: false, message: '先请阅读并勾选服务协议' })
  })

  it('Scenario: 1.2.6 用户频繁获取验证码', async () => {
    const app = createApp()
    await request(app).post('/api/v1/auth/sms/send').send({ phoneNumber: '13800138000', type: 'login' })
    const res = await request(app).post('/api/v1/auth/sms/send').send({ phoneNumber: '13800138000', type: 'login' })

    expect(res.status).toBe(429)
    expect(res.body).toMatchObject({ success: false, message: '请求过于频繁，请稍后再试' })
  })

  it('Scenario: 1.2.7 用户手机号未注册点击登录', async () => {
    const app = createApp()
    const res = await request(app).post('/api/v1/auth/login/sms').send({
      phoneNumber: '13900000000',
      code: '123456',
      agreeTerms: true,
    })

    expect(res.status).toBe(404)
    expect(res.body).toMatchObject({ success: false, message: '该手机号未注册，请先注册' })
  })

  it('Scenario: 2.1.5 用户使用有效的手机号和验证码成功进入设置密码步骤2', async () => {
    const app = createApp()
    const res = await request(app).post('/api/v1/auth/register/verify-phone').send({
      phoneNumber: '13800138000',
      code: '123456',
      agreeTerms: true,
    })

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      success: true,
      verificationToken: expect.any(String),
      message: '验证成功',
    })
  })

  it('Scenario: 2.1.6 用户输入不合法的手机号', async () => {
    const app = createApp()
    const res = await request(app).post('/api/v1/auth/sms/send').send({ phoneNumber: '123', type: 'register' })

    expect(res.status).toBe(400)
    expect(res.body).toMatchObject({ success: false, message: '手机号格式不正确，请重新输入' })
  })

  it('Scenario: 2.1.8 用户输入错误的验证码', async () => {
    const app = createApp()
    const res = await request(app).post('/api/v1/auth/register/verify-phone').send({
      phoneNumber: '13800138000',
      code: '123456',
      agreeTerms: true,
    })

    expect(res.status).toBe(400)
    expect(res.body).toMatchObject({ success: false, message: '验证码错误' })
  })

  it('Scenario: 2.1.15 用户两次输入相同的合法密码', async () => {
    const app = createApp()
    const res = await request(app).post('/api/v1/auth/register/complete').send({
      phoneNumber: '13800138000',
      verificationToken: 'temp_token_xyz',
      password: 'CorrectPassword123!',
    })

    expect(res.status).toBe(201)
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

  it('注册完成后可成功保存用户信息并可用密码登录', async () => {
    const app = createApp()
    const phoneNumber = '13911112222'

    const verifyRes = await request(app).post('/api/v1/auth/register/verify-phone').send({
      phoneNumber,
      code: '123456',
      agreeTerms: true,
    })

    expect(verifyRes.status).toBe(200)
    expect(verifyRes.body).toMatchObject({
      success: true,
      verificationToken: expect.any(String),
    })

    const password = 'CorrectPassword123!'
    const completeRes = await request(app).post('/api/v1/auth/register/complete').send({
      phoneNumber,
      verificationToken: verifyRes.body.verificationToken,
      password,
    })

    expect(completeRes.status).toBe(201)
    expect(completeRes.body).toMatchObject({ success: true })

    const loginRes = await request(app).post('/api/v1/auth/login/password').send({
      account: phoneNumber,
      password,
      agreeTerms: true,
    })

    expect(loginRes.status).toBe(200)
    expect(loginRes.body).toMatchObject({
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
