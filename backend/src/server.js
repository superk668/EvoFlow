const { createApp } = require('./app')

const port = process.env.PORT ? Number(process.env.PORT) : 5173
createApp().listen(port)
