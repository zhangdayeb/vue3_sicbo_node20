// 游戏相关类型定义

// 游戏状态
export interface GameState {
  videoUrl: string
  gameNumber: string
  status: GameStatus
  countdown: number
  round: number
}

export type GameStatus = 
  | 'waiting' // 等待开始
  | 'betting' // 投注阶段
  | 'dealing' // 开牌阶段
  | 'result' // 结果阶段

// 用户余额
export interface UserBalance {
  total: number
  currency: string
}

// 游戏设置
export interface GameSettings {
  tableName: string
  limits: BetLimits
  language: string
}

// 投注限额
export interface BetLimits {
  min: number
  max: number
}

// 游戏阶段
export type GamePhase = 'waiting' | 'betting' | 'rolling' | 'result' | 'settling'

// 骰子相关
export interface DiceResult {
  dice1: number
  dice2: number
  dice3: number
  total: number
  rollId: string
  timestamp: Date
  verificationData?: DiceVerification
}

export interface DiceVerification {
  hash: string
  seed: string
  nonce: number
  algorithm: string
  provable: boolean
}

export interface DiceAnimation {
  duration: number
  shakeDuration: number
  revealDelay: number
  showCup: boolean
  showTrail: boolean
  cupStyle: 'traditional' | 'modern' | 'crystal'
  diceStyle: 'classic' | 'neon' | 'gold'
}

// 游戏结果
export interface GameResult {
  gameNumber: string
  diceResult: DiceResult
  winningBets: string[]
  specialResults: SpecialGameResult[]
  payouts: Payout[]
  timestamp: Date
  verified: boolean
  metadata: GameResultMetadata
}

export interface SpecialGameResult {
  type: SpecialResultType
  description: string
  multiplier?: number
  rarity: ResultRarity
  icon?: string
  color?: string
}

export type SpecialResultType = 
  | 'triple_same' // 三同号
  | 'double_pair' // 对子
  | 'straight' // 顺子 (1,2,3 或 4,5,6)
  | 'extreme_total' // 极值总和 (4 或 17)
  | 'perfect_balance' // 完美平衡 (每个数字都不同且和为中位数)
  | 'lucky_seven' // 幸运七
  | 'golden_combo' // 黄金组合
  | 'rare_pattern' // 稀有模式

export type ResultRarity = 
  | 'common' // 常见 (>10%)
  | 'uncommon' // 不常见 (5-10%)
  | 'rare' // 稀有 (1-5%)
  | 'epic' // 史诗 (0.1-1%)
  | 'legendary' // 传说 (<0.1%)

export interface Payout {
  playerId: string
  betType: string
  betAmount: number
  winAmount: number
  odds: number
  netProfit: number
}

export interface GameResultMetadata {
  dealerInfo: DealerInfo
  tableInfo: TableInfo
  environmentInfo: EnvironmentInfo
  videoInfo?: VideoInfo
  auditTrail: AuditEntry[]
}

// 庄家信息
export interface DealerInfo {
  id: string
  name: string
  level: DealerLevel
  experience: number
  rating: number
  avatar?: string
  languages: string[]
  timezone: string
}

export type DealerLevel = 
  | 'trainee' // 见习
  | 'junior' // 初级
  | 'senior' // 高级
  | 'expert' // 专家
  | 'master' // 大师

// 桌台信息
export interface TableInfo {
  id: string
  name: string
  type: TableType
  limits: TableLimits
  capacity: number
  currentPlayers: number
  status: TableStatus
  features: TableFeature[]
  location?: string
}

export type TableType = 
  | 'standard' // 标准桌
  | 'vip' // VIP桌
  | 'high_limit' // 高限桌
  | 'speed' // 快速桌
  | 'traditional' // 传统桌
  | 'modern' // 现代桌

export interface TableLimits {
  minBet: number
  maxBet: number
  maxPayout: number
  maxPlayersPerRound: number
}

export type TableStatus = 
  | 'open' // 开放
  | 'closed' // 关闭
  | 'maintenance' // 维护中
  | 'private' // 私人桌
  | 'full' // 已满

export type TableFeature = 
  | 'hd_video' // 高清视频
  | 'multi_angle' // 多角度
  | 'chat' // 聊天功能
  | 'statistics' // 统计功能
  | 'roadmap' // 路纸
  | 'side_bets' // 边注
  | 'progressive' // 累进奖池

// 环境信息
export interface EnvironmentInfo {
  temperature: number
  humidity: number
  lighting: LightingCondition
  background: BackgroundTheme
  effects: EnvironmentEffect[]
}

export type LightingCondition = 
  | 'bright' // 明亮
  | 'dim' // 昏暗
  | 'neon' // 霓虹
  | 'natural' // 自然光
  | 'dramatic' // 戏剧性

export type BackgroundTheme = 
  | 'casino_classic' // 经典赌场
  | 'luxury_gold' // 奢华金色
  | 'modern_blue' // 现代蓝色
  | 'traditional_red' // 传统红色
  | 'futuristic' // 未来主义
  | 'minimalist' // 极简主义

export type EnvironmentEffect = 
  | 'particle_system' // 粒子系统
  | 'dynamic_lighting' // 动态光照
  | 'background_animation' // 背景动画
  | 'ambient_sound' // 环境声音
  | 'weather_effects' // 天气效果

// 视频信息
export interface VideoInfo {
  streamUrl: string
  quality: VideoQuality
  angles: CameraAngle[]
  recording: boolean
  archiveUrl?: string
  duration?: number
}

export type VideoQuality = 
  | 'low' // 360p
  | 'medium' // 720p
  | 'high' // 1080p
  | 'ultra' // 4K

export type CameraAngle = 
  | 'main' // 主视角
  | 'side' // 侧视角
  | 'top' // 俯视角
  | 'close_up' // 特写
  | 'wide' // 广角

// 审计记录
export interface AuditEntry {
  id: string
  timestamp: Date
  action: string
  actor: string
  details: Record<string, any>
  hash?: string
}

// 导出所有类型的联合类型
export type AllGameTypes = 
  | GameStatus
  | GamePhase
  | SpecialResultType
  | ResultRarity
  | DealerLevel
  | TableType
  | TableStatus
  | TableFeature
  | LightingCondition
  | BackgroundTheme
  | EnvironmentEffect
  | VideoQuality
  | CameraAngle