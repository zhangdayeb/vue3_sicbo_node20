// src/composables/useGameLifecycle.ts
import { ref, computed, reactive, onMounted, onUnmounted, readonly } from 'vue'
import { useWebSocket } from './useWebSocket'
import { createGameApiService, GameApiService } from '@/services/gameApi'
import { useBettingStore } from '@/stores/bettingStore'
import { useGameStore } from '@/stores/gameStore'
import { useAudio } from './useAudio'
import { 
  parseGameParams, 
  validateGameParams, 
  validateCurrentGameType
} from '@/utils/urlParams'
import { ENV_CONFIG } from '@/utils/envUtils'
import type { 
  GameParams, 
  UserInfo, 
  BetResponseData,
  WSConnectionStatus,
  CountdownData,
  GameResultData,
  WinData,
  GameStatusData
} from '@/types/api'

export interface GameLifecycleState {
  isInitialized: boolean
  isLoading: boolean
  connectionStatus: WSConnectionStatus
  error: string | null
  userInfo: UserInfo | null
  tableInfo: any
  currentGame: any
  lastGameResult: GameResultData | null
  gameTypeValidation: {
    isValid: boolean
    currentType: string
    expectedType: string
    error?: string
  }
}

export interface GameLifecycleOptions {
  autoInitialize?: boolean
  enableAudio?: boolean
  skipGameTypeValidation?: boolean
}

export const useGameLifecycle = (options: GameLifecycleOptions = {}) => {
  const {
    autoInitialize = true,
    enableAudio = true,
    skipGameTypeValidation = false
  } = options

  const bettingStore = useBettingStore()
  const gameStore = useGameStore()
  const { playSound, playWinSound, unlockAudioContext } = useAudio()

  const gameParams = ref<GameParams>({ table_id: '', game_type: '', user_id: '', token: '' })
  const apiService = ref<GameApiService | null>(null)
  const wsService = ref<ReturnType<typeof useWebSocket> | null>(null)

  const lifecycleState = reactive<GameLifecycleState>({
    isInitialized: false,
    isLoading: false,
    connectionStatus: 'disconnected',
    error: null,
    userInfo: null,
    tableInfo: null,
    currentGame: null,
    lastGameResult: null,
    gameTypeValidation: {
      isValid: true,
      currentType: '',
      expectedType: '9'
    }
  })

  const isReady = computed(() => 
    lifecycleState.isInitialized && 
    lifecycleState.connectionStatus === 'connected' &&
    !lifecycleState.error &&
    lifecycleState.gameTypeValidation.isValid
  )

  const canPlaceBets = computed(() => 
    isReady.value && 
    lifecycleState.currentGame?.status === 'betting' &&
    lifecycleState.userInfo &&
    lifecycleState.userInfo.balance > 0
  )

  const gamePhaseText = computed(() => {
    const phaseMap: Record<string, string> = {
      'waiting': '等待开始',
      'betting': '投注进行中',
      'dealing': '开牌中',
      'result': '结果公布'
    }
    return phaseMap[lifecycleState.currentGame?.status] || '未知状态'
  })

  const setError = (error: string | Error) => {
    const errorMessage = error instanceof Error ? error.message : error
    lifecycleState.error = errorMessage
  }

  const clearError = () => {
    lifecycleState.error = null
  }

  const initialize = async (): Promise<void> => {
    try {
      lifecycleState.isLoading = true
      clearError()

      await parseAndValidateParams()

      if (!skipGameTypeValidation) {
        validateGameTypeMatch()
      }

      await initializeProductionMode()
      initializeGameStores()

      if (enableAudio) {
        await initializeAudio()
      }

      lifecycleState.isInitialized = true

    } catch (error: any) {
      setError(error)
      throw error
    } finally {
      lifecycleState.isLoading = false
    }
  }

  const parseAndValidateParams = async (): Promise<void> => {
    gameParams.value = parseGameParams()
    
    const validation = validateGameParams(gameParams.value)
    if (!validation.isValid) {
      const errorMsg = `URL参数无效: ${[...validation.missingParams, ...validation.errors].join(', ')}`
      throw new Error(errorMsg)
    }
  }

  const validateGameTypeMatch = (): void => {
    const validation = validateCurrentGameType()
    lifecycleState.gameTypeValidation = validation
    
    if (!validation.isValid) {
      const errorMsg = `游戏类型不匹配: 期望骰宝游戏(ID:9)`
      
      if (ENV_CONFIG.IS_PROD) {
        throw new Error(errorMsg)
      }
    }
  }

  const initializeProductionMode = async (): Promise<void> => {
    apiService.value = createGameApiService(gameParams.value)
    await fetchUserInfo()
    await fetchTableInfo()
    await initializeWebSocket()
  }

  const fetchUserInfo = async (): Promise<void> => {
    try {
      const userInfo = await apiService.value!.getUserInfo()
      lifecycleState.userInfo = userInfo
    } catch (error) {
      throw new Error('获取用户信息失败，请检查账户状态或网络连接')
    }
  }

  const fetchTableInfo = async (): Promise<void> => {
    try {
      const tableInfo = await apiService.value!.getTableInfo()
      lifecycleState.tableInfo = tableInfo
    } catch (error) {
      lifecycleState.tableInfo = {
        table_name: `骰宝${gameParams.value.table_id}号桌`,
        min_bet: 10,
        max_bet: 50000
      }
    }
  }

  const initializeWebSocket = async (): Promise<void> => {
    wsService.value = useWebSocket(gameParams.value, {
      autoConnect: true,
      onConnected: () => {
        lifecycleState.connectionStatus = 'connected'
      },
      onDisconnected: () => {
        lifecycleState.connectionStatus = 'disconnected'
      },
      onError: (error) => {
        lifecycleState.connectionStatus = 'error'
      }
    })

    setupWebSocketEventListeners()

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('WebSocket连接超时'))
      }, 10000)

      let checkCount = 0
      const maxChecks = 100

      const checkConnection = () => {
        checkCount++
        
        const wsConnected = wsService.value && 
                           wsService.value.isConnected && 
                           wsService.value.isConnected === true
        
        const localConnected = lifecycleState.connectionStatus === 'connected'
        
        if (wsConnected || localConnected) {
          clearTimeout(timeout)
          resolve()
        } else if (checkCount >= maxChecks) {
          clearTimeout(timeout)
          reject(new Error('WebSocket连接检查超过最大次数'))
        } else {
          setTimeout(checkConnection, 100)
        }
      }
      
      checkConnection()
    })
  }

  const setupWebSocketEventListeners = (): void => {
    if (!wsService.value) return

    wsService.value.on<CountdownData>('countdown', (data) => {
      lifecycleState.currentGame = {
        ...lifecycleState.currentGame,
        countdown: data.countdown,
        status: data.status,
        game_number: data.game_number
      }
      
      gameStore.updateGameNumber(data.game_number)
      gameStore.updateGameStatus(data.status)
      gameStore.updateCountdown(data.countdown)
      
      if (enableAudio && data.countdown <= 5 && data.countdown > 0) {
        playSound('countdown-tick')
      }
    })

    wsService.value.on<GameResultData>('game_result', (data) => {
      lifecycleState.lastGameResult = data
      handleGameResult(data)
    })

    wsService.value.on<WinData>('win_data', (data) => {
      if (enableAudio && data.win_amount > 0) {
        playWinSound('medium')
      }
    })

    wsService.value.on<GameStatusData>('game_status', (data) => {
      if (enableAudio) {
        switch (data.status) {
          case 'betting':
            playSound('betting-start')
            break
          case 'dealing':
            playSound('dealing-start')
            break
        }
      }
    })

    wsService.value.on('balance_update', (data) => {
      if (lifecycleState.userInfo) {
        lifecycleState.userInfo.balance = data.balance
        bettingStore.updateBalance(data.balance)
      }
    })

    wsService.value.on('error', (data) => {
      setError(`WebSocket错误: ${data.message}`)
    })
  }

  const handleGameResult = (gameResult: GameResultData): void => {
    const currentBets = { ...bettingStore.currentBets }
    if (Object.keys(currentBets).length > 0) {
      if (enableAudio) {
        setTimeout(() => {
          const hasWinningBets = checkWinningBets(currentBets, gameResult)
          if (hasWinningBets) {
            playWinSound('medium')
          } else {
            playSound('lose')
          }
        }, 1000)
      }
    }

    setTimeout(() => {
      bettingStore.clearBets()
    }, 3000)
  }

  const checkWinningBets = (bets: Record<string, number>, gameResult: GameResultData): boolean => {
    const { is_big, is_odd } = gameResult
    
    for (const betType of Object.keys(bets)) {
      switch (betType) {
        case 'small':
          if (!is_big) return true
          break
        case 'big':
          if (is_big) return true
          break
        case 'odd':
          if (is_odd) return true
          break
        case 'even':
          if (!is_odd) return true
          break
      }
    }
    
    return false
  }

  const initializeGameStores = (): void => {
    bettingStore.init()
    if (lifecycleState.userInfo) {
      bettingStore.updateBalance(lifecycleState.userInfo.balance)
    }

    if (lifecycleState.tableInfo) {
      gameStore.settings.tableName = lifecycleState.tableInfo.table_name
      gameStore.settings.limits.min = lifecycleState.tableInfo.min_bet
      gameStore.settings.limits.max = lifecycleState.tableInfo.max_bet
    }

    if (lifecycleState.currentGame) {
      gameStore.updateGameNumber(lifecycleState.currentGame.game_number)
      gameStore.updateGameStatus(lifecycleState.currentGame.status)
      gameStore.updateCountdown(lifecycleState.currentGame.countdown)
    }
  }

  const initializeAudio = async (): Promise<void> => {
    try {
      await unlockAudioContext()
    } catch (error) {
      // 静默处理音频初始化失败
    }
  }

  const submitBets = async (bets: Array<{ bet_type: string; amount: number }>): Promise<BetResponseData> => {
    if (!canPlaceBets.value) {
      throw new Error('当前无法投注')
    }

    try {
      const result = await apiService.value!.placeBets(bets)
      
      if (lifecycleState.userInfo) {
        lifecycleState.userInfo.balance = result.new_balance
        bettingStore.updateBalance(result.new_balance)
      }
      
      return result
    } catch (error) {
      throw error
    }
  }

  const reconnect = async (): Promise<void> => {
    try {
      lifecycleState.connectionStatus = 'reconnecting'
      
      if (wsService.value && typeof wsService.value.reconnect === 'function') {
        await wsService.value.reconnect()
      }
      
      clearError()
    } catch (error: any) {
      setError(error)
      throw error
    }
  }

  const cleanup = (): void => {
    if (wsService.value && typeof wsService.value.disconnect === 'function') {
      wsService.value.disconnect()
    }
    
    lifecycleState.isInitialized = false
    lifecycleState.connectionStatus = 'disconnected'
  }

  if (autoInitialize) {
    onMounted(() => {
      initialize().catch(error => {
        console.error('游戏生命周期初始化失败:', error)
      })
    })
  }

  onUnmounted(() => {
    cleanup()
  })

  return {
    lifecycleState: readonly(lifecycleState),
    gameParams: readonly(gameParams),
    
    isReady,
    canPlaceBets,
    gamePhaseText,
    
    initialize,
    submitBets,
    reconnect,
    clearError,
    cleanup,
    
    apiService: readonly(apiService),
    wsService: readonly(wsService)
  }
}