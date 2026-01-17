import { useLocation, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import PlaceholderImage from '../../components/PlaceholderImage/PlaceholderImage.jsx'
import styles from './BuyTicketStep2.module.css'

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

export default function BuyTicketStep2() {
  const navigate = useNavigate()
  const location = useLocation()
  const params = useMemo(() => new URLSearchParams(location.search), [location.search])
  const flight = params.get('flight') || 'KN5987'
  const bookingDraftId = params.get('bookingDraftId') || ''

  const [baggageUpgrade, setBaggageUpgrade] = useState(false)
  const [globalError, setGlobalError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const serviceLoadPlaceholder = useMemo(() => {
    const hasExplicitFlight = params.has('flight')
    return hasExplicitFlight ? '' : '加载失败'
  }, [params])

  const canSubmit = useMemo(() => {
    return !isSubmitting
  }, [isSubmitting])

  async function saveServices(nextBaggageUpgrade) {
    if (!bookingDraftId) {
      setGlobalError('网络异常，请稍后重试')
      return { ok: false, data: null }
    }

    const url = `/api/booking/drafts/${encodeURIComponent(bookingDraftId)}/services`
    const payload = {
      services: {
        baggageUpgrade: !!nextBaggageUpgrade,
      },
    }

    const maybePromise = globalThis.fetch?.(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!isThenable(maybePromise)) {
      setGlobalError('网络异常，请稍后重试')
      return { ok: false, data: null }
    }

    try {
      const res = await maybePromise
      if (!res || typeof res.ok !== 'boolean') {
        setGlobalError('网络异常，请稍后重试')
        return { ok: false, data: null }
      }
      const data = await safeJson(res)
      if (!res.ok) {
        setGlobalError(data?.error || '服务暂不可用')
        return { ok: false, data }
      }
      return { ok: true, data }
    } catch {
      setGlobalError('网络异常，请稍后重试')
      return { ok: false, data: null }
    }
  }

  async function handleToggleBaggageUpgrade(nextChecked) {
    setGlobalError('')
    setBaggageUpgrade(nextChecked)
    const result = await saveServices(nextChecked)
    if (!result.ok) {
      setBaggageUpgrade(false)
    }
  }

  async function handleGoPay() {
    if (!canSubmit) return
    setGlobalError('')
    setIsSubmitting(true)
    try {
      const result = await saveServices(baggageUpgrade)
      const stage = Number(result?.data?.bookingStage)
      if (Number.isFinite(stage)) {
        try {
          sessionStorage.setItem('bookingStage', String(stage))
          if (bookingDraftId) sessionStorage.setItem('bookingDraftId', bookingDraftId)
        } catch (error) {
          void error
        }
      }
    } finally {
      setIsSubmitting(false)
      if (bookingDraftId) {
        navigate(`/booking/payment?bookingDraftId=${encodeURIComponent(bookingDraftId)}`)
      } else {
        navigate('/booking/payment')
      }
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.grid}>
        <div className={styles.left}>
          <div className={styles.noticeBar}>15分钟内完成支付，否则订单将取消。</div>

          {serviceLoadPlaceholder ? <div>{serviceLoadPlaceholder}</div> : null}
          {globalError ? <div>{globalError}</div> : null}

          <div>
            <label>
              <input
                type="checkbox"
                aria-label="行李额升级"
                checked={baggageUpgrade}
                onChange={(e) => handleToggleBaggageUpgrade(e.target.checked)}
              />
              行李额升级
            </label>
          </div>

          <div className={styles.personCard}>
            <div className={styles.backEdit}>返回修改</div>

            <div className={styles.personLeft}>
              <div className={styles.personIndex}>1</div>
              <div className={styles.personLine}>
                <div className={styles.personType}>成人</div>
                <div className={styles.personName}>刘旭航</div>
                <div className={styles.personIdLabel}>身份证</div>
                <div className={styles.personId}>360924 2005 0910 0812</div>
              </div>
            </div>

            <div className={styles.personDivider} aria-hidden="true" />

            <div className={styles.personRight}>
              <div className={styles.avatar} aria-hidden="true">
                <PlaceholderImage name="乘机人头像" width={44} height={44} />
              </div>
              <div className={styles.contactBlock}>
                <div className={styles.contactPhone}>(+86)18879586080</div>
                <div className={styles.contactLabel}>联系人</div>
              </div>
            </div>
          </div>

          <div className={styles.insuranceCard}>
            <div className={styles.insuranceLeft}>
              <div className={styles.insuranceTitle}>为行程添加保障</div>
              <div className={styles.insuranceSub}>出行有保险，家人更放心</div>
              <div className={styles.illusWrap} aria-hidden="true">
                <PlaceholderImage name="行程保障插画" width={260} height={180} />
              </div>
            </div>

            <div className={styles.insuranceRight}>
              <div className={styles.insuranceItem}>
                <div className={styles.insuranceMain}>
                  <div className={styles.insuranceHead}>
                    <div className={styles.insuranceNameRow}>
                      <span className={styles.tagGreen}>更划算</span>
                      <span className={styles.insuranceName}>航意航延组合险</span>
                      <span className={styles.insuranceCode}>（2025A）</span>
                      <span className={styles.linkBlue}>投保须知</span>
                    </div>
                    <div className={styles.priceLine}>
                      <span className={styles.priceDesc}>意外最高350万+延…</span>
                      <span className={styles.priceOrange}>¥40/人</span>
                      <span className={styles.dropCaret} aria-hidden="true" />
                    </div>
                  </div>

                  <div className={styles.insuranceBullets}>
                    <div className={styles.bulletRow}>
                      <span className={styles.tick} aria-hidden="true" />
                      意外保障最高¥350万
                    </div>
                    <div className={styles.bulletRow}>
                      <span className={styles.tick} aria-hidden="true" />
                      延误最高可赔¥300
                    </div>
                    <div className={styles.bulletRow}>
                      <span className={styles.tick} aria-hidden="true" />
                      返航、备降赔¥100
                    </div>
                  </div>
                </div>

                <button className={styles.addBtn} type="button">
                  添加保障
                  <span className={styles.addArrow} aria-hidden="true" />
                </button>
              </div>

              <div className={styles.insuranceItem}>
                <div className={styles.insuranceMain}>
                  <div className={styles.insuranceHead}>
                    <div className={styles.insuranceNameRow}>
                      <span className={styles.insuranceName}>航空意外险</span>
                      <span className={styles.linkBlue}>投保须知</span>
                      <span className={styles.insuranceMeta}>标准保障</span>
                    </div>
                    <div className={styles.priceLine}>
                      <span className={styles.priceOrangeSmall}>¥39/人</span>
                      <span className={styles.dropCaret} aria-hidden="true" />
                    </div>
                  </div>
                  <div className={styles.insuranceDesc}>航空意外保障最高¥500万，含意外医疗、行李损失等保障</div>
                </div>
                <button className={styles.addBtn} type="button">
                  添加保障
                  <span className={styles.addArrow} aria-hidden="true" />
                </button>
              </div>

              <div className={styles.insuranceItem}>
                <div className={styles.insuranceMain}>
                  <div className={styles.insuranceHead}>
                    <div className={styles.insuranceNameRow}>
                      <span className={styles.insuranceName}>国内旅行险</span>
                      <span className={styles.linkBlue}>投保须知</span>
                      <span className={styles.insuranceMeta}>保2天</span>
                    </div>
                    <div className={styles.priceLine}>
                      <span className={styles.priceOrangeSmall}>¥75/人</span>
                      <span className={styles.dropCaret} aria-hidden="true" />
                    </div>
                  </div>
                  <div className={styles.insuranceDesc}>航意最高保¥180万，延误最高赔2张¥400机票券等</div>
                </div>
                <button className={styles.addBtn} type="button">
                  添加保障
                  <span className={styles.addArrow} aria-hidden="true" />
                </button>
              </div>

              <div className={styles.insuranceNote}>
                <span className={styles.noteIcon} aria-hidden="true" />
                本模块为投保页面，由携程保险代理有限公司管理并运营。请仔细阅读投保须知等内容，并知晓承保保险公司和产品条款内容。如您同意请点击下一步，为确保您的投保权益，您的投保信息轨迹将被记录。
              </div>

              <div className={styles.noNeedRow}>
                <span className={styles.checkEmpty} aria-hidden="true" />
                我不需要额外保障
              </div>
            </div>
          </div>

          <div className={styles.payArea}>
            <div className={styles.bigTitle}>
              可享优惠<span className={styles.giftTag}>礼</span>
            </div>
            <div className={styles.rowCheck}>
              <span className={styles.checkEmpty} aria-hidden="true" />
              使用优惠券
            </div>

            <div className={styles.bigTitle}>报销凭证</div>
            <div className={styles.paragraph}>
              支付完成后可开具，请安心购票（乘机日期在2025年9月30日以后的中国内地机票将不再提供纸质行程单。电子行程单需在所有行程结束后180天内申请（承运航司另有规定的除外）。）详见国家税务总局、财政部、中国民用航空局公告2024年第9号公告）
            </div>

            <div className={styles.bigTitle}>预订须知</div>
            <div className={styles.rowCheck}>
              <span className={[styles.checkEmpty, styles.checkOn].join(' ')} aria-hidden="true" />
              我已阅读并同意 <span className={styles.linkBlue}>购票须知</span>、<span className={styles.linkBlue}>机票产品预订须知</span>
            </div>

            <button className={styles.goPayBtn} type="button" disabled={!canSubmit} onClick={handleGoPay}>
              去支付
            </button>
          </div>
        </div>

        <aside className={styles.right}>
          <div className={styles.summaryCard}>
            <div className={styles.summaryTop}>
              <div className={styles.summaryRoute}>
                <span className={styles.summaryDate}>11-25</span>
                <span className={styles.summaryWeek}>周二</span>
                <span className={styles.summaryCity}>北京 → 上海</span>
              </div>
              <div className={styles.summarySupplier}>供应方</div>
            </div>

            <div className={styles.summaryAirline}>
              <span className={styles.airlineMark} aria-hidden="true" />
              中国联合航空 {flight} <span className={styles.airlineSep}>波音737</span>{' '}
              <span className={styles.airlineCabin}>经济舱</span>
            </div>

            <div className={styles.timeRow}>
              <div className={styles.timeBlock}>
                <div className={styles.timeMain}>20:50</div>
                <div className={styles.timeSub}>大兴国际机场</div>
              </div>
              <div className={styles.timeMid}>
                <div className={styles.duration}>
                  <span className={styles.clock} aria-hidden="true" /> 2h05m
                </div>
                <div className={styles.timeLine} aria-hidden="true">
                  <span className={styles.planeIcon}>
                    <PlaceholderImage name="飞机" width={18} height={18} />
                  </span>
                </div>
              </div>
              <div className={styles.timeBlock}>
                <div className={styles.timeMain}>22:55</div>
                <div className={styles.timeSub}>浦东国际机场T1</div>
              </div>
            </div>

            <div className={styles.priceBox}>
              <div className={styles.priceRowHead}>
                <div className={styles.priceLeft}>
                  <div className={styles.priceTitle}>成人套餐</div>
                  <div className={styles.priceLinks}>
                    <span className={styles.linkBlue}>退改¥205起</span>
                    <span className={styles.linkBlue}>行李额</span>
                  </div>
                </div>
                <div className={styles.priceRight}>
                  <div className={styles.priceAmount}>¥458 × 1</div>
                  <div className={styles.priceCaret} aria-hidden="true" />
                </div>
              </div>

              <div className={styles.breakdown}>
                <div className={styles.breakRow}>
                  <div className={styles.breakLabel}>成人</div>
                  <div className={styles.breakVal}>¥410 × 1</div>
                </div>
                <div className={styles.breakRow}>
                  <div className={styles.breakLabel}>金牌服务包</div>
                  <div className={styles.breakVal}>¥48 × 1</div>
                </div>
                <div className={styles.breakRow}>
                  <div className={styles.breakLabel}>机建</div>
                  <div className={styles.breakVal}>¥50 × 1</div>
                </div>
                <div className={styles.breakRow}>
                  <div className={styles.breakLabel}>燃油税</div>
                  <div className={styles.breakVal}>¥20 × 1</div>
                </div>
              </div>

              <div className={styles.giftHead}>
                <span className={styles.giftBadge}>赠品</span>
                订单即享
              </div>
              <div className={styles.giftRow}>
                <div className={styles.giftLabel}>租车92折优惠券</div>
                <div className={styles.giftVal}>免费</div>
              </div>
              <div className={styles.giftRow}>
                <div className={styles.giftLabel}>赠接送机最高8折券</div>
                <div className={styles.giftVal}>免费</div>
              </div>

              <div className={styles.totalRow}>
                <div className={styles.totalValue}>¥528</div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
