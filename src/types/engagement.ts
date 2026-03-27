import type { LocalizedText } from './content'

// ── Leaderboard ──
export interface LeaderboardDto {
  rankings: LeaderboardEntryDto[]
  currentUser: LeaderboardEntryDto | null
}

export interface LeaderboardEntryDto {
  userId: string
  firstName: string | null
  lastName: string | null
  xpValue: number
  rank: number
  level: number
}

// ── Favorites ──
export interface FavoriteToggleDto {
  isFavorited: boolean
}

export interface FavoriteQuestionDto {
  questionId: string
  text: LocalizedText
  imageUrl: string | null
  difficulty: number
  favoritedAt: string
}

// ── User Settings ──
export type UserSettingsDto = Record<string, string>

// ── Detailed Progress ──
export interface DetailedProgressDto {
  categoryAccuracy: CategoryAccuracyDto[]
  timeAnalytics: TimeAnalyticsDto
  trend: ImprovementTrendDto
  readinessScore: number
  weakCategories: string[]
}

export interface CategoryAccuracyDto {
  categoryId: string
  categoryName: string
  accuracy: number
  totalAttempts: number
  avgTimeSec: number
}

export interface TimeAnalyticsDto {
  avgTimePerQuestion: number
  fastestTime: number
  slowestTime: number
  distribution: { range: string; count: number }[]
}

export interface ImprovementTrendDto {
  thisWeekAccuracy: number
  lastWeekAccuracy: number
  changePercent: number
}

// ── Practice Modes ──
export interface ReviewQuestionDto {
  id: string
  text: LocalizedText
  imageUrl: string | null
  leitnerBox: number
  nextReviewDate: string
  answerOptions: { id: string; text: LocalizedText; imageUrl: string | null }[]
}

export interface HardQuestionDto {
  id: string
  text: LocalizedText
  imageUrl: string | null
  difficulty: number
  successRate: number
  answerOptions: { id: string; text: LocalizedText; imageUrl: string | null }[]
}
