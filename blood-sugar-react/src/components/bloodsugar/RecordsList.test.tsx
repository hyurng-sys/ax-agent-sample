import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RecordsList } from './RecordsList'
import { useBloodSugarStore } from '../../store/bloodSugarStore'

describe('RecordsList', () => {
  const originalConfirm = window.confirm

  beforeEach(() => {
    localStorage.clear()
    useBloodSugarStore.getState().loadRecords()
  })

  afterEach(() => {
    window.confirm = originalConfirm
  })

  it('should show empty message when no records', () => {
    render(<RecordsList />)
    expect(screen.getByText(/이 기간에는 기록이 없습니다/i)).toBeInTheDocument()
  })

  it('should display records list', () => {
    const store = useBloodSugarStore.getState()
    store.addRecord('2026-02-15', 120)
    store.addRecord('2026-02-14', 95)

    render(<RecordsList />)

    expect(screen.getByText(/2월 15일/)).toBeInTheDocument()
    expect(screen.getByText('120 mg/dL')).toBeInTheDocument()
    expect(screen.getByText('95 mg/dL')).toBeInTheDocument()
  })

  it('should delete record when delete button clicked', async () => {
    const user = userEvent.setup()

    // Mock window.confirm
    window.confirm = () => true

    const store = useBloodSugarStore.getState()
    store.addRecord('2026-02-15', 120)

    render(<RecordsList />)

    const deleteButton = screen.getByRole('button', { name: /삭제/i })
    await user.click(deleteButton)

    expect(store.records).toHaveLength(0)
  })

  it('should not delete when user cancels', async () => {
    const user = userEvent.setup()

    // Mock window.confirm to return false
    window.confirm = () => false

    const store = useBloodSugarStore.getState()
    store.addRecord('2026-02-15', 120)

    render(<RecordsList />)

    const deleteButton = screen.getByRole('button', { name: /삭제/i })
    await user.click(deleteButton)

    // Get fresh store state after the click
    const updatedStore = useBloodSugarStore.getState()
    expect(updatedStore.records).toHaveLength(1)
  })

  it('should apply correct CSS class based on blood sugar level', () => {
    const store = useBloodSugarStore.getState()
    store.addRecord('2026-02-15', 95)  // low
    store.addRecord('2026-02-14', 120) // normal
    store.addRecord('2026-02-13', 150) // high

    render(<RecordsList />)

    const lowValue = screen.getByText('95 mg/dL')
    const normalValue = screen.getByText('120 mg/dL')
    const highValue = screen.getByText('150 mg/dL')

    expect(lowValue.className).toContain('low')
    expect(normalValue.className).toContain('normal')
    expect(highValue.className).toContain('high')
  })
})
