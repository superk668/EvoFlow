import styles from './OrderDetail.module.css'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'

function formatStatusText(status) {
  if (status === 'pending_payment') return '待支付'
  if (status === 'pending_travel') return '待出行'
  if (status === 'pending_review') return '待点评'
  if (status === 'completed') return '已完成'
  if (status === 'cancelled') return '已取消'
  return String(status || '')
}

function isPriceMismatch(payment) {
  const total = Number(payment?.totalAmount)
  const items = Array.isArray(payment?.items) ? payment.items : []
  const sum = items.reduce((acc, x) => acc + (Number(x?.amount) || 0), 0)
  if (!Number.isFinite(total)) return false
  if (!Number.isFinite(sum)) return false
  return items.length > 0 && sum !== total
}

export default function OrderDetail() {
  const { orderId } = useParams()

  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [order, setOrder] = useState(null)

  const [isCancelling, setIsCancelling] = useState(false)
  const [isRebooking, setIsRebooking] = useState(false)

  const statusText = formatStatusText(order?.status)
  const canCancel = order?.status === 'pending_payment' || order?.status === 'pending_travel'
  const priceMismatch = useMemo(() => isPriceMismatch(order?.payment), [order?.payment])
  const paymentItems = useMemo(
    () => (Array.isArray(order?.payment?.items) ? order.payment.items : []),
    [order?.payment?.items]
  )
  const hideRedundantSingleItemAmount =
    !priceMismatch &&
    paymentItems.length === 1 &&
    Number(paymentItems[0]?.amount) === Number(order?.payment?.totalAmount)
  const primarySegment = (order?.segments || [])[0] || {}
  const primaryPassenger = (order?.passengers || [])[0] || {}

  const loadDetail = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const res = await fetch(`/api/v1/orders/${orderId}`, {
        method: 'GET',
        headers: { Authorization: 'Bearer test_token' },
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setOrder(null)
        setErrorMessage(String(data?.message || '订单详情加载失败，请稍后重试'))
        return
      }

      setOrder(data?.order || null)
    } catch {
      setOrder(null)
      setErrorMessage('订单详情加载失败，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    setActionMessage('')
    loadDetail()
  }, [loadDetail])

  async function cancelOrder() {
    if (!canCancel) return
    const ok = window.confirm('确认取消该订单吗？')
    if (!ok) return

    setIsCancelling(true)
    setActionMessage('')
    try {
      const res = await fetch(`/api/v1/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test_token' },
        body: JSON.stringify({ reason: 'user_cancel' }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setActionMessage(String(data?.message || '取消失败'))
        return
      }

      setActionMessage('订单取消成功')
      await loadDetail()
    } catch {
      setActionMessage('取消失败')
    } finally {
      setIsCancelling(false)
    }
  }

  async function rebook() {
    setIsRebooking(true)
    setActionMessage('')
    try {
      const res = await fetch(`/api/v1/orders/${orderId}/rebook`, {
        method: 'POST',
        headers: { Authorization: 'Bearer test_token' },
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setActionMessage(String(data?.message || '跳转失败'))
        return
      }
      const redirectUrl = String(data?.redirectUrl || '')
      if (!redirectUrl) {
        setActionMessage('跳转失败')
        return
      }
      window.location.hash = `#${redirectUrl}`
    } catch {
      setActionMessage('跳转失败')
    } finally {
      setIsRebooking(false)
    }
  }

  return (
    <div className={styles.page}>
      {isLoading ? <div>加载中</div> : null}
      {errorMessage ? <div>{errorMessage}</div> : null}
      {actionMessage ? <div>{actionMessage}</div> : null}

      {!isLoading && !errorMessage && order ? (
        <div className={styles.grid}>
          <div className={styles.leftCol}>
            <section className={styles.card}>
              <div className={styles.statusHead}>
                <div>
                  <div className={styles.statusTitle}>{statusText === '待出行' ? '支付成功' : statusText}</div>
                  <div>
                    <button type="button" onClick={rebook} disabled={isRebooking}>
                      重新下单
                    </button>
                    {canCancel ? (
                      <button type="button" onClick={cancelOrder} disabled={isCancelling}>
                        取消订单
                      </button>
                    ) : null}
                  </div>
                </div>
                <div className={styles.orderNoRow}>
                  <div className={styles.orderNoLabel}>订单号：</div>
                  <div className={styles.orderNoValue}>{order.orderId}</div>
                </div>
              </div>
            </section>

            <section className={styles.card}>
              <div className={styles.tripHeader}>
                <div className={styles.tripTitle}>{order.title}</div>
              </div>
              <div className={styles.tripBody}>
                <div className={styles.tripLeft}>
                  <div>{primarySegment.departCity || ''}</div>
                  <div>{primarySegment.arriveCity || ''}</div>
                </div>
                <div className={styles.tripRight}>
                  <div className={styles.airlineRow}>
                    <div className={styles.airlineIcon} />
                    <div className={styles.airlineText}>{primarySegment.airlineText || ''}</div>
                  </div>
                  <div className={styles.airlineSub}>{primarySegment.cabinText || ''}</div>
                </div>
              </div>
            </section>

            <section className={styles.card}>
              <div className={styles.blockTitle}>出行人信息</div>
              <div className={styles.infoName}>{primaryPassenger.name || ''}</div>
              <div className={styles.infoRow}>
                <div className={styles.infoLabel}>{primaryPassenger.idType || ''}:</div>
                <div className={styles.infoValue}>{primaryPassenger.idNumberMasked || ''}</div>
              </div>
            </section>

            <section className={styles.card}>
              <div className={styles.blockTitle}>联系信息</div>
              <div className={styles.infoRow}>
                <div className={styles.infoLabel}>手机号:</div>
                <div className={styles.infoValue}>{order.contact?.phoneMasked || ''}</div>
              </div>
              <div className={styles.infoRow}>
                <div className={styles.infoLabel}>邮箱:</div>
                <div className={styles.infoValue}>{order.contact?.emailMasked || ''}</div>
              </div>
            </section>
          </div>

          <aside className={styles.rightCol}>
            <section className={`${styles.card} ${styles.payCard}`}>
              <div className={styles.payTitle}>订单支付明细</div>
              {priceMismatch ? <div>价格明细暂不可用，请稍后重试</div> : null}
              {!priceMismatch ? (
                <div className={styles.payBox}>
                  {paymentItems.map((x, i) => (
                    <div key={i} className={styles.payLine}>
                      <div>{x.name}</div>
                      <div>
                        {hideRedundantSingleItemAmount ? x.qtyText : `¥${x.amount} ${x.qtyText}`}
                      </div>
                    </div>
                  ))}
                  <div className={styles.payLine}>
                    <div>合计</div>
                    <div>¥{order.payment?.totalAmount}</div>
                  </div>
                </div>
              ) : null}
            </section>
          </aside>
        </div>
      ) : null}
    </div>
  )
}
