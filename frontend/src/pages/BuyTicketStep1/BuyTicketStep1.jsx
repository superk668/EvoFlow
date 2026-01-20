import TopHeader from '../../components/TopHeader/TopHeader.jsx'
import BottomBar from '../../components/BottomBar/BottomBar.jsx'
import { Link, useLocation } from 'react-router-dom'

import styles from './BuyTicketStep1.module.css'

export default function BuyTicketStep1() {
  const location = useLocation()

  return (
    <div className={styles.page}>
      <TopHeader variant="authed" showSearch={false} />

      <div className={styles.progressWrap}>
        <div className={styles.progressInner}>
          <div className={styles.stepActive}>
            <span className={styles.stepDot} aria-hidden />
            <span className={styles.stepLabel}>乘机信息</span>
          </div>
          <div className={styles.step}>
            <span className={styles.stepDot} aria-hidden />
            <span className={styles.stepLabel}>增值服务</span>
          </div>
          <div className={styles.step}>
            <span className={styles.stepDot} aria-hidden />
            <span className={styles.stepLabel}>支付</span>
          </div>
          <div className={styles.step}>
            <span className={styles.stepDot} aria-hidden />
            <span className={styles.stepLabel}>完成</span>
          </div>
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.container}>
          <main className={styles.main}>
            <div className={styles.notice}>
              <div className={styles.noticeRow}>
                <span className={styles.noticeIcon} aria-hidden />
                <span>
                  部分航班出票时需要额外核验中国公民身份信息：字母的姓名，为了确保您的安全，
                  自2025年8月28日起航班将新增核验内容
                </span>
              </div>
              <div className={styles.noticeRow}>
                <span className={styles.noticeIconWarn} aria-hidden />
                <span>您预订的产品不可使用港澳通行证预订</span>
              </div>
              <div className={styles.noticeRow}>
                <span className={styles.noticeIconWarn} aria-hidden />
                <span>该航班预计在起飞前60分钟内完成值机，提前出行，保障出行。</span>
              </div>
            </div>

            <section className={styles.panel}>
              <div className={styles.panelHead}>
                <div className={styles.panelTitle}>乘机人</div>
                <label className={styles.memberCheck}>
                  <input type="checkbox" />
                  航旅会员
                </label>
              </div>

              <div className={styles.passengerCard}>
                <div className={styles.passengerIndex}>1</div>
                <div className={styles.passengerForm}>
                  <div className={styles.passengerTop}>
                    <input className={styles.underlineInput} placeholder="请与登机证件姓名保持一致" />
                    <button type="button" className={styles.deleteBtn}>
                      <span className={styles.deleteIcon} aria-hidden /> 删除
                    </button>
                  </div>

                  <div className={styles.passengerGrid}>
                    <div className={styles.selectLine}>
                      <div className={styles.selectText}>身份证</div>
                      <span className={styles.caretDown} aria-hidden />
                    </div>
                    <input className={styles.underlineInput} placeholder="登机证件号码" />

                    <div className={styles.selectLine}>
                      <div className={styles.selectText}>中国 86</div>
                      <span className={styles.caretDown} aria-hidden />
                    </div>
                    <input className={styles.underlineInput} placeholder="乘机人手机号（选填）" />
                  </div>

                  <label className={styles.ffpCheck}>
                    <input type="checkbox" />
                    常旅客卡
                  </label>
                </div>
              </div>

              <button type="button" className={styles.addPassengerBtn}>
                <span className={styles.addIcon} aria-hidden /> 新增乘机人
              </button>
            </section>

            <section className={styles.panel}>
              <div className={styles.panelHead}>
                <div className={styles.panelTitle}>联系人</div>
              </div>

              <div className={styles.contactRow}>
                <div className={styles.selectLineContact}>
                  <div className={styles.selectText}>中国 86</div>
                  <span className={styles.caretDown} aria-hidden />
                </div>
                <input className={styles.contactInput} placeholder="手机号，接收航变信息" />
              </div>

              <div className={styles.contactHint}>
                <span className={styles.infoIcon} aria-hidden />
                订单信息及航变通知将通过手机发送，请确认信息正确
              </div>
            </section>

            <Link className={styles.nextBtn} to={`/flights/book/step2${location.search || ''}`}>
              下一步
            </Link>
          </main>

          <aside className={styles.aside}>
            <div className={styles.ticketCard}>
              <div className={styles.ticketHead}>
                <div className={styles.ticketRoute}>
                  <span className={styles.ticketDate}>01-17</span>
                  <span className={styles.ticketWeek}>周六</span>
                  <span className={styles.ticketFrom}>上海</span>
                  <span className={styles.ticketArrow} aria-hidden />
                  <span className={styles.ticketTo}>北京</span>
                </div>
                <div className={styles.supplier}>
                  <span className={styles.infoCircle} aria-hidden /> 供应方
                </div>
              </div>

              <div className={styles.airlineLine}>
                <span className={styles.airlineIcon} aria-hidden />
                <span className={styles.airlineText}>中国东方航空 MU5185</span>
                <span className={styles.airlineMeta}>空客330(大)</span>
                <span className={styles.airlineMeta}>经济舱</span>
              </div>

              <div className={styles.timeRow}>
                <div className={styles.timeCol}>
                  <div className={styles.timeBig}>21:05</div>
                  <div className={styles.airportText}>浦东国际机场T1</div>
                </div>
                <div className={styles.timeMid}>
                  <div className={styles.duration}>
                    <span className={styles.clockIcon} aria-hidden /> 2h15m
                  </div>
                  <div className={styles.routeLine}>
                    <span className={styles.routeDot} aria-hidden />
                    <span className={styles.planeIcon} aria-hidden />
                    <span className={styles.routeDot} aria-hidden />
                  </div>
                </div>
                <div className={styles.timeColRight}>
                  <div className={styles.timeBig}>23:20</div>
                  <div className={styles.airportText}>大兴国际机场</div>
                </div>
              </div>

              <div className={styles.fareRow}>
                <div className={styles.fareTopLinks}>
                  <span className={styles.fareLink}>成人套餐</span>
                  <span className={styles.fareLinkBlue}>退改¥200起</span>
                  <span className={styles.fareLink}>行李额</span>
                </div>
                <div className={styles.fareTopPrices}>
                  <div className={styles.farePriceLine}>¥448 × 1</div>
                  <span className={styles.caretUp} aria-hidden />
                </div>
              </div>

              <div className={styles.fareList}>
                <div className={styles.fareItem}>
                  <div className={styles.fareNameMain}>
                    <span className={styles.leftBar} aria-hidden />
                    成人
                  </div>
                  <div className={styles.farePrice}>¥400 × 1</div>
                </div>
                <div className={styles.fareItem}>
                  <div className={styles.fareNameSub}>金牌服务包</div>
                  <div className={styles.farePrice}>¥48 × 1</div>
                </div>
                <div className={styles.fareItem}>
                  <div className={styles.fareNameSub}>机建</div>
                  <div className={styles.farePrice}>¥50 × 1</div>
                </div>
                <div className={styles.fareItem}>
                  <div className={styles.fareNameSub}>燃油税</div>
                  <div className={styles.farePrice}>¥20 × 1</div>
                </div>
              </div>

              <div className={styles.giftHead}>
                <span className={styles.giftBadge}>赠品</span>
                <span className={styles.giftTitle}>订票即享</span>
              </div>
              <div className={styles.giftList}>
                <div className={styles.giftItem}>
                  <div className={styles.giftText}>租车92折优惠券</div>
                  <div className={styles.giftFree}>免费</div>
                </div>
                <div className={styles.giftItem}>
                  <div className={styles.giftText}>赠送接送机最高8折券</div>
                  <div className={styles.giftFree}>免费</div>
                </div>
              </div>

              <div className={styles.totalRow}>
                <div className={styles.totalPrice}>¥518</div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <BottomBar />
    </div>
  )
}
