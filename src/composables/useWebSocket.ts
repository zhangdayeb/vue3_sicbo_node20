// src/composables/useWebSocket.ts
import { ref, computed, onUnmounted, readonly } from 'vue'
import { GameWebSocketService } from '@/services/websocket'
import type { 
  GameParams,
  WSConnectionStatus,
  TableJoinedData,
  NewGameStartedData,
  GameStatusChangeData,
  CountdownTickData,
  GameResultData,
  BalanceUpdateData,
  WSErrorData
} from '@/types/api'

export interface UseWebSocketOptions {
  autoConnect?: boolean
  autoReconnect?: boolean
  onConnected?: () => void
  onDisconnected?: () => void
  onError?: (error: any) => void
}

export const useWebSocket = (
  gameParams: GameParams, 
  options: UseWebSocketOptions = {}
) => {
  // 默认选项
  const {
    autoConnect = true,
    autoReconnect = true,
    onConnected,
    onDisconnected,
    onError
  } = options

  // WebSocket服务实例
  const wsService = ref<GameWebSocketService | null>(null)
  
  // 连接状态
  const connectionStatus = ref<WSConnectionStatus>('disconnected')
  const isConnected = computed(() => connectionStatus.value === 'connected')
  const isConnecting = computed(() => connectionStatus.value === 'connecting')
  const isReconnecting = computed(() => connectionStatus.value === 'reconnecting')
  
  // 连接信息
  const reconnectAttempts = ref(0)
  const lastError = ref<string | null>(null)
  const latency = ref(0)
  
  // 游戏数据
  const tableInfo = ref<any>(null)
  const currentGame = ref<any>(null)
  const userBalance = ref<number>(0)
  const gameResults = ref<GameResultData[]>([])

  /**
   * 初始化WebSocket服务
   */
  const initWebSocket = () => {
    if (wsService.value) {
      wsService.value.disconnect()
    }

    wsService.value = new GameWebSocketService(gameParams)
    setupEventListeners()

    if (autoConnect) {
      connect()
    }
  }

  /**
   * 设置事件监听器
   */
  const setupEventListeners = () => {
    if (!wsService.value) return

    // 连接状态事件
    wsService.value.on('connected', () => {
      connectionStatus.value = 'connected'
      lastError.value = null
      onConnected?.()
    })

    wsService.value.on('disconnected', () => {
      connectionStatus.value = 'disconnected'
      onDisconnected?.()
    })

    wsService.value.on('reconnecting', (data: { attempt: number; delay: number }) => {
      connectionStatus.value = 'reconnecting'
      reconnectAttempts.value = data.attempt
    })

    // 游戏事件
    wsService.value.on<TableJoinedData>('table_joined', (data) => {
      console.log('🎲 成功加入桌台:', data)
      
      tableInfo.value = data.table_info
      currentGame.value = data.current_game
      userBalance.value = data.user_balance
    })

    wsService.value.on<NewGameStartedData>('new_game_started', (data) => {
      console.log('🆕 新游戏开始:', data)
      currentGame.value = data
    })

    wsService.value.on<GameStatusChangeData>('game_status_change', (data) => {
      console.log('🔄 游戏状态变化:', data)
      
      if (currentGame.value) {
        currentGame.value.status = data.status
        currentGame.value.countdown = data.countdown
      }
    })

    wsService.value.on<CountdownTickData>('countdown_tick', (data) => {
      if (currentGame.value) {
        currentGame.value.countdown = data.countdown
        currentGame.value.status = data.status
      }
    })

    wsService.value.on<GameResultData>('game_result', (data) => {
      console.log('🎯 游戏结果:', data)
      
      // 保存游戏结果到历史
      gameResults.value.unshift(data)
      // 只保留最近20条记录
      if (gameResults.value.length > 20) {
        gameResults.value = gameResults.value.slice(0, 20)
      }
    })

    wsService.value.on<BalanceUpdateData>('balance_update', (data) => {
      console.log('💰 余额更新:', data)
      userBalance.value = data.balance
    })

    wsService.value.on<WSErrorData>('error', (data) => {
      console.error('❌ WebSocket错误:', data)
      lastError.value = data.message
      onError?.(data)
    })
  }

  /**
   * 连接WebSocket
   */
  const connect = async (): Promise<void> => {
    if (!wsService.value) {
      initWebSocket()
    }

    try {
      connectionStatus.value = 'connecting'
      await wsService.value!.connect()
    } catch (error: any) {
      connectionStatus.value = 'error'
      lastError.value = error.message || '连接失败'
      onError?.(error)
      throw error
    }
  }

  /**
   * 断开连接
   */
  const disconnect = (): void => {
    wsService.value?.disconnect()
    connectionStatus.value = 'disconnected'
  }

  /**
   * 重新连接
   */
  const reconnect = async (): Promise<void> => {
    disconnect()
    await new Promise(resolve => setTimeout(resolve, 1000))
    await connect()
  }

  /**
   * 获取连接信息
   */
  const getConnectionInfo = () => {
    return wsService.value?.getConnectionInfo() || {
      status: 'disconnected',
      url: '',
      reconnectAttempts: 0,
      isConnected: false
    }
  }

  /**
   * 添加事件监听器
   */
  const on = <T = any>(event: string, callback: (data: T) => void): void => {
    wsService.value?.on(event, callback)
  }

  /**
   * 移除事件监听器
   */
  const off = <T = any>(event: string, callback: (data: T) => void): void => {
    wsService.value?.off(event, callback)
  }

  /**
   * 更新游戏参数
   */
  const updateGameParams = (newParams: Partial<GameParams>): void => {
    Object.assign(gameParams, newParams)
    wsService.value?.updateGameParams(newParams)
  }

  /**
   * 获取延迟信息
   */
  const measureLatency = (): Promise<number> => {
    return new Promise((resolve) => {
      const startTime = Date.now()
      
      const handleHeartbeat = () => {
        const endTime = Date.now()
        const currentLatency = endTime - startTime
        latency.value = currentLatency
        wsService.value?.off('heartbeat_response', handleHeartbeat)
        resolve(currentLatency)
      }
      
      wsService.value?.on('heartbeat_response', handleHeartbeat)
      
      // 发送心跳消息（如果需要手动触发）
      // wsService.value?.sendHeartbeat()
    })
  }

  /**
   * 获取统计信息
   */
  const getStats = () => ({
    connectionStatus: connectionStatus.value,
    reconnectAttempts: reconnectAttempts.value,
    latency: latency.value,
    gameResultsCount: gameResults.value.length,
    userBalance: userBalance.value,
    lastError: lastError.value
  })

  // 自动初始化
  initWebSocket()

  // 组件卸载时清理
  onUnmounted(() => {
    wsService.value?.removeAllListeners()
    wsService.value?.disconnect()
  })

  return {
    // 状态
    connectionStatus: readonly(connectionStatus),
    isConnected,
    isConnecting,
    isReconnecting,
    reconnectAttempts: readonly(reconnectAttempts),
    lastError: readonly(lastError),
    latency: readonly(latency),
    
    // 游戏数据
    tableInfo: readonly(tableInfo),
    currentGame: readonly(currentGame),
    userBalance: readonly(userBalance),
    gameResults: readonly(gameResults),
    
    // 方法
    connect,
    disconnect,
    reconnect,
    on,
    off,
    updateGameParams,
    measureLatency,
    getConnectionInfo,
    getStats,
    
    // 原始服务实例（用于高级操作）
    wsService: readonly(wsService)
  }
}

// 类型导出
export type UseWebSocketReturn = ReturnType<typeof useWebSocket>