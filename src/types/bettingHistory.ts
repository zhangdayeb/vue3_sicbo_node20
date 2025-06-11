// src/types/bettingHistory.ts
// 投注记录相关类型定义

// 投注状态
export type BettingStatus = 'pending' | 'win' | 'lose' | 'cancelled' | 'processing'

// 投注类型枚举
export type BetTypeCategory = 'basic' | 'number' | 'single' | 'pair' | 'triple' | 'combo'

// 单条投注记录
export interface BettingRecord {
  id: string                    // 投注记录ID
  game_number: string          // 游戏局号
  table_id: string             // 台桌ID
  user_id: string              // 用户ID
  bet_time: string             // 投注时间 (ISO格式)
  settle_time?: string         // 结算时间
  
  // 投注信息
  bet_details: BetDetail[]     // 投注详情数组
  total_bet_amount: number     // 总投注金额
  total_win_amount: number     // 总中奖金额
  net_amount: number           // 净盈亏 (正数为盈利，负数为亏损)
  
  // 开奖信息
  dice_results?: [number, number, number]  // 开奖结果
  dice_total?: number          // 骰子总点数
  
  // 状态信息
  status: BettingStatus        // 投注状态
  is_settled: boolean          // 是否已结算
  
  // 元信息
  currency: string             // 货币类型
  client_info?: string         // 客户端信息
  ip_address?: string          // IP地址

// 🔥 新增：格式化和计算属性
  formattedBetTime?: string        // 格式化的投注时间
  formattedSettleTime?: string     // 格式化的结算时间
  formattedNetAmount?: string      // 格式化的净盈亏
  formattedTotalBet?: string       // 格式化的总投注
  formattedTotalWin?: string       // 格式化的总中奖
  statusText?: string              // 状态文本
  statusColor?: string             // 状态颜色
  isProfit?: boolean              // 是否盈利
  isLoss?: boolean                // 是否亏损
}

// 单个投注详情
export interface BetDetail {
  bet_type: string             // 投注类型 (如 'big', 'small', 'total-10' 等)
  bet_type_name: string        // 投注类型显示名称
  bet_amount: number           // 投注金额
  odds: string                 // 赔率 (如 '1:1', '1:62')
  win_amount: number           // 中奖金额
  is_win: boolean              // 是否中奖
  rate_id?: number             // 赔率ID (后端使用)
}

// 投注记录查询参数
export interface BettingHistoryParams {
  page: number                 // 页码 (从1开始)
  pageSize: number             // 每页大小
  table_id?: string            // 台桌ID筛选
  game_type?: string           // 游戏类型筛选
  status?: BettingStatus | 'all'       // 状态筛选
  start_date?: string          // 开始日期 (YYYY-MM-DD)
  end_date?: string            // 结束日期 (YYYY-MM-DD)
  bet_type?: string            // 投注类型筛选
}

// 投注记录响应数据
export interface BettingHistoryResponse {
  code: number                 // 响应码
  message: string              // 响应消息
  data: {
    records: BettingRecord[]   // 记录列表
    pagination: {
      current_page: number     // 当前页码
      total_pages: number      // 总页数
      total_records: number    // 总记录数
      page_size: number        // 每页大小
      has_more: boolean        // 是否还有更多数据
    }
    summary?: {
      total_bet: number        // 总投注金额
      total_win: number        // 总中奖金额
      total_net: number        // 总净盈亏
    }
  }
}

// 投注记录筛选选项
export interface BettingHistoryFilter {
  status: BettingStatus | 'all'     // 状态筛选
  dateRange: {
    start: string | null            // 开始日期
    end: string | null              // 结束日期
  }
  betType: string | 'all'           // 投注类型筛选
  sortBy: 'bet_time' | 'net_amount' // 排序字段
  sortOrder: 'asc' | 'desc'         // 排序方向
}

// 投注记录统计数据
export interface BettingStatistics {
  today: {
    total_bet: number          // 今日总投注
    total_win: number          // 今日总中奖
    net_amount: number         // 今日净盈亏
    win_rate: number           // 今日胜率
  }
  thisWeek: {
    total_bet: number          // 本周总投注
    total_win: number          // 本周总中奖
    net_amount: number         // 本周净盈亏
    win_rate: number           // 本周胜率
  }
  thisMonth: {
    total_bet: number          // 本月总投注
    total_win: number          // 本月总中奖
    net_amount: number         // 本月净盈亏
    win_rate: number           // 本月胜率
  }
}

// 投注记录加载状态
export interface BettingHistoryLoadingState {
  loading: boolean             // 初始加载
  refreshing: boolean          // 下拉刷新
  loadingMore: boolean         // 上拉加载更多
  error: string | null         // 错误信息
}

// 导出默认的筛选选项
export const DEFAULT_FILTER: BettingHistoryFilter = {
  status: 'all',
  dateRange: {
    start: null,
    end: null
  },
  betType: 'all',
  sortBy: 'bet_time',
  sortOrder: 'desc'
}

// 导出默认的查询参数
export const DEFAULT_PARAMS: BettingHistoryParams = {
  page: 1,
  pageSize: 20
}

// 状态显示映射
export const STATUS_LABELS: Record<BettingStatus | 'all', string> = {
  all: '全部',
  pending: '待开奖',
  win: '已中奖',
  lose: '未中奖',
  cancelled: '已取消',
  processing: '处理中'
}

// 状态颜色映射
export const STATUS_COLORS: Record<BettingStatus, string> = {
  pending: '#ff9800',      // 橙色
  win: '#4caf50',          // 绿色
  lose: '#f44336',         // 红色
  cancelled: '#9e9e9e',    // 灰色
  processing: '#2196f3'    // 蓝色
}

// 投注类型分类映射
export const BET_TYPE_CATEGORIES: Record<BetTypeCategory, string> = {
  basic: '大小单双',
  number: '点数投注',
  single: '单骰投注',
  pair: '对子投注',
  triple: '三同号',
  combo: '组合投注'
}