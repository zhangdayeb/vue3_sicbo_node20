import { ref, computed, reactive, watch, onMounted, onUnmounted, readonly } from 'vue'

export interface AudioConfig {
  masterVolume: number
  sfxVolume: number
  musicVolume: number
  enableSfx: boolean
  enableMusic: boolean
  enableVibration: boolean
  audioQuality: 'low' | 'medium' | 'high'
  maxConcurrentSounds: number
}

export interface SoundDefinition {
  id: string
  url: string
  volume?: number
  loop?: boolean
  category: 'sfx' | 'music' | 'voice'
  preload?: boolean
  fallbackUrl?: string
}

export interface AudioInstance {
  id: string
  audio: HTMLAudioElement
  soundId: string
  isPlaying: boolean
  isPaused: boolean
  startTime: number
  duration: number
  volume: number
  loop: boolean
}

export interface AudioContextState {
  isUnlocked: boolean
  isSupported: boolean
  activeInstances: Map<string, AudioInstance>
  preloadedSounds: Map<string, HTMLAudioElement>
  audioContext?: AudioContext
}

export const useAudio = () => {
  // 音效配置
  const config = reactive<AudioConfig>({
    masterVolume: 0.8,
    sfxVolume: 0.7,
    musicVolume: 0.4,
    enableSfx: true,
    enableMusic: true,
    enableVibration: true,
    audioQuality: 'medium',
    maxConcurrentSounds: 10
  })

  // 音效定义 - 修正路径为 src/assets/audio
  const soundDefinitions = ref<SoundDefinition[]>([
    // UI 音效
    {
      id: 'click',
      url: new URL('@/assets/audio/chip-select.mp3', import.meta.url).href,
      category: 'sfx',
      volume: 0.6,
      preload: true
    },
    {
      id: 'hover',
      url: new URL('@/assets/audio/chip-select.mp3', import.meta.url).href,
      category: 'sfx',
      volume: 0.4,
      preload: true
    },
    {
      id: 'error',
      url: new URL('@/assets/audio/error.mp3', import.meta.url).href,
      category: 'sfx',
      volume: 0.8,
      preload: true
    },
    {
      id: 'success',
      url: new URL('@/assets/audio/bet-confirm.mp3', import.meta.url).href,
      category: 'sfx',
      volume: 0.7,
      preload: true
    },

    // 筹码音效
    {
      id: 'chip-select',
      url: new URL('@/assets/audio/chip-select.mp3', import.meta.url).href,
      category: 'sfx',
      volume: 0.7,
      preload: true
    },
    {
      id: 'chip-place',
      url: new URL('@/assets/audio/chip-place.mp3', import.meta.url).href,
      category: 'sfx',
      volume: 0.8,
      preload: true
    },

    // 游戏音效
    {
      id: 'bet-confirm',
      url: new URL('@/assets/audio/bet-confirm.mp3', import.meta.url).href,
      category: 'sfx',
      volume: 0.9,
      preload: true
    },
    {
      id: 'dice-shake',
      url: new URL('@/assets/audio/dice-shake.mp3', import.meta.url).href,
      category: 'sfx',
      volume: 0.8,
      preload: true
    },
    {
      id: 'dice-roll',
      url: new URL('@/assets/audio/dice-roll.mp3', import.meta.url).href,
      category: 'sfx',
      volume: 0.7,
      preload: true
    },

    // 中奖音效
    {
      id: 'win-small',
      url: new URL('@/assets/audio/win-small.mp3', import.meta.url).href,
      category: 'sfx',
      volume: 0.9,
      preload: true
    },
    {
      id: 'win',
      url: new URL('@/assets/audio/win.mp3', import.meta.url).href,
      category: 'sfx',
      volume: 1.0,
      preload: true
    }
  ])

  // 音频上下文
  const audioContext = reactive<AudioContextState>({
    isUnlocked: false,
    isSupported: true,
    activeInstances: new Map(),
    preloadedSounds: new Map(),
    audioContext: undefined
  })

  // 状态
  const isInitialized = ref(false)
  const currentBackgroundMusic = ref<string | null>(null)
  const fadeTransitions = ref<Map<string, number>>(new Map())

  // 计算属性
  const canPlayAudio = computed(() => {
    return audioContext.isSupported && audioContext.isUnlocked && isInitialized.value
  })

  const effectiveVolume = computed(() => ({
    sfx: config.enableSfx ? config.masterVolume * config.sfxVolume : 0,
    music: config.enableMusic ? config.masterVolume * config.musicVolume : 0,
    voice: config.enableSfx ? config.masterVolume * config.sfxVolume : 0
  }))

  // 初始化音频系统
  const initializeAudio = async (): Promise<boolean> => {
    try {
      // 检查浏览器支持
      if (typeof Audio === 'undefined') {
        audioContext.isSupported = false
        return false
      }

      // 创建 Web Audio Context（如果支持）
      if (typeof window !== 'undefined') {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
        if (AudioContextClass) {
          audioContext.audioContext = new AudioContextClass()
        }
      }

      // 预加载标记为预加载的音效
      await preloadSounds()

      isInitialized.value = true
      console.log('音频系统初始化完成')
      return true
    } catch (error) {
      console.error('音频系统初始化失败:', error)
      audioContext.isSupported = false
      return false
    }
  }

  // 解锁音频上下文（移动端需要）
  const unlockAudioContext = async (): Promise<boolean> => {
    if (audioContext.isUnlocked) return true

    try {
      // 播放静音音频解锁
      const silentAudio = new Audio()
      silentAudio.volume = 0
      silentAudio.muted = true
      
      // 创建短暂的音频数据
      const audioBuffer = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAAAAAA=='
      silentAudio.src = audioBuffer
      
      const playPromise = silentAudio.play()
      if (playPromise) {
        await playPromise
        silentAudio.pause()
        silentAudio.currentTime = 0
      }

      // 解锁 Web Audio Context
      if (audioContext.audioContext && audioContext.audioContext.state === 'suspended') {
        await audioContext.audioContext.resume()
      }

      audioContext.isUnlocked = true
      console.log('音频上下文已解锁')
      return true
    } catch (error) {
      console.warn('音频上下文解锁失败:', error)
      return false
    }
  }

  // 预加载音效
  const preloadSounds = async (): Promise<void> => {
    const preloadPromises = soundDefinitions.value
      .filter(sound => sound.preload)
      .map(async (sound) => {
        try {
          const audio = new Audio()
          audio.preload = 'auto'
          audio.volume = 0 // 预加载时静音
          
          // 设置音频源
          audio.src = sound.url
          
          // 添加错误处理
          audio.addEventListener('error', (e) => {
            console.warn(`音效预加载失败: ${sound.id}`, e)
            if (sound.fallbackUrl) {
              audio.src = sound.fallbackUrl
            }
          })

          // 等待加载完成
          await new Promise<void>((resolve, reject) => {
            audio.addEventListener('canplaythrough', () => resolve(), { once: true })
            audio.addEventListener('error', () => resolve(), { once: true }) // 改为 resolve 而不是 reject
            audio.load()
          })

          audioContext.preloadedSounds.set(sound.id, audio)
          console.log(`音效预加载完成: ${sound.id}`)
        } catch (error) {
          console.warn(`音效预加载失败: ${sound.id}`, error)
        }
      })

    await Promise.allSettled(preloadPromises)
  }

  // 创建音频实例
  const createAudioInstance = (soundId: string): HTMLAudioElement | null => {
    const soundDef = soundDefinitions.value.find(s => s.id === soundId)
    if (!soundDef) return null

    // 优先使用预加载的音频
    const preloadedAudio = audioContext.preloadedSounds.get(soundId)
    if (preloadedAudio) {
      return preloadedAudio.cloneNode(true) as HTMLAudioElement
    }

    // 创建新的音频实例
    const audio = new Audio()
    audio.src = soundDef.url
    audio.preload = 'auto'
    
    // 添加错误处理
    if (soundDef.fallbackUrl) {
      audio.addEventListener('error', () => {
        audio.src = soundDef.fallbackUrl!
      }, { once: true })
    }

    return audio
  }

  // 播放音效
  const playSound = async (
    soundId: string,
    options: {
      volume?: number
      loop?: boolean
      fadeIn?: number
      delay?: number
      interrupt?: boolean
    } = {}
  ): Promise<string | null> => {
    // 如果音频系统未就绪，静默返回
    if (!canPlayAudio.value) {
      console.warn('音频系统未就绪，跳过播放:', soundId)
      return null
    }

    const soundDef = soundDefinitions.value.find(s => s.id === soundId)
    if (!soundDef) {
      console.warn(`未找到音效: ${soundId}`)
      return null
    }

    // 检查音效类别是否启用
    const categoryVolume = effectiveVolume.value[soundDef.category]
    if (categoryVolume <= 0) {
      return null
    }

    try {
      // 检查并发数量限制
      if (audioContext.activeInstances.size >= config.maxConcurrentSounds) {
        // 停止最早的音频实例
        const oldestInstance = Array.from(audioContext.activeInstances.values())
          .sort((a, b) => a.startTime - b.startTime)[0]
        if (oldestInstance) {
          stopSound(oldestInstance.id)
        }
      }

      // 如果需要中断同类型音效
      if (options.interrupt) {
        Array.from(audioContext.activeInstances.values())
          .filter(instance => instance.soundId === soundId)
          .forEach(instance => stopSound(instance.id))
      }

      // 创建音频实例
      const audio = createAudioInstance(soundId)
      if (!audio) return null

      // 生成实例ID
      const instanceId = `${soundId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // 配置音频
      const finalVolume = (options.volume ?? soundDef.volume ?? 1) * categoryVolume
      audio.volume = finalVolume
      audio.loop = options.loop ?? soundDef.loop ?? false

      // 延迟播放
      if (options.delay && options.delay > 0) {
        await new Promise(resolve => setTimeout(resolve, options.delay))
      }

      // 创建实例记录
      const instance: AudioInstance = {
        id: instanceId,
        audio,
        soundId,
        isPlaying: false,
        isPaused: false,
        startTime: Date.now(),
        duration: 0,
        volume: finalVolume,
        loop: audio.loop
      }

      // 添加事件监听器
      audio.addEventListener('loadedmetadata', () => {
        instance.duration = audio.duration * 1000
      })

      audio.addEventListener('ended', () => {
        if (!instance.loop) {
          audioContext.activeInstances.delete(instanceId)
        }
      })

      audio.addEventListener('error', (error) => {
        console.error(`音效播放错误 ${soundId}:`, error)
        audioContext.activeInstances.delete(instanceId)
      })

      // 播放音频
      await audio.play()
      instance.isPlaying = true

      // 淡入效果
      if (options.fadeIn && options.fadeIn > 0) {
        await fadeInAudio(audio, finalVolume, options.fadeIn)
      }

      // 触发震动（如果启用且支持）
      if (config.enableVibration && 'vibrate' in navigator) {
        const vibrationPattern = getVibrationPattern(soundId)
        if (vibrationPattern) {
          navigator.vibrate(vibrationPattern)
        }
      }

      audioContext.activeInstances.set(instanceId, instance)
      console.log(`音效播放: ${soundId} (${instanceId})`)
      return instanceId
    } catch (error) {
      console.error(`播放音效失败 ${soundId}:`, error)
      return null
    }
  }

  // 停止音效
  const stopSound = (instanceId: string, fadeOut?: number): boolean => {
    const instance = audioContext.activeInstances.get(instanceId)
    if (!instance) return false

    if (fadeOut && fadeOut > 0) {
      fadeOutAudio(instance.audio, fadeOut).then(() => {
        instance.audio.pause()
        instance.audio.currentTime = 0
        audioContext.activeInstances.delete(instanceId)
      })
    } else {
      instance.audio.pause()
      instance.audio.currentTime = 0
      audioContext.activeInstances.delete(instanceId)
    }

    instance.isPlaying = false
    return true
  }

  // 停止所有音效
  const stopAllSounds = (category?: 'sfx' | 'music' | 'voice', fadeOut?: number): void => {
    const instancesToStop = Array.from(audioContext.activeInstances.values())
    
    if (category) {
      const soundsInCategory = soundDefinitions.value
        .filter(s => s.category === category)
        .map(s => s.id)
      
      instancesToStop
        .filter(instance => soundsInCategory.includes(instance.soundId))
        .forEach(instance => stopSound(instance.id, fadeOut))
    } else {
      instancesToStop.forEach(instance => stopSound(instance.id, fadeOut))
    }
  }

  // 音频淡入效果
  const fadeInAudio = async (audio: HTMLAudioElement, targetVolume: number, duration: number): Promise<void> => {
    return new Promise((resolve) => {
      const startVolume = 0
      const volumeStep = targetVolume / (duration / 16) // 60fps
      let currentVolume = startVolume
      
      audio.volume = startVolume
      
      const fadeInterval = setInterval(() => {
        currentVolume += volumeStep
        if (currentVolume >= targetVolume) {
          audio.volume = targetVolume
          clearInterval(fadeInterval)
          resolve()
        } else {
          audio.volume = currentVolume
        }
      }, 16)
    })
  }

  // 音频淡出效果
  const fadeOutAudio = async (audio: HTMLAudioElement, duration: number): Promise<void> => {
    return new Promise((resolve) => {
      const startVolume = audio.volume
      const volumeStep = startVolume / (duration / 16) // 60fps
      let currentVolume = startVolume
      
      const fadeInterval = setInterval(() => {
        currentVolume -= volumeStep
        if (currentVolume <= 0) {
          audio.volume = 0
          clearInterval(fadeInterval)
          resolve()
        } else {
          audio.volume = currentVolume
        }
      }, 16)
    })
  }

  // 获取震动模式
  const getVibrationPattern = (soundId: string): number[] | null => {
    const vibrationPatterns: Record<string, number[]> = {
      'click': [50],
      'error': [200, 100, 200],
      'success': [100, 50, 100, 50, 100],
      'win-small': [100, 100, 100],
      'bet-confirm': [100]
    }

    return vibrationPatterns[soundId] || null
  }

  // 快捷播放方法
  const playChipSelectSound = () => playSound('chip-select')
  const playChipPlaceSound = () => playSound('chip-place')
  const playBetConfirmSound = () => playSound('bet-confirm')
  const playErrorSound = () => playSound('error')
  const playWinSound = (type: 'small' | 'medium' | 'big' | 'jackpot' = 'small') => {
    if (type === 'small') {
      playSound('win-small')
    } else {
      playSound('win')
    }
  }

  // 音量控制
  const setMasterVolume = (volume: number): void => {
    config.masterVolume = Math.max(0, Math.min(1, volume))
    updateAllVolumes()
    saveConfig()
  }

  const setSfxVolume = (volume: number): void => {
    config.sfxVolume = Math.max(0, Math.min(1, volume))
    updateAllVolumes()
    saveConfig()
  }

  const setMusicVolume = (volume: number): void => {
    config.musicVolume = Math.max(0, Math.min(1, volume))
    updateAllVolumes()
    saveConfig()
  }

  // 更新所有活动音频的音量
  const updateAllVolumes = (): void => {
    audioContext.activeInstances.forEach(instance => {
      const soundDef = soundDefinitions.value.find(s => s.id === instance.soundId)
      if (soundDef) {
        const categoryVolume = effectiveVolume.value[soundDef.category]
        const baseVolume = soundDef.volume ?? 1
        instance.audio.volume = baseVolume * categoryVolume
      }
    })
  }

  // 配置管理
  const saveConfig = (): void => {
    try {
      localStorage.setItem('sicbo_audio_config', JSON.stringify(config))
    } catch (error) {
      console.error('保存音频配置失败:', error)
    }
  }

  const loadConfig = (): void => {
    try {
      const saved = localStorage.getItem('sicbo_audio_config')
      if (saved) {
        const savedConfig = JSON.parse(saved)
        Object.assign(config, savedConfig)
      }
    } catch (error) {
      console.error('加载音频配置失败:', error)
    }
  }

  // 获取音频信息
  const getAudioInfo = () => ({
    isInitialized: isInitialized.value,
    canPlayAudio: canPlayAudio.value,
    activeInstancesCount: audioContext.activeInstances.size,
    preloadedSoundsCount: audioContext.preloadedSounds.size,
    currentBackgroundMusic: currentBackgroundMusic.value,
    config: { ...config }
  })

  // 监听配置变化
  watch(() => config.enableSfx, (enabled) => {
    if (!enabled) {
      stopAllSounds('sfx')
    }
  })

  watch(() => config.enableMusic, (enabled) => {
    if (!enabled) {
      stopAllSounds('music')
    }
  })

  // 生命周期
  onMounted(() => {
    loadConfig()
    initializeAudio()
    
    // 监听用户交互以解锁音频
    const unlockEvents = ['click', 'touchstart', 'keydown']
    const unlockHandler = () => {
      unlockAudioContext()
      unlockEvents.forEach(event => {
        document.removeEventListener(event, unlockHandler)
      })
    }
    
    unlockEvents.forEach(event => {
      document.addEventListener(event, unlockHandler, { once: true })
    })
  })

  onUnmounted(() => {
    stopAllSounds()
    saveConfig()
  })

  return {
    // 状态
    config,
    audioContext: readonly(audioContext),
    isInitialized: readonly(isInitialized),
    currentBackgroundMusic: readonly(currentBackgroundMusic),
    
    // 计算属性
    canPlayAudio,
    effectiveVolume,
    
    // 核心方法
    initializeAudio,
    unlockAudioContext,
    playSound,
    stopSound,
    stopAllSounds,
    
    // 音量控制
    setMasterVolume,
    setSfxVolume,
    setMusicVolume,
    
    // 快捷方法
    playChipSelectSound,
    playChipPlaceSound,
    playBetConfirmSound,
    playErrorSound,
    playWinSound,
    
    // 配置管理
    saveConfig,
    loadConfig,
    getAudioInfo,
    
    // 高级功能
    soundDefinitions,
    fadeInAudio,
    fadeOutAudio
  }
}