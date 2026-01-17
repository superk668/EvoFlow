const express = require('express')

const router = express.Router()

router.get('/search', (_req, res) => {
  res.status(501).json({ error: 'Not implemented' })
})

router.get('/:flightId/packages', (_req, res) => {
  res.status(501).json({ error: 'Not implemented' })
})

module.exports = router

