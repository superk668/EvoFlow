const fs = require('fs')
const path = require('path')

process.env.NODE_ENV = 'test'

const dbFilePath = path.join(__dirname, 'test.sqlite')

fs.mkdirSync(path.dirname(dbFilePath), { recursive: true })

if (!fs.existsSync(dbFilePath)) {
  fs.writeFileSync(dbFilePath, '')
}

