# React 혈당 관리 앱 리팩토링 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Vanilla JavaScript 혈당 관리 앱을 React + TypeScript로 완전히 재작성하여 확장 가능한 구조 구축

**Architecture:** Vite + React 18 + TypeScript 기반, Zustand 상태 관리, 컴포넌트 기반 아키텍처, TDD 적용

**Tech Stack:** React 18, TypeScript, Vite, Zustand, Recharts, Vitest, React Testing Library

---

## Task 1: Vite + React + TypeScript 프로젝트 초기 설정

**Files:**
- Create: `blood-sugar-react/` (new project directory)
- Create: `blood-sugar-react/package.json`
- Create: `blood-sugar-react/tsconfig.json`
- Create: `blood-sugar-react/vite.config.ts`

**Step 1: Vite React TypeScript 프로젝트 생성**

```bash
cd "/Users/metaverse/Desktop/Test 1"
npm create vite@latest blood-sugar-react -- --template react-ts
cd blood-sugar-react
```

Expected: Vite 프로젝트 생성 완료

**Step 2: 필요한 의존성 설치**

```bash
npm install
npm install zustand recharts
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

Expected: 모든 패키지 설치 완료

**Step 3: Vitest 설정 파일 생성**

Create: `blood-sugar-react/vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
```

**Step 4: 테스트 설정 파일 생성**

Create: `blood-sugar-react/src/test/setup.ts`

```typescript
import '@testing-library/jest-dom'
```

**Step 5: package.json에 테스트 스크립트 추가**

Modify: `blood-sugar-react/package.json`

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui"
  }
}
```

**Step 6: 기본 디렉토리 구조 생성**

```bash
cd blood-sugar-react/src
mkdir -p components/{common,bloodsugar,layout}
mkdir -p stores services hooks types utils test
```

Expected: 디렉토리 구조 생성 완료

**Step 7: Git 초기화 및 커밋**

```bash
cd "/Users/metaverse/Desktop/Test 1/blood-sugar-react"
git init
git add .
git commit -m "feat: initial Vite + React + TypeScript setup

- Vite project with React 18 and TypeScript
- Zustand, Recharts dependencies
- Vitest + React Testing Library setup
- Project directory structure

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: TypeScript 타입 정의 작성

**Files:**
- Create: `blood-sugar-react/src/types/bloodSugar.ts`
- Test: `blood-sugar-react/src/types/bloodSugar.test.ts`

**Step 1: 혈당 기록 타입 정의 작성**

Create: `blood-sugar-react/src/types/bloodSugar.ts`

```typescript
export interface BloodSugarRecord {
  id: string;
  date: string; // YYYY-MM-DD
  value: number; // mg/dL
  createdAt: number; // timestamp
}

export interface Stats {
  avg: number;
  max: number;
  min: number;
  count: number;
}

export type BloodSugarLevel = 'low' | 'normal' | 'high';

export type AdviceStatus = 'excellent' | 'good' | 'warning' | 'danger';
export type AdviceTipType = 'normal' | 'warning' | 'danger';

export interface AdviceTip {
  icon: string;
  text: string;
  type: AdviceTipType;
}

export interface HealthAdvice {
  status: AdviceStatus;
  message: string;
  tips: AdviceTip[];
}

export type Period = 'daily' | 'weekly' | 'monthly';

// 향후 확장을 위한 타입
export type HealthMetricType = 'bloodsugar' | 'bloodpressure' | 'weight' | 'exercise';

export interface HealthMetric {
  type: HealthMetricType;
  // 추후 확장
}
```

**Step 2: 타입 검증 테스트 작성**

Create: `blood-sugar-react/src/types/bloodSugar.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import type { BloodSugarRecord, Stats, HealthAdvice } from './bloodSugar'

describe('BloodSugar Types', () => {
  it('should create valid BloodSugarRecord', () => {
    const record: BloodSugarRecord = {
      id: '123',
      date: '2026-02-15',
      value: 120,
      createdAt: Date.now(),
    }
    expect(record.value).toBe(120)
  })

  it('should create valid Stats', () => {
    const stats: Stats = {
      avg: 115,
      max: 140,
      min: 95,
      count: 7,
    }
    expect(stats.avg).toBe(115)
  })
})
```

**Step 3: 테스트 실행**

```bash
npm test
```

Expected: All tests pass

**Step 4: 커밋**

```bash
git add src/types/
git commit -m "feat: add TypeScript type definitions for blood sugar app

- BloodSugarRecord, Stats, HealthAdvice types
- Future-proof with HealthMetric type
- Type validation tests

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: localStorage 서비스 레이어 구현 (TDD)

**Files:**
- Create: `blood-sugar-react/src/services/storageService.ts`
- Test: `blood-sugar-react/src/services/storageService.test.ts`

**Step 1: storageService 테스트 작성 (RED)**

Create: `blood-sugar-react/src/services/storageService.test.ts`

```typescript
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
      const mockSetItem = vi.spyOn(Storage.prototype, 'setItem')
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
```

**Step 2: 테스트 실행하여 실패 확인 (RED)**

```bash
npm test storageService
```

Expected: FAIL - StorageService is not defined

**Step 3: storageService 구현 (GREEN)**

Create: `blood-sugar-react/src/services/storageService.ts`

```typescript
export class StorageService {
  static save<T>(key: string, data: T): boolean {
    try {
      const serialized = JSON.stringify(data)
      localStorage.setItem(key, serialized)
      return true
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.error('localStorage quota exceeded')
        // 향후: 오래된 데이터 정리 로직 추가
      }
      return false
    }
  }

  static load<T>(key: string): T | null {
    try {
      const serialized = localStorage.getItem(key)
      if (serialized === null) {
        return null
      }
      return JSON.parse(serialized) as T
    } catch (error) {
      console.error('Failed to parse localStorage data:', error)
      // 손상된 데이터 제거
      localStorage.removeItem(key)
      return null
    }
  }

  static remove(key: string): void {
    localStorage.removeItem(key)
  }

  static clear(): void {
    localStorage.clear()
  }
}
```

**Step 4: 테스트 실행하여 통과 확인 (GREEN)**

```bash
npm test storageService
```

Expected: All tests pass

**Step 5: 커밋**

```bash
git add src/services/storageService.*
git commit -m "feat: implement localStorage service with error handling

- Save/load with JSON serialization
- Quota exceeded error handling
- Corrupted data recovery
- Full test coverage

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: 혈당 데이터 서비스 구현 (TDD)

**Files:**
- Create: `blood-sugar-react/src/services/bloodSugarService.ts`
- Test: `blood-sugar-react/src/services/bloodSugarService.test.ts`

**Step 1: bloodSugarService 테스트 작성 (RED)**

Create: `blood-sugar-react/src/services/bloodSugarService.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { BloodSugarService } from './bloodSugarService'
import type { BloodSugarRecord } from '../types/bloodSugar'

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
      const updated = BloodSugarService.addRecord('2026-02-15', 130)

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
```

**Step 2: 테스트 실행하여 실패 확인**

```bash
npm test bloodSugarService
```

Expected: FAIL - BloodSugarService is not defined

**Step 3: bloodSugarService 구현**

Create: `blood-sugar-react/src/services/bloodSugarService.ts`

```typescript
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
```

**Step 4: UUID 패키지 설치**

```bash
npm install uuid
npm install -D @types/uuid
```

**Step 5: 테스트 실행하여 통과 확인**

```bash
npm test bloodSugarService
```

Expected: All tests pass

**Step 6: 커밋**

```bash
git add src/services/bloodSugarService.* package.json package-lock.json
git commit -m "feat: implement blood sugar data service

- CRUD operations for blood sugar records
- Auto-update for same date
- Automatic sorting by date
- UUID-based record IDs
- Full test coverage

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: 통계 계산 유틸리티 구현 (TDD)

**Files:**
- Create: `blood-sugar-react/src/utils/statsCalculator.ts`
- Test: `blood-sugar-react/src/utils/statsCalculator.test.ts`

**Step 1: 통계 계산 테스트 작성**

Create: `blood-sugar-react/src/utils/statsCalculator.test.ts`

```typescript
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
```

**Step 2: 테스트 실행 (RED)**

```bash
npm test statsCalculator
```

Expected: FAIL

**Step 3: 통계 계산 구현 (GREEN)**

Create: `blood-sugar-react/src/utils/statsCalculator.ts`

```typescript
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
```

**Step 4: 테스트 실행 (GREEN)**

```bash
npm test statsCalculator
```

Expected: All tests pass

**Step 5: 커밋**

```bash
git add src/utils/statsCalculator.*
git commit -m "feat: implement statistics calculation utilities

- Calculate avg/max/min/count
- Blood sugar level classification
- Period-based filtering (daily/weekly/monthly)
- Full test coverage

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Zustand Store 구현

**Files:**
- Create: `blood-sugar-react/src/stores/bloodSugarStore.ts`
- Test: `blood-sugar-react/src/stores/bloodSugarStore.test.ts`

**Step 1: Store 테스트 작성**

Create: `blood-sugar-react/src/stores/bloodSugarStore.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { useBloodSugarStore } from './bloodSugarStore'
import { BloodSugarService } from '../services/bloodSugarService'

describe('bloodSugarStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useBloodSugarStore.getState().loadRecords()
  })

  it('should load records from service', () => {
    BloodSugarService.addRecord('2026-02-15', 120)

    const store = useBloodSugarStore.getState()
    store.loadRecords()

    expect(store.records).toHaveLength(1)
    expect(store.records[0].value).toBe(120)
  })

  it('should add record and persist', () => {
    const store = useBloodSugarStore.getState()
    store.addRecord('2026-02-15', 120)

    expect(store.records).toHaveLength(1)

    // Verify persistence
    const loaded = BloodSugarService.getAllRecords()
    expect(loaded).toHaveLength(1)
  })

  it('should delete record', () => {
    const store = useBloodSugarStore.getState()
    store.addRecord('2026-02-15', 120)
    const id = store.records[0].id

    store.deleteRecord(id)
    expect(store.records).toHaveLength(0)
  })

  it('should change period', () => {
    const store = useBloodSugarStore.getState()
    expect(store.currentPeriod).toBe('daily')

    store.setPeriod('weekly')
    expect(store.currentPeriod).toBe('weekly')
  })
})
```

**Step 2: 테스트 실행 (RED)**

```bash
npm test bloodSugarStore
```

Expected: FAIL

**Step 3: Zustand Store 구현 (GREEN)**

Create: `blood-sugar-react/src/stores/bloodSugarStore.ts`

```typescript
import { create } from 'zustand'
import { BloodSugarService } from '../services/bloodSugarService'
import { calculateStats, filterRecordsByPeriod } from '../utils/statsCalculator'
import type { BloodSugarRecord, Period, Stats } from '../types/bloodSugar'

interface BloodSugarStore {
  records: BloodSugarRecord[]
  currentPeriod: Period

  // Actions
  loadRecords: () => void
  addRecord: (date: string, value: number) => void
  deleteRecord: (id: string) => void
  setPeriod: (period: Period) => void

  // Computed
  getFilteredRecords: () => BloodSugarRecord[]
  getStats: () => Stats
}

export const useBloodSugarStore = create<BloodSugarStore>((set, get) => ({
  records: [],
  currentPeriod: 'daily',

  loadRecords: () => {
    const records = BloodSugarService.getAllRecords()
    set({ records })
  },

  addRecord: (date, value) => {
    const record = BloodSugarService.addRecord(date, value)
    const records = BloodSugarService.getAllRecords()
    set({ records })
  },

  deleteRecord: (id) => {
    BloodSugarService.deleteRecord(id)
    const records = BloodSugarService.getAllRecords()
    set({ records })
  },

  setPeriod: (period) => {
    set({ currentPeriod: period })
  },

  getFilteredRecords: () => {
    const { records, currentPeriod } = get()
    return filterRecordsByPeriod(records, currentPeriod)
  },

  getStats: () => {
    const filtered = get().getFilteredRecords()
    return calculateStats(filtered)
  },
}))
```

**Step 4: 테스트 실행 (GREEN)**

```bash
npm test bloodSugarStore
```

Expected: All tests pass

**Step 5: 커밋**

```bash
git add src/stores/
git commit -m "feat: implement Zustand store for blood sugar data

- Records state management
- Period filtering
- Computed stats
- Full test coverage

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 7: BloodSugarInput 컴포넌트 구현 (TDD)

**Files:**
- Create: `blood-sugar-react/src/components/bloodsugar/BloodSugarInput.tsx`
- Create: `blood-sugar-react/src/components/bloodsugar/BloodSugarInput.module.css`
- Test: `blood-sugar-react/src/components/bloodsugar/BloodSugarInput.test.tsx`

**Step 1: 컴포넌트 테스트 작성**

Create: `blood-sugar-react/src/components/bloodsugar/BloodSugarInput.test.tsx`

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BloodSugarInput } from './BloodSugarInput'
import { useBloodSugarStore } from '../../stores/bloodSugarStore'

describe('BloodSugarInput', () => {
  beforeEach(() => {
    localStorage.clear()
    useBloodSugarStore.getState().loadRecords()
  })

  it('should render input fields', () => {
    render(<BloodSugarInput />)

    expect(screen.getByLabelText(/날짜/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/혈당/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /기록 추가/i })).toBeInTheDocument()
  })

  it('should add record when form is submitted', async () => {
    const user = userEvent.setup()
    render(<BloodSugarInput />)

    const dateInput = screen.getByLabelText(/날짜/i)
    const valueInput = screen.getByLabelText(/혈당/i)
    const submitButton = screen.getByRole('button', { name: /기록 추가/i })

    await user.type(dateInput, '2026-02-15')
    await user.type(valueInput, '120')
    await user.click(submitButton)

    const store = useBloodSugarStore.getState()
    expect(store.records).toHaveLength(1)
    expect(store.records[0].value).toBe(120)
  })

  it('should clear value input after submission', async () => {
    const user = userEvent.setup()
    render(<BloodSugarInput />)

    const valueInput = screen.getByLabelText(/혈당/i) as HTMLInputElement
    const submitButton = screen.getByRole('button', { name: /기록 추가/i })

    await user.type(valueInput, '120')
    await user.click(submitButton)

    expect(valueInput.value).toBe('')
  })
})
```

**Step 2: 테스트 실행 (RED)**

```bash
npm test BloodSugarInput
```

Expected: FAIL

**Step 3: 컴포넌트 구현 (GREEN)**

Create: `blood-sugar-react/src/components/bloodsugar/BloodSugarInput.tsx`

```typescript
import { useState, useEffect } from 'react'
import { useBloodSugarStore } from '../../stores/bloodSugarStore'
import styles from './BloodSugarInput.module.css'

export function BloodSugarInput() {
  const [date, setDate] = useState('')
  const [value, setValue] = useState('')
  const addRecord = useBloodSugarStore(state => state.addRecord)

  useEffect(() => {
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0]
    setDate(today)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const bloodSugar = parseInt(value)
    if (!date || !bloodSugar || bloodSugar <= 0) {
      alert('날짜와 혈당 수치를 올바르게 입력해주세요.')
      return
    }

    addRecord(date, bloodSugar)
    setValue('') // Clear value input
  }

  return (
    <section className={styles.inputSection}>
      <h2>오늘의 혈당 입력</h2>
      <form onSubmit={handleSubmit} className={styles.inputGroup}>
        <div className={styles.inputField}>
          <label htmlFor="date">날짜</label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div className={styles.inputField}>
          <label htmlFor="bloodSugar">혈당 (mg/dL)</label>
          <input
            type="number"
            id="bloodSugar"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="예: 120"
            min="0"
            max="600"
            required
          />
        </div>
        <button type="submit" className={styles.btnPrimary}>
          기록 추가
        </button>
      </form>
    </section>
  )
}
```

**Step 4: CSS 모듈 생성**

Create: `blood-sugar-react/src/components/bloodsugar/BloodSugarInput.module.css`

```css
.inputSection {
  margin-bottom: 2rem;
}

.inputSection h2 {
  margin-bottom: 1rem;
  font-size: 1.25rem;
}

.inputGroup {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
}

.inputField {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.inputField label {
  font-weight: 500;
  font-size: 0.9rem;
}

.inputField input {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.btnPrimary {
  padding: 0.5rem 1.5rem;
  background-color: #03C75A;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btnPrimary:hover {
  background-color: #02a849;
}
```

**Step 5: 테스트 실행 (GREEN)**

```bash
npm test BloodSugarInput
```

Expected: All tests pass

**Step 6: 커밋**

```bash
git add src/components/bloodsugar/
git commit -m "feat: implement BloodSugarInput component

- Date and value input fields
- Form submission with validation
- Auto-clear after submission
- CSS modules for styling
- Full component tests

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 8: RecordsList 컴포넌트 구현

**Files:**
- Create: `blood-sugar-react/src/components/bloodsugar/RecordsList.tsx`
- Create: `blood-sugar-react/src/components/bloodsugar/RecordsList.module.css`
- Test: `blood-sugar-react/src/components/bloodsugar/RecordsList.test.tsx`

**(계속...)**

---

## 참고사항

이 계획은 총 20개 이상의 Task로 구성되며, 각 Task는 TDD 원칙을 따라 다음 패턴을 따릅니다:

1. **RED**: 테스트 먼저 작성
2. **GREEN**: 최소 구현으로 테스트 통과
3. **REFACTOR**: 필요시 리팩토링
4. **COMMIT**: 작은 단위로 자주 커밋

**나머지 Task 목록**:
- Task 8: RecordsList 컴포넌트
- Task 9: StatsSummary 컴포넌트
- Task 10: ViewTabs 컴포넌트
- Task 11: HealthAdvice 서비스 로직
- Task 12: HealthAdvice 컴포넌트
- Task 13: BloodSugarChart (Recharts)
- Task 14: App 레이아웃 통합
- Task 15: 기존 CSS 마이그레이션
- Task 16: 데이터 마이그레이션 스크립트
- Task 17: E2E 테스트
- Task 18: Vercel 배포 설정
- Task 19: PWA 설정
- Task 20: 최종 검증 및 문서화

**예상 완료 시간**: 8-12일
