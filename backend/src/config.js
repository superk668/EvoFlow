const path = require('path')

function getDatabaseFilePath() {
  if (process.env.NODE_ENV === 'test') {
    return path.join(__dirname, '..', 'test', 'test.sqlite')
  }

  return path.join(__dirname, '..', 'data', 'app.sqlite')
}

module.exports = { getDatabaseFilePath }

