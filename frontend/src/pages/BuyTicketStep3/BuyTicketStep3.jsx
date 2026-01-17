import { Link } from 'react-router-dom'
import styles from './BuyTicketStep3.module.css'
import PlaceholderImage from '../../components/PlaceholderImage/PlaceholderImage.jsx'

export default function BuyTicketStep3() {
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
        </div>

        <div className={styles.payCard}>
          <div className={styles.paySelectRow}>
            <span className={styles.radioOn} aria-hidden="true" />
            <span className={styles.bankIcon} aria-hidden="true">
              <PlaceholderImage name="中国银行" width={18} height={18} />
            </span>
            <span className={styles.bankName}>中国银行储蓄卡(9532)</span>
          </div>

          <div className={styles.payOtherRow}>
            <span className={styles.radioOff} aria-hidden="true" />
            使用新卡支付
          </div>

          <Link className={styles.payBtn} to="/buy-ticket/step4">
            银行卡支付 ¥528.00
          </Link>
        </div>

        <div className={styles.aliCard}>
          <div className={styles.aliLeft}>
            <span className={styles.aliIcon} aria-hidden="true">
              <PlaceholderImage name="支付宝" width={16} height={16} />
            </span>
            支付宝
          </div>
          <div className={styles.aliRight}>
            更多付款方式 <span className={styles.arrow} aria-hidden="true" />
          </div>
        </div>

        <div className={styles.footerBadges}>
          <div className={styles.badge}>
            <PlaceholderImage name="支付盾牌" width={22} height={22} />
            <div className={styles.badgeText}>携程支付安全保障</div>
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
