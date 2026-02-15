import { useBloodSugarStore } from '../../store/bloodSugarStore'
import { getBloodSugarLevel } from '../../utils/statsCalculator'
import { formatDate } from '../../utils/dateFormatter'
import styles from './RecordsList.module.css'

export function RecordsList() {
  const filteredRecords = useBloodSugarStore(state => state.filteredRecords)
  const deleteRecord = useBloodSugarStore(state => state.deleteRecord)

  const handleDelete = (id: string) => {
    if (window.confirm('이 기록을 삭제하시겠습니까?')) {
      deleteRecord(id)
    }
  }

  if (filteredRecords.length === 0) {
    return (
      <div className={styles.recordsContainer}>
        <h3>기록 내역</h3>
        <div className={styles.recordsList}>
          <p className={styles.emptyMessage}>이 기간에는 기록이 없습니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.recordsContainer}>
      <h3>기록 내역</h3>
      <div className={styles.recordsList}>
        {filteredRecords.map((record) => {
          const level = getBloodSugarLevel(record.value)
          return (
            <div key={record.id} className={styles.recordItem}>
              <span className={styles.recordDate}>{formatDate(record.date)}</span>
              <span className={`${styles.recordValue} ${styles[level]}`}>
                {record.value} mg/dL
              </span>
              <button
                className={styles.recordDelete}
                onClick={() => handleDelete(record.id)}
              >
                삭제
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
