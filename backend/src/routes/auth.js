const express = require('express')

const router = express.Router()

router.post('/login/password', (_req, res) => {
  res.status(501).json({ error: 'Not implemented' })
})

router.post('/sms/send', (_req, res) => {
  res.status(501).json({ error: 'Not implemented' })
})

router.post('/login/code', (_req, res) => {
  res.status(501).json({ error: 'Not implemented' })
})

router.post('/register/verify-code', (_req, res) => {
  res.status(501).json({ error: 'Not implemented' })
})

router.post('/register/complete', (_req, res) => {
  res.status(501).json({ error: 'Not implemented' })
})

module.exports = router

