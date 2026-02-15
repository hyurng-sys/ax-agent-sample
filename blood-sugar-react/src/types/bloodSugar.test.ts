import { describe, it, expect } from 'vitest'
import type { BloodSugarRecord, Stats, HealthAdvice } from './bloodSugar'

describe('BloodSugar Types', () => {
  it('should create valid BloodSugarRecord', () => {
    const record: BloodSugarRecord = {
      id: '123',
      date: '2026-02-15',
      value: 120,
      createdAt: Date.now(),
    }
    expect(record.value).toBe(120)
  })

  it('should create valid Stats', () => {
    const stats: Stats = {
      avg: 115,
      max: 140,
      min: 95,
      count: 7,
    }
    expect(stats.avg).toBe(115)
  })
})
