import '@testing-library/jest-dom'

// Mock localStorage for tests
class LocalStorageMock implements Storage {
  private store: Record<string, string> = {}

  clear(): void {
    this.store = {}
  }

  getItem(key: string): string | null {
    return this.store[key] || null
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value)
  }

  removeItem(key: string): void {
    delete this.store[key]
  }

  get length(): number {
    return Object.keys(this.store).length
  }

  key(index: number): string | null {
    const keys = Object.keys(this.store)
    return keys[index] || null
  }
}

// Ensure the prototype is set up correctly for spying
Object.setPrototypeOf(LocalStorageMock.prototype, Storage.prototype)
;(globalThis as any).localStorage = new LocalStorageMock()

// Mock ResizeObserver for Recharts
;(globalThis as any).ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
