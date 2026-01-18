import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { readBookingDraft, readEvoflowOrders, writeBookingStage } from '../../booking/storage.js'
import styles from './BuyTicketStep3.module.css'

function formatMoney(value) {
  const n = Number.parseFloat(String(value))
  if (!Number.isFinite(n)) return '528.00'
  return n.toFixed(2)
}

export default function BuyTicketStep3() {
  const navigate = useNavigate()

  const { orderId } = useParams()
  const [paymentMethod, setPaymentMethod] = useState('saved')
  const [cardNo, setCardNo] = useState('')
  const [cardName, setCardName] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [error, setError] = useState('')
  const [isPaying, setIsPaying] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState(15 * 60)

  const order = useMemo(() => {
    try {
      const orders = readEvoflowOrders()
      return orders.find((o) => String(o?.orderId) === String(orderId)) || null
    } catch {
      return null
    }
  }, [orderId])

  const draft = useMemo(() => {
    try {
      return readBookingDraft()
    } catch {
      return null
    }
  }, [])

  const from = draft?.from || '北京(BJS)'
  const to = draft?.to || '上海(SHA)'
  const depAirport = draft?.selectedFlight?.depAirport || '大兴国际机场'
  const arrAirport = draft?.selectedFlight?.arrAirport || '浦东国际机场T1'
  const date = draft?.departDate || '2099-01-01'
  const depTime = draft?.selectedFlight?.depTime || '20:50'
  const total = order?.totalAmount ?? 0

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

  useEffect(() => {
    try {
      void writeBookingStage(3)
    } catch {
      void 0
    }
  }, [])

  useEffect(() => {
    const t = setInterval(() => {
      setRemainingSeconds((s) => (s > 0 ? s - 1 : 0))
    }, 1000)
    return () => clearInterval(t)
  }, [])

  const remainText = useMemo(() => {
    const s = Math.max(0, remainingSeconds)
    const mm = String(Math.floor(s / 60)).padStart(2, '0')
    const ss = String(s % 60).padStart(2, '0')
    return `00:${mm}:${ss}`
  }, [remainingSeconds])

  const passenger = draft?.passenger || null
  const canPayPassengerOk = Boolean(passenger?.name && passenger?.idNumber)

  function isValidNewCard() {
    const no = cardNo.replace(/\s+/g, '')
    const exp = cardExpiry.trim()
    const cvv = cardCvv.trim()
    const name = cardName.trim()

    if (!no || !/^\d{12,19}$/.test(no)) return false
    if (!name) return false
    if (!/^(0[1-9]|1[0-2])\/(\d{2})$/.test(exp)) return false
    if (!/^\d{3,4}$/.test(cvv)) return false
    return true
  }

  async function pay() {
    if (isPaying) return
    setError('')

    if (!orderId || !order) {
      setError('订单不存在或您没有权限查看')
      return
    }
    if (!draft || !canPayPassengerOk) {
      setError('乘机人信息异常，请返回重新填写')
      return
    }
    if (remainingSeconds <= 0) {
      setError('超出时间，请重新开始订单')
      return
    }
    if (paymentMethod === 'new' && !isValidNewCard()) {
      setError('请填写完整且有效的卡信息')
      return
    }

    setIsPaying(true)
    try {
      await new Promise((r) => setTimeout(r, 200))
      navigate({ pathname: '/booking/complete', search: `?orderId=${encodeURIComponent(orderId)}` })
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
              飞机 {depAirport}-{arrAirport} 出发时间：{depText}
            </div>
            <div className={styles.infoLine}>
              乘机人：{passenger?.name || '-'} 乘机证件：{passenger?.idType || '-'}{passenger?.idNumber || ''}
            </div>
          </div>

          <div className={styles.noticeBar}>
            <span className={styles.noticeDot} aria-hidden="true" />
            机票价格变动频繁，请在16:19前完成付款
          </div>

          <div className={styles.payBox}>
            <button
              type="button"
              className={paymentMethod === 'saved' ? styles.payOptionActive : styles.payOption}
              onClick={() => setPaymentMethod('saved')}
            >
              <div className={paymentMethod === 'saved' ? styles.radioChecked : styles.radio} aria-hidden="true" />
              <div className={styles.bankIcon} aria-hidden="true" />
              <div className={styles.payText}>中国银行储蓄卡(9532)</div>
            </button>

            <button
              type="button"
              className={paymentMethod === 'new' ? styles.payOptionActive : styles.payOption}
              onClick={() => setPaymentMethod('new')}
            >
              <div className={paymentMethod === 'new' ? styles.radioChecked : styles.radio} aria-hidden="true" />
              <div className={styles.payText}>使用新卡支付</div>
            </button>

            {paymentMethod === 'new' ? (
              <div>
                <input value={cardNo} onChange={(e) => setCardNo(e.target.value)} placeholder="卡号" />
                <input value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="持卡人姓名" />
                <input value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} placeholder="有效期 MM/YY" />
                <input value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} placeholder="CVV" />
              </div>
            ) : null}

            <div className={styles.payDivider} aria-hidden="true" />

            {error ? <div>{error}</div> : null}

            <button type="button" className={styles.payBtn} onClick={pay} disabled={isPaying || remainingSeconds <= 0}>
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
