import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext.jsx'
import styles from './OrderDetail.module.css'

const STORAGE_KEY = 'evoflow_orders'

function safeText(value) {
  const s = String(value ?? '').trim()
  return s ? s : '—'
}

function formatMoney(amount) {
  const n = Number(amount)
  if (!Number.isFinite(n)) return '—'
  return `¥${n}`
}

function formatMmDdWeekday(iso) {
  const ms = Date.parse(String(iso ?? ''))
  if (!Number.isFinite(ms)) return '—'
  const d = new Date(ms)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const w = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()]
  return `${mm}-${dd} ${w}`
}

function formatHhMm(iso) {
  const ms = Date.parse(String(iso ?? ''))
  if (!Number.isFinite(ms)) return '—'
  const d = new Date(ms)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

function normalizeOrder(raw) {
  if (!raw || typeof raw !== 'object') return null
  const orderId = String(raw.orderId ?? raw.id ?? '').trim()
  if (!orderId) return null
  const productType = String(raw.productType ?? 'flight').trim() || 'flight'
  const status = String(raw.status ?? '').trim() || 'pending_payment'
  const createdAt = String(raw.createdAt ?? '').trim()
  const departAt = String(raw.departAt ?? '').trim()
  const totalAmount = Number(raw.totalAmount ?? raw.amount ?? 0)

  const detailsRaw = raw.details && typeof raw.details === 'object' ? raw.details : null
  const flightId = String(detailsRaw?.flightId ?? '').trim()
  const routeRaw = detailsRaw?.route && typeof detailsRaw.route === 'object' ? detailsRaw.route : null
  const passengerRaw = detailsRaw?.passenger && typeof detailsRaw.passenger === 'object' ? detailsRaw.passenger : null
  const contactRaw = detailsRaw?.contact && typeof detailsRaw.contact === 'object' ? detailsRaw.contact : null
  const priceItemsRaw = Array.isArray(detailsRaw?.priceItems) ? detailsRaw.priceItems : null

  return {
    orderId,
    productType,
    status,
    createdAt,
    departAt,
    totalAmount: Number.isFinite(totalAmount) ? totalAmount : 0,
    details: {
      flightId: flightId || null,
      route: routeRaw,
      passenger: passengerRaw,
      contact: contactRaw,
      priceItems: priceItemsRaw,
    },
  }
}

function readStoredOrders() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  const parsed = JSON.parse(raw)
  return Array.isArray(parsed) ? parsed : []
}

function calcPriceSum(priceItems) {
  if (!Array.isArray(priceItems)) return 0
  return priceItems.reduce((acc, it) => {
    if (!it || typeof it !== 'object') return acc
    const unitPrice = Number(it.unitPrice ?? 0)
    const quantity = Number(it.quantity ?? 0)
    if (!Number.isFinite(unitPrice) || !Number.isFinite(quantity)) return acc
    return acc + unitPrice * quantity
  }, 0)
}

export default function OrderDetail() {
  const { orderId } = useParams()
  const { auth } = useAuth()
  const navigate = useNavigate()

  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [isCancelling, setIsCancelling] = useState(false)

  useEffect(() => {
    let alive = true
    setError('')
    setNotice('')

    try {
      const local = readStoredOrders().map(normalizeOrder).filter(Boolean)
      const found = local.find((o) => o.orderId === String(orderId)) || null
      if (found && alive) setOrder(found)
    } catch {
      if (alive) setError('订单详情加载失败，请稍后重试')
    }

    fetch(`/api/orders/${encodeURIComponent(String(orderId))}`, {
      headers: auth?.token ? { Authorization: `Bearer ${auth.token}` } : {},
    })
      .then(async (resp) => {
        if (!alive) return
        if (!resp.ok) {
          if (resp.status === 404) setError('订单不存在或您没有权限查看')
          else setError('订单详情加载失败，请稍后重试')
          return
        }
        const data = await resp.json()
        if (!alive) return
        const normalized = normalizeOrder(data?.order)
        if (!normalized) {
          setError('订单详情加载失败，请稍后重试')
          return
        }
        setOrder(normalized)
      })
      .catch(() => {
        if (!alive) return
        setError('订单详情加载失败，请稍后重试')
      })

    return () => {
      alive = false
    }
  }, [auth?.token, orderId])

  const routeText = useMemo(() => {
    const r = order?.details?.route
    if (!r || !r.fromCity || !r.toCity) return '—'
    return `${String(r.fromCity).trim()}→${String(r.toCity).trim()}`
  }, [order?.details?.route])

  const passengerName = safeText(order?.details?.passenger?.name)
  const idType = safeText(order?.details?.passenger?.idType)
  const idNumberMasked = safeText(order?.details?.passenger?.idNumberMasked)
  const phoneNumber = safeText(order?.details?.contact?.phoneNumber)
  const fromCity = safeText(order?.details?.route?.fromCity)
  const toCity = safeText(order?.details?.route?.toCity)
  const departDateText = formatMmDdWeekday(order?.departAt)
  const departTimeText = formatHhMm(order?.departAt)
  const flightText = useMemo(() => {
    const id = safeText(order?.details?.flightId)
    return id === '—' ? '航班信息暂不可用' : id
  }, [order?.details?.flightId])

  const priceItems = order?.details?.priceItems
  const priceSum = useMemo(() => calcPriceSum(priceItems), [priceItems])
  const priceCheckOk = useMemo(() => {
    if (!order) return true
    if (!Array.isArray(priceItems) || priceItems.length === 0) return true
    return priceSum === Number(order.totalAmount)
  }, [order, priceItems, priceSum])

  async function cancelOrder() {
    setNotice('')
    if (!order) return
    if (!window.confirm('确认取消该订单？')) return
    setIsCancelling(true)
    try {
      const resp = await fetch(`/api/orders/${encodeURIComponent(order.orderId)}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}),
        },
        body: JSON.stringify({ status: 'canceled' }),
      })
      if (!resp.ok) {
        setNotice('取消失败')
        return
      }
      setOrder((prev) => (prev ? { ...prev, status: 'canceled' } : prev))
      try {
        const stored = readStoredOrders()
        const next = stored.map((o) => {
          if (!o || typeof o !== 'object') return o
          const id = String(o.orderId ?? o.id ?? '').trim()
          if (id !== String(order.orderId)) return o
          return { ...o, status: 'canceled' }
        })
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        void 0
      }
      window.alert('订单取消成功')
    } catch {
      setNotice('取消失败')
    } finally {
      setIsCancelling(false)
    }
  }

  function reorder() {
    navigate('/buy-ticket/step1')
  }

  if (error) {
    return <div className={styles.page}>{error}</div>
  }

  if (!order) {
    return <div className={styles.page}>加载中</div>
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.breadcrumb}>我的订单 &gt; 订单详情</div>

        <div className={styles.grid}>
          <div className={styles.left}>
            <div className={styles.statusCard}>
              <div className={styles.statusTop}>
                <div>
                  <div className={styles.statusTitle}>{order.status === 'canceled' ? '已取消' : '订单详情'}</div>
                  {!priceCheckOk ? <div>价格明细暂不可用，请稍后重试</div> : null}
                </div>
                <div className={styles.orderNo}>
                  订单号：<span>{String(orderId ?? '')}</span>
                </div>
              </div>

              <div className={styles.statusActions}>
                {order.status !== 'canceled' ? (
                  <button type="button" className={styles.cancelBtn} onClick={cancelOrder} disabled={isCancelling}>
                    取消订单
                  </button>
                ) : (
                  <button type="button" className={styles.payBtn} onClick={reorder}>
                    重新下单
                  </button>
                )}
              </div>

              {notice ? <div>{notice}</div> : null}

              <div className={styles.remindBar}>
                <div className={styles.remindIcon} aria-hidden="true" />
                <div className={styles.remindStrong}>出行提醒：5条公告</div>
                <div className={styles.remindDot} aria-hidden="true" />
                <div className={styles.remindText}>防诈骗提醒</div>
                <div className={styles.remindDot} aria-hidden="true" />
                <div className={styles.remindText}>海南航空大新华航空出行提醒</div>
                <div className={styles.remindDot} aria-hidden="true" />
                <div className={styles.remindText}>文明乘机提醒</div>
                <div className={styles.remindDot} aria-hidden="true" />
                <div className={styles.remindText}>部分充电宝禁止携带</div>
                <div className={styles.remindCaret} aria-hidden="true" />
              </div>
            </div>

            <div className={styles.flightCard}>
              <div className={styles.flightHead}>
                <div className={styles.flightTitle}>{routeText}</div>
                <a className={styles.flightLink} href="#/">
                  退改签政策
                </a>
                <a className={styles.flightLink} href="#/">
                  行李额规定
                </a>
                <a className={styles.flightLink} href="#/">
                  产品说明
                </a>
              </div>

              <div className={styles.itin}>
                <div className={styles.itinLeft}>
                  <div className={styles.itinTag}>单程</div>
                  <div className={styles.itinDate}>{departDateText}</div>
                </div>

                <div className={styles.timeline}>
                  <div className={styles.trow}>
                    <div className={styles.tTime}>{departTimeText}</div>
                    <div className={styles.tLine} aria-hidden="true" />
                    <div className={styles.tPlace}>
                      <div className={styles.tCity}>{fromCity}</div>
                      <div className={styles.tStation}>—</div>
                    </div>
                  </div>
                  <div className={styles.tmid}>
                    <div className={styles.tDur}>—</div>
                  </div>
                  <div className={styles.trow}>
                    <div className={styles.tTime}>—</div>
                    <div className={styles.tLine} aria-hidden="true" />
                    <div className={styles.tPlace}>
                      <div className={styles.tCity}>{toCity}</div>
                      <div className={styles.tStation}>—</div>
                    </div>
                  </div>
                </div>

                <div className={styles.itinRight}>
                  <div className={styles.airlineRow}>
                    <div className={styles.airlineIcon} aria-hidden="true" />
                    <div className={styles.airlineText}>{flightText}</div>
                  </div>
                  <div className={styles.airlineSub}>—</div>
                </div>
              </div>

              {order.status === 'canceled' ? (
                <div className={styles.flightAlert}>
                  <div className={styles.alertText}>
                    <span className={styles.alertStrong}>已取消：</span> {passengerName}
                  </div>
                </div>
              ) : null}
            </div>

            <div className={styles.sectionCard}>
              <div className={styles.sectionTitle}>已购 / 赠送服务</div>
              <div className={styles.serviceList}>
                <div className={styles.serviceItem}>
                  <div className={styles.serviceText}>—</div>
                </div>
              </div>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.sectionTitle}>出行人信息</div>
              <div className={styles.infoBody}>
                <div className={styles.infoName}>{passengerName}</div>
                <div className={styles.infoRow}>
                  <div className={styles.infoLabel}>{idType}:</div>
                  <div className={styles.infoValue}>{idNumberMasked}</div>
                </div>
              </div>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.sectionTitle}>联系信息</div>
              <div className={styles.infoBody}>
                <div className={styles.infoRow}>
                  <div className={styles.infoLabel}>手机号:</div>
                  <div className={styles.infoValue}>{phoneNumber}</div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.right}>
            <div className={styles.payCard}>
              <div className={styles.payTitle}>订单支付明细</div>
              <div className={styles.payDivider} aria-hidden="true" />

              <div className={styles.payTopRow}>
                <div>
                  <div className={styles.payAmountLabel}>下单金额</div>
                  <div className={styles.payAmountTime}>{safeText(order.createdAt)}</div>
                </div>
                <div className={styles.payAmountValue}>{formatMoney(order.totalAmount)}</div>
              </div>

              <div className={styles.payBox}>
                {Array.isArray(priceItems) && priceItems.length > 0 ? (
                  priceItems.map((it, idx) => (
                    <div key={String(it?.name ?? idx)} className={styles.payLine}>
                      <div className={styles.payLeft}>{safeText(it?.name)}</div>
                      <div className={styles.payRight}>
                        <span className={styles.payMoney}>{`${formatMoney(it?.unitPrice)}/人`}</span>
                        <span className={styles.payCount}>×{safeText(it?.quantity)}人</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div>
                    <div>—</div>
                    <div>—</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
