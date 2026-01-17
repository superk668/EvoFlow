const request = require('supertest')
const { createApp } = require('../../src/app')

describe('User API', () => {
  const app = createApp()

  describe('GET /api/user/profile', () => {
    it('登录态下返回 200，并包含脱敏手机与昵称审核状态', async () => {
      const res = await request(app).get('/api/user/profile').set('Authorization', 'Bearer test-token')

      expect(res.status).toBe(200)
      expect(res.body).toEqual(
        expect.objectContaining({
          profile: expect.objectContaining({
            maskedPhone: expect.any(String),
            emailStatusText: expect.any(String),
            nicknameReviewStatus: expect.any(String),
          }),
        })
      )
    })

    it('未登录返回 401', async () => {
      const res = await request(app).get('/api/user/profile')
      expect(res.status).toBe(401)
      expect(res.body).toEqual(expect.objectContaining({ error: expect.any(String) }))
    })
  })

  describe('PUT /api/user/profile', () => {
    it('昵称为空或超长时返回 400', async () => {
      const res = await request(app)
        .put('/api/user/profile')
        .set('Authorization', 'Bearer test-token')
        .send({ nickname: '', realName: '张三', gender: '男', birthday: '1990-01-01', version: 'v1' })

      expect(res.status).toBe(400)
      expect(res.body).toEqual(expect.objectContaining({ error: expect.any(String) }))
    })

    it('并发更新导致版本冲突时返回 409', async () => {
      const res = await request(app)
        .put('/api/user/profile')
        .set('Authorization', 'Bearer test-token')
        .send({ nickname: '新昵称', realName: '张三', gender: '男', birthday: '1990-01-01', version: 'stale' })

      expect(res.status).toBe(409)
      expect(res.body).toEqual(expect.objectContaining({ error: expect.any(String) }))
    })
  })

  describe('GET /api/user/common-travellers', () => {
    it('关键字仅含特殊字符时返回 400 并提示请输入合法的姓名关键字', async () => {
      const res = await request(app)
        .get('/api/user/common-travellers')
        .set('Authorization', 'Bearer test-token')
        .query({ keyword: '!!!' })

      expect(res.status).toBe(400)
      expect(res.body).toEqual(expect.objectContaining({ error: expect.stringContaining('请输入合法的姓名关键字') }))
    })
  })

  describe('GET /api/user/common-travellers/:travellerId', () => {
    it('travellerId 无效或记录不存在时返回 404', async () => {
      const res = await request(app)
        .get('/api/user/common-travellers/not-exists')
        .set('Authorization', 'Bearer test-token')

      expect(res.status).toBe(404)
      expect(res.body).toEqual(expect.objectContaining({ error: expect.any(String) }))
    })
  })

  describe('POST /api/user/common-travellers', () => {
    it('中文名与英文名均为空时返回 400 并提示至少填写一项', async () => {
      const res = await request(app)
        .post('/api/user/common-travellers')
        .set('Authorization', 'Bearer test-token')
        .send({ traveller: { chineseName: '', lastName: '', firstName: '' } })

      expect(res.status).toBe(400)
      expect(res.body).toEqual(expect.objectContaining({ error: expect.stringContaining('中文名与英文名两者至少填写一项') }))
    })
  })

  describe('PUT /api/user/common-travellers/:travellerId', () => {
    it('日期格式错误时返回 400 并提示 yyyy-MM-dd', async () => {
      const res = await request(app)
        .put('/api/user/common-travellers/T-1')
        .set('Authorization', 'Bearer test-token')
        .send({ traveller: { birthday: '1990/01/01' } })

      expect(res.status).toBe(400)
      expect(res.body).toEqual(expect.objectContaining({ error: expect.stringContaining('yyyy-MM-dd') }))
    })

    it('证件号重复时返回 409 并提示证件号已存在', async () => {
      const res = await request(app)
        .put('/api/user/common-travellers/T-1')
        .set('Authorization', 'Bearer test-token')
        .send({ traveller: { idDocumentType: 'ID', idDocumentNumber: 'DUPLICATE' } })

      expect(res.status).toBe(409)
      expect(res.body).toEqual(expect.objectContaining({ error: expect.stringContaining('证件号已存在') }))
    })
  })

  describe('DELETE /api/user/common-travellers', () => {
    it('未选择记录时返回 400 并提示请先选择要删除的记录', async () => {
      const res = await request(app)
        .delete('/api/user/common-travellers')
        .set('Authorization', 'Bearer test-token')
        .send({ travellerIds: [] })

      expect(res.status).toBe(400)
      expect(res.body).toEqual(expect.objectContaining({ error: expect.stringContaining('请先选择要删除的记录') }))
    })
  })
})

