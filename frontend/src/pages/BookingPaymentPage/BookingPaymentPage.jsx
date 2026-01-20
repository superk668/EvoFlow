import { Link, useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { flushSync } from 'react-dom'

import TopHeader from '../../components/TopHeader/TopHeader.jsx'
import BottomBar from '../../components/BottomBar/BottomBar.jsx'
import BookingProgressHeader from '../../components/BookingProgressHeader/BookingProgressHeader.jsx'

import styles from './BookingPaymentPage.module.css'

function deriveTicketInfo(bookingDraft) {
  const flightId = typeof bookingDraft?.flightId === 'string' ? bookingDraft.flightId.trim() : ''
  const packageId = typeof bookingDraft?.packageId === 'string' ? bookingDraft.packageId.trim() : ''
  const departDate = typeof bookingDraft?.departDate === 'string' ? bookingDraft.departDate.trim() : ''

  const parts = flightId.split('_')
  if (parts.length !== 5 || parts[0] !== 'f') return null
  const from = parts[1] || ''
  const to = parts[2] || ''
  const ymd = parts[3] || ''
  const idx = Number(parts[4])
  if (!from || !to || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(ymd) || !Number.isInteger(idx) || idx < 0) return null

  const d = ymd || departDate
  const [, mm, dd] = d.split('-')
  const dateText = `${mm}-${dd}`

  const weekMap = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  let weekText = ''
  try {
    const dt = new Date(d)
    weekText = weekMap[dt.getDay()] || ''
  } catch {
    weekText = ''
  }

  const airlineName = idx % 2 === 0 ? '中国国航' : '东方航空'
  const flightNo = (idx % 2 === 0 ? 'CA' : 'MU') + String(1200 + idx)

  const departHour = 8 + idx
  const arriveHour = 10 + idx
  const departTime = `${String(departHour).padStart(2, '0')}:00`
  const arriveTime = `${String(arriveHour).padStart(2, '0')}:10`

  let packageName = '经济舱'
  let refundPolicy = '退改¥200起'
  let baggage = '托运行李额20KG'
  let ticketPrice = 420 + idx * 60

  if (packageId.endsWith('_p1')) {
    packageName = '优选经济舱'
    refundPolicy = '退改¥150起'
    baggage = '托运行李额25KG'
    ticketPrice = ticketPrice + 80
  } else {
    packageName = '特惠经济舱'
  }

  return {
    from,
    to,
    dateText,
    weekText,
    airlineName,
    flightNo,
    departTime,
    arriveTime,
    departAirport: `${from}机场T1`,
    arriveAirport: `${to}机场T1`,
    duration: '2h10m',
    packageName,
    refundPolicy,
    baggage,
    ticketPrice,
  }
}

function getAuthToken() {
  try {
    return localStorage.getItem('auth_token') || ''
  } catch {
    return ''
  }
}

function withOptionalAuth(options) {
  const token = getAuthToken()
  if (!token) return options
  const nextHeaders = { ...(options.headers || {}), Authorization: `Bearer ${token}` }
  return { ...options, headers: nextHeaders }
}

export default function BookingPaymentPage() {
  const { orderId } = useParams()
  const [leftSec, setLeftSec] = useState(15 * 60)
  const [expired, setExpired] = useState(false)
  const [bookingDraft, setBookingDraft] = useState(null)

  const passengerCount = useMemo(() => {
    try {
      const raw = sessionStorage.getItem('bookingTravelers')
      const parsed = raw ? JSON.parse(raw) : null
      const count = Array.isArray(parsed?.passengers) ? parsed.passengers.length : 0
      return count > 0 ? count : 1
    } catch {
      return 1
    }
  }, [])

  useEffect(() => {
    try {
      globalThis.fetch?.(`/api/orders/${orderId}`, withOptionalAuth({ method: 'GET' }))
    } catch {
      null
    }
  }, [orderId])

  useEffect(() => {
    let isActive = true
    async function loadDraft() {
      try {
        const res = await fetch('/api/booking/draft', { method: 'GET' })
        const data = await res.json().catch(() => null)
        if (!isActive) return
        if (!res.ok) {
          setBookingDraft(null)
          return
        }
        const draft = data?.bookingDraft
        setBookingDraft(draft && typeof draft === 'object' ? draft : null)
      } catch {
        if (!isActive) return
        setBookingDraft(null)
      }
    }
    loadDraft()
    return () => {
      isActive = false
    }
  }, [])

  const ticketInfo = useMemo(() => deriveTicketInfo(bookingDraft), [bookingDraft])

  useEffect(() => {
    if (expired) return
    const timer = setInterval(() => {
      flushSync(() => {
        setLeftSec((s) => {
          if (s <= 1) {
            setExpired(true)
            return 0
          }
          return s - 1
        })
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [expired])

  const mm = String(Math.floor(leftSec / 60)).padStart(2, '0')
  const ss = String(leftSec % 60).padStart(2, '0')

  return (
    <div className={styles.page}>
      <TopHeader variant="authed" showSearch={false} />
      <BookingProgressHeader />

      <div className={styles.body}>
        <div className={styles.container}>
          <main className={styles.main}>
            <h1 className={styles.title}>支付</h1>

            <section className={styles.card}>
              <div className={styles.row}>
                <div className={styles.label}>订单号</div>
                <div className={styles.value}>{orderId}</div>
              </div>
              <div className={styles.row}>
                <div className={styles.label}>剩余时间</div>
                <div className={styles.value}>
                  {mm}:{ss}
                </div>
              </div>
              <div className={styles.row}>
                <div className={styles.label}>支付方式</div>
                <div className={styles.value}>银行卡</div>
              </div>
            </section>

            {expired ? (
              <div className={styles.card}>
                <div>超出时间，请重新开始订单</div>
                <Link to="/">返回首页</Link>
              </div>
            ) : (
              <Link className={styles.payBtn} to="/booking/complete">
                支付
              </Link>
            )}
          </main>

          <aside className={styles.aside} aria-label="机票信息">
            <div className={styles.ticketCard}>
              <div className={styles.ticketHead}>
                <div className={styles.ticketRoute}>
                  <span className={styles.ticketDate}>{ticketInfo?.dateText || '-- --'}</span>
                  <span className={styles.ticketWeek}>{ticketInfo?.weekText || ''}</span>
                  <span className={styles.ticketFrom}>{ticketInfo?.from || '—'}</span>
                  <span className={styles.ticketArrow} aria-hidden />
                  <span className={styles.ticketTo}>{ticketInfo?.to || '—'}</span>
                </div>
                <div className={styles.supplier}>
                  <span className={styles.infoCircle} aria-hidden /> 供应方
                </div>
              </div>

              <div className={styles.airlineLine}>
                <span className={styles.airlineIcon} aria-hidden />
                <span className={styles.airlineText}>
                  {ticketInfo ? `${ticketInfo.airlineName} ${ticketInfo.flightNo}` : '航司 航班号'}
                </span>
                <span className={styles.airlineMeta}>{ticketInfo ? ticketInfo.packageName : '经济舱'}</span>
              </div>

              <div className={styles.timeRow}>
                <div className={styles.timeCol}>
                  <div className={styles.timeBig}>{ticketInfo?.departTime || '--:--'}</div>
                  <div className={styles.airportText}>{ticketInfo?.departAirport || '出发机场'}</div>
                </div>
                <div className={styles.timeMid}>
                  <div className={styles.duration}>
                    <span className={styles.clockIcon} aria-hidden /> {ticketInfo?.duration || ''}
                  </div>
                  <div className={styles.routeLine}>
                    <span className={styles.routeDot} aria-hidden />
                    <span className={styles.planeIcon} aria-hidden />
                    <span className={styles.routeDot} aria-hidden />
                  </div>
                </div>
                <div className={styles.timeColRight}>
                  <div className={styles.timeBig}>{ticketInfo?.arriveTime || '--:--'}</div>
                  <div className={styles.airportText}>{ticketInfo?.arriveAirport || '到达机场'}</div>
                </div>
              </div>

              <div className={styles.fareRow}>
                <div className={styles.fareTopLinks}>
                  <span className={styles.fareLink}>{ticketInfo?.packageName || '成人套餐'}</span>
                  <span className={styles.fareLinkBlue}>{ticketInfo?.refundPolicy || '退改¥200起'}</span>
                  <span className={styles.fareLink}>{ticketInfo?.baggage || '行李额'}</span>
                </div>
                <div className={styles.fareTopPrices}>
                  <div className={styles.farePriceLine}>¥{ticketInfo?.ticketPrice ?? '—'} × {passengerCount}</div>
                  <span className={styles.caretUp} aria-hidden />
                </div>
              </div>

              <div className={styles.fareList}>
                <div className={styles.fareItem}>
                  <div className={styles.fareNameMain}>
                    <span className={styles.leftBar} aria-hidden />
                    成人
                  </div>
                  <div className={styles.farePrice}>¥{ticketInfo?.ticketPrice ?? '—'} × {passengerCount}</div>
                </div>
              </div>

              <div className={styles.totalRow}>
                <div className={styles.totalPrice}>
                  ¥{typeof ticketInfo?.ticketPrice === 'number' ? ticketInfo.ticketPrice * passengerCount : ticketInfo?.ticketPrice ?? '—'}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <BottomBar />
    </div>
  )
}
