import { useBloodSugarStore } from '../../store/bloodSugarStore'
import { generateHealthAdvice } from '../../services/healthAdviceService'
import styles from './HealthAdvice.module.css'

export function HealthAdvice() {
  const stats = useBloodSugarStore(state => state.stats)
  const filteredRecords = useBloodSugarStore(state => state.filteredRecords)

  const advice = generateHealthAdvice(stats, filteredRecords)

  const getStatusClass = () => {
    switch (advice.status) {
      case 'excellent':
        return styles.excellent
      case 'good':
        return styles.good
      case 'warning':
        return styles.warning
      case 'danger':
        return styles.danger
      default:
        return ''
    }
  }

  const getStatusLabel = () => {
    switch (advice.status) {
      case 'excellent':
        return '우수'
      case 'good':
        return '양호'
      case 'warning':
        return '주의'
      case 'danger':
        return '위험'
      default:
        return '-'
    }
  }

  return (
    <div className={styles.healthAdvice}>
      <div className={styles.adviceHeader}>
        <span className={styles.adviceIcon}>💡</span>
        <h3>건강 평가 및 조언</h3>
      </div>

      <div className={styles.adviceContent}>
        <div className={styles.adviceStatus}>
          <span className={`${styles.statusBadge} ${getStatusClass()}`}>
            {getStatusLabel()}
          </span>
          <p className={styles.statusText}>{advice.message}</p>
        </div>

        {advice.tips.length > 0 && (
          <div className={styles.adviceTips}>
            {advice.tips.map((tip, index) => (
              <div
                key={index}
                className={`${styles.adviceTip} ${
                  tip.type === 'warning' || tip.type === 'danger'
                    ? styles[tip.type]
                    : ''
                }`}
              >
                <span className={styles.tipIcon}>{tip.icon}</span>
                <p className={styles.tipText}>{tip.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
