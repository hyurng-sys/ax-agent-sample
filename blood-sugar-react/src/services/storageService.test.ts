import { describe, it, expect, beforeEach, vi } from 'vitest'
import { StorageService } from './storageService'

describe('StorageService', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('save and load', () => {
    it('should save and load data from localStorage', () => {
      const testData = { test: 'data' }
      StorageService.save('test-key', testData)
      const loaded = StorageService.load('test-key')
      expect(loaded).toEqual(testData)
    })

    it('should return null for non-existent key', () => {
      const loaded = StorageService.load('non-existent')
      expect(loaded).toBeNull()
    })
  })

  describe('error handling', () => {
    it('should handle quota exceeded error gracefully', () => {
      const mockSetItem = vi.spyOn(localStorage, 'setItem')
      mockSetItem.mockImplementation(() => {
        throw new DOMException('QuotaExceededError')
      })

      const result = StorageService.save('test', { large: 'data' })
      expect(result).toBe(false)

      mockSetItem.mockRestore()
    })

    it('should handle corrupted data', () => {
      localStorage.setItem('test-key', 'invalid json')
      const loaded = StorageService.load('test-key')
      expect(loaded).toBeNull()
    })
  })
})
