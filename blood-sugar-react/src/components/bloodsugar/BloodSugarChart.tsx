import { useBloodSugarStore } from '../../store/bloodSugarStore'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'
import { formatDate } from '../../utils/dateFormatter'
import styles from './BloodSugarChart.module.css'

export function BloodSugarChart() {
  const filteredRecords = useBloodSugarStore(state => state.filteredRecords)

  if (filteredRecords.length === 0) {
    return (
      <div className={styles.chartContainer}>
        <p className={styles.emptyMessage}>
          아직 기록이 없습니다. 혈당을 기록하면 차트가 표시됩니다.
        </p>
      </div>
    )
  }

  // Prepare data for chart (reverse to show oldest first)
  const chartData = [...filteredRecords].reverse().map(record => ({
    date: formatDate(record.date),
    혈당: record.value,
  }))

  return (
    <div className={styles.chartContainer}>
      <h3>혈당 추이</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis domain={[60, 200]} />
          <Tooltip />
          <Legend />

          {/* Reference lines */}
          <ReferenceLine y={100} stroke="#666" strokeDasharray="3 3" label="하한선 (100)" />
          <ReferenceLine y={140} stroke="#666" strokeDasharray="3 3" label="상한선 (140)" />

          {/* Blood sugar line */}
          <Line
            type="monotone"
            dataKey="혈당"
            stroke="#03C75A"
            strokeWidth={2}
            dot={{ fill: '#03C75A', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
