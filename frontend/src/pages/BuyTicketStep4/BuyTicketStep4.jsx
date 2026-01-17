import { Link, useLocation } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import styles from './BuyTicketStep4.module.css'

async function safeJson(res) {
  try {
    return await res.json()
  } catch {
    return null
  }
}

function isThenable(value) {
  return !!value && (typeof value === 'object' || typeof value === 'function') && typeof value.then === 'function'
}

export default function BuyTicketStep4() {
  const location = useLocation()
  const params = useMemo(() => new URLSearchParams(location.search), [location.search])
  const bookingDraftId = params.get('bookingDraftId') || ''

  const optimisticOrderId = useMemo(() => {
    const match = bookingDraftId.match(/^DRAFT-(.+)$/)
    if (!match) return ''
    return `ORD-${match[1]}`
  }, [bookingDraftId])

  const [orderId, setOrderId] = useState(optimisticOrderId)
  const [createError, setCreateError] = useState('')

  useEffect(() => {
    if (!bookingDraftId) return

    const resultKey = `bookingCompleteResult:${bookingDraftId}`
    try {
      const cached = sessionStorage.getItem(resultKey)
      if (cached) {
        const parsed = JSON.parse(cached)
        if (typeof parsed?.orderId === 'string') setOrderId(parsed.orderId)
        if (typeof parsed?.error === 'string') setCreateError(parsed.error)
      }
    } catch (error) {
      void error
    }

    const guardKey = `bookingCompleteCalled:${bookingDraftId}`
    try {
      if (sessionStorage.getItem(guardKey) === '1') {
        try {
          if (sessionStorage.getItem(resultKey)) return
        } catch (error) {
          void error
        }
      }
      sessionStorage.setItem(guardKey, '1')
      sessionStorage.setItem(resultKey, JSON.stringify({ pending: true }))
    } catch (error) {
      void error
    }

    setCreateError('订单创建失败，稍后查看订单中心')

    const maybePromise = globalThis.fetch?.(
      `/api/booking/drafts/${encodeURIComponent(bookingDraftId)}/complete`,
      { method: 'POST' }
    )
    if (!isThenable(maybePromise)) {
      return
    }

    void (async () => {
      try {
        const res = await maybePromise
        if (!res || typeof res.ok !== 'boolean') {
          return
        }
        const data = await safeJson(res)
        if (!res.ok) {
          const err = data?.error || '订单创建失败，稍后查看订单中心'
          setCreateError(err)
          try {
            sessionStorage.setItem(resultKey, JSON.stringify({ error: err }))
          } catch (error) {
            void error
          }
          return
        }
        if (typeof data?.orderId === 'string') {
          setOrderId(data.orderId)
          setCreateError('')
          try {
            sessionStorage.setItem(resultKey, JSON.stringify({ orderId: data.orderId }))
          } catch (error) {
            void error
          }
        }
      } catch {
        try {
          sessionStorage.setItem(resultKey, JSON.stringify({ error: '订单创建失败，稍后查看订单中心' }))
        } catch (error) {
          void error
        }
      }
    })()
  }, [bookingDraftId, optimisticOrderId])

  useEffect(() => {
    setOrderId(optimisticOrderId)
  }, [optimisticOrderId])

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.title}>订单信息</div>

        {orderId ? <div>{orderId}</div> : null}
        {createError ? <div>{createError}</div> : null}
        <div className={styles.amount}>¥581</div>

        <div className={styles.route}>上海 → 北京</div>

        <div className={styles.timeRow}>
          <div className={styles.timeBlock}>
            <div className={styles.timeMain}>17:51</div>
            <div className={styles.timeSub}>虹桥</div>
          </div>
          <div className={styles.timeMid} aria-hidden="true">
            →
          </div>
          <div className={styles.timeBlock}>
            <div className={styles.timeMain}>20:19</div>
            <div className={styles.timeSub}>首都</div>
          </div>
        </div>

        <div className={styles.peopleLine}>
          乘机人：姚庆安，身份证 430802 2005 1018 1212
        </div>
        <div className={styles.peopleLine}>联系人：（+86)15874450027</div>

        <div className={styles.list}>
          <div className={styles.row}>
            <div className={styles.rowLeft}>成人套餐</div>
            <div className={styles.rowRight}>¥463 × 1</div>
          </div>
          <div className={styles.row}>
            <div className={styles.rowLeft}>金牌服务包</div>
            <div className={styles.rowRight}>¥48 × 1</div>
          </div>
          <div className={styles.row}>
            <div className={styles.rowLeft}>机建</div>
            <div className={styles.rowRight}>¥50 × 1</div>
          </div>
          <div className={styles.row}>
            <div className={styles.rowLeft}>燃油税</div>
            <div className={styles.rowRight}>¥20 × 1</div>
          </div>

          <div className={styles.giftHead}>
            <span className={styles.giftBadge}>赠品</span>
            订单即享
          </div>
          <div className={styles.giftRow}>
            <div className={styles.giftLeft}>租车92折优惠券</div>
            <div className={styles.giftRight}>免费</div>
          </div>
          <div className={styles.giftRow}>
            <div className={styles.giftLeft}>赠接送机最高8折券</div>
            <div className={styles.giftRight}>免费</div>
          </div>
        </div>
      </div>

      <div className={styles.success}>成功出票</div>
      <Link className={styles.homeBtn} to="/">
        返回首页
      </Link>
    </div>
  )
}
