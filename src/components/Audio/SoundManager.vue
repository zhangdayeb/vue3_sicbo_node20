<template>
  <div class="sound-manager">
    <!-- 音频元素容器 - 隐藏但预加载 -->
    <div class="audio-preloader" style="display: none;">
      <!-- 背景音乐 -->
      <audio 
        ref="bgMusic" 
        loop 
        preload="auto"
        :volume="settings.bgMusicVolume"
      >
        <source src="/audio/bg-music.mp3" type="audio/mpeg">
        <source src="/audio/bg-music.ogg" type="audio/ogg">
      </audio>
      
      <!-- 音效音频 -->
      <audio 
        v-for="sound in soundEffects"
        :key="sound.id"
        :ref="(el: any) => setSoundRef(sound.id, el as HTMLAudioElement)"
        preload="auto"
        :volume="settings.sfxVolume"
      >
        <source :src="sound.mp3" type="audio/mpeg">
        <source :src="sound.ogg" type="audio/ogg">
      </audio>
      
      <!-- 动态音频池 -->
      <audio 
        v-for="audio in audioPool"
        :key="audio.id"
        :ref="(el: any) => setPoolRef(audio.id, el as HTMLAudioElement)"
        preload="auto"
        :volume="settings.sfxVolume"
      >
        <source :src="audio.src" type="audio/mpeg">
      </audio>
    </div>
    
    <!-- 音效控制面板（可选显示） -->
    <div v-if="showControls" class="sound-controls">
      <div class="controls-header">
        <h3 class="controls-title">音效设置</h3>
        <button class="close-btn" @click="$emit('close-controls')">×</button>
      </div>
      
      <div class="control-group">
        <label class="control-label">
          <input 
            v-model="settings.masterEnabled" 
            type="checkbox"
            @change="onMasterToggle"
          >
          <span class="checkbox-custom"></span>
          启用音效
        </label>
      </div>
      
      <div class="control-group">
        <label class="control-label">
          <input 
            v-model="settings.bgMusicEnabled" 
            type="checkbox"
            :disabled="!settings.masterEnabled"
            @change="onBgMusicToggle"
          >
          <span class="checkbox-custom"></span>
          背景音乐
        </label>
        <div class="volume-slider">
          <input 
            v-model="settings.bgMusicVolume"
            type="range" 
            min="0" 
            max="1" 
            step="0.1"
            :disabled="!settings.masterEnabled || !settings.bgMusicEnabled"
            @input="onBgVolumeChange"
            class="slider"
          >
          <span class="volume-label">{{ Math.round(settings.bgMusicVolume * 100) }}%</span>
        </div>
      </div>
      
      <div class="control-group">
        <label class="control-label">
          <input 
            v-model="settings.sfxEnabled" 
            type="checkbox"
            :disabled="!settings.masterEnabled"
          >
          <span class="checkbox-custom"></span>
          音效
        </label>
        <div class="volume-slider">
          <input 
            v-model="settings.sfxVolume"
            type="range" 
            min="0" 
            max="1" 
            step="0.1"
            :disabled="!settings.masterEnabled || !settings.sfxEnabled"
            @input="onSfxVolumeChange"
            class="slider"
          >
          <span class="volume-label">{{ Math.round(settings.sfxVolume * 100) }}%</span>
        </div>
      </div>
      
      <div class="control-group">
        <button class="test-btn" @click="testSound" :disabled="!canPlaySounds">
          测试音效
        </button>
      </div>
      
      <!-- 预设选项 -->
      <div class="preset-group">
        <div class="preset-title">快速设置</div>
        <div class="preset-buttons">
          <button class="preset-btn" @click="applyPreset('silent')">静音</button>
          <button class="preset-btn" @click="applyPreset('low')">低音量</button>
          <button class="preset-btn" @click="applyPreset('medium')">中音量</button>
          <button class="preset-btn" @click="applyPreset('high')">高音量</button>
        </div>
      </div>
    </div>
    
    <!-- 音效状态指示器 -->
    <div v-if="showIndicator" class="sound-indicator" :class="{ 'muted': !canPlaySounds }">
      <div class="indicator-icon">
        {{ canPlaySounds ? '🔊' : '🔇' }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'

// 音效配置接口
interface SoundEffect {
  id: string
  name: string
  mp3: string
  ogg?: string
  volume?: number
  loop?: boolean
  category?: 'ui' | 'game' | 'ambient'
}

interface AudioSettings {
  masterEnabled: boolean
  bgMusicEnabled: boolean
  sfxEnabled: boolean
  bgMusicVolume: number
  sfxVolume: number
}

interface AudioPoolItem {
  id: string
  src: string
  element?: HTMLAudioElement
  inUse: boolean
}

// Props
interface Props {
  showControls?: boolean
  showIndicator?: boolean
  autoPlay?: boolean
  enableCache?: boolean
  maxPoolSize?: number
}

const props = withDefaults(defineProps<Props>(), {
  showControls: false,
  showIndicator: true,
  autoPlay: false,
  enableCache: true,
  maxPoolSize: 10
})

// Emits
const emit = defineEmits<{
  'settings-changed': [settings: AudioSettings]
  'sound-played': [soundId: string]
  'sound-error': [error: string]
  'close-controls': []
}>()

// 音效文件配置
const soundEffects: SoundEffect[] = [
  {
    id: 'chip-select',
    name: '选择筹码',
    mp3: '/audio/chip-select.mp3',
    ogg: '/audio/chip-select.ogg',
    volume: 0.7,
    category: 'ui'
  },
  {
    id: 'chip-place',
    name: '放置筹码',
    mp3: '/audio/chip-place.mp3',
    ogg: '/audio/chip-place.ogg',
    volume: 0.8,
    category: 'game'
  },
  {
    id: 'bet-confirm',
    name: '确认投注',
    mp3: '/audio/bet-confirm.mp3',
    ogg: '/audio/bet-confirm.ogg',
    volume: 0.9,
    category: 'game'
  },
  {
    id: 'dice-shake',
    name: '摇骰音效',
    mp3: '/audio/dice-shake.mp3',
    ogg: '/audio/dice-shake.ogg',
    volume: 0.8,
    category: 'game'
  },
  {
    id: 'dice-roll',
    name: '骰子滚动',
    mp3: '/audio/dice-roll.mp3',
    ogg: '/audio/dice-roll.ogg',
    volume: 0.7,
    category: 'game'
  },
  {
    id: 'dice-reveal',
    name: '揭晓结果',
    mp3: '/audio/dice-reveal.mp3',
    ogg: '/audio/dice-reveal.ogg',
    volume: 0.8,
    category: 'game'
  },
  {
    id: 'win-small',
    name: '小奖中奖',
    mp3: '/audio/win-small.mp3',
    ogg: '/audio/win-small.ogg',
    volume: 0.9,
    category: 'game'
  },
  {
    id: 'win-big',
    name: '大奖中奖',
    mp3: '/audio/win-big.mp3',
    ogg: '/audio/win-big.ogg',
    volume: 1.0,
    category: 'game'
  },
  {
    id: 'win-jackpot',
    name: '头奖中奖',
    mp3: '/audio/win-jackpot.mp3',
    ogg: '/audio/win-jackpot.ogg',
    volume: 1.0,
    category: 'game'
  },
  {
    id: 'button-click',
    name: '按钮点击',
    mp3: '/audio/button-click.mp3',
    ogg: '/audio/button-click.ogg',
    volume: 0.6,
    category: 'ui'
  },
  {
    id: 'error',
    name: '错误提示',
    mp3: '/audio/error.mp3',
    ogg: '/audio/error.ogg',
    volume: 0.8,
    category: 'ui'
  },
  {
    id: 'notification',
    name: '通知提示',
    mp3: '/audio/notification.mp3',
    ogg: '/audio/notification.ogg',
    volume: 0.7,
    category: 'ui'
  }
]

// 响应式数据
const settings = reactive<AudioSettings>({
  masterEnabled: true,
  bgMusicEnabled: true,
  sfxEnabled: true,
  bgMusicVolume: 0.3,
  sfxVolume: 0.7
})

const soundRefs = ref<Record<string, HTMLAudioElement>>({})
const audioPool = ref<AudioPoolItem[]>([])
const bgMusic = ref<HTMLAudioElement>()
const isAudioContextUnlocked = ref(false)
const loadingStates = ref<Record<string, boolean>>({})
const errorStates = ref<Record<string, string>>({})

// 计算属性
const canPlaySounds = computed(() => {
  return settings.masterEnabled && isAudioContextUnlocked.value
})

const canPlayBgMusic = computed(() => {
  return canPlaySounds.value && settings.bgMusicEnabled
})

const canPlaySfx = computed(() => {
  return canPlaySounds.value && settings.sfxEnabled
})

// 方法
const setSoundRef = (soundId: string, el: HTMLAudioElement | null) => {
  if (el) {
    soundRefs.value[soundId] = el
    setupAudioElement(el, soundId)
  }
}

const setPoolRef = (poolId: string, el: HTMLAudioElement | null) => {
  if (el) {
    const poolItem = audioPool.value.find(item => item.id === poolId)
    if (poolItem) {
      poolItem.element = el
      setupAudioElement(el, poolId)
    }
  }
}

const setupAudioElement = (audio: HTMLAudioElement, id: string) => {
  // 设置音频属性
  audio.preload = 'auto'
  
  // 错误处理
  audio.addEventListener('error', (e) => {
    const error = `Failed to load audio: ${id}`
    errorStates.value[id] = error
    emit('sound-error', error)
    console.error(error, e)
  })
  
  // 加载完成
  audio.addEventListener('canplaythrough', () => {
    loadingStates.value[id] = false
    console.log(`Audio loaded: ${id}`)
  })
  
  // 加载开始
  audio.addEventListener('loadstart', () => {
    loadingStates.value[id] = true
  })
  
  // 播放结束
  audio.addEventListener('ended', () => {
    // 如果是池中的音频，标记为可用
    const poolItem = audioPool.value.find(item => item.id === id)
    if (poolItem) {
      poolItem.inUse = false
    }
  })
}

// 音频上下文解锁（移动端需要用户交互）
const unlockAudioContext = async () => {
  if (isAudioContextUnlocked.value) return

  try {
    // 创建临时音频上下文
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext
    if (AudioContext) {
      const audioContext = new AudioContext()
      if (audioContext.state === 'suspended') {
        await audioContext.resume()
      }
      audioContext.close()
    }
    
    // 播放静音音频以解锁
    const silentAudio = new Audio()
    silentAudio.volume = 0
    silentAudio.muted = true
    
    const playPromise = silentAudio.play()
    if (playPromise) {
      await playPromise
      silentAudio.pause()
      silentAudio.currentTime = 0
    }
    
    isAudioContextUnlocked.value = true
    console.log('Audio context unlocked')
    
    // 如果设置了自动播放背景音乐
    if (props.autoPlay && canPlayBgMusic.value) {
      await nextTick()
      playBackgroundMusic()
    }
  } catch (error) {
    console.warn('Failed to unlock audio context:', error)
  }
}

// 播放音效
const playSound = async (
  soundId: string, 
  options: {
    volume?: number
    loop?: boolean
    force?: boolean
    fadeIn?: number
  } = {}
): Promise<boolean> => {
  if (!canPlaySfx.value && !options.force) {
    return false
  }

  try {
    // 查找音效配置
    const soundConfig = soundEffects.find(s => s.id === soundId)
    if (!soundConfig) {
      throw new Error(`Sound not found: ${soundId}`)
    }

    // 获取音频元素
    let audio = soundRefs.value[soundId]
    
    // 如果音频正在播放且需要重叠播放，使用音频池
    if (audio && !audio.paused && !audio.ended) {
      audio = getPooledAudio(soundConfig.mp3)
    }
    
    if (!audio) {
      throw new Error(`Audio element not found: ${soundId}`)
    }

    // 设置音频属性
    const volume = options.volume ?? soundConfig.volume ?? settings.sfxVolume
    audio.volume = Math.max(0, Math.min(1, volume))
    audio.loop = options.loop ?? soundConfig.loop ?? false

    // 重置播放位置
    audio.currentTime = 0

    // 播放音频
    const playPromise = audio.play()
    if (playPromise) {
      await playPromise
      
      // 淡入效果
      if (options.fadeIn && options.fadeIn > 0) {
        fadeInAudio(audio, volume, options.fadeIn)
      }
      
      emit('sound-played', soundId)
      return true
    }
    
    return false
  } catch (error) {
    const errorMsg = `Failed to play sound ${soundId}: ${error}`
    errorStates.value[soundId] = errorMsg
    emit('sound-error', errorMsg)
    console.error(errorMsg)
    return false
  }
}

// 停止音效
const stopSound = (soundId: string, fadeOut?: number): void => {
  const audio = soundRefs.value[soundId]
  if (!audio) return

  if (fadeOut && fadeOut > 0) {
    fadeOutAudio(audio, fadeOut, () => {
      audio.pause()
      audio.currentTime = 0
    })
  } else {
    audio.pause()
    audio.currentTime = 0
  }
}

// 播放背景音乐
const playBackgroundMusic = async (): Promise<boolean> => {
  if (!canPlayBgMusic.value || !bgMusic.value) {
    return false
  }

  try {
    bgMusic.value.volume = settings.bgMusicVolume
    bgMusic.value.currentTime = 0
    
    const playPromise = bgMusic.value.play()
    if (playPromise) {
      await playPromise
      return true
    }
    
    return false
  } catch (error) {
    console.error('Failed to play background music:', error)
    return false
  }
}

// 停止背景音乐
const stopBackgroundMusic = (fadeOut?: number): void => {
  if (!bgMusic.value) return

  if (fadeOut && fadeOut > 0) {
    fadeOutAudio(bgMusic.value, fadeOut, () => {
      if (bgMusic.value) {
        bgMusic.value.pause()
        bgMusic.value.currentTime = 0
      }
    })
  } else {
    bgMusic.value.pause()
    bgMusic.value.currentTime = 0
  }
}

// 获取池化音频
const getPooledAudio = (src: string): HTMLAudioElement | null => {
  // 查找可用的池化音频
  let poolItem = audioPool.value.find(item => item.src === src && !item.inUse)
  
  if (!poolItem && audioPool.value.length < props.maxPoolSize) {
    // 创建新的池化音频
    const newId = `pool_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    poolItem = {
      id: newId,
      src,
      inUse: false
    }
    audioPool.value.push(poolItem)
  }
  
  if (poolItem && poolItem.element) {
    poolItem.inUse = true
    return poolItem.element
  }
  
  return null
}

// 音频淡入效果
const fadeInAudio = (audio: HTMLAudioElement, targetVolume: number, duration: number): void => {
  const startVolume = 0
  const volumeStep = targetVolume / (duration * 60) // 60fps
  let currentVolume = startVolume
  
  audio.volume = startVolume
  
  const fadeInterval = setInterval(() => {
    currentVolume += volumeStep
    if (currentVolume >= targetVolume) {
      audio.volume = targetVolume
      clearInterval(fadeInterval)
    } else {
      audio.volume = currentVolume
    }
  }, 1000 / 60)
}

// 音频淡出效果
const fadeOutAudio = (audio: HTMLAudioElement, duration: number, callback?: () => void): void => {
  const startVolume = audio.volume
  const volumeStep = startVolume / (duration * 60) // 60fps
  let currentVolume = startVolume
  
  const fadeInterval = setInterval(() => {
    currentVolume -= volumeStep
    if (currentVolume <= 0) {
      audio.volume = 0
      clearInterval(fadeInterval)
      callback?.()
    } else {
      audio.volume = currentVolume
    }
  }, 1000 / 60)
}

// 事件处理
const onMasterToggle = () => {
  if (!settings.masterEnabled) {
    stopAllSounds()
  }
  saveSettings()
}

const onBgMusicToggle = () => {
  if (settings.bgMusicEnabled && canPlayBgMusic.value) {
    playBackgroundMusic()
  } else {
    stopBackgroundMusic(500) // 500ms淡出
  }
  saveSettings()
}

const onBgVolumeChange = () => {
  if (bgMusic.value) {
    bgMusic.value.volume = settings.bgMusicVolume
  }
  saveSettings()
}

const onSfxVolumeChange = () => {
  // 更新所有音效的音量
  Object.values(soundRefs.value).forEach(audio => {
    if (audio && !audio.paused) {
      audio.volume = settings.sfxVolume
    }
  })
  saveSettings()
}

// 停止所有音效
const stopAllSounds = (): void => {
  // 停止背景音乐
  stopBackgroundMusic()
  
  // 停止所有音效
  Object.values(soundRefs.value).forEach(audio => {
    if (audio && !audio.paused) {
      audio.pause()
      audio.currentTime = 0
    }
  })
  
  // 停止池化音频
  audioPool.value.forEach(item => {
    if (item.element && !item.element.paused) {
      item.element.pause()
      item.element.currentTime = 0
      item.inUse = false
    }
  })
}

// 测试音效
const testSound = (): void => {
  playSound('chip-select', { volume: 0.8 })
}

// 应用预设
const applyPreset = (preset: 'silent' | 'low' | 'medium' | 'high'): void => {
  const presets = {
    silent: {
      masterEnabled: false,
      bgMusicEnabled: false,
      sfxEnabled: false,
      bgMusicVolume: 0,
      sfxVolume: 0
    },
    low: {
      masterEnabled: true,
      bgMusicEnabled: true,
      sfxEnabled: true,
      bgMusicVolume: 0.2,
      sfxVolume: 0.4
    },
    medium: {
      masterEnabled: true,
      bgMusicEnabled: true,
      sfxEnabled: true,
      bgMusicVolume: 0.4,
      sfxVolume: 0.7
    },
    high: {
      masterEnabled: true,
      bgMusicEnabled: true,
      sfxEnabled: true,
      bgMusicVolume: 0.8,
      sfxVolume: 1.0
    }
  }
  
  Object.assign(settings, presets[preset])
  
  if (settings.masterEnabled && settings.bgMusicEnabled) {
    playBackgroundMusic()
  } else {
    stopBackgroundMusic()
  }
  
  saveSettings()
}

// 保存设置到本地存储
const saveSettings = (): void => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('sicbo_audio_settings', JSON.stringify(settings))
  }
  emit('settings-changed', { ...settings })
}

// 加载设置从本地存储
const loadSettings = (): void => {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('sicbo_audio_settings')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        Object.assign(settings, parsed)
      } catch (error) {
        console.warn('Failed to load audio settings:', error)
      }
    }
  }
}

// 预加载音频
const preloadAudio = async (): Promise<void> => {
  const loadPromises = soundEffects.map(async (sound) => {
    const audio = soundRefs.value[sound.id]
    if (audio) {
      try {
        await audio.load()
      } catch (error) {
        console.warn(`Failed to preload ${sound.id}:`, error)
      }
    }
  })
  
  if (bgMusic.value) {
    loadPromises.push(
      new Promise<void>((resolve) => {
        if (bgMusic.value) {
          bgMusic.value.load()
        }
        resolve()
      })
    )
  }
  
  await Promise.allSettled(loadPromises)
}

// 暴露的方法
defineExpose({
  playSound,
  stopSound,
  playBackgroundMusic,
  stopBackgroundMusic,
  stopAllSounds,
  unlockAudioContext,
  applyPreset,
  settings
})

// 生命周期
onMounted(async () => {
  loadSettings()
  
  // 监听用户交互以解锁音频上下文
  const unlockEvents = ['touchstart', 'touchend', 'mousedown', 'keydown']
  const unlockHandler = () => {
    unlockAudioContext()
    unlockEvents.forEach(event => {
      document.removeEventListener(event, unlockHandler)
    })
  }
  
  unlockEvents.forEach(event => {
    document.addEventListener(event, unlockHandler, { once: true })
  })
  
  // 预加载音频
  await nextTick()
  preloadAudio()
})

onUnmounted(() => {
  stopAllSounds()
})
</script>

<style scoped>
.sound-manager {
  position: relative;
}

/* 音效控制面板 */
.sound-controls {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.95);
  border: 1px solid #2d5a42;
  border-radius: 12px;
  padding: 20px;
  z-index: 9999;
  min-width: 280px;
  backdrop-filter: blur(10px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

.controls-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.controls-title {
  color: #ffd700;
  font-size: 16px;
  font-weight: 700;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: #ccc;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

/* 控制组 */
.control-group {
  margin-bottom: 16px;
}

.control-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
  font-size: 14px;
  cursor: pointer;
  margin-bottom: 8px;
}

.control-label input[type="checkbox"] {
  display: none;
}

.checkbox-custom {
  position: relative;
  width: 18px;
  height: 18px;
  border: 2px solid #4a9f6e;
  border-radius: 3px;
  background: transparent;
  transition: all 0.2s ease;
}

.checkbox-custom::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0);
  width: 6px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: translate(-50%, -60%) rotate(45deg) scale(0);
  transition: transform 0.2s ease;
}

.control-label input[type="checkbox"]:checked + .checkbox-custom {
  background: #4a9f6e;
  border-color: #4a9f6e;
}

.control-label input[type="checkbox"]:checked + .checkbox-custom::after {
  transform: translate(-50%, -60%) rotate(45deg) scale(1);
}

.control-label input[type="checkbox"]:disabled + .checkbox-custom {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 音量滑块 */
.volume-slider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: 26px;
}

.slider {
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: #4a9f6e;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: #4a9f6e;
  border-radius: 50%;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.slider:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.volume-label {
  color: #ccc;
  font-size: 12px;
  min-width: 30px;
  text-align: right;
}

/* 测试按钮 */
.test-btn {
  background: #2d7a4f;
  border: 1px solid #4a9f6e;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
  width: 100%;
}

.test-btn:hover:not(:disabled) {
  background: #4a9f6e;
}

.test-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 预设组 */
.preset-group {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.preset-title {
  color: #ffd700;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 8px;
}

.preset-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}

.preset-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
  transition: all 0.2s ease;
}

.preset-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: #4a9f6e;
}

/* 音效状态指示器 */
.sound-indicator {
  position: fixed;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid #4a9f6e;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  transition: all 0.3s ease;
  cursor: pointer;
}

.sound-indicator.muted {
  border-color: #e74c3c;
  background: rgba(231, 76, 60, 0.2);
}

.indicator-icon {
  font-size: 16px;
}

/* 响应式适配 */
@media (max-width: 480px) {
  .sound-controls {
    min-width: 260px;
    margin: 0 20px;
    padding: 16px;
  }
  
  .controls-title {
    font-size: 14px;
  }
  
  .control-label {
    font-size: 13px;
  }
  
  .preset-buttons {
    grid-template-columns: 1fr;
  }
  
  .sound-indicator {
    width: 36px;
    height: 36px;
    top: 15px;
    right: 15px;
  }
  
  .indicator-icon {
    font-size: 14px;
  }
}

/* 动画效果 */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

.sound-controls {
  animation: slideIn 0.3s ease;
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .sound-controls {
    background: rgba(0, 0, 0, 0.98);
    border-color: #333;
  }
  
  .sound-indicator {
    background: rgba(0, 0, 0, 0.9);
  }
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  .checkbox-custom {
    border-width: 3px;
  }
  
  .slider::-webkit-slider-thumb {
    border: 2px solid white;
  }
  
  .sound-indicator {
    border-width: 2px;
  }
}

/* 减少动画模式 */
@media (prefers-reduced-motion: reduce) {
  .sound-controls {
    animation: none;
  }
  
  .checkbox-custom,
  .checkbox-custom::after,
  .test-btn,
  .preset-btn,
  .sound-indicator {
    transition: none;
  }
}
</style>