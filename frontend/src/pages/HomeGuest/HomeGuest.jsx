import TopHeader from '../../components/TopHeader/TopHeader.jsx'
import SideNav from '../../components/SideNav/SideNav.jsx'
import BottomBar from '../../components/BottomBar/BottomBar.jsx'
import { Link, useLocation } from 'react-router-dom'

import bannerHome from '../../assets/placeholders/banner_home.svg'
import thumbTicket from '../../assets/placeholders/thumb_ticket.svg'

import styles from './HomeGuest.module.css'

const cheapColumns = [
  {
    title: '周末省心游',
    tone: 'green',
    rows: [
      { idx: '1', city: '上海-大连', price: '¥398起' },
      { idx: '2', city: '上海-丽江', price: '¥451起' },
      { idx: '3', city: '上海-杭州', price: '¥460起' },
      { idx: '4', city: '上海-合肥', price: '¥462起' },
      { idx: '5', city: '上海-金华', price: '¥514起' },
    ],
  },
  {
    title: '爱上大草原',
    tone: 'red',
    rows: [
      { idx: '1', city: '上海-呼伦贝尔', price: '¥297起' },
      { idx: '2', city: '上海-海拉尔', price: '¥340起' },
      { idx: '3', city: '上海-满洲里', price: '¥400起' },
      { idx: '4', city: '上海-根河', price: '¥398起' },
    ],
  },
  {
    title: '海边浪一浪',
    tone: 'blue',
    rows: [
      { idx: '1', city: '上海-大连', price: '¥200起' },
      { idx: '2', city: '上海-厦门', price: '¥210起' },
      { idx: '3', city: '上海-宁波', price: '¥232起' },
      { idx: '4', city: '上海-青岛', price: '¥235起' },
      { idx: '5', city: '上海-三亚', price: '¥748起' },
    ],
  },
]

function toYmd(dt) {
  const y = dt.getFullYear()
  const m = String(dt.getMonth() + 1).padStart(2, '0')
  const d = String(dt.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getTodayYmd() {
  return toYmd(new Date())
}

function buildNextDays(startYmd, count) {
  const [y, m, d] = startYmd.split('-').map((v) => Number(v))
  const base = new Date(y, m - 1, d)
  return Array.from({ length: count }, (_, i) => {
    const next = new Date(base)
    next.setDate(base.getDate() + i)
    return toYmd(next)
  })
}

export default function HomeGuest({ headerVariant = 'guest' }) {
  const location = useLocation()

  const params = new URLSearchParams(location.search)
  const from = params.get('from') || '上海(SHA)'
  const to = params.get('to') || '北京(BJS)'
  const date = params.get('date') || getTodayYmd()
  const select = params.get('select') || ''

  const authed = headerVariant === 'authed'

  const flightsTarget = `/flights/list?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${encodeURIComponent(date)}`
  const searchPath = authed
    ? flightsTarget
    : `/login?returnUrl=${encodeURIComponent(flightsTarget)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${encodeURIComponent(date)}`

  const cityOptions = ['北京(BJS)', '上海(SHA)', '广州(CAN)', '深圳(SZX)', '杭州(HGH)', '成都(CTU)', '重庆(CKG)']
  const dateOptions = buildNextDays(date, 6)

  return (
    <div className={styles.page}>
      <TopHeader variant={headerVariant} />

      <div className={styles.body}>
        <div className={styles.bodyInner}>
          <SideNav />

          <main className={styles.main}>
            <div className={styles.topCard}>
              <div className={styles.tabRow}>
                <div className={styles.tabActive}>国内、国际/中国港澳台</div>
                <div className={styles.tab}>特价机票</div>
                <div className={styles.tab}>航班动态</div>
                <div className={styles.tab}>值机选座</div>
                <div className={styles.tab}>退票改签</div>
                <div className={styles.tab}>更多服务</div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.radioRow}>
                  <label className={styles.radioLabel}>
                    <input type="radio" name="tripType" defaultChecked />
                    单程
                  </label>
                  <label className={styles.radioLabel}>
                    <input type="radio" name="tripType" />
                    往返
                  </label>
                  <label className={styles.radioLabel}>
                    <input type="radio" name="tripType" />
                    多程(含缺口程)
                  </label>
                </div>

                <div className={styles.fieldsWrap}>
                  <div className={styles.fields}>
                    <div className={styles.field}>
                      <div className={styles.fieldLabel}>出发</div>
                      <Link className={styles.fieldValue} to={`/?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${encodeURIComponent(date)}&select=from`}>
                        {from}
                      </Link>
                    </div>
                    <div className={styles.swap} aria-hidden />
                    <div className={styles.field}>
                      <div className={styles.fieldLabel}>到达</div>
                      <Link className={styles.fieldValue} to={`/?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${encodeURIComponent(date)}&select=to`}>
                        {to}
                      </Link>
                    </div>
                    <div className={styles.fieldDate}>
                      <div className={styles.fieldLabel}>出发日期</div>
                      <Link className={styles.fieldValue} to={`/?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${encodeURIComponent(date)}&select=date`}>
                        {date} 周四
                      </Link>
                    </div>
                    <div className={styles.more}
                    >
                      <div className={styles.moreTitle}>不指定航司</div>
                      <div className={styles.moreTags}>
                        <span className={styles.tag}>舱位</span>
                        <span className={styles.tag}>乘机人</span>
                        <span className={styles.tag}>儿童/婴儿</span>
                      </div>
                    </div>
                  </div>

                  {select ? (
                    <div className={styles.dropdown}>
                      <div className={styles.dropdownTitle}>{select === 'date' ? '选择日期' : '选择城市'}</div>
                      <div className={styles.dropdownList}>
                        {(select === 'date' ? dateOptions : cityOptions).map((opt) => {
                          const nextFrom = select === 'from' ? opt : from
                          const nextTo = select === 'to' ? opt : to
                          const nextDate = select === 'date' ? opt : date
                          return (
                            <Link
                              key={opt}
                              className={styles.dropdownItem}
                              to={`/?from=${encodeURIComponent(nextFrom)}&to=${encodeURIComponent(nextTo)}&date=${encodeURIComponent(nextDate)}`}
                            >
                              {opt}
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>

                <Link
                  className={styles.searchBtn}
                  to={searchPath}
                >
                  搜索
                </Link>
              </div>
            </div>

            <div className={styles.bannerWrap}>
              <img className={styles.banner} src={bannerHome} alt="banner" />
            </div>

            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionTitle}>低价速报</div>
                <div className={styles.sectionLink}>更多目的地</div>
              </div>

              <div className={styles.columns}>
                {cheapColumns.map((c) => (
                  <div key={c.title} className={styles.col} data-tone={c.tone}>
                    <div className={styles.colHead}>
                      <div className={styles.colTitle}>{c.title}</div>
                      <div className={styles.colBadge}>
                        <span className={styles.badgeIcon} />
                      </div>
                    </div>
                    <div className={styles.list}>
                      {c.rows.map((r) => (
                        <div key={r.idx + r.city} className={styles.row}>
                          <div className={styles.rank}>{r.idx}</div>
                          <img className={styles.thumb} src={thumbTicket} alt="thumb" />
                          <div className={styles.route}>{r.city}</div>
                          <div className={styles.price}>{r.price}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </main>
        </div>
      </div>

      <BottomBar />
    </div>
  )
}
