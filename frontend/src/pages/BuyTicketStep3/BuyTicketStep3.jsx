import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import styles from './BuyTicketStep3.module.css'
import PlaceholderImage from '../../components/PlaceholderImage/PlaceholderImage.jsx'

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

export default function BuyTicketStep3() {
  const navigate = useNavigate()
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const bookingDraftId = params.get('bookingDraftId') || ''

  const [useNewCard, setUseNewCard] = useState(false)
  const [cardNumber, setCardNumber] = useState('')
  const [cardName, setCardName] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [cardExpire, setCardExpire] = useState('')
  const [globalError, setGlobalError] = useState('')
  const [isPaying, setIsPaying] = useState(false)

  const canPay = useMemo(() => {
    if (isPaying) return false
    return true
  }, [isPaying])

  function isValidCardInfo() {
    const n = cardNumber.replace(/\s+/g, '')
    const name = cardName.trim()
    const cvv = cardCvv.trim()
    const exp = cardExpire.trim()
    if (!n || !/^\d{12,19}$/.test(n)) return false
    if (!name) return false
    if (!/^\d{3,4}$/.test(cvv)) return false
    if (!exp || !/^\d{2}\/\d{2}$/.test(exp)) return false
    return true
  }

  async function handlePay() {
    setGlobalError('')
    if (useNewCard && !isValidCardInfo()) {
      setGlobalError('请填写完整且有效的卡信息')
      return
    }

    if (!bookingDraftId) {
      setGlobalError('支付失败，请稍后重试')
      return
    }

    setIsPaying(true)
    try {
      const url = `/api/booking/drafts/${encodeURIComponent(bookingDraftId)}/pay`
      const maybePromise = globalThis.fetch?.(url, { method: 'POST' })
      if (!isThenable(maybePromise)) {
        setGlobalError('支付失败，请稍后重试')
        return
      }
      const res = await maybePromise
      if (!res || typeof res.ok !== 'boolean') {
        setGlobalError('支付失败，请稍后重试')
        return
      }
      const data = await safeJson(res)
      if (!res.ok) {
        setGlobalError(data?.error || '支付失败，请稍后重试')
        return
      }

      navigate(`/booking/complete?bookingDraftId=${encodeURIComponent(bookingDraftId)}`)
    } catch {
      setGlobalError('支付失败，请稍后重试')
    } finally {
      setIsPaying(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.wrap}>
        <div className={styles.card}>
          <div className={styles.topRow}>
            <div className={styles.amount}>
              订单金额 <span className={styles.amountNum}>¥528.00</span>
            </div>
            <div className={styles.timeTip}>
              剩余时间:<span className={styles.timeNum}>00:14:47</span>，超时订单可能会被取消
            </div>
          </div>

          <div className={styles.title}>单程机票 北京 - 上海</div>
          <div className={styles.meta}>
            飞机 大兴国际机场 - 浦东国际机场T1 出发时间：2025-11-25 20:50:00
          </div>
          <div className={styles.meta}>乘机人：刘旭航 乘机证件：身份证360924200509100812</div>

          <div className={styles.notice}>
            <span className={styles.noticeIcon} aria-hidden="true" />
            机票价格变动频繁，请在16:19前完成付款
          </div>

          <div>价格清单</div>
        </div>

        <div className={styles.payCard}>
          <div className={styles.paySelectRow}>
            <span className={styles.radioOn} aria-hidden="true" />
            <span className={styles.bankIcon} aria-hidden="true">
              <PlaceholderImage name="中国银行" width={18} height={18} />
            </span>
            <span className={styles.bankName}>中国银行储蓄卡(9532)</span>
          </div>

          <div
            className={styles.payOtherRow}
            role="button"
            tabIndex={0}
            onClick={() => setUseNewCard(true)}
          >
            <span className={styles.radioOff} aria-hidden="true" />
            {useNewCard ? '使用新卡' : '使用新卡支付'}
          </div>

          {useNewCard ? (
            <div>
              <div>
                <input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="卡号" />
              </div>
              <div>
                <input value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="持卡人" />
              </div>
              <div>
                <input value={cardExpire} onChange={(e) => setCardExpire(e.target.value)} placeholder="有效期 MM/YY" />
              </div>
              <div>
                <input value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} placeholder="CVV" />
              </div>
            </div>
          ) : null}

          {globalError ? <div>{globalError}</div> : null}

          <div>超出时间，请重新开始订单</div>
          <Link to="/">返回首页</Link>

          <button className={styles.payBtn} type="button" disabled={!canPay} onClick={handlePay}>
            银行卡支付 ¥528.00
          </button>
        </div>

        <div className={styles.aliCard}>
          <div className={styles.aliLeft}>
            <span className={styles.aliIcon} aria-hidden="true">
              <PlaceholderImage name="第三方" width={16} height={16} />
            </span>
            Alipay
          </div>
          <div className={styles.aliRight}>
            更多付款方式 <span className={styles.arrow} aria-hidden="true" />
          </div>
        </div>

        <div className={styles.footerBadges}>
          <div className={styles.badge}>
            <PlaceholderImage name="盾牌" width={22} height={22} />
            <div className={styles.badgeText}>携程付款安全保障</div>
          </div>
          <div className={styles.badge}>
            <PlaceholderImage name="PCI" width={28} height={18} />
            <div className={styles.badgeText}>通过PCI DSS认证</div>
          </div>
        </div>
      </div>
    </div>
  )
}
