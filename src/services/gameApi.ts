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

// 投注记录详情响应接口
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

  /**
   * 获取投注记录列表
   */
  async getBettingHistory(params: BettingHistoryParams): Promise<BettingHistoryResponse> {
    const requestParams = {
      user_id: this.gameParams.user_id,
      table_id: this.gameParams.table_id,
      game_type: this.gameParams.game_type,
      page: params.page,
      page_size: params.pageSize,
      status: params.status,
      start_date: params.start_date,
      end_date: params.end_date,
      bet_type: params.bet_type
    }

    const response = await httpClient.get<BettingHistoryResponse>('/sicbo/bet/history', requestParams)
    return response
  }

  /**
   * 获取投注记录详情
   */
  async getBettingDetail(recordId: string): Promise<BettingDetailResponse> {
    const response = await httpClient.get<BettingDetailResponse>(`/sicbo/bet/detail/${recordId}`, {
      user_id: this.gameParams.user_id
    })
    return response
  }

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