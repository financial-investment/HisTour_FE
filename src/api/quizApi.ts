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

  submitAnswer(quizSessionId: number, selectedChoiceId: number) {
    return apiClient
      .post<ApiResponse<QuizResultResponse>>('/api/quiz/results', {
        quizSessionId,
        selectedChoiceId,
      })
      .then((r) => r.data.data)
  },
}
