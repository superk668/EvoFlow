const express = require('express')

const router = express.Router()

router.get('/profile', (_req, res) => {
  res.status(501).json({ error: 'Not implemented' })
})

router.put('/profile', (_req, res) => {
  res.status(501).json({ error: 'Not implemented' })
})

router.get('/common-travellers', (_req, res) => {
  res.status(501).json({ error: 'Not implemented' })
})

router.get('/common-travellers/:travellerId', (_req, res) => {
  res.status(501).json({ error: 'Not implemented' })
})

router.post('/common-travellers', (_req, res) => {
  res.status(501).json({ error: 'Not implemented' })
})

router.put('/common-travellers/:travellerId', (_req, res) => {
  res.status(501).json({ error: 'Not implemented' })
})

router.delete('/common-travellers', (_req, res) => {
  res.status(501).json({ error: 'Not implemented' })
})

module.exports = router

