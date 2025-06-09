// src/composables/useGameResults.ts
import { ref, reactive, computed, watch, onUnmounted, readonly } from 'vue'
import { useWebSocketEvents } from './useWebSocketEvents'
import { useAudio } from './useAudio'
import { useGameEffects } from './useGameEffects'
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
  const { 
    playWinEffect, 
    playDiceEffect,
    setDiceRollingEffectRef,
    setWinningEffectRef 
  } = useGameEffects()

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

  // 超时处理
  const resultTimeout = ref<number | null>(null)
  const RESULT_TIMEOUT = 15000 // 15秒超时

  // WebSocket事件监听
  const wsEvents = useWebSocketEvents()

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
      await playDiceAnimation(data.dice_results)
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

      // 播放中奖特效
      await playWinAnimation(data.win_amount)

      // 更新余额
      updateBalance(data.win_amount)
    }

    // 检查是否达到最大推送次数
    if (state.pushCount >= state.maxPushCount) {
      completeProcessing()
    }
  }

  // 播放开牌动画
  const playDiceAnimation = async (diceResults: [number, number, number]) => {
    try {
      // 播放开牌音效
      playSound('dice-shake')
      
      // 播放开牌特效
      await playDiceEffect({
        diceResults,
        cupShakeDuration: 1500,
        rollDuration: 2000,
        revealDelay: 500,
        showCup: true
      })

      // 延迟播放结果音效
      window.setTimeout(() => {
        playSound('dice-roll')
      }, 2000)

    } catch (error) {
      console.warn('开牌动画播放失败:', error)
    }
  }

  // 播放中奖动画
  const playWinAnimation = async (winAmount: number) => {
    try {
      // 确定中奖等级
      let winType: 'small' | 'medium' | 'big' | 'jackpot' = 'small'
      
      if (winAmount >= 100000) {
        winType = 'jackpot'
      } else if (winAmount >= 10000) {
        winType = 'big'
      } else if (winAmount >= 1000) {
        winType = 'medium'
      }

      // 播放中奖音效
      playWinSound(winType)

      // 播放中奖特效
      await playWinEffect({
        winAmount,
        winType,
        centerX: window.innerWidth / 2,
        centerY: window.innerHeight / 2,
        duration: winType === 'jackpot' ? 5000 : 3000,
        intensity: winType === 'jackpot' ? 1.5 : 1.0
      })

    } catch (error) {
      console.warn('中奖动画播放失败:', error)
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
      completeProcessing()
    }
  }

  // 设置特效组件引用
  const setEffectRefs = (diceRef: any, winRef: any) => {
    if (diceRef) setDiceRollingEffectRef(diceRef)
    if (winRef) setWinningEffectRef(winRef)
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
    
    // 方法
    setEffectRefs,
    forceComplete,
    resetState,
    
    // 内部状态（只读）
    state: readonly(state)
  }
}