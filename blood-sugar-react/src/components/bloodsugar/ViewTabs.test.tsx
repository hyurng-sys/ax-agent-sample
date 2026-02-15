import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ViewTabs } from './ViewTabs'
import { useBloodSugarStore } from '../../store/bloodSugarStore'

describe('ViewTabs', () => {
  beforeEach(() => {
    localStorage.clear()
    const store = useBloodSugarStore.getState()
    store.setPeriod('daily') // Reset to daily period
    store.loadRecords()
  })

  it('should render three tabs', () => {
    render(<ViewTabs />)

    expect(screen.getByRole('button', { name: '일간' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '주간' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '월간' })).toBeInTheDocument()
  })

  it('should mark daily tab as active by default', () => {
    render(<ViewTabs />)

    const dailyTab = screen.getByRole('button', { name: '일간' })
    expect(dailyTab.className).toContain('active')
  })

  it('should change period when tab is clicked', async () => {
    const user = userEvent.setup()
    render(<ViewTabs />)

    const weeklyTab = screen.getByRole('button', { name: '주간' })
    await user.click(weeklyTab)

    const store = useBloodSugarStore.getState()
    expect(store.period).toBe('weekly')
  })

  it('should update active class when period changes', async () => {
    const user = userEvent.setup()
    render(<ViewTabs />)

    const dailyTab = screen.getByRole('button', { name: '일간' })
    const weeklyTab = screen.getByRole('button', { name: '주간' })

    // Initially daily is active
    expect(dailyTab.className).toContain('active')
    expect(weeklyTab.className).not.toContain('active')

    // Click weekly
    await user.click(weeklyTab)

    // Now weekly should be active
    expect(dailyTab.className).not.toContain('active')
    expect(weeklyTab.className).toContain('active')
  })

  it('should switch between all three periods', async () => {
    const user = userEvent.setup()
    render(<ViewTabs />)

    const dailyTab = screen.getByRole('button', { name: '일간' })
    const weeklyTab = screen.getByRole('button', { name: '주간' })
    const monthlyTab = screen.getByRole('button', { name: '월간' })

    // Click monthly
    await user.click(monthlyTab)
    expect(monthlyTab.className).toContain('active')
    expect(useBloodSugarStore.getState().period).toBe('monthly')

    // Click daily
    await user.click(dailyTab)
    expect(dailyTab.className).toContain('active')
    expect(useBloodSugarStore.getState().period).toBe('daily')

    // Click weekly
    await user.click(weeklyTab)
    expect(weeklyTab.className).toContain('active')
    expect(useBloodSugarStore.getState().period).toBe('weekly')
  })
})
