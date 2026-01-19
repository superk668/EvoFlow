import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import styles from './BuyTicketStep3.module.css'
import { useAuth } from '../../auth/AuthContext.jsx'

function formatMoney(value) {
  const n = Number.parseFloat(String(value))
  if (!Number.isFinite(n)) return '0.00'
  return n.toFixed(2)
}

function safeText(value) {
  const s = String(value ?? '').trim()
  return s ? s : '—'
}

function normalizeCityLabel(value) {
  const s = String(value ?? '').trim()
  if (!s) return ''
  return s.split('(')[0].trim()
}

function formatIsoDateTime(iso) {
  const ms = Date.parse(String(iso ?? ''))
  if (!Number.isFinite(ms)) return '—'
  const d = new Date(ms)
  const yyyy = String(d.getFullYear())
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:00`
}

function maskId(idNumber) {
  const s = String(idNumber ?? '').replace(/\s+/g, '')
  if (s.length < 5) return s
  return `${s.slice(0, 3)}**********${s.slice(-2)}`
}

function readBookingDraft() {
  try {
    const raw = sessionStorage.getItem('bookingDraft')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return parsed
  } catch {
    return null
  }
}

function readOrders() {
  try {
    const raw = localStorage.getItem('evoflow_orders')
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function findLatestPendingPaymentOrderId() {
  const orders = readOrders()
  const list = orders
    .map((o) => {
      if (!o || typeof o !== 'object') return null
      const orderId = pickOrderId(o)
      const status = String(o.status ?? '').trim()
      const createdAt = Date.parse(String(o.createdAt ?? ''))
      if (!orderId || status !== 'pending_payment') return null
      return { orderId, createdAt: Number.isFinite(createdAt) ? createdAt : 0 }
    })
    .filter(Boolean)
  list.sort((a, b) => b.createdAt - a.createdAt)
  return list[0]?.orderId || ''
}

function writeOrders(next) {
  try {
    localStorage.setItem('evoflow_orders', JSON.stringify(next))
  } catch {
    void 0
  }
}

function readSession(key) {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function removeSession(key) {
  try {
    sessionStorage.removeItem(key)
  } catch {
    void 0
  }
}

function pickOrderId(raw) {
  return String(raw?.orderId ?? raw?.id ?? '').trim()
}

function formatRemainHhMmSs(ms) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const hh = Math.floor(total / 3600)
  const mm = Math.floor((total % 3600) / 60)
  const ss = total % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
}

export default function BuyTicketStep3() {
  const { auth } = useAuth()
  const [searchParams] = useSearchParams()
  const params = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const [payMethod, setPayMethod] = useState('saved')
  const [cardNumber, setCardNumber] = useState('')
  const [cardName, setCardName] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [error, setError] = useState('')
  const [now, setNow] = useState(() => Date.now())
  const [isPaying, setIsPaying] = useState(false)
  const [expiredByServer, setExpiredByServer] = useState(false)

  const from = searchParams.get('from') || ''
  const to = searchParams.get('to') || ''
  const flightNo = searchParams.get('flight') || ''
  const airline = searchParams.get('airline') || ''
  const cabin = searchParams.get('cabin') || ''
  const depAirport = searchParams.get('depAirport') || ''
  const arrAirport = searchParams.get('arrAirport') || ''
  const date = searchParams.get('date') || ''
  const depTime = searchParams.get('depTime') || ''
  const total = searchParams.get('total') || ''
  const orderIdFromRoute = String(params.orderId || searchParams.get('orderId') || '').trim()

  const draft = useMemo(() => readBookingDraft(), [])
  const passengerName = draft?.passenger?.name ?? ''
  const passengerIdType = draft?.passenger?.idType ?? ''
  const passengerIdNumber = draft?.passenger?.idNumber ?? ''

  useEffect(() => {
    if (orderIdFromRoute) return
    const bySession = String(readSession('createdOrderId') || '').trim()
    const byLocal = String(findLatestPendingPaymentOrderId() || '').trim()
    const resolved = bySession || byLocal
    if (!resolved) return
    const qp = new URLSearchParams(searchParams)
    qp.set('orderId', resolved)
    const search = qp.toString()
    navigate({ pathname: location.pathname, search: search ? `?${search}` : '' }, { replace: true })
  }, [location.pathname, navigate, orderIdFromRoute, searchParams])

  const orderId = orderIdFromRoute

  const order = useMemo(() => {
    const orders = readOrders()
    return orders.find((o) => pickOrderId(o) === orderId) ?? null
  }, [orderId])

  const fromCity = safeText(order?.details?.route?.fromCity || normalizeCityLabel(from))
  const toCity = safeText(order?.details?.route?.toCity || normalizeCityLabel(to))
  const passengerNameText = safeText(order?.details?.passenger?.name || passengerName)
  const passengerIdTypeText = safeText(order?.details?.passenger?.idType || passengerIdType)
  const passengerIdMaskedText = safeText(
    order?.details?.passenger?.idNumberMasked || (passengerIdNumber ? maskId(passengerIdNumber) : ''),
  )
  const passengerDisplayOk =
    passengerNameText !== '—' && passengerIdTypeText !== '—' && passengerIdMaskedText !== '—'
  const moneyText = useMemo(
    () => formatMoney(Number.isFinite(Number(order?.totalAmount)) ? order.totalAmount : total),
    [order?.totalAmount, total],
  )
  const depText = useMemo(() => {
    const detailsDate = String(order?.details?.departDate ?? '').trim()
    const detailsTime = String(order?.details?.depTime ?? '').trim()
    if (detailsDate && detailsTime) return `${detailsDate} ${detailsTime}:00`
    if (order?.departAt) return formatIsoDateTime(order.departAt)
    if (!date || !depTime) return '—'
    return `${date} ${depTime}:00`
  }, [date, depTime, order?.departAt, order?.details?.depTime, order?.details?.departDate])

  const flightMetaText = useMemo(() => {
    const a = String(order?.details?.airline ?? airline).trim()
    const f = String(order?.details?.flightId ?? flightNo).trim()
    const c = String(order?.details?.cabin ?? cabin).trim()
    const parts = [a, f, c].filter(Boolean)
    return parts.join(' ')
  }, [airline, cabin, flightNo, order?.details?.airline, order?.details?.cabin, order?.details?.flightId])

  const depAirportText = useMemo(() => {
    const v = String(order?.details?.depAirport ?? depAirport).trim()
    return safeText(v)
  }, [depAirport, order?.details?.depAirport])

  const arrAirportText = useMemo(() => {
    const v = String(order?.details?.arrAirport ?? arrAirport).trim()
    return safeText(v)
  }, [arrAirport, order?.details?.arrAirport])

  const expiresAtMsRaw = order?.expiresAt ? Date.parse(String(order.expiresAt)) : NaN
  const expiresAtMs = Number.isFinite(expiresAtMsRaw) ? expiresAtMsRaw : null
  const isExpired = expiredByServer || (expiresAtMs ? now >= expiresAtMs : false)
  const remainText = expiresAtMs ? formatRemainHhMmSs(expiresAtMs - now) : '00:15:00'

  useEffect(() => {
    if (!isExpired || !orderId) return
    const createdId = String(readSession('createdOrderId') || '').trim()
    if (createdId && createdId === orderId) removeSession('createdOrderId')
    const orders = readOrders()
    const next = orders.filter((o) => pickOrderId(o) !== orderId)
    if (next.length !== orders.length) writeOrders(next)
  }, [isExpired, orderId])

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const routeText = useMemo(() => {
    return `${fromCity} - ${toCity}`
  }, [fromCity, toCity])

  const newCardValid = useMemo(() => {
    const no = String(cardNumber).replace(/\s+/g, '')
    const name = String(cardName).trim()
    const exp = String(cardExpiry).trim()
    const cvv = String(cardCvv).trim()
    if (!/^\d{16,19}$/.test(no)) return false
    if (!name) return false
    if (!/^(0[1-9]|1[0-2])\/?\d{2}$/.test(exp)) return false
    if (!/^\d{3,4}$/.test(cvv)) return false
    return true
  }, [cardCvv, cardExpiry, cardName, cardNumber])

  const payDisabled = !orderId || !passengerDisplayOk || isExpired || isPaying || (payMethod === 'new' && !newCardValid)

  async function goStep4() {
    if (payDisabled || !orderId) return
    setError('')
    setIsPaying(true)
    try {
      const resp = await fetch(`/api/orders/${orderId}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}),
        },
        body: JSON.stringify({ payMethod, newCard: payMethod === 'new' ? { cardNumber, cardName, cardExpiry, cardCvv } : undefined }),
      })
      if (resp.status === 401) {
        const redirectTo = location.pathname + location.search
        navigate('/login', { state: { from: redirectTo } })
        return
      }
      if (resp.status === 409) {
        setExpiredByServer(true)
        setError('超出时间，请重新开始订单')
        return
      }
      if (resp.status === 422) {
        setError('乘机人信息异常，请返回重新填写')
        return
      }
      if (!resp.ok) {
        setError('支付失败，请稍后重试')
        return
      }
      const qp = new URLSearchParams(searchParams)
      if (!qp.get('orderId')) qp.set('orderId', orderId)
      const search = qp.toString()
      navigate({ pathname: '/buy-ticket/step4', search: search ? `?${search}` : '' })
    } catch {
      setError('支付失败，请稍后重试')
    } finally {
      setIsPaying(false)
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <div className={styles.topInner}>
          <div className={styles.topTitle}>安全支付</div>
          <div className={styles.topRight}>
            <span className={styles.accessIcon} aria-hidden="true" />
            无障碍
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.panel}>
          <div className={styles.panelTop}>
            <div className={styles.amountLeft}>
              <div className={styles.amountLabel}>订单金额</div>
              <div className={styles.amountValue}>¥{moneyText}</div>
            </div>
            <div className={styles.amountRight}>
              <span className={styles.remainLabel}>剩余时间:</span>
              <span className={styles.remainTime}>{remainText}</span>
              <span className={styles.remainTail}>，超时订单可能会被取消</span>
            </div>
          </div>

          <div className={styles.divider} aria-hidden="true" />

          <div className={styles.infoBlock}>
            <div className={styles.infoTitle}>单程机票 {routeText}</div>
            <div className={styles.infoLine}>
              {flightMetaText ? `航班 ${flightMetaText}` : '航班信息'} {depAirportText}-{arrAirportText} 出发时间：{depText}
            </div>
            {!orderId ? (
              <div className={styles.infoLine}>
                <div>订单信息异常，请返回重新填写</div>
                <Link to="/buy-ticket/step1">返回订票页</Link>
                <span> </span>
                <Link to="/user-center/orders">前往订单中心</Link>
              </div>
            ) : null}
            {passengerDisplayOk ? (
              <div className={styles.infoLine}>
                <span>乘机人：</span>
                <span>{passengerNameText}</span>
                <span> 乘机证件：</span>
                <span>{passengerIdTypeText}</span>
                <span>{passengerIdMaskedText}</span>
              </div>
            ) : (
              <div className={styles.infoLine}>
                <div>订单信息异常，请返回重新填写</div>
                <Link to="/buy-ticket/step1">返回订票页</Link>
              </div>
            )}
          </div>

          {isExpired ? (
            <div>
              <div>超出时间，请重新开始订单</div>
              <Link to={{ pathname: '/buy-ticket/step1', search: location.search }}>重新开始</Link>
              <span> </span>
              <Link to="/">返回首页</Link>
            </div>
          ) : null}

          <div className={styles.noticeBar}>
            <span className={styles.noticeDot} aria-hidden="true" />
            机票价格变动频繁，请在 {remainText} 内完成付款
          </div>

          <div className={styles.payBox}>
            <button type="button" className={styles.payOptionActive} onClick={() => setPayMethod('saved')}>
              <div className={styles.radioChecked} aria-hidden="true" />
              <div className={styles.bankIcon} aria-hidden="true" />
              <div className={styles.payText}>中国银行储蓄卡(9532)</div>
            </button>

            <button type="button" className={styles.payOption} aria-label="使用新卡" onClick={() => setPayMethod('new')}>
              <div className={styles.radio} aria-hidden="true" />
              <div className={styles.payText}>使用新卡支付</div>
            </button>

            {payMethod === 'new' ? (
              <div>
                <input placeholder="卡号" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} />
                <input placeholder="姓名" value={cardName} onChange={(e) => setCardName(e.target.value)} />
                <input placeholder="有效期" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} />
                <input placeholder="CVV" value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} />
                {!newCardValid ? <div>请填写完整且有效的卡信息</div> : null}
              </div>
            ) : null}

            <div className={styles.payDivider} aria-hidden="true" />

            {error ? <div>{error}</div> : null}

            <button type="button" className={styles.payBtn} onClick={goStep4} disabled={payDisabled}>
              银行卡支付 ¥{moneyText}
            </button>
          </div>

          <div className={styles.alipayBox}>
            <div className={styles.alipayLeft}>
              <div className={styles.alipayIcon} aria-hidden="true" />
              支付宝
            </div>
            <div className={styles.morePay}>
              更多付款方式 <span className={styles.moreArrow}>›</span>
            </div>
          </div>
        </div>

        <div className={styles.secureRow}>
          <div className={styles.secureItem}>
            <span className={styles.shieldIcon} aria-hidden="true" />
            保障支付安全承诺
          </div>
          <div className={styles.secureItem}>
            <span className={styles.badgeIcon} aria-hidden="true" />
            通过PCI DSS认证
          </div>
        </div>
      </main>
    </div>
  )
}
