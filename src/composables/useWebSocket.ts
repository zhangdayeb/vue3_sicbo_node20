// src/composables/useWebSocket.ts
import { ref, computed, onUnmounted, readonly } from 'vue'
import { GameWebSocketService } from '@/services/websocket'
import type { 
  GameParams,
  WSConnectionStatus,
  CountdownData,
  GameResultData,
  WinData,
  GameStatusData
} from '@/types/api'

export interface UseWebSocketOptions {
  autoConnect?: boolean
  onConnected?: () => void
  onDisconnected?: () => void
  onError?: (error: any) => void
}

export const useWebSocket = (
  gameParams: GameParams, 
  options: UseWebSocketOptions = {}
) => {
  const {
    autoConnect = true,
    onConnected,
    onDisconnected,
    onError
  } = options

  const wsService = ref<GameWebSocketService | null>(null)
  
  const connectionStatus = ref<WSConnectionStatus>('disconnected')
  const isConnected = computed(() => connectionStatus.value === 'connected')
  const isConnecting = computed(() => connectionStatus.value === 'connecting')
  const isReconnecting = computed(() => connectionStatus.value === 'reconnecting')
  
  const reconnectAttempts = ref(0)
  const lastError = ref<string | null>(null)
  
  const tableInfo = ref<any>(null)
  const currentGame = ref<any>(null)
  const userBalance = ref<number>(0)
  const gameResults = ref<GameResultData[]>([])

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

  const setupEventListeners = () => {
    if (!wsService.value) return

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

    wsService.value.on<CountdownData>('countdown', (data) => {
      if (currentGame.value) {
        currentGame.value.countdown = data.countdown
        currentGame.value.status = data.status
        currentGame.value.game_number = data.game_number
      } else {
        currentGame.value = {
          countdown: data.countdown,
          status: data.status,
          game_number: data.game_number
        }
      }
    })

    wsService.value.on<GameResultData>('game_result', (data) => {
      gameResults.value.unshift(data)
      if (gameResults.value.length > 20) {
        gameResults.value = gameResults.value.slice(0, 20)
      }
    })

    wsService.value.on<WinData>('win_data', (data) => {
      // 中奖数据处理
      console.log("================================中奖数据处理===================================================")
    })

    wsService.value.on<GameStatusData>('game_status', (data) => {
      // 游戏状态处理
    })

    wsService.value.on('balance_update', (data) => {
      userBalance.value = data.balance
    })

    wsService.value.on('error', (data) => {
      lastError.value = data.message
      onError?.(data)
    })
  }

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

  const disconnect = (): void => {
    wsService.value?.disconnect()
    connectionStatus.value = 'disconnected'
  }

  const reconnect = async (): Promise<void> => {
    disconnect()
    await new Promise(resolve => setTimeout(resolve, 1000))
    await connect()
  }

  const getConnectionInfo = () => {
    return wsService.value?.getConnectionInfo() || {
      status: 'disconnected',
      url: '',
      reconnectAttempts: 0,
      isConnected: false
    }
  }

  const on = <T = any>(event: string, callback: (data: T) => void): void => {
    wsService.value?.on(event, callback)
  }

  const off = <T = any>(event: string, callback: (data: T) => void): void => {
    wsService.value?.off(event, callback)
  }

  const updateGameParams = (newParams: Partial<GameParams>): void => {
    Object.assign(gameParams, newParams)
    wsService.value?.updateGameParams(newParams)
  }

  initWebSocket()

  onUnmounted(() => {
    wsService.value?.removeAllListeners()
    wsService.value?.disconnect()
  })

  return {
    connectionStatus: readonly(connectionStatus),
    isConnected,
    isConnecting,
    isReconnecting,
    reconnectAttempts: readonly(reconnectAttempts),
    lastError: readonly(lastError),
    
    tableInfo: readonly(tableInfo),
    currentGame: readonly(currentGame),
    userBalance: readonly(userBalance),
    gameResults: readonly(gameResults),
    
    connect,
    disconnect,
    reconnect,
    on,
    off,
    updateGameParams,
    getConnectionInfo,
    
    wsService: readonly(wsService)
  }
}

export type UseWebSocketReturn = ReturnType<typeof useWebSocket>