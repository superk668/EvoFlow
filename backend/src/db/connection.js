const path = require('path')

function getSqliteFilename() {
  if (process.env.NODE_ENV === 'test') {
    return path.join(__dirname, '..', '..', 'test.sqlite')
  }

  return path.join(__dirname, '..', '..', 'dev.sqlite')
}

module.exports = { getSqliteFilename }

