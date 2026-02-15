export class StorageService {
  static save<T>(key: string, data: T): boolean {
    try {
      const serialized = JSON.stringify(data)
      localStorage.setItem(key, serialized)
      return true
    } catch (error) {
      if (
        error instanceof DOMException &&
        (error.name === 'QuotaExceededError' || error.message.includes('QuotaExceededError'))
      ) {
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
