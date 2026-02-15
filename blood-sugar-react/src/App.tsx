import { useEffect } from 'react'
import { useBloodSugarStore } from './store/bloodSugarStore'
import { BloodSugarInput } from './components/bloodsugar/BloodSugarInput'
import { ViewTabs } from './components/bloodsugar/ViewTabs'
import { StatsSummary } from './components/bloodsugar/StatsSummary'
import { HealthAdvice } from './components/bloodsugar/HealthAdvice'
import { BloodSugarChart } from './components/bloodsugar/BloodSugarChart'
import { RecordsList } from './components/bloodsugar/RecordsList'
import './App.css'

function App() {
  const loadRecords = useBloodSugarStore(state => state.loadRecords)

  useEffect(() => {
    loadRecords()
  }, [loadRecords])

  return (
    <div className="container">
      <header>
        <h1>안형균 건강앱</h1>
        <p className="subtitle">저녁 식후 2시간 혈당 관리</p>
      </header>

      <main>
        <BloodSugarInput />

        <section className="view-section">
          <ViewTabs />
          <StatsSummary />
          <HealthAdvice />
          <BloodSugarChart />
          <RecordsList />
        </section>
      </main>
    </div>
  )
}

export default App
