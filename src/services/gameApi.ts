// src/services/gameApi.ts
import { httpClient, setAuthToken } from './httpClient'
import type { GameParams } from '@/types/api'
import type { 
  BettingHistoryParams, 
  BettingHistoryResponse, 
  BettingRecord 
} from '@/types/bettingHistory'

// 台桌信息接口
export interface TableInfo {
  id: number
  lu_zhu_name: string
  num_pu: number
  num_xue: number
  video_near: string
  video_far: string
  time_start: number
  right_money_banker_player: number
  right_money_tie: number
  table_title?: string
  bureau_number?: string
}

// 用户信息接口
export interface UserInfo {
  user_id: string
  balance: number
  money_balance: number
  currency: string
  nickname?: string
  avatar?: string
  level?: number
  vip_level?: number
}

// 投注请求接口
export interface BetRequest {
  money: number
  rate_id: number
}

// 投注响应接口
export interface BetResponse {
  money_balance: number
  money_spend: number
  bets: BetRequest[]
}

// 🔥 新增：投注记录详情响应接口
export interface BettingDetailResponse {
  code: number
  message: string
  data: BettingRecord
}

export class GameApiService {
  private gameParams: GameParams

  constructor(params: GameParams) {
    this.gameParams = params
    setAuthToken(params.token)
  }

  /**
   * 获取台桌信息
   */
  async getTableInfo(): Promise<TableInfo> {
    const response = await httpClient.get<TableInfo>('/sicbo/get_table/table_info', {
      tableId: this.gameParams.table_id,
      gameType: this.gameParams.game_type
    })
    return response
  }

  /**
   * 获取用户信息
   */
  async getUserInfo(): Promise<UserInfo> {
    const response = await httpClient.get<UserInfo>('/sicbo/user/info', {
      user_id: this.gameParams.user_id
    })
    return response
  }

  /**
   * 提交投注
   */
  async placeBets(bets: BetRequest[]): Promise<BetResponse> {
    const requestData = {
      table_id: parseInt(this.gameParams.table_id),
      game_type: parseInt(this.gameParams.game_type),
      is_exempt: 0,
      bet: bets
    }

    const response = await httpClient.post<BetResponse>('/sicbo/bet/order', requestData)
    return response
  }

  /**
   * 获取当前投注记录
   */
  async getCurrentBets(): Promise<any> {
    const response = await httpClient.post('/sicbo/current/record', {
      id: parseInt(this.gameParams.table_id)
    })
    return response
  }

  /**
   * 获取露珠数据
   */
  async getRoadmapData(): Promise<any> {
    const response = await httpClient.get('/sicbo/get_table/get_data', {
      tableId: this.gameParams.table_id,
      xue: 1,
      gameType: this.gameParams.game_type
    })
    return response
  }

  // ============= 🔥 新增：投注记录相关API ============= //

  /**
   * 获取投注记录列表
   * @param params 查询参数
   * @returns 投注记录响应数据
   */
  async getBettingHistory(params: BettingHistoryParams): Promise<BettingHistoryResponse> {
    try {
      console.log('🎯 [API] 获取投注记录', params)
      
      // 构建请求参数
      const requestParams = {
        user_id: this.gameParams.user_id,
        table_id: this.gameParams.table_id,
        game_type: this.gameParams.game_type,
        page: params.page,
        page_size: params.pageSize,
        ...this.buildHistoryFilters(params)
      }
      
      console.log('🎯 [API] 请求参数', requestParams)
      
      // 发送请求
      const response = await httpClient.get<any>('/sicbo/bet/history', requestParams)
      
      console.log('🎯 [API] 原始响应', response)
      
      // 转换响应数据格式
      const transformedResponse = this.transformHistoryResponse(response, params)
      
      console.log('🎯 [API] 转换后响应', transformedResponse)
      
      return transformedResponse
      
    } catch (error: any) {
      console.error('🎯 [API] 获取投注记录失败', error)
      
      // 🔥 开发模式下返回模拟数据
      if (import.meta.env.DEV) {
        console.warn('🎯 [API] 使用模拟数据')
        return this.getMockBettingHistory(params)
      }
      
      throw error
    }
  }

  /**
   * 获取投注记录详情
   * @param recordId 记录ID
   * @returns 投注记录详情
   */
  async getBettingDetail(recordId: string): Promise<BettingDetailResponse> {
    try {
      console.log('🎯 [API] 获取投注详情', recordId)
      
      const response = await httpClient.get<any>(`/sicbo/bet/detail/${recordId}`, {
        user_id: this.gameParams.user_id
      })
      
      // 转换单条记录格式
      const transformedRecord = this.transformSingleRecord(response.data)
      
      return {
        code: response.code || 200,
        message: response.message || 'success',
        data: transformedRecord
      }
      
    } catch (error: any) {
      console.error('🎯 [API] 获取投注详情失败', error)
      
      // 🔥 开发模式下返回模拟数据
      if (import.meta.env.DEV) {
        return this.getMockBettingDetail(recordId)
      }
      
      throw error
    }
  }

  /**
   * 取消待开奖的投注
   * @param recordId 记录ID
   * @returns 取消结果
   */
  async cancelBetting(recordId: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🎯 [API] 取消投注', recordId)
      
      const response = await httpClient.post('/sicbo/bet/cancel', {
        record_id: recordId,
        user_id: this.gameParams.user_id,
        table_id: this.gameParams.table_id
      })
      
      return {
        success: response.code === 200 || response.code === 1,
        message: response.message || (response.code === 200 ? '取消成功' : '取消失败')
      }
      
    } catch (error: any) {
      console.error('🎯 [API] 取消投注失败', error)
      throw error
    }
  }

  // ============= 🔥 私有方法：数据转换和处理 ============= //

  /**
   * 构建历史记录筛选参数
   */
  private buildHistoryFilters(params: BettingHistoryParams): Record<string, any> {
    const filters: Record<string, any> = {}
    
    // 状态筛选 - 🔥 修复类型错误
    if (params.status && params.status !== 'all') {
      const validStatuses: Array<'pending' | 'win' | 'lose' | 'cancelled' | 'processing'> = 
        ['pending', 'win', 'lose', 'cancelled', 'processing']
      
      if (validStatuses.includes(params.status as any)) {
        filters.status = params.status
      }
    }
    
    // 投注类型筛选
    if (params.bet_type && params.bet_type !== 'all') {
      filters.bet_type = params.bet_type
    }
    
    // 日期范围筛选
    if (params.start_date) {
      filters.start_date = params.start_date
    }
    
    if (params.end_date) {
      filters.end_date = params.end_date
    }
    
    // 排序
    filters.sort_by = 'bet_time'
    filters.sort_order = 'desc'
    
    return filters
  }

  /**
   * 转换历史记录响应数据格式
   */
  private transformHistoryResponse(response: any, params: BettingHistoryParams): BettingHistoryResponse {
    // 处理不同可能的响应格式
    const data = response.data || response
    const records = data.records || data.list || data.data || []
    
    // 转换记录格式
    const transformedRecords = records.map((record: any) => this.transformSingleRecord(record))
    
    // 构建分页信息
    const pagination = {
      current_page: params.page,
      total_pages: Math.ceil((data.total || records.length) / params.pageSize),
      total_records: data.total || records.length,
      page_size: params.pageSize,
      has_more: params.page < Math.ceil((data.total || records.length) / params.pageSize)
    }
    
    return {
      code: response.code || 200,
      message: response.message || 'success',
      data: {
        records: transformedRecords,
        pagination,
        summary: data.summary || {
          // 🔥 修复reduce类型错误：明确参数类型
          total_bet: transformedRecords.reduce((sum: number, r: BettingRecord) => sum + r.total_bet_amount, 0),
          total_win: transformedRecords.reduce((sum: number, r: BettingRecord) => sum + r.total_win_amount, 0),
          total_net: transformedRecords.reduce((sum: number, r: BettingRecord) => sum + r.net_amount, 0)
        }
      }
    }
  }

  /**
   * 转换单条记录格式
   */
  private transformSingleRecord(record: any): BettingRecord {
    // 处理投注详情
    const betDetails = this.transformBetDetails(record.bet_details || record.bets || [])
    
    // 计算汇总金额 - 🔥 修复reduce类型错误：明确参数类型
    const totalBetAmount = betDetails.reduce((sum: number, detail: any) => sum + detail.bet_amount, 0)
    const totalWinAmount = betDetails.reduce((sum: number, detail: any) => sum + detail.win_amount, 0)
    const netAmount = totalWinAmount - totalBetAmount
    
    return {
      id: record.id || record.record_id || `record_${Date.now()}_${Math.random()}`,
      game_number: record.game_number || record.bureau_number || 'T001250115001',
      table_id: record.table_id || this.gameParams.table_id,
      user_id: record.user_id || this.gameParams.user_id,
      bet_time: record.bet_time || record.created_at || new Date().toISOString(),
      settle_time: record.settle_time || record.settled_at,
      
      bet_details: betDetails,
      total_bet_amount: record.total_bet_amount || totalBetAmount,
      total_win_amount: record.total_win_amount || totalWinAmount,
      net_amount: record.net_amount !== undefined ? record.net_amount : netAmount,
      
      dice_results: this.parseDiceResults(record.dice_results || record.result),
      dice_total: record.dice_total || this.calculateDiceTotal(record.dice_results || record.result),
      
      status: this.normalizeStatus(record.status),
      is_settled: record.is_settled !== undefined ? record.is_settled : ['win', 'lose'].includes(record.status),
      
      currency: record.currency || 'CNY',
      client_info: record.client_info,
      ip_address: record.ip_address
    }
  }

  /**
   * 转换投注详情格式
   */
  private transformBetDetails(details: any[]): any[] {
    if (!Array.isArray(details)) return []
    
    return details.map((detail: any) => ({
      bet_type: detail.bet_type || detail.type,
      bet_type_name: detail.bet_type_name || this.getBetTypeName(detail.bet_type || detail.type),
      bet_amount: detail.bet_amount || detail.amount || 0,
      odds: detail.odds || '1:1',
      win_amount: detail.win_amount || detail.win || 0,
      is_win: detail.is_win !== undefined ? detail.is_win : (detail.win_amount || detail.win || 0) > 0,
      rate_id: detail.rate_id || detail.id
    }))
  }

  /**
   * 解析骰子结果
   */
  private parseDiceResults(results: any): [number, number, number] | undefined {
    if (!results) return undefined
    
    if (Array.isArray(results) && results.length === 3) {
      return [Number(results[0]), Number(results[1]), Number(results[2])]
    }
    
    if (typeof results === 'string') {
      const parsed = results.split(',').map(Number)
      if (parsed.length === 3) {
        return [parsed[0], parsed[1], parsed[2]]
      }
    }
    
    if (typeof results === 'object' && results.dice1 !== undefined) {
      return [Number(results.dice1), Number(results.dice2), Number(results.dice3)]
    }
    
    return undefined
  }

  /**
   * 计算骰子总点数
   */
  private calculateDiceTotal(results: any): number | undefined {
    const diceResults = this.parseDiceResults(results)
    if (!diceResults) return undefined
    
    return diceResults[0] + diceResults[1] + diceResults[2]
  }

  /**
   * 标准化状态值
   */
  private normalizeStatus(status: any): 'pending' | 'win' | 'lose' | 'cancelled' | 'processing' {
    if (!status) return 'pending'
    
    const statusStr = String(status).toLowerCase()
    
    const statusMap: Record<string, 'pending' | 'win' | 'lose' | 'cancelled' | 'processing'> = {
      '0': 'pending',
      '1': 'win',
      '2': 'lose',
      '3': 'cancelled',
      'pending': 'pending',
      'waiting': 'pending',
      'win': 'win',
      'won': 'win',
      'success': 'win',
      'lose': 'lose',
      'lost': 'lose',
      'failed': 'lose',
      'cancelled': 'cancelled',
      'cancel': 'cancelled',
      'processing': 'processing',
      'process': 'processing'
    }
    
    return statusMap[statusStr] || 'pending'
  }

  /**
   * 获取投注类型显示名称
   */
  private getBetTypeName(betType: string): string {
    const nameMap: Record<string, string> = {
      'small': '小',
      'big': '大',
      'odd': '单',
      'even': '双',
      'any-triple': '全围'
    }
    
    // 处理动态类型
    if (betType?.startsWith('total-')) {
      const num = betType.split('-')[1]
      return `总和${num}`
    }
    
    if (betType?.startsWith('single-')) {
      const num = betType.split('-')[1]
      return `单骰${num}`
    }
    
    if (betType?.startsWith('pair-')) {
      const num = betType.split('-')[1]
      return `对子${num}`
    }
    
    if (betType?.startsWith('triple-')) {
      const num = betType.split('-')[1]
      return `围${num}`
    }
    
    if (betType?.startsWith('combo-')) {
      const parts = betType.split('-')
      return `组合${parts[1]}-${parts[2]}`
    }
    
    return nameMap[betType] || betType || '未知类型'
  }

  // ============= 🔥 开发模式：模拟数据方法 ============= //

  /**
   * 获取模拟投注记录（开发测试用）
   */
  private getMockBettingHistory(params: BettingHistoryParams): BettingHistoryResponse {
    console.log('🎯 [MOCK] 生成模拟投注记录数据')
    
    const mockRecords: BettingRecord[] = []
    const recordCount = Math.min(params.pageSize, 50) // 最多生成50条
    
    for (let i = 0; i < recordCount; i++) {
      const recordId = `mock_${params.page}_${i + 1}`
      const gameNumber = `T001250115${String(params.page * 100 + i + 1).padStart(3, '0')}`
      
      // 随机生成骰子结果
      const dice1 = Math.ceil(Math.random() * 6)
      const dice2 = Math.ceil(Math.random() * 6)
      const dice3 = Math.ceil(Math.random() * 6)
      const diceTotal = dice1 + dice2 + dice3
      
      // 随机投注类型和金额
      const betTypes = ['big', 'small', 'odd', 'even', 'total-10', 'total-11', 'single-1', 'pair-1']
      const selectedBetType = betTypes[Math.floor(Math.random() * betTypes.length)]
      const betAmount = [10, 50, 100, 500, 1000][Math.floor(Math.random() * 5)]
      
      // 随机确定是否中奖
      const isWin = Math.random() > 0.6 // 40%中奖率
      const winAmount = isWin ? betAmount * (1 + Math.random() * 5) : 0
      
      // 随机状态
      const statuses: Array<'pending' | 'win' | 'lose' | 'cancelled'> = ['win', 'lose', 'pending']
      const status = i === 0 ? 'pending' : (isWin ? 'win' : 'lose') // 第一条设为pending
      
      const betTime = new Date(Date.now() - i * 5 * 60 * 1000).toISOString() // 每5分钟一条
      
      mockRecords.push({
        id: recordId,
        game_number: gameNumber,
        table_id: this.gameParams.table_id,
        user_id: this.gameParams.user_id,
        bet_time: betTime,
        settle_time: status === 'pending' ? undefined : betTime,
        
        bet_details: [{
          bet_type: selectedBetType,
          bet_type_name: this.getBetTypeName(selectedBetType),
          bet_amount: betAmount,
          odds: '1:1',
          win_amount: winAmount,
          is_win: isWin,
          rate_id: Math.floor(Math.random() * 100)
        }],
        
        total_bet_amount: betAmount,
        total_win_amount: winAmount,
        net_amount: winAmount - betAmount,
        
        dice_results: [dice1, dice2, dice3],
        dice_total: diceTotal,
        
        status: status,
        is_settled: status !== 'pending',
        
        currency: 'CNY'
      })
    }
    
    return {
      code: 200,
      message: 'Mock data generated successfully',
      data: {
        records: mockRecords,
        pagination: {
          current_page: params.page,
          total_pages: 10, // 模拟10页数据
          total_records: 200, // 模拟200条记录
          page_size: params.pageSize,
          has_more: params.page < 10
        },
        summary: {
          // 🔥 修复reduce类型错误：明确参数类型
          total_bet: mockRecords.reduce((sum: number, r: BettingRecord) => sum + r.total_bet_amount, 0),
          total_win: mockRecords.reduce((sum: number, r: BettingRecord) => sum + r.total_win_amount, 0),
          total_net: mockRecords.reduce((sum: number, r: BettingRecord) => sum + r.net_amount, 0)
        }
      }
    }
  }

  /**
   * 获取模拟投注详情（开发测试用）
   */
  private getMockBettingDetail(recordId: string): BettingDetailResponse {
    console.log('🎯 [MOCK] 生成模拟投注详情数据')
    
    const mockRecord: BettingRecord = {
      id: recordId,
      game_number: 'T001250115001',
      table_id: this.gameParams.table_id,
      user_id: this.gameParams.user_id,
      bet_time: new Date().toISOString(),
      settle_time: new Date().toISOString(),
      
      bet_details: [
        {
          bet_type: 'big',
          bet_type_name: '大',
          bet_amount: 100,
          odds: '1:1',
          win_amount: 200,
          is_win: true,
          rate_id: 1
        },
        {
          bet_type: 'total-11',
          bet_type_name: '总和11',
          bet_amount: 50,
          odds: '1:6',
          win_amount: 0,
          is_win: false,
          rate_id: 2
        }
      ],
      
      total_bet_amount: 150,
      total_win_amount: 200,
      net_amount: 50,
      
      dice_results: [4, 5, 6],
      dice_total: 15,
      
      status: 'win',
      is_settled: true,
      
      currency: 'CNY'
    }
    
    return {
      code: 200,
      message: 'Mock detail generated successfully',
      data: mockRecord
    }
  }

  // ============= 原有方法保持不变 ============= //

  /**
   * 更新游戏参数
   */
  updateGameParams(newParams: Partial<GameParams>): void {
    this.gameParams = { ...this.gameParams, ...newParams }
    
    if (newParams.token) {
      setAuthToken(newParams.token)
    }
  }

  /**
   * 获取当前游戏参数
   */
  getGameParams(): GameParams {
    return { ...this.gameParams }
  }
}

// 创建API服务实例
export const createGameApiService = (params: GameParams): GameApiService => {
  return new GameApiService(params)
}

// 全局API服务实例
let globalApiService: GameApiService | null = null

export const setGlobalApiService = (service: GameApiService): void => {
  globalApiService = service
}

export const getGlobalApiService = (): GameApiService => {
  if (!globalApiService) {
    throw new Error('API服务未初始化，请先调用 setGlobalApiService')
  }
  return globalApiService
}

// 快捷方法
export const initializeGameApi = async (params: GameParams) => {
  const apiService = createGameApiService(params)
  setGlobalApiService(apiService)
  
  const [tableInfo, userInfo] = await Promise.all([
    apiService.getTableInfo(),
    apiService.getUserInfo()
  ])
  
  return {
    apiService,
    tableInfo,
    userInfo
  }
}