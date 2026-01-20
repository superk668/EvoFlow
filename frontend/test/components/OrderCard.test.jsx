import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import OrderCard from '../../src/components/OrderCard/OrderCard.jsx'

describe('订单管理 - 订单卡片组件 场景用例', () => {
  it('UI-OrderCard: 展示订单号/预订日期/标题', () => {
    render(
      <OrderCard
        order={{
          orderNo: 'NO0001',
          createdAt: '2026-01-20',
          title: '上海 → 北京',
          status: 'pending_payment',
        }}
        onDelete={() => null}
        onPay={() => null}
        onOpenDetail={() => null}
      />
    )

    expect(screen.getByText('上海 → 北京')).toBeInTheDocument()
    expect(screen.getByText('NO0001')).toBeInTheDocument()
    expect(screen.getByText('2026-01-20')).toBeInTheDocument()
  })

  it('UI-OrderCard: 未支付订单显示“去支付”按钮', () => {
    render(
      <OrderCard
        order={{ title: '上海 → 北京', orderNo: 'NO0001', createdAt: '2026-01-20', status: 'pending_payment' }}
        onDelete={() => null}
        onPay={() => null}
        onOpenDetail={() => null}
      />
    )

    expect(screen.getByRole('button', { name: '去支付' })).toBeInTheDocument()
  })

  it('UI-OrderCard: 非未支付订单不显示“去支付”按钮', () => {
    render(
      <OrderCard
        order={{ title: '上海 → 北京', orderNo: 'NO0001', createdAt: '2026-01-20', status: 'canceled' }}
        onDelete={() => null}
        onPay={() => null}
        onOpenDetail={() => null}
      />
    )

    expect(screen.queryByRole('button', { name: '去支付' })).not.toBeInTheDocument()
  })

  it('UI-OrderCard: 点击卡片文字区域可进入详情页', async () => {
    const user = userEvent.setup()
    const onOpenDetail = vi.fn()

    render(
      <OrderCard
        order={{ title: '上海 → 北京', orderNo: 'NO0001', createdAt: '2026-01-20', status: 'pending_payment' }}
        onDelete={() => null}
        onPay={() => null}
        onOpenDetail={onOpenDetail}
      />
    )

    await user.click(screen.getByText('上海 → 北京'))
    expect(onOpenDetail).toHaveBeenCalledTimes(1)
  })
})

