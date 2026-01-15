let boundStore = null

function bindOrderStore(store) {
  boundStore = store
}

async function payOrderForUser({ userId, orderId, paymentMethod }) {
  if (!boundStore) throw new Error('Order store not bound')

  const oid = String(orderId || '')
  const uid = String(userId || '')
  const method = String(paymentMethod || '')

  if (!oid || !uid) {
    return { ok: false, reason: 'invalid_input' }
  }

  if (!method) {
    return { ok: false, reason: 'invalid_payment_method' }
  }

  const order = boundStore.ordersById.get(oid)
  if (!order || String(order.userId) !== uid) {
    return { ok: false, reason: 'not_owned_or_missing' }
  }

  if (String(order.status) !== 'pending_payment') {
    return { ok: false, reason: 'not_payable' }
  }

  const paidAt = new Date().toISOString()
  const next = { ...order, status: 'pending_review', paidAt }
  boundStore.ordersById.set(String(next.orderId), next)

  return {
    ok: true,
    order: { orderId: next.orderId, status: next.status, paidAt: next.paidAt },
  }
}

module.exports = {
  bindOrderStore,
  payOrderForUser,
}
