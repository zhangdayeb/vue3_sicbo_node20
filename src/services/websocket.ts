// src/services/websocket.ts
import type { 
  GameParams,
  WSConnectionStatus
} from '@/types/api'

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

export type WSEventCallback<T = any> = (data: T) => void

export class GameWebSocketService {
  private ws: WebSocket | null = null
  private gameParams: GameParams
  private wsURL: string
  private connectionStatus: WSConnectionStatus = 'disconnected'
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectInterval = 3000
  private heartbeatInterval: number | null = null
  private eventListeners: Map<string, Set<WSEventCallback>> = new Map()
  private isManualDisconnect = false

  private readonly HEARTBEAT_INTERVAL = 30000

  constructor(params: GameParams) {
    this.gameParams = params
    this.wsURL = this.buildWSURL()
    this.initEventListeners()
  }

  private buildWSURL(): string {
    const baseURL = import.meta.env.VITE_WS_URL || 'wss://wsssicbo.wuming888.com'
    return baseURL
  }

  private initEventListeners(): void {
    const events = [
      'countdown',
      'game_result', 
      'win_data',
      'game_status',
      'connected',
      'disconnected',
      'reconnecting',
      'error'
    ]
    
    events.forEach(event => {
      this.eventListeners.set(event, new Set())
    })
  }

  async connect(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return
    }

    return new Promise((resolve, reject) => {
      this.setConnectionStatus('connecting')
      this.isManualDisconnect = false
      this.ws = new WebSocket(this.wsURL)
      
      const connectTimeout = setTimeout(() => {
        if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
          this.ws.close()
          reject(new Error('WebSocket连接超时'))
        }
      }, 10000)

      this.ws.onopen = () => {
        clearTimeout(connectTimeout)
        this.setConnectionStatus('connected')
        this.reconnectAttempts = 0
        this.startHeartbeat()
        this.sendUserInfo()
        this.emit('connected', { timestamp: Date.now() })
        resolve()
      }

      this.ws.onmessage = (event) => {
        this.handleMessage(event)
      }

      this.ws.onclose = (event) => {
        clearTimeout(connectTimeout)
        this.handleClose(event)
      }

      this.ws.onerror = (error) => {
        clearTimeout(connectTimeout)
        this.setConnectionStatus('error')
        this.emit('error', { 
          message: 'WebSocket连接错误',
          originalError: error
        })
        reject(error)
      }
    })
  }

  disconnect(): void {
    this.isManualDisconnect = true
    this.stopHeartbeat()
    
    if (this.ws) {
      this.ws.onclose = null
      this.ws.close()
      this.ws = null
    }
    
    this.setConnectionStatus('disconnected')
  }

  private handleClose(event: CloseEvent): void {
    this.stopHeartbeat()
    this.setConnectionStatus('disconnected')
    this.emit('disconnected', { 
      code: event.code, 
      reason: event.reason
    })
    
    if (!this.isManualDisconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnect()
    }
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++
    const delay = Math.min(this.reconnectInterval * this.reconnectAttempts, 30000)
    
    this.setConnectionStatus('reconnecting')
    this.emit('reconnecting', { 
      attempt: this.reconnectAttempts, 
      delay
    })
    
    setTimeout(() => {
      if (this.connectionStatus === 'reconnecting' && !this.isManualDisconnect) {
        this.connect().catch(() => {})
      }
    }, delay)
  }

  private startHeartbeat(): void {
    this.stopHeartbeat()
    this.heartbeatInterval = window.setInterval(() => {
      this.sendHeartbeat()
    }, this.HEARTBEAT_INTERVAL)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  private sendUserInfo(): void {
    const message = JSON.stringify({
      user_id: this.gameParams.user_id,
      table_id: parseInt(this.gameParams.table_id),
      game_type: parseInt(this.gameParams.game_type)
    })
    this.send(message)
  }

  private sendHeartbeat(): void {
    this.send('ping')
  }

  private send(message: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(message)
    }
  }

  private handleMessage(event: MessageEvent): void {
    if (event.data === 'pong') {
      return
    }

    try {
      const rawData = JSON.parse(event.data)
      const parsedMessage = this.parseMessage(rawData)
      
      if (parsedMessage) {
        this.emit(parsedMessage.type, parsedMessage.data)
      }
    } catch (error) {
      this.emit('error', {
        message: '消息解析失败',
        originalData: event.data
      })
    }
  }

  private parseMessage(rawData: any): { type: string; data: any } | null {
    // 台桌状态推送 (倒计时)
    if (rawData.code === 200 && rawData.data?.table_run_info) {
      return {
        type: 'countdown',
        data: {
          countdown: rawData.data.table_run_info.end_time || 0,
          status: this.getGameStatus(rawData.data.table_run_info.run_status),
          game_number: rawData.data.table_run_info.bureau_number || ''
        } as CountdownData
      }
    }
    
    // 开牌结果推送
    if (rawData.code === 200 && rawData.data?.result_info) {
      const resultInfo = rawData.data.result_info
      const diceInfo = resultInfo.info || {}
      const dice1 = parseInt(diceInfo.dice1) || 0
      const dice2 = parseInt(diceInfo.dice2) || 0
      const dice3 = parseInt(diceInfo.dice3) || 0
      const total = dice1 + dice2 + dice3
      
      const gameResult = {
        type: 'game_result',
        data: {
          dice_results: [dice1, dice2, dice3] as [number, number, number],
          total: total,
          is_big: resultInfo.result?.basic_big === 1,
          is_small: resultInfo.result?.basic_small === 1,
          is_odd: resultInfo.result?.basic_odd === 1,
          is_even: resultInfo.result?.basic_even === 1,
          win_array: resultInfo.result?.win_array || [],
          game_number: rawData.data.bureau_number || ''
        } as GameResultData
      }
      
      // 如果有中奖金额，同时触发中奖数据
      if (resultInfo.money !== undefined) {
        setTimeout(() => {
          this.emit('win_data', {
            win_amount: resultInfo.money,
            game_number: rawData.data.bureau_number || ''
          } as WinData)
        }, 0)
      }
      
      return gameResult
    }
    
    // 洗牌状态推送
    if (rawData.code === 207) {
      return {
        type: 'game_status',
        data: {
          status: 'maintenance',
          message: rawData.msg || '洗牌中'
        } as GameStatusData
      }
    }
    
    // 用户下注推送 (余额变化)
    if (rawData.code === 209) {
      return {
        type: 'balance_update',
        data: {
          balance: rawData.data?.money_balance || 0,
          spend: rawData.data?.money_spend || 0
        }
      }
    }
    
    return null
  }

  private getGameStatus(runStatus: number): 'waiting' | 'betting' | 'dealing' | 'result' {
    switch (runStatus) {
      case 1: return 'betting'
      case 2: return 'dealing'
      case 3: return 'waiting'
      default: return 'waiting'
    }
  }

  private setConnectionStatus(status: WSConnectionStatus): void {
    this.connectionStatus = status
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          // 静默处理监听器错误
        }
      })
    }
  }

  on<T = any>(event: string, callback: WSEventCallback<T>): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }
    this.eventListeners.get(event)!.add(callback)
  }

  off<T = any>(event: string, callback: WSEventCallback<T>): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.delete(callback)
    }
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.eventListeners.get(event)?.clear()
    } else {
      this.eventListeners.forEach(listeners => listeners.clear())
    }
  }

  getConnectionStatus(): WSConnectionStatus {
    return this.connectionStatus
  }

  isConnected(): boolean {
    return this.connectionStatus === 'connected' && 
           this.ws?.readyState === WebSocket.OPEN
  }

  getConnectionInfo(): {
    status: WSConnectionStatus
    url: string
    reconnectAttempts: number
    isConnected: boolean
  } {
    return {
      status: this.connectionStatus,
      url: this.wsURL,
      reconnectAttempts: this.reconnectAttempts,
      isConnected: this.isConnected()
    }
  }

  async reconnect(): Promise<void> {
    this.disconnect()
    await new Promise(resolve => setTimeout(resolve, 1000))
    this.reconnectAttempts = 0
    await this.connect()
  }

  updateGameParams(newParams: Partial<GameParams>): void {
    this.gameParams = { ...this.gameParams, ...newParams }
    this.wsURL = this.buildWSURL()
    
    if (this.isConnected()) {
      this.reconnect()
    }
  }
}

export const createWebSocketService = (params: GameParams): GameWebSocketService => {
  return new GameWebSocketService(params)
}

let globalWSService: GameWebSocketService | null = null

export const setGlobalWSService = (service: GameWebSocketService): void => {
  globalWSService = service
}

export const getGlobalWSService = (): GameWebSocketService => {
  if (!globalWSService) {
    throw new Error('WebSocket服务未初始化')
  }
  return globalWSService
}