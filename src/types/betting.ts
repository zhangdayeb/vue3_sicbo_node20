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

// 导出所有类型的联合类型
export type AllBettingTypes = 
  | BetType
  | GamePhase
  | BetStatus
  | BetCategory