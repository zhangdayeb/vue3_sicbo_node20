// 🔥 极简版音频系统 - 完全实时加载，无预加载
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
  currentBackgroundMusic: HTMLAudioElement | null
}

// 🔥 核心音频系统创建函数
function createAudioSystem() {
  console.log('🎵 创建音频系统实例（实时加载模式）')
  
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

  // 音频上下文
  const audioContext = reactive<AudioContextState>({
    isUnlocked: false,
    isSupported: true,
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

  // 🔥 初始化音频系统 - 极简版本
  const initializeAudio = async (): Promise<boolean> => {
    if (isInitialized.value) {
      console.log('🎵 音频系统已初始化，跳过重复初始化')
      return true
    }

    try {
      console.log('🎵 开始初始化音频系统（实时加载模式）...')
      
      // 检查浏览器支持
      if (typeof Audio === 'undefined') {
        audioContext.isSupported = false
        console.error('❌ 浏览器不支持 Audio API')
        return false
      }

      isInitialized.value = true
      console.log('✅ 音频系统初始化完成（实时加载模式）')
      return true
    } catch (error) {
      console.error('❌ 音频系统初始化失败:', error)
      audioContext.isSupported = false
      return false
    }
  }

  // 解锁音频上下文（移动端需要）
  const unlockAudioContext = async (): Promise<boolean> => {
    if (audioContext.isUnlocked) {
      console.log('🎵 音频上下文已解锁，跳过重复解锁')
      return true
    }

    try {
      console.log('🔓 正在解锁音频上下文...')
      
      // 使用实际存在的音效文件解锁
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
      audioContext.isUnlocked = true // 即使失败也标记为解锁，避免阻塞
      return true
    }
  }

  // 🔥 播放音效 - 完全实时加载
  const playSound = async (
    soundId: string,
    options: {
      volume?: number
      loop?: boolean
      interrupt?: boolean
    } = {}
  ): Promise<boolean> => {
    // 如果音频系统未就绪，静默返回
    if (!canPlayAudio.value) {
      console.warn('⚠️ 音频系统未就绪，跳过播放:', soundId)
      return false
    }

    const soundDef = soundDefinitions[soundId]
    if (!soundDef) {
      console.warn(`⚠️ 未找到音效: ${soundId}`)
      return false
    }

    // 检查音效类别是否启用
    const categoryVolume = effectiveVolume.value[soundDef.category]
    if (categoryVolume <= 0) {
      console.log(`🔇 ${soundDef.category} 类别音效已禁用，跳过播放:`, soundId)
      return false
    }

    try {
      // 🔥 背景音乐处理 - 特殊逻辑
      if (soundDef.category === 'music') {
        return await handleBackgroundMusic(soundDef, options, categoryVolume)
      }

      // 🔥 音效处理 - 实时创建并播放
      const audio = new Audio(soundDef.url)
      const finalVolume = (options.volume ?? soundDef.volume ?? 1) * categoryVolume
      
      audio.volume = finalVolume
      audio.loop = options.loop ?? soundDef.loop ?? false

      // 🔥 音效播放时降低背景音乐音量（优先级控制）
      const originalBgVolume = audioContext.currentBackgroundMusic?.volume || 0
      if (audioContext.currentBackgroundMusic && !audioContext.currentBackgroundMusic.paused) {
        audioContext.currentBackgroundMusic.volume = originalBgVolume * 0.3 // 降低到30%
      }

      // 播放音效
      await audio.play()
      
      // 音效结束后恢复背景音乐音量
      audio.addEventListener('ended', () => {
        if (audioContext.currentBackgroundMusic && !audioContext.currentBackgroundMusic.paused) {
          audioContext.currentBackgroundMusic.volume = originalBgVolume
        }
      })

      // 触发震动（简单的统一震动）
      if (config.enableVibration && 'vibrate' in navigator) {
        navigator.vibrate(50) // 统一使用50ms震动
      }

      console.log(`🎵 音效播放成功: ${soundId}`)
      return true
    } catch (error) {
      console.error(`❌ 播放音效失败 ${soundId}:`, error)
      return false
    }
  }

  // 🔥 背景音乐处理
  const handleBackgroundMusic = async (
    soundDef: SoundDefinition, 
    options: any, 
    categoryVolume: number
  ): Promise<boolean> => {
    try {
      // 如果当前有背景音乐在播放，先停止
      if (audioContext.currentBackgroundMusic) {
        audioContext.currentBackgroundMusic.pause()
        audioContext.currentBackgroundMusic = null
      }

      // 创建新的背景音乐
      const audio = new Audio(soundDef.url)
      const finalVolume = (options.volume ?? soundDef.volume ?? 1) * categoryVolume
      
      audio.volume = finalVolume
      audio.loop = true // 背景音乐总是循环
      
      await audio.play()
      audioContext.currentBackgroundMusic = audio
      
      console.log(`🎵 背景音乐播放成功: ${soundDef.id}`)
      return true
    } catch (error) {
      console.error(`❌ 播放背景音乐失败 ${soundDef.id}:`, error)
      return false
    }
  }

  // 🔥 停止背景音乐
  const stopBackgroundMusic = (): void => {
    if (audioContext.currentBackgroundMusic) {
      audioContext.currentBackgroundMusic.pause()
      audioContext.currentBackgroundMusic = null
      console.log('🎵 背景音乐已停止')
    }
  }

  // 🔥 背景音乐控制
  const playBackgroundMusic = async (): Promise<boolean> => {
    return await playSound('bg001')
  }

  const pauseBackgroundMusic = (): void => {
    if (audioContext.currentBackgroundMusic && !audioContext.currentBackgroundMusic.paused) {
      audioContext.currentBackgroundMusic.pause()
      console.log('⏸️ 背景音乐已暂停')
    }
  }

  const resumeBackgroundMusic = (): void => {
    if (audioContext.currentBackgroundMusic && audioContext.currentBackgroundMusic.paused) {
      audioContext.currentBackgroundMusic.play()
      console.log('▶️ 背景音乐已恢复')
    }
  }

  // 🔥 新增：检查并自动播放背景音乐
  const startBackgroundMusicIfEnabled = async (): Promise<boolean> => {
    console.log('🎵 检查背景音乐设置:', {
      enableMusic: config.enableMusic,
      canPlayAudio: canPlayAudio.value,
      hasCurrentMusic: !!audioContext.currentBackgroundMusic
    })

    if (config.enableMusic && canPlayAudio.value && !audioContext.currentBackgroundMusic) {
      console.log('🎵 自动开始播放背景音乐')
      return await playBackgroundMusic()
    }
    
    return false
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

  // 🔥 音量控制
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

  // 🔥 修改：音效开关 - 立即生效
  const toggleSfx = (): void => {
    config.enableSfx = !config.enableSfx
    console.log('🎵 音效开关切换:', config.enableSfx ? '开启' : '关闭')
    saveConfig()
  }

  // 🔥 修改：背景音乐开关 - 立即播放/停止
  const toggleMusic = (): void => {
    config.enableMusic = !config.enableMusic
    console.log('🎵 背景音乐开关切换:', config.enableMusic ? '开启' : '关闭')
    
    if (config.enableMusic) {
      // 开启背景音乐：立即播放
      if (canPlayAudio.value) {
        playBackgroundMusic()
      }
    } else {
      // 关闭背景音乐：立即停止
      stopBackgroundMusic()
    }
    
    saveConfig()
  }

  // 更新背景音乐音量
  const updateBackgroundMusicVolume = (): void => {
    if (audioContext.currentBackgroundMusic) {
      const newVolume = effectiveVolume.value.music
      audioContext.currentBackgroundMusic.volume = newVolume
    }
  }

  // 🔥 配置管理
  const saveConfig = (): void => {
    try {
      localStorage.setItem('sicbo_audio_config', JSON.stringify(config))
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
        Object.assign(config, savedConfig)
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
    hasBackgroundMusic: !!audioContext.currentBackgroundMusic,
    isBackgroundMusicPlaying: audioContext.currentBackgroundMusic && !audioContext.currentBackgroundMusic.paused,
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
    
    // 核心方法
    initializeAudio,
    unlockAudioContext,
    playSound,
    
    // 背景音乐控制
    playBackgroundMusic,
    stopBackgroundMusic,
    pauseBackgroundMusic,
    resumeBackgroundMusic,
    startBackgroundMusicIfEnabled, // 🔥 新增方法
    
    // 音量和开关控制
    setMasterVolume,
    setSfxVolume,
    setMusicVolume,
    toggleSfx,
    toggleMusic,
    
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
    getAudioInfo
  }
}

// 🔥 单例模式的 useAudio 导出
export const useAudio = () => {
  if (!audioSystemInstance) {
    console.log('🎵 首次创建音频系统单例（实时加载模式）')
    audioSystemInstance = createAudioSystem()
    // 创建时就加载配置
    audioSystemInstance.loadConfig()
  }
  
  return audioSystemInstance
}

// 🔥 全局初始化方法 - 只能被调用一次
export const initializeGlobalAudioSystem = async (): Promise<boolean> => {
  if (isGlobalInitialized) {
    console.log('🎵 全局音频系统已初始化，跳过')
    return true
  }
  
  console.log('🎵 开始全局音频系统初始化（实时加载模式）')
  const audioSystem = useAudio()
  const result = await audioSystem.initializeAudio()
  
  if (result) {
    isGlobalInitialized = true
    console.log('✅ 全局音频系统初始化完成（实时加载模式）')
  }
  
  return result
}

// 🔥 全局解锁方法
export const unlockGlobalAudioContext = async (): Promise<boolean> => {
  const audioSystem = useAudio()
  return await audioSystem.unlockAudioContext()
}