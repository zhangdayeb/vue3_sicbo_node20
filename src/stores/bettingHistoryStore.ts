// src/stores/bettingHistoryStore.ts
// 投注记录专用状态管理

import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import { getGlobalApiService } from '@/services/gameApi'
import type { 
  BettingRecord, 
  BettingHistoryParams, 
  BettingHistoryResponse,
  BettingHistoryFilter,
  BettingHistoryLoadingState,
  BettingStatistics,
  DEFAULT_FILTER,
  DEFAULT_PARAMS
} from '@/types/bettingHistory'

export const useBettingHistoryStore = defineStore('bettingHistory', () => {
  // 基础状态
  const records = ref<BettingRecord[]>([])
  const totalRecords = ref(0)
  const totalPages = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(20)
  const hasMore = ref(true)
  
  // 加载状态
  const loadingState = reactive<BettingHistoryLoadingState>({
    loading: false,
    refreshing: false,
    loadingMore: false,
    error: null
  })
  
  // 筛选条件
  const filter = reactive<BettingHistoryFilter>({
    status: 'all',
    dateRange: {
      start: null,
      end: null
    },
    betType: 'all',
    sortBy: 'bet_time',
    sortOrder: 'desc'
  })
  
  // 统计数据
  const statistics = ref<BettingStatistics | null>(null)
  
  // 缓存控制
  const cacheKey = ref('')
  const cacheExpiry = ref(0)
  const CACHE_DURATION = 5 * 60 * 1000 // 5分钟缓存
  
  // 调试模式
  const debugMode = ref(false)
  
  // 计算属性
  const isEmpty = computed(() => records.value.length === 0)
  const isLoading = computed(() => 
    loadingState.loading || loadingState.refreshing || loadingState.loadingMore
  )
  const canLoadMore = computed(() => 
    hasMore.value && !isLoading.value && !loadingState.error
  )
  
  // 格式化的记录列表（添加显示用的计算属性）
  const formattedRecords = computed(() => {
    return records.value.map(record => ({
      ...record,
      formattedBetTime: formatDateTime(record.bet_time),
      formattedSettleTime: record.settle_time ? formatDateTime(record.settle_time) : null,
      formattedNetAmount: formatAmount(record.net_amount),
      formattedTotalBet: formatAmount(record.total_bet_amount),
      formattedTotalWin: formatAmount(record.total_win_amount),
      statusText: getStatusText(record.status),
      statusColor: getStatusColor(record.status),
      isProfit: record.net_amount > 0,
      isLoss: record.net_amount < 0
    }))
  })
  
  // 统计信息计算
  const currentPageStats = computed(() => {
    const currentRecords = records.value
    if (currentRecords.length === 0) {
      return {
        totalBet: 0,
        totalWin: 0,
        netAmount: 0,
        winCount: 0,
        winRate: 0
      }
    }
    
    const totalBet = currentRecords.reduce((sum, record) => sum + record.total_bet_amount, 0)
    const totalWin = currentRecords.reduce((sum, record) => sum + record.total_win_amount, 0)
    const netAmount = currentRecords.reduce((sum, record) => sum + record.net_amount, 0)
    const winCount = currentRecords.filter(record => record.net_amount > 0).length
    const winRate = currentRecords.length > 0 ? (winCount / currentRecords.length) * 100 : 0
    
    return {
      totalBet,
      totalWin,
      netAmount,
      winCount,
      winRate: Math.round(winRate * 100) / 100
    }
  })
  
  // 调试日志
  const debugLog = (message: string, data?: any) => {
    if (debugMode.value) {
      if (data) {
        console.log(`[BettingHistoryStore] ${message}`, data)
      } else {
        console.log(`[BettingHistoryStore] ${message}`)
      }
    }
  }
  
  // 生成缓存键
  const generateCacheKey = (params: BettingHistoryParams, filter: BettingHistoryFilter): string => {
    return JSON.stringify({ params, filter })
  }
  
  // 检查缓存是否有效
  const isCacheValid = (key: string): boolean => {
    return cacheKey.value === key && Date.now() < cacheExpiry.value
  }
  
  // 构建查询参数
  const buildQueryParams = (page: number = currentPage.value): BettingHistoryParams => {
    const params: BettingHistoryParams = {
      page,
      pageSize: pageSize.value
    }
    
    // 添加筛选条件
    if (filter.status !== 'all') {
      params.status = filter.status
    }
    
    if (filter.dateRange.start) {
      params.start_date = filter.dateRange.start
    }
    
    if (filter.dateRange.end) {
      params.end_date = filter.dateRange.end
    }
    
    if (filter.betType !== 'all') {
      params.bet_type = filter.betType
    }
    
    return params
  }
  
  // 获取投注记录
  const fetchRecords = async (page: number = 1, append: boolean = false): Promise<void> => {
    try {
      const params = buildQueryParams(page)
      const key = generateCacheKey(params, filter)
      
      // 检查缓存
      if (page === 1 && !append && isCacheValid(key)) {
        debugLog('使用缓存数据')
        return
      }
      
      // 设置加载状态
      if (page === 1) {
        if (append) {
          loadingState.refreshing = true
        } else {
          loadingState.loading = true
        }
      } else {
        loadingState.loadingMore = true
      }
      
      loadingState.error = null
      
      debugLog('获取投注记录', { page, params, append })
      
      const apiService = getGlobalApiService()
      const response = await apiService.getBettingHistory(params)
      
      debugLog('投注记录响应', response)
      
      // 处理响应数据
      if (response.code === 200 || response.code === 1) {
        const { records: newRecords, pagination } = response.data
        
        if (append || page === 1) {
          // 刷新或首次加载，替换数据
          records.value = newRecords
        } else {
          // 加载更多，追加数据
          records.value = [...records.value, ...newRecords]
        }
        
        // 更新分页信息
        currentPage.value = pagination.current_page
        totalPages.value = pagination.total_pages
        totalRecords.value = pagination.total_records
        hasMore.value = pagination.has_more
        
        // 更新缓存
        if (page === 1) {
          cacheKey.value = key
          cacheExpiry.value = Date.now() + CACHE_DURATION
        }
        
        debugLog('数据更新完成', {
          recordsCount: records.value.length,
          currentPage: currentPage.value,
          hasMore: hasMore.value
        })
        
      } else {
        throw new Error(response.message || '获取投注记录失败')
      }
      
    } catch (error: any) {
      debugLog('获取投注记录失败', error)
      loadingState.error = error.message || '获取投注记录失败'
      throw error
    } finally {
      // 重置所有加载状态
      loadingState.loading = false
      loadingState.refreshing = false
      loadingState.loadingMore = false
    }
  }
  
  // 刷新数据（下拉刷新）
  const refreshRecords = async (): Promise<void> => {
    debugLog('下拉刷新投注记录')
    
    // 清除缓存
    cacheKey.value = ''
    cacheExpiry.value = 0
    
    await fetchRecords(1, true)
  }
  
  // 加载更多数据
  const loadMoreRecords = async (): Promise<void> => {
    if (!canLoadMore.value) {
      debugLog('无法加载更多数据', {
        hasMore: hasMore.value,
        isLoading: isLoading.value,
        error: loadingState.error
      })
      return
    }
    
    const nextPage = currentPage.value + 1
    debugLog('加载更多投注记录', { nextPage })
    
    await fetchRecords(nextPage, false)
  }
  
  // 应用筛选条件
  const applyFilter = async (newFilter: Partial<BettingHistoryFilter>): Promise<void> => {
    debugLog('应用筛选条件', newFilter)
    
    // 更新筛选条件
    Object.assign(filter, newFilter)
    
    // 重置分页
    currentPage.value = 1
    hasMore.value = true
    
    // 清除缓存
    cacheKey.value = ''
    cacheExpiry.value = 0
    
    // 重新获取数据
    await fetchRecords(1, false)
  }
  
  // 重置筛选条件
  const resetFilter = async (): Promise<void> => {
    debugLog('重置筛选条件')
    
    // 重置为默认值
    Object.assign(filter, {
      status: 'all',
      dateRange: { start: null, end: null },
      betType: 'all',
      sortBy: 'bet_time',
      sortOrder: 'desc'
    })
    
    await applyFilter({})
  }
  
  // 获取记录详情
  const getRecordDetail = async (recordId: string): Promise<BettingRecord | null> => {
    try {
      debugLog('获取记录详情', recordId)
      
      // 先从本地查找
      const localRecord = records.value.find(record => record.id === recordId)
      if (localRecord) {
        debugLog('从本地缓存获取记录详情')
        return localRecord
      }
      
      // 从服务器获取
      const apiService = getGlobalApiService()
      const response = await apiService.getBettingDetail(recordId)
      
      if (response.code === 200 || response.code === 1) {
        return response.data
      } else {
        throw new Error(response.message || '获取记录详情失败')
      }
      
    } catch (error: any) {
      debugLog('获取记录详情失败', error)
      loadingState.error = error.message || '获取记录详情失败'
      return null
    }
  }
  
  // 清除错误状态
  const clearError = (): void => {
    loadingState.error = null
  }
  
  // 清除所有数据
  const clearAll = (): void => {
    debugLog('清除所有数据')
    
    records.value = []
    totalRecords.value = 0
    totalPages.value = 0
    currentPage.value = 1
    hasMore.value = true
    
    loadingState.loading = false
    loadingState.refreshing = false
    loadingState.loadingMore = false
    loadingState.error = null
    
    cacheKey.value = ''
    cacheExpiry.value = 0
    
    statistics.value = null
  }
  
  // 设置页面大小
  const setPageSize = (size: number): void => {
    if (size > 0 && size <= 100) {
      pageSize.value = size
      debugLog('更新页面大小', size)
    }
  }
  
  // 切换调试模式
  const toggleDebugMode = (): void => {
    debugMode.value = !debugMode.value
    console.log(`投注记录调试模式已${debugMode.value ? '开启' : '关闭'}`)
  }
  
  // 工具函数
  const formatDateTime = (dateTime: string): string => {
    try {
      const date = new Date(dateTime)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    } catch {
      return dateTime
    }
  }
  
  const formatAmount = (amount: number): string => {
    if (amount >= 10000) {
      return `${(amount / 10000).toFixed(1)}万`
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`
    }
    return amount.toLocaleString()
  }
  
  const getStatusText = (status: string): string => {
    const statusMap: Record<string, string> = {
      pending: '待开奖',
      win: '已中奖',
      lose: '未中奖',
      cancelled: '已取消',
      processing: '处理中'
    }
    return statusMap[status] || status
  }
  
  const getStatusColor = (status: string): string => {
    const colorMap: Record<string, string> = {
      pending: '#ff9800',
      win: '#4caf50',
      lose: '#f44336',
      cancelled: '#9e9e9e',
      processing: '#2196f3'
    }
    return colorMap[status] || '#9e9e9e'
  }
  
  // 初始化
  const init = (): void => {
    debugLog('初始化投注记录Store')
    clearAll()
  }
  
  return {
    // 状态
    records,
    formattedRecords,
    totalRecords,
    totalPages,
    currentPage,
    pageSize,
    hasMore,
    loadingState,
    filter,
    statistics,
    debugMode,
    
    // 计算属性
    isEmpty,
    isLoading,
    canLoadMore,
    currentPageStats,
    
    // 方法
    fetchRecords,
    refreshRecords,
    loadMoreRecords,
    applyFilter,
    resetFilter,
    getRecordDetail,
    clearError,
    clearAll,
    setPageSize,
    toggleDebugMode,
    init,
    
    // 工具方法
    formatDateTime,
    formatAmount,
    getStatusText,
    getStatusColor
  }
})