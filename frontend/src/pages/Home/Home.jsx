import { Link } from 'react-router-dom'
import PlaceholderImage from '../../components/PlaceholderImage/PlaceholderImage.jsx'
import styles from './Home.module.css'

function formatDateYYYYMMDD(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const boardData = [
  {
    title: '周末省心游',
    headerClass: styles.green,
    items: [
      { rank: 1, from: '上海', to: '大连', date: '01-12 2天1晚', price: '¥398起' },
      { rank: 2, from: '上海', to: '丽江', date: '01-14 3天2晚', price: '¥451起' },
      { rank: 3, from: '上海', to: '青岛', date: '01-13 2天1晚', price: '¥460起' },
      { rank: 4, from: '上海', to: '合肥', date: '01-14 2天1晚', price: '¥462起' },
      { rank: 5, from: '上海', to: '金昌', date: '01-13 2天1晚', price: '¥518起' },
    ],
  },
  {
    title: '爱上大草原',
    headerClass: styles.red,
    items: [
      { rank: 1, from: '上海', to: '呼和浩特', date: '2025-12-17', price: '¥297起' },
      { rank: 2, from: '上海', to: '西宁', date: '2025-01-18', price: '¥340起' },
      { rank: 3, from: '上海', to: '银川', date: '2025-01-20', price: '¥400起' },
      { rank: 4, from: '上海', to: '鄂尔多斯', date: '2025-12-18', price: '¥498起' },
      { rank: 5, from: '上海', to: '乌兰浩特', date: '2025-12-19', price: '¥498起' },
    ],
  },
  {
    title: '海边放一浪',
    headerClass: styles.purple,
    items: [
      { rank: 1, from: '上海', to: '三亚', date: '2025-01-19', price: '¥700起' },
      { rank: 2, from: '上海', to: '厦门', date: '2025-01-18', price: '¥710起' },
      { rank: 3, from: '上海', to: '宁波', date: '2025-01-18', price: '¥732起' },
      { rank: 4, from: '上海', to: '中山', date: '2025-01-18', price: '¥736起' },
      { rank: 5, from: '上海', to: '湛江', date: '2025-12-15', price: '¥748起' },
    ],
  },
]

export default function Home() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const departDate = formatDateYYYYMMDD(today)

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <section className={styles.searchSection}>
          <div className={styles.topTabs}>
            <div className={styles.topTabActive}>特价机票</div>
            <div className={styles.topTab}>航班动态</div>
            <div className={styles.topTab}>值机选座</div>
            <div className={styles.topTab}>退票改签</div>
            <div className={styles.topTab}>酒店·民宿</div>
            <div className={styles.topTab}>更多服务</div>
          </div>

          <div className={styles.searchCard}>
            <div className={styles.cardTopRow}>
              <div className={styles.radioRow}>
                <div className={styles.radioActive}>
                  <span className={styles.radioDot} />
                  单程
                </div>
                <div className={styles.radio}>
                  <span className={styles.radioDotOff} />
                  往返
                </div>
                <div className={styles.radio}>
                  <span className={styles.radioDotOff} />
                  多程(含缺口)
                </div>
              </div>
              <div className={styles.rightHint}>不限舱等</div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.field}>
                <div className={styles.fieldLabel}>出发地</div>
                <div className={styles.fieldValue}>北京(BJS)</div>
              </div>

              <div className={styles.swap}>
                <PlaceholderImage name="交换" width={22} height={22} />
              </div>

              <div className={styles.field}>
                <div className={styles.fieldLabel}>目的地</div>
                <div className={styles.fieldValue}>上海(SHA)</div>
              </div>

              <div className={styles.fieldWide}>
                <div className={styles.fieldLabel}>日期</div>
                <div className={styles.fieldValue}>{departDate}</div>
              </div>

              <div className={styles.fieldSmall}>
                <div className={styles.fieldLabel}>乘客类型</div>
                <div className={styles.checks}>
                  <span className={styles.checkBox} aria-hidden="true" /> 带儿童
                  <span className={styles.checkBox} aria-hidden="true" /> 带婴儿
                </div>
              </div>
            </div>

            <div className={styles.actionRow}>
              <Link
                className={styles.searchBtn}
                to={`/flights/list?dcity=BJS&acity=SHA&date=${encodeURIComponent(departDate)}`}
                state={{ allowAnonymousSearch: true }}
              >
                <span className={styles.searchIcon} aria-hidden="true">
                  <PlaceholderImage name="放大镜" width={16} height={16} />
                </span>
                搜索
              </Link>
            </div>
          </div>
        </section>

        <section className={styles.bannerSection}>
          <PlaceholderImage name="首页横幅" width={820} height={110} className={styles.banner} />
        </section>

        <section className={styles.boardSection}>
          <div className={styles.boardHeader}>
            <div className={styles.boardTitle}>低价速报</div>
            <div className={styles.boardLink}>更多目的地</div>
          </div>

          <div className={styles.boardGrid}>
            {boardData.map((col) => (
              <div key={col.title} className={styles.boardCol}>
                <div className={[styles.colHeader, col.headerClass].join(' ')}>
                  <div className={styles.colTitle}>{col.title}</div>
                </div>
                <div className={styles.colBody}>
                  {col.items.map((it) => (
                    <div key={`${col.title}-${it.rank}`} className={styles.row}>
                      <div className={styles.rank}>{it.rank}</div>
                      <div className={styles.thumb}>
                        <PlaceholderImage
                          name={`${it.from}-${it.to}-缩略图`}
                          width={56}
                          height={36}
                          className={styles.thumbSvg}
                        />
                      </div>
                      <div className={styles.route}>
                        <div className={styles.routeMain}>
                          {it.from} - {it.to}
                        </div>
                        <div className={styles.routeSub}>{it.date}</div>
                      </div>
                      <div className={styles.price}>{it.price}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className={styles.boardArrow} aria-hidden="true">
              <PlaceholderImage name="右箭头" width={26} height={26} />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
