import { Link } from 'react-router-dom'
import PlaceholderImage from '../../components/PlaceholderImage/PlaceholderImage.jsx'
import styles from './PersonalCenterOrderDetail.module.css'

export default function PersonalCenterOrderDetail() {
  return (
    <div className={styles.page}>
      <div className={styles.crumbRow}>
        <div className={styles.crumb}>
          <span className={styles.crumbLink}>我的携程</span>
          <span className={styles.crumbSep} aria-hidden="true">
            &gt;
          </span>
          <Link className={styles.crumbLink} to="/personal/orders">
            机票订单
          </Link>
          <span className={styles.crumbSep} aria-hidden="true">
            &gt;
          </span>
          <span className={styles.crumbCurrent}>订单详情</span>
        </div>

        <div className={styles.print}>
          <span className={styles.printIcon} aria-hidden="true">
            <PlaceholderImage name="打印" width={14} height={14} />
          </span>
          打印订单
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.leftCol}>
          <section className={styles.card}>
            <div className={styles.cancelTop}>
              <div className={styles.cancelTitle}>已取消</div>
              <div className={styles.orderNo}>订单号： 1128144831159754</div>
            </div>
            <div className={styles.cancelReason}>取消原因： 支付失败</div>
            <button className={styles.rebookBtn} type="button">
              再次预订
            </button>

            <div className={styles.divider} aria-hidden="true" />

            <div className={styles.noticeBox}>
              <div className={styles.noticeLeft}>
                <span className={styles.noticeIcon} aria-hidden="true">
                  <PlaceholderImage name="出行提醒" width={14} height={14} />
                </span>
                <div className={styles.noticeText}>
                  <span className={styles.noticeStrong}>出行提醒： 4条公告</span>
                  <span className={styles.noticeDot} aria-hidden="true">
                    ·
                  </span>
                  文明乘机提醒
                  <span className={styles.noticeDot} aria-hidden="true">
                    ·
                  </span>
                  防诈骗提醒
                  <span className={styles.noticeDot} aria-hidden="true">
                    ·
                  </span>
                  部分充电宝禁止携带提醒
                  <span className={styles.noticeDot} aria-hidden="true">
                    ·
                  </span>
                  海南航空大新华航空空出行
                </div>
              </div>
              <span className={styles.noticeCaret} aria-hidden="true" />
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.rateTitle}>您愿意推荐他人来携程预订机票产品吗?</div>
            <div className={styles.rateRow}>
              <div className={styles.rateSide}>
                <span className={styles.rateEmoji} aria-hidden="true">
                  😡
                </span>
                <span className={styles.rateSideText}>非常不愿意</span>
              </div>
              <div className={styles.rateSide}>
                <span className={styles.rateSideText}>非常愿意</span>
                <span className={styles.rateEmoji} aria-hidden="true">
                  😍
                </span>
              </div>
            </div>
            <div className={styles.rateNums}>
              {Array.from({ length: 11 }).map((_, idx) => (
                <div key={idx} className={styles.rateNum}>
                  {idx}
                </div>
              ))}
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.tripHead}>
              <div className={styles.tripRoute}>上海→北京</div>
              <div className={styles.tripLinks}>
                <span className={styles.tripLink}>退改签政策</span>
                <span className={styles.tripLink}>行李额规定</span>
                <span className={styles.tripLink}>产品说明</span>
              </div>
            </div>

            <div className={styles.tripBody}>
              <div className={styles.tripLeftTop}>
                <span className={styles.tripTag}>单程</span>
                <span className={styles.tripDate}>12-28 周日</span>
              </div>

              <div className={styles.tripMainRow}>
                <div className={styles.timeCol}>
                  <div className={styles.time}>19:30</div>
                  <div className={styles.duration}>2h30m</div>
                  <div className={styles.time}>22:00</div>
                </div>

                <div className={styles.lineCol} aria-hidden="true">
                  <span className={styles.dot} />
                  <span className={styles.line} />
                  <span className={styles.dot} />
                </div>

                <div className={styles.placeCol}>
                  <div className={styles.placeRow}>
                    <div className={styles.city}>上海</div>
                    <div className={styles.airport}>浦东机场T2</div>
                  </div>
                  <div className={styles.placeRow}>
                    <div className={styles.city}>北京</div>
                    <div className={styles.airport}>首都机场T2</div>
                  </div>
                </div>

                <div className={styles.flightCol}>
                  <div className={styles.flightLine}>
                    <span className={styles.airlineIcon} aria-hidden="true">
                      <PlaceholderImage name="航司-海南航空" width={16} height={16} />
                    </span>
                    海航 | 海南航空 HU7612
                  </div>
                  <div className={styles.flightSub}>惠选经济舱 | 波音738(中) | 有餐食</div>
                </div>
              </div>

              <div className={styles.tripStatus}>
                <span className={styles.tripStatusRed}>已取消：</span>
                <span className={styles.tripStatusName}>姚秋实</span>
                <span className={styles.tripStatusLink}>查看详情</span>
              </div>
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.sectionTitle}>出行人信息</div>
            <div className={styles.infoName}>姚秋实</div>
            <div className={styles.infoRow}>
              <div className={styles.infoLabel}>身份证:</div>
              <div className={styles.infoValue}>430802**********12</div>
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.sectionTitle}>联系信息</div>
            <div className={styles.infoRow}>
              <div className={styles.infoLabel}>手机号:</div>
              <div className={styles.infoValue}>+86 158****0027</div>
            </div>
          </section>
        </div>

        <aside className={styles.rightCol}>
          <section className={styles.payCard}>
            <div className={styles.payTitle}>订单支付明细</div>
            <div className={styles.payDivider} aria-hidden="true" />
            <div className={styles.payTop}>
              <div>
                <div className={styles.payLabel}>下单金额</div>
                <div className={styles.payTime}>12-27 22:32</div>
              </div>
              <div className={styles.payAmount}>¥798</div>
            </div>

            <div className={styles.payBox}>
              <div className={styles.payLine}>
                <div className={styles.payLeft}>成人</div>
                <div className={styles.payRightStrong}>¥750 ×1人</div>
              </div>
              <div className={styles.paySub}>
                <div className={styles.payLeft}>机票价（惠选经济济舱 3.1折）</div>
                <div className={styles.payRight}>¥660 ×1人</div>
              </div>
              <div className={styles.paySub}>
                <div className={styles.payLeft}>机建</div>
                <div className={styles.payRight}>¥50 ×1人</div>
              </div>
              <div className={styles.paySub}>
                <div className={styles.payLeft}>燃油</div>
                <div className={styles.payRight}>¥40 ×1人</div>
              </div>
              <div className={styles.payBoxDivider} aria-hidden="true" />
              <div className={styles.payLine}>
                <div className={styles.payLeft}>赠接送机最高8折券</div>
                <div className={styles.payRightStrong}>¥0 ×1份</div>
              </div>
              <div className={styles.payLine}>
                <div className={styles.payLeft}>租车92折优惠券</div>
                <div className={styles.payRightStrong}>¥0 ×1份</div>
              </div>
              <div className={styles.payLine}>
                <div className={styles.payLeft}>金牌服务包</div>
                <div className={styles.payRightStrong}>¥48 ×1份</div>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}

