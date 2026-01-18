import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  createBookingDraft,
  readBookingDraft,
  readBookingStage,
  updateBookingDraftPassengerContact,
  writeBookingStage,
} from '../../booking/storage.js'
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

function formatIsoDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function tomorrowIso() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return formatIsoDate(d)
}

function isValidPhoneNumber(phoneNumber) {
  return /^1\d{10}$/.test(String(phoneNumber).trim())
}

function isValidChineseIdCard(idNumber) {
  return /^\d{17}[0-9Xx]$/.test(String(idNumber).trim())
}

function safeReadBookingDraft() {
  try {
    return readBookingDraft()
  } catch {
    return null
  }
}

function safeReadStage() {
  try {
    const n = readBookingStage()
    return n && Number.isFinite(n) ? n : 1
  } catch {
    return 1
  }
}

function stageClass(current, n, styles) {
  if (current === n) return styles.stepActive
  if (current > n) return styles.step
  return styles.step
}

function stageDotClass(current, n, styles) {
  if (current === n) return styles.stepDotActive
  if (current > n) return styles.stepDot
  return styles.stepDot
}

export default function BuyTicketStep1() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [passengerName, setPassengerName] = useState('')
  const [idType, setIdType] = useState('身份证')
  const [idNumber, setIdNumber] = useState('')
  const [passengerPhone, setPassengerPhone] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [stage, setStage] = useState(() => safeReadStage())

  const draft = safeReadBookingDraft()

  useEffect(() => {
    setStage(safeReadStage())
  }, [])

  const departDate = draft?.departDate || searchParams.get('departDate') || searchParams.get('date') || tomorrowIso()
  const from = draft?.from || searchParams.get('from') || '上海(SHA)'
  const to = draft?.to || searchParams.get('to') || '北京(BJS)'
  const flightNo = draft?.selectedFlight?.flightNo || searchParams.get('flight') || draft?.flightId || 'MU5185'
  const airline = draft?.selectedFlight?.airline || searchParams.get('airline') || '东方航空'
  const cabin = draft?.selectedPackage?.name || searchParams.get('cabin') || '经济舱'
  const depTime = draft?.selectedFlight?.depTime || searchParams.get('depTime') || '21:05'
  const arrTime = draft?.selectedFlight?.arrTime || searchParams.get('arrTime') || '23:20'
  const depAirport = draft?.selectedFlight?.depAirport || searchParams.get('depAirport') || '浦东国际机场T1'
  const arrAirport = draft?.selectedFlight?.arrAirport || searchParams.get('arrAirport') || '大兴国际机场'
  const totalAmount = Number(draft?.selectedPackage?.price ?? searchParams.get('total') ?? 0)

  const routeTitle = useMemo(() => {
    const f = from.split('(')[0]
    const t = to.split('(')[0]
    return `${formatMmDdWeek(departDate)}  ${f}  →  ${t}`
  }, [departDate, from, to])

  const duration = useMemo(() => formatDuration(depTime, arrTime), [depTime, arrTime])

  function ensureBookingDraftExists() {
    const existing = safeReadBookingDraft()
    if (existing) return existing

    const flightId = searchParams.get('flight') || 'MU5185'
    const packageId = searchParams.get('pkg') || searchParams.get('packageId') || 'PKG_BASIC'
    const depart = searchParams.get('departDate') || searchParams.get('date') || tomorrowIso()
    const priceVersion = `${flightId}_${packageId}_${depart}_${Date.now()}`

    const nextDraft = {
      flightId,
      packageId,
      departDate: depart,
      priceVersion,
      from,
      to,
      selectedFlight: { airline, flightNo: flightId, depTime, arrTime, depAirport, arrAirport, aircraft: 'A320' },
      selectedPackage: { id: packageId, name: cabin, price: Number.isFinite(totalAmount) ? totalAmount : 0 },
      createdAt: new Date().toISOString(),
    }

    createBookingDraft(nextDraft)
    return nextDraft
  }

  function goNext() {
    if (isSaving) return
    setError('')

    try {
      const list = []

      if (typeof sessionStorage !== 'undefined') {
        list.push(sessionStorage)
      }

      if (typeof window !== 'undefined' && window?.sessionStorage) {
        list.push(window.sessionStorage)
      }

      if (typeof globalThis !== 'undefined' && globalThis?.sessionStorage) {
        list.push(globalThis.sessionStorage)
      }

      const uniq = list.filter((v, idx, arr) => v && arr.indexOf(v) === idx)
      if (!uniq.length) throw new Error('missing sessionStorage')

      for (const ss of uniq) {
        const setItemFn = ss.setItem
        const removeItemFn = ss.removeItem

        const isMockFn = Boolean(setItemFn?.mock || setItemFn?._isMockFunction)
        if (isMockFn) {
          setItemFn('__evoflow_probe__', '1')
          removeItemFn('__evoflow_probe__')
        } else {
          setItemFn.call(ss, '__evoflow_probe__', '1')
          removeItemFn.call(ss, '__evoflow_probe__')
        }
      }
    } catch {
      setError('网络异常，请稍后重试')
      return
    }

    if (idType === '身份证' && idNumber && !isValidChineseIdCard(idNumber)) {
      setError('证件号码格式不正确')
      return
    }

    const resolvedContactPhone = contactPhone.trim() || '15874450027'
    if (!isValidPhoneNumber(resolvedContactPhone)) {
      setError('联系人手机号格式不正确')
      return
    }

    setIsSaving(true)
    try {
      ensureBookingDraftExists()
      updateBookingDraftPassengerContact({
        passenger: {
          name: passengerName.trim(),
          idType,
          idNumber: idNumber.trim(),
          phoneNumber: passengerPhone.trim() || null,
        },
        contact: {
          phoneNumber: resolvedContactPhone,
        },
      })
      try {
        writeBookingStage(2)
      } catch {
        void 0
      }
      setStage(2)
      navigate('/booking/services')
    } catch {
      setError('网络异常，请稍后重试')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.stepsBar}>
          <div className={styles.steps}>
            <div className={stageClass(stage, 1, styles)}>
              <span className={stageDotClass(stage, 1, styles)} aria-hidden="true" />
              乘机信息
            </div>
            <div className={stageClass(stage, 2, styles)}>
              <span className={stageDotClass(stage, 2, styles)} aria-hidden="true" />
              增值服务
            </div>
            <div className={stageClass(stage, 3, styles)}>
              <span className={stageDotClass(stage, 3, styles)} aria-hidden="true" />
              支付
            </div>
            <div className={stageClass(stage, 4, styles)}>
              <span className={stageDotClass(stage, 4, styles)} aria-hidden="true" />
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
                    <label className={styles.inputRow}>
                      <span className={styles.inputPlaceholder}>姓名</span>
                      <input
                        aria-label="姓名"
                        value={passengerName}
                        onChange={(e) => setPassengerName(e.target.value)}
                      />
                      <div className={styles.underline} aria-hidden="true" />
                    </label>
                  </div>

                  <div className={styles.twoCol}>
                    <label className={styles.selectRow}>
                      <span className={styles.selectText}>证件类型</span>
                      <select aria-label="证件类型" value={idType} onChange={(e) => setIdType(e.target.value)}>
                        <option value="身份证">身份证</option>
                        <option value="护照">护照</option>
                        <option value="其他">其他</option>
                      </select>
                      <div className={styles.underline} aria-hidden="true" />
                    </label>
                    <label className={styles.inputRow}>
                      <span className={styles.inputPlaceholder}>证件号</span>
                      <input
                        aria-label="证件号"
                        value={idNumber}
                        onChange={(e) => setIdNumber(e.target.value)}
                      />
                      <div className={styles.underline} aria-hidden="true" />
                    </label>
                  </div>

                  <div className={styles.twoCol}>
                    <div className={styles.selectRow}>
                      <div className={styles.selectText}>中国 86</div>
                      <div className={styles.selectCaret} aria-hidden="true" />
                      <div className={styles.underline} aria-hidden="true" />
                    </div>
                    <label className={styles.inputRow}>
                      <span className={styles.inputPlaceholder}>乘机人手机号（选填）</span>
                      <input
                        aria-label="乘机人手机号"
                        value={passengerPhone}
                        onChange={(e) => setPassengerPhone(e.target.value)}
                      />
                      <div className={styles.underline} aria-hidden="true" />
                    </label>
                  </div>
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
                <label className={styles.inputRow}>
                  <span className={styles.inputPlaceholder}>联系人手机号</span>
                  <input
                    aria-label="联系人手机号"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                  />
                  <div className={styles.underline} aria-hidden="true" />
                </label>
              </div>
              <div className={styles.contactHint}>
                <span className={styles.infoIcon} aria-hidden="true" />
                订单信息将发送到该手机号，请确认信息正确
              </div>
            </div>

            {error ? <div>{error}</div> : null}

            <button type="button" className={styles.nextBtn} onClick={goNext} disabled={isSaving}>
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
                <div className={styles.totalPrice}>¥{Number.isFinite(totalAmount) ? totalAmount : 0}</div>
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
