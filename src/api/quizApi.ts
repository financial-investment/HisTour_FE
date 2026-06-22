import apiClient from './apiClient'
import type {
  ApiResponse,
  QuizSessionResponse,
  QuizResultResponse,
} from '@/types/api'

export const quizApi = {
  createSession(tripId: number) {
    return apiClient
      .post<ApiResponse<QuizSessionResponse>>('/api/quiz/sessions', { tripId })
      .then((r) => r.data.data)
  },

  getSession(tripId: number) {
    return apiClient
      .get<ApiResponse<QuizSessionResponse>>('/api/quiz/sessions', { params: { tripId } })
      .then((r) => r.data.data)
  },

  submitAnswers(answers: Array<{ sessionId: number; choiceId: number }>) {
    return apiClient
      .post<ApiResponse<QuizResultResponse>>('/api/quiz/results', {
        answers,
      })
      .then((r) => r.data.data)
  },
}
