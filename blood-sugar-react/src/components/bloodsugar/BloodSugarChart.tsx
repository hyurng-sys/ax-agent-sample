import { useBloodSugarStore } from '../../store/bloodSugarStore'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { formatDate } from '../../utils/dateFormatter'
import { getBloodSugarLevel } from '../../utils/statsCalculator'
import styles from './BloodSugarChart.module.css'

// Custom Tooltip
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const value = payload[0].value
    const level = getBloodSugarLevel(value)
    const colors = {
      low: '#3b82f6',
      normal: '#E6007E',
      high: '#ef4444',
    }

    return (
      <div className={styles.customTooltip}>
        <p className={styles.tooltipDate}>{payload[0].payload.date}</p>
        <p className={styles.tooltipValue} style={{ color: colors[level] }}>
          <span className={styles.tooltipLabel}>혈당:</span>
          <strong>{value} mg/dL</strong>
        </p>
        <p className={styles.tooltipStatus} style={{ color: colors[level] }}>
          {level === 'low' && '🔵 낮음'}
          {level === 'normal' && '🟢 정상'}
          {level === 'high' && '🔴 높음'}
        </p>
      </div>
    )
  }
  return null
}

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
      <h3>📊 혈당 추이</h3>
      <ResponsiveContainer width="100%" height={350}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorBloodSugar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#E6007E" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#E6007E" stopOpacity={0.05}/>
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />

          <XAxis
            dataKey="date"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            tick={{ fill: '#6b7280' }}
          />

          <YAxis
            domain={[60, 200]}
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            tick={{ fill: '#6b7280' }}
            label={{ value: 'mg/dL', angle: -90, position: 'insideLeft', fill: '#6b7280' }}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* Normal range zone */}
          <ReferenceLine
            y={100}
            stroke="#3b82f6"
            strokeDasharray="5 5"
            strokeWidth={1.5}
            label={{ value: '하한선', position: 'right', fill: '#3b82f6', fontSize: 11 }}
          />
          <ReferenceLine
            y={140}
            stroke="#ef4444"
            strokeDasharray="5 5"
            strokeWidth={1.5}
            label={{ value: '상한선', position: 'right', fill: '#ef4444', fontSize: 11 }}
          />

          {/* Area chart */}
          <Area
            type="monotone"
            dataKey="혈당"
            stroke="#E6007E"
            strokeWidth={3}
            fill="url(#colorBloodSugar)"
            dot={{ fill: '#E6007E', strokeWidth: 2, r: 5, stroke: '#fff' }}
            activeDot={{ r: 7, stroke: '#E6007E', strokeWidth: 3, fill: '#fff' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
