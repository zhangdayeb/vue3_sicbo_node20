// src/utils/urlParams.ts
import type { GameParams } from '@/types/api'

/**
 * 解析URL中的游戏参数
 * 示例URL: http://localhost:8080/bjlLh?table_id=3&game_type=3&user_id=8&token=9eb5fcdac259fd6cedacad3e04bacf2ed7M3m261WOCWcaAKFFa2Nu
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
  
  return {
    isValid: missingParams.length === 0 && errors.length === 0,
    missingParams,
    errors
  }
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
    game_type: '3',
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
 * 获取游戏类型描述
 */
export const getGameTypeDescription = (gameType: string): string => {
  const gameTypes: Record<string, string> = {
    '1': '百家乐',
    '2': '龙虎',
    '3': '骰宝',
    '4': '轮盘',
    '5': '牛牛'
  }
  
  return gameTypes[gameType] || '未知游戏'
}

/**
 * 日志输出游戏参数（开发环境）
 */
export const logGameParams = (): void => {
  if (import.meta.env.DEV) {
    const params = parseGameParams()
    const validation = validateGameParams(params)
    
    console.group('🎮 游戏参数信息')
    console.log('📋 解析结果:', params)
    console.log('✅ 验证状态:', validation.isValid ? '通过' : '失败')
    
    if (!validation.isValid) {
      if (validation.missingParams.length > 0) {
        console.warn('❌ 缺少参数:', validation.missingParams)
      }
      if (validation.errors.length > 0) {
        console.error('🚫 参数错误:', validation.errors)
      }
    }
    
    console.log('🎯 游戏类型:', getGameTypeDescription(params.game_type))
    console.log('🔗 完整URL:', getCurrentURL())
    console.groupEnd()
  }
}