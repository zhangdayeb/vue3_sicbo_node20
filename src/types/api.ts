// src/types/api.ts
// API相关类型定义

// HTTP响应基础结构
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message: string
  error?: ApiError
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, any>
}

// 用户信息相关
export interface UserInfo {
  user_id: string
  username: string
  balance: number
  vip_level: number
  currency: string
}

export interface UserInfoResponse extends ApiResponse<UserInfo> {}

// 投注相关
export interface BetRequest {
  bet_type: string
  amount: number
}

export interface BetSubmission {
  table_id: string
  game_number: string
  user_id: string
  bets: BetRequest[]
  token: string
}

export interface BetResponseData {
  bet_id: string
  game_number: string
  total_amount: number
  new_balance: number
  bets: Array<{
    bet_type: string
    amount: number
    odds: string
  }>
}

export interface BetResponse extends ApiResponse<BetResponseData> {}

// WebSocket连接状态
export type WSConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error'

// 倒计时数据
export interface CountdownData {
  countdown: number
  status: 'waiting' | 'betting' | 'dealing' | 'result'
  game_number: string
}

// 开牌数据
export interface GameResultData {
  dice_results: [number, number, number]
  total: number
  is_big: boolean
  is_small: boolean
  is_odd: boolean
  is_even: boolean
  win_array: number[]
  game_number: string
}

// 中奖数据
export interface WinData {
  win_amount: number
  game_number: string
}

// 游戏状态数据
export interface GameStatusData {
  status: 'maintenance' | 'waiting' | 'betting' | 'dealing' | 'result'
  message: string
}

// 余额更新数据
export interface BalanceUpdateData {
  balance: number
  spend: number
}

// WebSocket事件数据类型
export interface WSMessage<T = any> {
  event: string
  data: T
}

export interface JoinTableData {
  table_id: string
  user_id: string
  token: string
}

export interface HeartbeatData {
  timestamp: number
}

export interface TableJoinedData {
  table_id: string
  user_id: string
  current_game: {
    game_number: string
    status: 'waiting' | 'betting' | 'dealing' | 'result'
    countdown: number
    round: number
  }
  user_balance: number
  table_info: {
    table_name: string
    min_bet: number
    max_bet: number
  }
}

export interface NewGameStartedData {
  table_id: string
  game_number: string
  status: 'betting'
  countdown: number
  round: number
}

export interface GameStatusChangeData {
  table_id: string
  game_number: string
  status: 'waiting' | 'betting' | 'dealing' | 'result'
  countdown: number
}

export interface CountdownTickData {
  table_id: string
  countdown: number
  status: string
}

export interface HeartbeatResponseData {
  timestamp: number
  server_time: number
}

export interface WSErrorData {
  code: string
  message: string
  details?: Record<string, any>
}

// API错误代码
export enum ApiErrorCode {
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  INVALID_TOKEN = 'INVALID_TOKEN',
  BETTING_CLOSED = 'BETTING_CLOSED',
  INVALID_BET_TYPE = 'INVALID_BET_TYPE',
  BET_AMOUNT_INVALID = 'BET_AMOUNT_INVALID',
  GAME_NOT_FOUND = 'GAME_NOT_FOUND',
  TABLE_MAINTENANCE = 'TABLE_MAINTENANCE',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR'
}

// 环境配置
export interface ApiConfig {
  baseURL: string
  wsURL: string
  timeout: number
  retryAttempts: number
  retryDelay: number
}

// URL参数
export interface GameParams {
  table_id: string
  game_type: string
  user_id: string
  token: string
}