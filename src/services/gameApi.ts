// src/services/gameApi.ts
import { httpClient } from './httpClient'
import type { 
  GameParams, 
  UserInfo, 
  BetSubmission, 
  BetResponseData 
} from '@/types/api'

export class GameApiService {
  private gameParams: GameParams

  constructor(params: GameParams) {
    this.gameParams = params
  }

  /**
   * 获取用户信息和余额
   */
  async getUserInfo(): Promise<UserInfo> {
    try {
      console.log('📡 获取用户信息...')
      
      const userInfo = await httpClient.get<UserInfo>('/user/info', {
        user_id: this.gameParams.user_id,
        token: this.gameParams.token
      })

      console.log('✅ 用户信息获取成功:', userInfo)
      return userInfo
    } catch (error) {
      console.error('❌ 获取用户信息失败:', error)
      throw new Error('获取用户信息失败，请刷新页面重试')
    }
  }

  /**
   * 提交投注
   */
  async placeBets(bets: Array<{ bet_type: string; amount: number }>): Promise<BetResponseData> {
    try {
      console.log('🎯 提交投注...', bets)
      
      // 构造投注请求
      const betSubmission: BetSubmission = {
        table_id: this.gameParams.table_id,
        game_number: '', // 会由前端在调用时设置当前局号
        user_id: this.gameParams.user_id,
        bets: bets,
        token: this.gameParams.token
      }

      const result = await httpClient.post<BetResponseData>('/game/bet', betSubmission)

      console.log('✅ 投注提交成功:', result)
      return result
    } catch (error: any) {
      console.error('❌ 投注提交失败:', error)
      
      // 根据错误类型返回不同的错误信息
      if (error.code === 'INSUFFICIENT_BALANCE') {
        throw new Error('余额不足，请充值后再试')
      } else if (error.code === 'BETTING_CLOSED') {
        throw new Error('投注已截止，请等待下一局')
      } else if (error.code === 'INVALID_BET_TYPE') {
        throw new Error('无效的投注类型')
      } else if (error.code === 'BET_AMOUNT_INVALID') {
        throw new Error('投注金额无效')
      } else if (error.code === 'INVALID_TOKEN') {
        throw new Error('登录状态已过期，请重新进入')
      } else {
        throw new Error(error.message || '投注失败，请重试')
      }
    }
  }

  /**
   * 获取桌台信息（可选）
   */
  async getTableInfo(): Promise<{
    table_id: string
    table_name: string
    min_bet: number
    max_bet: number
    status: 'active' | 'maintenance'
  }> {
    try {
      console.log('🎲 获取桌台信息...')
      
      const tableInfo = await httpClient.get('/table/info', {
        table_id: this.gameParams.table_id,
        token: this.gameParams.token
      })

      console.log('✅ 桌台信息获取成功:', tableInfo)
      return tableInfo
    } catch (error) {
      console.error('❌ 获取桌台信息失败:', error)
      
      // 返回默认桌台信息
      return {
        table_id: this.gameParams.table_id,
        table_name: `骰宝${this.gameParams.table_id}号桌`,
        min_bet: 10,
        max_bet: 50000,
        status: 'active'
      }
    }
  }

  /**
   * 验证Token有效性（可选）
   */
  async validateToken(): Promise<boolean> {
    try {
      console.log('🔐 验证Token有效性...')
      
      await httpClient.get('/auth/validate', {
        user_id: this.gameParams.user_id,
        token: this.gameParams.token
      })

      console.log('✅ Token验证成功')
      return true
    } catch (error) {
      console.error('❌ Token验证失败:', error)
      return false
    }
  }

  /**
   * 获取投注限额（可选）
   */
  async getBetLimits(): Promise<Record<string, { min: number; max: number }>> {
    try {
      console.log('📊 获取投注限额...')
      
      const limits = await httpClient.get('/game/limits', {
        table_id: this.gameParams.table_id,
        user_id: this.gameParams.user_id,
        token: this.gameParams.token
      })

      console.log('✅ 投注限额获取成功:', limits)
      return limits
    } catch (error) {
      console.error('❌ 获取投注限额失败:', error)
      
      // 返回默认限额
      return {
        'small': { min: 10, max: 50000 },
        'big': { min: 10, max: 50000 },
        'odd': { min: 10, max: 50000 },
        'even': { min: 10, max: 50000 },
        'total-4': { min: 1, max: 1000 },
        'total-17': { min: 1, max: 1000 },
        'any-triple': { min: 1, max: 3000 }
      }
    }
  }

  /**
   * 获取当前游戏参数
   */
  getGameParams(): GameParams {
    return { ...this.gameParams }
  }

  /**
   * 更新游戏参数
   */
  updateGameParams(newParams: Partial<GameParams>): void {
    this.gameParams = { ...this.gameParams, ...newParams }
  }

  /**
   * 检查网络连接状态
   */
  async checkConnection(): Promise<boolean> {
    try {
      const startTime = Date.now()
      await httpClient.get('/health', {
        token: this.gameParams.token
      })
      const latency = Date.now() - startTime
      
      console.log(`🌐 网络连接正常，延迟: ${latency}ms`)
      return true
    } catch (error) {
      console.error('❌ 网络连接检查失败:', error)
      return false
    }
  }

  /**
   * 获取服务器时间（用于时间同步）
   */
  async getServerTime(): Promise<Date> {
    try {
      const response = await httpClient.get<{ timestamp: number }>('/time', {
        token: this.gameParams.token
      })
      
      return new Date(response.timestamp)
    } catch (error) {
      console.error('❌ 获取服务器时间失败:', error)
      // 返回本地时间
      return new Date()
    }
  }
}

// 创建API服务实例的工厂函数
export const createGameApiService = (params: GameParams): GameApiService => {
  return new GameApiService(params)
}

// 全局API服务实例（在初始化后设置）
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

// 快捷方法（使用全局实例）
export const getUserInfo = (): Promise<UserInfo> => {
  return getGlobalApiService().getUserInfo()
}

export const placeBets = (bets: Array<{ bet_type: string; amount: number }>): Promise<BetResponseData> => {
  return getGlobalApiService().placeBets(bets)
}

export const checkConnection = (): Promise<boolean> => {
  return getGlobalApiService().checkConnection()
}