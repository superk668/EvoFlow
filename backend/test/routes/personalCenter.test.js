const request = require('supertest')

const { createApp } = require('../../src/app')
const { createDb } = require('../../src/db/createDb')

describe('个人中心 API - 场景用例', () => {
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
    const db = createDb({ filename: ':memory:' })
    return createApp({ db })
  }

  it('API-GET-UserProfile: 未登录返回 401', async () => {
    const app = createTestApp()
    const res = await request(app).get('/api/user/profile')
    expect(res.status).toBe(401)
  })

  it('Scenario 3.1.3: 用户查看个人信息返回手机号/邮箱/昵称/姓名/性别/生日', async () => {
    const app = createTestApp()
    const token = await login(app)

    const res = await request(app).get('/api/user/profile').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body).toEqual(
      expect.objectContaining({
        userId: expect.any(String),
        phoneNumber: expect.any(String),
        email: expect.any(String),
        nickname: expect.any(String),
        fullName: expect.any(String),
        gender: expect.any(String),
        birthday: expect.any(String),
      })
    )
  })

  it('Scenario 3.1.3: 新注册用户首次访问个人信息也应返回 profile', async () => {
    const app = createTestApp()

    const registerRes = await request(app).post('/api/v1/auth/register/complete').send({
      phoneNumber: '13900000000',
      verificationToken: 'temp_token_xyz',
      password: 'CorrectPassword123!',
    })

    expect(registerRes.status).toBe(201)
    const token = registerRes.body.token

    const res = await request(app).get('/api/user/profile').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body).toEqual(
      expect.objectContaining({
        userId: expect.any(String),
        phoneNumber: '13900000000',
        email: expect.any(String),
        nickname: expect.any(String),
        fullName: expect.any(String),
        gender: expect.any(String),
        birthday: expect.any(String),
      })
    )
  })

  it('Scenario 3.1.5: 用户修改个人信息缺失必填项返回 400', async () => {
    const app = createTestApp()
    const token = await login(app)

    const res = await request(app)
      .put('/api/user/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ nickname: '', fullName: '张三', gender: 'male', birthday: '2000-01-01' })

    expect(res.status).toBe(400)
  })

  it('Scenario 3.1.5: 用户修改个人信息合法输入返回最新 profile 与成功提示', async () => {
    const app = createTestApp()
    const token = await login(app)

    const res = await request(app)
      .put('/api/user/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ nickname: '新昵称', fullName: '张三', gender: 'male', birthday: '2000-01-01' })

    expect(res.status).toBe(200)
    expect(res.body).toEqual(
      expect.objectContaining({
        success: true,
        message: '个人信息已更新',
        profile: expect.objectContaining({
          nickname: '新昵称',
          fullName: '张三',
          gender: 'male',
          birthday: '2000-01-01',
        }),
      })
    )
  })

  it('Scenario 3.2.5: keyword 为空返回全部旅客列表', async () => {
    const app = createTestApp()
    const token = await login(app)

    const res = await request(app)
      .get('/api/user/travelers')
      .set('Authorization', `Bearer ${token}`)
      .query({ keyword: '' })

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ items: [] })
  })

  it('Scenario 3.2.6: 新增旅客必填字段合法时创建成功并可查询到', async () => {
    const app = createTestApp()
    const token = await login(app)

    const createRes = await request(app)
      .post('/api/user/travelers')
      .set('Authorization', `Bearer ${token}`)
      .send({ cnName: '张三', idType: 'idcard', idNo: '110101200001011234', phone: '13800138000' })

    expect(createRes.status).toBe(201)
    expect(createRes.body).toEqual(expect.objectContaining({ travelerId: expect.any(String) }))

    const listRes = await request(app)
      .get('/api/user/travelers')
      .set('Authorization', `Bearer ${token}`)
      .query({ keyword: '张三' })

    expect(listRes.status).toBe(200)
    expect(listRes.body.items).toEqual(
      expect.arrayContaining([expect.objectContaining({ cnName: '张三', idType: 'idcard', idNo: '110101200001011234' })])
    )
  })

  it('Scenario 3.2.7: 新增旅客必填项缺失或字段不合法返回 400', async () => {
    const app = createTestApp()
    const token = await login(app)

    const res = await request(app)
      .post('/api/user/travelers')
      .set('Authorization', `Bearer ${token}`)
      .send({ cnName: '', idType: '', idNo: '' })

    expect(res.status).toBe(400)
  })

  it('Conflict: 重复新增相同证件号应返回 409', async () => {
    const app = createTestApp()
    const token = await login(app)

    const payload = { cnName: '张三', idType: 'idcard', idNo: '110101200001011234' }

    const res1 = await request(app)
      .post('/api/user/travelers')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)

    const res2 = await request(app)
      .post('/api/user/travelers')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)

    expect(res1.status).toBe(201)
    expect(res2.status).toBe(409)
  })

  it('Scenario 3.2.4: 批量删除旅客成功后列表不再包含已删除旅客', async () => {
    const app = createTestApp()
    const token = await login(app)

    const res1 = await request(app)
      .post('/api/user/travelers')
      .set('Authorization', `Bearer ${token}`)
      .send({ cnName: '张三', idType: 'idcard', idNo: '110101200001011234' })

    const res2 = await request(app)
      .post('/api/user/travelers')
      .set('Authorization', `Bearer ${token}`)
      .send({ cnName: '李四', idType: 'idcard', idNo: '110101200001019876' })

    const deleteRes = await request(app)
      .delete('/api/user/travelers')
      .set('Authorization', `Bearer ${token}`)
      .send({ ids: [res1.body.travelerId, res2.body.travelerId] })

    expect(deleteRes.status).toBe(200)
    expect(deleteRes.body).toEqual(expect.objectContaining({ deletedCount: 2 }))

    const listRes = await request(app)
      .get('/api/user/travelers')
      .set('Authorization', `Bearer ${token}`)
      .query({ keyword: '' })

    expect(listRes.status).toBe(200)
    expect(listRes.body.items).toEqual(expect.not.arrayContaining([expect.objectContaining({ cnName: '张三' })]))
  })
})
