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
  validateCurrentGameType,
  isSicBoGame,
  getGameTypeDescription,
  logGameParams 
} from '@/utils/urlParams'
import { ENV_CONFIG, isDev, validateApiConnection, logConnectionTest } from '@/utils/envUtils'
import type { 
  GameParams, 
  UserInfo, 
  BetResponseData,
  WSConnectionStatus,
  TableJoinedData,
  NewGameStartedData,
  GameStatusChangeData,
  CountdownTickData,
  GameResultData,
  BalanceUpdateData,
  WSErrorData
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
  enableVibration?: boolean
  debugMode?: boolean
  skipGameTypeValidation?: boolean
}

export const useGameLifecycle = (options: GameLifecycleOptions = {}) => {
  const {
    autoInitialize = true,
    enableAudio = true,
    enableVibration = true,
    debugMode = ENV_CONFIG.DEBUG_MODE,
    skipGameTypeValidation = false
  } = options

  // Store 引用
  const bettingStore = useBettingStore()
  const gameStore = useGameStore()
  const { playSound, playWinSound, unlockAudioContext } = useAudio()

  // 游戏参数
  const gameParams = ref<GameParams>({ table_id: '', game_type: '', user_id: '', token: '' })
  
  // 服务实例
  const apiService = ref<GameApiService | null>(null)
  const wsService = ref<ReturnType<typeof useWebSocket> | null>(null)

  // 游戏生命周期状态
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

  // 性能监控
  const performanceMetrics = reactive({
    initializationTime: 0,
    apiLatency: 0,
    wsLatency: 0,
    errorCount: 0,
    reconnectCount: 0
  })

  // 计算属性
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

  const initializationWarnings = computed(() => {
    const warnings: string[] = []
    
    if (!lifecycleState.gameTypeValidation.isValid) {
      warnings.push(lifecycleState.gameTypeValidation.error || '游戏类型不匹配')
    }
    
   
    if (debugMode) {
      warnings.push('调试模式已启用')
    }
    
    return warnings
  })

  /**
   * 调试日志
   */
  const debugLog = (message: string, data?: any) => {
    if (debugMode) {
      if (data) {
        console.log(`[GameLifecycle] ${message}`, data)
      } else {
        console.log(`[GameLifecycle] ${message}`)
      }
    }
  }

  /**
   * 设置错误状态
   */
  const setError = (error: string | Error) => {
    const errorMessage = error instanceof Error ? error.message : error
    lifecycleState.error = errorMessage
    performanceMetrics.errorCount++
    debugLog('设置错误状态', errorMessage)
  }

  /**
   * 清除错误状态
   */
  const clearError = () => {
    lifecycleState.error = null
  }

  /**
   * 初始化游戏生命周期
   */
  const initialize = async (): Promise<void> => {
    const startTime = Date.now()
    debugLog('开始初始化游戏生命周期')
    
    try {
      lifecycleState.isLoading = true
      clearError()

      // 1. 解析和验证URL参数
      await parseAndValidateParams()

      // 2. 验证游戏类型匹配
      if (!skipGameTypeValidation) {
        validateGameTypeMatch()
      }

      // 3. 连接测试（开发环境）
      if (debugMode) {
        await logConnectionTest()
      }

      // 4. 如果开启Mock模式，跳过真实服务初始化
      await initializeProductionMode()

      // 5. 初始化游戏状态
      initializeGameStores()

      // 6. 启用音频（如果需要）
      if (enableAudio) {
        await initializeAudio()
      }

      lifecycleState.isInitialized = true
      performanceMetrics.initializationTime = Date.now() - startTime

      debugLog('游戏生命周期初始化完成', {
        duration: performanceMetrics.initializationTime,
        gameType: getGameTypeDescription(gameParams.value.game_type),
        warnings: initializationWarnings.value
      })

      // 输出初始化警告
      if (initializationWarnings.value.length > 0) {
        console.warn('⚠️ 初始化警告:', initializationWarnings.value)
      }

    } catch (error: any) {
      setError(error)
      debugLog('初始化失败', error)
      throw error
    } finally {
      lifecycleState.isLoading = false
    }
  }

  /**
   * 解析和验证URL参数
   */
  const parseAndValidateParams = async (): Promise<void> => {
    debugLog('解析URL参数')
    
    // 解析URL参数
    gameParams.value = parseGameParams()
    
    // 输出调试信息
    if (debugMode) {
      logGameParams()
    }

    // 验证参数
    const validation = validateGameParams(gameParams.value)
    if (!validation.isValid) {
      const errorMsg = `URL参数无效: ${[...validation.missingParams, ...validation.errors].join(', ')}`
      throw new Error(errorMsg)
    }

    debugLog('URL参数验证通过', gameParams.value)
  }

  /**
   * 验证游戏类型匹配
   */
  const validateGameTypeMatch = (): void => {
    debugLog('验证游戏类型匹配')
    
    const validation = validateCurrentGameType()
    lifecycleState.gameTypeValidation = validation
    
    if (!validation.isValid) {
      const errorMsg = `游戏类型不匹配: 当前为${getGameTypeDescription(validation.currentType)}，期望骰宝游戏(ID:9)`
      console.warn('⚠️ 游戏类型警告:', errorMsg)
      
      // 在生产环境中，游戏类型不匹配应该是错误
      if (ENV_CONFIG.IS_PROD) {
        throw new Error(errorMsg)
      }
    } else {
      debugLog('游戏类型验证通过: 骰宝游戏')
    }
  }

  /**
   * 初始化生产模式
   */
  const initializeProductionMode = async (): Promise<void> => {
    debugLog('初始化生产模式')

    // 1. 验证API连接
    await validateApiConnectionAvailability()

    // 2. 创建API服务
    apiService.value = createGameApiService(gameParams.value)

    // 3. 获取用户信息
    await fetchUserInfo()

    // 4. 获取桌台信息
    await fetchTableInfo()

    // 5. 初始化WebSocket连接
    await initializeWebSocket()
  }

  /**
   * 验证API连接可用性
   */
  const validateApiConnectionAvailability = async (): Promise<void> => {
    debugLog('验证API连接可用性')
    
    try {
      const result = await validateApiConnection()
      if (!result.isValid) {
        throw new Error(result.error || 'API连接验证失败')
      }
      
      debugLog(`API连接验证通过 (${result.latency}ms)`)
    } catch (error) {
      debugLog('API连接验证失败', error)
      throw new Error('无法连接到游戏服务器，请检查网络连接')
    }
  }

  /**
   * 获取用户信息
   */
  const fetchUserInfo = async (): Promise<void> => {
    const startTime = Date.now()
    debugLog('获取用户信息')

    try {
      const userInfo = await apiService.value!.getUserInfo()
      lifecycleState.userInfo = userInfo
      performanceMetrics.apiLatency = Date.now() - startTime
      debugLog('用户信息获取成功', userInfo)
    } catch (error) {
      debugLog('获取用户信息失败', error)
      throw new Error('获取用户信息失败，请检查账户状态或网络连接')
    }
  }

  /**
   * 获取桌台信息
   */
  const fetchTableInfo = async (): Promise<void> => {
    debugLog('获取桌台信息')

    try {
      const tableInfo = await apiService.value!.getTableInfo()
      lifecycleState.tableInfo = tableInfo
      debugLog('桌台信息获取成功', tableInfo)
    } catch (error) {
      debugLog('获取桌台信息失败，使用默认配置', error)
      // 使用默认配置，不抛出错误
      lifecycleState.tableInfo = {
        table_name: `骰宝${gameParams.value.table_id}号桌`,
        min_bet: 10,
        max_bet: 50000
      }
    }
  }

  /**
   * 初始化WebSocket连接
   */
  const initializeWebSocket = async (): Promise<void> => {
    debugLog('初始化WebSocket连接')

    wsService.value = useWebSocket(gameParams.value, {
      autoConnect: true,
      autoReconnect: true,
      onConnected: () => {
        lifecycleState.connectionStatus = 'connected'
        debugLog('WebSocket连接成功')
      },
      onDisconnected: () => {
        lifecycleState.connectionStatus = 'disconnected'
        debugLog('WebSocket连接断开')
      },
      onError: (error) => {
        lifecycleState.connectionStatus = 'error'
        debugLog('WebSocket连接错误', error)
      }
    })

    // 设置游戏事件监听器
    setupWebSocketEventListeners()

    // 等待连接建立
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
                           wsService.value.isConnected.value === true
        
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

  /**
   * 设置WebSocket事件监听器
   */
  const setupWebSocketEventListeners = (): void => {
    if (!wsService.value) return

    debugLog('设置WebSocket事件监听器')

    // 桌台加入确认
    wsService.value.on<TableJoinedData>('table_joined', (data) => {
      debugLog('收到桌台加入确认', data)
      
      lifecycleState.tableInfo = data.table_info
      lifecycleState.currentGame = data.current_game
      
      if (data.user_balance !== undefined) {
        lifecycleState.userInfo!.balance = data.user_balance
        bettingStore.updateBalance(data.user_balance)
      }
    })

    // 新游戏开始
    wsService.value.on<NewGameStartedData>('new_game_started', (data) => {
      debugLog('新游戏开始', data)
      
      lifecycleState.currentGame = {
        ...data,
        status: data.status,
        countdown: data.countdown
      }
      
      gameStore.updateGameNumber(data.game_number)
      gameStore.updateGameStatus(data.status)
      gameStore.updateCountdown(data.countdown)
      
      if (enableAudio) {
        playSound('new-game')
      }
    })

    // 游戏状态变化
    wsService.value.on<GameStatusChangeData>('game_status_change', (data) => {
      debugLog('游戏状态变化', data)
      
      if (lifecycleState.currentGame) {
        lifecycleState.currentGame.status = data.status
        lifecycleState.currentGame.countdown = data.countdown
      }
      
      gameStore.updateGameStatus(data.status)
      gameStore.updateCountdown(data.countdown)
      bettingStore.updateGamePhase(data.status as any)
      
      if (enableAudio) {
        switch (data.status) {
          case 'betting':
            playSound('betting-start')
            break
          case 'dealing':
            playSound('dealing-start')
            break
          case 'result':
            playSound('result-ready')
            break
        }
      }
    })

    // 倒计时更新
    wsService.value.on<CountdownTickData>('countdown_tick', (data) => {
      if (lifecycleState.currentGame) {
        lifecycleState.currentGame.countdown = data.countdown
      }
      
      gameStore.updateCountdown(data.countdown)
      
      if (enableAudio && data.countdown <= 5 && data.countdown > 0) {
        playSound('countdown-tick')
      }
    })

    // 游戏结果
    wsService.value.on<GameResultData>('game_result', (data) => {
      debugLog('游戏结果', data)
      
      lifecycleState.lastGameResult = data
      handleGameResult(data)
    })

    // 余额更新
    wsService.value.on<BalanceUpdateData>('balance_update', (data) => {
      debugLog('余额更新', data)
      
      if (lifecycleState.userInfo) {
        lifecycleState.userInfo.balance = data.balance
        bettingStore.updateBalance(data.balance)
      }
      
      if (enableAudio) {
        if (data.change > 0) {
          playWinSound('small')
        } else if (data.reason === 'bet_placed') {
          playSound('bet-placed')
        }
      }
    })

    // WebSocket错误
    wsService.value.on<WSErrorData>('error', (data) => {
      debugLog('WebSocket错误', data)
      setError(`WebSocket错误: ${data.message}`)
    })
  }

  /**
   * 处理游戏结果
   */
  const handleGameResult = (gameResult: GameResultData): void => {
    debugLog('处理游戏结果', gameResult)

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

  /**
   * 检查是否有中奖投注
   */
  const checkWinningBets = (bets: Record<string, number>, gameResult: GameResultData): boolean => {
    const { dice_results, total, is_big, is_odd } = gameResult
    
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
        default:
          break
      }
    }
    
    return false
  }

  /**
   * 初始化游戏状态存储
   */
  const initializeGameStores = (): void => {
    debugLog('初始化游戏状态存储')

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

  /**
   * 初始化音频
   */
  const initializeAudio = async (): Promise<void> => {
    debugLog('初始化音频系统')

    try {
      await unlockAudioContext()
      debugLog('音频系统初始化成功')
    } catch (error) {
      debugLog('音频系统初始化失败', error)
    }
  }

  /**
   * 提交投注
   */
  const submitBets = async (bets: Array<{ bet_type: string; amount: number }>): Promise<BetResponseData> => {
    debugLog('提交投注', bets)

    if (!canPlaceBets.value) {
      throw new Error('当前无法投注')
    }

      const startTime = Date.now()
      
      try {
        const result = await apiService.value!.placeBets(bets)
        performanceMetrics.apiLatency = Date.now() - startTime
        
        if (lifecycleState.userInfo) {
          lifecycleState.userInfo.balance = result.new_balance
          bettingStore.updateBalance(result.new_balance)
        }
        
        debugLog('投注提交成功', result)
        return result
      } catch (error) {
        debugLog('投注提交失败', error)
        throw error
      }
  }

  /**
   * 重新连接
   */
  const reconnect = async (): Promise<void> => {
    debugLog('重新连接')
    
    try {
      lifecycleState.connectionStatus = 'reconnecting'
      performanceMetrics.reconnectCount++
      
      if (wsService.value && typeof wsService.value.reconnect === 'function') {
          await wsService.value.reconnect()
        }
      
      clearError()
      debugLog('重新连接成功')
    } catch (error: any) {
      setError(error)
      debugLog('重新连接失败', error)
      throw error
    }
  }

  /**
   * 获取游戏统计信息
   */
  const getGameStats = () => ({
    ...performanceMetrics,
    isReady: isReady.value,
    canPlaceBets: canPlaceBets.value,
    gamePhase: lifecycleState.currentGame?.status,
    countdown: lifecycleState.currentGame?.countdown,
    userBalance: lifecycleState.userInfo?.balance,
    connectionStatus: lifecycleState.connectionStatus,
    gameTypeValidation: lifecycleState.gameTypeValidation,
    debugMode,
    envConfig: ENV_CONFIG,
    warnings: initializationWarnings.value
  })

  /**
   * 清理资源
   */
  const cleanup = (): void => {
    debugLog('清理游戏生命周期资源')
    
    if (wsService.value && typeof wsService.value.disconnect === 'function') {
      wsService.value.disconnect()
    }
    
    lifecycleState.isInitialized = false
    lifecycleState.connectionStatus = 'disconnected'
    
    debugLog('资源清理完成')
  }

  // 自动初始化
  if (autoInitialize) {
    onMounted(() => {
      initialize().catch(error => {
        console.error('游戏生命周期初始化失败:', error)
      })
    })
  }

  // 清理资源
  onUnmounted(() => {
    cleanup()
  })

  return {
    // 状态
    lifecycleState: readonly(lifecycleState),
    gameParams: readonly(gameParams),
    performanceMetrics: readonly(performanceMetrics),
    
    // 计算属性
    isReady,
    canPlaceBets,
    gamePhaseText,
    initializationWarnings,
    
    // 方法
    initialize,
    submitBets,
    reconnect,
    clearError,
    getGameStats,
    cleanup,
    
    // 服务实例访问
    apiService: readonly(apiService),
    wsService: readonly(wsService)
  }
}