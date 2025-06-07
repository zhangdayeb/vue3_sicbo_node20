// src/services/websocket.ts
import type { 
  GameParams,
  WSMessage,
  WSConnectionStatus,
  JoinTableData,
  HeartbeatData,
  TableJoinedData,
  NewGameStartedData,
  GameStatusChangeData,
  CountdownTickData,
  GameResultData,
  BalanceUpdateData,
  HeartbeatResponseData,
  WSErrorData
} from '@/types/api'

export type WSEventCallback<T = any> = (data: T) => void

export class GameWebSocketService {
  private ws: WebSocket | null = null
  private gameParams: GameParams
  private wsURL: string
  private connectionStatus: WSConnectionStatus = 'disconnected'
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectInterval = 1000
  private heartbeatInterval: number | null = null
  private heartbeatTimeout: number | null = null
  private eventListeners: Map<string, Set<WSEventCallback>> = new Map()
  
  // 配置
  private readonly HEARTBEAT_INTERVAL = 30000 // 30秒
  private readonly HEARTBEAT_TIMEOUT = 10000  // 10秒超时
  private readonly CONNECTION_TIMEOUT = 10000 // 10秒连接超时

  constructor(params: GameParams) {
    this.gameParams = params
    this.wsURL = this.buildWSURL()
    this.initEventListeners()
  }

  /**
   * 构建WebSocket连接URL
   */
  private buildWSURL(): string {
    const baseURL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001/ws'
    const params = new URLSearchParams({
      table_id: this.gameParams.table_id,
      user_id: this.gameParams.user_id,
      token: this.gameParams.token
    })
    
    return `${baseURL}?${params.toString()}`
  }

  /**
   * 初始化事件监听器映射
   */
  private initEventListeners(): void {
    const events = [
      'table_joined',
      'new_game_started', 
      'game_status_change',
      'countdown_tick',
      'game_result',
      'balance_update',
      'heartbeat_response',
      'error',
      'connected',
      'disconnected',
      'reconnecting'
    ]
    
    events.forEach(event => {
      this.eventListeners.set(event, new Set())
    })
  }

  /**
   * 连接WebSocket
   */
  async connect(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('🔌 WebSocket已连接')
      return
    }

    return new Promise((resolve, reject) => {
      console.log('🔌 正在连接WebSocket...', this.wsURL)
      
      this.setConnectionStatus('connecting')
      this.ws = new WebSocket(this.wsURL)
      
      // 连接超时处理
      const connectTimeout = setTimeout(() => {
        if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
          this.ws.close()
          reject(new Error('WebSocket连接超时'))
        }
      }, this.CONNECTION_TIMEOUT)

      this.ws.onopen = () => {
        clearTimeout(connectTimeout)
        console.log('✅ WebSocket连接成功')
        
        this.setConnectionStatus('connected')
        this.reconnectAttempts = 0
        this.startHeartbeat()
        this.sendJoinTable()
        
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
        console.error('❌ WebSocket错误:', error)
        this.setConnectionStatus('error')
        reject(error)
      }
    })
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    console.log('🔌 主动断开WebSocket连接')
    
    this.stopHeartbeat()
    
    if (this.ws) {
      this.ws.onclose = null // 防止触发重连
      this.ws.close()
      this.ws = null
    }
    
    this.setConnectionStatus('disconnected')
  }

  /**
   * 处理连接关闭
   */
  private handleClose(event: CloseEvent): void {
    console.log('🔌 WebSocket连接关闭:', event.code, event.reason)
    
    this.stopHeartbeat()
    this.setConnectionStatus('disconnected')
    this.emit('disconnected', { code: event.code, reason: event.reason })
    
    // 如果不是主动关闭，尝试重连
    if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnect()
    }
  }

  /**
   * 计划重连
   */
  private scheduleReconnect(): void {
    this.reconnectAttempts++
    const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1) // 指数退避
    
    console.log(`🔄 ${delay}ms后尝试第${this.reconnectAttempts}次重连...`)
    this.setConnectionStatus('reconnecting')
    this.emit('reconnecting', { attempt: this.reconnectAttempts, delay })
    
    setTimeout(() => {
      if (this.connectionStatus === 'reconnecting') {
        this.connect().catch((error) => {
          console.error('❌ 重连失败:', error)
          
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect()
          } else {
            console.error('❌ 达到最大重连次数，停止重连')
            this.setConnectionStatus('error')
          }
        })
      }
    }, delay)
  }

  /**
   * 发送加入桌台消息
   */
  private sendJoinTable(): void {
    const message: WSMessage<JoinTableData> = {
      event: 'join_table',
      data: {
        table_id: this.gameParams.table_id,
        user_id: this.gameParams.user_id,
        token: this.gameParams.token
      }
    }
    
    this.send(message)
  }

  /**
   * 开始心跳
   */
  private startHeartbeat(): void {
    this.stopHeartbeat()
    
    this.heartbeatInterval = window.setInterval(() => {
      this.sendHeartbeat()
    }, this.HEARTBEAT_INTERVAL)
  }

  /**
   * 停止心跳
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
    
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout)
      this.heartbeatTimeout = null
    }
  }

  /**
   * 发送心跳
   */
  private sendHeartbeat(): void {
    const message: WSMessage<HeartbeatData> = {
      event: 'heartbeat',
      data: {
        timestamp: Date.now()
      }
    }
    
    this.send(message)
    
    // 设置心跳超时
    this.heartbeatTimeout = window.setTimeout(() => {
      console.warn('⚠️ 心跳超时，连接可能已断开')
      this.ws?.close()
    }, this.HEARTBEAT_TIMEOUT)
  }

  /**
   * 处理心跳响应
   */
  private handleHeartbeatResponse(data: HeartbeatResponseData): void {
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout)
      this.heartbeatTimeout = null
    }
    
    const latency = Date.now() - data.timestamp
    console.log(`💓 心跳响应，延迟: ${latency}ms`)
  }

  /**
   * 发送消息
   */
  private send(message: WSMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const messageStr = JSON.stringify(message)
      this.ws.send(messageStr)
      
      if (import.meta.env.DEV && message.event !== 'heartbeat') {
        console.log('📤 发送WebSocket消息:', message)
      }
    } else {
      console.warn('⚠️ WebSocket未连接，无法发送消息:', message)
    }
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message: WSMessage = JSON.parse(event.data)
      
      if (import.meta.env.DEV && message.event !== 'heartbeat_response') {
        console.log('📥 收到WebSocket消息:', message)
      }
      
      // 特殊处理心跳响应
      if (message.event === 'heartbeat_response') {
        this.handleHeartbeatResponse(message.data)
      }
      
      // 触发事件监听器
      this.emit(message.event, message.data)
      
    } catch (error) {
      console.error('❌ 解析WebSocket消息失败:', error, event.data)
    }
  }

  /**
   * 设置连接状态
   */
  private setConnectionStatus(status: WSConnectionStatus): void {
    const oldStatus = this.connectionStatus
    this.connectionStatus = status
    
    if (oldStatus !== status) {
      console.log(`🔌 WebSocket状态变更: ${oldStatus} -> ${status}`)
    }
  }

  /**
   * 触发事件
   */
  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`❌ 事件监听器执行失败 [${event}]:`, error)
        }
      })
    }
  }

  /**
   * 添加事件监听器
   */
  on<T = any>(event: string, callback: WSEventCallback<T>): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }
    this.eventListeners.get(event)!.add(callback)
  }

  /**
   * 移除事件监听器
   */
  off<T = any>(event: string, callback: WSEventCallback<T>): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.delete(callback)
    }
  }

  /**
   * 移除所有事件监听器
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.eventListeners.get(event)?.clear()
    } else {
      this.eventListeners.forEach(listeners => listeners.clear())
    }
  }

  /**
   * 获取连接状态
   */
  getConnectionStatus(): WSConnectionStatus {
    return this.connectionStatus
  }

  /**
   * 检查是否已连接
   */
  isConnected(): boolean {
    return this.connectionStatus === 'connected' && 
           this.ws?.readyState === WebSocket.OPEN
  }

  /**
   * 获取连接信息
   */
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

  /**
   * 更新游戏参数并重新连接
   */
  updateGameParams(newParams: Partial<GameParams>): void {
    this.gameParams = { ...this.gameParams, ...newParams }
    this.wsURL = this.buildWSURL()
    
    // 如果当前已连接，重新连接
    if (this.isConnected()) {
      this.disconnect()
      setTimeout(() => {
        this.connect()
      }, 1000)
    }
  }
}

// 创建WebSocket服务实例的工厂函数
export const createWebSocketService = (params: GameParams): GameWebSocketService => {
  return new GameWebSocketService(params)
}

// 全局WebSocket服务实例（在初始化后设置）
let globalWSService: GameWebSocketService | null = null

export const setGlobalWSService = (service: GameWebSocketService): void => {
  globalWSService = service
}

export const getGlobalWSService = (): GameWebSocketService => {
  if (!globalWSService) {
    throw new Error('WebSocket服务未初始化，请先调用 setGlobalWSService')
  }
  return globalWSService
}