import { v4 as uuidv4 } from 'uuid'
import { StorageService } from './storageService'
import type { BloodSugarRecord } from '../types/bloodSugar'

const STORAGE_KEY = 'bloodSugarData'

export class BloodSugarService {
  static getAllRecords(): BloodSugarRecord[] {
    return StorageService.load<BloodSugarRecord[]>(STORAGE_KEY) || []
  }

  static addRecord(date: string, value: number): BloodSugarRecord {
    const records = this.getAllRecords()

    // 같은 날짜가 있으면 업데이트
    const existingIndex = records.findIndex(r => r.date === date)

    if (existingIndex >= 0) {
      records[existingIndex].value = value
      records[existingIndex].createdAt = Date.now()
      this.saveRecords(records)
      return records[existingIndex]
    }

    // 새 기록 추가
    const newRecord: BloodSugarRecord = {
      id: uuidv4(),
      date,
      value,
      createdAt: Date.now(),
    }

    records.push(newRecord)
    this.sortRecords(records)
    this.saveRecords(records)

    return newRecord
  }

  static deleteRecord(id: string): void {
    const records = this.getAllRecords()
    const filtered = records.filter(r => r.id !== id)
    this.saveRecords(filtered)
  }

  private static sortRecords(records: BloodSugarRecord[]): void {
    records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  private static saveRecords(records: BloodSugarRecord[]): void {
    StorageService.save(STORAGE_KEY, records)
  }
}
