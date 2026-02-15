import { describe, it, expect } from 'vitest'
import type {
  BloodSugarRecord,
  Stats,
  BloodSugarLevel,
  AdviceStatus,
  AdviceTipType,
  AdviceTip,
  HealthAdvice,
  Period,
  HealthMetricType,
  HealthMetric,
} from './bloodSugar'

describe('BloodSugar Types', () => {
  it('should create valid BloodSugarRecord', () => {
    const record: BloodSugarRecord = {
      id: '123',
      date: '2026-02-15',
      value: 120,
      createdAt: Date.now(),
    }
    expect(record.value).toBe(120)
    expect(record.id).toBe('123')
    expect(record.date).toBe('2026-02-15')
    expect(typeof record.createdAt).toBe('number')
  })

  it('should create valid Stats', () => {
    const stats: Stats = {
      avg: 115,
      max: 140,
      min: 95,
      count: 7,
    }
    expect(stats.avg).toBe(115)
    expect(stats.max).toBe(140)
    expect(stats.min).toBe(95)
    expect(stats.count).toBe(7)
  })

  it('should accept valid BloodSugarLevel values', () => {
    const low: BloodSugarLevel = 'low'
    const normal: BloodSugarLevel = 'normal'
    const high: BloodSugarLevel = 'high'

    expect(low).toBe('low')
    expect(normal).toBe('normal')
    expect(high).toBe('high')
  })

  it('should accept valid AdviceStatus values', () => {
    const excellent: AdviceStatus = 'excellent'
    const good: AdviceStatus = 'good'
    const warning: AdviceStatus = 'warning'
    const danger: AdviceStatus = 'danger'

    expect(excellent).toBe('excellent')
    expect(good).toBe('good')
    expect(warning).toBe('warning')
    expect(danger).toBe('danger')
  })

  it('should accept valid AdviceTipType values', () => {
    const normal: AdviceTipType = 'normal'
    const warning: AdviceTipType = 'warning'
    const danger: AdviceTipType = 'danger'

    expect(normal).toBe('normal')
    expect(warning).toBe('warning')
    expect(danger).toBe('danger')
  })

  it('should create valid AdviceTip', () => {
    const tip: AdviceTip = {
      icon: '✅',
      text: 'Keep up the good work!',
      type: 'normal',
    }

    expect(tip.icon).toBe('✅')
    expect(tip.text).toBe('Keep up the good work!')
    expect(tip.type).toBe('normal')
  })

  it('should create valid HealthAdvice', () => {
    const advice: HealthAdvice = {
      status: 'good',
      message: 'Your blood sugar levels are well controlled',
      tips: [
        { icon: '✅', text: 'Maintain regular exercise', type: 'normal' },
        { icon: '⚠️', text: 'Monitor after meals', type: 'warning' },
      ],
    }

    expect(advice.status).toBe('good')
    expect(advice.message).toBe('Your blood sugar levels are well controlled')
    expect(advice.tips).toHaveLength(2)
    expect(advice.tips[0].type).toBe('normal')
    expect(advice.tips[1].type).toBe('warning')
  })

  it('should accept valid Period values', () => {
    const daily: Period = 'daily'
    const weekly: Period = 'weekly'
    const monthly: Period = 'monthly'

    expect(daily).toBe('daily')
    expect(weekly).toBe('weekly')
    expect(monthly).toBe('monthly')
  })

  it('should accept valid HealthMetricType values', () => {
    const bloodsugar: HealthMetricType = 'bloodsugar'
    const bloodpressure: HealthMetricType = 'bloodpressure'
    const weight: HealthMetricType = 'weight'
    const exercise: HealthMetricType = 'exercise'

    expect(bloodsugar).toBe('bloodsugar')
    expect(bloodpressure).toBe('bloodpressure')
    expect(weight).toBe('weight')
    expect(exercise).toBe('exercise')
  })

  it('should create valid HealthMetric', () => {
    const metric: HealthMetric = {
      type: 'bloodsugar',
    }

    expect(metric.type).toBe('bloodsugar')
  })
})
