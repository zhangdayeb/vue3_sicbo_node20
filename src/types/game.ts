export interface GameState {
  videoUrl: string
  gameNumber: string
  status: 'waiting' | 'betting' | 'dealing' | 'result'
  countdown: number
  round: number
}

export interface BetLimits {
  min: number
  max: number
}

export interface UserBalance {
  total: number
  currency: string
}

export interface GameSettings {
  tableName: string
  limits: BetLimits
  language: 'zh' | 'en'
}