// src/stores/bettingStore.ts - 确保正确初始化
import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import type { BetType, BetLimits, GamePhase } from '@/types/betting'

// 投注状态接口
interface BettingState {
  balance: number
  selectedChip: number
  currentBets: Record<string, number>
  lastBets: Record<string, number>
  gamePhase: GamePhase
  isConnected: boolean
  betLimits: Record<string, BetLimits>
  settings: BettingSettings
}

interface BettingSettings {
  autoConfirm: boolean
  soundEnabled: boolean
  animationEnabled: boolean
  vibrationEnabled: boolean
  quickBetEnabled: boolean
  maxBetWarning: boolean
  riskLevel: 'conservative' | 'moderate' | 'aggressive'
}

export const useBettingStore = defineStore('betting', () => {
  // 基础状态 - 确保初始化不为空
  const balance = ref(10000)
  const selectedChip = ref(10) // 确保有默认值
  const currentBets = ref<Record<string, number>>({}) // 确保初始化为空对象
  const lastBets = ref<Record<string, number>>({})
  const gamePhase = ref<GamePhase>('betting') // 设置为可投注状态
  const isConnected = ref(true) // 设置为已连接
  
  // 投注限额配置
  const betLimits = ref<Record<string, BetLimits>>({
    // 大小单双
    small: { min: 1, max: 50000 },
    big: { min: 1, max: 50000 },
    odd: { min: 1, max: 50000 },
    even: { min: 1, max: 50000 },
    
    // 点数投注
    'total-4': { min: 1, max: 1000 },
    'total-5': { min: 1, max: 2000 },
    'total-6': { min: 1, max: 3000 },
    'total-7': { min: 1, max: 5000 },
    'total-8': { min: 1, max: 8000 },
    'total-9': { min: 1, max: 10000 },
    'total-10': { min: 1, max: 12000 },
    'total-11': { min: 1, max: 12000 },
    'total-12': { min: 1, max: 10000 },
    'total-13': { min: 1, max: 8000 },
    'total-14': { min: 1, max: 5000 },
    'total-15': { min: 1, max: 3000 },
    'total-16': { min: 1, max: 2000 },
    'total-17': { min: 1, max: 1000 },
    
    // 单骰投注
    'single-1': { min: 1, max: 20000 },
    'single-2': { min: 1, max: 20000 },
    'single-3': { min: 1, max: 20000 },
    'single-4': { min: 1, max: 20000 },
    'single-5': { min: 1, max: 20000 },
    'single-6': { min: 1, max: 20000 },
    
    // 对子投注
    'pair-1': { min: 1, max: 5000 },
    'pair-2': { min: 1, max: 5000 },
    'pair-3': { min: 1, max: 5000 },
    'pair-4': { min: 1, max: 5000 },
    'pair-5': { min: 1, max: 5000 },
    'pair-6': { min: 1, max: 5000 },
    
    // 三同号投注
    'triple-1': { min: 1, max: 1000 },
    'triple-2': { min: 1, max: 1000 },
    'triple-3': { min: 1, max: 1000 },
    'triple-4': { min: 1, max: 1000 },
    'triple-5': { min: 1, max: 1000 },
    'triple-6': { min: 1, max: 1000 },
    'any-triple': { min: 1, max: 3000 },
    
    // 组合投注
    'combo-1-2': { min: 1, max: 8000 },
    'combo-1-3': { min: 1, max: 8000 },
    'combo-1-4': { min: 1, max: 8000 },
    'combo-1-5': { min: 1, max: 8000 },
    'combo-1-6': { min: 1, max: 8000 },
    'combo-2-3': { min: 1, max: 8000 },
    'combo-2-4': { min: 1, max: 8000 },
    'combo-2-5': { min: 1, max: 8000 },
    'combo-2-6': { min: 1, max: 8000 },
    'combo-3-4': { min: 1, max: 8000 },
    'combo-3-5': { min: 1, max: 8000 },
    'combo-3-6': { min: 1, max: 8000 },
    'combo-4-5': { min: 1, max: 8000 },
    'combo-4-6': { min: 1, max: 8000 },
    'combo-5-6': { min: 1, max: 8000 }
  })
  
  // 设置配置
  const settings = reactive<BettingSettings>({
    autoConfirm: false,
    soundEnabled: true,
    animationEnabled: true,
    vibrationEnabled: true,
    quickBetEnabled: true,
    maxBetWarning: true,
    riskLevel: 'moderate'
  })
  
  // 计算属性
  const totalBetAmount = computed(() => {
    const total = Object.values(currentBets.value).reduce((sum, amount) => sum + amount, 0)
    // 移除计算属性中的日志，避免递归更新
    return total
  })
  
  const availableBalance = computed(() => {
    return balance.value - totalBetAmount.value
  })
  
  const canPlaceBet = computed(() => {
    const canBet = gamePhase.value === 'betting' && isConnected.value && availableBalance.value > 0
    // 移除计算属性中的日志，避免递归更新
    return canBet
  })
  
  const betCount = computed(() => {
    return Object.keys(currentBets.value).filter(key => currentBets.value[key] > 0).length
  })
  
  const hasActiveBets = computed(() => {
    return betCount.value > 0
  })
  
  const formattedBalance = computed(() => {
    return `¥${balance.value.toLocaleString()}`
  })
  
  // 核心方法
  
  // 选择筹码
  const selectChip = (chipValue: number): boolean => {
    console.log('🪙 选择筹码:', chipValue)
    if (chipValue <= 0 || chipValue > balance.value) {
      console.log('❌ 筹码选择失败: 无效金额或超过余额')
      return false
    }
    selectedChip.value = chipValue
    console.log('✅ 筹码选择成功:', chipValue)
    return true
  }
  
  // 下注 - 关键方法
  const placeBet = (betType: BetType, amount: number): boolean => {
    console.log('🎯 执行投注:', { betType, amount })
    console.log('🔍 投注前检查:', {
      canPlaceBet: canPlaceBet.value,
      gamePhase: gamePhase.value,
      balance: balance.value,
      availableBalance: availableBalance.value
    })
    
    if (!canPlaceBet.value) {
      console.warn('❌ 投注失败: 无法投注')
      return false
    }
    
    // 验证投注金额
    const limits = getBetLimits(betType)
    const currentAmount = currentBets.value[betType] || 0
    const newTotal = currentAmount + amount
    
    console.log('💰 投注金额验证:', {
      limits,
      currentAmount,
      amount,
      newTotal,
      availableBalance: availableBalance.value
    })
    
    if (amount <= 0) {
      console.warn('❌ 投注失败: 投注金额必须大于0')
      return false
    }
    
    if (newTotal < limits.min) {
      console.warn(`❌ 投注失败: 最小投注金额为 ${limits.min}`)
      return false
    }
    
    if (newTotal > limits.max) {
      console.warn(`❌ 投注失败: 最大投注金额为 ${limits.max}`)
      return false
    }
    
    if (amount > availableBalance.value) {
      console.warn('❌ 投注失败: 余额不足')
      return false
    }
    
    // 执行投注 - 关键步骤
    console.log('✅ 投注验证通过，执行投注')
    currentBets.value[betType] = newTotal
    
    console.log('📊 投注执行后状态:', {
      betType,
      newAmount: newTotal,
      totalBets: currentBets.value,
      totalAmount: totalBetAmount.value
    })
    
    return true
  }
  
  // 取消投注
  const cancelBet = (betType: BetType, amount?: number): boolean => {
    const currentAmount = currentBets.value[betType] || 0
    if (currentAmount === 0) {
      return false
    }
    
    const cancelAmount = amount || currentAmount
    if (cancelAmount > currentAmount) {
      return false
    }
    
    if (cancelAmount === currentAmount) {
      delete currentBets.value[betType]
    } else {
      currentBets.value[betType] = currentAmount - cancelAmount
    }
    
    return true
  }
  
  // 清除所有投注
  const clearBets = (): void => {
    console.log('🧹 清除所有投注')
    currentBets.value = {}
  }
  
  // 重复投注
  const rebet = (): boolean => {
    if (Object.keys(lastBets.value).length === 0) {
      console.warn('❌ 重复投注失败: 没有上次投注记录')
      return false
    }
    
    const totalLastBetAmount = Object.values(lastBets.value).reduce((sum, amount) => sum + amount, 0)
    if (totalLastBetAmount > availableBalance.value) {
      console.warn('❌ 重复投注失败: 余额不足')
      return false
    }
    
    // 清除当前投注并复制上次投注
    currentBets.value = { ...lastBets.value }
    return true
  }
  
  // 确认投注
  const confirmBets = (): boolean => {
    if (!hasActiveBets.value) {
      console.warn('❌ 确认投注失败: 没有待确认的投注')
      return false
    }
    
    if (!canPlaceBet.value) {
      console.warn('❌ 确认投注失败: 当前无法投注')
      return false
    }
    
    // 保存当前投注为上次投注
    lastBets.value = { ...currentBets.value }
    
    // 从余额中扣除投注金额
    const betAmount = totalBetAmount.value
    balance.value -= betAmount
    
    // 清除当前投注
    currentBets.value = {}
    
    console.log('✅ 投注确认成功:', {
      lastBets: lastBets.value,
      newBalance: balance.value
    })
    
    return true
  }
  
  // 更新余额
  const updateBalance = (newBalance: number): void => {
    balance.value = Math.max(0, newBalance)
  }
  
  // 更新游戏阶段
  const updateGamePhase = (phase: GamePhase): void => {
    gamePhase.value = phase
  }
  
  // 获取投注限额
  const getBetLimits = (betType: BetType): BetLimits => {
    return betLimits.value[betType] || { min: 1, max: 1000 }
  }
  
  // 设置投注限额
  const setBetLimits = (betType: BetType, limits: BetLimits): void => {
    betLimits.value[betType] = limits
  }
  
  // 初始化方法
  const init = (): void => {
    console.log('🚀 初始化 bettingStore')
    
    // 确保所有状态都有正确的初始值
    if (!selectedChip.value) selectedChip.value = 10
    if (!currentBets.value) currentBets.value = {}
    if (!lastBets.value) lastBets.value = {}
    if (!gamePhase.value) gamePhase.value = 'betting'
    
    console.log('📊 初始化完成:', {
      balance: balance.value,
      selectedChip: selectedChip.value,
      currentBets: currentBets.value,
      gamePhase: gamePhase.value,
      canPlaceBet: canPlaceBet.value
    })
  }
  
  return {
    // 状态
    balance,
    selectedChip,
    currentBets,
    lastBets,
    gamePhase,
    isConnected,
    betLimits,
    settings,
    
    // 计算属性
    totalBetAmount,
    availableBalance,
    canPlaceBet,
    betCount,
    hasActiveBets,
    formattedBalance,
    
    // 方法
    selectChip,
    placeBet,
    cancelBet,
    clearBets,
    rebet,
    confirmBets,
    updateBalance,
    updateGamePhase,
    getBetLimits,
    setBetLimits,
    init
  }
})