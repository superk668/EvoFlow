const request = require('supertest')
const { createApp } = require('../../src/app')

describe('Flights API', () => {
  const app = createApp()

  describe('GET /api/flights/search', () => {
    it('查询参数合法时返回 200，并包含航司/航班号/起降信息/最低价', async () => {
      const res = await request(app)
        .get('/api/flights/search')
        .set('Authorization', 'Bearer test-token')
        .query({
          from: 'BJS',
          to: 'SHA',
          departDate: '2099-12-31',
          page: 1,
          pageSize: 10,
        })

      expect(res.status).toBe(200)
      expect(res.body).toEqual(
        expect.objectContaining({
          flights: expect.any(Array),
          total: expect.any(Number),
        })
      )

      if (Array.isArray(res.body.flights) && res.body.flights.length > 0) {
        const first = res.body.flights[0]
        expect(first).toEqual(
          expect.objectContaining({
            airlineName: expect.any(String),
            flightNo: expect.any(String),
            departTime: expect.any(String),
            arriveTime: expect.any(String),
            lowestPrice: expect.any(Number),
          })
        )
      }
    })

    it('departDate 为过去日期时返回 400，并提示不可选择过去日期', async () => {
      const res = await request(app)
        .get('/api/flights/search')
        .set('Authorization', 'Bearer test-token')
        .query({
          from: 'BJS',
          to: 'SHA',
          departDate: '2000-01-01',
        })

      expect(res.status).toBe(400)
      expect(res.body).toEqual(expect.objectContaining({ error: expect.stringContaining('不可选择过去日期') }))
    })

    it('未登录访问时返回 401', async () => {
      const res = await request(app).get('/api/flights/search').query({
        from: 'BJS',
        to: 'SHA',
        departDate: '2099-12-31',
      })

      expect(res.status).toBe(401)
      expect(res.body).toEqual(expect.objectContaining({ error: expect.any(String) }))
    })
  })

  describe('GET /api/flights/:flightId/packages', () => {
    it('flightId 存在时返回 200，并包含 packages 与 priceVersion', async () => {
      const res = await request(app).get('/api/flights/FL-1/packages').query({ departDate: '2099-12-31' })

      expect(res.status).toBe(200)
      expect(res.body).toEqual(
        expect.objectContaining({
          packages: expect.any(Array),
          priceVersion: expect.any(String),
        })
      )
    })

    it('flightId 不存在时返回 404', async () => {
      const res = await request(app).get('/api/flights/NOT_FOUND/packages').query({ departDate: '2099-12-31' })

      expect(res.status).toBe(404)
      expect(res.body).toEqual(expect.objectContaining({ error: expect.any(String) }))
    })
  })
})
