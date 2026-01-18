import { useMemo } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import styles from './BuyTicketStep2.module.css'

const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

function formatMmDdWeek(isoDate) {
  const d = new Date(`${isoDate}T00:00:00`)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${mm}-${dd}  ${weekdays[d.getDay()]}`
}

function parseTimeToMinutes(t) {
  const [h, m] = t.split(':').map((v) => Number(v))
  return h * 60 + m
}

function formatDuration(dep, arr) {
  const d0 = parseTimeToMinutes(dep)
  const d1 = parseTimeToMinutes(arr)
  const delta = ((d1 - d0) % 1440 + 1440) % 1440
  const hh = Math.floor(delta / 60)
  const mm = delta % 60
  return `${hh}h${String(mm).padStart(2, '0')}m`
}

export default function BuyTicketStep2() {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()

  const date = searchParams.get('date') || '2026-01-17'
  const from = searchParams.get('from') || '上海(SHA)'
  const to = searchParams.get('to') || '北京(BJS)'
  const flightNo = searchParams.get('flight') || 'KN5987'
  const airline = searchParams.get('airline') || '中国联合航空'
  const cabin = searchParams.get('cabin') || '经济舱'
  const depTime = searchParams.get('depTime') || '20:50'
  const arrTime = searchParams.get('arrTime') || '22:55'
  const depAirport = searchParams.get('depAirport') || '大兴国际机场'
  const arrAirport = searchParams.get('arrAirport') || '浦东国际机场T1'
  const total = searchParams.get('total') || '528'

  const routeTitle = useMemo(() => {
    const f = from.split('(')[0]
    const t = to.split('(')[0]
    return `${formatMmDdWeek(date)}  ${f}  →  ${t}`
  }, [date, from, to])

  const duration = useMemo(() => formatDuration(depTime, arrTime), [depTime, arrTime])

  function goPay() {
    const qp = new URLSearchParams(searchParams)
    const search = qp.toString()
    navigate({ pathname: '/buy-ticket/step3', search: search ? `?${search}` : '' })
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.stepsBar}>
          <div className={styles.steps}>
            <div className={styles.stepDone}>
              <span className={styles.stepDotDone} aria-hidden="true" />
              乘机信息
            </div>
            <div className={styles.stepActive}>
              <span className={styles.stepDotActive} aria-hidden="true" />
              增值服务
            </div>
            <div className={styles.step}>
              <span className={styles.stepDot} aria-hidden="true" />
              支付
            </div>
            <div className={styles.step}>
              <span className={styles.stepDot} aria-hidden="true" />
              完成
            </div>
          </div>
        </div>

        <div className={styles.grid}>
          <div className={styles.left}>
            <div className={styles.noticeRow}>
              <div className={styles.noticeIcon} aria-hidden="true" />
              <div className={styles.noticeText}>15分钟内完成支付，即可拥有机票。</div>
            </div>

            <div className={styles.profileCard}>
              <div className={styles.profileLeft}>
                <div className={styles.profileNo}>1</div>
                <div className={styles.profileType}>成人</div>
                <div className={styles.profileName}>刘旭航</div>
                <div className={styles.profileIdLabel}>身份证</div>
                <div className={styles.profileIdValue}>360924 2005 0910 0812</div>
              </div>
              <div className={styles.profileSep} aria-hidden="true" />
              <div className={styles.profileRight}>
                <div className={styles.avatar} aria-hidden="true" />
                <div className={styles.contactTag}>联系人</div>
                <div className={styles.contactValue}>(+86)18879586080</div>
              </div>
              <Link className={styles.backModify} to={{ pathname: '/buy-ticket/step1', search: location.search }}>
                返回修改
              </Link>
            </div>

            <div className={styles.serviceCard}>
              <div className={styles.serviceSide}>
                <div className={styles.serviceTitle}>为行程添加保障</div>
                <div className={styles.serviceSub}>出行有保险，家人更放心</div>
                <div className={styles.serviceArt} aria-hidden="true" />
              </div>

              <div className={styles.serviceList}>
                <div className={styles.serviceItemActive}>
                  <div className={styles.serviceHead}>
                    <span className={styles.badgeGreen}>更划算</span>
                    <div className={styles.serviceName}>航意航延组合险</div>
                    <div className={styles.serviceMeta}>(2025A)</div>
                    <div className={styles.serviceLink}>投保须知</div>
                    <div className={styles.servicePriceWrap}>
                      <div className={styles.serviceDesc}>意外最高350万+延…</div>
                      <div className={styles.servicePrice}>¥40/人</div>
                      <div className={styles.caretDown} aria-hidden="true" />
                    </div>
                    <button type="button" className={styles.addBtnActive}>
                      添加保障
                      <span className={styles.addCircle} aria-hidden="true" />
                    </button>
                  </div>

                  <div className={styles.serviceBullets}>
                    <div className={styles.bullet}>
                      <span className={styles.checkIcon} aria-hidden="true" />
                      意外保障最高¥350万
                    </div>
                    <div className={styles.bullet}>
                      <span className={styles.checkIcon} aria-hidden="true" />
                      延误最高可赔¥300
                    </div>
                    <div className={styles.bullet}>
                      <span className={styles.checkIcon} aria-hidden="true" />
                      返航、备降赔¥100
                    </div>
                  </div>
                </div>

                <div className={styles.serviceItem}>
                  <div className={styles.serviceRow}>
                    <div className={styles.serviceRowTitle}>航空意外险</div>
                    <div className={styles.serviceRowLink}>投保须知</div>
                    <div className={styles.serviceRowLabel}>标准保障</div>
                    <div className={styles.serviceRowPrice}>¥39/人</div>
                    <div className={styles.caretDownSmall} aria-hidden="true" />
                    <button type="button" className={styles.addBtn}>
                      添加保障
                      <span className={styles.addCircle} aria-hidden="true" />
                    </button>
                  </div>
                  <div className={styles.serviceRowDesc}>航空意外保障最高¥500万，含意外医疗、行李损失等保障</div>
                </div>

                <div className={styles.serviceItem}>
                  <div className={styles.serviceRow}>
                    <div className={styles.serviceRowTitle}>国内旅行险</div>
                    <div className={styles.serviceRowLink}>投保须知</div>
                    <div className={styles.serviceRowLabel}>保2天</div>
                    <div className={styles.serviceRowPrice}>¥75/人</div>
                    <div className={styles.caretDownSmall} aria-hidden="true" />
                    <button type="button" className={styles.addBtn}>
                      添加保障
                      <span className={styles.addCircle} aria-hidden="true" />
                    </button>
                  </div>
                  <div className={styles.serviceRowDesc}>航意最高保¥180万，延误最高赔2张¥400机票券</div>
                </div>

                <div className={styles.serviceFoot}>
                  <span className={styles.infoDot} aria-hidden="true" />
                  本模块为投保页页面，由携程保险代理有限公司管理并运营。请仔细阅读投保须知等内容，并知
                  晓承保保险公司和产品条款内容。如您同意请点击下一步，为确保您的投保权益，您的投保信息
                  将被记录。
                </div>

                <label className={styles.noNeed}>
                  <span className={styles.noNeedBox} aria-hidden="true" />
                  我不需要额外保障
                </label>
              </div>
            </div>

            <div className={styles.payCard}>
              <div className={styles.paySection}>
                <div className={styles.payTitle}>
                  可享优惠 <span className={styles.giftTiny}>礼</span>
                </div>
                <label className={styles.payCheckRow}>
                  <span className={styles.payBox} aria-hidden="true" />
                  使用优惠券
                </label>
              </div>

              <div className={styles.paySection}>
                <div className={styles.payTitle}>报销凭证</div>
                <div className={styles.payText}>
                  支付完成后可开具（乘机日期在2025年9月30日以后的中国内地机票将不再提供纸质行程单。
                  电子行程单需在所有行程结束后180天内申请（承运航司另有规定的除外）。详见国家税务总局、
                  财政部、中国民用航空局公告2024年第9号公告）
                </div>
              </div>

              <div className={styles.paySection}>
                <div className={styles.payTitle}>预订须知</div>
                <label className={styles.payAgreeRow}>
                  <span className={styles.payBoxChecked} aria-hidden="true" />
                  我已阅读并同意
                  <span className={styles.payLink}>购票须知</span>、
                  <span className={styles.payLink}>机票产品预订须知</span>
                </label>
              </div>

              <button type="button" className={styles.payBtn} onClick={goPay}>
                去支付
              </button>
            </div>
          </div>

          <aside className={styles.right}>
            <div className={styles.summaryCard}>
              <div className={styles.summaryTop}>
                <div className={styles.summaryTitle}>{routeTitle}</div>
                <div className={styles.summaryProvider}>
                  <span className={styles.providerIcon} aria-hidden="true" />
                  供应方
                </div>
              </div>

              <div className={styles.summaryFlight}>
                <div className={styles.summaryFlightRow}>
                  <span className={styles.flightIcon} aria-hidden="true" />
                  {airline} {flightNo}
                  <span className={styles.flightSep} aria-hidden="true" />
                  {cabin}
                </div>

                <div className={styles.summaryTimes}>
                  <div className={styles.summaryTimeCol}>
                    <div className={styles.summaryTime}>{depTime}</div>
                    <div className={styles.summaryAirport}>{depAirport}</div>
                  </div>
                  <div className={styles.summaryMid}>
                    <div className={styles.summaryDur}>
                      <span className={styles.clockIcon} aria-hidden="true" />
                      {duration}
                    </div>
                    <div className={styles.summaryLine} aria-hidden="true" />
                    <div className={styles.planeIcon} aria-hidden="true" />
                  </div>
                  <div className={styles.summaryTimeCol}>
                    <div className={styles.summaryTime}>{arrTime}</div>
                    <div className={styles.summaryAirport}>{arrAirport}</div>
                  </div>
                </div>
              </div>

              <div className={styles.fareBlock}>
                <div className={styles.fareHead}>
                  <div className={styles.fareName}>成人套餐</div>
                  <div className={styles.fareLinks}>
                    <span className={styles.fareLink}>退改¥205起</span>
                    <span className={styles.fareLink}>行李额</span>
                  </div>
                  <div className={styles.fareTopPrice}>¥458 × 1</div>
                  <div className={styles.fareCaret} aria-hidden="true" />
                </div>

                <div className={styles.fareRows}>
                  <div className={styles.fareRow}>
                    <div className={styles.fareItem}>成人</div>
                    <div className={styles.farePrice}>¥410 × 1</div>
                  </div>
                  <div className={styles.fareRow}>
                    <div className={styles.fareItem}>金牌服务包</div>
                    <div className={styles.farePrice}>¥48 × 1</div>
                  </div>
                  <div className={styles.fareRow}>
                    <div className={styles.fareItem}>机建</div>
                    <div className={styles.farePrice}>¥50 × 1</div>
                  </div>
                  <div className={styles.fareRow}>
                    <div className={styles.fareItem}>燃油税</div>
                    <div className={styles.farePrice}>¥20 × 1</div>
                  </div>
                </div>
              </div>

              <div className={styles.giftBlock}>
                <div className={styles.giftHead}>
                  <span className={styles.giftBadge}>赠品</span>
                  订票礼包
                </div>
                <div className={styles.giftRow}>
                  <div className={styles.giftItem}>租车92折优惠券</div>
                  <div className={styles.giftFree}>免费</div>
                </div>
                <div className={styles.giftRow}>
                  <div className={styles.giftItem}>赠接送机最高8折券</div>
                  <div className={styles.giftFree}>免费</div>
                </div>
              </div>

              <div className={styles.totalRow}>
                <div className={styles.totalPrice}>¥{total}</div>
              </div>
            </div>
          </aside>
        </div>

        <div className={styles.csFloat}>
          在线
          <br />
          客服
        </div>
      </div>
    </div>
  )
}
