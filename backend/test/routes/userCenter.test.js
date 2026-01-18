const request = require('supertest')

const { createServer } = require('../../src/index.js')

describe('User Center API (spec tests)', () => {
  test('POST /api/user-center/my-info should accept valid input and return success', async () => {
    const server = createServer()
    const resp = await request(server)
      .post('/api/user-center/my-info')
      .set('Content-Type', 'application/json')
      .send({ nickname: '新昵称', name: '张三', gender: '男', birthday: '2000-01-01' })

    expect(resp.status).toBe(200)
  })

  test('POST /api/user-center/my-info should reject invalid body', async () => {
    const server = createServer()
    const resp = await request(server)
      .post('/api/user-center/my-info')
      .set('Content-Type', 'application/json')
      .send('not-json')

    expect(resp.status).toBe(400)
  })

  test('POST /api/user-center/orders/cancel should cancel pending_payment orders', async () => {
    const server = createServer()
    const resp = await request(server)
      .post('/api/user-center/orders/cancel')
      .set('Content-Type', 'application/json')
      .send({ orderId: 'o_pending_payment' })

    expect(resp.status).toBe(200)
  })
})
