import styles from './Home.module.css'
import { Link, useNavigate } from 'react-router-dom'
import homeBanner from '../../assets/placeholders/home-banner.svg'
import dealThumbA from '../../assets/placeholders/deal-thumb-a.svg'
import dealThumbB from '../../assets/placeholders/deal-thumb-b.svg'
import dealThumbC from '../../assets/placeholders/deal-thumb-c.svg'
import { useAuth } from '../../auth/AuthContext.jsx'

function formatIsoDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function tomorrowIso() {
  const now = new Date()
  const t = new Date(now)
  t.setDate(now.getDate() + 1)
  return formatIsoDate(t)
}

export default function Home() {
  const { auth } = useAuth()
  const navigate = useNavigate()

  const search = {
    from: '北京(BJS)',
    to: '上海(SHA)',
    departDate: tomorrowIso(),
  }

  const searchTo = `/flights/list?from=${encodeURIComponent(search.from)}&to=${encodeURIComponent(search.to)}&departDate=${encodeURIComponent(search.departDate)}`

  function handleSearchClick(e) {
    e.preventDefault()
    if (!auth?.isLoggedIn) {
      try {
        sessionStorage.setItem('postLoginRedirect', searchTo)
      } catch {
        void 0
      }
      navigate('/login')
      return
    }
    navigate(searchTo)
  }

  return (
    <div className={styles.page}>
      <section className={styles.searchWrap}>
        <div className={styles.searchTabs}>
          <div className={styles.tabActive}>国内、国际/中国港澳台</div>
          <div className={styles.tab}>特价机票</div>
          <div className={styles.tab}>航班动态</div>
          <div className={styles.tab}>在线选座</div>
          <div className={styles.tab}>退票改签</div>
          <div className={styles.tab}>更多服务</div>
        </div>

        <div className={styles.searchBody}>
          <div className={styles.topRow}>
            <div className={styles.radioGroup}>
              <div className={styles.radioOptionActive}>
                <span className={styles.radioDotActive} aria-hidden="true" />
                单程
              </div>
              <div className={styles.radioOption}>
                <span className={styles.radioDot} aria-hidden="true" />
                往返
              </div>
              <div className={styles.radioOption}>
                <span className={styles.radioDot} aria-hidden="true" />
                多程(含缺口)
              </div>
              <span className={styles.helpIcon} aria-hidden="true">
                ?
              </span>
            </div>
            <div className={styles.cabin}>
              不限舱等
              <span className={styles.cabinCaret} aria-hidden="true">
                ▾
              </span>
            </div>
          </div>

          <div className={styles.bar}>
            <div className={styles.cityBlock}>
              <div className={styles.barLabel}>出发地</div>
              <div className={styles.barValue}>{search.from}</div>
            </div>
            <div className={styles.swapWrap} aria-hidden="true">
              <div className={styles.swapCircle}>
                <span className={styles.swapArrow} />
              </div>
            </div>
            <div className={styles.cityBlock}>
              <div className={styles.barLabel}>目的地</div>
              <div className={styles.barValue}>{search.to}</div>
            </div>

            <div className={styles.sep} aria-hidden="true" />

            <div className={styles.dateBlock}>
              <div className={styles.barLabel}>出发日期</div>
              <div className={styles.dateValueRow}>
                <div className={styles.barValue}>{search.departDate}</div>
                <div className={styles.dateHint}>明天</div>
              </div>
              <div className={styles.addReturn}>+ 添加返程</div>
            </div>

            <div className={styles.sep} aria-hidden="true" />

            <div className={styles.passenger}>
              <div className={styles.barLabel}>乘客类型</div>
              <div className={styles.passengerRow}>
                <div className={styles.passengerCheck}>
                  <span className={styles.checkBox} aria-hidden="true" />
                  带儿童
                </div>
                <div className={styles.passengerCheck}>
                  <span className={styles.checkBox} aria-hidden="true" />
                  带婴儿
                </div>
              </div>
            </div>
          </div>

          <div className={styles.searchBtnRow}>
            <Link className={styles.searchBtn} to={searchTo} onClick={handleSearchClick}>
              <span className={styles.searchBtnIcon} aria-hidden="true" />
              搜索
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.banner}>
        <img className={styles.bannerImg} src={homeBanner} alt="占位-主页横幅" />
      </section>

      <section className={styles.deals}>
        <div className={styles.dealsHead}>
          <div className={styles.dealsTitle}>低价速报</div>
          <a className={styles.dealsLink} href="#/">
            更多特价航线&gt;
          </a>
        </div>

        <div className={styles.dealsGrid}>
          <div className={styles.dealCol}>
            <div className={styles.dealColHeadGreen}>周末去沙滩</div>
            <div className={styles.dealList}>
              <DealItem rank="1" from="上海" to="大连" date="01-12" price="¥398" img={dealThumbA} />
              <DealItem rank="2" from="上海" to="厦门" date="01-20" price="¥451" img={dealThumbB} />
              <DealItem rank="3" from="上海" to="青岛" date="01-18" price="¥460" img={dealThumbC} />
              <DealItem rank="4" from="上海" to="三亚" date="01-23" price="¥462" img={dealThumbA} />
              <DealItem rank="5" from="上海" to="北海" date="01-16" price="¥518" img={dealThumbB} />
            </div>
          </div>

          <div className={styles.dealCol}>
            <div className={styles.dealColHeadRed}>爱上大草原</div>
            <div className={styles.dealList}>
              <DealItem rank="1" from="上海" to="呼和浩特" date="01-13" price="¥297" img={dealThumbC} />
              <DealItem rank="2" from="上海" to="通辽" date="01-15" price="¥340" img={dealThumbA} />
              <DealItem rank="3" from="上海" to="满洲里" date="01-18" price="¥400" img={dealThumbB} />
              <DealItem rank="4" from="上海" to="乌兰浩特" date="01-22" price="¥398" img={dealThumbC} />
              <DealItem rank="5" from="上海" to="海拉尔" date="01-17" price="¥398" img={dealThumbA} />
            </div>
          </div>

          <div className={styles.dealCol}>
            <div className={styles.dealColHeadBlue}>海边放一浪</div>
            <div className={styles.dealList}>
              <DealItem rank="1" from="上海" to="厦门" date="01-19" price="¥200" img={dealThumbB} />
              <DealItem rank="2" from="上海" to="三亚" date="01-22" price="¥210" img={dealThumbC} />
              <DealItem rank="3" from="上海" to="舟山" date="01-12" price="¥238" img={dealThumbA} />
              <DealItem rank="4" from="上海" to="福州" date="01-21" price="¥235" img={dealThumbB} />
              <DealItem rank="5" from="上海" to="宁波" date="01-25" price="¥248" img={dealThumbC} />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function DealItem({ rank, from, to, date, price, img }) {
  return (
    <div className={styles.dealItem}>
      <div className={styles.rank}>{rank}</div>
      <img className={styles.thumb} src={img} alt={`占位-${from}-${to}`} />
      <div className={styles.dealInfo}>
        <div className={styles.route}>
          {from} - {to}
        </div>
        <div className={styles.meta}>{date}</div>
      </div>
      <div className={styles.price}>{price}</div>
    </div>
  )
}
