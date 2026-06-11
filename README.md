# HisTour — Frontend

역사 현장에서 사진 한 장으로 AI 역사 해설을 받고, 여행 후 퀴즈로 기억을 남기는 역사 여행 기록 서비스

---

## 기술 스택

| 분류 | 기술 |
|---|---|
| Framework | Vue 3 |
| Language | TypeScript |
| Build | Vite |
| 상태 관리 | Pinia |
| 라우터 | Vue Router 5 |
| HTTP | Axios |
| 코드 품질 | ESLint, Prettier, oxlint |

---

## 프로젝트 구조

```
src/
├── api/
│   └── apiClient.ts          # Axios 인스턴스 및 기본 설정
├── assets/
│   ├── fonts/                # 글꼴 파일
│   ├── imgs/                 # 이미지 파일
│   └── styles/               # 전역 스타일 (main.css)
├── components/
│   ├── common/               # 공통 UI 컴포넌트 (버튼, 모달 등)
│   └── layouts/              # 레이아웃 컴포넌트
├── config/
│   └── index.ts              # 환경변수 및 상수 관리
├── pages/
│   ├── main/                 # 메인 (현장 해설)
│   ├── trip/                 # 여행 기록
│   ├── quiz/                 # 퀴즈
│   ├── report/               # 여행 리포트
│   ├── mypage/               # 마이페이지
│   ├── LoadingPage.vue
│   └── NotFoundPage.vue      # 404
├── router/
│   ├── index.ts              # 라우터 생성 및 통합
│   ├── tripRoutes.ts
│   ├── quizRoutes.ts
│   └── reportRoutes.ts
├── stores/
│   └── userStore.ts          # 사용자 상태 관리
├── utils/                    # 공통 유틸 함수
├── App.vue
└── main.ts
```

---

## 환경 설정

`.env` 파일을 프로젝트 루트에 생성하세요.

```
VITE_API_BASE_URL=http://localhost:8080
```

---

## 실행 방법

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 코드 포맷 및 린트
npm run format
npm run lint
```

개발 서버 기본 포트: `http://localhost:5173`
