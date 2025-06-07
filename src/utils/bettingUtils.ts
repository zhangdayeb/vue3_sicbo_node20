// src/utils/bettingUtils.ts
import type { BetType, BetLimits } from '@/types/betting'

/**
 * 前端投注工具类
 * 注意：仅用于UI展示和用户体验，不涉及核心业务逻辑
 */
export class BettingUtils {
  
  // 赔率显示配置（从后端获取或配置文件读取）
  private static readonly ODDS_DISPLAY: Record<string, string> = {
    // 大小单双
    'small': '1:1',
    'big': '1:1', 
    'odd': '1:1',
    'even': '1:1',
    
    // 点数投注
    'total-4': '1:62',
    'total-5': '1:31',
    'total-6': '1:18',
    'total-7': '1:12',
    'total-8': '1:8',
    'total-9': '1:6',
    'total-10': '1:6',
    'total-11': '1:6',
    'total-12': '1:6',
    'total-13': '1:8',
    'total-14': '1:12',
    'total-15': '1:18',
    'total-16': '1:31',
    'total-17': '1:62',
    
    // 对子投注
    'pair-1': '1:10', 'pair-2': '1:10', 'pair-3': '1:10',
    'pair-4': '1:10', 'pair-5': '1:10', 'pair-6': '1:10',
    
    // 三同号投注
    'triple-1': '1:180', 'triple-2': '1:180', 'triple-3': '1:180',
    'triple-4': '1:180', 'triple-5': '1:180', 'triple-6': '1:180',
    'any-triple': '1:30',
    
    // 组合投注
    'combo-1-2': '1:6', 'combo-1-3': '1:6', 'combo-1-4': '1:6',
    'combo-1-5': '1:6', 'combo-1-6': '1:6', 'combo-2-3': '1:6',
    'combo-2-4': '1:6', 'combo-2-5': '1:6', 'combo-2-6': '1:6',
    'combo-3-4': '1:6', 'combo-3-5': '1:6', 'combo-3-6': '1:6',
    'combo-4-5': '1:6', 'combo-4-6': '1:6', 'combo-5-6': '1:6',
    
    // 单骰投注
    'single-1': '动态赔率', 'single-2': '动态赔率', 'single-3': '动态赔率',
    'single-4': '动态赔率', 'single-5': '动态赔率', 'single-6': '动态赔率'
  }

  /**
   * 获取投注类型的显示名称
   */
  static getBetTypeName(betType: BetType | string): string {
    const nameMap: Record<string, string> = {
      'small': '小',
      'big': '大',
      'odd': '单',
      'even': '双',
      'any-triple': '全围'
    }
    
    // 处理动态类型
    if (betType.startsWith('total-')) {
      const num = betType.split('-')[1]
      return `总和${num}`
    }
    
    if (betType.startsWith('single-')) {
      const num = betType.split('-')[1]
      return `单骰${num}`
    }
    
    if (betType.startsWith('pair-')) {
      const num = betType.split('-')[1]
      return `对子${num}`
    }
    
    if (betType.startsWith('triple-')) {
      const num = betType.split('-')[1]
      return `围${num}`
    }
    
    if (betType.startsWith('combo-')) {
      const parts = betType.split('-')
      return `组合${parts[1]}-${parts[2]}`
    }
    
    return nameMap[betType] || betType
  }

  /**
   * 获取赔率显示文本（仅用于UI显示）
   */
  static getOddsDisplay(betType: BetType | string): string {
    return this.ODDS_DISPLAY[betType] || '1:1'
  }

  /**
   * 前端投注金额验证（用户体验层面）
   * 注意：真实验证在后端进行
   */
  static validateBetAmount(
    betType: BetType | string, 
    amount: number, 
    balance: number,
    limits: BetLimits
  ): {
    isValid: boolean
    error?: string
    warning?: string
  } {
    // 基础验证
    if (amount <= 0) {
      return { isValid: false, error: '投注金额必须大于0' }
    }
    
    if (amount > balance) {
      return { isValid: false, error: '余额不足' }
    }
    
    if (amount < limits.min) {
      return { isValid: false, error: `最小投注金额为 ${limits.min}` }
    }
    
    if (amount > limits.max) {
      return { isValid: false, error: `最大投注金额为 ${limits.max}` }
    }
    
    // 风险提示
    let warning: string | undefined
    if (amount > balance * 0.5) {
      warning = '投注金额较大，请注意风险控制'
    }
    
    return { isValid: true, warning }
  }

  /**
   * 计算潜在收益（仅供参考，真实计算在后端）
   */
  static calculatePotentialWin(betType: BetType | string, amount: number): {
    minWin: number
    maxWin: number
    display: string
  } {
    // 根据投注类型计算可能的收益范围
    if (betType.startsWith('single-')) {
      // 单骰投注：1倍、2倍、3倍
      return {
        minWin: amount * 2,
        maxWin: amount * 4, 
        display: `${amount * 2} - ${amount * 4}`
      }
    }
    
    // 其他固定赔率
    const oddsText = this.getOddsDisplay(betType)
    if (oddsText.includes(':')) {
      const [, multiplier] = oddsText.split(':')
      const win = amount * parseInt(multiplier)
      return {
        minWin: win,
        maxWin: win,
        display: win.toLocaleString()
      }
    }
    
    return {
      minWin: amount * 2,
      maxWin: amount * 2,
      display: (amount * 2).toLocaleString()
    }
  }

  /**
   * 格式化金额显示
   */
  static formatAmount(amount: number): string {
    if (amount >= 10000) {
      return (amount / 10000).toFixed(1) + 'W'
    } else if (amount >= 1000) {
      return (amount / 1000).toFixed(1) + 'K'
    }
    return amount.toString()
  }

  /**
   * 获取投注类型的颜色主题
   */
  static getBetTypeColor(betType: BetType | string): string {
    const colorMap: Record<string, string> = {
      'small': '#3498db',
      'big': '#e74c3c', 
      'odd': '#27ae60',
      'even': '#9b59b6',
      'any-triple': '#f39c12'
    }
    
    if (betType.startsWith('total-')) {
      return '#2c3e50'
    }
    
    return colorMap[betType] || '#95a5a6'
  }

  /**
   * 检查投注类型是否为高风险投注
   */
  static isHighRiskBet(betType: BetType | string): boolean {
    const highRiskBets = [
      'total-4', 'total-17', 'total-5', 'total-16',
      'triple-1', 'triple-2', 'triple-3', 'triple-4', 'triple-5', 'triple-6'
    ]
    return highRiskBets.includes(betType)
  }

  /**
   * 获取投注建议文本
   */
  static getBetAdvice(betType: BetType | string): string {
    if (this.isHighRiskBet(betType)) {
      return '高风险高回报投注，请谨慎操作'
    }
    
    if (['small', 'big', 'odd', 'even'].includes(betType)) {
      return '稳健投注选择，适合新手'
    }
    
    return '中等风险投注'
  }
}

/**
 * 投注历史分析工具（可选实现）
 */
export class BettingAnalyzer {
  
  /**
   * 分析用户投注模式
   */
  static analyzeBettingPattern(history: any[]): {
    favoriteTypes: string[]
    averageBet: number
    winRate: number
    riskLevel: 'conservative' | 'moderate' | 'aggressive'
  } {
    // 这里可以实现一些前端分析逻辑
    // 主要用于用户界面展示和体验优化
    
    return {
      favoriteTypes: ['small', 'big'],
      averageBet: 100,
      winRate: 45.2,
      riskLevel: 'moderate'
    }
  }

  /**
   * 生成投注建议
   */
  static generateBettingAdvice(
    balance: number, 
    recentHistory: any[]
  ): string[] {
    const advice: string[] = []
    
    if (balance < 1000) {
      advice.push('余额较低，建议选择低风险投注')
    }
    
    // 可以根据历史数据分析添加更多建议
    
    return advice
  }
}

// 导出常量
export const BET_CATEGORIES = {
  MAIN: 'main',           // 大小单双
  NUMBER: 'number',       // 点数
  SINGLE: 'single',       // 单骰
  PAIR: 'pair',          // 对子
  TRIPLE: 'triple',      // 三同号
  COMBO: 'combo'         // 组合
} as const

export const RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium', 
  HIGH: 'high'
} as const