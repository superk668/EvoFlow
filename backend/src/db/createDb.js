const path = require('node:path')
const { DatabaseSync } = require('node:sqlite')

function resolveDbFilename(filename) {
  if (!filename) return null
  if (filename === ':memory:') return filename
  return path.resolve(process.cwd(), filename)
}

function createDb(options = {}) {
  const filename =
    options.filename ||
    process.env.DB_FILENAME ||
    (process.env.NODE_ENV === 'test' ? ':memory:' : './dev.sqlite')

  const resolvedFilename = resolveDbFilename(filename)

  return new DatabaseSync(resolvedFilename)
}

module.exports = {
  createDb,
}
