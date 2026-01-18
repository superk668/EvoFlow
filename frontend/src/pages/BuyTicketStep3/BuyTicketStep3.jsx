import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import styles from './BuyTicketStep3.module.css'

function formatMoney(value) {
  const n = Number.parseFloat(String(value))
  if (!Number.isFinite(n)) return '528.00'
  return n.toFixed(2)
}

export default function BuyTicketStep3() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const from = searchParams.get('from') || '北京(BJS)'
  const to = searchParams.get('to') || '上海(SHA)'
  const depAirport = searchParams.get('depAirport') || '大兴国际机场'
  const arrAirport = searchParams.get('arrAirport') || '浦东国际机场T1'
  const date = searchParams.get('date') || '2025-11-25'
  const depTime = searchParams.get('depTime') || '20:50'
  const total = searchParams.get('total') || '528'

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

  function goStep4() {
    const qp = new URLSearchParams(searchParams)
    const search = qp.toString()
    navigate({ pathname: '/buy-ticket/step4', search: search ? `?${search}` : '' })
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
            <div className={styles.infoLine}>乘机人：刘旭航 乘机证件：身份证360924200509100812</div>
          </div>

          <div className={styles.noticeBar}>
            <span className={styles.noticeDot} aria-hidden="true" />
            机票价格变动频繁，请在16:19前完成付款
          </div>

          <div className={styles.payBox}>
            <div className={styles.payOptionActive}>
              <div className={styles.radioChecked} aria-hidden="true" />
              <div className={styles.bankIcon} aria-hidden="true" />
              <div className={styles.payText}>中国银行储蓄卡(9532)</div>
            </div>

            <div className={styles.payOption}>
              <div className={styles.radio} aria-hidden="true" />
              <div className={styles.payText}>使用新卡支付</div>
            </div>

            <div className={styles.payDivider} aria-hidden="true" />

            <button type="button" className={styles.payBtn} onClick={goStep4}>
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
