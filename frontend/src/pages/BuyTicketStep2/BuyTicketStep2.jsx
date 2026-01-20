import TopHeader from '../../components/TopHeader/TopHeader.jsx'
import BottomBar from '../../components/BottomBar/BottomBar.jsx'
import { Link, useLocation } from 'react-router-dom'

import styles from './BuyTicketStep2.module.css'

export default function BuyTicketStep2() {
  const location = useLocation()

  return (
    <div className={styles.page}>
      <TopHeader variant="authed" showSearch={false} />

      <div className={styles.progressWrap}>
        <div className={styles.progressInner}>
          <div className={styles.stepDone}>
            <span className={styles.stepDot} aria-hidden />
            <span className={styles.stepLabel}>乘机信息</span>
          </div>
          <div className={styles.stepActive}>
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
            <div className={styles.topTip}>15分钟内完成支付，即可锁定机票。</div>

            <section className={styles.summaryCard}>
              <div className={styles.summaryRow}>
                <div className={styles.summaryCell}>
                  <span className={styles.summaryIndex}>1</span>
                  <span className={styles.summaryType}>成人</span>
                  <span className={styles.summaryName}>刘鹏航</span>
                </div>
                <div className={styles.summaryCell}>
                  <span className={styles.summaryLabel}>身份证</span>
                  <span className={styles.summaryValue}>360924 2005 0910 0812</span>
                </div>
                <div className={styles.summaryCell}>
                  <span className={styles.summaryLabel}>联系人</span>
                  <span className={styles.summaryValue}>(+86)18879586800</span>
                </div>
                <a className={styles.editLink} href="#">
                  返回修改
                </a>
              </div>
            </section>

            <section className={styles.guaranteeCard}>
              <div className={styles.guaranteeHead}>
                <div>
                  <div className={styles.guaranteeTitle}>为行程添加保障</div>
                  <div className={styles.guaranteeSub}>出行有保障，家人也放心</div>
                </div>
              </div>

              <div className={styles.guaranteeBody}>
                <div className={styles.illust} aria-hidden>
                  <div className={styles.illustPerson} />
                  <div className={styles.illustSuitcase} />
                  <div className={styles.illustPlant} />
                </div>

                <div className={styles.guaranteeList}>
                  <div className={styles.guaranteeItem}>
                    <div className={styles.itemLeft}>
                      <div className={styles.itemTitleRow}>
                        <span className={styles.tagGreen}>买划算</span>
                        <span className={styles.itemTitle}>航意航延组合险</span>
                        <span className={styles.itemMeta}>(2025)</span>
                        <span className={styles.itemMetaLink}>保单详情</span>
                      </div>
                      <div className={styles.itemBullets}>
                        <div className={styles.bullet}>
                          <span className={styles.checkIcon} aria-hidden />
                          意外身故/伤残最高350万
                        </div>
                        <div className={styles.bullet}>
                          <span className={styles.checkIcon} aria-hidden />
                          意外医疗最高30万
                        </div>
                        <div className={styles.bullet}>
                          <span className={styles.checkIcon} aria-hidden />
                          延误、取消航班100
                        </div>
                      </div>
                    </div>
                    <div className={styles.itemRight}>
                      <div className={styles.itemPrice}>
                        ¥40<span className={styles.itemPriceUnit}>/人</span>
                        <span className={styles.caretDown} aria-hidden />
                      </div>
                      <button type="button" className={styles.addBtn}>
                        添加保障
                      </button>
                    </div>
                  </div>

                  <div className={styles.guaranteeItem}>
                    <div className={styles.itemLeft}>
                      <div className={styles.itemTitleRow}>
                        <span className={styles.itemTitle}>航空意外险</span>
                        <span className={styles.itemMetaLink}>保单详情</span>
                      </div>
                      <div className={styles.itemDesc}>航空意外保障高达500万，出行更安心，行李丢失保障</div>
                    </div>
                    <div className={styles.itemRight}>
                      <div className={styles.itemPriceSmall}>
                        机票价 <span className={styles.priceOrange}>¥39</span>/人
                        <span className={styles.caretDown} aria-hidden />
                      </div>
                      <button type="button" className={styles.addBtn}>
                        添加保障
                      </button>
                    </div>
                  </div>

                  <div className={styles.guaranteeItem}>
                    <div className={styles.itemLeft}>
                      <div className={styles.itemTitleRow}>
                        <span className={styles.itemTitle}>国内旅行险</span>
                        <span className={styles.itemMetaLink}>保单详情</span>
                      </div>
                      <div className={styles.itemDesc}>机票意外保障更全面，航班延误补贴最高4000/天</div>
                    </div>
                    <div className={styles.itemRight}>
                      <div className={styles.itemPriceSmall}>
                        2天 <span className={styles.priceOrange}>¥75</span>/人
                        <span className={styles.caretDown} aria-hidden />
                      </div>
                      <button type="button" className={styles.addBtn}>
                        添加保障
                      </button>
                    </div>
                  </div>

                  <div className={styles.guaranteeFoot}>
                    <label className={styles.noMoreCheck}>
                      <input type="checkbox" />
                      我不需要额外保障
                    </label>
                  </div>
                </div>
              </div>
            </section>

            <section className={styles.paySection}>
              <div className={styles.payBlock}>
                <div className={styles.payTitleRow}>
                  <div className={styles.payTitle}>可享优惠</div>
                  <span className={styles.giftTag}>礼</span>
                </div>
                <label className={styles.payCheck}>
                  <input type="checkbox" />
                  使用优惠券
                </label>
              </div>

              <div className={styles.payBlock}>
                <div className={styles.payTitle}>报销凭证</div>
                <div className={styles.payText}>
                  支付完成后可开具，请安心购票（乘机日期在2025年9月30日以后的中国内地机票将不再提供纸质行程单。电子行程单需在所有行程结束后180天内申请（承运航司另有规定的除外）。详见国家税务总局、财政部、中国民用航空局公告2024年第9号公告）
                </div>
              </div>

              <div className={styles.payBlock}>
                <div className={styles.payTitle}>预订须知</div>
                <label className={styles.payCheck}>
                  <input type="checkbox" defaultChecked />
                  我已阅读并同意 <a className={styles.inlineLink} href="#">购票须知</a>、<a className={styles.inlineLink} href="#">机票产品预订须知</a>
                </label>
              </div>

              <Link className={styles.payBtn} to={`/flights/book/step3${location.search || ''}`}>
                去支付
              </Link>
            </section>
          </main>

          <aside className={styles.aside}>
            <div className={styles.ticketCard}>
              <div className={styles.ticketHead}>
                <div className={styles.ticketRoute}>
                  <span className={styles.ticketDate}>11-25</span>
                  <span className={styles.ticketWeek}>周二</span>
                  <span className={styles.ticketFrom}>北京</span>
                  <span className={styles.ticketArrow} aria-hidden />
                  <span className={styles.ticketTo}>上海</span>
                </div>
                <div className={styles.supplier}>
                  <span className={styles.infoCircle} aria-hidden /> 供应方
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

              <div className={styles.fareRow}>
                <div className={styles.fareTopLinks}>
                  <span className={styles.fareLink}>成人套餐</span>
                  <span className={styles.fareLinkBlue}>退改¥205起</span>
                  <span className={styles.fareLink}>行李额</span>
                </div>
                <div className={styles.fareTopPrices}>
                  <div className={styles.farePriceLine}>¥458 × 1</div>
                  <span className={styles.caretUp} aria-hidden />
                </div>
              </div>

              <div className={styles.fareList}>
                <div className={styles.fareItem}>
                  <div className={styles.fareNameMain}>
                    <span className={styles.leftBar} aria-hidden />
                    成人
                  </div>
                  <div className={styles.farePrice}>¥410 × 1</div>
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
                <div className={styles.totalPrice}>¥528</div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <BottomBar />
    </div>
  )
}
