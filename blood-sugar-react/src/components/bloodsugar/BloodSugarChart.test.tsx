import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BloodSugarChart } from './BloodSugarChart'
import { useBloodSugarStore } from '../../store/bloodSugarStore'

describe('BloodSugarChart', () => {
  beforeEach(() => {
    localStorage.clear()
    useBloodSugarStore.getState().loadRecords()
  })

  it('should show empty message when no records', () => {
    render(<BloodSugarChart />)

    expect(screen.getByText(/아직 기록이 없습니다/i)).toBeInTheDocument()
  })

  it('should render chart when records exist', () => {
    const store = useBloodSugarStore.getState()
    store.addRecord('2026-02-15', 120)
    store.addRecord('2026-02-14', 110)

    render(<BloodSugarChart />)

    // Check that chart title is rendered (not empty message)
    expect(screen.getByText('혈당 추이')).toBeInTheDocument()
    expect(screen.queryByText(/아직 기록이 없습니다/i)).not.toBeInTheDocument()
  })

  it('should display chart container', () => {
    const store = useBloodSugarStore.getState()
    store.addRecord('2026-02-15', 120)

    const { container } = render(<BloodSugarChart />)

    // Check for chart container - CSS modules generate unique class names
    const chartDiv = container.querySelector('div > h3')
    expect(chartDiv).toBeInTheDocument()
    expect(chartDiv?.textContent).toBe('혈당 추이')
  })
})
