const express = require('express')

const router = express.Router()

router.get('/', (_req, res) => {
  res.status(501).json({ error: 'Not implemented' })
})

router.post('/:orderId/cancel', (_req, res) => {
  res.status(501).json({ error: 'Not implemented' })
})

router.get('/:orderId/download', (_req, res) => {
  res.status(501).json({ error: 'Not implemented' })
})

router.get('/:orderId', (_req, res) => {
  res.status(501).json({ error: 'Not implemented' })
})

module.exports = router

