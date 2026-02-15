export interface BloodSugarRecord {
  id: string;
  date: string; // YYYY-MM-DD
  value: number; // mg/dL
  createdAt: number; // timestamp
}

export interface Stats {
  avg: number;
  max: number;
  min: number;
  count: number;
}

export type BloodSugarLevel = 'low' | 'normal' | 'high';

export type AdviceStatus = 'excellent' | 'good' | 'warning' | 'danger';
export type AdviceTipType = 'normal' | 'warning' | 'danger';

export interface AdviceTip {
  icon: string;
  text: string;
  type: AdviceTipType;
}

export interface HealthAdvice {
  status: AdviceStatus;
  message: string;
  tips: AdviceTip[];
}

export type Period = 'daily' | 'weekly' | 'monthly';

// 향후 확장을 위한 타입
export type HealthMetricType = 'bloodsugar' | 'bloodpressure' | 'weight' | 'exercise';

export interface HealthMetric {
  type: HealthMetricType;
  // 추후 확장
}
