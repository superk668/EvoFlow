import { Link } from 'react-router-dom'
import PlaceholderImage from '../../components/PlaceholderImage/PlaceholderImage.jsx'
import styles from './PersonalCenterOrders.module.css'

export default function PersonalCenterOrders() {
  return (
    <div className={styles.page}>
      <div className={styles.notice}>
        <span className={styles.noticeIcon} aria-hidden="true">
          <PlaceholderImage name="提示-信息" width={14} height={14} />
        </span>
        <div className={styles.noticeText}>
          您可以在线查询订单一年内，如需查找更久之前的订单，需前往Trip.com或95010。您还可以使用如下功能下载历史所有订单
        </div>
        <div className={styles.noticeAction}>
          <span className={styles.downloadIcon} aria-hidden="true">
            <PlaceholderImage name="下载" width={14} height={14} />
          </span>
          下载历史所有订单
        </div>
      </div>

      <div className={styles.panel}>
        <div className={styles.tabs}>
          <div className={[styles.tab, styles.tabActive].join(' ')}>全部订单</div>
          <div className={styles.tab}>未出行</div>
          <div className={styles.tab}>待支付</div>
          <div className={styles.tab}>待点评</div>
        </div>

        <div className={styles.toolbar}>
          <div className={styles.field}>
            <div className={styles.label}>订单类型</div>
            <div className={styles.select}>
              全部订单 <span className={styles.selectCaret} aria-hidden="true" />
            </div>
          </div>
          <div className={styles.moreFilter}>
            更多筛选条件 <span className={styles.moreCaret} aria-hidden="true" />
          </div>
        </div>

        <div className={styles.listWrap}>
          <div className={styles.orderCard}>
            <div className={styles.orderMeta}>
              <span className={styles.checkbox} aria-hidden="true" />
              <div className={styles.metaText}>
                <span className={styles.metaLabel}>订单号：</span>
                <Link className={styles.metaLink} to="/user-center/orders/1128144831159754">
                  1128144831159754
                </Link>
              </div>
              <div className={styles.metaText}>
                <span className={styles.metaLabel}>预订日期：</span>
                2025-12-27
              </div>
            </div>

            <div className={styles.orderBody}>
              <div className={styles.trip}>
                <div className={styles.route}>上海 → 北京</div>
                <div className={styles.tripLine}>出发日期：2025-12-28 19:30 至 22:00 HU7612</div>
                <div className={styles.tripLine}>出行人：郭铁头</div>
              </div>
              <div className={styles.pay}>
                <div className={styles.payStatus}>待支付</div>
                <div className={styles.payPrice}>¥798</div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.bottomBar}>
          <div className={styles.bottomLeft}>
            <div className={styles.selectAll}>
              <span className={styles.checkboxSmall} aria-hidden="true" />
              全选
            </div>
            <div className={styles.bottomDownload}>
              <span className={styles.bottomDownloadIcon} aria-hidden="true">
                <PlaceholderImage name="下载" width={14} height={14} />
              </span>
              下载
            </div>
          </div>

          <div className={styles.pagination}>
            <div className={[styles.pageBtn, styles.pageBtnDisabled].join(' ')}>
              <span className={styles.pageArrowLeft} aria-hidden="true" />
            </div>
            <div className={styles.pageNumActive}>1</div>
            <div className={styles.pageBtn}>
              下一页 <span className={styles.pageArrowRight} aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
