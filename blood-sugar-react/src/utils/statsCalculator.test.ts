import { describe, it, expect } from 'vitest'
import { calculateStats, filterRecordsByPeriod, getBloodSugarLevel } from './statsCalculator'
import type { BloodSugarRecord } from '../types/bloodSugar'

describe('statsCalculator', () => {
  const mockRecords: BloodSugarRecord[] = [
    { id: '1', date: '2026-02-15', value: 120, createdAt: Date.now() },
    { id: '2', date: '2026-02-14', value: 100, createdAt: Date.now() },
    { id: '3', date: '2026-02-13', value: 150, createdAt: Date.now() },
  ]

  describe('calculateStats', () => {
    it('should calculate correct statistics', () => {
      const stats = calculateStats(mockRecords)
      expect(stats.avg).toBe(123) // (120+100+150)/3 rounded
      expect(stats.max).toBe(150)
      expect(stats.min).toBe(100)
      expect(stats.count).toBe(3)
    })

    it('should return zero stats for empty array', () => {
      const stats = calculateStats([])
      expect(stats.avg).toBe(0)
      expect(stats.max).toBe(0)
      expect(stats.min).toBe(0)
      expect(stats.count).toBe(0)
    })
  })

  describe('getBloodSugarLevel', () => {
    it('should classify blood sugar levels correctly', () => {
      expect(getBloodSugarLevel(80)).toBe('low')
      expect(getBloodSugarLevel(120)).toBe('normal')
      expect(getBloodSugarLevel(160)).toBe('high')
    })
  })

  describe('filterRecordsByPeriod', () => {
    it('should filter records for daily period (7 days)', () => {
      const today = new Date()
      const records: BloodSugarRecord[] = [
        { id: '1', date: formatDate(today), value: 120, createdAt: Date.now() },
        { id: '2', date: formatDate(addDays(today, -5)), value: 110, createdAt: Date.now() },
        { id: '3', date: formatDate(addDays(today, -10)), value: 100, createdAt: Date.now() },
      ]

      const filtered = filterRecordsByPeriod(records, 'daily')
      expect(filtered).toHaveLength(2) // within 7 days
    })
  })
})

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}
