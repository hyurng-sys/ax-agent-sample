import { useBloodSugarStore } from '../../store/bloodSugarStore'
import styles from './StatsSummary.module.css'

export function StatsSummary() {
  const stats = useBloodSugarStore(state => state.stats)

  const formatValue = (value: number, count: number): string => {
    if (count === 0) return '-'
    return `${value} mg/dL`
  }

  return (
    <div className={styles.statsSummary}>
      <div className={styles.statCard}>
        <div className={styles.statLabel}>평균</div>
        <div className={styles.statValue}>
          {formatValue(stats.avg, stats.count)}
        </div>
      </div>
      <div className={styles.statCard}>
        <div className={styles.statLabel}>최고</div>
        <div className={styles.statValue}>
          {formatValue(stats.max, stats.count)}
        </div>
      </div>
      <div className={styles.statCard}>
        <div className={styles.statLabel}>최저</div>
        <div className={styles.statValue}>
          {formatValue(stats.min, stats.count)}
        </div>
      </div>
    </div>
  )
}
