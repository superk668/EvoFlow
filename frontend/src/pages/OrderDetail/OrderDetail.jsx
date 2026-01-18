import { Link, useParams } from 'react-router-dom'
import styles from './OrderDetail.module.css'

export default function OrderDetail() {
  const { orderId } = useParams()

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.breadcrumb}>我的订单 &gt; 订单详情</div>

        <div className={styles.grid}>
          <div className={styles.left}>
            <div className={styles.statusCard}>
              <div className={styles.statusTop}>
                <div>
                  <div className={styles.statusTitle}>待支付</div>
                  <div className={styles.statusSub}>请在最晚支付时间18:06前支付，完成支付才能锁定价格</div>
                </div>
                <div className={styles.orderNo}>订单号：{orderId}</div>
              </div>

              <div className={styles.statusActions}>
                <Link className={styles.payBtn} to="/buy-ticket/step2">
                  去支付
                </Link>
                <button type="button" className={styles.cancelBtn}>
                  申请取消
                </button>
              </div>

              <div className={styles.remindBar}>
                <div className={styles.remindIcon} aria-hidden="true" />
                <div className={styles.remindStrong}>出行提醒：5条公告</div>
                <div className={styles.remindDot} aria-hidden="true" />
                <div className={styles.remindText}>防诈骗提醒</div>
                <div className={styles.remindDot} aria-hidden="true" />
                <div className={styles.remindText}>海南航空大新华航空出行提醒</div>
                <div className={styles.remindDot} aria-hidden="true" />
                <div className={styles.remindText}>文明乘机提醒</div>
                <div className={styles.remindDot} aria-hidden="true" />
                <div className={styles.remindText}>部分充电宝禁止携带</div>
                <div className={styles.remindCaret} aria-hidden="true" />
              </div>
            </div>

            <div className={styles.flightCard}>
              <div className={styles.flightHead}>
                <div className={styles.flightTitle}>上海→北京</div>
                <a className={styles.flightLink} href="#/">
                  退改签政策
                </a>
                <a className={styles.flightLink} href="#/">
                  行李额规定
                </a>
                <a className={styles.flightLink} href="#/">
                  产品说明
                </a>
              </div>

              <div className={styles.itin}>
                <div className={styles.itinLeft}>
                  <div className={styles.itinTag}>单程</div>
                  <div className={styles.itinDate}>12-28 周日</div>
                </div>

                <div className={styles.timeline}>
                  <div className={styles.trow}>
                    <div className={styles.tTime}>19:30</div>
                    <div className={styles.tLine} aria-hidden="true" />
                    <div className={styles.tPlace}>
                      <div className={styles.tCity}>上海</div>
                      <div className={styles.tStation}>浦东机场T2</div>
                    </div>
                  </div>
                  <div className={styles.tmid}>
                    <div className={styles.tDur}>2h30m</div>
                  </div>
                  <div className={styles.trow}>
                    <div className={styles.tTime}>22:00</div>
                    <div className={styles.tLine} aria-hidden="true" />
                    <div className={styles.tPlace}>
                      <div className={styles.tCity}>北京</div>
                      <div className={styles.tStation}>首都机场T2</div>
                    </div>
                  </div>
                </div>

                <div className={styles.itinRight}>
                  <div className={styles.airlineRow}>
                    <div className={styles.airlineIcon} aria-hidden="true" />
                    <div className={styles.airlineText}>海航｜海南航空 HU7612</div>
                  </div>
                  <div className={styles.airlineSub}>惠选经济舱｜波音738(中)｜有餐食</div>
                </div>
              </div>

              <div className={styles.flightAlert}>
                <div className={styles.alertText}>
                  <span className={styles.alertStrong}>已取消：</span> 姚秋实
                </div>
                <a className={styles.alertLink} href="#/">
                  查看详情
                </a>
              </div>
            </div>

            <div className={styles.sectionCard}>
              <div className={styles.sectionTitle}>已购 / 赠送服务</div>
              <div className={styles.serviceList}>
                <div className={styles.serviceItem}>
                  <div className={styles.serviceIconShield} aria-hidden="true" />
                  <div className={styles.serviceText}>45元无忧玩乐礼包，精品快线</div>
                  <a className={styles.serviceLink} href="#/">
                    查看详情 &gt;
                  </a>
                </div>
                <div className={styles.serviceItem}>
                  <div className={styles.serviceIconBag} aria-hidden="true" />
                  <div className={styles.serviceText}>金牌服务包</div>
                  <a className={styles.serviceLink} href="#/">
                    详情已退了 &gt;
                  </a>
                </div>
                <div className={styles.serviceItem}>
                  <div className={styles.serviceIconTicket} aria-hidden="true" />
                  <div className={styles.serviceText}>优惠券</div>
                  <a className={styles.serviceLink} href="#/">
                    查看详情 &gt;
                  </a>
                </div>
              </div>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.sectionTitle}>出行人信息</div>
              <div className={styles.infoBody}>
                <div className={styles.infoName}>姚秋实</div>
                <div className={styles.infoRow}>
                  <div className={styles.infoLabel}>身份证:</div>
                  <div className={styles.infoValue}>430802**********12</div>
                </div>
              </div>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.sectionTitle}>联系信息</div>
              <div className={styles.infoBody}>
                <div className={styles.infoRow}>
                  <div className={styles.infoLabel}>手机号:</div>
                  <div className={styles.infoValue}>+86 158****0027</div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.right}>
            <div className={styles.payCard}>
              <div className={styles.payTitle}>订单支付明细</div>
              <div className={styles.payDivider} aria-hidden="true" />

              <div className={styles.payTopRow}>
                <div>
                  <div className={styles.payAmountLabel}>下单金额</div>
                  <div className={styles.payAmountTime}>12-27 22:32</div>
                </div>
                <div className={styles.payAmountValue}>¥798</div>
              </div>

              <div className={styles.payBox}>
                <div className={styles.payLine}>
                  <div className={styles.payLeft}>成人</div>
                  <div className={styles.payRight}>
                    <span className={styles.payMoney}>¥750</span>
                    <span className={styles.payCount}>×1人</span>
                  </div>
                </div>
                <div className={styles.payLineMuted}>
                  <div className={styles.payLeft}>机票价（惠选经济舱抢 3.1折）</div>
                  <div className={styles.payRight}>
                    <span className={styles.payMoneyMuted}>¥660</span>
                    <span className={styles.payCount}>×1人</span>
                  </div>
                </div>
                <div className={styles.payLineMuted}>
                  <div className={styles.payLeft}>机建</div>
                  <div className={styles.payRight}>
                    <span className={styles.payMoneyMuted}>¥50</span>
                    <span className={styles.payCount}>×1人</span>
                  </div>
                </div>
                <div className={styles.payLineMuted}>
                  <div className={styles.payLeft}>燃油</div>
                  <div className={styles.payRight}>
                    <span className={styles.payMoneyMuted}>¥40</span>
                    <span className={styles.payCount}>×1人</span>
                  </div>
                </div>

                <div className={styles.payHr} aria-hidden="true" />

                <div className={styles.payLine}>
                  <div className={styles.payLeft}>赠接送机最高8折券</div>
                  <div className={styles.payRight}>
                    <span className={styles.payMoney}>¥0</span>
                    <span className={styles.payCount}>×1份</span>
                  </div>
                </div>
                <div className={styles.payLine}>
                  <div className={styles.payLeft}>租车92折优惠券</div>
                  <div className={styles.payRight}>
                    <span className={styles.payMoney}>¥0</span>
                    <span className={styles.payCount}>×1份</span>
                  </div>
                </div>
                <div className={styles.payLine}>
                  <div className={styles.payLeft}>金牌服务包</div>
                  <div className={styles.payRight}>
                    <span className={styles.payMoney}>¥48</span>
                    <span className={styles.payCount}>×1份</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
