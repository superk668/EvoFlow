const express = require('express')
const authRouter = require('./routes/auth')
const bookingRouter = require('./routes/booking')
const flightsRouter = require('./routes/flights')
const ordersRouter = require('./routes/orders')
const userRouter = require('./routes/user')

function createApp() {
  const app = express()

  app.use(express.json())
  app.use('/api/auth', authRouter)
  app.use('/api/flights', flightsRouter)
  app.use('/api/booking', bookingRouter)
  app.use('/api/orders', ordersRouter)
  app.use('/api/user', userRouter)

  app.get('/health', (_req, res) => {
    res.status(200).json({ ok: true })
  })

  return app
}

module.exports = { createApp }
