import type { Stats, BloodSugarRecord, HealthAdvice, AdviceStatus, AdviceTip } from '../types/bloodSugar'

export function generateHealthAdvice(stats: Stats, records: BloodSugarRecord[]): HealthAdvice {
  // Handle empty data
  if (stats.count === 0) {
    return {
      status: 'excellent',
      message: '데이터를 입력하면 건강 평가가 표시됩니다.',
      tips: [],
    }
  }

  const { avg } = stats
  let status: AdviceStatus
  let message: string
  const tips: AdviceTip[] = []

  // Calculate percentages
  const highPercent = Math.round((records.filter(r => r.value > 140).length / records.length) * 100)
  const lowPercent = Math.round((records.filter(r => r.value < 100).length / records.length) * 100)
  const normalPercent = Math.round((records.filter(r => r.value >= 100 && r.value <= 140).length / records.length) * 100)

  // Determine status based on average
  if (avg <= 120) {
    status = 'excellent'
    message = `평균 혈당이 ${avg} mg/dL로 매우 좋습니다!`
    tips.push({
      icon: '✨',
      text: '현재 상태가 매우 좋습니다. 지금처럼 꾸준히 관리하세요.',
      type: 'normal',
    })
  } else if (avg > 120 && avg <= 140) {
    status = 'good'
    message = `평균 혈당이 ${avg} mg/dL로 정상 범위입니다. 잘하고 계십니다!`
    tips.push({
      icon: '💪',
      text: '혈당이 정상 범위에 있지만, 120 이하로 낮추면 더 좋습니다.',
      type: 'normal',
    })
  } else if (avg > 140 && avg <= 180) {
    status = 'warning'
    message = `평균 혈당이 ${avg} mg/dL로 정상 범위를 초과합니다. 관리가 필요합니다.`
    tips.push({
      icon: '⚠️',
      text: '식사량을 조절하고 당분 섭취를 줄이는 것이 좋습니다.',
      type: 'warning',
    })
  } else {
    status = 'danger'
    message = `평균 혈당이 ${avg} mg/dL로 매우 높습니다. 즉시 관리가 필요합니다!`
    tips.push({
      icon: '🚨',
      text: '의사와 상담하여 식단 및 약물 조절이 필요할 수 있습니다.',
      type: 'danger',
    })
  }

  // High percentage advice
  if (highPercent > 50) {
    tips.push({
      icon: '🍽️',
      text: `전체의 ${highPercent}%가 140 이상입니다. 저녁 식사량을 20% 정도 줄여보세요.`,
      type: 'warning',
    })
    tips.push({
      icon: '🚶',
      text: '식후 20-30분 가볍게 산책하면 혈당 조절에 도움이 됩니다.',
      type: 'normal',
    })
  } else if (highPercent > 20) {
    tips.push({
      icon: '🥗',
      text: `${highPercent}%의 기록이 높습니다. 탄수화물 섭취를 조절해보세요.`,
      type: 'normal',
    })
  }

  // Low percentage advice
  if (lowPercent > 20) {
    tips.push({
      icon: '🍎',
      text: `${lowPercent}%의 기록이 100 미만입니다. 식사량이 너무 적지 않은지 확인하세요.`,
      type: 'warning',
    })
  }

  // Variability check
  const range = stats.max - stats.min
  if (range > 50) {
    tips.push({
      icon: '📊',
      text: `혈당 변동폭이 ${range} mg/dL로 큽니다. 매일 비슷한 양의 식사를 하면 안정화에 도움이 됩니다.`,
      type: 'normal',
    })
  }

  // Encouragement for good management
  if (normalPercent >= 70) {
    tips.push({
      icon: '🎯',
      text: `전체의 ${normalPercent}%가 정상 범위입니다. 훌륭한 관리입니다!`,
      type: 'normal',
    })
  }

  // Default tip if not enough tips
  if (tips.length < 3) {
    tips.push({
      icon: '💧',
      text: '충분한 수분 섭취는 혈당 관리에 도움이 됩니다.',
      type: 'normal',
    })
  }

  return { status, message, tips }
}
