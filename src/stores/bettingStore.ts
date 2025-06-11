// src/stores/bettingStore.ts - 优化后的投注状态管理
import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import type { BetType, GamePhase } from '@/types/betting'

// 🔥 新增：扩展的投注阶段
export type ExtendedBettingPhase = 
  | 'waiting'     // 等待开始
  | 'betting'     // 可以投注
  | 'confirmed'   // 已确认投注，可继续加注
  | 'dealing'     // 开牌中，禁止投注
  | 'result'      // 结果阶段

// 🔥 简化的投注设置 - 只保留调试模式和震动
interface BettingSettings {
  vibrationEnabled: boolean
  debugMode: boolean
}

// 🔥 新增：getBetTypeId 函数 - 将投注类型转换为API需要的ID（根据真实数据库数据）
const getBetTypeId = (betType: string): number => {
  const betTypeMap: Record<string, number> = {
    // 大小单双 (ID: 304-307)
    'small': 304,    // 小(4-10)
    'big': 305,      // 大(11-17)  
    'odd': 306,      // 单
    'even': 307,     // 双
    
    // 总和投注 (ID: 308-321)
    'sum-4': 308,    // 总和4
    'sum-5': 309,    // 总和5
    'sum-6': 310,    // 总和6
    'sum-7': 311,    // 总和7
    'sum-8': 312,    // 总和8
    'sum-9': 313,    // 总和9
    'sum-10': 314,   // 总和10
    'sum-11': 315,   // 总和11
    'sum-12': 316,   // 总和12
    'sum-13': 317,   // 总和13
    'sum-14': 318,   // 总和14
    'sum-15': 319,   // 总和15
    'sum-16': 320,   // 总和16
    'sum-17': 321,   // 总和17
    
    // 单骰投注 (ID: 322-327)
    'single-1': 322, // 单骰1
    'single-2': 323, // 单骰2
    'single-3': 324, // 单骰3
    'single-4': 325, // 单骰4
    'single-5': 326, // 单骰5
    'single-6': 327, // 单骰6
    
    // 对子投注 (ID: 328-333)
    'pair-1': 328,   // 对子1
    'pair-2': 329,   // 对子2
    'pair-3': 330,   // 对子3
    'pair-4': 331,   // 对子4
    'pair-5': 332,   // 对子5
    'pair-6': 333,   // 对子6
    
    // 三同号投注 (ID: 334-340)
    'triple-1': 334, // 三同号1
    'triple-2': 335, // 三同号2
    'triple-3': 336, // 三同号3
    'triple-4': 337, // 三同号4
    'triple-5': 338, // 三同号5
    'triple-6': 339, // 三同号6
    'any-triple': 340, // 任意三同号
    
    // 组合投注 (ID: 341-355)
    'combo-1-2': 341, // 组合1-2
    'combo-1-3': 342, // 组合1-3
    'combo-1-4': 343, // 组合1-4
    'combo-1-5': 344, // 组合1-5
    'combo-1-6': 345, // 组合1-6
    'combo-2-3': 346, // 组合2-3
    'combo-2-4': 347, // 组合2-4
    'combo-2-5': 348, // 组合2-5
    'combo-2-6': 349, // 组合2-6
    'combo-3-4': 350, // 组合3-4
    'combo-3-5': 351, // 组合3-5
    'combo-3-6': 352, // 组合3-6
    'combo-4-5': 353, // 组合4-5
    'combo-4-6': 354, // 组合4-6
    'combo-5-6': 355  // 组合5-6
  }
  
  return betTypeMap[betType] || 304  // 默认返回"小"的ID
}

export const useBettingStore = defineStore('betting', () => {
  // 基础状态
  const balance = ref(10000)
  const selectedChip = ref(10)
  const currentBets = ref<Record<string, number>>({})      // 当前正在投注的金额
  const confirmedBets = ref<Record<string, number>>({})    // 🔥 新增：已确认的投注
  const lastBets = ref<Record<string, number>>({})         // 上轮投注
  const gamePhase = ref<GamePhase>('betting')              // 游戏阶段
  const bettingPhase = ref<ExtendedBettingPhase>('betting') // 🔥 新增：详细的投注阶段
  const isConnected = ref(true)
  
  // 🔥 简化的设置配置 - 只保留必要的
  const settings = reactive<BettingSettings>({
    vibrationEnabled: true,
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
  
  // 🔥 新增：显示用的投注数据（合并已确认和当前投注）
  const displayBets = computed(() => {
    const combined: Record<string, { current: number; confirmed: number; total: number }> = {}
    
    // 处理已确认的投注
    Object.entries(confirmedBets.value).forEach(([betType, amount]) => {
      if (!combined[betType]) {
        combined[betType] = { current: 0, confirmed: 0, total: 0 }
      }
      combined[betType].confirmed = amount
    })
    
    // 处理当前投注
    Object.entries(currentBets.value).forEach(([betType, amount]) => {
      if (!combined[betType]) {
        combined[betType] = { current: 0, confirmed: 0, total: 0 }
      }
      combined[betType].current = amount
    })
    
    // 计算总额
    Object.keys(combined).forEach(betType => {
      combined[betType].total = combined[betType].current + combined[betType].confirmed
    })
    
    return combined
  })
  
  // 可用余额（扣除当前投注）
  const availableBalance = computed(() => {
    return balance.value - totalBetAmount.value
  })
  
  // 是否可以下注
  const canPlaceBet = computed(() => {
    return gamePhase.value === 'betting' && 
           bettingPhase.value === 'betting' && 
           isConnected.value &&
           availableBalance.value > 0
  })
  
  // 投注数量统计
  const betCount = computed(() => {
    return Object.keys(currentBets.value).length
  })
  
  // 🔥 新增：已确认投注数量
  const confirmedBetCount = computed(() => {
    return Object.keys(confirmedBets.value).length
  })
  
  // 是否有活跃投注
  const hasActiveBets = computed(() => {
    return betCount.value > 0
  })
  
  // 🔥 新增：是否有已确认的投注
  const hasConfirmedBets = computed(() => {
    return confirmedBetCount.value > 0
  })
  
  // 格式化余额显示
  const formattedBalance = computed(() => {
    return balance.value.toLocaleString()
  })
  
  // 调试日志
  const debugLog = (message: string, data?: any): void => {
    if (settings.debugMode) {
      console.log(`🎰 [BettingStore] ${message}`, data || '')
    }
  }
  
  // 选择筹码
  const selectChip = (amount: number): void => {
    if (amount > 0 && amount <= balance.value) {
      selectedChip.value = amount
      debugLog('选择筹码', amount)
    }
  }
  
  // 下注
  const placeBet = (betType: BetType, amount?: number): boolean => {
    if (!canPlaceBet.value) {
      debugLog('下注失败 - 当前不能下注')
      return false
    }
    
    const betAmount = amount || selectedChip.value
    
    if (betAmount <= 0 || betAmount > availableBalance.value) {
      debugLog('下注失败 - 金额无效', { betAmount, availableBalance: availableBalance.value })
      return false
    }
    
    // 添加到当前投注
    if (!currentBets.value[betType]) {
      currentBets.value[betType] = 0
    }
    currentBets.value[betType] += betAmount
    
    debugLog('下注成功', { betType, amount: betAmount, total: currentBets.value[betType] })
    return true
  }
  
  // 🔥 新增：确认当前投注
  const confirmCurrentBets = (): void => {
    if (hasActiveBets.value) {
      // 将当前投注合并到已确认投注
      Object.entries(currentBets.value).forEach(([betType, amount]) => {
        if (!confirmedBets.value[betType]) {
          confirmedBets.value[betType] = 0
        }
        confirmedBets.value[betType] += amount
      })
      
      // 清空当前投注
      currentBets.value = {}
      
      // 更新投注阶段
      bettingPhase.value = 'confirmed'
      
      debugLog('确认投注完成', {
        confirmedBets: confirmedBets.value,
        bettingPhase: bettingPhase.value
      })
    }
  }
  
  // 取消指定投注
  const cancelBet = (betType: BetType): void => {
    if (currentBets.value[betType]) {
      const amount = currentBets.value[betType]
      delete currentBets.value[betType]
      debugLog('取消投注', { betType, amount })
    }
  }
  
  // 清空当前投注
  const clearBets = (): void => {
    currentBets.value = {}
    debugLog('清空当前投注')
  }
  
  // 🔥 新增：清空已确认投注
  const clearConfirmedBets = (): void => {
    // 保存为上次投注（用于重复投注）
    lastBets.value = { ...confirmedBets.value }
    confirmedBets.value = {}
    debugLog('清空已确认投注，保存为上次投注', lastBets.value)
  }
  
  // 🔥 新增：清空所有投注
  const clearAllBets = (): void => {
    currentBets.value = {}
    confirmedBets.value = {}
    debugLog('清空所有投注')
  }
  
  // 重复上次投注
  const rebet = (): void => {
    if (Object.keys(lastBets.value).length === 0) {
      debugLog('重复投注失败 - 没有上次投注记录')
      return
    }
    
    // 计算上次投注总额
    const lastBetTotal = Object.values(lastBets.value).reduce((sum, amount) => sum + amount, 0)
    
    if (lastBetTotal > availableBalance.value) {
      debugLog('重复投注失败 - 余额不足', { 
        required: lastBetTotal, 
        available: availableBalance.value 
      })
      return
    }
    
    // 复制上次投注到当前投注
    currentBets.value = { ...lastBets.value }
    debugLog('重复投注成功', currentBets.value)
  }
  
  // 兼容性方法：确认投注（与旧版本兼容）
  const confirmBets = (): void => {
    confirmCurrentBets()
  }
  
  // 更新余额
  const updateBalance = (newBalance: number): void => {
    if (newBalance >= 0) {
      balance.value = newBalance
      debugLog('更新余额', newBalance)
    }
  }
  
  // 更新游戏阶段
  const updateGamePhase = (phase: GamePhase): void => {
    gamePhase.value = phase
    debugLog('更新游戏阶段', phase)
    
    // 自动更新投注阶段
    if (phase === 'betting' && bettingPhase.value === 'waiting') {
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
  
  // 切换调试模式
  const toggleDebugMode = (): void => {
    settings.debugMode = !settings.debugMode
    console.log(`调试模式已${settings.debugMode ? '开启' : '关闭'}`)
  }
  
  // 切换震动模式
  const toggleVibration = (): void => {
    settings.vibrationEnabled = !settings.vibrationEnabled
    debugLog('切换震动模式', settings.vibrationEnabled)
  }
  
  // 初始化方法
  const init = (): void => {
    debugLog('初始化 bettingStore [优化版本]')
    
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
    
    debugLog('初始化完成 [优化版本]', {
      balance: balance.value,
      selectedChip: selectedChip.value,
      gamePhase: gamePhase.value,
      bettingPhase: bettingPhase.value,
      canPlaceBet: canPlaceBet.value
    })
  }
  
  return {
    // 🔥 导出 getBetTypeId 函数
    getBetTypeId,
    
    // 状态
    balance,
    selectedChip,
    currentBets,
    confirmedBets,        // 🔥 新增
    lastBets,
    gamePhase,
    bettingPhase,         // 🔥 新增
    isConnected,
    settings,             // 🔥 简化后的设置
    
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
    toggleDebugMode,
    toggleVibration,      // 🔥 新增
    init
  }
})