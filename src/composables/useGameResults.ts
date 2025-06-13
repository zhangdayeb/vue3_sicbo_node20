// src/composables/useGameResults.ts - 配合简化音频系统的修复版本
import { ref, reactive, computed, watch, onUnmounted, readonly } from 'vue'
import { useWebSocketEvents } from './useWebSocketEvents'
import { useAudio } from './useAudio' // 🔥 使用简化后的音频系统
import { useGameData } from './useGameData' // 🔥 新增：导入useGameData
import { useBettingStore } from '@/stores/bettingStore'
import type { GameResultData, WinData } from '@/types/api'

// 游戏结果处理状态
interface GameResultState {
  currentGameNumber: string
  diceResults: [number, number, number] | null
  isProcessing: boolean
  pushCount: number
  maxPushCount: number
  totalWinAmount: number
  hasWon: boolean
  isComplete: boolean
  resultProcessedAt: Date | null
}

export const useGameResults = () => {
  const bettingStore = useBettingStore()
  
  // 🔥 修改：使用简化后的音频系统
  const { 
    playWinSound, 
    playDiceRollSound, 
    playDiceResultAudio,
    canPlayAudio 
  } = useAudio()

  // 🔥 新增：获取useGameData的refreshBalance方法
  const { refreshBalance } = useGameData()

  // 状态管理
  const state = reactive<GameResultState>({
    currentGameNumber: '',
    diceResults: null,
    isProcessing: false,
    pushCount: 0,
    maxPushCount: 5,
    totalWinAmount: 0,
    hasWon: false,
    isComplete: false,
    resultProcessedAt: null
  })

  // 特效组件实例存储
  let diceEffectComponent: any = null
  let winEffectComponent: any = null

  // 超时处理
  const resultTimeout = ref<number | null>(null)
  const RESULT_TIMEOUT = 15000 // 15秒超时

  // WebSocket事件监听
  const wsEvents = useWebSocketEvents()

  // 🔥 新增：音效播放安全包装函数
  const safePlayAudio = async (audioFunction: () => Promise<boolean> | boolean) => {
    try {
      if (canPlayAudio.value) {
        const result = await audioFunction()
        console.log('🎵 音效播放成功')
        return result
      } else {
        console.log('🔇 音频系统未就绪，跳过音效播放')
        // 使用震动作为替代反馈
        if ('vibrate' in navigator) {
          navigator.vibrate(100)
        }
        return false
      }
    } catch (error) {
      console.warn('⚠️ 音效播放失败，使用震动反馈:', error)
      // 降级到震动反馈
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100])
      }
      return false
    }
  }

  // 设置特效组件引用
  const setEffectRefs = (diceRef: any, winRef: any) => {
    diceEffectComponent = diceRef
    winEffectComponent = winRef
    console.log('🎯 特效组件引用已设置:', {
      dice: !!diceEffectComponent,
      win: !!winEffectComponent,
      diceType: typeof diceEffectComponent,
      winType: typeof winEffectComponent
    })
  }

  // 🔥 修复：正确的开牌特效触发方式
  const triggerDiceEffect = async (diceResults: [number, number, number]) => {
    console.log('🎲 准备触发开牌特效:', {
      diceResults,
      hasComponent: !!diceEffectComponent,
      componentType: typeof diceEffectComponent
    })
    
    if (!diceEffectComponent) {
      console.warn('🎯 骰子特效组件未设置，无法显示开牌动画')
      return false
    }
    
    try {
      // 🔥 修复：统一的组件触发方式
      let success = false
      
      // 方案1：调用 startAnimation 方法
      if (typeof diceEffectComponent.startAnimation === 'function') {
        console.log('🎲 使用 startAnimation 方法触发')
        await diceEffectComponent.startAnimation(diceResults)
        success = true
      }
      // 方案2：通过 Vue 实例访问
      else if (diceEffectComponent.$) {
        const componentInstance = diceEffectComponent.$
        
        if (componentInstance.exposed?.startAnimation) {
          console.log('🎲 使用 exposed.startAnimation 方法触发')
          await componentInstance.exposed.startAnimation(diceResults)
          success = true
        } else if (componentInstance.setupState) {
          console.log('🎲 使用 setupState 属性设置')
          componentInstance.setupState.show = true
          componentInstance.setupState.results = diceResults
          success = true
        }
      }
      // 方案3：直接设置属性
      else {
        console.log('🎲 使用直接属性设置方式')
        diceEffectComponent.show = true
        diceEffectComponent.results = diceResults
        success = true
      }
      
      if (success) {
        // 🔥 修改：使用简化后的音频系统播放开牌音效
        await safePlayAudio(() => playDiceRollSound())
        console.log('🎲 开牌特效触发成功')
        return true
      } else {
        console.warn('🎯 所有触发方案都失败了')
        return false
      }
      
    } catch (error) {
      console.error('🎯 开牌特效触发失败:', error)
      
      // 🔥 降级方案：尝试其他方式
      try {
        console.log('🎲 尝试降级方案...')
        
        // 方案1：通过事件触发
        if (typeof diceEffectComponent.$emit === 'function') {
          diceEffectComponent.$emit('start-effect', diceResults)
          return true
        }
        
        // 方案2：调用其他可能的方法
        if (typeof diceEffectComponent.startEffect === 'function') {
          diceEffectComponent.startEffect(diceResults)
          return true
        }
        
        // 方案3：设置 ref 值
        if (diceEffectComponent.value) {
          diceEffectComponent.value.show = true
          diceEffectComponent.value.results = diceResults
          return true
        }
        
        // 方案4：强制调用全局调试方法
        if (typeof window !== 'undefined' && (window as any).debugDiceEffect) {
          console.log('🎲 使用全局调试方法触发')
          ;(window as any).debugDiceEffect.startAnimation(diceResults)
          return true
        }
        
      } catch (fallbackError) {
        console.error('🎯 降级方案也失败了:', fallbackError)
      }
      
      return false
    }
  }

  // 🔥 修复：正确的中奖特效触发方式
  const triggerWinEffect = async (
    winAmount: number, 
    winType: 'small' | 'medium' | 'big' | 'jackpot' = 'small' // 🔥 修改：使用简化音频系统的类型
  ) => {
    console.log('🎉 准备触发中奖特效:', {
      winAmount,
      winType,
      hasComponent: !!winEffectComponent,
      componentType: typeof winEffectComponent
    })
    
    if (!winEffectComponent) {
      console.warn('🎯 中奖特效组件未设置，无法显示中奖动画')
      return false
    }
    
    try {
      // 🔥 修复：统一的中奖特效触发方式
      let success = false
      
      // 方案1：调用 startEffect 方法
      if (typeof winEffectComponent.startEffect === 'function') {
        console.log('🎉 使用 startEffect 方法触发')
        await winEffectComponent.startEffect(winAmount, winType)
        success = true
      }
      // 方案2：调用 startAnimation 方法
      else if (typeof winEffectComponent.startAnimation === 'function') {
        console.log('🎉 使用 startAnimation 方法触发')
        await winEffectComponent.startAnimation({ winAmount, winType })
        success = true
      }
      // 方案3：通过 Vue 实例访问
      else if (winEffectComponent.$) {
        const componentInstance = winEffectComponent.$
        
        if (componentInstance.exposed?.startEffect) {
          console.log('🎉 使用 exposed.startEffect 方法触发')
          await componentInstance.exposed.startEffect(winAmount, winType)
          success = true
        } else if (componentInstance.exposed?.startAnimation) {
          console.log('🎉 使用 exposed.startAnimation 方法触发')
          await componentInstance.exposed.startAnimation({ winAmount, winType })
          success = true
        } else if (componentInstance.setupState) {
          console.log('🎉 使用 setupState 属性设置')
          componentInstance.setupState.show = true
          componentInstance.setupState.winAmount = winAmount
          componentInstance.setupState.winType = winType
          success = true
        }
      }
      // 方案4：直接设置属性
      else {
        console.log('🎉 使用直接属性设置方式')
        winEffectComponent.show = true
        winEffectComponent.winAmount = winAmount
        winEffectComponent.winType = winType
        success = true
      }
      
      if (success) {
        // 🔥 修改：使用简化后的音频系统播放中奖音效
        await safePlayAudio(() => playWinSound())
        console.log('🎉 中奖特效触发成功')
        return true
      } else {
        console.warn('🎯 所有触发方案都失败了')
        return false
      }
      
    } catch (error) {
      console.error('🎯 中奖特效触发失败:', error)
      
      // 🔥 降级方案：尝试其他方式
      try {
        console.log('🎉 尝试降级方案...')
        
        // 方案1：通过事件触发
        if (typeof winEffectComponent.$emit === 'function') {
          winEffectComponent.$emit('start-effect', { winAmount, winType })
          return true
        }
        
        // 方案2：设置 ref 值
        if (winEffectComponent.value) {
          winEffectComponent.value.show = true
          winEffectComponent.value.winAmount = winAmount
          winEffectComponent.value.winType = winType
          return true
        }
        
        // 方案3：强制调用全局调试方法
        if (typeof window !== 'undefined' && (window as any).debugWinEffect) {
          console.log('🎉 使用全局调试方法触发')
          ;(window as any).debugWinEffect.startEffect(winAmount, winType)
          return true
        }
        
      } catch (fallbackError) {
        console.error('🎯 降级方案也失败了:', fallbackError)
      }
      
      return false
    }
  }

  // 重置状态
  const resetState = (gameNumber: string) => {
    // 清除之前的超时
    if (resultTimeout.value) {
      window.clearTimeout(resultTimeout.value)
      resultTimeout.value = null
    }

    console.log('🎯 重置游戏结果状态:', gameNumber)

    state.currentGameNumber = gameNumber
    state.diceResults = null
    state.isProcessing = true
    state.pushCount = 0
    state.totalWinAmount = 0
    state.hasWon = false
    state.isComplete = false
    state.resultProcessedAt = null

    // 设置新的超时
    resultTimeout.value = window.setTimeout(() => {
      forceComplete()
    }, RESULT_TIMEOUT)
  }

  // 🔥 修复：处理游戏结果推送
  const handleGameResultPush = async (data: GameResultData) => {
    const gameNumber = data.game_number

    console.log('🎯 收到游戏结果推送:', {
      gameNumber,
      diceResults: data.dice_results,
      currentGame: state.currentGameNumber,
      isNewGame: gameNumber !== state.currentGameNumber
    })

    // 如果是新局，重置状态
    if (gameNumber !== state.currentGameNumber) {
      resetState(gameNumber)
    }

    state.pushCount++

    // 🔥 关键修复：第一次收到开牌结果时，立即播放开牌动画
    if (!state.diceResults) {
      state.diceResults = data.dice_results
      
      console.log('🎲 首次收到开牌结果，准备播放动画:', data.dice_results)
      
      // 🔥 新增：播放开牌语音
      try {
        const [dice1, dice2, dice3] = data.dice_results
        await playDiceResultAudio(dice1.toString(), dice2.toString(), dice3.toString())
        console.log('🎵 开牌语音播放成功:', data.dice_results)
      } catch (audioError) {
        console.warn('⚠️ 开牌语音播放失败:', audioError)
      }

      // 立即触发开牌特效
      const effectSuccess = await triggerDiceEffect(data.dice_results)
      
      if (!effectSuccess) {
        console.warn('🎯 开牌特效触发失败，但继续处理游戏逻辑')
      }
      
      // 🔥 新增：强制触发页面更新
      // 确保组件重新渲染
      setTimeout(() => {
        console.log('🎲 延迟再次尝试触发特效')
        triggerDiceEffect(data.dice_results)
      }, 100)
    }

    // 检查是否达到最大推送次数
    if (state.pushCount >= state.maxPushCount) {
      completeProcessing()
    }
  }

  // 🔥 修改：处理中奖数据推送 - 增加余额刷新
  const handleWinDataPush = async (data: WinData) => {
    const gameNumber = data.game_number

    // 只要有推送 就刷新用户余额
    await refreshBalance()

    console.log('🎉 收到中奖数据推送:', {
      gameNumber,
      winAmount: data.win_amount,
      currentGame: state.currentGameNumber
    })

    // 确保是同一局游戏
    if (gameNumber !== state.currentGameNumber) {
      console.warn('🎯 中奖数据的游戏号不匹配，忽略')
      return
    }

    state.pushCount++

    // 累积中奖金额
    if (data.win_amount > 0) {
      state.totalWinAmount += data.win_amount
      state.hasWon = true

      // 🔥 修改：简化的中奖类型判断 - 匹配简化音频系统
      let winType: 'small' | 'medium' | 'big' | 'jackpot' = 'small'
      if (data.win_amount >= 100000) {
        winType = 'jackpot'
      } else if (data.win_amount >= 10000) {
        winType = 'big'
      } else if (data.win_amount >= 1000) {
        winType = 'medium'
      } else {
        winType = 'small'
      }

      await triggerWinEffect(data.win_amount, winType)

      // 🔥 新增：中奖后刷新余额
      try {
        console.log('💰 用户中奖，正在刷新余额...')
        await refreshBalance()
        console.log('✅ 中奖后余额刷新成功')
      } catch (balanceError) {
        console.error('❌ 中奖后刷新余额失败:', balanceError)
        // 不影响中奖特效，只是余额可能不是最新的
      }

    }

    // 检查是否达到最大推送次数
    if (state.pushCount >= state.maxPushCount) {
      completeProcessing()
    }
  }

 
  // 完成处理
  const completeProcessing = () => {
    if (state.isComplete) return

    console.log('🎯 完成游戏结果处理')

    state.isComplete = true
    state.isProcessing = false
    state.resultProcessedAt = new Date()

    // 清除超时
    if (resultTimeout.value) {
      window.clearTimeout(resultTimeout.value)
      resultTimeout.value = null
    }

    // 延迟清除投注显示，让用户看到结果
    window.setTimeout(() => {
      console.log('🎯 清除投注状态')
      bettingStore.handleGameResult({
        dice_results: state.diceResults || [0, 0, 0],
        total: state.diceResults ? state.diceResults.reduce((a, b) => a + b, 0) : 0,
        is_big: false,
        is_small: false,
        is_odd: false,
        is_even: false,
        win_array: [],
        game_number: state.currentGameNumber
      })
    }, 3000)
  }

  // 强制完成（超时保护）
  const forceComplete = () => {
    if (!state.isComplete) {
      console.warn('🎯 游戏结果处理超时，强制完成')
      completeProcessing()
    }
  }

  // 🔥 修改：手动触发测试特效（开发调试用）- 使用简化音频系统
  const testDiceEffect = () => {
    const testResults: [number, number, number] = [
      Math.ceil(Math.random() * 6), 
      Math.ceil(Math.random() * 6), 
      Math.ceil(Math.random() * 6)
    ]
    console.log('🎲 手动测试开牌特效:', testResults)
    triggerDiceEffect(testResults)
  }

  const testWinEffect = (amount: number = 1000) => {
    // 🔥 修改：使用简化的中奖类型判断
    let winType: 'small' | 'medium' | 'big' | 'jackpot' = 'small'
    if (amount >= 100000) {
      winType = 'jackpot'
    } else if (amount >= 10000) {
      winType = 'big'
    } else if (amount >= 1000) {
      winType = 'medium'
    } else {
      winType = 'small'
    }
    console.log('🎉 手动测试中奖特效:', { amount, winType })
    triggerWinEffect(amount, winType)
  }

  // 🔥 新增：音频系统状态检查
  const getAudioSystemInfo = () => ({
    canPlayAudio: canPlayAudio.value,
    audioSystemType: 'simplified',
    hasAudioFunctions: {
      playWinSound: typeof playWinSound === 'function',
      playDiceRollSound: typeof playDiceRollSound === 'function'
    }
  })

  // 计算属性
  const currentGameInfo = computed(() => ({
    gameNumber: state.currentGameNumber,
    diceResults: state.diceResults,
    isProcessing: state.isProcessing,
    pushCount: state.pushCount,
    totalWinAmount: state.totalWinAmount,
    hasWon: state.hasWon,
    isComplete: state.isComplete,
    audioInfo: getAudioSystemInfo() // 🔥 新增：音频系统信息
  }))

  const isWaitingForResults = computed(() => {
    return state.isProcessing && !state.isComplete
  })

  // 监听WebSocket事件
  wsEvents.onGameResult(handleGameResultPush)
  wsEvents.onWinData(handleWinDataPush)

  // 监听游戏阶段变化，在新一轮开始时重置
  watch(
    () => bettingStore.gamePhase,
    (newPhase) => {
      if (newPhase === 'betting' && state.isComplete) {
        // 新一轮开始，可以重置状态
        console.log('🎯 新一轮开始，重置结果状态')
        state.isComplete = false
        state.isProcessing = false
      }
    }
  )

  // 清理
  onUnmounted(() => {
    if (resultTimeout.value) {
      window.clearTimeout(resultTimeout.value)
    }
  })

  // 🔥 新增：暴露到 window 用于调试（包含音频信息）
  if (typeof window !== 'undefined' && import.meta.env.DEV) {
    (window as any).debugGameResults = {
      testDiceEffect,
      testWinEffect,
      triggerDiceEffect,
      triggerWinEffect,
      state,
      audioInfo: getAudioSystemInfo,
      diceEffectComponent: () => diceEffectComponent,
      winEffectComponent: () => winEffectComponent,
      safePlayAudio
    }
    console.log('🐛 调试工具已添加到 window.debugGameResults（包含音频信息）')
  }

  return {
    // 状态
    currentGameInfo,
    isWaitingForResults,
    
    // 特效管理方法
    setEffectRefs,
    triggerDiceEffect,
    triggerWinEffect,
    
    // 测试方法（开发调试用）
    testDiceEffect,
    testWinEffect,
    
    // 🔥 新增：音频相关方法
    safePlayAudio,
    getAudioSystemInfo,
    
    // 其他方法
    forceComplete,
    resetState,
    
    // 内部状态（只读）
    state: readonly(state)
  }
}