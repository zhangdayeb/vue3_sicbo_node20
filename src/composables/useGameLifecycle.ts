// src/composables/useGameLifecycle.ts
import { ref, reactive, computed, readonly } from 'vue'
import { useWebSocket } from './useWebSocket'
import { initializeGameApi } from '@/services/gameApi'
import { useBettingStore } from '@/stores/bettingStore'
import { useAudio } from './useAudio'
import { parseGameParams, validateGameParams, validateCurrentGameType } from '@/utils/urlParams'
import { setGlobalWSService } from '@/services/websocket'
import { ENV_CONFIG } from '@/utils/envUtils'
import type { GameParams } from '@/types/api'
import type { GameLifecycleOptions } from '@/types/game'

// 生命周期实例接口
interface GameLifecycleInstance {
  // 状态数据
  tableInfo: any
  userInfo: any
  connectionStatus: string
  isInitialized: boolean
  isLoading: boolean
  error: string | null
  initSteps: {
    urlParams: boolean
    httpApi: boolean
    websocket: boolean
  }
  
  // WebSocket服务
  wsService: any
  
  // 方法
  initialize: () => Promise<void>
  reconnect: () => Promise<void>
  clearError: () => void
  cleanup: () => void
  updateUserInfo: (newUserInfo: any) => void
  updateTableInfo: (newTableInfo: any) => void
}

// 全局实例存储
let globalLifecycleInstance: GameLifecycleInstance | null = null

// 创建生命周期实例
export const createGameLifecycle = (options: GameLifecycleOptions = {}): GameLifecycleInstance => {
  const {
    autoInitialize = false,
    enableAudio = true,
    skipGameTypeValidation = false
  } = options

  const bettingStore = useBettingStore()
  const { unlockAudioContext } = useAudio()

  // 响应式状态
  const state = reactive({
    tableInfo: null as any,
    userInfo: null as any,
    connectionStatus: 'disconnected' as string,
    isInitialized: false,
    isLoading: false,
    error: null as string | null,
    initSteps: {
      urlParams: false,
      httpApi: false,
      websocket: false
    }
  })

  const gameParams = ref<GameParams>({ table_id: '', game_type: '', user_id: '', token: '' })
  const wsService = ref<any>(null)

  const setError = (error: string | Error) => {
    state.error = error instanceof Error ? error.message : error
  }

  const clearError = () => {
    state.error = null
  }

  // 更新用户信息
  const updateUserInfo = (newUserInfo: any) => {
    state.userInfo = newUserInfo
  }

  // 更新台桌信息
  const updateTableInfo = (newTableInfo: any) => {
    state.tableInfo = newTableInfo
  }

  // URL参数解析与验证
  const initializeUrlParams = () => {
    const params = parseGameParams()
    const validation = validateGameParams(params)
    
    if (!validation.isValid) {
      throw new Error(`URL参数无效: ${[...validation.missingParams, ...validation.errors].join(', ')}`)
    }
    
    if (!skipGameTypeValidation) {
      const gameTypeValidation = validateCurrentGameType()
      
      if (!gameTypeValidation.isValid && ENV_CONFIG.IS_PROD) {
        throw new Error(gameTypeValidation.error)
      }
    }
    
    gameParams.value = params
    state.initSteps.urlParams = true
  }

  // HTTP API初始化
  const initializeHttpApi = async () => {
    const apiResult = await initializeGameApi(gameParams.value)
    
    state.tableInfo = apiResult.tableInfo
    state.userInfo = apiResult.userInfo
    state.initSteps.httpApi = true
    
    return apiResult
  }

  // WebSocket连接初始化
  const initializeWebSocketConnection = async () => {
    wsService.value = useWebSocket(gameParams.value, {
      autoConnect: true,
      onConnected: () => {
        state.connectionStatus = 'connected'
        state.initSteps.websocket = true
      },
      onDisconnected: () => {
        state.connectionStatus = 'disconnected'
        state.initSteps.websocket = false
      },
      onError: (error) => {
        state.connectionStatus = 'error'
        state.initSteps.websocket = false
      }
    })

    // 设置全局WebSocket服务
    if (wsService.value.wsService.value) {
      setGlobalWSService(wsService.value.wsService.value)
    }

    await waitForWebSocketConnection()
  }

  // 等待WebSocket连接
  const waitForWebSocketConnection = async (): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('WebSocket连接超时'))
      }, 10000)

      const checkConnection = () => {
        const wsConnected = wsService.value?.isConnected?.value === true
        const localConnected = state.connectionStatus === 'connected'
        
        if (wsConnected || localConnected) {
          clearTimeout(timeout)
          resolve()
        } else {
          setTimeout(checkConnection, 100)
        }
      }
      
      checkConnection()
    })
  }

  // 初始化游戏stores
  const initializeGameStores = (): void => {
    bettingStore.init()
    if (state.userInfo) {
      bettingStore.updateBalance(state.userInfo.balance)
    }
  }

  // 初始化音频系统
  const initializeAudio = async (): Promise<void> => {
    if (enableAudio) {
      try {
        await unlockAudioContext()
      } catch (error) {
        // 静默处理音频初始化失败
      }
    }
  }

  // 完整初始化流程
  const initialize = async (): Promise<void> => {
    try {
      state.isLoading = true
      clearError()

      state.initSteps = {
        urlParams: false,
        httpApi: false,
        websocket: false
      }

      initializeUrlParams()
      await initializeHttpApi()
      await initializeWebSocketConnection()
      
      initializeGameStores()
      await initializeAudio()

      state.isInitialized = true

    } catch (error: any) {
      setError(error)
      throw error
    } finally {
      state.isLoading = false
    }
  }

  // 重连
  const reconnect = async (): Promise<void> => {
    try {
      state.connectionStatus = 'reconnecting'
      
      if (wsService.value && typeof wsService.value.reconnect === 'function') {
        await wsService.value.reconnect()
      }
      
      clearError()
    } catch (error: any) {
      setError(error)
      throw error
    }
  }

  // 清理资源
  const cleanup = (): void => {
    if (wsService.value && typeof wsService.value.disconnect === 'function') {
      wsService.value.disconnect()
    }
    
    state.isInitialized = false
    state.connectionStatus = 'disconnected'
    state.initSteps = {
      urlParams: false,
      httpApi: false,
      websocket: false
    }
  }

  // 返回实例对象
  const instance: GameLifecycleInstance = {
    // 状态数据 - 直接暴露响应式状态
    get tableInfo() { return state.tableInfo },
    get userInfo() { return state.userInfo },
    get connectionStatus() { return state.connectionStatus },
    get isInitialized() { return state.isInitialized },
    get isLoading() { return state.isLoading },
    get error() { return state.error },
    get initSteps() { return state.initSteps },
    
    // WebSocket服务
    get wsService() { return wsService.value },
    
    // 方法
    initialize,
    reconnect,
    clearError,
    cleanup,
    updateUserInfo,
    updateTableInfo
  }

  return instance
}

// 获取已创建的生命周期实例
export const getGameLifecycle = (): GameLifecycleInstance => {
  if (!globalLifecycleInstance) {
    throw new Error('游戏生命周期未初始化，请先在 App.vue 中调用 useGameLifecycle() 进行初始化')
  }
  return globalLifecycleInstance
}

// 主要的 composable 函数 - 自动获取或创建
export const useGameLifecycle = (options: GameLifecycleOptions = {}) => {
  // 如果已有实例，直接返回
  if (globalLifecycleInstance) {
    return {
      // 只读状态
      lifecycleState: readonly({
        tableInfo: computed(() => globalLifecycleInstance!.tableInfo),
        userInfo: computed(() => globalLifecycleInstance!.userInfo),
        connectionStatus: computed(() => globalLifecycleInstance!.connectionStatus),
        isInitialized: computed(() => globalLifecycleInstance!.isInitialized),
        isLoading: computed(() => globalLifecycleInstance!.isLoading),
        error: computed(() => globalLifecycleInstance!.error),
        initSteps: computed(() => globalLifecycleInstance!.initSteps)
      }),
      
      // 计算属性
      isReady: computed(() => 
        globalLifecycleInstance!.isInitialized && 
        globalLifecycleInstance!.connectionStatus === 'connected' &&
        !globalLifecycleInstance!.error &&
        globalLifecycleInstance!.initSteps.urlParams &&
        globalLifecycleInstance!.initSteps.httpApi &&
        globalLifecycleInstance!.initSteps.websocket
      ),
      
      // 方法
      initialize: globalLifecycleInstance.initialize,
      reconnect: globalLifecycleInstance.reconnect,
      clearError: globalLifecycleInstance.clearError,
      cleanup: globalLifecycleInstance.cleanup
    }
  }
  
  // 第一次调用时创建实例
  globalLifecycleInstance = createGameLifecycle(options)
  
  return {
    // 只读状态
    lifecycleState: readonly({
      tableInfo: computed(() => globalLifecycleInstance!.tableInfo),
      userInfo: computed(() => globalLifecycleInstance!.userInfo),
      connectionStatus: computed(() => globalLifecycleInstance!.connectionStatus),
      isInitialized: computed(() => globalLifecycleInstance!.isInitialized),
      isLoading: computed(() => globalLifecycleInstance!.isLoading),
      error: computed(() => globalLifecycleInstance!.error),
      initSteps: computed(() => globalLifecycleInstance!.initSteps)
    }),
    
    // 计算属性
    isReady: computed(() => 
      globalLifecycleInstance!.isInitialized && 
      globalLifecycleInstance!.connectionStatus === 'connected' &&
      !globalLifecycleInstance!.error &&
      globalLifecycleInstance!.initSteps.urlParams &&
      globalLifecycleInstance!.initSteps.httpApi &&
      globalLifecycleInstance!.initSteps.websocket
    ),
    
    // 方法
    initialize: globalLifecycleInstance.initialize,
    reconnect: globalLifecycleInstance.reconnect,
    clearError: globalLifecycleInstance.clearError,
    cleanup: globalLifecycleInstance.cleanup
  }
}

// 重置实例（用于测试或特殊场景）
export const resetGameLifecycle = (): void => {
  if (globalLifecycleInstance) {
    globalLifecycleInstance.cleanup()
    globalLifecycleInstance = null
  }
}