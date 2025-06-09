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
  private authToken: string | null = null

  constructor(config: Partial<ApiConfig> = {}) {
    this.config = { ...defaultConfig, ...config }
    this.client = this.createAxiosInstance()
    this.setupInterceptors()
  }

  setAuthToken(token: string): void {
    this.authToken = token
  }

  clearAuthToken(): void {
    this.authToken = null
  }

  getAuthToken(): string | null {
    return this.authToken
  }

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

        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // 响应拦截器
    this.client.interceptors.response.use(
      (response: AxiosResponse<any>) => {
        // 检查业务层面的错误 - 适配骰宝API格式
        if (response.data) {
          // 检查是否有 code 字段
          if (typeof response.data.code !== 'undefined') {
            // 成功响应：code 为 200 或 1
            if (response.data.code === 200 || response.data.code === 1) {
              return response
            } 
            // 业务失败：code 不是成功状态
            else {
              const error = new Error(response.data.message || '操作失败')
              ;(error as any).code = 'BUSINESS_ERROR'
              ;(error as any).response = response
              throw error
            }
          }
        }

        return response
      },
      async (error: AxiosError) => {
        return this.handleResponseError(error)
      }
    )
  }

  private async handleResponseError(error: AxiosError): Promise<never> {
    const config = error.config as AxiosRequestConfig & { _retryCount?: number }
    
    // 401错误 - token无效，清除token
    if (error.response?.status === 401) {
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
    ;(formattedError as any).response = error.response
    ;(formattedError as any).originalError = error

    throw formattedError
  }

  private shouldRetry(error: AxiosError): boolean {
    // 网络错误
    if (!error.response) return true
    
    // 服务器错误 (5xx)
    const status = error.response.status
    return status >= 500 && status < 600
  }

  private canRetry(config?: AxiosRequestConfig & { _retryCount?: number }): boolean {
    if (!config) return false
    
    const retryCount = config._retryCount || 0
    return retryCount < this.config.retryAttempts
  }

  private async retryRequest(config: AxiosRequestConfig & { _retryCount?: number }): Promise<never> {
    config._retryCount = (config._retryCount || 0) + 1
    
    // 延迟重试
    await new Promise(resolve => 
      setTimeout(resolve, this.config.retryDelay * config._retryCount!)
    )
    
    return this.client.request(config)
  }

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

  async get<T = any>(url: string, params?: Record<string, any>): Promise<T> {
    const response = await this.client.get(url, { params })
    return response.data?.data || response.data
  }

  async post<T = any>(url: string, data?: any): Promise<T> {
    const response = await this.client.post(url, data)
    return response.data?.data || response.data
  }

  async put<T = any>(url: string, data?: any): Promise<T> {
    const response = await this.client.put(url, data)
    return response.data?.data || response.data
  }

  async delete<T = any>(url: string, params?: Record<string, any>): Promise<T> {
    const response = await this.client.delete(url, { params })
    return response.data?.data || response.data
  }

  getAxiosInstance(): AxiosInstance {
    return this.client
  }

  updateConfig(newConfig: Partial<ApiConfig>): void {
    this.config = { ...this.config, ...newConfig }
    
    if (newConfig.baseURL) {
      this.client.defaults.baseURL = newConfig.baseURL
    }
    
    if (newConfig.timeout) {
      this.client.defaults.timeout = newConfig.timeout
    }
  }

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