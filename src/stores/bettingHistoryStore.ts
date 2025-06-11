// src/stores/bettingHistoryStore.ts
import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import { getGlobalApiService } from '@/services/gameApi'
import type { 
  BettingRecord, 
  BettingHistoryParams, 
  BettingHistoryResponse
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
  const loadingState = reactive({
    loading: false,
    refreshing: false,
    loadingMore: false,
    error: null as string | null
  })
  
  // 日期筛选条件
  const dateFilter = reactive({
    start: null as string | null,
    end: null as string | null
  })
  
  // 计算属性
  const isEmpty = computed(() => records.value.length === 0)
  const isLoading = computed(() => 
    loadingState.loading || loadingState.refreshing || loadingState.loadingMore
  )
  const canLoadMore = computed(() => 
    hasMore.value && !isLoading.value && !loadingState.error
  )
  
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
    const winRate = currentRecords.length > 0 ? 
      (winCount / currentRecords.length) * 100 : 0
    
    return {
      totalBet,
      totalWin,
      netAmount,
      winCount,
      winRate: Math.round(winRate * 100) / 100
    }
  })
  
  // 构建查询参数
  const buildQueryParams = (page: number = currentPage.value): BettingHistoryParams => {
    const params: BettingHistoryParams = {
      page,
      pageSize: pageSize.value
    }
    
    // 添加日期筛选条件
    if (dateFilter.start) {
      params.start_date = dateFilter.start
    }
    
    if (dateFilter.end) {
      params.end_date = dateFilter.end
    }
    
    return params
  }
  
  // 获取投注记录
  const fetchRecords = async (page: number = 1, append: boolean = false): Promise<void> => {
    try {
      const params = buildQueryParams(page)
      
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
      
      const apiService = getGlobalApiService()
      const response = await apiService.getBettingHistory(params)
      
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
        
      } else {
        throw new Error(response.message || '获取投注记录失败')
      }
      
    } catch (error: any) {
      loadingState.error = error.message || '获取投注记录失败'
      throw error
    } finally {
      // 清理加载状态
      loadingState.loading = false
      loadingState.refreshing = false
      loadingState.loadingMore = false
    }
  }
  
  // 应用日期筛选
  const applyDateFilter = async (range: { start: string | null; end: string | null }): Promise<void> => {
    dateFilter.start = range.start
    dateFilter.end = range.end
    await fetchRecords(1, false)
  }
  
  // 重置日期筛选
  const resetDateFilter = async (): Promise<void> => {
    dateFilter.start = null
    dateFilter.end = null
    await fetchRecords(1, false)
  }
  
  // 刷新记录
  const refreshRecords = async (): Promise<void> => {
    await fetchRecords(1, true)
  }
  
  // 加载更多记录
  const loadMoreRecords = async (): Promise<void> => {
    if (canLoadMore.value) {
      await fetchRecords(currentPage.value + 1, false)
    }
  }
  
  // 清除错误
  const clearError = (): void => {
    loadingState.error = null
  }
  
  // 初始化
  const init = (): void => {
    // 重置状态
    records.value = []
    totalRecords.value = 0
    totalPages.value = 0
    currentPage.value = 1
    hasMore.value = true
    dateFilter.start = null
    dateFilter.end = null
    clearError()
  }
  
  // 获取记录详情
  const getBettingDetail = async (recordId: string): Promise<BettingRecord> => {
    try {
      const apiService = getGlobalApiService()
      const response = await apiService.getBettingDetail(recordId)
      
      if (response.code === 200 || response.code === 1) {
        return response.data
      } else {
        throw new Error(response.message || '获取投注详情失败')
      }
    } catch (error: any) {
      throw new Error(error.message || '获取投注详情失败')
    }
  }
  
  return {
    // 状态
    records,
    totalRecords,
    totalPages,
    currentPage,
    pageSize,
    hasMore,
    loadingState,
    dateFilter,
    
    // 计算属性
    isEmpty,
    isLoading,
    canLoadMore,
    currentPageStats,
    
    // 方法
    fetchRecords,
    applyDateFilter,
    resetDateFilter,
    refreshRecords,
    loadMoreRecords,
    clearError,
    init,
    getBettingDetail
  }
})