import TopHeader from '../../components/TopHeader/TopHeader.jsx'
import BottomBar from '../../components/BottomBar/BottomBar.jsx'

import styles from './BuyTicketStep4.module.css'

export default function BuyTicketStep4() {
  return (
    <div className={styles.page}>
      <TopHeader variant="authed" showSearch={false} />

      <div className={styles.progressWrap}>
        <div className={styles.progressInner}>
          <div className={styles.stepDone}>
            <span className={styles.stepDot} aria-hidden />
            <span className={styles.stepLabel}>乘机信息</span>
          </div>
          <div className={styles.stepDone}>
            <span className={styles.stepDot} aria-hidden />
            <span className={styles.stepLabel}>增值服务</span>
          </div>
          <div className={styles.stepDone}>
            <span className={styles.stepDot} aria-hidden />
            <span className={styles.stepLabel}>支付</span>
          </div>
          <div className={styles.stepActive}>
            <span className={styles.stepDot} aria-hidden />
            <span className={styles.stepLabel}>完成</span>
          </div>
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.container}>
          <section className={styles.successCard}>
            <div className={styles.successIcon} aria-hidden />
            <div className={styles.successMain}>
              <div className={styles.successTitle}>支付完成</div>
              <div className={styles.successSub}>出票成功，祝您旅途愉快</div>
            </div>
          </section>

          <section className={styles.ticketCard}>
            <div className={styles.ticketHead}>
              <div className={styles.ticketRoute}>
                <span className={styles.ticketDate}>11-25</span>
                <span className={styles.ticketWeek}>周二</span>
                <span className={styles.ticketFrom}>北京</span>
                <span className={styles.ticketArrow} aria-hidden />
                <span className={styles.ticketTo}>上海</span>
              </div>
              <div className={styles.ticketStatus}>
                <span className={styles.statusDot} aria-hidden /> 已出票
              </div>
            </div>

            <div className={styles.airlineLine}>
              <span className={styles.airlineIcon} aria-hidden />
              <span className={styles.airlineText}>中国联合航空 KN5987</span>
              <span className={styles.airlineMeta}>波音737</span>
              <span className={styles.airlineMeta}>经济舱</span>
            </div>

            <div className={styles.timeRow}>
              <div className={styles.timeCol}>
                <div className={styles.timeBig}>20:50</div>
                <div className={styles.airportText}>大兴国际机场</div>
              </div>
              <div className={styles.timeMid}>
                <div className={styles.duration}>
                  <span className={styles.clockIcon} aria-hidden /> 2h05m
                </div>
                <div className={styles.routeLine}>
                  <span className={styles.routeDot} aria-hidden />
                  <span className={styles.planeIcon} aria-hidden />
                  <span className={styles.routeDot} aria-hidden />
                </div>
              </div>
              <div className={styles.timeColRight}>
                <div className={styles.timeBig}>22:55</div>
                <div className={styles.airportText}>浦东国际机场T1</div>
              </div>
            </div>

            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>乘机人</div>
                <div className={styles.detailValue}>刘鹏航</div>
              </div>
              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>证件号</div>
                <div className={styles.detailValue}>360924200509100812</div>
              </div>
              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>订单金额</div>
                <div className={styles.detailValueStrong}>¥528.00</div>
              </div>
              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>订单号</div>
                <div className={styles.detailValue}>202511250001</div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <BottomBar />
    </div>
  )
}

