import styles from './Home.module.css'
import homeBanner from '../../assets/placeholders/home_banner_805x180.svg'
import lowFareThumb from '../../assets/placeholders/lowfare_item_76x48.svg'

const LOW_FARE_COLUMNS = [
  {
    title: '周末省心游',
    subtitle: '特惠',
    tone: 'green',
    items: [
      { rank: '1', from: '上海', to: '大连', date: '01-12 12:10', price: '¥398起', discount: '1.3折' },
      { rank: '2', from: '上海', to: '丽江', date: '01-14 08:10', price: '¥451起', discount: '2.2折' },
      { rank: '3', from: '上海', to: '杭州', date: '01-13 09:40', price: '¥460起', discount: '2.5折' },
      { rank: '4', from: '上海', to: '合肥', date: '01-13 10:40', price: '¥462起', discount: '2.6折' },
      { rank: '5', from: '上海', to: '桂林', date: '01-14 08:40', price: '¥514起', discount: '2.8折' },
    ],
  },
  {
    title: '爱上大草原',
    subtitle: '热门',
    tone: 'red',
    items: [
      { rank: '1', from: '上海', to: '呼和浩特', date: '01-12 08:10', price: '¥297起', discount: '1.3折' },
      { rank: '2', from: '上海', to: '通辽', date: '01-13 06:10', price: '¥340起', discount: '1.8折' },
      { rank: '3', from: '上海', to: '锡林浩特', date: '01-14 09:10', price: '¥400起', discount: '2.0折' },
      { rank: '4', from: '上海', to: '海拉尔', date: '01-15 09:10', price: '¥398起', discount: '2.1折' },
    ],
  },
  {
    title: '海边浪一浪',
    subtitle: '精选',
    tone: 'blue',
    items: [
      { rank: '1', from: '上海', to: '大连', date: '01-12 12:10', price: '¥200起', discount: '1.2折' },
      { rank: '2', from: '上海', to: '厦门', date: '01-13 08:10', price: '¥210起', discount: '1.6折' },
      { rank: '3', from: '上海', to: '宁波', date: '01-13 10:10', price: '¥232起', discount: '1.7折' },
      { rank: '4', from: '上海', to: '三亚', date: '01-14 08:40', price: '¥235起', discount: '1.8折' },
      { rank: '5', from: '上海', to: '珠海', date: '01-15 09:10', price: '¥248起', discount: '1.9折' },
    ],
  },
]

export default function Home() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.topRow}>
          <div className={styles.searchBox}>
            <div className={styles.channelTabs}>
              <div className={`${styles.channelTab} ${styles.channelActive}`}>国内、国际/港澳台机票</div>
              <div className={styles.channelTab}>特价机票</div>
              <div className={styles.channelTab}>航班动态</div>
              <div className={styles.channelTab}>值机选座</div>
              <div className={styles.channelTab}>退改签</div>
              <div className={styles.channelTab}>行程变更</div>
            </div>

            <div className={styles.formCard}>
              <div className={styles.formTop}>
                <div className={styles.tripTypes}>
                  <div className={`${styles.tripType} ${styles.tripActive}`}>单程</div>
                  <div className={styles.tripType}>往返</div>
                  <div className={styles.tripType}>多程(含缺口程)</div>
                </div>
                <div className={styles.cabin}>不限舱位</div>
              </div>

              <div className={styles.fieldsRow}>
                <div className={styles.cityField}>
                  <div className={styles.cityLabel}>出发</div>
                  <div className={styles.cityValue}>上海(SHA)</div>
                </div>
                <div className={styles.swap}>
                  <div className={styles.swapIcon} />
                </div>
                <div className={styles.cityField}>
                  <div className={styles.cityLabel}>到达</div>
                  <div className={styles.cityValue}>北京(BJS)</div>
                </div>
                <div className={styles.dateField}>
                  <div className={styles.cityLabel}>出发日期</div>
                  <div className={styles.dateValue}>2025-12-18</div>
                </div>
              </div>

              <div className={styles.actionsRow}>
                <div className={styles.options}>
                  <div className={styles.option}>
                    <div className={styles.checkbox} />
                    <div className={styles.optionText}>学生特惠</div>
                  </div>
                  <div className={styles.option}>
                    <div className={styles.checkbox} />
                    <div className={styles.optionText}>带儿童</div>
                  </div>
                  <div className={styles.option}>
                    <div className={styles.checkbox} />
                    <div className={styles.optionText}>带婴儿</div>
                  </div>
                </div>
                <div className={styles.searchBtn}>
                  <div className={styles.searchBtnIcon} />
                  <div className={styles.searchBtnText}>搜索</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.bannerWrap}>
          <img className={styles.bannerImg} src={homeBanner} alt="banner" />
        </div>

        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>低价速报</div>
          <div className={styles.sectionMeta}>
            <div className={styles.metaLabel}>出发地：</div>
            <div className={styles.metaValue}>上海</div>
          </div>
        </div>

        <div className={styles.lowFareGrid}>
          {LOW_FARE_COLUMNS.map((col) => (
            <div key={col.title} className={`${styles.lowCard} ${styles[col.tone]}`}>
              <div className={styles.lowHead}>
                <div className={styles.lowTitle}>{col.title}</div>
                <div className={styles.lowSub}>{col.subtitle}</div>
              </div>
              <div className={styles.lowList}>
                {col.items.map((it) => (
                  <div key={`${col.title}-${it.rank}`} className={styles.lowItem}>
                    <div className={styles.rank}>{it.rank}</div>
                    <img className={styles.thumb} src={lowFareThumb} alt="thumb" />
                    <div className={styles.route}>
                      <div className={styles.routeTop}>
                        <span className={styles.routeCity}>{it.from}</span>
                        <span className={styles.routeDash}>-</span>
                        <span className={styles.routeCity}>{it.to}</span>
                      </div>
                      <div className={styles.routeMeta}>{it.date}</div>
                    </div>
                    <div className={styles.priceCol}>
                      <div className={styles.discount}>{it.discount}</div>
                      <div className={styles.price}>{it.price}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

