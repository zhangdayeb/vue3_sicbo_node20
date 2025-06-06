// 投注相关类型定义

// 基础投注类型
export type BetType = 
  // 大小单双
  | 'small' | 'big' | 'odd' | 'even'
  // 点数投注
  | 'total-4' | 'total-5' | 'total-6' | 'total-7' | 'total-8' | 'total-9' 
  | 'total-10' | 'total-11' | 'total-12' | 'total-13' | 'total-14' | 'total-15' 
  | 'total-16' | 'total-17'
  // 单骰投注
  | 'single-1' | 'single-2' | 'single-3' | 'single-4' | 'single-5' | 'single-6'
  // 对子投注
  | 'pair-1' | 'pair-2' | 'pair-3' | 'pair-4' | 'pair-5' | 'pair-6'
  // 三同号投注
  | 'triple-1' | 'triple-2' | 'triple-3' | 'triple-4' | 'triple-5' | 'triple-6'
  | 'any-triple'
  // 两两组合投注
  | 'combo-1-2' | 'combo-1-3' | 'combo-1-4' | 'combo-1-5' | 'combo-1-6'
  | 'combo-2-3' | 'combo-2-4' | 'combo-2-5' | 'combo-2-6'
  | 'combo-3-4' | 'combo-3-5' | 'combo-3-6'
  | 'combo-4-5' | 'combo-4-6'
  | 'combo-5-6'

// 游戏阶段
export type GamePhase = 'waiting' | 'betting' | 'rolling' | 'result' | 'settling'

// 投注状态
export type BetStatus = 'pending' | 'confirmed' | 'won' | 'lost' | 'cancelled' | 'settled'

// 投注限额
export interface BetLimits {
  min: number
  max: number
}

// 投注项配置
export interface BetConfig {
  type: BetType
  name: string
  description: string
  category: BetCategory
  odds: number | BetOdds
  probability: number
  limits: BetLimits
  enabled: boolean
  icon?: string
  color?: string
}

// 投注类别
export type BetCategory = 
  | 'main' // 大小单双
  | 'number' // 点数投注
  | 'single' // 单骰投注
  | 'pair' // 对子投注
  | 'triple' // 三同号投注
  | 'combo' // 组合投注
  | 'special' // 特殊投注

// 复杂赔率（如单骰投注的多级赔率）
export interface BetOdds {
  base: number
  multipliers?: Record<string, number>
  conditions?: BetOddsCondition[]
}

export interface BetOddsCondition {
  condition: string
  multiplier: number
  description: string
}

// 投注记录
export interface BetRecord {
  id: string
  betType: BetType
  amount: number
  odds: number
  timestamp: Date
  gameNumber: string
  status: BetStatus
  result?: BetRecordResult
  metadata?: BetMetadata
}

// 投注结果
export interface BetRecordResult {
  isWin: boolean
  winAmount: number
  actualOdds: number
  gameResult: number[]
  winCondition?: string
}

// 投注元数据
export interface BetMetadata {
  chipValue: number
  source: 'manual' | 'quick' | 'auto' | 'rebet'
  deviceInfo?: DeviceInfo
  sessionId?: string
  playerLevel?: string
}

export interface DeviceInfo {
  platform: string
  browser: string
  screenSize: string
  isMobile: boolean
}

// 投注结果汇总
export interface BetResult {
  id: string
  bets: Record<string, number>
  totalAmount: number
  totalWinAmount: number
  netProfit: number
  timestamp: Date
  gameNumber: string
  gameResult: number[]
  status: BetStatus
  details: BetResultDetail[]
}

export interface BetResultDetail {
  betType: BetType
  amount: number
  odds: number
  isWin: boolean
  winAmount: number
  winCondition?: string
}

// 游戏结果
export interface GameResult {
  gameNumber: string
  timestamp: Date
  diceResults: [number, number, number]
  total: number
  isSmall: boolean
  isBig: boolean
  isOdd: boolean
  isEven: boolean
  specialResults: SpecialResult[]
  metadata?: GameResultMetadata
}

export interface SpecialResult {
  type: 'triple' | 'pair' | 'sequence' | 'rare'
  description: string
  numbers: number[]
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
}

export interface GameResultMetadata {
  dealer?: string
  tableId: string
  round: number
  timestamp: Date
  videoUrl?: string
  verificationHash?: string
}

// 投注策略
export interface BettingStrategy {
  id: string
  name: string
  description: string
  type: StrategyType
  rules: StrategyRule[]
  settings: StrategySettings
  enabled: boolean
  performance?: StrategyPerformance
}

export type StrategyType = 
  | 'conservative' // 保守型
  | 'balanced' // 平衡型
  | 'aggressive' // 激进型
  | 'martingale' // 马丁格尔
  | 'fibonacci' // 斐波那契
  | 'custom' // 自定义

export interface StrategyRule {
  id: string
  condition: string
  action: StrategyAction
  priority: number
  enabled: boolean
}

export interface StrategyAction {
  type: 'bet' | 'skip' | 'stop' | 'adjust'
  betTypes?: BetType[]
  amount?: number | string // 可以是固定数值或百分比字符串
  conditions?: string[]
}

export interface StrategySettings {
  maxBetAmount: number
  maxLossStreak: number
  stopLossAmount: number
  takeProfitAmount: number
  riskLevel: number // 0-100
  autoExecute: boolean
}

export interface StrategyPerformance {
  totalGames: number
  winRate: number
  avgProfit: number
  maxDrawdown: number
  sharpeRatio: number
  lastUpdated: Date
}

// 投注验证
export interface BetValidation {
  isValid: boolean
  errors: BetValidationError[]
  warnings: BetValidationWarning[]
  suggestions: BetValidationSuggestion[]
}

export interface BetValidationError {
  code: string
  message: string
  field?: string
}

export interface BetValidationWarning {
  code: string
  message: string
  severity: 'low' | 'medium' | 'high'
}

export interface BetValidationSuggestion {
  type: 'optimization' | 'risk' | 'strategy'
  message: string
  actionable: boolean
}

// 投注统计
export interface BettingStatistics {
  summary: BettingSummary
  performance: BettingPerformance
  patterns: BettingPattern[]
  trends: BettingTrend[]
  risks: RiskAnalysis
}

export interface BettingSummary {
  totalBets: number
  totalAmount: number
  totalWinnings: number
  netProfit: number
  winRate: number
  avgBetAmount: number
  avgWinAmount: number
  gamesPlayed: number
  timeSpent: number // 分钟
}

export interface BettingPerformance {
  daily: PerformanceData[]
  weekly: PerformanceData[]
  monthly: PerformanceData[]
  bestDay: PerformanceData
  worstDay: PerformanceData
  streaks: StreakData
}

export interface PerformanceData {
  date: string
  bets: number
  amount: number
  winnings: number
  profit: number
  winRate: number
}

export interface StreakData {
  currentWin: number
  currentLoss: number
  maxWin: number
  maxLoss: number
  avgWinStreak: number
  avgLossStreak: number
}

export interface BettingPattern {
  type: 'temporal' | 'amount' | 'market' | 'outcome'
  description: string
  frequency: number
  confidence: number
  recommendation?: string
}

export interface BettingTrend {
  metric: string
  direction: 'up' | 'down' | 'stable'
  change: number
  period: string
  significance: number
}

export interface RiskAnalysis {
  riskLevel: 'low' | 'medium' | 'high' | 'extreme'
  riskScore: number // 0-100
  factors: RiskFactor[]
  recommendations: string[]
}

export interface RiskFactor {
  type: 'balance' | 'bet_size' | 'frequency' | 'diversification' | 'streak'
  value: number
  impact: 'positive' | 'negative' | 'neutral'
  weight: number
}

// 投注设置
export interface BettingSettings {
  general: GeneralBettingSettings
  limits: BettingLimitSettings
  notifications: NotificationSettings
  display: DisplaySettings
  automation: AutomationSettings
}

export interface GeneralBettingSettings {
  defaultChip: number
  quickBetAmounts: number[]
  autoConfirm: boolean
  soundEnabled: boolean
  vibrationEnabled: boolean
  animationEnabled: boolean
  language: 'zh' | 'en'
  currency: 'CNY' | 'USD' | 'EUR'
}

export interface BettingLimitSettings {
  dailyLimit: number
  sessionLimit: number
  singleBetLimit: number
  lossLimit: number
  timeLimit: number // 分钟
  coolingPeriod: number // 分钟
  requireConfirmation: boolean
}

export interface NotificationSettings {
  winNotifications: boolean
  lossNotifications: boolean
  limitWarnings: boolean
  strategyAlerts: boolean
  gameUpdates: boolean
  promotions: boolean
  emailNotifications: boolean
  pushNotifications: boolean
}

export interface DisplaySettings {
  theme: 'light' | 'dark' | 'auto'
  betHistoryVisible: boolean
  statisticsVisible: boolean
  oddsDisplayFormat: 'decimal' | 'fractional' | 'american'
  numberFormat: 'standard' | 'abbreviated'
  timeFormat: '12h' | '24h'
}

export interface AutomationSettings {
  autoRebet: boolean
  autoStop: AutoStopSettings
  smartSuggestions: boolean
  riskWarnings: boolean
  strategyExecution: boolean
}

export interface AutoStopSettings {
  enabled: boolean
  lossThreshold: number
  winThreshold: number
  timeThreshold: number
  streakThreshold: number
}

// 投注会话
export interface BettingSession {
  id: string
  startTime: Date
  endTime?: Date
  startBalance: number
  currentBalance: number
  totalBets: number
  totalAmount: number
  totalWinnings: number
  netProfit: number
  bets: BetRecord[]
  settings: BettingSettings
  metadata: SessionMetadata
}

export interface SessionMetadata {
  playerId: string
  tableId: string
  gameVersion: string
  platform: string
  location?: string
  weather?: string // 可选的环境数据
}

// 投注快照
export interface BettingSnapshot {
  timestamp: Date
  balance: number
  activeBets: Record<string, number>
  gamePhase: GamePhase
  gameNumber: string
  statistics: BettingStatistics
  session: BettingSession
}

// 投注事件
export interface BettingEvent {
  id: string
  type: BettingEventType
  timestamp: Date
  data: any
  source: 'user' | 'system' | 'strategy' | 'external'
  processed: boolean
}

export type BettingEventType = 
  | 'bet_placed'
  | 'bet_cancelled'
  | 'bet_confirmed'
  | 'game_started'
  | 'game_ended'
  | 'result_announced'
  | 'balance_updated'
  | 'limit_reached'
  | 'strategy_triggered'
  | 'session_started'
  | 'session_ended'
  | 'error_occurred'

// 投注API相关
export interface BettingAPIRequest {
  action: 'place_bet' | 'cancel_bet' | 'confirm_bets' | 'get_status' | 'get_history'
  params: Record<string, any>
  timestamp: Date
  sessionId: string
  signature?: string
}

export interface BettingAPIResponse<T = any> {
  success: boolean
  data?: T
  error?: APIError
  timestamp: Date
  requestId: string
}

export interface APIError {
  code: string
  message: string
  details?: Record<string, any>
}

// 导出所有类型的联合类型
export type AllBettingTypes = 
  | BetType
  | GamePhase
  | BetStatus
  | BetCategory
  | StrategyType
  | BettingEventType