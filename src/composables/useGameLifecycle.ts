// src/composables/useGameLifecycle.ts - 配合简化音频系统的调整版本
import { ref, reactive, computed, readonly } from 'vue'
import { useWebSocket } from './useWebSocket'
import { initializeGameApi } from '@/services/gameApi'
import { useBettingStore } from '@/stores/bettingStore'
import { useGameStore } from '@/stores/gameStore'
import { useAudio } from './useAudio' // 🔥 使用简化后的音频系统
import { parseGameParams, validateGameParams, validateCurrentGameType } from '@/utils/urlParams'
import { setGlobalWSService } from '@/services/websocket'
import { ENV_CONFIG } from '@/utils/envUtils'
import type { GameParams } from '@/types/api'
import type { GameLifecycleOptions } from '@/types/game'

interface GameLifecycleInstance {
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
    audio: boolean // 🔥 新增：音频初始化步骤
  }
  
  wsService: any
  
  initialize: () => Promise<void>
  reconnect: () => Promise<void>
  clearError: () => void
  cleanup: () => void
  updateUserInfo: (newUserInfo: any) => void
  updateTableInfo: (newTableInfo: any) => void
  
  // 🔥 新增：音频相关方法
  getAudioStatus: () => any
  retryAudioInit: () => Promise<boolean>
  startBackgroundMusicIfReady: () => Promise<boolean> // 🔥 新增方法
}

let globalLifecycleInstance: GameLifecycleInstance | null = null

export const createGameLifecycle = (options: GameLifecycleOptions = {}): GameLifecycleInstance => {
  const {
    autoInitialize = false,
    enableAudio = true,
    skipGameTypeValidation = false
  } = options

  const bettingStore = useBettingStore()
  const gameStore = useGameStore()
  
  // 🔥 修改：使用暂停/恢复模式的音频系统
  const { 
    initializeAudio, 
    unlockAudioContext, 
    canPlayAudio,
    getAudioInfo,
    createBackgroundMusicInstance, // 🔥 新增：创建背景音乐实例
    startBackgroundMusicIfEnabled, // 🔥 修改：自动背景音乐播放方法
    audioContext, // 🔥 新增：音频上下文状态
    config: audioConfig // 🔥 新增：音频配置
  } = useAudio()

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
      websocket: false,
      audio: false // 🔥 新增：音频初始化步骤
    }
  })

  const gameParams = ref<GameParams>({ table_id: '', game_type: '', user_id: '', token: '' })
  const wsService = ref<any>(null)

  // 🔥 修改：音频初始化状态 - 新增背景音乐相关状态
  const audioState = reactive({
    initAttempts: 0,
    maxAttempts: 3,
    lastInitTime: 0,
    initCooldown: 2000, // 2秒冷却时间
    isRetrying: false,
    backgroundMusicCreated: false, // 🔥 新增：背景音乐实例创建标志
    backgroundMusicStarted: false, // 🔥 修改：背景音乐启动标志
    userMusicPreference: true, // 🔥 新增：用户音乐偏好
    lastBgmOperation: 'none' // 🔥 新增：最后一次背景音乐操作
  })

  const setError = (error: string | Error) => {
    state.error = error instanceof Error ? error.message : error
  }

  const clearError = () => {
    state.error = null
  }

  const updateUserInfo = (newUserInfo: any) => {
    state.userInfo = newUserInfo
  }

  const updateTableInfo = (newTableInfo: any) => {
    state.tableInfo = newTableInfo
  }

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

  const initializeHttpApi = async () => {
    const apiResult = await initializeGameApi(gameParams.value)
    
    state.tableInfo = apiResult.tableInfo
    state.userInfo = apiResult.userInfo
    state.initSteps.httpApi = true
    
    // 新代码
    if (apiResult.tableInfo) {
      const { video_far, video_near } = apiResult.tableInfo
      if (video_far && video_near) {
        gameStore.updateVideoUrls(video_far, video_near)  // ✅ 使用新方法
      }
    }
    
    return apiResult
  }

  const initializeWebSocketConnection = async () => {
    wsService.value = useWebSocket(gameParams.value, {
      autoConnect: true,
      onConnected: () => {
        state.connectionStatus = 'connected'
        state.initSteps.websocket = true
        
        // 🔥 修改：WebSocket连接成功后尝试创建背景音乐实例
        setTimeout(async () => {
          await prepareBackgroundMusicIfReady()
        }, 1000)
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

    if (wsService.value.wsService.value) {
      setGlobalWSService(wsService.value.wsService.value)
    }

    await waitForWebSocketConnection()
  }

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

  // 🔥 修改：简化的音频初始化 - 配合暂停/恢复模式
  const initializeAudioSystem = async (): Promise<boolean> => {
    if (!enableAudio) {
      console.log('🔇 音频功能已禁用，跳过音频初始化')
      state.initSteps.audio = true
      return true
    }

    const now = Date.now()
    
    // 检查冷却时间
    if (audioState.isRetrying && (now - audioState.lastInitTime) < audioState.initCooldown) {
      console.log('🔇 音频初始化冷却中，跳过')
      return false
    }

    // 检查最大尝试次数
    if (audioState.initAttempts >= audioState.maxAttempts) {
      console.warn('🔇 音频初始化已达到最大尝试次数，标记为完成')
      state.initSteps.audio = true
      return true
    }

    try {
      audioState.initAttempts++
      audioState.lastInitTime = now
      audioState.isRetrying = true

      console.log(`🎵 开始音频系统初始化 (尝试 ${audioState.initAttempts}/${audioState.maxAttempts})...`)
      
      // 🔥 修改：使用暂停/恢复模式的音频系统
      const initResult = await initializeAudio()
      
      if (initResult) {
        console.log('✅ 音频系统初始化成功')
        state.initSteps.audio = true
        audioState.isRetrying = false
        return true
      } else {
        console.warn('⚠️ 音频系统初始化失败，但继续游戏初始化')
        
        // 如果是最后一次尝试，也标记为完成
        if (audioState.initAttempts >= audioState.maxAttempts) {
          state.initSteps.audio = true
          audioState.isRetrying = false
        }
        
        return false
      }
    } catch (error) {
      console.error(`❌ 音频系统初始化异常 (尝试 ${audioState.initAttempts}):`, error)
      
      // 即使失败也在最后一次尝试后标记为完成
      if (audioState.initAttempts >= audioState.maxAttempts) {
        console.warn('🔇 音频系统初始化失败，但已达到最大尝试次数，标记为完成')
        state.initSteps.audio = true
        audioState.isRetrying = false
      }
      
      return false
    }
  }

  // 🔥 修改：简化的音频上下文解锁 - 配合暂停/恢复模式
  const unlockAudioContextSystem = async (): Promise<boolean> => {
    if (!enableAudio) {
      console.log('🔇 音频功能已禁用，跳过音频上下文解锁')
      return true
    }

    try {
      console.log('🔓 正在解锁音频上下文...')
      
      // 🔥 修改：使用暂停/恢复模式的音频系统
      const unlockResult = await unlockAudioContext()
      
      if (unlockResult) {
        console.log('✅ 音频上下文解锁成功')
        return true
      } else {
        console.warn('⚠️ 音频上下文解锁失败，但继续游戏初始化')
        return true // 即使失败也继续，不阻塞游戏
      }
    } catch (error) {
      console.warn('⚠️ 音频上下文解锁异常:', error)
      return true // 静默处理，不阻塞游戏
    }
  }

  const initializeGameStores = (): void => {
    bettingStore.init()
    if (state.userInfo) {
      bettingStore.updateBalance(state.userInfo.balance)
    }
  }

  // 🔥 新增：准备背景音乐实例（暂停/恢复模式的核心方法）
  const prepareBackgroundMusicIfReady = async (): Promise<boolean> => {
    if (!enableAudio || audioState.backgroundMusicCreated) {
      return false
    }

    try {
      console.log('🎵 检查游戏生命周期是否就绪以创建背景音乐实例...')
      
      // 检查所有初始化步骤是否完成
      const allStepsReady = state.initSteps.urlParams && 
                           state.initSteps.httpApi && 
                           state.initSteps.websocket && 
                           state.initSteps.audio
      
      if (allStepsReady && state.isInitialized && canPlayAudio.value) {
        console.log('🎵 游戏生命周期已就绪，创建背景音乐实例')
        
        // 🔥 只创建实例，不立即播放
        const success = await createBackgroundMusicInstance()
        
        if (success) {
          audioState.backgroundMusicCreated = true
          audioState.lastBgmOperation = 'instance_created'
          console.log('✅ 背景音乐实例创建成功（来自游戏生命周期）')
          
          // 🔥 如果用户偏好是开启音乐且没有被用户暂停，则开始播放
          if (audioConfig.enableMusic && !audioContext.isBgmUserPaused) {
            setTimeout(async () => {
              console.log('🎵 根据用户偏好自动开始播放背景音乐')
              const playSuccess = await startBackgroundMusicIfEnabled()
              if (playSuccess) {
                audioState.backgroundMusicStarted = true
                audioState.lastBgmOperation = 'auto_play_started'
              }
            }, 1000) // 延迟1秒确保实例稳定
          }
          
          return true
        } else {
          console.log('❌ 背景音乐实例创建失败')
          audioState.lastBgmOperation = 'instance_create_failed'
          return false
        }
      } else {
        console.log('🔇 游戏生命周期未完全就绪，暂不创建背景音乐实例:', {
          allStepsReady,
          isInitialized: state.isInitialized,
          canPlayAudio: canPlayAudio.value,
          steps: state.initSteps
        })
        return false
      }
    } catch (error) {
      console.error('❌ 创建背景音乐实例时出错:', error)
      audioState.lastBgmOperation = 'instance_create_error'
      return false
    }
  }

  // 🔥 修改：检查并启动背景音乐的方法 - 适配暂停/恢复模式
  const startBackgroundMusicIfReady = async (): Promise<boolean> => {
    if (!enableAudio) {
      return false
    }

    try {
      console.log('🎵 检查游戏生命周期是否就绪以启动背景音乐...')
      
      // 🔥 修改：优先确保背景音乐实例已创建
      if (!audioState.backgroundMusicCreated) {
        console.log('🎵 背景音乐实例未创建，先尝试创建')
        const created = await prepareBackgroundMusicIfReady()
        if (!created) {
          console.log('❌ 背景音乐实例创建失败，无法启动')
          return false
        }
      }
      
      // 检查所有初始化步骤是否完成
      const allStepsReady = state.initSteps.urlParams && 
                           state.initSteps.httpApi && 
                           state.initSteps.websocket && 
                           state.initSteps.audio
      
      if (allStepsReady && state.isInitialized && canPlayAudio.value) {
        console.log('🎵 游戏生命周期已就绪，尝试启动背景音乐')
        
        // 🔥 修改：使用暂停/恢复模式的播放方法
        const success = await startBackgroundMusicIfEnabled()
        
        if (success) {
          audioState.backgroundMusicStarted = true
          audioState.lastBgmOperation = 'lifecycle_play_success'
          console.log('✅ 背景音乐启动成功（来自游戏生命周期）')
          return true
        } else {
          console.log('🔇 背景音乐未启动（可能用户设置为关闭）')
          audioState.lastBgmOperation = 'lifecycle_play_skipped'
          return false
        }
      } else {
        console.log('🔇 游戏生命周期未完全就绪，暂不启动背景音乐:', {
          allStepsReady,
          isInitialized: state.isInitialized,
          canPlayAudio: canPlayAudio.value,
          steps: state.initSteps
        })
        return false
      }
    } catch (error) {
      console.error('❌ 启动背景音乐时出错:', error)
      audioState.lastBgmOperation = 'lifecycle_play_error'
      return false
    }
  }

  // 🔥 修改：重试音频初始化方法 - 适配暂停/恢复模式
  const retryAudioInit = async (): Promise<boolean> => {
    if (!enableAudio) {
      console.log('🔇 音频功能已禁用')
      return false
    }

    console.log('🔄 手动重试音频初始化...')
    
    // 🔥 修改：重置所有音频相关状态
    audioState.initAttempts = 0
    audioState.isRetrying = false
    audioState.backgroundMusicCreated = false // 🔥 重置背景音乐实例创建标志
    audioState.backgroundMusicStarted = false // 🔥 重置背景音乐启动标志
    audioState.lastBgmOperation = 'manual_retry_init'
    state.initSteps.audio = false
    
    const audioResult = await initializeAudioSystem()
    if (audioResult) {
      await unlockAudioContextSystem()
      // 🔥 音频重试成功后尝试创建并启动背景音乐
      setTimeout(async () => {
        await prepareBackgroundMusicIfReady()
      }, 500)
    }
    
    return audioResult
  }

  // 🔥 修改：获取音频状态方法 - 新增背景音乐相关状态
  const getAudioStatus = () => {
    return {
      isEnabled: enableAudio,
      canPlayAudio: canPlayAudio.value,
      initSteps: state.initSteps.audio,
      initAttempts: audioState.initAttempts,
      maxAttempts: audioState.maxAttempts,
      isRetrying: audioState.isRetrying,
      lastInitTime: audioState.lastInitTime,
      // 🔥 新增：背景音乐相关状态
      backgroundMusicCreated: audioState.backgroundMusicCreated,
      backgroundMusicStarted: audioState.backgroundMusicStarted,
      userMusicPreference: audioState.userMusicPreference,
      lastBgmOperation: audioState.lastBgmOperation,
      // 🔥 新增：音频上下文状态
      isBgmUserPaused: audioContext?.isBgmUserPaused || false,
      hasBackgroundMusicInstance: !!audioContext?.backgroundMusicInstance,
      // 原有状态
      audioInfo: getAudioInfo(),
      systemType: 'pause_resume_mode' // 🔥 修改：标识为暂停/恢复模式
    }
  }

  const initialize = async (): Promise<void> => {
    try {
      state.isLoading = true
      clearError()

      // 🔥 修改：重置初始化步骤（包含音频步骤）
      state.initSteps = {
        urlParams: false,
        httpApi: false,
        websocket: false,
        audio: false
      }

      // 🔥 修改：重置音频相关状态
      audioState.backgroundMusicCreated = false
      audioState.backgroundMusicStarted = false
      audioState.lastBgmOperation = 'initialize_start'

      console.log('🚀 开始游戏生命周期初始化...')

      // 步骤1：初始化URL参数
      console.log('📋 步骤1: 初始化URL参数')
      initializeUrlParams()

      // 步骤2：初始化HTTP API
      console.log('🌐 步骤2: 初始化HTTP API')
      await initializeHttpApi()

      // 步骤3：初始化WebSocket连接
      console.log('🔌 步骤3: 初始化WebSocket连接')
      await initializeWebSocketConnection()
      
      // 🔥 步骤4：初始化音频系统（暂停/恢复模式）
      console.log('🎵 步骤4: 初始化音频系统')
      await initializeAudioSystem()
      
      // 🔥 步骤5：解锁音频上下文（暂停/恢复模式）
      console.log('🔓 步骤5: 解锁音频上下文')
      await unlockAudioContextSystem()
      
      // 步骤6：初始化游戏存储
      console.log('🎮 步骤6: 初始化游戏存储')
      initializeGameStores()

      state.isInitialized = true
      console.log('✅ 游戏生命周期初始化完成')

      // 🔥 修改：步骤7：初始化完成后尝试创建背景音乐实例
      console.log('🎵 步骤7: 检查并创建背景音乐实例')
      setTimeout(async () => {
        await prepareBackgroundMusicIfReady()
      }, 1000) // 延迟1秒确保所有系统完全就绪

    } catch (error: any) {
      console.error('❌ 游戏生命周期初始化失败:', error)
      setError(error)
      throw error
    } finally {
      state.isLoading = false
    }
  }

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

  const cleanup = (): void => {
    console.log('🧹 清理游戏生命周期资源...')
    
    if (wsService.value && typeof wsService.value.disconnect === 'function') {
      wsService.value.disconnect()
    }
    
    state.isInitialized = false
    state.connectionStatus = 'disconnected'
    
    // 🔥 修改：重置初始化步骤（包含音频步骤）
    state.initSteps = {
      urlParams: false,
      httpApi: false,
      websocket: false,
      audio: false
    }
    
    // 🔥 修改：重置音频状态
    audioState.initAttempts = 0
    audioState.isRetrying = false
    audioState.lastInitTime = 0
    audioState.backgroundMusicCreated = false // 🔥 重置背景音乐实例创建标志
    audioState.backgroundMusicStarted = false // 🔥 重置背景音乐启动标志
    audioState.lastBgmOperation = 'cleanup'
  }

  const instance: GameLifecycleInstance = {
    get tableInfo() { return state.tableInfo },
    get userInfo() { return state.userInfo },
    get connectionStatus() { return state.connectionStatus },
    get isInitialized() { return state.isInitialized },
    get isLoading() { return state.isLoading },
    get error() { return state.error },
    get initSteps() { return state.initSteps },
    
    get wsService() { return wsService.value },
    
    initialize,
    reconnect,
    clearError,
    cleanup,
    updateUserInfo,
    updateTableInfo,
    
    // 🔥 新增：音频相关方法
    getAudioStatus,
    retryAudioInit,
    startBackgroundMusicIfReady // 🔥 新增方法
  }

  return instance
}

export const getGameLifecycle = (): GameLifecycleInstance => {
  if (!globalLifecycleInstance) {
    throw new Error('游戏生命周期未初始化，请先在 App.vue 中调用 useGameLifecycle() 进行初始化')
  }
  return globalLifecycleInstance
}

export const useGameLifecycle = (options: GameLifecycleOptions = {}) => {
  if (globalLifecycleInstance) {
    return {
      lifecycleState: readonly({
        tableInfo: computed(() => globalLifecycleInstance!.tableInfo),
        userInfo: computed(() => globalLifecycleInstance!.userInfo),
        connectionStatus: computed(() => globalLifecycleInstance!.connectionStatus),
        isInitialized: computed(() => globalLifecycleInstance!.isInitialized),
        isLoading: computed(() => globalLifecycleInstance!.isLoading),
        error: computed(() => globalLifecycleInstance!.error),
        initSteps: computed(() => globalLifecycleInstance!.initSteps)
      }),
      
      // 🔥 修改：就绪状态检查（包含音频步骤）
      isReady: computed(() => 
        globalLifecycleInstance!.isInitialized && 
        globalLifecycleInstance!.connectionStatus === 'connected' &&
        !globalLifecycleInstance!.error &&
        globalLifecycleInstance!.initSteps.urlParams &&
        globalLifecycleInstance!.initSteps.httpApi &&
        globalLifecycleInstance!.initSteps.websocket &&
        globalLifecycleInstance!.initSteps.audio // 🔥 新增音频步骤检查
      ),
      
      initialize: globalLifecycleInstance.initialize,
      reconnect: globalLifecycleInstance.reconnect,
      clearError: globalLifecycleInstance.clearError,
      cleanup: globalLifecycleInstance.cleanup,
      
      // 🔥 新增：音频相关方法
      getAudioStatus: globalLifecycleInstance.getAudioStatus,
      retryAudioInit: globalLifecycleInstance.retryAudioInit,
      startBackgroundMusicIfReady: globalLifecycleInstance.startBackgroundMusicIfReady // 🔥 新增方法
    }
  }
  
  globalLifecycleInstance = createGameLifecycle(options)
  
  return {
    lifecycleState: readonly({
      tableInfo: computed(() => globalLifecycleInstance!.tableInfo),
      userInfo: computed(() => globalLifecycleInstance!.userInfo),
      connectionStatus: computed(() => globalLifecycleInstance!.connectionStatus),
      isInitialized: computed(() => globalLifecycleInstance!.isInitialized),
      isLoading: computed(() => globalLifecycleInstance!.isLoading),
      error: computed(() => globalLifecycleInstance!.error),
      initSteps: computed(() => globalLifecycleInstance!.initSteps)
    }),
    
    // 🔥 修改：就绪状态检查（包含音频步骤）
    isReady: computed(() => 
      globalLifecycleInstance!.isInitialized && 
      globalLifecycleInstance!.connectionStatus === 'connected' &&
      !globalLifecycleInstance!.error &&
      globalLifecycleInstance!.initSteps.urlParams &&
      globalLifecycleInstance!.initSteps.httpApi &&
      globalLifecycleInstance!.initSteps.websocket &&
      globalLifecycleInstance!.initSteps.audio // 🔥 新增音频步骤检查
    ),
    
    initialize: globalLifecycleInstance.initialize,
    reconnect: globalLifecycleInstance.reconnect,
    clearError: globalLifecycleInstance.clearError,
    cleanup: globalLifecycleInstance.cleanup,
    
    // 🔥 新增：音频相关方法
    getAudioStatus: globalLifecycleInstance.getAudioStatus,
    retryAudioInit: globalLifecycleInstance.retryAudioInit,
    startBackgroundMusicIfReady: globalLifecycleInstance.startBackgroundMusicIfReady // 🔥 新增方法
  }
}

export const resetGameLifecycle = (): void => {
  if (globalLifecycleInstance) {
    globalLifecycleInstance.cleanup()
    globalLifecycleInstance = null
  }
}

// 🔥 修改：开发模式下的音频调试工具 - 新增背景音乐相关调试
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).debugGameLifecycle = {
    getInstance: () => globalLifecycleInstance,
    getAudioStatus: () => globalLifecycleInstance?.getAudioStatus(),
    retryAudio: () => globalLifecycleInstance?.retryAudioInit(),
    startBackgroundMusic: () => globalLifecycleInstance?.startBackgroundMusicIfReady(),
    resetLifecycle: resetGameLifecycle,
    // 🔥 新增：背景音乐调试方法
    checkBgmStatus: () => {
      const status = globalLifecycleInstance?.getAudioStatus()
      if (status) {
        console.log('🎵 背景音乐状态:', {
          created: status.backgroundMusicCreated,
          started: status.backgroundMusicStarted,
          userPaused: status.isBgmUserPaused,
          hasInstance: status.hasBackgroundMusicInstance,
          lastOperation: status.lastBgmOperation
        })
      }
      return status
    }
  }
  console.log('🐛 游戏生命周期调试工具已添加到 window.debugGameLifecycle')
}