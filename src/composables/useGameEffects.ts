// src/composables/useGameEffects.ts - 配合简化音频系统的调整版本
import { ref, computed, reactive, watch, readonly } from 'vue'
import { useAudio } from './useAudio' // 🔥 使用简化后的音频系统
import type { ComponentPublicInstance } from 'vue'

export interface EffectConfig {
  enableAnimations: boolean
  enableParticles: boolean
  enableScreenShake: boolean
  enableGlow: boolean
  animationSpeed: number
  particleDensity: number
  glowIntensity: number
  qualityLevel: 'low' | 'medium' | 'high' | 'ultra'
}

export interface EffectInstance {
  id: string
  type: string
  startTime: number
  duration: number
  isActive: boolean
  cleanup?: () => void
}

export interface ParticleSystem {
  id: string
  particles: Particle[]
  emitter: ParticleEmitter
  isActive: boolean
}

export interface Particle {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
  opacity: number
  rotation: number
  rotationSpeed: number
}

export interface ParticleEmitter {
  x: number
  y: number
  rate: number
  lifespan: number
  velocity: { min: number; max: number }
  size: { min: number; max: number }
  colors: string[]
}

export interface ScreenShakeOptions {
  intensity: number
  duration: number
  frequency: number
  decay: number
}

export interface GlowEffect {
  element: HTMLElement
  color: string
  intensity: number
  duration: number
  pulseSpeed?: number
}

export interface WinEffectOptions {
  winAmount: number
  winType: 'small' | 'medium' | 'big' | 'jackpot' // 🔥 修改：与简化音频系统一致
  centerX?: number
  centerY?: number
  duration?: number
  intensity?: number
}

export interface DiceEffectOptions {
  diceResults: number[]
  cupShakeDuration?: number
  rollDuration?: number
  revealDelay?: number
  showCup?: boolean
}

export const useGameEffects = () => {
  // 🔥 修改：使用简化后的音频系统
  const { 
    playSound, 
    playWinSound, 
    playDiceRollSound,
    canPlayAudio 
  } = useAudio()

  // 特效配置
  const config = reactive<EffectConfig>({
    enableAnimations: true,
    enableParticles: true,
    enableScreenShake: true,
    enableGlow: true,
    animationSpeed: 1.0,
    particleDensity: 1.0,
    glowIntensity: 0.8,
    qualityLevel: 'high'
  })

  // 组件引用
  const winningEffectRef = ref<ComponentPublicInstance>()
  const diceRollingEffectRef = ref<ComponentPublicInstance>()

  // 活动特效实例
  const activeEffects = ref<Map<string, EffectInstance>>(new Map())
  const particleSystems = ref<Map<string, ParticleSystem>>(new Map())
  const screenShakeState = ref({ isActive: false, intensity: 0 })

  // 特效队列
  const effectQueue = ref<Array<() => Promise<void>>>([])
  const isProcessingQueue = ref(false)

  // 计算属性
  const canPlayEffects = computed(() => config.enableAnimations)
  const effectiveSpeed = computed(() => Math.max(0.1, Math.min(3.0, config.animationSpeed)))
  const effectiveParticleDensity = computed(() => Math.max(0.1, Math.min(2.0, config.particleDensity)))

  const qualityMultiplier = computed(() => {
    const multipliers = {
      low: 0.5,
      medium: 0.75,
      high: 1.0,
      ultra: 1.5
    }
    return multipliers[config.qualityLevel]
  })

  // 🔥 新增：音效播放安全包装函数
  const safePlaySound = async (soundFunction: () => Promise<boolean> | boolean) => {
    try {
      if (canPlayAudio.value) {
        const result = await soundFunction()
        return result
      } else {
        console.log('🔇 音频系统未就绪，跳过音效播放')
        // 使用震动作为替代反馈
        if (config.enableScreenShake && 'vibrate' in navigator) {
          navigator.vibrate(50)
        }
        return false
      }
    } catch (error) {
      console.warn('⚠️ 音效播放失败，使用震动反馈:', error)
      // 降级到震动反馈
      if (config.enableScreenShake && 'vibrate' in navigator) {
        navigator.vibrate(50)
      }
      return false
    }
  }

  // 生成唯一ID
  const generateEffectId = (type: string): string => {
    return `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  const setWinningEffectRef = (ref: ComponentPublicInstance | null) => {
    if (ref) winningEffectRef.value = ref
  }

  const setDiceRollingEffectRef = (ref: ComponentPublicInstance | null) => {
    if (ref) diceRollingEffectRef.value = ref
  }

  // 🔥 修改：中奖特效 - 使用简化后的音频系统
  const playWinEffect = async (options: WinEffectOptions): Promise<string | null> => {
    if (!canPlayEffects.value || !winningEffectRef.value) return null

    const effectId = generateEffectId('win')
    const adjustedDuration = (options.duration || 3000) / effectiveSpeed.value

    try {
      // 🔥 修改：使用简化后的音频系统播放中奖音效
      await safePlaySound(() => playWinSound())

      // 启动中奖特效组件
      ;(winningEffectRef.value as any).show = true
      ;(winningEffectRef.value as any).winAmount = options.winAmount
      ;(winningEffectRef.value as any).winType = options.winType

      // 屏幕震动效果
      if (config.enableScreenShake && options.winType !== 'small') {
        const shakeIntensity = {
          medium: 5,
          big: 10,
          jackpot: 15
        }[options.winType] || 5

        await playScreenShake({
          intensity: shakeIntensity * config.glowIntensity,
          duration: 500,
          frequency: 60,
          decay: 0.9
        })
      }

      // 添加粒子效果
      if (config.enableParticles) {
        await playParticleEffect('celebration', {
          x: options.centerX || window.innerWidth / 2,
          y: options.centerY || window.innerHeight / 2,
          duration: adjustedDuration,
          density: effectiveParticleDensity.value
        })
      }

      const effectInstance: EffectInstance = {
        id: effectId,
        type: `win-${options.winType}`,
        startTime: Date.now(),
        duration: adjustedDuration,
        isActive: true,
        cleanup: () => {
          if (winningEffectRef.value) {
            ;(winningEffectRef.value as any).show = false
          }
        }
      }
      activeEffects.value.set(effectId, effectInstance)

      // 自动清理
      setTimeout(() => {
        effectInstance.cleanup?.()
        activeEffects.value.delete(effectId)
      }, adjustedDuration)

      return effectId
    } catch (error) {
      console.error('❌ 中奖特效播放失败:', error)
      return null
    }
  }

  // 🔥 修改：骰子特效 - 使用简化后的音频系统
  const playDiceEffect = async (options: DiceEffectOptions): Promise<string | null> => {
    if (!canPlayEffects.value || !diceRollingEffectRef.value) return null

    const effectId = generateEffectId('dice')

    try {
      // 启动骰子滚动特效
      ;(diceRollingEffectRef.value as any).show = true
      ;(diceRollingEffectRef.value as any).results = options.diceResults

      // 🔥 修改：使用简化后的音频系统播放摇骰音效
      await safePlaySound(() => playDiceRollSound())

      const totalDuration = (options.cupShakeDuration || 2000) + 
                           (options.rollDuration || 2000) + 
                           (options.revealDelay || 1000)

      const effectInstance: EffectInstance = {
        id: effectId,
        type: 'dice-rolling',
        startTime: Date.now(),
        duration: totalDuration,
        isActive: true,
        cleanup: () => {
          if (diceRollingEffectRef.value) {
            ;(diceRollingEffectRef.value as any).show = false
          }
        }
      }
      activeEffects.value.set(effectId, effectInstance)

      // 自动清理
      setTimeout(() => {
        effectInstance.cleanup?.()
        activeEffects.value.delete(effectId)
      }, totalDuration)

      return effectId
    } catch (error) {
      console.error('❌ 骰子特效播放失败:', error)
      return null
    }
  }

  // 屏幕震动效果 - 保持不变
  const playScreenShake = async (options: ScreenShakeOptions): Promise<string> => {
    if (!config.enableScreenShake) return ''

    const effectId = generateEffectId('shake')
    screenShakeState.value.isActive = true
    screenShakeState.value.intensity = options.intensity

    const documentElement = document.documentElement
    const startTime = Date.now()
    let currentIntensity = options.intensity

    const shakeInterval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = elapsed / options.duration

      if (progress >= 1) {
        clearInterval(shakeInterval)
        documentElement.style.transform = 'translate(0px, 0px)'
        screenShakeState.value.isActive = false
        screenShakeState.value.intensity = 0
        return
      }

      // 衰减强度
      currentIntensity = options.intensity * Math.pow(options.decay, elapsed / 100)

      // 生成随机偏移
      const offsetX = (Math.random() - 0.5) * currentIntensity * 2
      const offsetY = (Math.random() - 0.5) * currentIntensity * 2

      documentElement.style.transform = `translate(${offsetX}px, ${offsetY}px)`
    }, 1000 / options.frequency)

    const effectInstance: EffectInstance = {
      id: effectId,
      type: 'screen-shake',
      startTime: Date.now(),
      duration: options.duration,
      isActive: true,
      cleanup: () => {
        clearInterval(shakeInterval)
        documentElement.style.transform = 'translate(0px, 0px)'
        screenShakeState.value.isActive = false
      }
    }
    activeEffects.value.set(effectId, effectInstance)

    return effectId
  }

  // 粒子效果 - 保持不变，但优化了性能
  const playParticleEffect = async (
    type: 'celebration' | 'explosion' | 'sparkle' | 'coins',
    options: {
      x: number
      y: number
      duration: number
      density: number
      colors?: string[]
    }
  ): Promise<string> => {
    if (!config.enableParticles) return ''

    const effectId = generateEffectId('particles')
    const particleCount = Math.floor(50 * options.density * qualityMultiplier.value)
    
    const particles: Particle[] = []
    const colors = options.colors || ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4', '#45B7D1']

    // 创建粒子
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount
      const velocity = 100 + Math.random() * 200
      const life = 1000 + Math.random() * 2000

      particles.push({
        id: `particle_${i}`,
        x: options.x,
        y: options.y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - 100,
        life,
        maxLife: life,
        size: 2 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: 1,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 10
      })
    }

    const particleSystem: ParticleSystem = {
      id: effectId,
      particles,
      emitter: {
        x: options.x,
        y: options.y,
        rate: 0,
        lifespan: options.duration,
        velocity: { min: 50, max: 200 },
        size: { min: 2, max: 6 },
        colors
      },
      isActive: true
    }

    particleSystems.value.set(effectId, particleSystem)

    // 启动粒子更新循环
    const updateParticles = () => {
      const system = particleSystems.value.get(effectId)
      if (!system || !system.isActive) return

      const deltaTime = 16 // 假设60fps
      let aliveParticles = 0

      system.particles.forEach(particle => {
        if (particle.life <= 0) return

        // 更新位置
        particle.x += particle.vx * deltaTime / 1000
        particle.y += particle.vy * deltaTime / 1000
        
        // 重力效果
        particle.vy += 300 * deltaTime / 1000

        // 更新生命周期
        particle.life -= deltaTime
        particle.opacity = particle.life / particle.maxLife

        // 更新旋转
        particle.rotation += particle.rotationSpeed

        if (particle.life > 0) {
          aliveParticles++
          
          // 创建DOM元素（简化版）
          createParticleElement(particle)
        }
      })

      if (aliveParticles > 0) {
        requestAnimationFrame(updateParticles)
      } else {
        particleSystems.value.delete(effectId)
        cleanupParticleElements(effectId)
      }
    }

    requestAnimationFrame(updateParticles)

    const effectInstance: EffectInstance = {
      id: effectId,
      type: `particles-${type}`,
      startTime: Date.now(),
      duration: options.duration,
      isActive: true,
      cleanup: () => {
        const system = particleSystems.value.get(effectId)
        if (system) {
          system.isActive = false
          particleSystems.value.delete(effectId)
        }
        cleanupParticleElements(effectId)
      }
    }
    activeEffects.value.set(effectId, effectInstance)

    return effectId
  }

  // 创建粒子DOM元素（简化实现）
  const createParticleElement = (particle: Particle) => {
    const existingElement = document.getElementById(`particle_${particle.id}`)
    if (existingElement) {
      // 更新现有元素
      existingElement.style.left = `${particle.x}px`
      existingElement.style.top = `${particle.y}px`
      existingElement.style.opacity = particle.opacity.toString()
      existingElement.style.transform = `rotate(${particle.rotation}deg) scale(${particle.size / 4})`
    } else {
      // 创建新元素
      const element = document.createElement('div')
      element.id = `particle_${particle.id}`
      element.style.position = 'fixed'
      element.style.left = `${particle.x}px`
      element.style.top = `${particle.y}px`
      element.style.width = `${particle.size}px`
      element.style.height = `${particle.size}px`
      element.style.backgroundColor = particle.color
      element.style.borderRadius = '50%'
      element.style.pointerEvents = 'none'
      element.style.zIndex = '9999'
      element.style.opacity = particle.opacity.toString()
      element.style.transform = `rotate(${particle.rotation}deg) scale(${particle.size / 4})`
      document.body.appendChild(element)
    }
  }

  // 清理粒子元素
  const cleanupParticleElements = (systemId: string) => {
    const elements = document.querySelectorAll(`[id^="particle_"]`)
    elements.forEach(element => {
      if (element.parentNode) {
        element.parentNode.removeChild(element)
      }
    })
  }

  // 发光效果 - 保持不变
  const playGlowEffect = (element: HTMLElement, options: Partial<GlowEffect> = {}): string => {
    if (!config.enableGlow) return ''

    const effectId = generateEffectId('glow')
    const {
      color = '#FFD700',
      intensity = config.glowIntensity,
      duration = 1000,
      pulseSpeed = 1000
    } = options

    const originalBoxShadow = element.style.boxShadow
    let startTime = Date.now()

    const updateGlow = () => {
      const elapsed = Date.now() - startTime
      const progress = elapsed / duration

      if (progress >= 1) {
        element.style.boxShadow = originalBoxShadow
        activeEffects.value.delete(effectId)
        return
      }

      const pulse = Math.sin((elapsed / pulseSpeed) * Math.PI * 2) * 0.5 + 0.5
      const currentIntensity = intensity * (1 - progress) * pulse
      const glowSize = currentIntensity * 20

      element.style.boxShadow = `
        0 0 ${glowSize}px ${color},
        0 0 ${glowSize * 2}px ${color},
        inset 0 0 ${glowSize / 2}px ${color}
      `

      requestAnimationFrame(updateGlow)
    }

    requestAnimationFrame(updateGlow)

    const effectInstance: EffectInstance = {
      id: effectId,
      type: 'glow',
      startTime: Date.now(),
      duration,
      isActive: true,
      cleanup: () => {
        element.style.boxShadow = originalBoxShadow
      }
    }
    activeEffects.value.set(effectId, effectInstance)

    return effectId
  }

  // 停止特效
  const stopEffect = (effectId: string): boolean => {
    const effect = activeEffects.value.get(effectId)
    if (!effect) return false

    effect.cleanup?.()
    activeEffects.value.delete(effectId)
    return true
  }

  // 停止所有特效
  const stopAllEffects = (type?: string): void => {
    activeEffects.value.forEach((effect, id) => {
      if (!type || effect.type.includes(type)) {
        effect.cleanup?.()
        activeEffects.value.delete(id)
      }
    })

    // 清理粒子系统
    particleSystems.value.forEach((system, id) => {
      system.isActive = false
      cleanupParticleElements(id)
    })
    particleSystems.value.clear()

    // 重置屏幕震动
    if (screenShakeState.value.isActive) {
      document.documentElement.style.transform = 'translate(0px, 0px)'
      screenShakeState.value.isActive = false
      screenShakeState.value.intensity = 0
    }
  }

  // 特效队列处理
  const queueEffect = (effectFunction: () => Promise<void>): void => {
    effectQueue.value.push(effectFunction)
    processEffectQueue()
  }

  const processEffectQueue = async (): Promise<void> => {
    if (isProcessingQueue.value || effectQueue.value.length === 0) return

    isProcessingQueue.value = true

    while (effectQueue.value.length > 0) {
      const effect = effectQueue.value.shift()
      if (effect) {
        try {
          await effect()
        } catch (error) {
          console.error('❌ 特效队列处理错误:', error)
        }
      }
    }

    isProcessingQueue.value = false
  }

  // 🔥 修改：复合特效 - 使用简化后的音频系统
  const playBetConfirmEffect = async (element: HTMLElement): Promise<void> => {
    await Promise.all([
      playGlowEffect(element, { color: '#00FF00', duration: 500 }),
      safePlaySound(() => playSound('bet-confirm'))
    ])
  }

  // 配置管理
  const updateConfig = (newConfig: Partial<EffectConfig>): void => {
    Object.assign(config, newConfig)
    saveConfig()
  }

  const saveConfig = (): void => {
    try {
      localStorage.setItem('sicbo_effects_config', JSON.stringify(config))
    } catch (error) {
      console.error('❌ 保存特效配置失败:', error)
    }
  }

  const loadConfig = (): void => {
    try {
      const saved = localStorage.getItem('sicbo_effects_config')
      if (saved) {
        const savedConfig = JSON.parse(saved)
        Object.assign(config, savedConfig)
      }
    } catch (error) {
      console.error('❌ 加载特效配置失败:', error)
    }
  }

  // 🔥 新增：音频系统状态信息
  const getAudioInfo = () => ({
    canPlayAudio: canPlayAudio.value,
    audioSystemType: 'simplified'
  })

  // 性能监控
  const getPerformanceInfo = () => ({
    activeEffectsCount: activeEffects.value.size,
    particleSystemsCount: particleSystems.value.size,
    totalParticles: Array.from(particleSystems.value.values())
      .reduce((total, system) => total + system.particles.filter(p => p.life > 0).length, 0),
    screenShakeActive: screenShakeState.value.isActive,
    queuedEffects: effectQueue.value.length,
    config: { ...config },
    audioInfo: getAudioInfo() // 🔥 新增音频信息
  })

  // 监听配置变化
  watch(() => config.enableAnimations, (enabled) => {
    if (!enabled) {
      stopAllEffects()
    }
  })

  return {
    // 状态
    config,
    activeEffects: readonly(activeEffects),
    screenShakeState: readonly(screenShakeState),
    
    // 计算属性
    canPlayEffects,
    effectiveSpeed,
    qualityMultiplier,
    
    // 组件引用设置
    setWinningEffectRef,
    setDiceRollingEffectRef,
    
    // 特效播放
    playWinEffect,
    playDiceEffect,
    playScreenShake,
    playParticleEffect,
    playGlowEffect,
    
    // 复合特效
    playBetConfirmEffect,
    
    // 控制方法
    stopEffect,
    stopAllEffects,
    queueEffect,
    
    // 配置管理
    updateConfig,
    saveConfig,
    loadConfig,
    getPerformanceInfo,
    
    // 🔥 新增：音频相关方法
    safePlaySound,
    getAudioInfo
  }
}