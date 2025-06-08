// src/services/httpClient.ts
import axios, { 
  AxiosInstance, 
  AxiosRequestConfig, 
  AxiosResponse, 
  AxiosError 
} from 'axios'
import type { ApiResponse, ApiConfig } from '@/types/api'

// 安全的环境变量获取函数
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  try {
    return import.meta.env[key] || defaultValue
  } catch (error) {
    console.warn(`无法读取环境变量 ${key}, 使用默认值: ${defaultValue}`)
    return defaultValue
  }
}

// 检查是否为开发环境
const isDev = (): boolean => {
  try {
    return import.meta.env.DEV === true || import.meta.env.MODE === 'development'
  } catch (error) {
    return false
  }
}

// 默认配置
const defaultConfig: ApiConfig = {
  baseURL: getEnvVar('VITE_API_BASE_URL', 'https://sicboapi.wuming888.com'),
  wsURL: getEnvVar('VITE_WS_URL', 'wss://wsssicbo.wuming888.com'),
  timeout: 10000,
  retryAttempts: 3,
  retryDelay: 1000
}

export class HttpClient {
  private client: AxiosInstance
  private config: ApiConfig
  private authToken: string | null = null // 存储token

  constructor(config: Partial<ApiConfig> = {}) {
    this.config = { ...defaultConfig, ...config }
    this.client = this.createAxiosInstance()
    this.setupInterceptors()
  }

  /**
   * 设置认证Token
   */
  setAuthToken(token: string): void {
    this.authToken = token
    console.log('🔑 Token已设置')
  }

  /**
   * 清除认证Token
   */
  clearAuthToken(): void {
    this.authToken = null
    console.log('🔑 Token已清除')
  }

  /**
   * 获取当前Token
   */
  getAuthToken(): string | null {
    return this.authToken
  }

  /**
   * 创建Axios实例
   */
  private createAxiosInstance(): AxiosInstance {
    return axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })
  }

  /**
   * 设置请求和响应拦截器
   */
  private setupInterceptors(): void {
    // 请求拦截器
    this.client.interceptors.request.use(
      (config) => {
        // 自动添加x-csrf-token
        if (this.authToken && !config.headers['x-csrf-token']) {
          config.headers['x-csrf-token'] = this.authToken
        }

        // 添加时间戳防止缓存
        if (config.method === 'get') {
          config.params = {
            ...config.params,
            _t: Date.now()
          }
        }

        // 记录请求日志（开发环境）
        if (isDev()) {
          console.log('🚀 HTTP请求:', {
            url: config.url,
            method: config.method?.toUpperCase(),
            params: config.params,
            data: config.data,
            hasToken: !!config.headers['x-csrf-token']
          })
        }

        return config
      },
      (error) => {
        console.error('❌ 请求拦截器错误:', error)
        return Promise.reject(error)
      }
    )

    // 响应拦截器
    this.client.interceptors.response.use(
      (response: AxiosResponse<any>) => {
        // 记录响应日志（开发环境）
        if (isDev()) {
          console.log('✅ HTTP响应:', {
            url: response.config.url,
            status: response.status,
            data: response.data
          })
        }

        // 检查业务层面的错误 - 适配骰宝API格式
        if (response.data) {
          // 骰宝API成功响应格式: { code: 200, message: "ok！", data: {...} }
          if (response.data.code === 200 || response.data.code === 1) {
            // 成功响应，直接返回
            return response
          } else if (response.data.code === 0) {
            // 业务失败
            const error = new Error(response.data.message || '操作失败')
            ;(error as any).code = 'BUSINESS_ERROR'
            throw error
          }
        }

        return response
      },
      async (error: AxiosError) => {
        return this.handleResponseError(error)
      }
    )
  }

  /**
   * 处理响应错误
   */
  private async handleResponseError(error: AxiosError): Promise<never> {
    const config = error.config as AxiosRequestConfig & { _retryCount?: number }
    
    // 记录错误日志
    console.error('❌ HTTP错误:', {
      url: config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    })

    // 401错误 - token无效，清除token
    if (error.response?.status === 401) {
      console.warn('🔑 Token无效，已清除')
      this.clearAuthToken()
    }

    // 网络错误或超时，尝试重试
    if (this.shouldRetry(error) && this.canRetry(config)) {
      return this.retryRequest(config)
    }

    // 根据状态码处理不同错误
    const statusCode = error.response?.status
    const errorMessage = this.getErrorMessage(statusCode, error)

    // 抛出格式化的错误
    const formattedError = new Error(errorMessage)
    ;(formattedError as any).code = this.getErrorCode(statusCode)
    ;(formattedError as any).statusCode = statusCode
    ;(formattedError as any).originalError = error

    throw formattedError
  }

  /**
   * 判断是否应该重试
   */
  private shouldRetry(error: AxiosError): boolean {
    // 网络错误
    if (!error.response) return true
    
    // 服务器错误 (5xx)
    const status = error.response.status
    return status >= 500 && status < 600
  }

  /**
   * 判断是否可以重试
   */
  private canRetry(config?: AxiosRequestConfig & { _retryCount?: number }): boolean {
    if (!config) return false
    
    const retryCount = config._retryCount || 0
    return retryCount < this.config.retryAttempts
  }

  /**
   * 重试请求
   */
  private async retryRequest(config: AxiosRequestConfig & { _retryCount?: number }): Promise<never> {
    config._retryCount = (config._retryCount || 0) + 1
    
    // 延迟重试
    await new Promise(resolve => 
      setTimeout(resolve, this.config.retryDelay * config._retryCount!)
    )

    console.log(`🔄 重试请求 (${config._retryCount}/${this.config.retryAttempts}):`, config.url)
    
    return this.client.request(config)
  }

  /**
   * 获取错误消息
   */
  private getErrorMessage(statusCode?: number, error?: AxiosError): string {
    if (!statusCode) {
      return '网络连接失败，请检查网络状态'
    }

    const errorMessages: Record<number, string> = {
      400: '请求参数错误',
      401: '认证失败，请重新登录',
      403: '权限不足',
      404: '请求的资源不存在',
      408: '请求超时',
      429: '请求过于频繁，请稍后再试',
      500: '服务器内部错误',
      502: '网关错误',
      503: '服务暂时不可用',
      504: '网关超时'
    }

    return errorMessages[statusCode] || `请求失败 (${statusCode})`
  }

  /**
   * 获取错误代码
   */
  private getErrorCode(statusCode?: number): string {
    if (!statusCode) return 'NETWORK_ERROR'

    const errorCodes: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      408: 'TIMEOUT',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_SERVER_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
      504: 'GATEWAY_TIMEOUT'
    }

    return errorCodes[statusCode] || 'HTTP_ERROR'
  }

  /**
   * GET请求
   */
  async get<T = any>(url: string, params?: Record<string, any>): Promise<T> {
    const response = await this.client.get(url, { params })
    // 骰宝API返回格式: { code: 200, data: {...} }
    return response.data?.data || response.data
  }

  /**
   * POST请求
   */
  async post<T = any>(url: string, data?: any): Promise<T> {
    const response = await this.client.post(url, data)
    // 骰宝API返回格式: { code: 200, data: {...} }
    return response.data?.data || response.data
  }

  /**
   * PUT请求
   */
  async put<T = any>(url: string, data?: any): Promise<T> {
    const response = await this.client.put(url, data)
    return response.data?.data || response.data
  }

  /**
   * DELETE请求
   */
  async delete<T = any>(url: string, params?: Record<string, any>): Promise<T> {
    const response = await this.client.delete(url, { params })
    return response.data?.data || response.data
  }

  /**
   * 获取原始Axios实例（用于特殊需求）
   */
  getAxiosInstance(): AxiosInstance {
    return this.client
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<ApiConfig>): void {
    this.config = { ...this.config, ...newConfig }
    
    // 更新baseURL
    if (newConfig.baseURL) {
      this.client.defaults.baseURL = newConfig.baseURL
    }
    
    // 更新超时时间
    if (newConfig.timeout) {
      this.client.defaults.timeout = newConfig.timeout
    }
  }

  /**
   * 获取当前配置
   */
  getConfig(): ApiConfig {
    return { ...this.config }
  }
}

// 创建默认实例
export const httpClient = new HttpClient()

// 导出常用方法
export const setAuthToken = (token: string) => httpClient.setAuthToken(token)
export const clearAuthToken = () => httpClient.clearAuthToken()
export const getAuthToken = () => httpClient.getAuthToken()

// 导出请求方法
export const { get, post, put, delete: del } = httpClient