// 🔥 极简版音频系统 - 背景音乐暂停/恢复模式
import { ref, computed, reactive, readonly } from 'vue'

// 全局单例状态
let audioSystemInstance: ReturnType<typeof createAudioSystem> | null = null
let isGlobalInitialized = false

export interface AudioConfig {
  masterVolume: number
  sfxVolume: number
  musicVolume: number
  enableSfx: boolean
  enableMusic: boolean
  enableVibration: boolean
}

export interface SoundDefinition {
  id: string
  url: string
  volume?: number
  loop?: boolean
  category: 'sfx' | 'music'
}

export interface AudioContextState {
  isUnlocked: boolean
  isSupported: boolean
  // 🔥 新增：背景音乐专用状态管理
  backgroundMusicInstance: HTMLAudioElement | null
  isBgmUserPaused: boolean  // 用户是否主动暂停
  bgmPlayPosition: number   // 播放位置记录
  bgmCreatedTime: number    // 实例创建时间
  bgmLastOperation: string  // 最后一次操作类型
  // 保留兼容性
  currentBackgroundMusic: HTMLAudioElement | null
}

// 🔥 核心音频系统创建函数
function createAudioSystem() {
  console.log('🎵 创建音频系统实例（暂停/恢复模式）')
  
  // 音效配置
  const config = reactive<AudioConfig>({
    masterVolume: 0.8,
    sfxVolume: 0.7,
    musicVolume: 0.4,
    enableSfx: true,
    enableMusic: true,
    enableVibration: true
  })

  // 音效定义 - 简化版本
  const soundDefinitions: Record<string, SoundDefinition> = {
    // UI 音效
    'click': { id: 'click', url: '/audio/chip-select.mp3', category: 'sfx', volume: 0.6 },
    'error': { id: 'error', url: '/audio/error.mp3', category: 'sfx', volume: 0.8 },
    'success': { id: 'success', url: '/audio/bet-confirm.mp3', category: 'sfx', volume: 0.7 },
    
    // 筹码音效
    'chip-select': { id: 'chip-select', url: '/audio/chip-select.mp3', category: 'sfx', volume: 0.7 },
    'chip-place': { id: 'chip-place', url: '/audio/chip-place.mp3', category: 'sfx', volume: 0.8 },
    
    // 游戏音效
    'bet-confirm': { id: 'bet-confirm', url: '/audio/bet-confirm.mp3', category: 'sfx', volume: 0.9 },
    'dice-roll': { id: 'dice-roll', url: '/audio/dice-roll.mp3', category: 'sfx', volume: 0.7 },
    'bet-start': { id: 'bet-start', url: '/audio/bet-start.mp3', category: 'sfx', volume: 0.9 },
    'bet-stop': { id: 'bet-stop', url: '/audio/bet-stop.mp3', category: 'sfx', volume: 0.9 },
    'win': { id: 'win', url: '/audio/win.mp3', category: 'sfx', volume: 1.0 },
    
    // 背景音乐
    'bg001': { id: 'bg001', url: '/audio/bg001.mp3', category: 'music', volume: 0.7, loop: true }
  }

  // 🔥 扩展的音频上下文
  const audioContext = reactive<AudioContextState>({
    isUnlocked: false,
    isSupported: true,
    // 新的背景音乐状态管理
    backgroundMusicInstance: null,
    isBgmUserPaused: false,
    bgmPlayPosition: 0,
    bgmCreatedTime: 0,
    bgmLastOperation: 'none',
    // 保留兼容性
    currentBackgroundMusic: null
  })

  // 状态
  const isInitialized = ref(false)

  // 计算属性
  const canPlayAudio = computed(() => {
    return audioContext.isSupported && audioContext.isUnlocked && isInitialized.value
  })

  const effectiveVolume = computed(() => ({
    sfx: config.enableSfx ? config.masterVolume * config.sfxVolume : 0,
    music: config.enableMusic ? config.masterVolume * config.musicVolume : 0
  }))

  // 🔥 背景音乐实例是否正在播放
  const isBackgroundMusicPlaying = computed(() => {
    return audioContext.backgroundMusicInstance && 
           !audioContext.backgroundMusicInstance.paused &&
           !audioContext.isBgmUserPaused
  })

  // 🔥 初始化音频系统
  const initializeAudio = async (): Promise<boolean> => {
    if (isInitialized.value) {
      console.log('🎵 音频系统已初始化，跳过重复初始化')
      return true
    }

    try {
      console.log('🎵 开始初始化音频系统（暂停/恢复模式）...')
      
      if (typeof Audio === 'undefined') {
        audioContext.isSupported = false
        console.error('❌ 浏览器不支持 Audio API')
        return false
      }

      isInitialized.value = true
      console.log('✅ 音频系统初始化完成（暂停/恢复模式）')
      return true
    } catch (error) {
      console.error('❌ 音频系统初始化失败:', error)
      audioContext.isSupported = false
      return false
    }
  }

  // 解锁音频上下文
  const unlockAudioContext = async (): Promise<boolean> => {
    if (audioContext.isUnlocked) {
      console.log('🎵 音频上下文已解锁，跳过重复解锁')
      return true
    }

    try {
      console.log('🔓 正在解锁音频上下文...')
      
      const silentAudio = new Audio('/audio/chip-select.mp3')
      silentAudio.volume = 0
      silentAudio.muted = true
      
      try {
        await silentAudio.play()
        silentAudio.pause()
        silentAudio.currentTime = 0
      } catch (e) {
        // 忽略播放失败
      }

      audioContext.isUnlocked = true
      console.log('✅ 音频上下文解锁成功')
      return true
    } catch (error) {
      console.warn('⚠️ 音频上下文解锁失败:', error)
      audioContext.isUnlocked = true
      return true
    }
  }

  // 🔥 新增：创建背景音乐实例（只在首次需要时创建）
  const createBackgroundMusicInstance = async (): Promise<boolean> => {
    if (audioContext.backgroundMusicInstance) {
      console.log('🎵 背景音乐实例已存在，跳过创建')
      return true
    }

    try {
      console.log('🎵 创建背景音乐实例...')
      
      const soundDef = soundDefinitions['bg001']
      if (!soundDef) {
        console.error('❌ 背景音乐定义不存在')
        return false
      }

      const audio = new Audio(soundDef.url)
      audio.loop = true
      audio.preload = 'auto'
      
      // 设置音量
      const volume = effectiveVolume.value.music
      audio.volume = volume
      
      // 绑定事件监听器
      audio.addEventListener('ended', () => {
        console.log('🎵 背景音乐播放结束')
      })
      
      audio.addEventListener('error', (e) => {
        console.error('❌ 背景音乐播放错误:', e)
        // 标记需要重新创建
        audioContext.backgroundMusicInstance = null
      })

      audio.addEventListener('loadstart', () => {
        console.log('🎵 背景音乐开始加载')
      })

      audio.addEventListener('canplaythrough', () => {
        console.log('🎵 背景音乐加载完成，可以播放')
      })

      audioContext.backgroundMusicInstance = audio
      audioContext.currentBackgroundMusic = audio // 保持兼容性
      audioContext.bgmCreatedTime = Date.now()
      audioContext.bgmLastOperation = 'created'
      
      console.log('✅ 背景音乐实例创建成功')
      return true
    } catch (error) {
      console.error('❌ 创建背景音乐实例失败:', error)
      return false
    }
  }

  // 🔥 新增：销毁背景音乐实例
  const destroyBackgroundMusicInstance = (): void => {
    if (audioContext.backgroundMusicInstance) {
      console.log('🎵 销毁背景音乐实例')
      
      // 保存当前播放位置
      if (!audioContext.backgroundMusicInstance.paused) {
        audioContext.bgmPlayPosition = audioContext.backgroundMusicInstance.currentTime
      }
      
      audioContext.backgroundMusicInstance.pause()
      audioContext.backgroundMusicInstance.src = ''
      audioContext.backgroundMusicInstance = null
      audioContext.currentBackgroundMusic = null
      audioContext.bgmLastOperation = 'destroyed'
      
      console.log('✅ 背景音乐实例已销毁')
    }
  }

  // 🔥 新增：验证背景音乐实例状态
  const validateBackgroundMusicState = (): boolean => {
    if (!audioContext.backgroundMusicInstance) {
      return false
    }

    // 检查实例是否健康
    const audio = audioContext.backgroundMusicInstance
    const now = Date.now()
    const instanceAge = now - audioContext.bgmCreatedTime

    // 如果实例超过1小时，考虑重新创建
    if (instanceAge > 60 * 60 * 1000) {
      console.log('⚠️ 背景音乐实例过老，需要重新创建')
      return false
    }

    // 检查音频元素是否正常
    if (audio.error) {
      console.log('⚠️ 背景音乐实例存在错误，需要重新创建')
      return false
    }

    return true
  }

  // 🔥 新增：恢复背景音乐实例
  const recoverBackgroundMusicInstance = async (): Promise<boolean> => {
    console.log('🔄 尝试恢复背景音乐实例')
    
    // 销毁当前实例
    destroyBackgroundMusicInstance()
    
    // 重新创建
    const success = await createBackgroundMusicInstance()
    
    if (success && audioContext.bgmPlayPosition > 0) {
      // 恢复播放位置
      audioContext.backgroundMusicInstance!.currentTime = audioContext.bgmPlayPosition
    }
    
    return success
  }

  // 🔥 重构：播放背景音乐（暂停/恢复模式）
  const playBackgroundMusic = async (): Promise<boolean> => {
    console.log('🎵 播放背景音乐（暂停/恢复模式）')
    
    if (!canPlayAudio.value || !config.enableMusic) {
      console.log('🔇 音频系统未就绪或音乐已禁用')
      return false
    }

    try {
      // 确保实例存在且健康
      if (!audioContext.backgroundMusicInstance || !validateBackgroundMusicState()) {
        const created = await createBackgroundMusicInstance()
        if (!created) {
          console.error('❌ 无法创建背景音乐实例')
          return false
        }
      }

      const audio = audioContext.backgroundMusicInstance!
      
      // 更新音量
      audio.volume = effectiveVolume.value.music
      
      // 如果已经在播放，直接返回成功
      if (!audio.paused && !audioContext.isBgmUserPaused) {
        console.log('🎵 背景音乐已在播放中')
        return true
      }

      // 恢复播放位置（如果有保存的位置）
      if (audioContext.bgmPlayPosition > 0 && audio.currentTime === 0) {
        audio.currentTime = audioContext.bgmPlayPosition
      }

      // 开始播放
      await audio.play()
      audioContext.isBgmUserPaused = false
      audioContext.bgmLastOperation = 'play'
      
      console.log('✅ 背景音乐播放成功')
      return true
    } catch (error) {
      console.error('❌ 播放背景音乐失败:', error)
      
      // 尝试恢复实例
      const recovered = await recoverBackgroundMusicInstance()
      if (recovered) {
        try {
          await audioContext.backgroundMusicInstance!.play()
          audioContext.isBgmUserPaused = false
          audioContext.bgmLastOperation = 'play_recovered'
          console.log('✅ 背景音乐恢复播放成功')
          return true
        } catch (retryError) {
          console.error('❌ 背景音乐恢复播放失败:', retryError)
        }
      }
      
      return false
    }
  }

  // 🔥 重构：暂停背景音乐（用户主动操作）
  const pauseBackgroundMusicByUser = (): void => {
    console.log('🎵 用户暂停背景音乐')
    
    if (audioContext.backgroundMusicInstance && !audioContext.backgroundMusicInstance.paused) {
      // 保存当前播放位置
      audioContext.bgmPlayPosition = audioContext.backgroundMusicInstance.currentTime
      
      // 暂停播放
      audioContext.backgroundMusicInstance.pause()
      audioContext.isBgmUserPaused = true
      audioContext.bgmLastOperation = 'user_pause'
      
      console.log('✅ 背景音乐已暂停，位置已保存:', audioContext.bgmPlayPosition)
    }
  }

  // 🔥 重构：恢复背景音乐（用户主动操作）
  const resumeBackgroundMusicByUser = async (): Promise<boolean> => {
    console.log('🎵 用户恢复背景音乐')
    
    if (!config.enableMusic) {
      console.log('🔇 音乐已禁用，无法恢复')
      return false
    }

    audioContext.isBgmUserPaused = false
    return await playBackgroundMusic()
  }

  // 🔥 重构：音乐开关（暂停/恢复模式）
  const toggleMusic = async (): Promise<void> => {
    console.log('🎵 切换背景音乐开关:', config.enableMusic ? '开启→关闭' : '关闭→开启')
    
    config.enableMusic = !config.enableMusic
    
    if (config.enableMusic) {
      // 开启背景音乐：恢复播放
      await resumeBackgroundMusicByUser()
    } else {
      // 关闭背景音乐：暂停播放
      pauseBackgroundMusicByUser()
    }
    
    saveConfig()
    console.log('✅ 背景音乐开关切换完成:', config.enableMusic ? '已开启' : '已关闭')
  }

  // 🔥 播放音效 - 保持原有逻辑
  const playSound = async (
    soundId: string,
    options: {
      volume?: number
      loop?: boolean
      interrupt?: boolean
    } = {}
  ): Promise<boolean> => {
    if (!canPlayAudio.value) {
      console.warn('⚠️ 音频系统未就绪，跳过播放:', soundId)
      return false
    }

    const soundDef = soundDefinitions[soundId]
    if (!soundDef) {
      console.warn(`⚠️ 未找到音效: ${soundId}`)
      return false
    }

    const categoryVolume = effectiveVolume.value[soundDef.category]
    if (categoryVolume <= 0) {
      console.log(`🔇 ${soundDef.category} 类别音效已禁用，跳过播放:`, soundId)
      return false
    }

    try {
      // 背景音乐使用新的暂停/恢复逻辑
      if (soundDef.category === 'music') {
        return await playBackgroundMusic()
      }

      // 音效处理 - 保持原有实时创建逻辑
      const audio = new Audio(soundDef.url)
      const finalVolume = (options.volume ?? soundDef.volume ?? 1) * categoryVolume
      
      audio.volume = finalVolume
      audio.loop = options.loop ?? soundDef.loop ?? false

      // 音效播放时降低背景音乐音量
      const originalBgVolume = audioContext.backgroundMusicInstance?.volume || 0
      if (audioContext.backgroundMusicInstance && !audioContext.backgroundMusicInstance.paused) {
        audioContext.backgroundMusicInstance.volume = originalBgVolume * 0.3
      }

      await audio.play()
      
      // 音效结束后恢复背景音乐音量
      audio.addEventListener('ended', () => {
        if (audioContext.backgroundMusicInstance && !audioContext.backgroundMusicInstance.paused) {
          audioContext.backgroundMusicInstance.volume = originalBgVolume
        }
      })

      // 触发震动
      if (config.enableVibration && 'vibrate' in navigator) {
        navigator.vibrate(50)
      }

      console.log(`🎵 音效播放成功: ${soundId}`)
      return true
    } catch (error) {
      console.error(`❌ 播放音效失败 ${soundId}:`, error)
      return false
    }
  }

  // 🔥 新增：获取音效状态方法
  const getSfxStatus = () => {
    return {
      enabled: config.enableSfx,
      volume: effectiveVolume.value.sfx,
      canPlay: canPlayAudio.value && config.enableSfx,
      lastToggleTime: Date.now(),
      systemType: 'pause_resume_mode'
    }
  }

  // 🔥 兼容性方法 - 保持向后兼容
  const stopBackgroundMusic = (): void => {
    pauseBackgroundMusicByUser()
  }

  const pauseBackgroundMusic = (): void => {
    if (audioContext.backgroundMusicInstance && !audioContext.backgroundMusicInstance.paused) {
      audioContext.backgroundMusicInstance.pause()
      console.log('⏸️ 背景音乐已暂停（系统调用）')
    }
  }

  const resumeBackgroundMusic = (): void => {
    if (audioContext.backgroundMusicInstance && audioContext.backgroundMusicInstance.paused && !audioContext.isBgmUserPaused) {
      audioContext.backgroundMusicInstance.play()
      console.log('▶️ 背景音乐已恢复（系统调用）')
    }
  }

  const startBackgroundMusicIfEnabled = async (): Promise<boolean> => {
    console.log('🎵 检查背景音乐设置:', {
      enableMusic: config.enableMusic,
      canPlayAudio: canPlayAudio.value,
      hasInstance: !!audioContext.backgroundMusicInstance,
      userPaused: audioContext.isBgmUserPaused
    })

    if (config.enableMusic && canPlayAudio.value && !audioContext.isBgmUserPaused) {
      console.log('🎵 自动开始播放背景音乐')
      return await playBackgroundMusic()
    }
    
    return false
  }

  // 🔥 音量控制 - 新增背景音乐音量同步
  const updateBackgroundMusicVolume = (): void => {
    if (audioContext.backgroundMusicInstance) {
      const newVolume = effectiveVolume.value.music
      audioContext.backgroundMusicInstance.volume = newVolume
      console.log('🎵 背景音乐音量已更新:', newVolume)
    }
  }

  const setMasterVolume = (volume: number): void => {
    config.masterVolume = Math.max(0, Math.min(1, volume))
    updateBackgroundMusicVolume()
    saveConfig()
  }

  const setSfxVolume = (volume: number): void => {
    config.sfxVolume = Math.max(0, Math.min(1, volume))
    saveConfig()
  }

  const setMusicVolume = (volume: number): void => {
    config.musicVolume = Math.max(0, Math.min(1, volume))
    updateBackgroundMusicVolume()
    saveConfig()
  }

  const toggleSfx = (): void => {
    config.enableSfx = !config.enableSfx
    console.log('🎵 音效开关切换:', config.enableSfx ? '开启' : '关闭')
    saveConfig()
  }

  // 🔥 快捷播放方法
  const playChipSelectSound = () => playSound('chip-select')
  const playChipPlaceSound = () => playSound('chip-place')
  const playBetConfirmSound = () => playSound('bet-confirm')
  const playErrorSound = () => playSound('error')
  const playWinSound = () => playSound('win')
  const playDiceRollSound = () => playSound('dice-roll')
  const playBetStartSound = () => playSound('bet-start')
  const playBetStopSound = () => playSound('bet-stop')

  // 🔥 配置管理 - 新增背景音乐状态保存
  const saveConfig = (): void => {
    try {
      const configToSave = {
        ...config,
        // 新增：保存背景音乐状态
        isBgmUserPaused: audioContext.isBgmUserPaused,
        bgmPlayPosition: audioContext.bgmPlayPosition
      }
      localStorage.setItem('sicbo_audio_config', JSON.stringify(configToSave))
      console.log('💾 音频配置已保存')
    } catch (error) {
      console.error('❌ 保存音频配置失败:', error)
    }
  }

  const loadConfig = (): void => {
    try {
      const saved = localStorage.getItem('sicbo_audio_config')
      if (saved) {
        const savedConfig = JSON.parse(saved)
        
        // 加载基础配置
        Object.assign(config, {
          masterVolume: savedConfig.masterVolume ?? config.masterVolume,
          sfxVolume: savedConfig.sfxVolume ?? config.sfxVolume,
          musicVolume: savedConfig.musicVolume ?? config.musicVolume,
          enableSfx: savedConfig.enableSfx ?? config.enableSfx,
          enableMusic: savedConfig.enableMusic ?? config.enableMusic,
          enableVibration: savedConfig.enableVibration ?? config.enableVibration
        })
        
        // 新增：加载背景音乐状态
        audioContext.isBgmUserPaused = savedConfig.isBgmUserPaused ?? false
        audioContext.bgmPlayPosition = savedConfig.bgmPlayPosition ?? 0
        
        console.log('📂 音频配置已加载:', config)
      }
    } catch (error) {
      console.error('❌ 加载音频配置失败:', error)
    }
  }

  // 获取音频信息
  const getAudioInfo = () => ({
    isInitialized: isInitialized.value,
    canPlayAudio: canPlayAudio.value,
    hasBackgroundMusic: !!audioContext.backgroundMusicInstance,
    isBackgroundMusicPlaying: isBackgroundMusicPlaying.value,
    isBgmUserPaused: audioContext.isBgmUserPaused,
    bgmPlayPosition: audioContext.bgmPlayPosition,
    bgmLastOperation: audioContext.bgmLastOperation,
    config: { ...config }
  })

  return {
    // 状态
    config,
    audioContext: readonly(audioContext),
    isInitialized: readonly(isInitialized),
    
    // 计算属性
    canPlayAudio,
    effectiveVolume,
    isBackgroundMusicPlaying,
    
    // 核心方法
    initializeAudio,
    unlockAudioContext,
    playSound,
    
    // 🔥 新的背景音乐控制方法
    createBackgroundMusicInstance,
    destroyBackgroundMusicInstance,
    playBackgroundMusic,
    pauseBackgroundMusicByUser,
    resumeBackgroundMusicByUser,
    validateBackgroundMusicState,
    
    // 兼容性方法
    stopBackgroundMusic,
    pauseBackgroundMusic,
    resumeBackgroundMusic,
    startBackgroundMusicIfEnabled,
    
    // 音量和开关控制
    setMasterVolume,
    setSfxVolume,
    setMusicVolume,
    toggleSfx,
    toggleMusic,
    updateBackgroundMusicVolume,
    
    // 快捷方法
    playChipSelectSound,
    playChipPlaceSound,
    playBetConfirmSound,
    playErrorSound,
    playWinSound,
    playDiceRollSound,
    playBetStartSound,
    playBetStopSound,
    
    // 配置管理
    saveConfig,
    loadConfig,
    getAudioInfo,
    getSfxStatus // 🔥 新增：音效状态获取方法
  }
}

// 🔥 单例模式的 useAudio 导出
export const useAudio = () => {
  if (!audioSystemInstance) {
    console.log('🎵 首次创建音频系统单例（暂停/恢复模式）')
    audioSystemInstance = createAudioSystem()
    audioSystemInstance.loadConfig()
  }
  
  return audioSystemInstance
}

// 🔥 全局初始化方法
export const initializeGlobalAudioSystem = async (): Promise<boolean> => {
  if (isGlobalInitialized) {
    console.log('🎵 全局音频系统已初始化，跳过')
    return true
  }
  
  console.log('🎵 开始全局音频系统初始化（暂停/恢复模式）')
  const audioSystem = useAudio()
  const result = await audioSystem.initializeAudio()
  
  if (result) {
    isGlobalInitialized = true
    console.log('✅ 全局音频系统初始化完成（暂停/恢复模式）')
  }
  
  return result
}

// 🔥 全局解锁方法
export const unlockGlobalAudioContext = async (): Promise<boolean> => {
  const audioSystem = useAudio()
  return await audioSystem.unlockAudioContext()
}

// 🔥 全局清理方法 - 应用卸载时调用
export const cleanupGlobalAudioSystem = (): void => {
  if (audioSystemInstance) {
    console.log('🎵 清理全局音频系统')
    audioSystemInstance.destroyBackgroundMusicInstance()
    audioSystemInstance = null
    isGlobalInitialized = false
  }
}