import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import styles from './BuyTicketStep3.module.css'

function formatMoney(value) {
  const n = Number.parseFloat(String(value))
  if (!Number.isFinite(n)) return '528.00'
  return n.toFixed(2)
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

export default function BuyTicketStep3() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [payMethod, setPayMethod] = useState('saved')
  const [cardNumber, setCardNumber] = useState('')
  const [cardName, setCardName] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [error, setError] = useState('')
  const [now, setNow] = useState(() => Date.now())
  const [isPaying, setIsPaying] = useState(false)

  const from = searchParams.get('from') || '北京(BJS)'
  const to = searchParams.get('to') || '上海(SHA)'
  const depAirport = searchParams.get('depAirport') || '大兴国际机场'
  const arrAirport = searchParams.get('arrAirport') || '浦东国际机场T1'
  const date = searchParams.get('date') || '2025-11-25'
  const depTime = searchParams.get('depTime') || '20:50'
  const total = searchParams.get('total') || '528'
  const orderId = searchParams.get('orderId') || ''

  const draft = useMemo(() => readBookingDraft(), [])
  const passengerName = draft?.passenger?.name ?? ''
  const passengerIdType = draft?.passenger?.idType ?? ''
  const passengerIdNumber = draft?.passenger?.idNumber ?? ''
  const draftValid = Boolean(passengerName && passengerIdType && passengerIdNumber && draft?.contact?.phoneNumber)

  const order = useMemo(() => {
    const orders = readOrders()
    return orders.find((o) => String(o?.id ?? '') === String(orderId)) ?? null
  }, [orderId])

  const expiresAt = order?.expiresAt ? Date.parse(String(order.expiresAt)) : null
  const isExpired = expiresAt ? now >= expiresAt : false

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const routeText = useMemo(() => {
    const f = from.split('(')[0]
    const t = to.split('(')[0]
    return `${f} - ${t}`
  }, [from, to])

  const depText = useMemo(() => {
    if (!date || !depTime) return '2025-11-25 20:50:00'
    return `${date} ${depTime}:00`
  }, [date, depTime])

  const moneyText = useMemo(() => formatMoney(total), [total])

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

  const payDisabled = !draftValid || isExpired || isPaying || (payMethod === 'new' && !newCardValid)

  async function goStep4() {
    if (payDisabled || !orderId) return
    setError('')
    setIsPaying(true)
    try {
      const resp = await fetch(`/api/orders/${orderId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payMethod }),
      })
      if (!resp.ok) {
        setError('支付失败，请稍后重试')
        return
      }
      const qp = new URLSearchParams(searchParams)
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
              <span className={styles.remainTime}>00:14:47</span>
              <span className={styles.remainTail}>，超时订单可能会被取消</span>
            </div>
          </div>

          <div className={styles.divider} aria-hidden="true" />

          <div className={styles.infoBlock}>
            <div className={styles.infoTitle}>单程机票 {routeText}</div>
            <div className={styles.infoLine}>
              飞机 {depAirport}-{arrAirport} 出发时间：{depText}
            </div>
            {draftValid ? (
              <div className={styles.infoLine}>
                <span>乘机人：</span>
                <span>{passengerName}</span>
                <span> 乘机证件：</span>
                <span>{passengerIdType}</span>
                <span>{maskId(passengerIdNumber)}</span>
              </div>
            ) : (
              <div className={styles.infoLine}>
                <div>乘机人信息异常，请返回重新填写</div>
                <Link to="/buy-ticket/step1">返回订票页</Link>
              </div>
            )}
          </div>

          {isExpired ? (
            <div>
              <div>超出时间，请重新开始订单</div>
              <Link to="/">返回首页</Link>
            </div>
          ) : null}

          <div className={styles.noticeBar}>
            <span className={styles.noticeDot} aria-hidden="true" />
            机票价格变动频繁，请在16:19前完成付款
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
