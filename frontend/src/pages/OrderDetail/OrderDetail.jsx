import TopHeader from '../../components/TopHeader/TopHeader.jsx'
import BottomBar from '../../components/BottomBar/BottomBar.jsx'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styles from './OrderDetail.module.css'

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

function getStatusTitle(status) {
  if (status === 'pending_payment') return '待支付'
  if (status === 'upcoming' || status === 'pending_travel') return '未出行'
  if (status === 'completed') return '已完成'
  if (status === 'canceled') return '已取消'
  return status || ''
}

export default function OrderDetail() {
  const navigate = useNavigate()
  const { orderId = '' } = useParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [order, setOrder] = useState(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [isCanceling, setIsCanceling] = useState(false)

  const orderUrl = useMemo(() => `/api/orders/${encodeURIComponent(orderId)}`, [orderId])

  const loadOrder = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch(orderUrl, withOptionalAuth({ method: 'GET' }))
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        if (res.status === 401) {
          navigate('/login', { replace: true })
          return
        }
        setOrder(null)
        setError(data?.error || '加载失败')
        return
      }

      setOrder(data)
    } catch {
      setOrder(null)
      setError('网络异常，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }, [navigate, orderUrl])

  useEffect(() => {
    loadOrder()
  }, [loadOrder])

  const statusTitle = getStatusTitle(order?.status)
  const canCancel = order?.status !== 'canceled' && order?.status !== 'completed'
  const canPay = order?.status === 'pending_payment'

  async function handleConfirmCancel() {
    if (isCanceling) return
    setIsCanceling(true)
    setError('')
    try {
      const cancelUrl = `/api/orders/${encodeURIComponent(orderId)}/cancel`
      const res = await fetch(
        cancelUrl,
        withOptionalAuth({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      )
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        if (res.status === 401) {
          navigate('/login', { replace: true })
          return
        }
        setError(data?.error || '取消失败')
        return
      }
      setShowCancelConfirm(false)
      await loadOrder()
    } catch {
      setError('网络异常，请稍后重试')
    } finally {
      setIsCanceling(false)
    }
  }

  function handlePay() {
    navigate(`/booking/payment/${encodeURIComponent(orderId)}`)
  }

  function handleRebook() {
    navigate('/flights/list')
  }

  return (
    <div className={styles.page}>
      <TopHeader variant="authed" />

      <div className={styles.body}>
        <main className={styles.container}>
          <div className={styles.topRow}>
            <div className={styles.breadcrumb}>
              <span className={styles.breadcrumbLink}>我的携程</span>
              <span className={styles.breadcrumbSep} aria-hidden>
                &gt;
              </span>
              <span className={styles.breadcrumbLink}>机票订单</span>
              <span className={styles.breadcrumbSep} aria-hidden>
                &gt;
              </span>
              <span className={styles.breadcrumbCurrent}>订单详情</span>
            </div>

            <a className={styles.printLink} href="#">
              <span className={styles.printIcon} aria-hidden />
              打印订单
            </a>
          </div>

          <div className={styles.grid}>
            <section className={styles.left}>
              <div className={styles.statusCard}>
                <div className={styles.statusHead}>
                  <div>
                    <div className={styles.statusTitle}>{statusTitle || '订单详情'}</div>
                    {order?.status === 'canceled' ? <div className={styles.statusReason}>取消原因：&nbsp;用户取消</div> : null}
                    <div className={styles.statusActions}>
                      <button className={styles.rebookBtn} type="button" onClick={handleRebook}>
                        再次预订
                      </button>
                      {canCancel ? (
                        <button className={styles.cancelBtn} type="button" onClick={() => setShowCancelConfirm(true)}>
                          取消订单
                        </button>
                      ) : null}
                      {canPay ? (
                        <button className={styles.payBtn} type="button" onClick={handlePay}>
                          去支付
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div className={styles.orderNo}>订单号：&nbsp;{order?.orderNo || orderId}</div>
                </div>

                <div className={styles.statusDivider} aria-hidden />

                <div className={styles.noticeStrip}>
                  <span className={styles.noticeDot} aria-hidden />
                  <div className={styles.noticeStripText}>
                    <span className={styles.noticeStrong}>出行提醒：</span>
                    <span className={styles.noticeStrong}>5条公告</span>
                    &nbsp;·&nbsp;防诈骗提醒&nbsp;·&nbsp;海南航空之大新华航空出行提醒&nbsp;·&nbsp;文明乘机提醒&nbsp;·&nbsp;部分充电宝禁止携带
                    <span className={styles.noticeMore} aria-hidden />
                  </div>
                </div>

                {isLoading ? (
                  <div className={styles.loading} role="status">
                    加载中...
                  </div>
                ) : null}
                {error ? (
                  <div className={styles.error} role="alert">
                    {error}
                  </div>
                ) : null}

                {Array.isArray(order?.segments) && order.segments.length > 0 ? (
                  <div className={styles.segmentCard}>
                    <div className={styles.segmentTitle}>行程信息</div>
                    {order.segments.map((s, idx) => (
                      <div key={idx} className={styles.segmentRow}>
                        <div className={styles.segmentMain}>
                          <span className={styles.segmentNo}>{s?.transportNo || ''}</span>
                          <span className={styles.segmentStations}>
                            {s?.departStation || ''} → {s?.arriveStation || ''}
                          </span>
                        </div>
                        <div className={styles.segmentMeta}>
                          <span>{s?.seatType || ''}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {Array.isArray(order?.travelers) && order.travelers.length > 0 ? (
                  <div className={styles.travelerCard}>
                    <div className={styles.travelerTitle}>旅客信息</div>
                    <div className={styles.travelerList}>
                      {order.travelers.map((t, idx) => (
                        <div key={idx} className={styles.travelerRow}>
                          <span className={styles.travelerName}>{t?.name || ''}</span>
                          <span className={styles.travelerId}>{t?.idNo || ''}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className={styles.npsCard}>
                <div className={styles.npsTitle}>您愿意推荐他人来携程预订机票产品吗?</div>

                <div className={styles.npsScale}>
                  {Array.from({ length: 11 }).map((_, i) => (
                    <div key={i} className={styles.npsBox}>
                      {i}
                    </div>
                  ))}
                </div>

                <div className={styles.npsLabels}>
                  <div className={styles.npsLabelLeft}>
                    <span className={styles.faceSad} aria-hidden />
                    <span>非常不愿意</span>
                  </div>
                  <div className={styles.npsLabelRight}>
                    <span>非常愿意</span>
                    <span className={styles.faceHappy} aria-hidden />
                  </div>
                </div>
              </div>
            </section>

            <aside className={styles.right}>
              <div className={styles.payCard}>
                <div className={styles.payTitle}>订单支付明细</div>
                <div className={styles.payDivider} aria-hidden />

                <div className={styles.payAmountRow}>
                  <div>
                    <div className={styles.payAmountLabel}>下单金额</div>
                    <div className={styles.payAmountTime}>{order?.createdAt || ''}</div>
                  </div>
                  <div className={styles.payAmountValue}>¥{Number(order?.totalAmount) || 0}</div>
                </div>

                {Array.isArray(order?.priceBreakdown) && order.priceBreakdown.length > 0 ? (
                  <div className={styles.payGroup}>
                    <div className={styles.payGroupHead}>
                      <div className={styles.payGroupTitle}>明细</div>
                    </div>

                    {order.priceBreakdown.map((p, idx) => (
                      <div key={idx} className={styles.payLine}>
                        <div className={styles.payLineLabel}>{p?.label || ''}</div>
                        <div className={styles.payLineValue}>
                          <span className={styles.currency}>¥</span>
                          <span className={styles.amountText}>{Number(p?.amount) || 0}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className={styles.payDivider2} aria-hidden />

                <div className={styles.payLine}>
                  <div className={styles.payLineLabel}>赠接送机最高8折券</div>
                  <div className={styles.payLineValue}>¥0&nbsp;&nbsp;×&nbsp;1份</div>
                </div>
                <div className={styles.payLine}>
                  <div className={styles.payLineLabel}>租车92折优惠券</div>
                  <div className={styles.payLineValue}>¥0&nbsp;&nbsp;×&nbsp;1份</div>
                </div>
                <div className={styles.payLine}>
                  <div className={styles.payLineLabel}>金牌服务包</div>
                  <div className={styles.payLineValue}>¥48&nbsp;&nbsp;×&nbsp;1份</div>
                </div>
              </div>
            </aside>
          </div>

          {showCancelConfirm ? (
            <div className={styles.modalMask} role="dialog" aria-modal="true">
              <div className={styles.modalCard}>
                <div className={styles.modalTitle}>确认取消订单？</div>
                <div className={styles.modalActions}>
                  <button className={styles.modalSecondary} type="button" onClick={() => setShowCancelConfirm(false)}>
                    暂不取消
                  </button>
                  <button className={styles.modalPrimary} type="button" onClick={handleConfirmCancel} disabled={isCanceling}>
                    确认取消
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </main>
      </div>

      <BottomBar />
    </div>
  )
}
