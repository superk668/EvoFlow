import BottomBar from '../../components/BottomBar/BottomBar.jsx'
import { Link, useLocation } from 'react-router-dom'

import styles from './BuyTicketStep3.module.css'

export default function BuyTicketStep3() {
  const location = useLocation()

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerTitle}>安全支付</div>
          <div className={styles.headerRight}>
            <span className={styles.headerIcon} aria-hidden />
            无障碍
          </div>
        </div>
      </header>

      <div className={styles.body}>
        <div className={styles.container}>
          <section className={styles.card}>
            <div className={styles.cardHead}>
              <div className={styles.amountRow}>
                <div className={styles.amountLabel}>订单金额</div>
                <div className={styles.amountValue}>¥528.00</div>
              </div>
              <div className={styles.remainRow}>
                <div className={styles.remainText}>剩余时间:</div>
                <div className={styles.remainTime}>00:14:39</div>
                <div className={styles.remainHint}>，超时订单可能会被取消</div>
              </div>
            </div>

            <div className={styles.orderInfo}>
              <div className={styles.orderTitle}>单程机票 北京 - 上海</div>
              <div className={styles.orderLine}>飞机 大兴国际机场 - 浦东国际机场T1 出发时间：2025-11-25 20:50:00</div>
              <div className={styles.orderLine}>乘机人：刘鹏航 乘机证件：身份证360924200509100812</div>
            </div>

            <div className={styles.warnBar}>
              <span className={styles.warnIcon} aria-hidden />
              机票价格实时波动，请在16:17前完成付款
            </div>

            <div className={styles.payWrap}>
              <div className={styles.payBox}>
                <div className={styles.payChoiceActive}>
                  <span className={styles.radioChecked} aria-hidden />
                  <span className={styles.bankIcon} aria-hidden />
                  中国银行储蓄卡(9532)
                </div>
                <div className={styles.payChoice}>
                  <span className={styles.radio} aria-hidden />
                  使用新卡支付
                </div>
                <div className={styles.payDivider} />
                <Link className={styles.payBtn} to={`/flights/book/step4${location.search || ''}`}>
                  银行卡支付 ¥528.00
                </Link>
              </div>

              <div className={styles.payAlt}>
                <div className={styles.alipayRow}>
                  <span className={styles.alipayIcon} aria-hidden />
                  支付宝
                </div>
                <div className={styles.morePay}>
                  更多付款方式 <span className={styles.moreCaret} aria-hidden />
                </div>
              </div>
            </div>
          </section>

          <div className={styles.footerTrust}>
            <div className={styles.trustItem}>
              <span className={styles.trustIconShield} aria-hidden />
              携程支付安全保障
            </div>
            <div className={styles.trustItem}>
              <span className={styles.trustIconBadge} aria-hidden />
              通过PCI DSS认证
            </div>
          </div>
        </div>
      </div>

      <BottomBar />
    </div>
  )
}
