import { useLocation, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import PlaceholderImage from '../../components/PlaceholderImage/PlaceholderImage.jsx'
import styles from './BuyTicketStep1.module.css'

function isValidChinaPhoneNumber(phoneNumber) {
  return typeof phoneNumber === 'string' && /^1\d{10}$/.test(phoneNumber)
}

function isValidChinaIdCard(idNumber) {
  return typeof idNumber === 'string' && /^\d{17}[\dXx]$/.test(idNumber)
}

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

export default function BuyTicketStep1() {
  const navigate = useNavigate()
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const flight = params.get('flight') || 'KN5987'
  const bookingDraftId = params.get('bookingDraftId') || ''

  const [passengerName, setPassengerName] = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [globalError, setGlobalError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canSubmit = useMemo(() => {
    if (isSubmitting) return false
    return true
  }, [isSubmitting])

  async function handleNext() {
    if (!canSubmit) return
    setGlobalError('')

    if (!passengerName.trim()) {
      setGlobalError('请输入旅客姓名')
      return
    }

    if (!isValidChinaIdCard(idNumber)) {
      setGlobalError('证件号码格式不正确')
      return
    }

    if (!isValidChinaPhoneNumber(contactPhone)) {
      setGlobalError('联系人手机号格式不正确')
      return
    }

    if (!bookingDraftId) {
      setGlobalError('网络异常，请稍后重试')
      return
    }

    setIsSubmitting(true)
    try {
      const url = `/api/booking/drafts/${encodeURIComponent(bookingDraftId)}/passengers-contact`
      const payload = {
        passengers: [
          {
            name: passengerName.trim(),
            idType: 'id_card',
            idNumber,
          },
        ],
        contact: {
          phoneNumber: contactPhone,
        },
      }

      const maybePromise = globalThis.fetch?.(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!isThenable(maybePromise)) {
        setGlobalError('网络异常，请稍后重试')
        return
      }

      const res = await maybePromise
      if (!res || typeof res.ok !== 'boolean') {
        setGlobalError('网络异常，请稍后重试')
        return
      }

      const data = await safeJson(res)
      if (!res.ok) {
        setGlobalError(data?.error || '网络异常，请稍后重试')
        return
      }

      const stage = Number(data?.bookingStage)
      if (Number.isFinite(stage)) {
        try {
          sessionStorage.setItem('bookingStage', String(stage))
          sessionStorage.setItem('bookingDraftId', bookingDraftId)
        } catch (error) {
          void error
        }
      }

      navigate(`/booking/services?bookingDraftId=${encodeURIComponent(bookingDraftId)}`)
    } catch {
      setGlobalError('网络异常，请稍后重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.grid}>
        <div className={styles.left}>
          {globalError ? <div>{globalError}</div> : null}
          <div className={styles.noticeBar}>
            <span className={styles.noticeIcon} aria-hidden="true">
              <PlaceholderImage name="提示-信息" width={14} height={14} />
            </span>
            <div className={styles.noticeText}>
              部分产品或出票时间较短，根据中国民用航空局规定：实名制旅客，为了确保您的安全，自2025年8月28日起航班...
            </div>
            <div className={styles.noticeArrow} aria-hidden="true" />
          </div>

          <div className={styles.warnWrap}>
            <div className={styles.warnLine}>
              <span className={styles.warnDot} aria-hidden="true" />
              您预订的产品不可使用退票凭证购买行程单
            </div>
            <div className={styles.warnLine}>
              <span className={styles.warnDot} aria-hidden="true" />
              请注意航班起飞前60分钟内完成出票，保障出行。
            </div>
          </div>

          <section className={styles.section}>
            <div className={styles.sectionTitle}>乘机人</div>
            <div className={styles.sectionCard}>
              <div className={styles.passTagRow}>
                <span className={styles.passTagBox} aria-hidden="true" />
                <span className={styles.passTagText}>财旅家</span>
              </div>

              <div className={styles.passengerCard}>
                <div className={styles.passengerNo}>1</div>
                <div className={styles.passengerForm}>
                  <input
                    className={styles.underlineInput}
                    placeholder="请与登机证件姓名保持一致"
                    value={passengerName}
                    onChange={(e) => setPassengerName(e.target.value)}
                  />

                  <div className={styles.formRow}>
                    <div className={styles.selectLike}>
                      <span>身份证</span>
                      <span className={styles.selectCaret} aria-hidden="true" />
                    </div>
                    <input
                      className={styles.underlineInput}
                      placeholder="登机证件号码"
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value)}
                    />
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.selectLike}>
                      <span>中国 86</span>
                      <span className={styles.selectCaret} aria-hidden="true" />
                    </div>
                    <input className={styles.underlineInput} placeholder="乘机人手机号（选填）" />
                  </div>

                  <div className={styles.checkRow}>
                    <span className={styles.checkBox} aria-hidden="true" />
                    常旅客卡
                  </div>
                </div>

                <div className={styles.passengerDelete}>
                  <span className={styles.deleteIcon} aria-hidden="true">
                    <PlaceholderImage name="删除" width={12} height={12} />
                  </span>
                  删除
                </div>
              </div>

              <button className={styles.addPassenger} type="button">
                <span className={styles.addPlus} aria-hidden="true" />
                新增乘机人
              </button>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionTitle}>联系人</div>
            <div className={styles.sectionCard}>
              <div className={styles.contactRow}>
                <div className={styles.selectLike}>
                  <span>中国 86</span>
                  <span className={styles.selectCaret} aria-hidden="true" />
                </div>
                <input
                  className={styles.underlineInput}
                  placeholder="手机号，接收航变信息"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                />
              </div>
              <div className={styles.contactTip}>
                <span className={styles.tipIcon} aria-hidden="true">
                  <PlaceholderImage name="提示-信息" width={14} height={14} />
                </span>
                订单信息会发送到该手机号，请确认信息准确
              </div>
            </div>
          </section>

          <button className={styles.nextBtn} type="button" disabled={!canSubmit} onClick={handleNext}>
            下一步
          </button>
        </div>

        <aside className={styles.right}>
          <div className={styles.summaryCard}>
            <div className={styles.summaryTop}>
              <div className={styles.summaryRoute}>
                <span className={styles.summaryDate}>01-17</span>
                <span className={styles.summaryWeek}>周六</span>
                <span className={styles.summaryCity}>上海 → 北京</span>
              </div>
              <div className={styles.summarySupplier}>供应方</div>
            </div>

            <div className={styles.summaryAirline}>
              <span className={styles.airlineMark} aria-hidden="true">
                <PlaceholderImage name="航司-中国联合航空" width={18} height={18} />
              </span>
              中国联合航空 {flight} 波音737 <span className={styles.airlineCabin}>经济舱</span>
            </div>

            <div className={styles.timeRow}>
              <div className={styles.timeBlock}>
                <div className={styles.timeMain}>21:05</div>
                <div className={styles.timeSub}>浦东国际机场 T1</div>
              </div>
              <div className={styles.timeMid}>
                <div className={styles.duration}>
                  <span className={styles.clock} aria-hidden="true" /> 2h15m
                </div>
                <div className={styles.timeLine} aria-hidden="true">
                  <span className={styles.planeIcon}>
                    <PlaceholderImage name="飞机" width={18} height={18} />
                  </span>
                </div>
              </div>
              <div className={styles.timeBlock}>
                <div className={styles.timeMain}>23:20</div>
                <div className={styles.timeSub}>大兴国际机场</div>
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
                订票礼包
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
                <div className={styles.totalLabel} />
                <div className={styles.totalValue}>¥528</div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <div className={styles.floatTools}>
        <button className={styles.floatBtn} type="button">
          <div className={styles.floatText}>在线</div>
          <div className={styles.floatText}>客服</div>
        </button>
      </div>
    </div>
  )
}
