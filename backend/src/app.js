const express = require('express')
const { createAuthRouter } = require('./routes/auth')
const { createOrdersRouter } = require('./routes/orders')
const { createPersonalCenterRouter } = require('./routes/personalCenter')
const { createFlightsRouter } = require('./routes/flights')
const { createBookingRouter } = require('./routes/booking')
const { createDb } = require('./db/createDb')

function createApp(options = {}) {
  const app = express()
  app.use(express.json())

  const db = options.db || createDb()
  app.locals.db = db

  app.use('/api/v1/auth', createAuthRouter())
  app.use('/api', createOrdersRouter())
  app.use('/api', createPersonalCenterRouter())
  app.use('/api', createFlightsRouter())
  app.use('/api', createBookingRouter())

  return app
}

module.exports = {
  createApp,
}
