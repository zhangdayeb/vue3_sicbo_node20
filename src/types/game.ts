// 游戏相关类型定义

// 游戏状态
export interface GameState {
  gameNumber: string
  status: GameStatus
  phase: GamePhase
  countdown: number
  round: number
  tableId: string
  dealerId?: string
  startTime?: Date
  endTime?: Date
  lastUpdate: Date
}

export type GameStatus = 
  | 'initializing' // 初始化
  | 'ready' // 准备就绪
  | 'active' // 游戏进行中
  | 'paused' // 暂停
  | 'completed' // 已完成
  | 'cancelled' // 已取消
  | 'error' // 错误状态

export type GamePhase = 
  | 'waiting' // 等待开始
  | 'betting' // 投注阶段
  | 'no_more_bets' // 停止投注
  | 'rolling' // 摇骰阶段
  | 'revealing' // 揭晓结果
  | 'settling' // 结算阶段
  | 'completed' // 游戏完成

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

// 游戏配置
export interface GameConfig {
  general: GeneralGameConfig
  timing: TimingConfig
  visual: VisualConfig
  audio: AudioConfig
  features: FeatureConfig
}

export interface GeneralGameConfig {
  gameVersion: string
  locale: string
  timezone: string
  currency: string
  rounding: RoundingConfig
  limits: GlobalLimits
}

export interface RoundingConfig {
  method: 'round' | 'floor' | 'ceil'
  precision: number
}

export interface GlobalLimits {
  maxConcurrentGames: number
  maxPlayersPerGame: number
  maxBetAmount: number
  maxWinAmount: number
}

export interface TimingConfig {
  bettingPhase: number // 秒
  noMoreBetsPhase: number
  rollingPhase: number
  revealPhase: number
  settlingPhase: number
  breakBetweenGames: number
  warningTimes: number[] // 倒计时警告时间点
}

export interface VisualConfig {
  theme: GameTheme
  animations: AnimationConfig
  effects: EffectConfig
  ui: UIConfig
}

export type GameTheme = 
  | 'classic' // 经典
  | 'modern' // 现代
  | 'luxury' // 奢华
  | 'minimal' // 极简
  | 'neon' // 霓虹
  | 'traditional' // 传统

export interface AnimationConfig {
  enabled: boolean
  speed: number // 0.5 - 2.0
  quality: 'low' | 'medium' | 'high'
  reduceMotion: boolean
}

export interface EffectConfig {
  particles: boolean
  lighting: boolean
  shadows: boolean
  reflections: boolean
  postProcessing: boolean
}

export interface UIConfig {
  layout: 'compact' | 'standard' | 'expanded'
  colorScheme: 'light' | 'dark' | 'auto'
  fontSize: 'small' | 'medium' | 'large'
  contrast: 'normal' | 'high'
}

export interface AudioConfig {
  master: AudioChannelConfig
  music: AudioChannelConfig
  effects: AudioChannelConfig
  voice: AudioChannelConfig
  ambient: AudioChannelConfig
}

export interface AudioChannelConfig {
  enabled: boolean
  volume: number // 0-1
  muted: boolean
}

export interface FeatureConfig {
  statistics: boolean
  history: boolean
  roadmap: boolean
  chat: boolean
  tips: boolean
  tutorials: boolean
  achievements: boolean
  leaderboard: boolean
}

// 玩家相关
export interface Player {
  id: string
  username: string
  displayName: string
  avatar?: string
  level: PlayerLevel
  experience: number
  balance: number
  currency: string
  status: PlayerStatus
  preferences: PlayerPreferences
  statistics: PlayerStatistics
  achievements: Achievement[]
  session: PlayerSession
}

export type PlayerLevel = 
  | 'newcomer' // 新手 (0-99 exp)
  | 'amateur' // 业余 (100-499 exp)
  | 'regular' // 常客 (500-1999 exp)
  | 'expert' // 专家 (2000-9999 exp)
  | 'master' // 大师 (10000-49999 exp)
  | 'legend' // 传奇 (50000+ exp)

export type PlayerStatus = 
  | 'online' // 在线
  | 'playing' // 游戏中
  | 'away' // 离开
  | 'offline' // 离线
  | 'banned' // 封禁
  | 'suspended' // 暂停

export interface PlayerPreferences {
  language: string
  timezone: string
  notifications: NotificationPreferences
  display: DisplayPreferences
  gameplay: GameplayPreferences
}

export interface NotificationPreferences {
  gameResults: boolean
  bigWins: boolean
  achievements: boolean
  promotions: boolean
  system: boolean
  sound: boolean
  vibration: boolean
}

export interface DisplayPreferences {
  theme: string
  animations: boolean
  effects: boolean
  autoHideUI: boolean
  showStatistics: boolean
  showRoadmap: boolean
}

export interface GameplayPreferences {
  autoConfirmBets: boolean
  quickBetAmounts: number[]
  defaultChipValue: number
  riskWarnings: boolean
  soundFeedback: boolean
}

export interface PlayerStatistics {
  gamesPlayed: number
  totalBets: number
  totalWinnings: number
  biggestWin: number
  winRate: number
  averageBet: number
  playTime: number // 分钟
  favoriteNumbers: number[]
  luckiestHour: number
  streaks: PlayerStreaks
}

export interface PlayerStreaks {
  currentWin: number
  currentLoss: number
  bestWin: number
  worstLoss: number
}

export interface Achievement {
  id: string
  name: string
  description: string
  category: AchievementCategory
  tier: AchievementTier
  progress: number
  maxProgress: number
  unlocked: boolean
  unlockedAt?: Date
  reward?: AchievementReward
}

export type AchievementCategory = 
  | 'betting' // 投注相关
  | 'winning' // 获胜相关
  | 'exploration' // 探索相关
  | 'social' // 社交相关
  | 'special' // 特殊成就

export type AchievementTier = 
  | 'bronze' // 铜牌
  | 'silver' // 银牌
  | 'gold' // 金牌
  | 'platinum' // 白金
  | 'diamond' // 钻石

export interface AchievementReward {
  type: 'coins' | 'experience' | 'title' | 'avatar' | 'badge'
  amount?: number
  item?: string
}

export interface PlayerSession {
  id: string
  startTime: Date
  lastActivity: Date
  gamesInSession: number
  betsInSession: number
  winningsInSession: number
  tableId: string
  deviceInfo: DeviceInfo
}

export interface DeviceInfo {
  platform: 'web' | 'mobile' | 'desktop'
  os: string
  browser: string
  screenResolution: string
  connection: ConnectionInfo
}

export interface ConnectionInfo {
  type: 'wifi' | 'cellular' | 'ethernet'
  speed: 'slow' | 'fast' | 'very_fast'
  latency: number // ms
  quality: 'poor' | 'fair' | 'good' | 'excellent'
}

// 游戏历史
export interface GameHistory {
  games: HistoricalGame[]
  pagination: PaginationInfo
  filters: HistoryFilter
  summary: HistorySummary
}

export interface HistoricalGame {
  gameNumber: string
  timestamp: Date
  result: DiceResult
  specialResults: SpecialGameResult[]
  playerCount: number
  totalBets: number
  totalPayouts: number
  duration: number
}

export interface PaginationInfo {
  currentPage: number
  totalPages: number
  itemsPerPage: number
  totalItems: number
}

export interface HistoryFilter {
  dateRange?: DateRange
  resultRange?: NumberRange
  specialResults?: SpecialResultType[]
  minPlayerCount?: number
  maxPlayerCount?: number
}

export interface DateRange {
  start: Date
  end: Date
}

export interface NumberRange {
  min: number
  max: number
}

export interface HistorySummary {
  totalGames: number
  averageResult: number
  mostCommonNumber: number
  leastCommonNumber: number
  bigSmallRatio: number
  oddEvenRatio: number
  specialResultFrequency: Record<SpecialResultType, number>
}

// 实时数据
export interface RealTimeData {
  currentGame: GameState
  nextGame?: GameState
  liveStats: LiveStatistics
  activePlayers: number
  recentResults: DiceResult[]
  trends: GameTrend[]
  alerts: GameAlert[]
}

export interface LiveStatistics {
  hotNumbers: NumberFrequency[]
  coldNumbers: NumberFrequency[]
  recentPatterns: Pattern[]
  streakInfo: StreakInfo
}

export interface NumberFrequency {
  number: number
  frequency: number
  percentage: number
  trend: 'up' | 'down' | 'stable'
}

export interface Pattern {
  description: string
  frequency: number
  lastOccurrence: Date
  probability: number
}

export interface StreakInfo {
  type: 'big' | 'small' | 'odd' | 'even'
  count: number
  probability: number
}

export interface GameTrend {
  metric: string
  direction: 'increasing' | 'decreasing' | 'stable'
  strength: number // 0-1
  duration: number // games
}

export interface GameAlert {
  id: string
  type: AlertType
  message: string
  severity: AlertSeverity
  timestamp: Date
  dismissed: boolean
}

export type AlertType = 
  | 'system' // 系统alert
  | 'game' // 游戏alert
  | 'streak' // 连续alert
  | 'rare_event' // 稀有事件
  | 'technical' // 技术alert

export type AlertSeverity = 
  | 'info' // 信息
  | 'warning' // 警告
  | 'error' // 错误
  | 'critical' // 严重

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
  | GameTheme
  | PlayerLevel
  | PlayerStatus
  | AchievementCategory
  | AchievementTier
  | AlertType
  | AlertSeverity