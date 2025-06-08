// src/services/gameApi.ts
import { httpClient, setAuthToken } from './httpClient'
import type { GameParams } from '@/types/api'

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
}

// 用户信息接口
export interface UserInfo {
  user_id: string
  balance: number
  currency: string
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

export class GameApiService {
  private gameParams: GameParams

  constructor(params: GameParams) {
    this.gameParams = params
    
    // 设置全局token，后续所有请求自动携带
    setAuthToken(params.token)
    
    console.log('🎮 GameApi 初始化:', {
      table_id: params.table_id,
      game_type: params.game_type,
      user_id: params.user_id,
      token_set: !!params.token
    })
  }

  /**
   * 获取台桌信息
   */
  async getTableInfo(): Promise<TableInfo> {
    try {
      console.log('📡 获取台桌信息...', { tableId: this.gameParams.table_id })
      
      const response = await httpClient.get<TableInfo>('/sicbo/get_table/table_info', {
        tableId: this.gameParams.table_id,
        gameType: this.gameParams.game_type
      })

      console.log('✅ 台桌信息获取成功:', response)
      return response
      
    } catch (error) {
      console.warn('⚠️ 台桌信息获取失败，使用默认配置:', error)
      
      // 返回默认台桌信息
      const defaultTableInfo: TableInfo = {
        id: parseInt(this.gameParams.table_id),
        lu_zhu_name: `${this.gameParams.table_id}桌`,
        num_pu: 1,
        num_xue: 1,
        video_near: `https://video.xinghao998.top/index.html?tableVideo=sicbo_${this.gameParams.table_id}`,
        video_far: `https://video.xinghao998.top/index.html?tableVideo=sicbo_${this.gameParams.table_id}_wide`,
        time_start: 45,
        right_money_banker_player: 50000,
        right_money_tie: 10000
      }
      
      console.log('🔄 使用默认台桌信息:', defaultTableInfo)
      return defaultTableInfo
    }
  }

  /**
   * 获取用户信息 - 修复接口路径
   */
  async getUserInfo(): Promise<UserInfo> {
    try {
      console.log('👤 获取用户信息...', { user_id: this.gameParams.user_id })
      
      // 修复: 使用正确的 sicbo 用户信息接口路径
      const response = await httpClient.get<UserInfo>('/sicbo/user/info', {
        user_id: this.gameParams.user_id
      })

      console.log('✅ 用户信息获取成功:', response)
      return response
      
    } catch (error) {
      console.warn('⚠️ 用户信息获取失败，使用默认配置:', error)
      
      // 返回默认用户信息
      const defaultUserInfo: UserInfo = {
        user_id: this.gameParams.user_id,
        balance: 10000,
        currency: 'CNY'
      }
      
      console.log('🔄 使用默认用户信息:', defaultUserInfo)
      return defaultUserInfo
    }
  }

  /**
   * 提交投注 - 现在无需手动添加token
   */
  async placeBets(bets: BetRequest[]): Promise<BetResponse> {
    try {
      console.log('🎯 提交投注...', bets)
      
      const requestData = {
        table_id: parseInt(this.gameParams.table_id),
        game_type: parseInt(this.gameParams.game_type),
        is_exempt: 0,
        bet: bets
      }

      // token会由httpClient自动添加到headers中
      const response = await httpClient.post<BetResponse>('/sicbo/bet/order', requestData)

      console.log('✅ 投注提交成功:', response)
      return response
      
    } catch (error: any) {
      console.error('❌ 投注提交失败:', error)
      
      // 根据错误类型抛出具体错误
      if (error.message?.includes('balance')) {
        throw new Error('余额不足')
      } else if (error.message?.includes('token') || error.code === 'UNAUTHORIZED') {
        throw new Error('登录状态已过期')
      } else if (error.message?.includes('bet')) {
        throw new Error('投注参数无效')
      } else {
        throw new Error('投注失败，请重试')
      }
    }
  }

  /**
   * 获取当前投注记录
   */
  async getCurrentBets(): Promise<any> {
    try {
      console.log('📋 获取当前投注记录...')
      
      const response = await httpClient.post('/sicbo/current/record', {
        id: parseInt(this.gameParams.table_id)
      })

      console.log('✅ 投注记录获取成功:', response)
      return response
      
    } catch (error) {
      console.error('❌ 获取投注记录失败:', error)
      return { is_exempt: 0, record_list: [] }
    }
  }

  /**
   * 获取露珠数据
   */
  async getRoadmapData(): Promise<any> {
    try {
      console.log('🛣️ 获取露珠数据...')
      
      const response = await httpClient.get('/sicbo/get_table/get_data', {
        tableId: this.gameParams.table_id,
        xue: 1,
        gameType: this.gameParams.game_type
      })

      console.log('✅ 露珠数据获取成功:', response)
      return response
      
    } catch (error) {
      console.error('❌ 获取露珠数据失败:', error)
      return {}
    }
  }

  /**
   * 更新游戏参数
   */
  updateGameParams(newParams: Partial<GameParams>): void {
    this.gameParams = { ...this.gameParams, ...newParams }
    
    // 如果token变更，更新全局token
    if (newParams.token) {
      setAuthToken(newParams.token)
    }
    
    console.log('🔄 游戏参数已更新:', this.gameParams)
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
  console.log('🌐 全局API服务已设置')
}

export const getGlobalApiService = (): GameApiService => {
  if (!globalApiService) {
    throw new Error('API服务未初始化，请先调用 setGlobalApiService')
  }
  return globalApiService
}

// 快捷方法
export const initializeGameApi = async (params: GameParams) => {
  console.log('🚀 初始化游戏API服务...')
  
  const apiService = createGameApiService(params)
  setGlobalApiService(apiService)
  
  try {
    // 获取基础信息
    const [tableInfo, userInfo] = await Promise.all([
      apiService.getTableInfo(),
      apiService.getUserInfo()
    ])
    
    console.log('✅ 游戏API初始化完成:', {
      tableInfo,
      userInfo
    })
    
    return {
      apiService,
      tableInfo,
      userInfo
    }
    
  } catch (error) {
    console.error('❌ 游戏API初始化失败:', error)
    throw error
  }
}