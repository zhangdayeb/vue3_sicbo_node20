// src/services/mockApi.ts
import type { BetType, GameResult, BetRecord, BetLimits } from '@/types/betting'
import type { GamePhase } from '@/types/game'

// Mock数据接口定义
export interface MockGameData {
  gameNumber: string
  diceResults: [number, number, number]
  gamePhase: GamePhase
  countdown: number
  round: number
  timestamp: Date
}

export interface WinResult {
  betType: string
  betAmount: number
  winAmount: number
  odds: number
  isWin: boolean
  winCondition?: string
}

export interface MockUserData {
  userId: string
  username: string
  balance: number
  vipLevel: number
  totalBets: number
  totalWins: number
  winRate: number
}

export interface HistoryItem {
  gameNumber: string
  timestamp: Date
  diceResults: [number, number, number]
  totalBetAmount: number
  totalWinAmount: number
  netProfit: number
  bets: WinResult[]
}

class MockApiService {
  private currentGameData: MockGameData | null = null
  private gameHistory: HistoryItem[] = []
  private bettingHistory: BetRecord[] = []
  private userData: MockUserData = {
    userId: 'user_' + Date.now(),
    username: '演示用户',
    balance: 50000,
    vipLevel: 2,
    totalBets: 156,
    totalWins: 68,
    winRate: 43.6
  }

  // 赔率配置表
  private oddsMap: Record<string, number> = {
    // 大小单双 1:1
    'small': 2,
    'big': 2,
    'odd': 2,
    'even': 2,
    
    // 点数投注 (基于真实概率)
    'total-4': 63,   // 3种组合
    'total-5': 32,   // 6种组合
    'total-6': 19,   // 10种组合
    'total-7': 13,   // 15种组合
    'total-8': 9,    // 21种组合
    'total-9': 7,    // 25种组合
    'total-10': 7,   // 27种组合
    'total-11': 7,   // 27种组合
    'total-12': 7,   // 25种组合
    'total-13': 9,   // 21种组合
    'total-14': 13,  // 15种组合
    'total-15': 19,  // 10种组合
    'total-16': 32,  // 6种组合
    'total-17': 63,  // 3种组合
    
    // 对子投注 1:10
    'pair-1': 11, 'pair-2': 11, 'pair-3': 11,
    'pair-4': 11, 'pair-5': 11, 'pair-6': 11,
    
    // 三同号投注 1:180
    'triple-1': 181, 'triple-2': 181, 'triple-3': 181,
    'triple-4': 181, 'triple-5': 181, 'triple-6': 181,
    'any-triple': 31,
    
    // 组合投注 1:6
    'combo-1-2': 7, 'combo-1-3': 7, 'combo-1-4': 7, 'combo-1-5': 7, 'combo-1-6': 7,
    'combo-2-3': 7, 'combo-2-4': 7, 'combo-2-5': 7, 'combo-2-6': 7,
    'combo-3-4': 7, 'combo-3-5': 7, 'combo-3-6': 7,
    'combo-4-5': 7, 'combo-4-6': 7, 'combo-5-6': 7
  }

  // 单骰投注动态赔率
  private getSingleDiceOdds(diceValue: number, diceResults: [number, number, number]): number {
    const count = diceResults.filter(dice => dice === diceValue).length
    return count > 0 ? count + 1 : 0
  }

  /**
   * 生成随机游戏数据
   */
  generateGameData(): MockGameData {
    const now = new Date()
    const tableId = 'T001'
    const dateStr = now.getFullYear().toString().slice(-2) + 
                    String(now.getMonth() + 1).padStart(2, '0') + 
                    String(now.getDate()).padStart(2, '0')
    const round = Math.floor(Math.random() * 9999) + 1
    const sequence = String(round).padStart(4, '0')
    
    this.currentGameData = {
      gameNumber: `${tableId}${dateStr}${sequence}`,
      diceResults: [
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1
      ] as [number, number, number],
      gamePhase: 'betting',
      countdown: 30,
      round,
      timestamp: now
    }
    
    return { ...this.currentGameData }
  }

  /**
   * 获取当前游戏数据
   */
  getCurrentGameData(): MockGameData | null {
    return this.currentGameData ? { ...this.currentGameData } : null
  }

  /**
   * 更新游戏阶段
   */
  updateGamePhase(phase: GamePhase, countdown?: number): MockGameData {
    if (this.currentGameData) {
      this.currentGameData.gamePhase = phase
      if (countdown !== undefined) {
        this.currentGameData.countdown = countdown
      }
    }
    return this.getCurrentGameData()!
  }

  /**
   * 计算投注结果
   */
  calculateWinnings(bets: Record<string, number>, diceResults?: [number, number, number]): {
    results: WinResult[]
    totalWinAmount: number
    totalBetAmount: number
    netProfit: number
  } {
    const finalResults = diceResults || this.currentGameData?.diceResults || [1, 1, 1]
    const total = finalResults.reduce((sum, dice) => sum + dice, 0)
    
    const results: WinResult[] = []
    let totalWinAmount = 0
    let totalBetAmount = 0

    Object.entries(bets).forEach(([betType, amount]) => {
      totalBetAmount += amount
      const isWin = this.checkWinCondition(betType, finalResults, total)
      let odds = this.oddsMap[betType] || 1
      
      // 处理单骰投注的动态赔率
      if (betType.startsWith('single-')) {
        const diceValue = parseInt(betType.split('-')[1])
        odds = this.getSingleDiceOdds(diceValue, finalResults)
      }
      
      const winAmount = isWin ? amount * odds : 0
      totalWinAmount += winAmount
      
      results.push({
        betType,
        betAmount: amount,
        winAmount,
        odds: odds,
        isWin,
        winCondition: this.getWinCondition(betType, finalResults, total)
      })
    })

    return {
      results,
      totalWinAmount,
      totalBetAmount,
      netProfit: totalWinAmount - totalBetAmount
    }
  }

  /**
   * 检查中奖条件
   */
  private checkWinCondition(betType: string, diceResults: [number, number, number], total: number): boolean {
    switch (betType) {
      // 大小单双
      case 'small':
        return total >= 4 && total <= 10 && !this.isTriple(diceResults)
      case 'big':
        return total >= 11 && total <= 17 && !this.isTriple(diceResults)
      case 'odd':
        return total % 2 === 1 && !this.isTriple(diceResults)
      case 'even':
        return total % 2 === 0 && !this.isTriple(diceResults)
      
      // 点数投注
      default:
        if (betType.startsWith('total-')) {
          const targetTotal = parseInt(betType.split('-')[1])
          return total === targetTotal
        }
        
        // 单骰投注
        if (betType.startsWith('single-')) {
          const targetNumber = parseInt(betType.split('-')[1])
          return diceResults.includes(targetNumber)
        }
        
        // 对子投注
        if (betType.startsWith('pair-')) {
          const targetNumber = parseInt(betType.split('-')[1])
          const count = diceResults.filter(dice => dice === targetNumber).length
          return count >= 2
        }
        
        // 三同号投注
        if (betType.startsWith('triple-')) {
          const targetNumber = parseInt(betType.split('-')[1])
          return diceResults.every(dice => dice === targetNumber)
        }
        
        if (betType === 'any-triple') {
          return this.isTriple(diceResults)
        }
        
        // 组合投注
        if (betType.startsWith('combo-')) {
          const [_, num1Str, num2Str] = betType.split('-')
          const num1 = parseInt(num1Str)
          const num2 = parseInt(num2Str)
          return diceResults.includes(num1) && diceResults.includes(num2)
        }
        
        return false
    }
  }

  /**
   * 检查是否为三同号
   */
  private isTriple(diceResults: [number, number, number]): boolean {
    return diceResults[0] === diceResults[1] && diceResults[1] === diceResults[2]
  }

  /**
   * 获取中奖描述
   */
  private getWinCondition(betType: string, diceResults: [number, number, number], total: number): string {
    if (!this.checkWinCondition(betType, diceResults, total)) {
      return '未中奖'
    }

    const [d1, d2, d3] = diceResults
    
    switch (betType) {
      case 'small':
        return `小(${total})`
      case 'big':
        return `大(${total})`
      case 'odd':
        return `单(${total})`
      case 'even':
        return `双(${total})`
      default:
        if (betType.startsWith('total-')) {
          return `总和${total}`
        }
        if (betType.startsWith('single-')) {
          const num = parseInt(betType.split('-')[1])
          const count = diceResults.filter(d => d === num).length
          return `出现${count}个${num}`
        }
        if (betType.startsWith('pair-')) {
          const num = parseInt(betType.split('-')[1])
          return `对子${num}${num}`
        }
        if (betType.startsWith('triple-')) {
          const num = parseInt(betType.split('-')[1])
          return `三同号${num}${num}${num}`
        }
        if (betType === 'any-triple') {
          return `任意三同号${d1}${d1}${d1}`
        }
        if (betType.startsWith('combo-')) {
          const [_, num1, num2] = betType.split('-')
          return `组合${num1}-${num2}`
        }
        return '中奖'
    }
  }

  /**
   * 更新用户余额
   */
  async updateBalance(amount: number): Promise<number> {
    // 模拟网络延迟
    await this.simulateNetworkDelay(100, 300)
    
    this.userData.balance = Math.max(0, amount)
    return this.userData.balance
  }

  /**
   * 获取用户信息
   */
  async getUserInfo(): Promise<MockUserData> {
    await this.simulateNetworkDelay(50, 150)
    return { ...this.userData }
  }

  /**
   * 保存投注记录到历史
   */
  saveBettingHistory(gameNumber: string, bets: Record<string, number>, results: WinResult[]): void {
    const historyItem: HistoryItem = {
      gameNumber,
      timestamp: new Date(),
      diceResults: this.currentGameData?.diceResults || [1, 1, 1],
      totalBetAmount: Object.values(bets).reduce((sum, amount) => sum + amount, 0),
      totalWinAmount: results.reduce((sum, result) => sum + result.winAmount, 0),
      netProfit: 0, // 会在下面计算
      bets: results
    }
    
    historyItem.netProfit = historyItem.totalWinAmount - historyItem.totalBetAmount
    
    this.gameHistory.unshift(historyItem)
    // 只保留最近100条记录
    if (this.gameHistory.length > 100) {
      this.gameHistory = this.gameHistory.slice(0, 100)
    }
  }

  /**
   * 获取游戏历史
   */
  async getGameHistory(page: number = 1, limit: number = 20): Promise<{
    data: HistoryItem[]
    total: number
    page: number
    limit: number
  }> {
    await this.simulateNetworkDelay(200, 500)
    
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    
    return {
      data: this.gameHistory.slice(startIndex, endIndex),
      total: this.gameHistory.length,
      page,
      limit
    }
  }

  /**
   * 生成历史数据（用于演示）
   */
  generateHistoryData(count: number = 50): void {
    const now = new Date()
    
    for (let i = 0; i < count; i++) {
      const gameTime = new Date(now.getTime() - i * 60000) // 每分钟一局
      const diceResults: [number, number, number] = [
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1
      ]
      
      // 随机生成一些投注
      const randomBets: Record<string, number> = {}
      const betTypes = ['small', 'big', 'odd', 'even', 'total-7', 'total-14', 'single-1', 'pair-6']
      const numBets = Math.floor(Math.random() * 3) + 1
      
      for (let j = 0; j < numBets; j++) {
        const betType = betTypes[Math.floor(Math.random() * betTypes.length)]
        const amount = [10, 50, 100, 500][Math.floor(Math.random() * 4)]
        randomBets[betType] = amount
      }
      
      const winResults = this.calculateWinnings(randomBets, diceResults)
      
      const historyItem: HistoryItem = {
        gameNumber: `T001${gameTime.getDate().toString().padStart(2, '0')}${(count - i).toString().padStart(4, '0')}`,
        timestamp: gameTime,
        diceResults,
        totalBetAmount: winResults.totalBetAmount,
        totalWinAmount: winResults.totalWinAmount,
        netProfit: winResults.netProfit,
        bets: winResults.results
      }
      
      this.gameHistory.push(historyItem)
    }
  }

  /**
   * 获取投注限额
   */
  getBetLimits(betType: BetType): BetLimits {
    const limitsMap: Record<string, BetLimits> = {
      // 大小单双
      'small': { min: 10, max: 50000 },
      'big': { min: 10, max: 50000 },
      'odd': { min: 10, max: 50000 },
      'even': { min: 10, max: 50000 },
      
      // 点数投注 (根据难度调整限额)
      'total-4': { min: 1, max: 1000 },
      'total-17': { min: 1, max: 1000 },
      'total-5': { min: 1, max: 2000 },
      'total-16': { min: 1, max: 2000 },
      'total-10': { min: 5, max: 12000 },
      'total-11': { min: 5, max: 12000 },
      
      // 默认限额
      'default': { min: 1, max: 10000 }
    }
    
    return limitsMap[betType] || limitsMap['default']
  }

  /**
   * 模拟网络延迟
   */
  private async simulateNetworkDelay(min: number = 100, max: number = 500): Promise<void> {
    const delay = Math.random() * (max - min) + min
    return new Promise(resolve => setTimeout(resolve, delay))
  }

  /**
   * 重置所有数据
   */
  reset(): void {
    this.currentGameData = null
    this.gameHistory = []
    this.bettingHistory = []
    this.userData.balance = 50000
  }

  /**
   * 模拟网络错误（用于测试错误处理）
   */
  async simulateError(errorType: 'network' | 'server' | 'timeout' = 'network'): Promise<never> {
    await this.simulateNetworkDelay(1000, 3000)
    
    const errors = {
      network: new Error('网络连接失败'),
      server: new Error('服务器内部错误'),
      timeout: new Error('请求超时')
    }
    
    throw errors[errorType]
  }
}

// 创建单例实例
export const mockApiService = new MockApiService()

// 自动生成一些历史数据用于演示
mockApiService.generateHistoryData(30)

export default mockApiService