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

interface BetTransaction {
  id: string
  type: 'place' | 'cancel' | 'confirm' | 'win' | 'loss'
  betType?: string
  amount: number
  timestamp: Date
  gameNumber?: string
}

interface BetStatistics {
  totalBetsPlaced: number
  totalAmountBet: number
  totalWinnings: number
  winRate: number
  biggestWin: number
  biggestLoss: number
  streakCurrent: number
  streakBest: number
  favoriteMarkets: Array<{ market: string; count: number }>
  sessionStats: {
    betsPlaced: number
    amountBet: number
    winnings: number
    startBalance: number
    currentBalance: number
  }
}

export const useBettingStore = defineStore('betting', () => {
  // 基础状态
  const balance = ref(10000)
  const selectedChip = ref(10)
  const currentBets = ref<Record<string, number>>({})
  const lastBets = ref<Record<string, number>>({})
  const gamePhase = ref<GamePhase>('waiting')
  const isConnected = ref(false)
  
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
  
  // 交易历史
  const transactions = ref<BetTransaction[]>([])
  
  // 统计信息
  const statistics = reactive<BetStatistics>({
    totalBetsPlaced: 0,
    totalAmountBet: 0,
    totalWinnings: 0,
    winRate: 0,
    biggestWin: 0,
    biggestLoss: 0,
    streakCurrent: 0,
    streakBest: 0,
    favoriteMarkets: [],
    sessionStats: {
      betsPlaced: 0,
      amountBet: 0,
      winnings: 0,
      startBalance: 10000,
      currentBalance: 10000
    }
  })
  
  // 计算属性
  const totalBetAmount = computed(() => {
    return Object.values(currentBets.value).reduce((sum, amount) => sum + amount, 0)
  })
  
  const availableBalance = computed(() => {
    return balance.value - totalBetAmount.value
  })
  
  const canPlaceBet = computed(() => {
    return gamePhase.value === 'betting' && isConnected.value && availableBalance.value > 0
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
  
  const balanceRisk = computed(() => {
    const betRatio = totalBetAmount.value / balance.value
    if (betRatio <= 0.1) return 'low'
    if (betRatio <= 0.3) return 'medium'
    if (betRatio <= 0.6) return 'high'
    return 'extreme'
  })
  
  const sessionProfit = computed(() => {
    return balance.value - statistics.sessionStats.startBalance
  })
  
  const sessionProfitRate = computed(() => {
    if (statistics.sessionStats.startBalance === 0) return 0
    return (sessionProfit.value / statistics.sessionStats.startBalance) * 100
  })
  
  // 核心方法
  
  // 选择筹码
  const selectChip = (chipValue: number): boolean => {
    if (chipValue <= 0 || chipValue > balance.value) {
      return false
    }
    selectedChip.value = chipValue
    addTransaction('place', undefined, chipValue)
    return true
  }
  
  // 下注
  const placeBet = (betType: BetType, amount: number): boolean => {
    if (!canPlaceBet.value) {
      console.warn('Cannot place bet: Game not in betting phase or not connected')
      return false
    }
    
    // 验证投注金额
    const limits = getBetLimits(betType)
    const currentAmount = currentBets.value[betType] || 0
    const newTotal = currentAmount + amount
    
    if (amount <= 0) {
      console.warn('Bet amount must be positive')
      return false
    }
    
    if (newTotal < limits.min) {
      console.warn(`Minimum bet for ${betType} is ${limits.min}`)
      return false
    }
    
    if (newTotal > limits.max) {
      console.warn(`Maximum bet for ${betType} is ${limits.max}`)
      return false
    }
    
    if (amount > availableBalance.value) {
      console.warn('Insufficient balance')
      return false
    }
    
    // 执行投注
    currentBets.value[betType] = newTotal
    
    // 记录交易
    addTransaction('place', betType, amount)
    
    // 更新统计
    statistics.totalBetsPlaced++
    statistics.totalAmountBet += amount
    statistics.sessionStats.betsPlaced++
    statistics.sessionStats.amountBet += amount
    
    // 更新最爱市场
    updateFavoriteMarkets(betType)
    
    // 触发事件
    notifyUpdate('betPlaced', { betType, amount, total: newTotal })
    
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
    
    // 记录交易
    addTransaction('cancel', betType, -cancelAmount)
    
    // 触发事件
    notifyUpdate('betCancelled', { betType, amount: cancelAmount })
    
    return true
  }
  
  // 清除所有投注
  const clearBets = (): void => {
    const clearedBets = { ...currentBets.value }
    currentBets.value = {}
    
    // 记录交易
    addTransaction('cancel', undefined, -totalBetAmount.value)
    
    // 触发事件
    notifyUpdate('allBetsCleared', { clearedBets })
  }
  
  // 重复投注
  const rebet = (): boolean => {
    if (Object.keys(lastBets.value).length === 0) {
      console.warn('No previous bets to repeat')
      return false
    }
    
    const totalLastBetAmount = Object.values(lastBets.value).reduce((sum, amount) => sum + amount, 0)
    if (totalLastBetAmount > availableBalance.value) {
      console.warn('Insufficient balance for rebet')
      return false
    }
    
    // 清除当前投注并复制上次投注
    currentBets.value = { ...lastBets.value }
    
    // 记录交易
    addTransaction('place', undefined, totalLastBetAmount)
    
    // 更新统计
    Object.entries(lastBets.value).forEach(([betType, amount]) => {
      statistics.totalBetsPlaced++
      statistics.totalAmountBet += amount
      statistics.sessionStats.betsPlaced++
      statistics.sessionStats.amountBet += amount
      updateFavoriteMarkets(betType)
    })
    
    // 触发事件
    notifyUpdate('rebetExecuted', { bets: lastBets.value })
    
    return true
  }
  
  // 确认投注
  const confirmBets = (): boolean => {
    if (!hasActiveBets.value) {
      console.warn('No active bets to confirm')
      return false
    }
    
    if (!canPlaceBet.value) {
      console.warn('Cannot confirm bets: Game not in betting phase')
      return false
    }
    
    // 保存当前投注为上次投注
    lastBets.value = { ...currentBets.value }
    
    // 从余额中扣除投注金额
    const betAmount = totalBetAmount.value
    balance.value -= betAmount
    
    // 清除当前投注
    currentBets.value = {}
    
    // 记录交易
    addTransaction('confirm', undefined, betAmount)
    
    // 更新会话统计
    statistics.sessionStats.currentBalance = balance.value
    
    // 触发事件
    notifyUpdate('betsConfirmed', { 
      confirmedBets: lastBets.value, 
      totalAmount: betAmount,
      newBalance: balance.value 
    })
    
    return true
  }
  
  // 更新余额
  const updateBalance = (newBalance: number): void => {
    const oldBalance = balance.value
    balance.value = Math.max(0, newBalance)
    
    // 记录交易
    const difference = balance.value - oldBalance
    if (difference !== 0) {
      addTransaction(difference > 0 ? 'win' : 'loss', undefined, Math.abs(difference))
    }
    
    // 更新统计
    if (difference > 0) {
      statistics.totalWinnings += difference
      statistics.biggestWin = Math.max(statistics.biggestWin, difference)
      statistics.streakCurrent = Math.max(0, statistics.streakCurrent) + 1
      statistics.streakBest = Math.max(statistics.streakBest, statistics.streakCurrent)
    } else if (difference < 0) {
      statistics.biggestLoss = Math.max(statistics.biggestLoss, Math.abs(difference))
      statistics.streakCurrent = Math.min(0, statistics.streakCurrent) - 1
    }
    
    // 更新胜率
    const totalGames = statistics.totalBetsPlaced > 0 ? Math.floor(statistics.totalBetsPlaced / 5) : 0
    const winGames = statistics.totalWinnings > 0 ? Math.floor(statistics.totalWinnings / 100) : 0
    statistics.winRate = totalGames > 0 ? (winGames / totalGames) * 100 : 0
    
    // 更新会话统计
    statistics.sessionStats.currentBalance = balance.value
    statistics.sessionStats.winnings += Math.max(0, difference)
    
    // 触发事件
    notifyUpdate('balanceUpdated', { 
      oldBalance, 
      newBalance: balance.value, 
      difference 
    })
  }
  
  // 更新游戏阶段
  const updateGamePhase = (phase: GamePhase): void => {
    const oldPhase = gamePhase.value
    gamePhase.value = phase
    
    // 如果进入结算阶段，保存当前投注
    if (phase === 'rolling' && hasActiveBets.value) {
      confirmBets()
    }
    
    // 触发事件
    notifyUpdate('gamePhaseChanged', { oldPhase, newPhase: phase })
  }
  
  // 获取投注限额
  const getBetLimits = (betType: BetType): BetLimits => {
    return betLimits.value[betType] || { min: 1, max: 1000 }
  }
  
  // 设置投注限额
  const setBetLimits = (betType: BetType, limits: BetLimits): void => {
    betLimits.value[betType] = limits
    notifyUpdate('betLimitsUpdated', { betType, limits })
  }
  
  // 获取投注建议
  const getBettingAdvice = (): string[] => {
    const advice: string[] = []
    
    // 风险建议
    if (balanceRisk.value === 'extreme') {
      advice.push('⚠️ 投注金额过高，建议降低投注额度')
    } else if (balanceRisk.value === 'high') {
      advice.push('⚡ 投注风险较高，请谨慎操作')
    }
    
    // 余额建议
    if (balance.value < 100) {
      advice.push('💰 余额较低，建议充值后继续游戏')
    }
    
    // 投注分散建议
    if (betCount.value > 8) {
      advice.push('🎯 投注项目较多，建议集中投注提高收益率')
    }
    
    // 连败建议
    if (statistics.streakCurrent < -3) {
      advice.push('😔 连续失利中，建议调整策略或暂停投注')
    }
    
    // 连胜建议
    if (statistics.streakCurrent > 5) {
      advice.push('🎉 连胜中！但请注意适时收手，落袋为安')
    }
    
    // 胜率建议
    if (statistics.winRate < 30 && statistics.totalBetsPlaced > 10) {
      advice.push('📈 胜率较低，建议学习投注技巧或调整策略')
    }
    
    return advice
  }
  
  // 辅助方法
  
  // 添加交易记录
  const addTransaction = (
    type: BetTransaction['type'], 
    betType?: string, 
    amount: number = 0
  ): void => {
    const transaction: BetTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      betType,
      amount,
      timestamp: new Date()
    }
    
    transactions.value.push(transaction)
    
    // 保持最多1000条记录
    if (transactions.value.length > 1000) {
      transactions.value = transactions.value.slice(-500)
    }
  }
  
  // 更新最爱市场
  const updateFavoriteMarkets = (betType: string): void => {
    const existing = statistics.favoriteMarkets.find(m => m.market === betType)
    if (existing) {
      existing.count++
    } else {
      statistics.favoriteMarkets.push({ market: betType, count: 1 })
    }
    
    // 排序并保持前10位
    statistics.favoriteMarkets.sort((a, b) => b.count - a.count)
    statistics.favoriteMarkets = statistics.favoriteMarkets.slice(0, 10)
  }
  
  // 通知更新（可与外部系统集成）
  const notifyUpdate = (event: string, data: any): void => {
    // 发送自定义事件
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(`betting-store-${event}`, {
        detail: data
      }))
    }
    
    console.log(`Betting Store Event: ${event}`, data)
  }
  
  // 重置统计数据
  const resetStatistics = (): void => {
    statistics.totalBetsPlaced = 0
    statistics.totalAmountBet = 0
    statistics.totalWinnings = 0
    statistics.winRate = 0
    statistics.biggestWin = 0
    statistics.biggestLoss = 0
    statistics.streakCurrent = 0
    statistics.streakBest = 0
    statistics.favoriteMarkets = []
    
    // 重置会话统计
    statistics.sessionStats = {
      betsPlaced: 0,
      amountBet: 0,
      winnings: 0,
      startBalance: balance.value,
      currentBalance: balance.value
    }
    
    transactions.value = []
    notifyUpdate('statisticsReset', {})
  }
  
  // 重置所有数据
  const resetAll = (): void => {
    balance.value = 10000
    selectedChip.value = 10
    currentBets.value = {}
    lastBets.value = {}
    gamePhase.value = 'waiting'
    resetStatistics()
    notifyUpdate('storeReset', {})
  }
  
  // 导出数据
  const exportData = () => {
    return {
      balance: balance.value,
      selectedChip: selectedChip.value,
      currentBets: currentBets.value,
      lastBets: lastBets.value,
      gamePhase: gamePhase.value,
      settings: settings,
      statistics: statistics,
      transactions: transactions.value,
      betLimits: betLimits.value,
      timestamp: new Date().toISOString()
    }
  }
  
  // 导入数据
  const importData = (data: any): boolean => {
    try {
      if (data.balance !== undefined) balance.value = data.balance
      if (data.selectedChip !== undefined) selectedChip.value = data.selectedChip
      if (data.currentBets !== undefined) currentBets.value = data.currentBets
      if (data.lastBets !== undefined) lastBets.value = data.lastBets
      if (data.gamePhase !== undefined) gamePhase.value = data.gamePhase
      if (data.settings !== undefined) Object.assign(settings, data.settings)
      if (data.statistics !== undefined) Object.assign(statistics, data.statistics)
      if (data.transactions !== undefined) transactions.value = data.transactions
      if (data.betLimits !== undefined) betLimits.value = data.betLimits
      
      notifyUpdate('dataImported', { timestamp: data.timestamp })
      return true
    } catch (error) {
      console.error('Failed to import data:', error)
      return false
    }
  }
  
  // 本地存储
  const saveToLocalStorage = (): void => {
    try {
      const data = exportData()
      localStorage.setItem('sicbo_betting_store', JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
    }
  }
  
  const loadFromLocalStorage = (): boolean => {
    try {
      const saved = localStorage.getItem('sicbo_betting_store')
      if (saved) {
        const data = JSON.parse(saved)
        return importData(data)
      }
      return false
    } catch (error) {
      console.error('Failed to load from localStorage:', error)
      return false
    }
  }
  
  // 自动保存设置
  const setupAutoSave = (): void => {
    // 每30秒自动保存一次
    setInterval(saveToLocalStorage, 30000)
    
    // 页面卸载时保存
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', saveToLocalStorage)
    }
  }
  
  // 初始化
  const init = (): void => {
    // 加载本地存储数据
    loadFromLocalStorage()
    
    // 设置自动保存
    setupAutoSave()
    
    // 初始化会话统计
    statistics.sessionStats.startBalance = balance.value
    statistics.sessionStats.currentBalance = balance.value
    
    notifyUpdate('storeInitialized', {})
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
    transactions,
    statistics,
    
    // 计算属性
    totalBetAmount,
    availableBalance,
    canPlaceBet,
    betCount,
    hasActiveBets,
    formattedBalance,
    balanceRisk,
    sessionProfit,
    sessionProfitRate,
    
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
    getBettingAdvice,
    resetStatistics,
    resetAll,
    exportData,
    importData,
    saveToLocalStorage,
    loadFromLocalStorage,
    init
  }
})