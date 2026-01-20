const request = require('supertest')

const { createApp } = require('../../src/app')
const { createDb } = require('../../src/db/createDb')

describe('航班搜索 API - 场景用例', () => {
  function createTestApp() {
    const db = createDb({ filename: ':memory:' })
    return createApp({ db })
  }

  it('API-GET-Flights: 当 from/to/departDate 合法时返回航班列表', async () => {
    const app = createTestApp()

    const res = await request(app).get('/api/flights').query({
      from: '北京',
      to: '上海',
      departDate: '2026-02-01',
      page: 1,
      pageSize: 10,
    })

    expect(res.status).toBe(200)
    expect(res.body).toEqual(
      expect.objectContaining({
        items: expect.any(Array),
        page: 1,
        pageSize: 10,
        total: expect.any(Number),
      })
    )
  })

  it('API-GET-Flights: 当无可售结果时返回 items 为空数组', async () => {
    const app = createTestApp()

    const res = await request(app).get('/api/flights').query({
      from: '北京',
      to: '上海',
      departDate: '2099-12-31',
      page: 1,
      pageSize: 10,
    })

    expect(res.status).toBe(200)
    expect(res.body.items).toEqual([])
  })

  it('API-GET-Flights: 当查询参数非法时返回 400', async () => {
    const app = createTestApp()
    const res = await request(app).get('/api/flights').query({ from: '', to: '', departDate: 'x' })
    expect(res.status).toBe(400)
  })
})

