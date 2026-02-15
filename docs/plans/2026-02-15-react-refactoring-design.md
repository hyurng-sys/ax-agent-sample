# React 기반 혈당 관리 앱 리팩토링 설계

**작성일**: 2026-02-15
**프로젝트**: AX Agent Sample (혈당 관리 앱)
**목표**: 기능 확장성을 위한 React + TypeScript 완전 재작성

---

## 1. 배경 및 목표

### 현재 상태
- Vanilla JavaScript 기반 (~1,000줄)
- localStorage 데이터 저장
- Canvas API 차트 렌더링
- Vercel 배포 완료

### 리팩토링 목표
1. **기능 확장성**: 다양한 건강 지표, 데이터 분석, 모바일 앱 전환 준비
2. **코드 품질**: TypeScript로 타입 안정성 확보
3. **유지보수성**: 컴포넌트 기반 구조로 재사용성 극대화
4. **향후 확장**: API 연동, PWA, 네이티브 앱 변환 대비

---

## 2. 기술 스택 및 아키텍처

### 핵심 기술
- **프론트엔드**: React 18 + TypeScript
- **빌드 도구**: Vite
- **상태 관리**: Zustand
- **스타일링**: CSS Modules + 기존 CSS 재사용
- **차트**: Recharts
- **데이터 저장**: localStorage (향후 API 준비)
- **테스트**: Vitest + React Testing Library

### 프로젝트 구조
```
src/
├── components/          # UI 컴포넌트
│   ├── common/         # 공통 컴포넌트
│   ├── bloodsugar/     # 혈당 관련 컴포넌트
│   └── layout/         # 레이아웃
├── stores/             # Zustand 상태 관리
├── services/           # 비즈니스 로직
├── hooks/              # 커스텀 훅
├── types/              # TypeScript 타입
├── utils/              # 유틸리티
└── App.tsx
```

---

## 3. 컴포넌트 구조

### 컴포넌트 계층
```
App
├── Header
├── BloodSugarInput
│   ├── DateInput
│   └── ValueInput
├── ViewTabs (일간/주간/월간)
├── StatsSummary
│   └── StatCard (평균/최고/최저)
├── HealthAdvice
│   ├── AdviceStatus
│   └── AdviceTips
├── BloodSugarChart (Recharts)
└── RecordsList
    └── RecordItem
```

### 데이터 모델

```typescript
interface BloodSugarRecord {
  id: string;
  date: string;
  value: number;
  createdAt: number;
}

interface Stats {
  avg: number;
  max: number;
  min: number;
  count: number;
}

interface HealthAdvice {
  status: 'excellent' | 'good' | 'warning' | 'danger';
  message: string;
  tips: AdviceTip[];
}

// 향후 확장
interface HealthMetric {
  type: 'bloodsugar' | 'bloodpressure' | 'weight' | 'exercise';
  // ...확장 가능
}
```

### 상태 관리 (Zustand)

```typescript
interface BloodSugarStore {
  records: BloodSugarRecord[];
  currentPeriod: 'daily' | 'weekly' | 'monthly';

  addRecord: (record: Omit<BloodSugarRecord, 'id' | 'createdAt'>) => void;
  deleteRecord: (id: string) => void;
  setPeriod: (period: 'daily' | 'weekly' | 'monthly') => void;

  getFilteredRecords: () => BloodSugarRecord[];
  getStats: () => Stats;
}
```

---

## 4. 마이그레이션 전략

### Phase 1: 프로젝트 초기 설정 (1일)
- Vite + React + TypeScript 프로젝트 생성
- 타입 정의 작성
- Zustand store 구조 설정

### Phase 2: 핵심 기능 구현 (3-4일)
1. 데이터 서비스 레이어
2. 상태 관리 store
3. 기본 레이아웃
4. 혈당 입력 폼
5. 기록 리스트

### Phase 3: 통계 및 시각화 (2-3일)
1. 통계 계산 로직
2. 통계 카드
3. Recharts 차트
4. 기간별 필터링

### Phase 4: 건강 조언 시스템 (1-2일)
1. 건강 조언 로직
2. HealthAdvice 컴포넌트
3. 알고리즘 이식

### Phase 5: 테스트 및 배포 (1-2일)
1. 단위 테스트
2. 컴포넌트 테스트
3. Vercel 배포 설정
4. 데이터 마이그레이션

**총 예상 기간**: 8-12일

---

## 5. 에러 처리 및 테스트

### 에러 처리
- localStorage quota 초과 시 자동 정리
- 입력 유효성 검사 (TypeScript + 런타임)
- React Error Boundary

### 테스트 전략 (TDD)
**단위 테스트**:
- services (CRUD, 건강 조언)
- utils (통계 계산)
- store actions

**컴포넌트 테스트**:
- BloodSugarInput
- RecordsList
- StatsSummary

**커버리지 목표**: 80% 이상

---

## 6. 배포 및 확장성

### Vercel 배포
- 빌드: `npm run build`
- 출력: `dist`
- 자동 배포: main 브랜치 푸시 시

### PWA 준비
- Vite PWA 플러그인
- Service Worker (오프라인 지원)
- App Manifest

### 향후 확장 준비
1. **다양한 건강 지표**: HealthMetric 타입으로 확장 가능
2. **API 연동**: services 레이어로 쉬운 전환
3. **모바일 앱**: React Native 또는 Capacitor 활용 가능

---

## 7. 기존 코드 활용

### 재사용 요소
- ✅ CSS 스타일 대부분
- ✅ 건강 조언 알고리즘 로직
- ✅ 차트 디자인 컨셉
- ✅ localStorage 키 호환성 (기존 데이터 보존)

---

## 8. 성공 기준

1. ✅ 모든 기존 기능 동작
2. ✅ 기존 사용자 데이터 호환
3. ✅ TypeScript strict mode 통과
4. ✅ 테스트 커버리지 80% 이상
5. ✅ Vercel 배포 성공
6. ✅ 향후 확장 가능한 구조 확보

---

## 다음 단계

설계 승인 후 `writing-plans` 스킬을 통해 상세 구현 계획 수립
