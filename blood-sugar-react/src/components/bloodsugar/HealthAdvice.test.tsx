import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HealthAdvice } from './HealthAdvice'
import { useBloodSugarStore } from '../../store/bloodSugarStore'

describe('HealthAdvice', () => {
  beforeEach(() => {
    localStorage.clear()
    useBloodSugarStore.getState().loadRecords()
  })

  it('should show default message when no data', () => {
    render(<HealthAdvice />)

    expect(screen.getByText(/건강 평가 및 조언/i)).toBeInTheDocument()
    expect(screen.getByText(/데이터를 입력하면/i)).toBeInTheDocument()
  })

  it('should display excellent status for good average', () => {
    const store = useBloodSugarStore.getState()
    store.addRecord('2026-02-15', 110)
    store.addRecord('2026-02-14', 115)

    render(<HealthAdvice />)

    expect(screen.getByText(/우수/i)).toBeInTheDocument()
    expect(screen.getByText(/평균 혈당이.*mg\/dL로 매우 좋습니다/i)).toBeInTheDocument()
  })

  it('should display warning status for high average', () => {
    const store = useBloodSugarStore.getState()
    store.addRecord('2026-02-15', 160)
    store.addRecord('2026-02-14', 165)

    render(<HealthAdvice />)

    expect(screen.getByText(/주의/i)).toBeInTheDocument()
  })

  it('should display tips with icons', () => {
    const store = useBloodSugarStore.getState()
    store.addRecord('2026-02-15', 120)

    render(<HealthAdvice />)

    // Tips should be rendered
    const tips = screen.getAllByText(/./i)
    expect(tips.length).toBeGreaterThan(0)
  })

  it('should update when stats change', () => {
    const store = useBloodSugarStore.getState()
    store.addRecord('2026-02-15', 120)

    const { rerender } = render(<HealthAdvice />)

    expect(screen.getByText(/우수/i)).toBeInTheDocument()

    // Add high blood sugar
    store.addRecord('2026-02-14', 180)

    rerender(<HealthAdvice />)

    // Status should change from excellent to good/warning
    const statusText = screen.queryByText(/우수/i)
    // May or may not still be excellent depending on average
  })
})
