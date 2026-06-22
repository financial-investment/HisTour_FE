export interface ApiResponse<T> {
  success: boolean
  data: T
  message: string | null
}

export interface TokenResponse {
  accessToken: string
  refreshToken: string
}

export interface UserResponse {
  id: number
  email: string
  nickname: string
  preferredLang: string
}

export interface HeritageDetailResponse {
  heritageId: number
  name: string
  nameHanja: string | null
  category: string
  period: string
  lat: number
  lng: number
  thumbnailUrl: string | null
  description: string | null
  mediaUrls: string[]
}

export interface ExplainResponse {
  heritageId: number
  heritageName: string
  explanation: string
  visitLogId: number | null
}

export interface TripResponse {
  tripId: number
  title: string | null
  tripDate: string | null
  status: 'IN_PROGRESS' | 'COMPLETED'
  visitCount: number
  createdAt: string
  visitLogs?: VisitLogResponse[]
}

export interface VisitLogResponse {
  id: number
  tripId: number
  heritageId: number
  heritageName: string
  photoUrl: string | null
  lat: number
  lng: number
  explanation: string | null
  visitedAt: string
}

export interface TripDetailResponse {
  tripId: number
  title: string | null
  tripDate: string | null
  status: 'IN_PROGRESS' | 'COMPLETED'
  visitLogs: VisitLogResponse[]
}

export interface RecommendedHeritage {
  heritageId: number
  name: string
  thumbnailUrl: string | null
  lat: number
  lng: number
  distanceM: number
}

export interface CourseHeritage {
  heritageId: number
  name: string
  thumbnailUrl: string | null
  lat: number
  lng: number
  order: number
}

export interface CourseResponse {
  regionCode: string
  regionName: string
  heritages: CourseHeritage[]
}

export interface VisitedHeritage {
  heritageId: number
  name: string
  thumbnailUrl: string | null
}

export interface ReportResponse {
  tripId: number
  visitedHeritages: VisitedHeritage[]
  course: CourseResponse | null
  summary: string
}

export interface QuizChoiceResponse {
  choiceId: number
  content: string
}

export interface QuizQuestionResponse {
  sessionId: number
  quizId: number
  sortOrder: number
  heritageId: number
  heritageName: string
  title: string
  content: string
  source: string
  difficulty: string
  choices: QuizChoiceResponse[]
}

export interface QuizSessionResponse {
  tripId: number
  totalCount: number
  questions: QuizQuestionResponse[]
}

export interface QuizResultItemResponse {
  sessionId: number
  quizId: number
  selectedChoiceId: number
  correctChoiceId: number
  correct: boolean
  explanation: string | null
}

export interface QuizResultResponse {
  tripId: number
  totalCount: number
  correctCount: number
  accuracy: number
  results: QuizResultItemResponse[]
}
