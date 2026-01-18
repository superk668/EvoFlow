import { Link } from 'react-router-dom'
import styles from './Orders.module.css'
import PersonalLeftBar from '../../components/PersonalLeftBar/PersonalLeftBar.jsx'

export default function Orders() {
  const sampleOrder = {
    id: '1128144831159754',
    bookingDate: '2025-12-27',
    from: '上海',
    to: '北京',
    departDate: '2025-12-28',
    departTime: '19:30',
    arriveTime: '22:00',
    flight: 'HU7612',
    traveler: '姚秋实',
    status: '待支付',
    price: '¥798',
  }

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <PersonalLeftBar activeKey="orders" />
        <div className={styles.main}>
          <div className={styles.notice}>
            <div className={styles.noticeIcon} aria-hidden="true" />
            <div className={styles.noticeText}>
              您可以在线查看近一年订单，如需查找更久之前的订单，请至携程app或致电95010；您也可以使用右边下载功能下载历史所有订单
            </div>
            <a className={styles.noticeDownload} href="#/">
              <span className={styles.noticeDownloadIcon} aria-hidden="true" />
              下载历史所有订单
            </a>
          </div>

          <div className={styles.tabs}>
            <div className={styles.tabActive}>全部订单</div>
            <div className={styles.tab}>未出行</div>
            <div className={styles.tab}>待支付</div>
            <div className={styles.tab}>待点评</div>
            <div className={styles.tabsLine} aria-hidden="true" />
          </div>

          <div className={styles.filterBar}>
            <div className={styles.filterLabel}>订单类型</div>
            <div className={styles.select}>
              <div className={styles.selectText}>全部订单</div>
              <div className={styles.selectCaret} aria-hidden="true" />
            </div>
            <div className={styles.more}>
              更多筛选条件
              <div className={styles.moreCaret} aria-hidden="true" />
            </div>
          </div>

          <div className={styles.listWrap}>
            <div className={styles.orderCard}>
              <div className={styles.orderHead}>
                <div className={styles.orderLeftHead}>
                  <div className={styles.checkbox} aria-hidden="true" />
                  <div className={styles.orderNoLabel}>订单号：</div>
                  <Link className={styles.orderNoLink} to={`/orders/${sampleOrder.id}`}>
                    {sampleOrder.id}
                  </Link>
                  <div className={styles.orderDateLabel}>预订日期：</div>
                  <div className={styles.orderDateValue}>{sampleOrder.bookingDate}</div>
                </div>

                <div className={styles.orderRightHead}>
                  <div className={styles.orderStatus}>{sampleOrder.status}</div>
                  <div className={styles.orderPrice}>{sampleOrder.price}</div>
                </div>
              </div>

              <Link className={styles.orderBodyLink} to={`/orders/${sampleOrder.id}`}>
                <div className={styles.orderBody}>
                  <div className={styles.orderTitle}>
                    {sampleOrder.from} — {sampleOrder.to}
                  </div>
                  <div className={styles.orderMeta}>出发日期： {sampleOrder.departDate}</div>
                  <div className={styles.orderMeta}>
                    {sampleOrder.departTime} 至 {sampleOrder.arriveTime} {sampleOrder.flight}
                  </div>
                  <div className={styles.orderMeta}>出行人： {sampleOrder.traveler}</div>
                </div>
              </Link>
            </div>
          </div>

          <div className={styles.bottomBar}>
            <div className={styles.bottomLeft}>
              <div className={styles.checkWrap}>
                <div className={styles.checkbox} aria-hidden="true" />
                <div className={styles.bottomText}>全选</div>
              </div>
              <a className={styles.downloadLink} href="#/">
                <span className={styles.noticeDownloadIcon} aria-hidden="true" />
                下载
              </a>
            </div>

            <div className={styles.pager}>
              <div className={styles.pagerPrev} aria-hidden="true" />
              <div className={styles.pagerNumActive}>1</div>
              <div className={styles.pagerNext}>下一页</div>
              <div className={styles.pagerNextCaret} aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
