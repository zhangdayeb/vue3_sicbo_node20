// src/composables/useGameResults.ts
import { ref, reactive, computed, watch, onUnmounted, readonly } from 'vue'
import { useWebSocketEvents } from './useWebSocketEvents'
import { useAudio } from './useAudio'
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
  const { playWinSound, playSound } = useAudio()

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

  // 设置特效组件引用
  const setEffectRefs = (diceRef: any, winRef: any) => {
    diceEffectComponent = diceRef
    winEffectComponent = winRef
    console.log('🎯 特效组件引用已设置:', {
      dice: !!diceEffectComponent,
      win: !!winEffectComponent
    })
  }

  // 触发开牌特效
  const triggerDiceEffect = async (diceResults: [number, number, number]) => {
    if (!diceEffectComponent) {
      console.warn('🎯 骰子特效组件未设置')
      return false
    }
    
    try {
      console.log('🎲 触发开牌特效:', diceResults)
      
      // 根据特效组件的实际接口调用
      if (typeof diceEffectComponent.startEffect === 'function') {
        // 如果组件有 startEffect 方法
        diceEffectComponent.startEffect(diceResults)
      } else {
        // 如果组件使用 props 控制
        diceEffectComponent.show = true
        diceEffectComponent.results = diceResults
      }
      
      // 播放开牌音效
      playSound('dice-shake')
      
      return true
    } catch (error) {
      console.error('🎯 开牌特效触发失败:', error)
      return false
    }
  }

  // 触发中奖特效
  const triggerWinEffect = async (
    winAmount: number, 
    winType: 'small' | 'medium' | 'big' | 'jackpot' = 'small'
  ) => {
    if (!winEffectComponent) {
      console.warn('🎯 中奖特效组件未设置')
      return false
    }
    
    try {
      console.log('🎉 触发中奖特效:', { winAmount, winType })
      
      // 根据特效组件的实际接口调用
      if (typeof winEffectComponent.startEffect === 'function') {
        winEffectComponent.startEffect(winAmount, winType)
      } else {
        winEffectComponent.show = true
        winEffectComponent.winAmount = winAmount
        winEffectComponent.winType = winType
      }
      
      // 播放中奖音效
      playWinSound(winType)
      
      return true
    } catch (error) {
      console.error('🎯 中奖特效触发失败:', error)
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

  // 处理游戏结果推送
  const handleGameResultPush = async (data: GameResultData) => {
    const gameNumber = data.game_number

    // 如果是新局，重置状态
    if (gameNumber !== state.currentGameNumber) {
      resetState(gameNumber)
    }

    state.pushCount++

    // 第一次收到开牌结果时，播放开牌动画
    if (!state.diceResults) {
      state.diceResults = data.dice_results
      // 触发开牌特效
      await triggerDiceEffect(data.dice_results)
    }

    // 检查是否达到最大推送次数
    if (state.pushCount >= state.maxPushCount) {
      completeProcessing()
    }
  }

  // 处理中奖数据推送
  const handleWinDataPush = async (data: WinData) => {
    const gameNumber = data.game_number

    // 确保是同一局游戏
    if (gameNumber !== state.currentGameNumber) {
      return
    }

    state.pushCount++

    // 累积中奖金额
    if (data.win_amount > 0) {
      state.totalWinAmount += data.win_amount
      state.hasWon = true

      // 触发中奖特效
      let winType: 'small' | 'medium' | 'big' | 'jackpot' = 'small'
      if (data.win_amount >= 100000) {
        winType = 'jackpot'
      } else if (data.win_amount >= 10000) {
        winType = 'big'
      } else if (data.win_amount >= 1000) {
        winType = 'medium'
      }

      await triggerWinEffect(data.win_amount, winType)

      // 更新余额
      updateBalance(data.win_amount)
    }

    // 检查是否达到最大推送次数
    if (state.pushCount >= state.maxPushCount) {
      completeProcessing()
    }
  }

  // 更新余额
  const updateBalance = (winAmount: number) => {
    const currentBalance = bettingStore.balance
    const newBalance = currentBalance + winAmount
    bettingStore.updateBalance(newBalance)
  }

  // 完成处理
  const completeProcessing = () => {
    if (state.isComplete) return

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

  // 手动触发测试特效（开发调试用）
  const testDiceEffect = () => {
    triggerDiceEffect([Math.ceil(Math.random() * 6), Math.ceil(Math.random() * 6), Math.ceil(Math.random() * 6)] as [number, number, number])
  }

  const testWinEffect = (amount: number = 1000) => {
    let winType: 'small' | 'medium' | 'big' | 'jackpot' = 'small'
    if (amount >= 100000) {
      winType = 'jackpot'
    } else if (amount >= 10000) {
      winType = 'big'
    } else if (amount >= 1000) {
      winType = 'medium'
    }
    triggerWinEffect(amount, winType)
  }

  // 计算属性
  const currentGameInfo = computed(() => ({
    gameNumber: state.currentGameNumber,
    diceResults: state.diceResults,
    isProcessing: state.isProcessing,
    pushCount: state.pushCount,
    totalWinAmount: state.totalWinAmount,
    hasWon: state.hasWon,
    isComplete: state.isComplete
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
    
    // 其他方法
    forceComplete,
    resetState,
    
    // 内部状态（只读）
    state: readonly(state)
  }
}