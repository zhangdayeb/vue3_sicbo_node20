// src/utils/urlParams.ts
import type { GameParams } from '@/types/api'

/**
 * 解析URL中的游戏参数
 * 示例URL: http://localhost:3000/?table_id=5&game_type=9&user_id=8&token=9eb5fcdac259fd6cedacad3e04bacf2ed7M3m261WOCWcaAKFFa2Nu
 */
export const parseGameParams = (): GameParams => {
  const urlParams = new URLSearchParams(window.location.search)
  
  return {
    table_id: urlParams.get('table_id') || '',
    game_type: urlParams.get('game_type') || '',
    user_id: urlParams.get('user_id') || '',
    token: urlParams.get('token') || ''
  }
}

/**
 * 验证游戏参数的完整性
 */
export const validateGameParams = (params: GameParams): {
  isValid: boolean
  missingParams: string[]
  errors: string[]
} => {
  const missingParams: string[] = []
  const errors: string[] = []
  
  // 检查必需参数
  if (!params.table_id) missingParams.push('table_id')
  if (!params.game_type) missingParams.push('game_type')
  if (!params.user_id) missingParams.push('user_id')
  if (!params.token) missingParams.push('token')
  
  // 验证参数格式
  if (params.table_id && !/^\d+$/.test(params.table_id)) {
    errors.push('table_id 必须是数字')
  }
  
  if (params.game_type && !/^\d+$/.test(params.game_type)) {
    errors.push('game_type 必须是数字')
  }
  
  if (params.user_id && !/^\d+$/.test(params.user_id)) {
    errors.push('user_id 必须是数字')
  }
  
  if (params.token && params.token.length < 10) {
    errors.push('token 格式无效')
  }
  
  // 验证游戏类型是否有效
  if (params.game_type && !isValidGameType(params.game_type)) {
    errors.push(`无效的游戏类型: ${params.game_type}`)
  }
  
  return {
    isValid: missingParams.length === 0 && errors.length === 0,
    missingParams,
    errors
  }
}

/**
 * 检查游戏类型是否有效
 */
export const isValidGameType = (gameType: string): boolean => {
  const validGameTypes = ['1', '2', '3', '6', '8', '9'] // 根据您提供的表格
  return validGameTypes.includes(gameType)
}

/**
 * 获取当前页面的完整URL（用于调试）
 */
export const getCurrentURL = (): string => {
  return window.location.href
}

/**
 * 生成带参数的URL（用于测试）
 */
export const generateTestURL = (params: Partial<GameParams>): string => {
  const defaultParams: GameParams = {
    table_id: '3',
    game_type: '3', // 默认骰宝
    user_id: '8',
    token: 'test_token_123456789'
  }
  
  const finalParams = { ...defaultParams, ...params }
  const baseURL = `${window.location.protocol}//${window.location.host}${window.location.pathname}`
  const searchParams = new URLSearchParams(finalParams)
  
  return `${baseURL}?${searchParams.toString()}`
}

/**
 * 检查是否在开发环境中有测试参数
 */
export const hasTestParams = (): boolean => {
  const params = parseGameParams()
  return params.token.includes('test_') || 
         params.table_id === '999' || 
         params.user_id === '999'
}

/**
 * 获取游戏类型描述（根据您提供的表格更新）
 */
export const getGameTypeDescription = (gameType: string): string => {
  const gameTypes: Record<string, string> = {
    '1': '现场台',     // ID 1
    '2': '龙虎',       // ID 2  
    '3': '百家乐',     // ID 3
    '6': '牛牛',       // ID 6
    '8': '三公',       // ID 8
    '9': '骰宝'        // ID 9
  }
  
  return gameTypes[gameType] || '未知游戏'
}

/**
 * 检查当前游戏类型是否为骰宝
 */
export const isSicBoGame = (gameType: string): boolean => {
  return gameType === '9'
}

/**
 * 获取游戏类型对应的英文标识
 */
export const getGameTypeKey = (gameType: string): string => {
  const gameTypeKeys: Record<string, string> = {
    '1': 'live_table',     // 现场台
    '2': 'dragon_tiger',   // 龙虎
    '3': 'baccarat',       // 百家乐
    '6': 'bull_bull',      // 牛牛
    '8': 'three_cards',    // 三公
    '9': 'sicbo'           // 骰宝
  }
  
  return gameTypeKeys[gameType] || 'unknown'
}

/**
 * 验证当前访问的游戏类型是否正确
 */
export const validateCurrentGameType = (): {
  isValid: boolean
  currentType: string
  expectedType: string
  error?: string
} => {
  const params = parseGameParams()
  const currentType = params.game_type
  
  // 当前是骰宝应用，检查游戏类型是否为骰宝(9)
  if (!isSicBoGame(currentType)) {
    return {
      isValid: false,
      currentType,
      expectedType: '9',
      error: `当前游戏类型(${getGameTypeDescription(currentType)})与应用不匹配，期望骰宝游戏`
    }
  }
  
  return {
    isValid: true,
    currentType,
    expectedType: '9'
  }
}

/**
 * 日志输出游戏参数（开发环境）
 */
export const logGameParams = (): void => {
  if (import.meta.env.DEV) {
    const params = parseGameParams()
    const validation = validateGameParams(params)
    const gameTypeValidation = validateCurrentGameType()
    
    console.group('🎮 游戏参数信息')
    console.log('📋 解析结果:', params)
    console.log('✅ 参数验证:', validation.isValid ? '通过' : '失败')
    console.log('🎯 游戏类型:', getGameTypeDescription(params.game_type))
    console.log('🎲 骰宝匹配:', gameTypeValidation.isValid ? '正确' : '错误')
    
    if (!validation.isValid) {
      if (validation.missingParams.length > 0) {
        console.warn('❌ 缺少参数:', validation.missingParams)
      }
      if (validation.errors.length > 0) {
        console.error('🚫 参数错误:', validation.errors)
      }
    }
    
    if (!gameTypeValidation.isValid) {
      console.warn('⚠️ 游戏类型警告:', gameTypeValidation.error)
    }
    
    console.log('🔗 完整URL:', getCurrentURL())
    console.groupEnd()
  }
}

/**
 * 生成不同游戏类型的测试URL
 */
export const generateGameTestURLs = (): Record<string, string> => {
  const baseParams = {
    table_id: '3',
    user_id: '8', 
    token: 'test_token_123456789'
  }
  
  const gameTypes = ['1', '2', '3', '6', '8', '9']
  const urls: Record<string, string> = {}
  
  gameTypes.forEach(gameType => {
    const gameName = getGameTypeDescription(gameType)
    urls[gameName] = generateTestURL({ ...baseParams, game_type: gameType })
  })
  
  return urls
}