import { useBloodSugarStore } from '../../store/bloodSugarStore'
import type { Period } from '../../types/bloodSugar'
import styles from './ViewTabs.module.css'

const tabs: { label: string; value: Period }[] = [
  { label: '일간', value: 'daily' },
  { label: '주간', value: 'weekly' },
  { label: '월간', value: 'monthly' },
]

export function ViewTabs() {
  const period = useBloodSugarStore(state => state.period)
  const setPeriod = useBloodSugarStore(state => state.setPeriod)

  return (
    <div className={styles.tabs}>
      {tabs.map(tab => (
        <button
          key={tab.value}
          className={`${styles.tab} ${period === tab.value ? styles.active : ''}`}
          onClick={() => setPeriod(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
