// 单期结果
export interface GameResult {
  dice1: number         // 第一个骰子 1-6
  dice2: number         // 第二个骰子 1-6  
  dice3: number         // 第三个骰子 1-6
  sum: number           // 三个骰子总点数 (dice1 + dice2 + dice3)
  size: 'big' | 'small' // 大小结果：4-10为小，11-17为大
  parity: 'odd' | 'even' // 单双结果：总和的奇偶性
}

// 历史数据
export interface HistoryData {
  results: GameResult[]  // 历史开奖结果数组
  total: number         // 总记录数
}

// 路纸API响应
export interface RoadmapApiResponse {
  code: number
  message?: string
  data?: any
}

// 计算单期完整结果
export function calculateGameResult(dice1: number, dice2: number, dice3: number): GameResult {
  const sum = dice1 + dice2 + dice3
  
  return {
    dice1,
    dice2, 
    dice3,
    sum,
    size: sum >= 4 && sum <= 10 ? 'small' : 'big',
    parity: sum % 2 === 0 ? 'even' : 'odd'
  }
}