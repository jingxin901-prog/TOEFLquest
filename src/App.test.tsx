import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'

describe('TOEFL Quest MVP flow', () => {
  beforeEach(() => {
    localStorage.clear()
    window.location.hash = '#/'
  })

  it('onboards, generates a plan, and supports explicit task completion', async () => {
    render(<App />)
    expect(screen.getByRole('dialog', { name: '规划你的第一条学习路线' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /生成我的 7 天计划/ }))

    await waitFor(() => expect(screen.queryByRole('dialog', { name: '规划你的第一条学习路线' })).not.toBeInTheDocument())
    expect(screen.getByText('今日任务')).toBeInTheDocument()

    const completionButtons = screen.getAllByRole('button', { name: '确认完成' })
    fireEvent.click(completionButtons[0])
    expect(screen.getByRole('dialog', { name: '确认本次完成' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '我确认已完成' }))
    await waitFor(() => expect(screen.queryByRole('dialog', { name: '确认本次完成' })).not.toBeInTheDocument())
    expect(screen.getAllByRole('button', { name: '标为未完成' }).length).toBeGreaterThan(0)
  })
})
