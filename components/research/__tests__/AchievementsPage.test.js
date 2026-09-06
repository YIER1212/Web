import { fireEvent, render, screen } from '@testing-library/react'
import achievements from '@/data/achievements.json'
import AchievementsPage from '../AchievementsPage'

jest.mock('@/components/SmartLink', () => ({ __esModule: true, default: ({ children, ...props }) => <a {...props}>{children}</a> }))

test('shows nine distinct competition records and preserves existing achievements', () => {
  expect(achievements.filter(item => item.type === 'award')).toHaveLength(9)
  expect(achievements.filter(item => item.type === 'paper')).toHaveLength(3)
  expect(achievements.filter(item => item.type === 'patent')).toHaveLength(3)
  expect(new Set(achievements.map(item => item.id)).size).toBe(achievements.length)
  render(<AchievementsPage />)
  expect(screen.getAllByRole('article')).toHaveLength(15)
  fireEvent.change(screen.getByLabelText('成果类型'), { target: { value: 'award' } })
  expect(screen.getAllByRole('article')).toHaveLength(9)
  fireEvent.change(screen.getByLabelText('年份'), { target: { value: '2024' } })
  expect(screen.getAllByRole('article')).toHaveLength(3)
  fireEvent.change(screen.getByLabelText('研究方向'), { target: { value: 'stroke-rehabilitation' } })
  expect(screen.getAllByRole('article')).toHaveLength(2)
})

test('sorts by date and does not create links for private certificate evidence', () => {
  render(<AchievementsPage />)
  expect(screen.getAllByRole('article')[0]).toHaveTextContent('体表三维温度靶点自动规划')
  fireEvent.change(screen.getByLabelText('成果类型'), { target: { value: 'award' } })
  expect(screen.getAllByRole('article')[0]).toHaveTextContent('国创赛北京赛区一等奖')
  expect(screen.getAllByRole('link', { name: '公开链接 ↗' })).toHaveLength(1)
  expect(JSON.stringify(achievements)).not.toMatch(/file:|E:\\|\.pdf|\.achievement-sync/)
})
