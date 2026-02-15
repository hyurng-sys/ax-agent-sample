import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BloodSugarInput } from './BloodSugarInput'
import { useBloodSugarStore } from '../../store/bloodSugarStore'

describe('BloodSugarInput', () => {
  beforeEach(() => {
    localStorage.clear()
    useBloodSugarStore.getState().loadRecords()
  })

  it('should render input fields', () => {
    render(<BloodSugarInput />)

    expect(screen.getByLabelText(/날짜/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/혈당/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /기록 추가/i })).toBeInTheDocument()
  })

  it('should add record when form is submitted', async () => {
    const user = userEvent.setup()
    render(<BloodSugarInput />)

    const dateInput = screen.getByLabelText(/날짜/i) as HTMLInputElement
    const valueInput = screen.getByLabelText(/혈당/i)
    const submitButton = screen.getByRole('button', { name: /기록 추가/i })

    // For date inputs, we need to clear and set value directly
    await user.clear(dateInput)
    await user.type(dateInput, '2026-02-15')
    await user.type(valueInput, '120')
    await user.click(submitButton)

    const store = useBloodSugarStore.getState()
    expect(store.records).toHaveLength(1)
    expect(store.records[0].value).toBe(120)
  })

  it('should clear value input after submission', async () => {
    const user = userEvent.setup()
    render(<BloodSugarInput />)

    const valueInput = screen.getByLabelText(/혈당/i) as HTMLInputElement
    const submitButton = screen.getByRole('button', { name: /기록 추가/i })

    await user.type(valueInput, '120')
    await user.click(submitButton)

    expect(valueInput.value).toBe('')
  })
})
