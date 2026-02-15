import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { StatsSummary } from './StatsSummary'
import { useBloodSugarStore } from '../../store/bloodSugarStore'

describe('StatsSummary', () => {
  beforeEach(() => {
    localStorage.clear()
    useBloodSugarStore.getState().loadRecords()
  })

  it('should show "-" when no records', () => {
    render(<StatsSummary />)

    expect(screen.getByText('평균')).toBeInTheDocument()
    expect(screen.getByText('최고')).toBeInTheDocument()
    expect(screen.getByText('최저')).toBeInTheDocument()

    // Should show "-" for all values when no data
    const dashes = screen.getAllByText('-')
    expect(dashes.length).toBeGreaterThanOrEqual(3)
  })

  it('should display stats when records exist', () => {
    const store = useBloodSugarStore.getState()
    store.addRecord('2026-02-15', 120)
    store.addRecord('2026-02-14', 100)
    store.addRecord('2026-02-13', 140)

    render(<StatsSummary />)

    // avg = (120 + 100 + 140) / 3 = 120
    expect(screen.getByText('120 mg/dL')).toBeInTheDocument()

    // max = 140
    expect(screen.getByText('140 mg/dL')).toBeInTheDocument()

    // min = 100
    expect(screen.getByText('100 mg/dL')).toBeInTheDocument()
  })

  it('should update when stats change', () => {
    const store = useBloodSugarStore.getState()
    store.addRecord('2026-02-15', 120)

    const { rerender } = render(<StatsSummary />)

    // Initial: avg=120, max=120, min=120
    expect(screen.getAllByText('120 mg/dL').length).toBe(3)

    // Add another record
    act(() => {
      store.addRecord('2026-02-14', 100)
    })

    rerender(<StatsSummary />)

    // avg = 110, max = 120, min = 100
    expect(screen.getByText('110 mg/dL')).toBeInTheDocument()
    expect(screen.getByText('120 mg/dL')).toBeInTheDocument()
    expect(screen.getByText('100 mg/dL')).toBeInTheDocument()
  })
})
