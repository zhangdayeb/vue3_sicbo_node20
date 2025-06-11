// src/types/bettingHistory.ts
// 投注记录相关类型定义

// 投注状态
export type BettingStatus = 'pending' | 'win' | 'lose' | 'cancelled' | 'processing'

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
}

// 投注记录查询参数
export interface BettingHistoryParams {
  page: number                 // 页码 (从1开始)
  pageSize: number             // 每页大小
  start_date?: string          // 开始日期 (YYYY-MM-DD)
  end_date?: string            // 结束日期 (YYYY-MM-DD)
}

// 分页信息
export interface PaginationInfo {
  current_page: number         // 当前页码
  total_pages: number          // 总页数
  total_records: number        // 总记录数
  page_size: number            // 每页大小
  has_more: boolean            // 是否还有更多数据
}

// 🔥 修复：响应拦截器处理后的投注记录响应数据
export interface BettingHistoryResponse {
  records: BettingRecord[]     // 记录列表
  pagination: PaginationInfo   // 分页信息
}

// 🔥 修复：响应拦截器处理后的投注记录详情响应
export interface BettingDetailResponse {
  // 响应拦截器已处理，直接返回 BettingRecord
  // 不再包含 code, message, data 结构
}

// 🔥 新增：如果需要原始API响应格式的类型（用于其他未经拦截器处理的API）
export interface RawBettingHistoryResponse {
  code: number                 // 响应码
  message: string              // 响应消息
  data: {
    records: BettingRecord[]   // 记录列表
    pagination: PaginationInfo // 分页信息
  }
}

// 🔥 新增：原始投注记录详情响应（用于其他未经拦截器处理的API）
export interface RawBettingDetailResponse {
  code: number                 // 响应码
  message: string              // 响应消息
  data: BettingRecord          // 单条记录详情
}

// 投注记录加载状态
export interface BettingHistoryLoadingState {
  loading: boolean             // 初始加载
  refreshing: boolean          // 下拉刷新
  loadingMore: boolean         // 上拉加载更多
  error: string | null         // 错误信息
}

// 日期筛选条件
export interface DateFilter {
  start: string | null         // 开始日期
  end: string | null           // 结束日期
}

// 导出默认的查询参数
export const DEFAULT_PARAMS: BettingHistoryParams = {
  page: 1,
  pageSize: 20
}

// 状态显示映射
export const STATUS_LABELS: Record<BettingStatus, string> = {
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

// 🔥 新增：响应格式辅助类型
export type ProcessedResponse<T> = T  // 经过响应拦截器处理的数据
export type RawResponse<T> = {        // 原始API响应格式
  code: number
  message: string
  data: T
}