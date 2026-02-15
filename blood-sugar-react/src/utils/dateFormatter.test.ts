import { describe, it, expect } from 'vitest'
import { formatDate } from './dateFormatter'

describe('formatDate', () => {
  it('should format date correctly', () => {
    // 2026-02-15 is Sunday
    expect(formatDate('2026-02-15')).toBe('2월 15일 (일)')
  })

  it('should handle different months', () => {
    expect(formatDate('2026-12-25')).toContain('12월 25일')
  })
})
