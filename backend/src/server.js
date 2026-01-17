const { createApp } = require('./app')

const port = Number(process.env.PORT || 5173)
const app = createApp()

app.listen(port, () => {
  process.stdout.write(`backend listening on http://localhost:${port}\n`)
})
