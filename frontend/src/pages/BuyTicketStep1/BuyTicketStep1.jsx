import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import styles from './BuyTicketStep1.module.css'

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

function isValidIdCardNumber(value) {
  return /^\d{17}[\dXx]$/.test(String(value).trim())
}

function isValidPhoneNumber(value) {
  return /^1\d{10}$/.test(String(value).trim())
}

function readBookingDraft() {
  try {
    const raw = sessionStorage.getItem('bookingDraft')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return parsed
  } catch {
    return null
  }
}

function writeBookingDraft(draft) {
  sessionStorage.setItem('bookingDraft', JSON.stringify(draft))
}

export default function BuyTicketStep1() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [error, setError] = useState('')
  const [fieldError, setFieldError] = useState({ name: '', idNumber: '', contactPhone: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const date = searchParams.get('date') || '2026-01-17'
  const from = searchParams.get('from') || '上海(SHA)'
  const to = searchParams.get('to') || '北京(BJS)'
  const flightNo = searchParams.get('flight') || 'MU5185'
  const airline = searchParams.get('airline') || '东方航空'
  const cabin = searchParams.get('cabin') || '经济舱'
  const depTime = searchParams.get('depTime') || '21:05'
  const arrTime = searchParams.get('arrTime') || '23:20'
  const depAirport = searchParams.get('depAirport') || '浦东国际机场T1'
  const arrAirport = searchParams.get('arrAirport') || '大兴国际机场'
  const total = searchParams.get('total') || '518'

  const routeTitle = useMemo(() => {
    const f = from.split('(')[0]
    const t = to.split('(')[0]
    return `${formatMmDdWeek(date)}  ${f}  →  ${t}`
  }, [date, from, to])

  const duration = useMemo(() => formatDuration(depTime, arrTime), [depTime, arrTime])

  async function goStep2() {
    setError('')
    setFieldError({ name: '', idNumber: '', contactPhone: '' })

    const existingDraft = readBookingDraft()
    if (existingDraft && !existingDraft.packageId) {
      setError('套餐信息异常，请重试')
      return
    }

    const nextFieldError = { name: '', idNumber: '', contactPhone: '' }
    const nextName = String(name).trim()
    const nextId = String(idNumber).trim()
    const nextContact = String(contactPhone).trim()

    if (!nextName) nextFieldError.name = '请输入姓名'
    if (!isValidIdCardNumber(nextId)) nextFieldError.idNumber = '证件号码格式不正确'
    if (!isValidPhoneNumber(nextContact)) nextFieldError.contactPhone = '联系人手机号格式不正确'

    setFieldError(nextFieldError)
    if (nextFieldError.name || nextFieldError.idNumber || nextFieldError.contactPhone) return

    const currentDraft = existingDraft ?? {
      flightId: searchParams.get('flight') || null,
      packageId: searchParams.get('fare') || null,
      departDate: searchParams.get('date') || null,
      priceVersion: `v${Date.now()}`,
    }

    const nextDraft = {
      ...currentDraft,
      passenger: {
        name: nextName,
        idType: '身份证',
        idNumber: nextId,
      },
      contact: {
        phoneNumber: nextContact,
      },
    }

    setIsSubmitting(true)
    try {
      const resp = await fetch('/api/booking/draft', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextDraft),
      })
      if (!resp.ok && resp.status !== 204) {
        setError('网络异常，请稍后重试')
        return
      }

      writeBookingDraft(nextDraft)

      const qp = new URLSearchParams(searchParams)
      const search = qp.toString()
      navigate({ pathname: '/buy-ticket/step2', search: search ? `?${search}` : '' })
    } catch {
      setError('网络异常，请稍后重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.stepsBar}>
          <div className={styles.steps}>
            <div className={styles.stepActive}>
              <span className={styles.stepDotActive} aria-hidden="true" />
              机票信息
            </div>
            <div className={styles.step}>
              <span className={styles.stepDot} aria-hidden="true" />
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
              <div className={styles.noticeText}>
                部分产品出发前将更严格审核乘机人信息和出行目的等内容；辛苦您配合，为了确保您的安全，
                自2025年8月28日起航班出港旅客须及时…
              </div>
              <div className={styles.noticeCaret} aria-hidden="true" />
            </div>

            <div className={styles.warnBox}>
              <div className={styles.warnItem}>
                <span className={styles.warnDot} aria-hidden="true" />
                您预订的产品不可使用港澳通行证购票。
              </div>
              <div className={styles.warnItem}>
                您的航班预计在起飞前60分钟内完成出票，请留意。
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHead}>
                <div className={styles.cardTitle}>乘机人</div>
                <label className={styles.headCheck}>
                  <span className={styles.headBox} aria-hidden="true" />
                  航旅纵横
                </label>
              </div>

              <div className={styles.passengerItem}>
                <div className={styles.passengerNo}>1</div>
                <div className={styles.passengerFields}>
                  <div className={styles.line}>
                    <div className={styles.inputRow}>
                      <input
                        placeholder="请与登机证件姓名保持一致"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                      <div className={styles.underline} aria-hidden="true" />
                      {fieldError.name ? <div>{fieldError.name}</div> : null}
                    </div>
                    <button type="button" className={styles.deleteBtn}>
                      <span className={styles.deleteX} aria-hidden="true" />
                      删除
                    </button>
                  </div>

                  <div className={styles.twoCol}>
                    <div className={styles.selectRow}>
                      <div className={styles.selectText}>身份证</div>
                      <div className={styles.selectCaret} aria-hidden="true" />
                      <div className={styles.underline} aria-hidden="true" />
                    </div>
                    <div className={styles.inputRow}>
                      <input placeholder="登机证件号码" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} />
                      <div className={styles.underline} aria-hidden="true" />
                      {fieldError.idNumber ? <div>{fieldError.idNumber}</div> : null}
                    </div>
                  </div>

                  <div className={styles.twoCol}>
                    <div className={styles.selectRow}>
                      <div className={styles.selectText}>中国 86</div>
                      <div className={styles.selectCaret} aria-hidden="true" />
                      <div className={styles.underline} aria-hidden="true" />
                    </div>
                    <div className={styles.inputRow}>
                      <div className={styles.inputPlaceholder}>乘机人手机号（选填）</div>
                      <div className={styles.underline} aria-hidden="true" />
                    </div>
                  </div>

                  <label className={styles.inlineCheck}>
                    <span className={styles.checkBox} aria-hidden="true" />
                    常旅客卡
                  </label>
                </div>
              </div>

              <button type="button" className={styles.addPassenger}>
                <span className={styles.addIcon} aria-hidden="true" />
                新增乘机人
              </button>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHead}>
                <div className={styles.cardTitle}>联系人</div>
              </div>
              <div className={styles.contactRow}>
                <div className={styles.selectRowSmall}>
                  <div className={styles.selectText}>中国 86</div>
                  <div className={styles.selectCaret} aria-hidden="true" />
                  <div className={styles.underline} aria-hidden="true" />
                </div>
                <div className={styles.inputRow}>
                  <input placeholder="联系人手机号" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
                  <div className={styles.underline} aria-hidden="true" />
                  {fieldError.contactPhone ? <div>{fieldError.contactPhone}</div> : null}
                </div>
              </div>
              <div className={styles.contactHint}>
                <span className={styles.infoIcon} aria-hidden="true" />
                订单信息将发送到该手机号，请确认信息正确
              </div>
            </div>

            {error ? <div>{error}</div> : null}

            <button type="button" className={styles.nextBtn} onClick={goStep2} disabled={isSubmitting}>
              下一步
            </button>
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
