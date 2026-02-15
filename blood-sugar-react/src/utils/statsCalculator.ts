import type { BloodSugarRecord, Stats, BloodSugarLevel, Period } from '../types/bloodSugar'

export function calculateStats(records: BloodSugarRecord[]): Stats {
  if (records.length === 0) {
    return { avg: 0, max: 0, min: 0, count: 0 }
  }

  const values = records.map(r => r.value)
  const sum = values.reduce((a, b) => a + b, 0)

  return {
    avg: Math.round(sum / values.length),
    max: Math.max(...values),
    min: Math.min(...values),
    count: records.length,
  }
}

export function getBloodSugarLevel(value: number): BloodSugarLevel {
  if (value < 100) return 'low'
  if (value > 140) return 'high'
  return 'normal'
}

export function filterRecordsByPeriod(
  records: BloodSugarRecord[],
  period: Period
): BloodSugarRecord[] {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const daysMap = {
    daily: 7,
    weekly: 30,
    monthly: 90,
  }

  const maxDays = daysMap[period]

  return records.filter(record => {
    const recordDate = new Date(record.date)
    const diffTime = today.getTime() - recordDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    return diffDays < maxDays
  })
}
