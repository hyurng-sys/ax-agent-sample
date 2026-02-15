import { describe, it, expect, beforeEach } from 'vitest'
import { migrateBloodSugarData, needsMigration } from './dataMigration'

describe('dataMigration', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('needsMigration', () => {
    it('should return true for old format data', () => {
      const oldData = [
        { date: '2026-02-15', value: 120 },
        { date: '2026-02-14', value: 110 },
      ]
      localStorage.setItem('bloodSugarData', JSON.stringify(oldData))

      expect(needsMigration()).toBe(true)
    })

    it('should return false for new format data', () => {
      const newData = [
        { id: '1', date: '2026-02-15', value: 120, createdAt: Date.now() },
      ]
      localStorage.setItem('bloodSugarData', JSON.stringify(newData))

      expect(needsMigration()).toBe(false)
    })

    it('should return false when no data exists', () => {
      expect(needsMigration()).toBe(false)
    })
  })

  describe('migrateBloodSugarData', () => {
    it('should migrate old format to new format', () => {
      const oldData = [
        { date: '2026-02-15', value: 120 },
        { date: '2026-02-14', value: 110 },
      ]
      localStorage.setItem('bloodSugarData', JSON.stringify(oldData))

      migrateBloodSugarData()

      const migrated = JSON.parse(localStorage.getItem('bloodSugarData')!)

      expect(migrated).toHaveLength(2)
      expect(migrated[0]).toHaveProperty('id')
      expect(migrated[0]).toHaveProperty('createdAt')
      expect(migrated[0].date).toBe('2026-02-15')
      expect(migrated[0].value).toBe(120)
    })

    it('should not modify already migrated data', () => {
      const newData = [
        { id: 'existing-id', date: '2026-02-15', value: 120, createdAt: 12345 },
      ]
      localStorage.setItem('bloodSugarData', JSON.stringify(newData))

      migrateBloodSugarData()

      const result = JSON.parse(localStorage.getItem('bloodSugarData')!)
      expect(result[0].id).toBe('existing-id')
      expect(result[0].createdAt).toBe(12345)
    })

    it('should handle empty data', () => {
      localStorage.setItem('bloodSugarData', '[]')

      migrateBloodSugarData()

      const result = JSON.parse(localStorage.getItem('bloodSugarData')!)
      expect(result).toEqual([])
    })

    it('should create backup of old data', () => {
      const oldData = [
        { date: '2026-02-15', value: 120 },
      ]
      localStorage.setItem('bloodSugarData', JSON.stringify(oldData))

      migrateBloodSugarData()

      const backup = localStorage.getItem('bloodSugarData_backup_v1')
      expect(backup).toBeTruthy()
      expect(JSON.parse(backup!)).toEqual(oldData)
    })
  })
})
