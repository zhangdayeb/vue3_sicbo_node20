// src/stores/bettingStore.ts - 增加投注状态管理
import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import type { BetType, BetLimits, GamePhase } from '@/types/betting'

// 🔥 新增：扩展的投注阶段
export type ExtendedBettingPhase = 
  | 'waiting'     // 等待开始
  | 'betting'     // 可以投注
  | 'confirmed'   // 已确认投注，可继续加注
  | 'dealing'     // 开牌中，禁止投注
  | 'result'      // 结果阶段

// 投注状态接口
interface BettingState {
  balance: number
  selectedChip: number
  currentBets: Record<string, number>        // 🔥 当前新投注
  confirmedBets: Record<string, number>      // 🔥 新增：已确认但未开牌的投注
  lastBets: Record<string, number>           // 上轮投注（用于重复投注）
  gamePhase: GamePhase
  bettingPhase: ExtendedBettingPhase         // 🔥 新增：详细的投注阶段
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
  // 基础状态
  const balance = ref(10000)
  const selectedChip = ref(10)
  const currentBets = ref<Record<string, number>>({})      // 当前正在投注的金额
  const confirmedBets = ref<Record<string, number>>({})    // 🔥 新增：已确认的投注
  const lastBets = ref<Record<string, number>>({})         // 上轮投注
  const gamePhase = ref<GamePhase>('betting')              // 游戏阶段
  const bettingPhase = ref<ExtendedBettingPhase>('betting') // 🔥 新增：投注阶段
  const isConnected = ref(true)
  
  // 投注限额配置
  const betLimits = ref<Record<string, BetLimits>>({
    // 大小单双
    small: { min: 1, max: 999999 },
    big: { min: 1, max: 999999 },
    odd: { min: 1, max: 999999 },
    even: { min: 1, max: 999999 },
    
    // 点数投注
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
    
    // 单骰投注
    'single-1': { min: 1, max: 99999 },
    'single-2': { min: 1, max: 99999 },
    'single-3': { min: 1, max: 99999 },
    'single-4': { min: 1, max: 99999 },
    'single-5': { min: 1, max: 99999 },
    'single-6': { min: 1, max: 99999 },
    
    // 对子投注
    'pair-1': { min: 1, max: 99999 },
    'pair-2': { min: 1, max: 99999 },
    'pair-3': { min: 1, max: 99999 },
    'pair-4': { min: 1, max: 99999 },
    'pair-5': { min: 1, max: 99999 },
    'pair-6': { min: 1, max: 99999 },
    
    // 三同号投注
    'triple-1': { min: 1, max: 99999 },
    'triple-2': { min: 1, max: 99999 },
    'triple-3': { min: 1, max: 99999 },
    'triple-4': { min: 1, max: 99999 },
    'triple-5': { min: 1, max: 99999 },
    'triple-6': { min: 1, max: 99999 },
    'any-triple': { min: 1, max: 99999 },
    
    // 组合投注
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
    maxBetWarning: false,
    riskLevel: 'aggressive',
    debugMode: true
  })
  
  // 🔥 新增：合并计算属性 - 总投注金额（包含已确认和当前）
  const totalBetAmount = computed(() => {
    const currentTotal = Object.values(currentBets.value).reduce((sum, amount) => sum + amount, 0)
    return currentTotal
  })
  
  // 🔥 新增：已确认的投注总额
  const confirmedBetAmount = computed(() => {
    const confirmedTotal = Object.values(confirmedBets.value).reduce((sum, amount) => sum + amount, 0)
    return confirmedTotal
  })
  
  // 🔥 新增：所有投注总额（已确认 + 当前）
  const allBetsAmount = computed(() => {
    return confirmedBetAmount.value + totalBetAmount.value
  })
  
  // 🔥 修改：显示用的投注数据（合并已确认和当前）
  const displayBets = computed(() => {
    const merged: Record<string, { current: number; confirmed: number; total: number }> = {}
    
    // 收集所有投注类型
    const allBetTypes = new Set([
      ...Object.keys(confirmedBets.value),
      ...Object.keys(currentBets.value)
    ])
    
    allBetTypes.forEach(betType => {
      const confirmed = confirmedBets.value[betType] || 0
      const current = currentBets.value[betType] || 0
      const total = confirmed + current
      
      if (total > 0) {
        merged[betType] = { current, confirmed, total }
      }
    })
    
    return merged
  })
  
  const availableBalance = computed(() => {
    return balance.value - totalBetAmount.value
  })
  
  // 🔥 修改：投注能力判断
  const canPlaceBet = computed(() => {
    // 在投注阶段或已确认阶段都可以继续投注
    return bettingPhase.value === 'betting' || bettingPhase.value === 'confirmed'
  })
  
  const betCount = computed(() => {
    return Object.keys(currentBets.value).filter(key => currentBets.value[key] > 0).length
  })
  
  const confirmedBetCount = computed(() => {
    return Object.keys(confirmedBets.value).filter(key => confirmedBets.value[key] > 0).length
  })
  
  const hasActiveBets = computed(() => {
    return betCount.value > 0
  })
  
  const hasConfirmedBets = computed(() => {
    return confirmedBetCount.value > 0
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
  
  // 选择筹码
  const selectChip = (chipValue: number): boolean => {
    debugLog('选择筹码', chipValue)
    
    if (chipValue > 0) {
      selectedChip.value = chipValue
      debugLog('筹码选择成功', chipValue)
      return true
    }
    
    debugLog('筹码选择失败: 无效金额')
    return false
  }
  
  // 下注
  const placeBet = (betType: BetType, amount: number): boolean => {
    debugLog('执行投注 [新状态管理]', { betType, amount, phase: bettingPhase.value })
    
    if (amount <= 0) {
      debugLog('投注失败: 投注金额必须大于0')
      return false
    }
    
    // 🔥 检查投注阶段
    if (!canPlaceBet.value) {
      debugLog('投注失败: 当前阶段不允许投注', bettingPhase.value)
      return false
    }
    
    // 添加到当前投注
    const currentAmount = currentBets.value[betType] || 0
    const newTotal = currentAmount + amount
    
    currentBets.value[betType] = newTotal
    
    debugLog('投注执行成功', {
      betType,
      oldAmount: currentAmount,
      addAmount: amount,
      newAmount: newTotal,
      totalBets: Object.keys(currentBets.value).length,
      totalAmount: totalBetAmount.value,
      bettingPhase: bettingPhase.value
    })
    
    return true
  }
  
  // 🔥 新增：确认投注（将当前投注移动到已确认投注）
  const confirmCurrentBets = (): boolean => {
    if (!hasActiveBets.value) {
      debugLog('确认投注失败: 没有待确认的投注')
      return false
    }
    
    // 将当前投注合并到已确认投注
    Object.entries(currentBets.value).forEach(([betType, amount]) => {
      if (amount > 0) {
        const confirmedAmount = confirmedBets.value[betType] || 0
        confirmedBets.value[betType] = confirmedAmount + amount
      }
    })
    
    // 清空当前投注，允许继续下注
    const confirmedData = { ...currentBets.value }
    currentBets.value = {}
    
    // 更新投注阶段为已确认
    bettingPhase.value = 'confirmed'
    
    debugLog('投注确认成功', {
      confirmedData,
      totalConfirmedAmount: confirmedBetAmount.value,
      newPhase: bettingPhase.value
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
    
    debugLog('取消投注', { betType, cancelAmount })
    return true
  }
  
  // 清除当前投注
  const clearBets = (): void => {
    debugLog('清除当前投注')
    currentBets.value = {}
  }
  
  // 🔥 新增：清除已确认投注（开牌后调用）
  const clearConfirmedBets = (): void => {
    debugLog('清除已确认投注')
    
    // 将已确认投注保存为上次投注（用于重复投注）
    lastBets.value = { ...confirmedBets.value }
    
    // 清空已确认投注
    confirmedBets.value = {}
    
    // 重置投注阶段
    bettingPhase.value = 'betting'
    
    debugLog('已确认投注已清除', {
      lastBets: lastBets.value,
      newPhase: bettingPhase.value
    })
  }
  
  // 🔥 新增：完全清场（清除所有投注）
  const clearAllBets = (): void => {
    debugLog('完全清场 - 清除所有投注')
    currentBets.value = {}
    confirmedBets.value = {}
    bettingPhase.value = 'betting'
  }
  
  // 重复投注
  const rebet = (): boolean => {
    if (Object.keys(lastBets.value).length === 0) {
      debugLog('重复投注失败: 没有上次投注记录')
      return false
    }
    
    // 将上次投注复制到当前投注
    currentBets.value = { ...lastBets.value }
    debugLog('重复投注成功', currentBets.value)
    return true
  }
  
  // 🔥 修改：确认投注（保持兼容性）
  const confirmBets = (): boolean => {
    return confirmCurrentBets()
  }
  
  // 更新余额
  const updateBalance = (newBalance: number): void => {
    balance.value = Math.max(0, newBalance)
    debugLog('更新余额', balance.value)
  }
  
  // 更新游戏阶段
  const updateGamePhase = (phase: GamePhase): void => {
    gamePhase.value = phase
    debugLog('更新游戏阶段', phase)
    
    // 🔥 根据游戏阶段自动更新投注阶段
    if (phase === 'dealing') {
      bettingPhase.value = 'dealing'
    } else if (phase === 'result') {
      bettingPhase.value = 'result'
    } else if (phase === 'waiting') {
      bettingPhase.value = 'waiting'
    } else if (phase === 'betting' && bettingPhase.value === 'waiting') {
      bettingPhase.value = 'betting'
    }
  }
  
  // 🔥 新增：手动更新投注阶段
  const updateBettingPhase = (phase: ExtendedBettingPhase): void => {
    bettingPhase.value = phase
    debugLog('更新投注阶段', phase)
  }
  
  // 🔥 新增：处理开牌结果（清场）
  const handleGameResult = (gameResult: any): void => {
    debugLog('处理开牌结果 - 执行清场', gameResult)
    
    // 清除已确认的投注，将其保存为上次投注
    clearConfirmedBets()
    
    // 如果还有未确认的当前投注，也清除
    if (hasActiveBets.value) {
      currentBets.value = {}
    }
    
    // 设置为结果阶段
    bettingPhase.value = 'result'
    
    debugLog('开牌结果处理完成', {
      phase: bettingPhase.value,
      lastBets: lastBets.value
    })
  }
  
  // 获取投注限额
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
  
  // 初始化方法
  const init = (): void => {
    debugLog('初始化 bettingStore [新状态管理]')
    
    if (!selectedChip.value || selectedChip.value <= 0) {
      selectedChip.value = 10
    }
    
    if (!currentBets.value) currentBets.value = {}
    if (!confirmedBets.value) confirmedBets.value = {}
    if (!lastBets.value) lastBets.value = {}
    
    // 设置初始状态
    gamePhase.value = 'betting'
    bettingPhase.value = 'betting'
    isConnected.value = true
    
    debugLog('初始化完成 [新状态管理]', {
      balance: balance.value,
      selectedChip: selectedChip.value,
      gamePhase: gamePhase.value,
      bettingPhase: bettingPhase.value,
      canPlaceBet: canPlaceBet.value
    })
  }
  
  return {
    // 状态
    balance,
    selectedChip,
    currentBets,
    confirmedBets,        // 🔥 新增
    lastBets,
    gamePhase,
    bettingPhase,         // 🔥 新增
    isConnected,
    betLimits,
    settings,
    
    // 计算属性
    totalBetAmount,
    confirmedBetAmount,   // 🔥 新增
    allBetsAmount,        // 🔥 新增
    displayBets,          // 🔥 新增
    availableBalance,
    canPlaceBet,
    betCount,
    confirmedBetCount,    // 🔥 新增
    hasActiveBets,
    hasConfirmedBets,     // 🔥 新增
    formattedBalance,
    
    // 方法
    selectChip,
    placeBet,
    confirmCurrentBets,   // 🔥 新增
    cancelBet,
    clearBets,
    clearConfirmedBets,   // 🔥 新增
    clearAllBets,         // 🔥 新增
    rebet,
    confirmBets,          // 保持兼容性
    updateBalance,
    updateGamePhase,
    updateBettingPhase,   // 🔥 新增
    handleGameResult,     // 🔥 新增
    getBetLimits,
    setBetLimits,
    toggleDebugMode,
    init
  }
})