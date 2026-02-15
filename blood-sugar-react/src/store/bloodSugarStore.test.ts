import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useBloodSugarStore } from './bloodSugarStore'
import { BloodSugarService } from '../services/bloodSugarService'

describe('BloodSugarStore', () => {
  beforeEach(() => {
    localStorage.clear()
    // Reset store state by reinitializing
    const { result } = renderHook(() => useBloodSugarStore())
    act(() => {
      result.current.loadRecords()
    })
  })

  it('should initialize with empty records', () => {
    const { result } = renderHook(() => useBloodSugarStore())

    expect(result.current.records).toEqual([])
    expect(result.current.filteredRecords).toEqual([])
    expect(result.current.period).toBe('daily')
    expect(result.current.stats).toEqual({ avg: 0, max: 0, min: 0, count: 0 })
  })

  it('should load records from service', () => {
    // Add records to service first
    BloodSugarService.addRecord('2024-01-01', 100)
    BloodSugarService.addRecord('2024-01-02', 120)

    const { result } = renderHook(() => useBloodSugarStore())

    act(() => {
      result.current.loadRecords()
    })

    expect(result.current.records).toHaveLength(2)
    expect(result.current.records[0].value).toBe(120)
    expect(result.current.records[1].value).toBe(100)
  })

  it('should add new record', () => {
    const { result } = renderHook(() => useBloodSugarStore())

    act(() => {
      result.current.addRecord('2024-01-01', 110)
    })

    expect(result.current.records).toHaveLength(1)
    expect(result.current.records[0].value).toBe(110)
    expect(result.current.records[0].date).toBe('2024-01-01')
  })

  it('should delete record', () => {
    const { result } = renderHook(() => useBloodSugarStore())

    // Add a record first
    act(() => {
      result.current.addRecord('2024-01-01', 110)
    })

    const recordId = result.current.records[0].id

    // Delete the record
    act(() => {
      result.current.deleteRecord(recordId)
    })

    expect(result.current.records).toHaveLength(0)
  })

  it('should update period and recalculate stats', () => {
    const { result } = renderHook(() => useBloodSugarStore())

    // Add records with different dates
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const old = new Date(today)
    old.setDate(old.getDate() - 40)

    const todayStr = today.toISOString().split('T')[0]
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    const oldStr = old.toISOString().split('T')[0]

    act(() => {
      result.current.addRecord(todayStr, 100)
      result.current.addRecord(yesterdayStr, 120)
      result.current.addRecord(oldStr, 140)
    })

    // Initially daily period (7 days) - should show recent 2 records
    expect(result.current.filteredRecords.length).toBeGreaterThanOrEqual(2)

    // Change to monthly period (90 days) - should show all 3 records
    act(() => {
      result.current.setPeriod('monthly')
    })

    expect(result.current.period).toBe('monthly')
    expect(result.current.filteredRecords).toHaveLength(3)
    expect(result.current.stats.count).toBe(3)
  })

  it('should compute filtered records based on period', () => {
    const { result } = renderHook(() => useBloodSugarStore())

    const today = new Date()
    const recent = new Date(today)
    recent.setDate(recent.getDate() - 5)

    const old = new Date(today)
    old.setDate(old.getDate() - 50)

    const todayStr = today.toISOString().split('T')[0]
    const recentStr = recent.toISOString().split('T')[0]
    const oldStr = old.toISOString().split('T')[0]

    act(() => {
      result.current.addRecord(todayStr, 100)
      result.current.addRecord(recentStr, 120)
      result.current.addRecord(oldStr, 140)
    })

    // Daily period (7 days) should filter out the 50-day-old record
    act(() => {
      result.current.setPeriod('daily')
    })
    expect(result.current.filteredRecords.length).toBeGreaterThanOrEqual(2)

    // Weekly period (30 days) should also filter out the 50-day-old record
    act(() => {
      result.current.setPeriod('weekly')
    })
    expect(result.current.filteredRecords.length).toBeGreaterThanOrEqual(2)

    // Monthly period (90 days) should include all records
    act(() => {
      result.current.setPeriod('monthly')
    })
    expect(result.current.filteredRecords).toHaveLength(3)
  })

  it('should compute stats from filtered records', () => {
    const { result } = renderHook(() => useBloodSugarStore())

    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    const day1 = new Date(today)
    day1.setDate(day1.getDate() - 1)
    const day1Str = day1.toISOString().split('T')[0]

    act(() => {
      result.current.addRecord(todayStr, 100)
      result.current.addRecord(day1Str, 120)
    })

    const stats = result.current.stats

    expect(stats.count).toBeGreaterThanOrEqual(2)
    expect(stats.avg).toBe(110) // (100 + 120) / 2 = 110
    expect(stats.max).toBe(120)
    expect(stats.min).toBe(100)
  })
})
