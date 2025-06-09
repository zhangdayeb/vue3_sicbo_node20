// src/stores/bettingStore.ts - 完全开放投注版本
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
  debugMode: boolean
}

export const useBettingStore = defineStore('betting', () => {
  // 基础状态 - 确保初始化不为空
  const balance = ref(10000)
  const selectedChip = ref(10)
  const currentBets = ref<Record<string, number>>({})
  const lastBets = ref<Record<string, number>>({})
  const gamePhase = ref<GamePhase>('betting') // 🔥 默认设为 betting
  const isConnected = ref(true) // 🔥 默认设为 true
  
  // 投注限额配置 - 设置为极高值，基本不限制
  const betLimits = ref<Record<string, BetLimits>>({
    // 大小单双 - 提高限额
    small: { min: 1, max: 999999 },
    big: { min: 1, max: 999999 },
    odd: { min: 1, max: 999999 },
    even: { min: 1, max: 999999 },
    
    // 点数投注 - 提高限额
    'total-4': { min: 1, max: 99999 },
    'total-5': { min: 1, max: 99999 },
    'total-6': { min: 1, max: 99999 },
    'total-7': { min: 1, max: 99999 },
    'total-8': { min: 1, max: 99999 },
    'total-9': { min: 1, max: 99999 },
    'total-10': { min: 1, max: 99999 },
    'total-11': { min: 1, max: 99999 },
    'total-12': { min: 1, max: 99999 },
    'total-13': { min: 1, max: 99999 },
    'total-14': { min: 1, max: 99999 },
    'total-15': { min: 1, max: 99999 },
    'total-16': { min: 1, max: 99999 },
    'total-17': { min: 1, max: 99999 },
    
    // 单骰投注 - 提高限额
    'single-1': { min: 1, max: 99999 },
    'single-2': { min: 1, max: 99999 },
    'single-3': { min: 1, max: 99999 },
    'single-4': { min: 1, max: 99999 },
    'single-5': { min: 1, max: 99999 },
    'single-6': { min: 1, max: 99999 },
    
    // 对子投注 - 提高限额
    'pair-1': { min: 1, max: 99999 },
    'pair-2': { min: 1, max: 99999 },
    'pair-3': { min: 1, max: 99999 },
    'pair-4': { min: 1, max: 99999 },
    'pair-5': { min: 1, max: 99999 },
    'pair-6': { min: 1, max: 99999 },
    
    // 三同号投注 - 提高限额
    'triple-1': { min: 1, max: 99999 },
    'triple-2': { min: 1, max: 99999 },
    'triple-3': { min: 1, max: 99999 },
    'triple-4': { min: 1, max: 99999 },
    'triple-5': { min: 1, max: 99999 },
    'triple-6': { min: 1, max: 99999 },
    'any-triple': { min: 1, max: 99999 },
    
    // 组合投注 - 提高限额
    'combo-1-2': { min: 1, max: 99999 },
    'combo-1-3': { min: 1, max: 99999 },
    'combo-1-4': { min: 1, max: 99999 },
    'combo-1-5': { min: 1, max: 99999 },
    'combo-1-6': { min: 1, max: 99999 },
    'combo-2-3': { min: 1, max: 99999 },
    'combo-2-4': { min: 1, max: 99999 },
    'combo-2-5': { min: 1, max: 99999 },
    'combo-2-6': { min: 1, max: 99999 },
    'combo-3-4': { min: 1, max: 99999 },
    'combo-3-5': { min: 1, max: 99999 },
    'combo-3-6': { min: 1, max: 99999 },
    'combo-4-5': { min: 1, max: 99999 },
    'combo-4-6': { min: 1, max: 99999 },
    'combo-5-6': { min: 1, max: 99999 }
  })
  
  // 设置配置
  const settings = reactive<BettingSettings>({
    autoConfirm: false,
    soundEnabled: true,
    animationEnabled: true,
    vibrationEnabled: true,
    quickBetEnabled: true,
    maxBetWarning: false, // 🔥 关闭警告
    riskLevel: 'aggressive', // 🔥 设为激进模式
    debugMode: true // 🔥 开启调试模式
  })
  
  // 计算属性
  const totalBetAmount = computed(() => {
    const total = Object.values(currentBets.value).reduce((sum, amount) => sum + amount, 0)
    return total
  })
  
  const availableBalance = computed(() => {
    return balance.value - totalBetAmount.value
  })
  
  // 🔥 完全开放投注能力
  const canPlaceBet = computed(() => {
    return true // 总是可以投注
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
  
  // 调试日志函数
  const debugLog = (message: string, data?: any) => {
    if (settings.debugMode) {
      if (data) {
        console.log(`[BettingStore] ${message}`, data)
      } else {
        console.log(`[BettingStore] ${message}`)
      }
    }
  }
  
  // 核心方法
  
  // 选择筹码 - 🔥 完全开放
  const selectChip = (chipValue: number): boolean => {
    debugLog('选择筹码', chipValue)
    
    // 🔥 移除所有限制，直接设置
    if (chipValue > 0) {
      selectedChip.value = chipValue
      debugLog('筹码选择成功', chipValue)
      return true
    }
    
    debugLog('筹码选择失败: 无效金额')
    return false
  }
  
  // 下注 - 🔥 完全开放，移除所有验证
  const placeBet = (betType: BetType, amount: number): boolean => {
    debugLog('执行投注 [开放模式]', { betType, amount })
    
    // 🔥 最基础检查：金额必须大于0
    if (amount <= 0) {
      debugLog('投注失败: 投注金额必须大于0')
      return false
    }
    
    // 🔥 直接执行投注，跳过所有业务验证
    const currentAmount = currentBets.value[betType] || 0
    const newTotal = currentAmount + amount
    
    currentBets.value[betType] = newTotal
    
    debugLog('投注执行成功 [跳过验证]', {
      betType,
      oldAmount: currentAmount,
      addAmount: amount,
      newAmount: newTotal,
      totalBets: Object.keys(currentBets.value).length,
      totalAmount: totalBetAmount.value
    })
    
    return true
  }
  
  // 取消投注 - 🔥 简化逻辑
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
    
    debugLog('取消投注', { betType, cancelAmount })
    return true
  }
  
  // 清除所有投注 - 🔥 简化
  const clearBets = (): void => {
    debugLog('清除所有投注')
    currentBets.value = {}
  }
  
  // 重复投注 - 🔥 简化，移除余额检查
  const rebet = (): boolean => {
    if (Object.keys(lastBets.value).length === 0) {
      debugLog('重复投注失败: 没有上次投注记录')
      return false
    }
    
    // 🔥 直接复制，不检查余额
    currentBets.value = { ...lastBets.value }
    debugLog('重复投注成功', currentBets.value)
    return true
  }
  
  // 确认投注 - 🔥 简化逻辑
  const confirmBets = (): boolean => {
    if (!hasActiveBets.value) {
      debugLog('确认投注失败: 没有待确认的投注')
      return false
    }
    
    // 🔥 简化确认逻辑，不扣除余额（由后端控制）
    // 保存当前投注为上次投注
    lastBets.value = { ...currentBets.value }
    
    debugLog('投注确认成功 [UI层面]', {
      lastBets: lastBets.value,
      totalAmount: totalBetAmount.value
    })
    
    return true
  }
  
  // 更新余额 - 🔥 简化
  const updateBalance = (newBalance: number): void => {
    balance.value = Math.max(0, newBalance)
    debugLog('更新余额', balance.value)
  }
  
  // 更新游戏阶段 - 🔥 简化
  const updateGamePhase = (phase: GamePhase): void => {
    gamePhase.value = phase
    debugLog('更新游戏阶段', phase)
  }
  
  // 获取投注限额 - 🔥 返回高限额
  const getBetLimits = (betType: BetType): BetLimits => {
    return betLimits.value[betType] || { min: 1, max: 99999 }
  }
  
  // 设置投注限额
  const setBetLimits = (betType: BetType, limits: BetLimits): void => {
    betLimits.value[betType] = limits
  }
  
  // 切换调试模式
  const toggleDebugMode = (): void => {
    settings.debugMode = !settings.debugMode
    console.log(`调试模式已${settings.debugMode ? '开启' : '关闭'}`)
  }
  
  // 初始化方法 - 🔥 简化
  const init = (): void => {
    debugLog('初始化 bettingStore [开放模式]')
    
    // 确保有合理的默认值
    if (!selectedChip.value || selectedChip.value <= 0) {
      selectedChip.value = 10
    }
    
    if (!currentBets.value) currentBets.value = {}
    if (!lastBets.value) lastBets.value = {}
    
    // 🔥 强制设置为可投注状态
    gamePhase.value = 'betting'
    isConnected.value = true
    
    debugLog('初始化完成 [开放模式]', {
      balance: balance.value,
      selectedChip: selectedChip.value,
      gamePhase: gamePhase.value,
      canPlaceBet: canPlaceBet.value,
      isConnected: isConnected.value
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
    toggleDebugMode,
    init
  }
})