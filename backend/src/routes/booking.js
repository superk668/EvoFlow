const express = require('express')

const router = express.Router()

router.post('/drafts', (_req, res) => {
  res.status(501).json({ error: 'Not implemented' })
})

router.get('/drafts/:bookingDraftId', (_req, res) => {
  res.status(501).json({ error: 'Not implemented' })
})

router.put('/drafts/:bookingDraftId/passengers-contact', (_req, res) => {
  res.status(501).json({ error: 'Not implemented' })
})

router.get('/drafts/:bookingDraftId/services', (_req, res) => {
  res.status(501).json({ error: 'Not implemented' })
})

router.put('/drafts/:bookingDraftId/services', (_req, res) => {
  res.status(501).json({ error: 'Not implemented' })
})

router.post('/drafts/:bookingDraftId/pay', (_req, res) => {
  res.status(501).json({ error: 'Not implemented' })
})

router.post('/drafts/:bookingDraftId/complete', (_req, res) => {
  res.status(501).json({ error: 'Not implemented' })
})

module.exports = router

