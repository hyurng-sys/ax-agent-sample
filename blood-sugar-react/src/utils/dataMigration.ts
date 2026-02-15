import { v4 as uuidv4 } from 'uuid'
import type { BloodSugarRecord } from '../types/bloodSugar'

interface OldRecord {
  date: string
  value: number
}

const STORAGE_KEY = 'bloodSugarData'
const BACKUP_KEY = 'bloodSugarData_backup_v1'

/**
 * Check if migration is needed
 */
export function needsMigration(): boolean {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return false

    const records = JSON.parse(data)
    if (!Array.isArray(records) || records.length === 0) return false

    // Check if first record has old format (no id or createdAt)
    const first = records[0]
    return !first.id || !first.createdAt
  } catch {
    return false
  }
}

/**
 * Migrate old format data to new format
 */
export function migrateBloodSugarData(): void {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return

    const records = JSON.parse(data)
    if (!Array.isArray(records) || records.length === 0) return

    // Check if already migrated
    if (!needsMigration()) return

    // Create backup
    localStorage.setItem(BACKUP_KEY, data)

    // Migrate data
    const migratedRecords: BloodSugarRecord[] = records.map((record: OldRecord) => ({
      id: uuidv4(),
      date: record.date,
      value: record.value,
      createdAt: Date.now(),
    }))

    // Save migrated data
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migratedRecords))

    console.log(`✅ Migrated ${migratedRecords.length} blood sugar records`)
  } catch (error) {
    console.error('Failed to migrate blood sugar data:', error)
  }
}

/**
 * Auto-run migration on app startup
 */
export function autoMigrate(): void {
  if (needsMigration()) {
    console.log('🔄 Starting data migration...')
    migrateBloodSugarData()
  }
}
