import { describe, it, expect } from 'vitest'
import { generateHealthAdvice } from './healthAdviceService'
import type { Stats, BloodSugarRecord } from '../types/bloodSugar'

describe('generateHealthAdvice', () => {
  it('should return excellent status for avg ≤ 120', () => {
    const stats: Stats = { avg: 110, max: 120, min: 100, count: 5 }
    const records: BloodSugarRecord[] = [
      { id: '1', date: '2026-02-15', value: 110, createdAt: Date.now() },
    ]

    const advice = generateHealthAdvice(stats, records)

    expect(advice.status).toBe('excellent')
    expect(advice.message).toContain('110')
  })

  it('should return good status for avg 120-140', () => {
    const stats: Stats = { avg: 130, max: 140, min: 120, count: 3 }
    const records: BloodSugarRecord[] = []

    const advice = generateHealthAdvice(stats, records)

    expect(advice.status).toBe('good')
  })

  it('should return warning status for avg 140-180', () => {
    const stats: Stats = { avg: 160, max: 180, min: 140, count: 3 }
    const records: BloodSugarRecord[] = []

    const advice = generateHealthAdvice(stats, records)

    expect(advice.status).toBe('warning')
  })

  it('should return danger status for avg > 180', () => {
    const stats: Stats = { avg: 200, max: 220, min: 180, count: 3 }
    const records: BloodSugarRecord[] = []

    const advice = generateHealthAdvice(stats, records)

    expect(advice.status).toBe('danger')
  })

  it('should generate tips for high blood sugar percentage', () => {
    const stats: Stats = { avg: 160, max: 200, min: 150, count: 10 }
    const records: BloodSugarRecord[] = Array(10).fill(null).map((_, i) => ({
      id: String(i),
      date: '2026-02-15',
      value: 150 + i * 5, // Most above 140
      createdAt: Date.now(),
    }))

    const advice = generateHealthAdvice(stats, records)

    expect(advice.tips.length).toBeGreaterThan(0)
    expect(advice.tips.some(tip => tip.text.includes('식사량'))).toBe(true)
  })

  it('should generate tip for high variability', () => {
    const stats: Stats = { avg: 130, max: 180, min: 80, count: 5 }
    const records: BloodSugarRecord[] = []

    const advice = generateHealthAdvice(stats, records)

    const variabilityTip = advice.tips.find(tip => tip.text.includes('변동폭'))
    expect(variabilityTip).toBeDefined()
    expect(variabilityTip?.text).toContain('100')
  })

  it('should provide encouragement for good management', () => {
    const stats: Stats = { avg: 115, max: 130, min: 100, count: 10 }
    const records: BloodSugarRecord[] = Array(10).fill(null).map((_, i) => ({
      id: String(i),
      date: '2026-02-15',
      value: 110 + i * 2, // All normal range
      createdAt: Date.now(),
    }))

    const advice = generateHealthAdvice(stats, records)

    expect(advice.tips.some(tip => tip.text.includes('훌륭'))).toBe(true)
  })

  it('should handle empty data', () => {
    const stats: Stats = { avg: 0, max: 0, min: 0, count: 0 }
    const records: BloodSugarRecord[] = []

    const advice = generateHealthAdvice(stats, records)

    expect(advice.status).toBe('excellent')
    expect(advice.message).toContain('데이터')
  })
})
