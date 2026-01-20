import TopHeader from '../../components/TopHeader/TopHeader.jsx'
import BottomBar from '../../components/BottomBar/BottomBar.jsx'
import BookingProgressHeader from '../../components/BookingProgressHeader/BookingProgressHeader.jsx'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import styles from './BookingFormPage.module.css'

export default function BookingFormPage() {
  const navigate = useNavigate()

  const [passengers, setPassengers] = useState([{ key: String(Date.now()), name: '', idType: 'id', idNo: '', travelerId: '' }])
  const [regionCode, setRegionCode] = useState('+86')
  const [contactPhone, setContactPhone] = useState('')
  const [error, setError] = useState('')
  const [commonTravelers, setCommonTravelers] = useState([])
  const [isCommonLoading, setIsCommonLoading] = useState(false)
  const [commonError, setCommonError] = useState('')
  const [bookingDraft, setBookingDraft] = useState(null)

  const authHeader = useMemo(() => {
    let token = ''
    try {
      token = localStorage.getItem('auth_token') || ''
    } catch {
      token = ''
    }
    return token ? { Authorization: `Bearer ${token}` } : {}
  }, [])

  useEffect(() => {
    let isActive = true
    async function load() {
      setIsCommonLoading(true)
      setCommonError('')
      try {
        const qs = new URLSearchParams({ keyword: '' }).toString()
        const res = await fetch(`/api/user/travelers?${qs}`, { method: 'GET', headers: authHeader })
        const data = await res.json().catch(() => null)
        if (!isActive) return
        if (!res.ok) {
          setCommonTravelers([])
          setCommonError(data?.error || '加载常用旅客失败')
          return
        }
        const items = Array.isArray(data?.items) ? data.items : []
        setCommonTravelers(items)
      } catch {
        if (!isActive) return
        setCommonTravelers([])
        setCommonError('加载常用旅客失败')
      } finally {
        if (isActive) setIsCommonLoading(false)
      }
    }
    load()
    return () => {
      isActive = false
    }
  }, [authHeader])

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

  const ticketInfo = useMemo(() => {
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

    if (packageId.endsWith('_p1') || packageId === 'p2' || packageId === 'p1') {
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
  }, [bookingDraft])

  function applyCommonTraveler(passengerKey, travelerId) {
    setPassengers((prev) => {
      const next = prev.map((p) => ({ ...p }))
      const idx = next.findIndex((p) => p.key === passengerKey)
      if (idx < 0) return prev
      next[idx].travelerId = travelerId
      if (!travelerId) return next

      const t = commonTravelers.find((item) => item?.travelerId === travelerId)
      if (!t) return next

      const nextName = typeof t.cnName === 'string' ? t.cnName.trim() : ''
      const nextIdType = t.idType === 'passport' ? 'passport' : 'id'
      const nextIdNo = typeof t.idNo === 'string' ? t.idNo.trim() : ''
      const nextPhone = typeof t.phone === 'string' ? t.phone.trim() : ''

      if (nextName) next[idx].name = nextName
      if (nextIdNo) {
        next[idx].idType = nextIdType
        next[idx].idNo = nextIdNo
      }
      if (nextPhone) setContactPhone(nextPhone)
      return next
    })
  }

  function updatePassenger(passengerKey, patch) {
    setPassengers((prev) => {
      const next = prev.map((p) => ({ ...p }))
      const idx = next.findIndex((p) => p.key === passengerKey)
      if (idx < 0) return prev
      next[idx] = { ...next[idx], ...patch }
      return next
    })
  }

  function addPassenger() {
    setPassengers((prev) => {
      const key = `${Date.now()}_${Math.random().toString(16).slice(2)}`
      return [...prev, { key, name: '', idType: 'id', idNo: '', travelerId: '' }]
    })
  }

  function removePassenger(passengerKey) {
    setPassengers((prev) => {
      if (prev.length <= 1) return prev
      const next = prev.filter((p) => p.key !== passengerKey)
      return next.length > 0 ? next : prev
    })
  }

  function isValidIdNo(type, value) {
    const v = String(value || '').trim()
    if (type === 'id') return /^\d{17}[\dXx]$/.test(v)
    if (type === 'passport') return /^[A-Za-z0-9]{5,20}$/.test(v)
    return v.length >= 4
  }

  function handleNext() {
    const normalizedPassengers = passengers.map((p) => ({
      name: String(p?.name || '').trim(),
      idType: p?.idType === 'passport' ? 'passport' : 'id',
      idNo: String(p?.idNo || '').trim(),
      phone: contactPhone.trim(),
    }))

    for (let i = 0; i < normalizedPassengers.length; i += 1) {
      const p = normalizedPassengers[i]
      if (!p.name) {
        setError('姓名不能为空')
        return
      }
      if (!isValidIdNo(p.idType, p.idNo)) {
        setError('证件号码格式不正确')
        return
      }
    }

    setError('')

    const payload = {
      passengers: normalizedPassengers,
      contact: { regionCode, phone: contactPhone.trim() },
    }

    try {
      sessionStorage.setItem('bookingStage', '2')
      sessionStorage.setItem('bookingTravelers', JSON.stringify(payload))
    } catch {
      null
    }

    try {
      globalThis.fetch?.('/api/booking/travelers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } catch {
      null
    }

    navigate('/booking/services')
  }

  return (
    <div className={styles.page}>
      <TopHeader variant="authed" showSearch={false} />
      <BookingProgressHeader />

      <div className={styles.body}>
        <div className={styles.container}>
          <main className={styles.main}>
            <h1 className={styles.title}>乘机人与联系人信息</h1>

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>乘机人</h2>

              {commonError ? <div role="alert">{commonError}</div> : null}

              <div className={styles.passengerList}>
                {passengers.map((p, idx) => (
                  <section key={p.key} className={styles.passengerCard} aria-label={`出行人${idx + 1}`}>
                    <div className={styles.passengerHead}>
                      <div className={styles.passengerTitle}>出行人{idx + 1}</div>
                      {passengers.length > 1 ? (
                        <button type="button" className={styles.passengerRemove} onClick={() => removePassenger(p.key)}>
                          删除
                        </button>
                      ) : null}
                    </div>

                    <div className={styles.commonRow}>
                      <div className={styles.commonLabel}>套用常用旅客</div>
                      <select
                        className={styles.select}
                        value={p.travelerId}
                        onChange={(e) => applyCommonTraveler(p.key, e.target.value)}
                        disabled={isCommonLoading}
                      >
                        <option value="">{isCommonLoading ? '加载中…' : '请选择'}</option>
                        {commonTravelers.map((t) => (
                          <option key={t.travelerId} value={t.travelerId}>
                            {t.cnName ? `${t.cnName}（${t.travelerId}）` : t.travelerId}
                          </option>
                        ))}
                      </select>
                    </div>

                    <label className={styles.field}>
                      姓名
                      <input
                        className={styles.input}
                        placeholder="姓名"
                        value={p.name}
                        onChange={(e) => updatePassenger(p.key, { name: e.target.value })}
                      />
                    </label>

                    <label className={styles.field}>
                      证件类型
                      <select
                        className={styles.select}
                        value={p.idType}
                        onChange={(e) => updatePassenger(p.key, { idType: e.target.value })}
                      >
                        <option value="id">身份证</option>
                        <option value="passport">护照</option>
                      </select>
                    </label>

                    <label className={styles.field}>
                      证件号
                      <input
                        className={styles.input}
                        placeholder="证件号"
                        value={p.idNo}
                        onChange={(e) => updatePassenger(p.key, { idNo: e.target.value })}
                      />
                    </label>
                  </section>
                ))}
              </div>

              <button type="button" className={styles.addPassenger} onClick={addPassenger}>
                新增出行人
              </button>
            </section>

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>联系人</h2>
              <label className={styles.field}>
                国家/地区码
                <select className={styles.select} value={regionCode} onChange={(e) => setRegionCode(e.target.value)}>
                  <option value="+86">+86</option>
                  <option value="+852">+852</option>
                </select>
              </label>
              <label className={styles.field}>
                手机号
                <input
                  className={styles.input}
                  placeholder="联系人手机号"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                />
              </label>
            </section>

            {error ? <div role="alert">{error}</div> : null}

            <button type="button" className={styles.nextBtn} onClick={handleNext}>
              下一步
            </button>
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
                  <div className={styles.farePriceLine}>¥{ticketInfo?.ticketPrice ?? '—'} × {passengers.length}</div>
                  <span className={styles.caretUp} aria-hidden />
                </div>
              </div>

              <div className={styles.fareList}>
                <div className={styles.fareItem}>
                  <div className={styles.fareNameMain}>
                    <span className={styles.leftBar} aria-hidden />
                    成人
                  </div>
                  <div className={styles.farePrice}>¥{ticketInfo?.ticketPrice ?? '—'} × {passengers.length}</div>
                </div>
              </div>

              <div className={styles.totalRow}>
                <div className={styles.totalPrice}>
                  ¥
                  {typeof ticketInfo?.ticketPrice === 'number'
                    ? ticketInfo.ticketPrice * passengers.length
                    : ticketInfo?.ticketPrice ?? '—'}
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
