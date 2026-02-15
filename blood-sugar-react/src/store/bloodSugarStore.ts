import { create } from 'zustand'
import { BloodSugarService } from '../services/bloodSugarService'
import { calculateStats, filterRecordsByPeriod } from '../utils/statsCalculator'
import type { BloodSugarRecord, Stats, Period } from '../types/bloodSugar'

interface BloodSugarState {
  // State
  records: BloodSugarRecord[]
  period: Period

  // Computed values
  filteredRecords: BloodSugarRecord[]
  stats: Stats

  // Actions
  loadRecords: () => void
  addRecord: (date: string, value: number) => void
  deleteRecord: (id: string) => void
  setPeriod: (period: Period) => void
}

export const useBloodSugarStore = create<BloodSugarState>((set, get) => ({
  records: [],
  period: 'daily',
  filteredRecords: [],
  stats: { avg: 0, max: 0, min: 0, count: 0 },

  loadRecords: () => {
    const records = BloodSugarService.getAllRecords()
    const { period } = get()
    const filteredRecords = filterRecordsByPeriod(records, period)
    const stats = calculateStats(filteredRecords)
    set({ records, filteredRecords, stats })
  },

  addRecord: (date: string, value: number) => {
    BloodSugarService.addRecord(date, value)
    get().loadRecords()
  },

  deleteRecord: (id: string) => {
    BloodSugarService.deleteRecord(id)
    get().loadRecords()
  },

  setPeriod: (period: Period) => {
    const { records } = get()
    const filteredRecords = filterRecordsByPeriod(records, period)
    const stats = calculateStats(filteredRecords)
    set({ period, filteredRecords, stats })
  },
}))
