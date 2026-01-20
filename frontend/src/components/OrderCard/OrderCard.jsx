import styles from './OrderCard.module.css'

export default function OrderCard({ order, onDelete, onPay, onOpenDetail }) {
  const canPay = order?.status === 'pending_payment'

  return (
    <div className={styles.card}>
      <div className={styles.summary}>
        <button className={styles.title} type="button" onClick={onOpenDetail}>
          {order?.title || ''}
        </button>
        <div className={styles.meta}>
          <span>{order?.orderNo || ''}</span>
          <span>{order?.createdAt || ''}</span>
        </div>
      </div>

      <div className={styles.actions}>
        <button type="button" onClick={onOpenDetail}>
          查看详情
        </button>
        <button type="button" onClick={onDelete}>
          删除
        </button>
        {canPay ? (
          <button type="button" onClick={onPay}>
            去支付
          </button>
        ) : null}
      </div>
    </div>
  )
}
