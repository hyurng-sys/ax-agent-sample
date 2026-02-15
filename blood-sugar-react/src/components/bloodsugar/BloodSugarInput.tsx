import { useState, useEffect } from 'react'
import { useBloodSugarStore } from '../../store/bloodSugarStore'
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
