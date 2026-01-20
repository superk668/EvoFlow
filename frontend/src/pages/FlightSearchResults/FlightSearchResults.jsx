import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'

import TopHeader from '../../components/TopHeader/TopHeader.jsx'
import SideNav from '../../components/SideNav/SideNav.jsx'
import BottomBar from '../../components/BottomBar/BottomBar.jsx'

import styles from './FlightSearchResults.module.css'

function getWeekText(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return '周一'
  const [y, m, d] = date.split('-').map((v) => Number(v))
  const dt = new Date(y, m - 1, d)
  const day = dt.getDay()
  if (day === 0) return '周日'
  if (day === 1) return '周一'
  if (day === 2) return '周二'
  if (day === 3) return '周三'
  if (day === 4) return '周四'
  if (day === 5) return '周五'
  return '周六'
}

function toYmd(dt) {
  const y = dt.getFullYear()
  const m = String(dt.getMonth() + 1).padStart(2, '0')
  const d = String(dt.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getTodayYmd() {
  return toYmd(new Date())
}

function buildDateOptions(baseYmd) {
  const [y, m, d] = baseYmd.split('-').map((v) => Number(v))
  const base = new Date(y, m - 1, d)
  const list = Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(base)
    dt.setDate(base.getDate() + i - 1)
    const ymd = toYmd(dt)
    const label = `${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
    const priceValue = 360 + i * 18
    return { date: ymd, label, week: getWeekText(ymd), price: `¥${priceValue}` }
  })

  const min = Math.min(...list.map((x) => Number(String(x.price).replace(/\D/g, '')) || 0))
  return list.map((x) => {
    const v = Number(String(x.price).replace(/\D/g, '')) || 0
    return v === min ? { ...x, badge: '低' } : x
  })
}

function getCityLabel(value) {
  if (!value) return ''
  const idx = value.indexOf('(')
  return idx > 0 ? value.slice(0, idx) : value
}

function isPastYmd(ymd) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return false
  const today = new Date()
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  const [y, m, d] = ymd.split('-').map((v) => Number(v))
  const dt = new Date(y, m - 1, d).getTime()
  return dt < todayMidnight
}

function buildFallbackFlights({ from, to }) {
  const fromLabel = getCityLabel(from) || '北京'
  const toLabel = getCityLabel(to) || '上海'
  return [
    {
      id: 'F1',
      airline: '东方航空',
      no: 'MU 0001',
      craft: '空客A320',
      departTime: '08:00',
      arriveTime: '10:30',
      departAirport: `${fromLabel}国际机场 T1`,
      arriveAirport: `${toLabel}国际机场 T2`,
      price: 528,
    },
    {
      id: 'F2',
      airline: '南方航空',
      no: 'CZ 0002',
      craft: '波音787-9',
      departTime: '11:30',
      arriveTime: '13:50',
      departAirport: `${fromLabel}国际机场 T2`,
      arriveAirport: `${toLabel}国际机场 T2`,
      price: 499,
    },
  ]
}

export default function FlightSearchResults() {
  const navigate = useNavigate()
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const from = params.get('from') || '北京(BJS)'
  const to = params.get('to') || '上海(SHA)'
  const date = params.get('date') || getTodayYmd()
  const select = params.get('select') || ''
  const expand = params.get('expand') || ''

  const cityOptions = ['北京(BJS)', '上海(SHA)', '广州(CAN)', '深圳(SZX)', '杭州(HGH)', '成都(CTU)', '重庆(CKG)']
  const dateOptions = buildDateOptions(date)

  const [flights, setFlights] = useState([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const query = useMemo(() => ({ from, to, date }), [from, to, date])

  useEffect(() => {
    if (isPastYmd(query.date)) {
      setError('不可选择过去日期')
      setFlights([])
      setIsLoading(false)
      return
    }

    setError('')
    setIsLoading(true)
    setFlights(buildFallbackFlights(query))

    const url = `/api/flights?from=${encodeURIComponent(getCityLabel(query.from))}&to=${encodeURIComponent(getCityLabel(query.to))}&departDate=${encodeURIComponent(query.date)}&page=1&pageSize=10`
    let p = null
    try {
      p = globalThis.fetch?.(url, { method: 'GET' })
    } catch {
      p = null
    }

    if (p && typeof p.then === 'function') {
      p.then(async (res) => {
        try {
          const data = await res.json()
          if (Array.isArray(data?.items) && data.items.length > 0) {
            const items = data.items
              .map((it) => ({
                id: it.id || it.flightId || it.no || it.transportNo || it.code,
                airline: it.airline || it.airlineName || '航空公司',
                no: it.no || it.flightNo || it.transportNo || '航班号',
                craft: it.aircraft || it.craft || '机型',
                departTime: it.departTime || it.departAt?.slice(11, 16) || '08:00',
                arriveTime: it.arriveTime || it.arriveAt?.slice(11, 16) || '10:00',
                departAirport: it.departAirport || it.departStation || '出发机场',
                arriveAirport: it.arriveAirport || it.arriveStation || '到达机场',
                price:
                  typeof it.lowestPrice === 'number'
                    ? it.lowestPrice
                    : typeof it.minPrice === 'number'
                      ? it.minPrice
                      : typeof it.price === 'number'
                        ? it.price
                        : 528,
                packages: Array.isArray(it.packages)
                  ? it.packages
                      .map((p) => ({
                        packageId: p?.packageId,
                        name: p?.name,
                        price: p?.price,
                        priceVersion: p?.priceVersion,
                      }))
                      .filter((p) => Boolean(p.packageId) && typeof p.price === 'number')
                  : null,
              }))
              .filter((it) => Boolean(it.id))
            if (items.length > 0) setFlights(items)
          }
        } catch {
          null
        } finally {
          setIsLoading(false)
        }
      }).catch(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [query])
  const titleRoute = `${from.split('(')[0]} - ${to.split('(')[0]}`

  function buildLink(next) {
    const nextParams = new URLSearchParams({ from, to, date, ...next })
    Object.keys(next).forEach((k) => {
      if (!next[k]) nextParams.delete(k)
    })
    return `/flights/results?${nextParams.toString()}`
  }

  function buildBookLink(flight) {
    const nextParams = new URLSearchParams({ from, to, date, flightId: flight?.id || '' })
    return `/flights/book/step1?${nextParams.toString()}`
  }

  function handleReserve(e, flight, pkg) {
    e.preventDefault()

    const packageId = pkg?.packageId ? String(pkg.packageId) : 'p1'
    const priceVersion = pkg?.priceVersion ? String(pkg.priceVersion) : 'v1'
    const ticketPrice = typeof pkg?.price === 'number' ? pkg.price : Number(pkg?.price) || 0

    const payload = {
      flightId: String(flight?.id || ''),
      packageId,
      departDate: date,
      priceVersion,
    }

    try {
      sessionStorage.setItem('bookingDraft', JSON.stringify(payload))
      sessionStorage.setItem('bookingStage', '1')
      if (ticketPrice > 0) sessionStorage.setItem('bookingTicketPrice', String(ticketPrice))
    } catch {
      null
    }

    try {
      globalThis.fetch?.('/api/booking/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } catch {
      null
    }

    navigate('/booking')
  }

  return (
    <div className={styles.page}>
      <TopHeader variant="authed" showSearch={false} />

      <div className={styles.body}>
        <div className={styles.bodyInner}>
          <SideNav />

          <main className={styles.main}>
            <section className={styles.searchPanel}>
              <div className={styles.tripRow}>
                <label className={styles.tripItem}>
                  <input type="radio" name="tripType" defaultChecked /> 单程
                </label>
                <label className={styles.tripItem}>
                  <input type="radio" name="tripType" /> 往返
                </label>
                <label className={styles.tripItem}>
                  <input type="radio" name="tripType" /> 多程(含缺口程)
                </label>
                <div className={styles.cabin}>不限制舱等</div>
              </div>

              <div className={styles.searchRow}>
                <div className={styles.routeBox}>
                  <div className={styles.routeCol}>
                    <div className={styles.boxLabel}>出发地</div>
                    <Link className={styles.boxValue} to={buildLink({ select: 'from' })}>
                      {from}
                    </Link>
                  </div>
                  <div className={styles.routeSplit} />
                  <div className={styles.routeCol}>
                    <div className={styles.boxLabel}>目的地</div>
                    <Link className={styles.boxValue} to={buildLink({ select: 'to' })}>
                      {to}
                    </Link>
                  </div>
                  <div className={styles.swapBtn} aria-hidden />
                </div>

                <div className={styles.dateBox}>
                  <div className={styles.boxLabel}>出发日期</div>
                  <Link className={styles.boxValue} to={buildLink({ select: 'date' })}>
                    {date} {getWeekText(date)}
                  </Link>
                  <div className={styles.dateHint}>+ 添加返程</div>
                </div>

                <div className={styles.paxBox}>
                  <div className={styles.boxLabel}>乘客类型</div>
                  <div className={styles.paxList}>
                    <label className={styles.paxItem}>
                      <input type="checkbox" /> 带儿童
                    </label>
                    <label className={styles.paxItem}>
                      <input type="checkbox" /> 带婴儿
                    </label>
                  </div>
                </div>
              </div>

              {select ? (
                <div className={styles.dropdown}>
                  <div className={styles.dropdownHead}>
                    <div className={styles.dropdownTitle}>{select === 'date' ? '选择日期' : '选择城市'}</div>
                    <Link className={styles.dropdownClose} to={buildLink({ select: '' })}>
                      关闭
                    </Link>
                  </div>
                  <div className={styles.dropdownGrid}>
                    {(select === 'date' ? dateOptions.map((d) => d.date) : cityOptions).map((opt) => {
                      const nextFrom = select === 'from' ? opt : from
                      const nextTo = select === 'to' ? opt : to
                      const nextDate = select === 'date' ? opt : date
                      return (
                        <Link
                          key={opt}
                          className={styles.dropdownItem}
                          to={`/flights/results?from=${encodeURIComponent(nextFrom)}&to=${encodeURIComponent(nextTo)}&date=${encodeURIComponent(nextDate)}`}
                        >
                          {opt}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ) : null}
            </section>

            <section className={styles.dateStrip}>
              <button type="button" className={styles.stripArrow} aria-label="prev" />
              <div className={styles.stripList}>
                {dateOptions.map((d) => (
                  <Link
                    key={d.date}
                    className={d.date === date ? styles.stripItemActive : styles.stripItem}
                    to={`/flights/results?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${encodeURIComponent(d.date)}`}
                  >
                    <div className={styles.stripTop}>
                      <span>{d.label}</span>
                      <span className={styles.stripWeek}>{d.week}</span>
                    </div>
                    <div className={styles.stripPrice}>
                      <span>{d.price}</span>
                      {d.badge ? <span className={styles.stripBadge}>{d.badge}</span> : null}
                    </div>
                  </Link>
                ))}
              </div>
              <button type="button" className={styles.stripArrow} aria-label="next" />
              <div className={styles.moreDate}>
                <span className={styles.moreDateIcon} aria-hidden />
                更多日期
              </div>
            </section>

            <section className={styles.resultCard}>
              <div className={styles.resultHead}>
                <div className={styles.resultTitle}>
                  单程 <span className={styles.resultStrong}>{titleRoute}</span>
                  <span className={styles.resultSub}>
                    {date.slice(5)} {getWeekText(date)}
                  </span>
                </div>
              </div>

              <div className={styles.filterBar}>
                <label className={styles.filterCheck}>
                  <input type="checkbox" /> 直飞/经停
                </label>
                <button type="button" className={styles.filterSelect}>
                  中转<span className={styles.caret} aria-hidden />
                </button>
                <button type="button" className={styles.filterSelect}>
                  航空公司<span className={styles.caret} aria-hidden />
                </button>
                <button type="button" className={styles.filterSelect}>
                  起抵时间<span className={styles.caret} aria-hidden />
                </button>
                <button type="button" className={styles.filterSelect}>
                  机场<span className={styles.caret} aria-hidden />
                </button>
                <button type="button" className={styles.filterSelect}>
                  舱位<span className={styles.caret} aria-hidden />
                </button>
                <button type="button" className={styles.filterSelect}>
                  更多<span className={styles.caret} aria-hidden />
                </button>

                <div className={styles.sortRight}>
                  <span className={styles.sortActive}>低价优先</span>
                  <span className={styles.sortItem}>准点率高-低</span>
                  <span className={styles.sortItem}>起飞时间早-晚</span>
                  <span className={styles.sortItem}>
                    更多排序<span className={styles.caretSmall} aria-hidden />
                  </span>
                </div>
              </div>

              <div className={styles.list}>
                {error ? <div className={styles.empty}>{error}</div> : null}
                {isLoading ? <div className={styles.empty}>加载中</div> : null}
                {flights.length === 0 ? (
                  <div className={styles.empty}>暂无航班信息</div>
                ) : (
                  flights.map((f) => {
                    const isExpanded = expand === f.id
                    return (
                      <div key={f.id} className={styles.flightWrap}>
                        <div className={styles.flightRow}>
                          <div className={styles.logo} aria-hidden>
                            LOGO
                          </div>
                          <div className={styles.flightMeta}>
                            <div className={styles.airlineLine}>
                              <span className={styles.airline}>{f.airline}</span>
                              <span className={styles.flightNo}>{f.no}</span>
                              <span className={styles.craft}>{f.craft}</span>
                            </div>
                          </div>

                          <div className={styles.timeBlock}>
                            <div className={styles.time}>{f.departTime}</div>
                            <div className={styles.airport}>{f.departAirport}</div>
                          </div>

                          <div className={styles.timeMid} aria-hidden />

                          <div className={styles.timeBlock}>
                            <div className={styles.time}>{f.arriveTime}</div>
                            <div className={styles.airport}>{f.arriveAirport}</div>
                          </div>

                          <div className={styles.priceBlock}>
                            <div className={styles.price}>¥{f.price}</div>
                            <div className={styles.priceSub}>经济舱1.8折</div>
                          </div>

                          <div className={styles.action}>
                            <Link
                              className={styles.bookBtn}
                              to={isExpanded ? buildLink({ expand: '' }) : buildLink({ expand: f.id })}
                            >
                              {isExpanded ? '收起' : '订票'}
                              <span className={isExpanded ? styles.bookCaretUp : styles.bookCaretDown} aria-hidden />
                            </Link>
                          </div>
                        </div>

                        {isExpanded ? (
                          <div className={styles.expandPanel}>
                            <div className={styles.expandTabs}>
                              <div className={styles.expandTabActive}>经济舱 ¥{f.price}起</div>
                              <div className={styles.expandTab}>公务/头等舱 ¥{f.price + 930}起</div>
                            </div>

                            {(Array.isArray(f.packages) && f.packages.length > 0
                              ? f.packages
                              : [
                                  { packageId: 'p1', name: '特惠经济舱', price: f.price, priceVersion: 'v1' },
                                  { packageId: 'p2', name: '优选经济舱', price: f.price + 50, priceVersion: 'v1' },
                                  { packageId: 'p3', name: '经济舱', price: f.price + 100, priceVersion: 'v1' },
                                ]
                            ).map((pkg, idx) => (
                              <div key={pkg.packageId || String(idx)} className={styles.expandRow}>
                                <div className={styles.expandLeft}>
                                  <a className={styles.expandLink} href="#">
                                    退改¥{200 + idx * 25}起
                                  </a>
                                  <a className={styles.expandLink} href="#">
                                    托运行李额20KG
                                  </a>
                                  <span className={styles.expandText}>电子行程单或电子发票</span>
                                  <span className={styles.expandText}>经济舱{2.5 + idx * 0.3}折</span>
                                </div>
                                <div className={styles.expandRight}>
                                  <span className={styles.badgeGreen}>赠送机场最高8折券</span>
                                  <div className={styles.expandPrice}>¥{typeof pkg?.price === 'number' ? pkg.price : f.price}</div>
                                  <Link className={styles.reserveBtn} to={buildBookLink(f)} onClick={(e) => handleReserve(e, f, pkg)}>
                                    预订
                                  </Link>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    )
                  })
                )}
              </div>
            </section>
          </main>
        </div>
      </div>

      <BottomBar />
    </div>
  )
}
