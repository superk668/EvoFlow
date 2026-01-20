import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'

import BookingProgressHeader from '../../components/BookingProgressHeader/BookingProgressHeader.jsx'

import styles from './BookingCompletePage.module.css'

function getAuthToken() {
  try {
    return localStorage.getItem('auth_token') || ''
  } catch {
    return ''
  }
}

function withOptionalAuth(options) {
  const token = getAuthToken()
  if (!token) return options
  const nextHeaders = { ...(options.headers || {}), Authorization: `Bearer ${token}` }
  return { ...options, headers: nextHeaders }
}

export default function BookingCompletePage() {
  const [status, setStatus] = useState('pending_travel')
  const [totalAmount, setTotalAmount] = useState(0)
  const [error, setError] = useState('')

  const latestOrder = useMemo(() => {
    try {
      const raw = localStorage.getItem('evoflow_orders')
      const list = raw ? JSON.parse(raw) : []
      if (!Array.isArray(list) || list.length === 0) return null
      return list[0]
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    if (!latestOrder?.orderId) {
      setError('订单更新失败，稍后查看订单中心')
      return
    }

    setTotalAmount(Number(latestOrder.totalAmount) || 0)
    const orderId = latestOrder.orderId
    const nextStatus = 'pending_travel'
    setStatus(nextStatus)

    try {
      globalThis.fetch?.(
        `/api/orders/${orderId}/status`,
        withOptionalAuth({
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: nextStatus }),
        })
      )
    } catch {
      setError('订单更新失败，稍后查看订单中心')
    }

    try {
      const raw = localStorage.getItem('evoflow_orders')
      const list = raw ? JSON.parse(raw) : []
      if (Array.isArray(list)) {
        const next = list.map((o) => (o?.orderId === orderId ? { ...o, status: nextStatus } : o))
        localStorage.setItem('evoflow_orders', JSON.stringify(next))
      }
    } catch {
      null
    }
  }, [latestOrder])

  return (
    <div className={styles.page}>
      <BookingProgressHeader />

      <main className={styles.container}>
        <h1 className={styles.title}>成功出票</h1>

        {error ? <div role="alert">{error}</div> : null}

        <section className={styles.card}>
          <div className={styles.row}>
            <div className={styles.label}>状态</div>
            <div className={styles.value}>{status}</div>
          </div>
          <div className={styles.row}>
            <div className={styles.label}>总金额</div>
            <div className={styles.value}>¥{Number(totalAmount || 0).toFixed(2)}</div>
          </div>
        </section>

        <Link className={styles.backBtn} to="/">
          返回首页
        </Link>
      </main>
    </div>
  )
}
