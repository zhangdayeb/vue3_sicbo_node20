// src/stores/bettingHistoryStore.ts
import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import { getGlobalApiService } from '@/services/gameApi'
import type { 
  BettingRecord, 
  BettingHistoryParams
} from '@/types/bettingHistory'

export const useBettingHistoryStore = defineStore('bettingHistory', () => {
  // 基础状态
  const records = ref<BettingRecord[]>([])
  const totalRecords = ref(0)
  const totalPages = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(20)
  const hasMore = ref(true)
  const lastFetchTime = ref<number>(0) // 🔥 新增：记录最后获取时间
  
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
  
  // 🔥 新增：判断数据是否过期
  const isDataStale = computed(() => {
    const staleThreshold = 30000 // 30秒
    return !lastFetchTime.value || (Date.now() - lastFetchTime.value > staleThreshold)
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
  
  // 获取投注记录（响应拦截器处理后的数据结构）
  const fetchRecords = async (page: number = 1, append: boolean = false): Promise<void> => {
    try {
      console.log(`🔄 Store: 获取投注记录 - 页码: ${page}, 追加: ${append}`)
      
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
      
      console.log('📥 Store: API 响应完整信息:', {
        response,
        recordsLength: response.records?.length || 0,
        hasPagination: !!response.pagination
      })
      
      // 响应拦截器已处理，直接解构数据（不再有 code 和 data）
      const { records: newRecords = [], pagination = null } = response
      
      console.log('✅ Store: 解析后的记录数量:', newRecords.length)
      console.log('📊 Store: 分页信息:', pagination)
      
      // 数据清洗和映射
      const cleanedRecords: BettingRecord[] = newRecords.map((record: any, index: number) => {
        return {
          id: record.id || record.ID || `${Date.now()}-${index}`,
          game_number: record.game_number || record.gameNumber || `G${Date.now()}`,
          table_id: record.table_id || record.tableId || '1',
          user_id: record.user_id || record.userId || '1',
          bet_time: record.bet_time || record.betTime || new Date().toISOString(),
          settle_time: record.settle_time || record.settleTime,
          
          bet_details: Array.isArray(record.bet_details) ? record.bet_details : 
                      Array.isArray(record.betDetails) ? record.betDetails : [],
          total_bet_amount: Number(record.total_bet_amount || record.totalBetAmount || 0),
          total_win_amount: Number(record.total_win_amount || record.totalWinAmount || 0),
          net_amount: Number(record.net_amount || record.netAmount || 
            (Number(record.total_win_amount || record.totalWinAmount || 0) - 
             Number(record.total_bet_amount || record.totalBetAmount || 0))),
          
          dice_results: Array.isArray(record.dice_results) ? record.dice_results as [number, number, number] :
                       Array.isArray(record.diceResults) ? record.diceResults as [number, number, number] : 
                       undefined,
          dice_total: record.dice_total || record.diceTotal || undefined,
          
          status: record.status || 'pending',
          is_settled: Boolean(record.is_settled || record.isSettled || false),
          
          currency: record.currency || 'CNY'
        } as BettingRecord
      })
      
      // 更新记录
      if (append && page > 1) {
        // 加载更多，追加数据
        records.value = [...records.value, ...cleanedRecords]
        console.log('➕ Store: 追加数据，总记录数量:', records.value.length)
      } else {
        // 刷新或首次加载，替换数据
        records.value = cleanedRecords
        console.log('🔄 Store: 替换数据，新记录数量:', cleanedRecords.length)
      }
      
      // 更新分页信息
      currentPage.value = pagination?.current_page || page
      totalPages.value = pagination?.total_pages || Math.ceil(records.value.length / pageSize.value)
      totalRecords.value = pagination?.total_records || records.value.length
      hasMore.value = pagination?.has_more || false
      
      // 🔥 新增：更新最后获取时间
      lastFetchTime.value = Date.now()
      
      console.log(`✅ Store: 数据加载完成`, {
        totalRecords: records.value.length,
        currentPage: currentPage.value,
        hasMore: hasMore.value,
        lastFetchTime: lastFetchTime.value
      })
      
    } catch (error: any) {
      console.error('❌ Store: 获取投注记录失败:', error)
      loadingState.error = error.message || '获取投注记录失败'
      throw error
    } finally {
      // 清理加载状态
      loadingState.loading = false
      loadingState.refreshing = false
      loadingState.loadingMore = false
    }
  }
  
  // 🔥 新增：强制刷新数据（用于点击按钮时同步获取最新数据）
  const forceRefresh = async (): Promise<void> => {
    try {
      console.log('🚀 Store: 强制刷新投注记录数据')
      loadingState.loading = true
      loadingState.error = null
      
      // 重置状态
      records.value = []
      currentPage.value = 1
      hasMore.value = true
      lastFetchTime.value = 0
      
      // 获取最新数据
      await fetchRecords(1, false)
      
      console.log('✅ Store: 强制刷新完成')
      
    } catch (error: any) {
      console.error('❌ Store: 强制刷新失败:', error)
      loadingState.error = error.message || '刷新数据失败'
      throw error
    } finally {
      loadingState.loading = false
    }
  }
  
  // 🔥 新增：标记数据过期（用于WebSocket事件触发）
  const markDataStale = (): void => {
    lastFetchTime.value = 0
    console.log('📝 Store: 数据已标记为过期')
  }
  
  // 应用日期筛选
  const applyDateFilter = async (range: { start: string | null; end: string | null }): Promise<void> => {
    console.log('🔍 Store: 应用日期筛选:', range)
    dateFilter.start = range.start
    dateFilter.end = range.end
    await fetchRecords(1, false)
  }
  
  // 重置日期筛选
  const resetDateFilter = async (): Promise<void> => {
    console.log('🔄 Store: 重置日期筛选')
    dateFilter.start = null
    dateFilter.end = null
    await fetchRecords(1, false)
  }
  
  // 刷新记录
  const refreshRecords = async (): Promise<void> => {
    console.log('🔄 Store: 刷新记录')
    await fetchRecords(1, true)  // append: true 表示刷新
  }
  
  // 加载更多记录
  const loadMoreRecords = async (): Promise<void> => {
    if (canLoadMore.value) {
      console.log('📄 Store: 加载更多记录')
      await fetchRecords(currentPage.value + 1, true)
    }
  }
  
  // 清除错误
  const clearError = (): void => {
    loadingState.error = null
  }
  
  // 初始化函数 - 重置状态 + 获取数据
  const init = async (): Promise<void> => {
    console.log('🚀 Store: 初始化投注记录')
    
    // 1. 重置状态
    records.value = []
    totalRecords.value = 0
    totalPages.value = 0
    currentPage.value = 1
    hasMore.value = true
    lastFetchTime.value = 0
    dateFilter.start = null
    dateFilter.end = null
    clearError()
    
    console.log('🔄 Store: 状态已重置')
    
    // 2. 获取初始数据
    try {
      console.log('📡 Store: 开始获取初始数据')
      await fetchRecords(1, false)
      console.log('✅ Store: 投注记录初始化完成')
    } catch (error) {
      console.error('❌ Store: 投注记录初始化失败:', error)
      // 不抛出错误，让组件能正常打开，只是显示错误状态
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
    lastFetchTime, // 🔥 新增
    loadingState,
    dateFilter,
    
    // 计算属性
    isEmpty,
    isLoading,
    canLoadMore,
    isDataStale, // 🔥 新增
    currentPageStats,
    
    // 方法
    fetchRecords,
    forceRefresh, // 🔥 新增：替代之前的 refreshData
    markDataStale, // 🔥 新增
    applyDateFilter,
    resetDateFilter,
    refreshRecords,
    loadMoreRecords,
    clearError,
    init
  }
})