import { ref, computed, reactive, watch } from 'vue'
import { useBettingStore } from '@/stores/bettingStore'
import type { BetType, BetResult, GameResult } from '@/types/betting'

export interface BettingOptions {
  autoConfirm?: boolean
  maxBetAmount?: number
  enableQuickBet?: boolean
  enableReBet?: boolean
}

export interface BetValidation {
  isValid: boolean
  error?: string
  warnings?: string[]
}

export interface BetStatistics {
  totalBets: number
  totalAmount: number
  winRate: number
  biggestWin: number
  biggestLoss: number
  favoriteMarkets: string[]
}

export const useBetting = (options: BettingOptions = {}) => {
  const bettingStore = useBettingStore()
  
  // 默认选项
  const {
    autoConfirm = false,
    maxBetAmount = 100000,
    enableQuickBet = true,
    enableReBet = true
  } = options
  
  // 响应式状态
  const isProcessing = ref(false)
  const lastError = ref<string | null>(null)
  const betHistory = ref<BetResult[]>([])
  const quickBetAmounts = ref([10, 50, 100, 500, 1000])
  const currentGameResult = ref<GameResult | null>(null)
  
  // 投注统计
  const statistics = reactive<BetStatistics>({
    totalBets: 0,
    totalAmount: 0,
    winRate: 0,
    biggestWin: 0,
    biggestLoss: 0,
    favoriteMarkets: []
  })

  // 计算属性
  const currentBets = computed(() => bettingStore.currentBets)
  const totalBetAmount = computed(() => bettingStore.totalBetAmount)
  const balance = computed(() => bettingStore.balance)
  const selectedChip = computed(() => bettingStore.selectedChip)
  const lastBets = computed(() => bettingStore.lastBets)
  
  const canPlaceBet = computed(() => {
    return !isProcessing.value && 
           balance.value > 0 && 
           bettingStore.gamePhase === 'betting'
  })
  
  const hasActiveBets = computed(() => {
    return Object.keys(currentBets.value).length > 0
  })
  
  const remainingBalance = computed(() => {
    return balance.value - totalBetAmount.value
  })
  
  const betCoverage = computed(() => {
    const totalPossibleBets = 50 // 假设总共有50种投注类型
    const activeBetTypes = Object.keys(currentBets.value).length
    return (activeBetTypes / totalPossibleBets) * 100
  })

  // 投注验证
  const validateBet = (betType: BetType, amount: number): BetValidation => {
    const validation: BetValidation = { isValid: true, warnings: [] }
    
    // 检查游戏状态
    if (bettingStore.gamePhase !== 'betting') {
      return {
        isValid: false,
        error: '当前不在投注阶段'
      }
    }
    
    // 检查金额
    if (amount <= 0) {
      return {
        isValid: false,
        error: '投注金额必须大于0'
      }
    }
    
    if (amount > remainingBalance.value) {
      return {
        isValid: false,
        error: '余额不足'
      }
    }
    
    // 检查投注限额
    const limits = getBetLimits(betType)
    const currentAmount = currentBets.value[betType] || 0
    const newTotal = currentAmount + amount
    
    if (newTotal < limits.min) {
      return {
        isValid: false,
        error: `最小投注金额为 ${limits.min}`
      }
    }
    
    if (newTotal > limits.max) {
      return {
        isValid: false,
        error: `最大投注金额为 ${limits.max}`
      }
    }
    
    // 检查单次投注上限
    if (amount > maxBetAmount) {
      return {
        isValid: false,
        error: `单次投注不能超过 ${maxBetAmount}`
      }
    }
    
    // 风险警告
    if (totalBetAmount.value + amount > balance.value * 0.5) {
      validation.warnings?.push('投注金额已超过余额的50%，请注意风险')
    }
    
    if (Object.keys(currentBets.value).length >= 10) {
      validation.warnings?.push('投注项目较多，建议集中投注以提高中奖概率')
    }
    
    return validation
  }

  // 下注
  const placeBet = async (betType: BetType, amount?: number): Promise<boolean> => {
    if (!canPlaceBet.value) {
      lastError.value = '当前无法下注'
      return false
    }
    
    const betAmount = amount || selectedChip.value
    const validation = validateBet(betType, betAmount)
    
    if (!validation.isValid) {
      lastError.value = validation.error || '投注验证失败'
      return false
    }
    
    try {
      isProcessing.value = true
      lastError.value = null
      
      // 调用 store 的投注方法
      const success = bettingStore.placeBet(betType, betAmount)
      
      if (success) {
        // 如果有警告，显示给用户
        if (validation.warnings && validation.warnings.length > 0) {
          console.warn('投注警告:', validation.warnings)
        }
        
        // 自动确认投注（如果启用）
        if (autoConfirm) {
          await confirmBets()
        }
        
        return true
      } else {
        lastError.value = '投注失败'
        return false
      }
    } catch (error) {
      lastError.value = error instanceof Error ? error.message : '投注过程中发生错误'
      return false
    } finally {
      isProcessing.value = false
    }
  }

  // 快速投注
  const quickBet = async (betType: BetType, amountIndex: number = 0): Promise<boolean> => {
    if (!enableQuickBet) {
      lastError.value = '快速投注功能已禁用'
      return false
    }
    
    const amount = quickBetAmounts.value[amountIndex] || quickBetAmounts.value[0]
    return await placeBet(betType, amount)
  }

  // 批量投注
  const placeBatchBets = async (bets: Array<{ betType: BetType; amount: number }>): Promise<boolean> => {
    if (!canPlaceBet.value) {
      lastError.value = '当前无法下注'
      return false
    }
    
    try {
      isProcessing.value = true
      let allSuccessful = true
      
      for (const bet of bets) {
        const success = await placeBet(bet.betType, bet.amount)
        if (!success) {
          allSuccessful = false
          break
        }
      }
      
      return allSuccessful
    } finally {
      isProcessing.value = false
    }
  }

  // 取消投注
  const cancelBet = (betType: BetType, amount?: number): boolean => {
    try {
      const success = bettingStore.cancelBet(betType, amount)
      if (!success) {
        lastError.value = '取消投注失败'
      }
      return success
    } catch (error) {
      lastError.value = error instanceof Error ? error.message : '取消投注时发生错误'
      return false
    }
  }

  // 清除所有投注
  const clearAllBets = (): boolean => {
    try {
      bettingStore.clearBets()
      lastError.value = null
      return true
    } catch (error) {
      lastError.value = error instanceof Error ? error.message : '清除投注时发生错误'
      return false
    }
  }

  // 重复上次投注
  const repeatLastBets = async (): Promise<boolean> => {
    if (!enableReBet) {
      lastError.value = '重复投注功能已禁用'
      return false
    }
    
    if (Object.keys(lastBets.value).length === 0) {
      lastError.value = '没有可重复的投注'
      return false
    }
    
    try {
      isProcessing.value = true
      const success = bettingStore.rebet()
      
      if (!success) {
        lastError.value = '重复投注失败'
      }
      
      return success
    } catch (error) {
      lastError.value = error instanceof Error ? error.message : '重复投注时发生错误'
      return false
    } finally {
      isProcessing.value = false
    }
  }

  // 确认投注
  const confirmBets = async (): Promise<boolean> => {
    if (!hasActiveBets.value) {
      lastError.value = '没有待确认的投注'
      return false
    }
    
    try {
      isProcessing.value = true
      const success = bettingStore.confirmBets()
      
      if (success) {
        // 记录投注历史
        const betResult: BetResult = {
          id: `bet_${Date.now()}`,
          bets: { ...currentBets.value },
          totalAmount: totalBetAmount.value,
          totalWinAmount: 0,
          netProfit: 0,
          timestamp: new Date(),
          gameNumber: `game_${Date.now()}`,
          gameResult: [0, 0, 0],
          status: 'confirmed',
          details: []
        }
        betHistory.value.push(betResult)
        
        // 更新统计
        updateStatistics(betResult)
        
        lastError.value = null
      } else {
        lastError.value = '确认投注失败'
      }
      
      return success
    } catch (error) {
      lastError.value = error instanceof Error ? error.message : '确认投注时发生错误'
      return false
    } finally {
      isProcessing.value = false
    }
  }

  // 处理游戏结果
  const processGameResult = (gameResult: GameResult): void => {
    currentGameResult.value = gameResult
    
    // 计算中奖结果
    const lastBet = betHistory.value[betHistory.value.length - 1]
    if (lastBet && lastBet.status === 'confirmed') {
      const winAmount = calculateWinnings(lastBet.bets, gameResult)
      
      lastBet.gameResult = gameResult.diceResults
      lastBet.totalWinAmount = winAmount
      lastBet.netProfit = winAmount - lastBet.totalAmount
      lastBet.status = winAmount > 0 ? 'won' : 'lost'
      
      // 更新余额
      if (winAmount > 0) {
        bettingStore.updateBalance(balance.value + winAmount)
      }
      
      // 更新统计
      updateStatistics(lastBet)
    }
  }

  // 计算中奖金额
  const calculateWinnings = (bets: Record<string, number>, gameResult: GameResult): number => {
    let totalWinnings = 0
    
    Object.entries(bets).forEach(([betType, amount]) => {
      const odds = getOdds(betType, gameResult)
      if (isWinningBet(betType, gameResult)) {
        totalWinnings += amount * odds
      }
    })
    
    return totalWinnings
  }

  // 判断是否中奖
  const isWinningBet = (betType: string, gameResult: GameResult): boolean => {
    const { diceResults } = gameResult
    const total = diceResults.reduce((sum, dice) => sum + dice, 0)
    
    switch (betType) {
      case 'small':
        return total >= 4 && total <= 10
      case 'big':
        return total >= 11 && total <= 17
      case 'odd':
        return total % 2 === 1
      case 'even':
        return total % 2 === 0
      default:
        // 处理其他投注类型
        if (betType.startsWith('total-')) {
          const targetTotal = parseInt(betType.split('-')[1])
          return total === targetTotal
        }
        if (betType.startsWith('single-')) {
          const targetNumber = parseInt(betType.split('-')[1])
          return diceResults.includes(targetNumber)
        }
        if (betType.startsWith('pair-')) {
          const targetNumber = parseInt(betType.split('-')[1])
          const count = diceResults.filter(dice => dice === targetNumber).length
          return count >= 2
        }
        if (betType.startsWith('triple-')) {
          const targetNumber = parseInt(betType.split('-')[1])
          return diceResults.every(dice => dice === targetNumber)
        }
        if (betType === 'any-triple') {
          return diceResults[0] === diceResults[1] && diceResults[1] === diceResults[2]
        }
        return false
    }
  }

  // 获取赔率
  const getOdds = (betType: string, gameResult: GameResult): number => {
    const oddsMap: Record<string, number> = {
      'small': 2,
      'big': 2,
      'odd': 2,
      'even': 2,
      'total-4': 63,
      'total-5': 32,
      'total-6': 19,
      'total-7': 13,
      'total-8': 9,
      'total-9': 7,
      'total-10': 7,
      'total-11': 7,
      'total-12': 7,
      'total-13': 9,
      'total-14': 13,
      'total-15': 19,
      'total-16': 32,
      'total-17': 63,
      'any-triple': 31
    }
    
    // 单骰投注的动态赔率
    if (betType.startsWith('single-')) {
      const targetNumber = parseInt(betType.split('-')[1])
      const count = gameResult.diceResults.filter(dice => dice === targetNumber).length
      return count > 0 ? count + 1 : 0
    }
    
    // 对子投注
    if (betType.startsWith('pair-')) {
      return 11
    }
    
    // 三同号投注
    if (betType.startsWith('triple-')) {
      return 181
    }
    
    return oddsMap[betType] || 1
  }

  // 获取投注限额
  const getBetLimits = (betType: BetType) => {
    return bettingStore.getBetLimits(betType)
  }

  // 更新统计信息
  const updateStatistics = (betResult: BetResult): void => {
    statistics.totalBets++
    statistics.totalAmount += betResult.totalAmount
    
    if (betResult.status === 'won' && betResult.totalWinAmount > 0) {
      statistics.biggestWin = Math.max(statistics.biggestWin, betResult.totalWinAmount)
    } else if (betResult.status === 'lost') {
      statistics.biggestLoss = Math.max(statistics.biggestLoss, betResult.totalAmount)
    }
    
    // 计算胜率
    const wonBets = betHistory.value.filter(bet => bet.status === 'won').length
    statistics.winRate = wonBets / statistics.totalBets * 100
    
    // 统计最喜欢的市场
    const marketCounts: Record<string, number> = {}
    betHistory.value.forEach(bet => {
      Object.keys(bet.bets).forEach(market => {
        marketCounts[market] = (marketCounts[market] || 0) + 1
      })
    })
    
    statistics.favoriteMarkets = Object.entries(marketCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([market]) => market)
  }

  // 获取投注建议
  const getBettingAdvice = (): string[] => {
    const advice: string[] = []
    
    if (betCoverage.value > 80) {
      advice.push('投注覆盖面过广，建议集中投注以提高收益率')
    }
    
    if (totalBetAmount.value > balance.value * 0.7) {
      advice.push('投注金额较大，请注意风险控制')
    }
    
    if (statistics.winRate < 30) {
      advice.push('最近胜率较低，建议调整投注策略')
    }
    
    const recentLosses = betHistory.value.slice(-5).filter(bet => bet.status === 'lost').length
    if (recentLosses >= 4) {
      advice.push('连续失利，建议暂停投注或降低投注金额')
    }
    
    return advice
  }

  // 重置统计
  const resetStatistics = (): void => {
    statistics.totalBets = 0
    statistics.totalAmount = 0
    statistics.winRate = 0
    statistics.biggestWin = 0
    statistics.biggestLoss = 0
    statistics.favoriteMarkets = []
    betHistory.value = []
  }

  // 监听游戏状态变化
  watch(() => bettingStore.gamePhase, (newPhase) => {
    if (newPhase === 'rolling') {
      isProcessing.value = true
    } else if (newPhase === 'betting') {
      isProcessing.value = false
      lastError.value = null
    }
  })

  return {
    // 状态
    isProcessing,
    lastError,
    betHistory,
    statistics,
    currentGameResult,
    
    // 计算属性
    currentBets,
    totalBetAmount,
    balance,
    selectedChip,
    lastBets,
    canPlaceBet,
    hasActiveBets,
    remainingBalance,
    betCoverage,
    
    // 方法
    validateBet,
    placeBet,
    quickBet,
    placeBatchBets,
    cancelBet,
    clearAllBets,
    repeatLastBets,
    confirmBets,
    processGameResult,
    calculateWinnings,
    getBettingAdvice,
    resetStatistics,
    
    // 配置
    quickBetAmounts
  }
}