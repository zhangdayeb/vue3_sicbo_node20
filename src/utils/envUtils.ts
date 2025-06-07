// src/utils/envUtils.ts
// 环境变量工具类

/**
 * 安全的环境变量获取函数
 */
export const getEnvVar = (key: string, defaultValue: string = ''): string => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env[key] || defaultValue
    }
  } catch (error) {
    console.warn(`无法读取环境变量 ${key}, 使用默认值: ${defaultValue}`)
  }
  return defaultValue
}

/**
 * 获取布尔类型的环境变量
 */
export const getEnvBoolean = (key: string, defaultValue: boolean = false): boolean => {
  const value = getEnvVar(key, defaultValue.toString())
  return value === 'true' || value === '1'
}

/**
 * 获取数字类型的环境变量
 */
export const getEnvNumber = (key: string, defaultValue: number = 0): number => {
  const value = getEnvVar(key, defaultValue.toString())
  const parsed = parseInt(value, 10)
  return isNaN(parsed) ? defaultValue : parsed
}

/**
 * 检查是否为开发环境
 */
export const isDev = (): boolean => {
  try {
    return import.meta.env?.DEV === true || 
           import.meta.env?.MODE === 'development' ||
           getEnvVar('NODE_ENV') === 'development'
  } catch (error) {
    return false
  }
}

/**
 * 检查是否为生产环境
 */
export const isProd = (): boolean => {
  try {
    return import.meta.env?.PROD === true || 
           import.meta.env?.MODE === 'production' ||
           getEnvVar('NODE_ENV') === 'production'
  } catch (error) {
    return false
  }
}

/**
 * 获取当前运行模式
 */
export const getMode = (): string => {
  try {
    return import.meta.env?.MODE || getEnvVar('NODE_ENV', 'development')
  } catch (error) {
    return 'development'
  }
}

/**
 * 打印环境信息（调试用）
 */
export const logEnvInfo = (): void => {
  if (isDev()) {
    console.group('🌍 环境变量信息')
    console.log('📊 当前模式:', getMode())
    console.log('🔧 开发环境:', isDev())
    console.log('🚀 生产环境:', isProd())
    console.log('🌐 API地址:', getEnvVar('VITE_API_BASE_URL'))
    console.log('🔌 WS地址:', getEnvVar('VITE_WS_URL'))
    console.log('🎭 Mock模式:', getEnvBoolean('VITE_ENABLE_MOCK'))
    console.log('🐛 调试模式:', getEnvBoolean('VITE_DEBUG_MODE'))
    console.groupEnd()
  }
}

// 环境配置对象
export const ENV_CONFIG = {
  API_BASE_URL: getEnvVar('VITE_API_BASE_URL', 'http://localhost:3001/api'),
  WS_URL: getEnvVar('VITE_WS_URL', 'ws://localhost:3001/ws'),
  ENABLE_MOCK: getEnvBoolean('VITE_ENABLE_MOCK', true),
  ENABLE_TEST_CONSOLE: getEnvBoolean('VITE_ENABLE_TEST_CONSOLE', false),
  DEBUG_MODE: getEnvBoolean('VITE_DEBUG_MODE', isDev()),
  MODE: getMode(),
  IS_DEV: isDev(),
  IS_PROD: isProd()
} as const

// 类型导出
export type EnvConfig = typeof ENV_CONFIG