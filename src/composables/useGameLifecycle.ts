// src/composables/useGameLifecycle.ts
import { ref, computed, reactive, onMounted, onUnmounted, readonly } from 'vue'
import { useWebSocket } from './useWebSocket'
import { initializeGameApi, GameApiService } from '@/services/gameApi'
import { useBettingStore } from '@/stores/bettingStore'
import { useGameStore } from '@/stores/gameStore'
import { useAudio } from './useAudio'
import { 
  parseGameParams, 
  validateGameParams, 
  validateCurrentGameType,
  logGameParams
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
import type { TableInfo } from '@/services/gameApi'

export interface GameLifecycleState {
  isInitialized: boolean
  isLoading: boolean
  connectionStatus: WSConnectionStatus
  error: string | null
  userInfo: UserInfo | null
  tableInfo: TableInfo | null
  currentGame: any
  lastGameResult: GameResultData | null
  gameTypeValidation: {
    isValid: boolean
    currentType: string
    expectedType: string
    error?: string
  }
  // 新增初始化步骤状态
  initSteps: {
    urlParams: boolean
    httpApi: boolean
    websocket: boolean
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
    },
    initSteps: {
      urlParams: false,
      httpApi: false,
      websocket: false
    }
  })

  const isReady = computed(() => 
    lifecycleState.isInitialized && 
    lifecycleState.connectionStatus === 'connected' &&
    !lifecycleState.error &&
    lifecycleState.gameTypeValidation.isValid &&
    lifecycleState.initSteps.urlParams &&
    lifecycleState.initSteps.httpApi &&
    lifecycleState.initSteps.websocket
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

  /**
   * 🎯 阶段1: URL参数获取与验证
   */
  const initializeUrlParams = () => {
    console.log('\n📋 阶段1: URL参数解析与验证')
    console.log('=' .repeat(50))
    
    try {
      // 解析URL参数
      const params = parseGameParams()
      console.log('📡 解析URL参数:', params)
      
      // 验证参数
      const validation = validateGameParams(params)
      console.log('🔍 参数验证结果:', validation.isValid ? '✅ 通过' : '❌ 失败')
      
      if (!validation.isValid) {
        console.warn('❌ 缺少参数:', validation.missingParams)
        console.error('🚫 参数错误:', validation.errors)
        throw new Error(`URL参数无效: ${[...validation.missingParams, ...validation.errors].join(', ')}`)
      }
      
      // 游戏类型验证
      if (!skipGameTypeValidation) {
        const gameTypeValidation = validateCurrentGameType()
        lifecycleState.gameTypeValidation = gameTypeValidation
        console.log('🎲 游戏类型验证:', gameTypeValidation.isValid ? '✅ 骰宝匹配' : '❌ 类型不匹配')
        
        if (!gameTypeValidation.isValid) {
          console.warn('⚠️ 游戏类型警告:', gameTypeValidation.error)
          if (ENV_CONFIG.IS_PROD) {
            throw new Error(gameTypeValidation.error)
          }
        }
      }
      
      // 打印详细日志
      logGameParams()
      
      gameParams.value = params
      lifecycleState.initSteps.urlParams = true
      
      console.log('✅ 阶段1完成: URL参数解析成功')
      return { params, validation }
      
    } catch (error: any) {
      console.error('❌ 阶段1失败:', error.message)
      throw error
    }
  }

  /**
   * 🌐 阶段2: HTTP台桌信息获取
   */
  const initializeHttpApi = async () => {
    console.log('\n🌐 阶段2: HTTP API初始化')
    console.log('=' .repeat(50))
    
    try {
      console.log('🚀 初始化游戏API服务...')
      console.log('📊 请求参数:', {
        table_id: gameParams.value.table_id,
        game_type: gameParams.value.game_type,
        user_id: gameParams.value.user_id,
        token_length: gameParams.value.token.length
      })
      
      // 使用重写的API服务
      const apiResult = await initializeGameApi(gameParams.value)
      
      apiService.value = apiResult.apiService
      lifecycleState.tableInfo = apiResult.tableInfo
      lifecycleState.userInfo = apiResult.userInfo
      lifecycleState.initSteps.httpApi = true
      
      console.log('✅ 阶段2完成: HTTP API初始化成功')
      console.log('🏢 台桌信息:', lifecycleState.tableInfo)
      console.log('👤 用户信息:', lifecycleState.userInfo)
      
      return apiResult
      
    } catch (error: any) {
      console.error('❌ 阶段2失败:', error.message)
      throw error
    }
  }

  /**
   * 🔌 阶段3: WebSocket连接初始化
   */
  const initializeWebSocketConnection = async () => {
    console.log('\n🔌 阶段3: WebSocket连接初始化')
    console.log('=' .repeat(50))
    
    try {
      console.log('📡 WebSocket连接配置:', {
        wsURL: ENV_CONFIG.WS_URL,
        table_id: gameParams.value.table_id,
        game_type: gameParams.value.game_type,
        user_id: gameParams.value.user_id
      })
      
      // 创建WebSocket服务
      wsService.value = useWebSocket(gameParams.value, {
        autoConnect: true,
        onConnected: () => {
          console.log('🎉 WebSocket连接成功')
          lifecycleState.connectionStatus = 'connected'
          lifecycleState.initSteps.websocket = true
        },
        onDisconnected: () => {
          console.log('📡 WebSocket连接断开')
          lifecycleState.connectionStatus = 'disconnected'
          lifecycleState.initSteps.websocket = false
        },
        onError: (error) => {
          console.error('🚨 WebSocket错误:', error)
          lifecycleState.connectionStatus = 'error'
          lifecycleState.initSteps.websocket = false
        }
      })

      // 设置WebSocket事件监听
      setupWebSocketEventListeners()

      // 等待连接建立
      console.log('⏳ 等待WebSocket连接建立...')
      await waitForWebSocketConnection()
      
      console.log('✅ 阶段3完成: WebSocket连接成功')
      return wsService.value
      
    } catch (error: any) {
      console.error('❌ 阶段3失败:', error.message)
      throw error
    }
  }

  /**
   * 等待WebSocket连接
   */
  const waitForWebSocketConnection = async (): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
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

  /**
   * 设置WebSocket事件监听
   */
  const setupWebSocketEventListeners = (): void => {
    if (!wsService.value) return

    wsService.value.on<CountdownData>('countdown', (data) => {
      console.log('⏰ 倒计时更新:', data)
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
      console.log('🎲 开牌结果:', data)
      lifecycleState.lastGameResult = data
      handleGameResult(data)
    })

    wsService.value.on<WinData>('win_data', (data) => {
      console.log('💰 中奖数据:', data)
      if (enableAudio && data.win_amount > 0) {
        playWinSound('medium')
      }
    })

    wsService.value.on<GameStatusData>('game_status', (data) => {
      console.log('🎮 游戏状态:', data)
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
      console.log('💳 余额更新:', data)
      if (lifecycleState.userInfo) {
        lifecycleState.userInfo.balance = data.balance
        bettingStore.updateBalance(data.balance)
      }
    })

    wsService.value.on('error', (data) => {
      console.error('🚨 WebSocket业务错误:', data)
      setError(`WebSocket错误: ${data.message}`)
    })
  }

  /**
   * 🚀 完整初始化流程
   */
  const initialize = async (): Promise<void> => {
    try {
      lifecycleState.isLoading = true
      clearError()

      console.log('🚀 开始游戏生命周期初始化...')
      console.log('🕐 初始化时间:', new Date().toLocaleString())
      console.log('🌍 当前环境:', ENV_CONFIG.MODE)
      
      // 重置初始化步骤状态
      lifecycleState.initSteps = {
        urlParams: false,
        httpApi: false,
        websocket: false
      }

      // 阶段1: URL参数解析与验证
      const { params } = initializeUrlParams()

      // 阶段2: HTTP API初始化
      await initializeHttpApi()

      // 阶段3: WebSocket连接
      await initializeWebSocketConnection()

      // 初始化游戏Store
      initializeGameStores()

      // 初始化音频系统
      if (enableAudio) {
        await initializeAudio()
      }

      lifecycleState.isInitialized = true

      console.log('\n🎉 游戏生命周期初始化完成!')
      console.log('=' .repeat(50))
      console.log('📊 最终状态:', {
        isReady: isReady.value,
        urlParams: lifecycleState.initSteps.urlParams,
        httpApi: lifecycleState.initSteps.httpApi,
        websocket: lifecycleState.initSteps.websocket,
        tableInfo: !!lifecycleState.tableInfo,
        userInfo: !!lifecycleState.userInfo,
        wsConnected: lifecycleState.connectionStatus === 'connected'
      })

    } catch (error: any) {
      console.error('\n❌ 游戏生命周期初始化失败!')
      console.error('错误详情:', error)
      setError(error)
      throw error
    } finally {
      lifecycleState.isLoading = false
    }
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
      gameStore.settings.tableName = lifecycleState.tableInfo.lu_zhu_name
      gameStore.settings.limits.min = 10
      gameStore.settings.limits.max = lifecycleState.tableInfo.right_money_banker_player
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
      const result = await apiService.value!.placeBets(bets.map(bet => ({
        money: bet.amount,
        rate_id: parseInt(bet.bet_type)
      })))
      
      if (lifecycleState.userInfo) {
        lifecycleState.userInfo.balance = result.money_balance
        bettingStore.updateBalance(result.money_balance)
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
    lifecycleState.initSteps = {
      urlParams: false,
      httpApi: false,
      websocket: false
    }
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
    
    // 完整初始化方法
    initialize,
    
    // 分步初始化方法（可选单独调用）
    initializeUrlParams,
    initializeHttpApi,
    initializeWebSocketConnection,
    
    submitBets,
    reconnect,
    clearError,
    cleanup,
    
    apiService: readonly(apiService),
    wsService: readonly(wsService)
  }
}