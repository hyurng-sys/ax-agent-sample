import { describe, it, expect, beforeEach } from 'vitest'
import { BloodSugarService } from './bloodSugarService'

describe('BloodSugarService', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('getAllRecords', () => {
    it('should return empty array initially', () => {
      const records = BloodSugarService.getAllRecords()
      expect(records).toEqual([])
    })

    it('should return saved records', () => {
      const record = BloodSugarService.addRecord('2026-02-15', 120)
      const records = BloodSugarService.getAllRecords()
      expect(records).toHaveLength(1)
      expect(records[0]).toEqual(record)
    })
  })

  describe('addRecord', () => {
    it('should add new record with generated id', () => {
      const record = BloodSugarService.addRecord('2026-02-15', 120)
      expect(record.id).toBeDefined()
      expect(record.date).toBe('2026-02-15')
      expect(record.value).toBe(120)
      expect(record.createdAt).toBeGreaterThan(0)
    })

    it('should update existing record for same date', () => {
      BloodSugarService.addRecord('2026-02-15', 120)
      BloodSugarService.addRecord('2026-02-15', 130)

      const records = BloodSugarService.getAllRecords()
      expect(records).toHaveLength(1)
      expect(records[0].value).toBe(130)
    })

    it('should sort records by date (newest first)', () => {
      BloodSugarService.addRecord('2026-02-13', 100)
      BloodSugarService.addRecord('2026-02-15', 120)
      BloodSugarService.addRecord('2026-02-14', 110)

      const records = BloodSugarService.getAllRecords()
      expect(records[0].date).toBe('2026-02-15')
      expect(records[1].date).toBe('2026-02-14')
      expect(records[2].date).toBe('2026-02-13')
    })
  })

  describe('deleteRecord', () => {
    it('should delete record by id', () => {
      const record = BloodSugarService.addRecord('2026-02-15', 120)
      BloodSugarService.deleteRecord(record.id)

      const records = BloodSugarService.getAllRecords()
      expect(records).toHaveLength(0)
    })

    it('should do nothing if id not found', () => {
      BloodSugarService.addRecord('2026-02-15', 120)
      BloodSugarService.deleteRecord('non-existent')

      const records = BloodSugarService.getAllRecords()
      expect(records).toHaveLength(1)
    })
  })
})
