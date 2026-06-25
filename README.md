# HisTour — Frontend

역사 현장에서 사진 한 장으로 AI 역사 해설을 받고, 여행 후 퀴즈로 기억을 남기는 역사 여행 기록 서비스

---

## 기술 스택

| 분류      | 기술                     |
| --------- | ------------------------ |
| Framework | Vue 3 (Composition API)  |
| Language  | TypeScript               |
| Build     | Vite                     |
| 상태 관리 | Pinia                    |
| 라우터    | Vue Router               |
| HTTP      | Axios                    |
| 지도      | Kakao Maps SDK (MarkerClusterer 포함) |
| 코드 품질 | ESLint, oxlint, Prettier |

---

## 프로젝트 구조

```
src/
├── api/
│   ├── apiClient.ts          # Axios 인스턴스 + JWT 인터셉터 (401 → refresh → retry)
│   ├── heritageApi.ts        # 문화재 상세 / 해설 / 심화 해설 / 지도 시야 조회
│   ├── tripApi.ts            # 여행 목록·생성·상세·완료·추천
│   ├── quizApi.ts            # 퀴즈 세션 생성·조회·답안 제출
│   └── reportApi.ts          # 여행 리포트 조회
├── assets/styles/
│   └── main.css              # CSS 변수 디자인 토큰 전체 (색상·폰트·간격·그림자)
├── components/
│   ├── common/
│   │   ├── BottomNav.vue         # 하단 탭 내비 (홈 / 여행 / 마이페이지)
│   │   ├── ImageCarousel.vue     # 가로 스와이프 캐러셀 (범용)
│   │   ├── TripHistoryCard.vue   # 완료 여행 카드 (MainPage·MyPage 공용)
│   │   ├── LoadingOverlay.vue    # 풀스크린 로딩 (AI 대기 UX)
│   │   └── AppToast.vue          # 토스트 알림 (3초 자동 dismiss)
│   └── layouts/
│       └── AppLayout.vue         # BottomNav 포함 레이아웃 래퍼
├── composables/
│   ├── useToast.ts           # 전역 토스트 상태
│   ├── useGeolocation.ts     # 현재 위치 일회성 조회(getCurrentCoordinates) + 실시간 트래킹(watchCoordinates)
│   └── useDeviceHeading.ts   # 디바이스 방위각
├── pages/
│   ├── auth/
│   │   ├── LoginPage.vue
│   │   └── RegisterPage.vue
│   ├── main/
│   │   ├── MainPage.vue
│   │   └── components/
│   │       ├── MainTopBar.vue          # 로고 + 로그아웃
│   │       ├── MainWelcomeBanner.vue   # 웰컴 배너
│   │       ├── MainActiveTripCard.vue  # 진행 중 여행 카드
│   │       ├── MainNearbyList.vue      # 주변 문화재 추천 목록
│   │       ├── MainStartCard.vue       # 새 여행 시작 유도 카드
│   │       └── MainGuideCard.vue       # 서비스 사용 가이드
│   ├── trip/
│   │   ├── TripPage.vue              # 진행 중 여행 (실시간 GPS 트래킹)
│   │   └── components/
│   │       ├── TripMapSection.vue        # 카카오맵 + 뷰포트 문화재 클러스터 + 추천 마커
│   │       ├── TripRecommendationSection.vue  # AI 추천 목록
│   │       ├── TripVisitedSection.vue    # 방문 기록 목록
│   │       ├── TripActiveHeader.vue      # 여행 헤더 + 완료 버튼
│   │       ├── TripCreatePanel.vue       # 새 여행 생성 폼
│   │       └── TripCompleteDialog.vue    # 여행 완료 확인 모달
│   ├── heritage/
│   │   ├── HeritageDetailPage.vue      # 문화재 상세 (풀스크린)
│   │   ├── HeritageScanPage.vue        # 카메라 촬영
│   │   └── HeritageExplanationPage.vue # AI 해설 결과
│   ├── mypage/
│   │   ├── MyPage.vue
│   │   └── components/
│   │       ├── MyProfileHeader.vue     # 프로필 헤더 + 통계
│   │       ├── MyPeriodChart.vue       # 탐방 시대 도넛 차트
│   │       ├── MyVisitGallery.vue      # 방문 문화재 캐러셀
│   │       └── MyCategoryProgress.vue  # 카테고리별 달성률
│   ├── quiz/
│   │   └── QuizPage.vue
│   ├── report/
│   │   └── ReportPage.vue
│   └── NotFoundPage.vue
├── router/
│   └── index.ts              # 라우터 + 인증 가드
├── stores/
│   ├── userStore.ts          # 인증 상태 (login/logout/fetchMe)
│   └── journeyStore.ts       # 해설 결과 임시 상태
├── types/
│   └── api.ts                # BE 응답 타입 전체 정의
└── utils/
    ├── imageUtils.ts         # fileToBase64 (HEIC → JPEG 동적 변환)
    └── kakaoMaps.ts          # 카카오맵 SDK 로더 (MarkerClusterer, CustomOverlay, setPosition 등)
```

---

## 환경 설정

`.env` 파일을 프로젝트 루트에 생성하세요.

```
VITE_KAKAO_MAP_APP_KEY=발급받은_JavaScript_키
```

카카오 Developers → 내 애플리케이션 → 플랫폼 → Web에 `http://localhost:5173` 등록 필요.

---

## 실행 방법

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 외부 기기(폰)에서 접근 가능하게 실행
npm run dev -- --host

# 빌드
npm run build

# 코드 포맷
npm run format
```

개발 서버 기본 포트: `http://localhost:5173`

---

## 라우터 구조

```
/login                        → LoginPage (인증 불필요)
/register                     → RegisterPage (인증 불필요)
/ (AppLayout — BottomNav 포함)
  ├── /                       → MainPage
  ├── /trip                   → TripPage
  └── /mypage                 → MyPage
/heritage/explanation         → HeritageExplanationPage (풀스크린)
/heritage/:heritageId         → HeritageDetailPage (풀스크린)
/trip/:tripId/scan            → HeritageScanPage (풀스크린)
/quiz/:tripId                 → QuizPage (풀스크린)
/report/:tripId               → ReportPage (풀스크린)
```

---

## 지도 주요 동작

- **뷰포트 문화재**: 카카오맵 `idle` 이벤트(300ms 디바운스) → 현재 시야 bounding box로 `GET /api/heritage/map` 호출 → MarkerClusterer로 표시. 줌아웃 최대 레벨 8(시(市) 단위) 제한.
- **추천 마커**: AI 추천 문화재는 주황 말풍선 마커로 별도 표시. 목록 클릭 시 해당 위치로 `panTo`.
- **현재 위치**: `watchPosition` GPS 실시간 트래킹 → `CustomOverlay.setPosition()`으로 마커 이동. 방위각 센서 연동 시 방향 화살표 표시.
