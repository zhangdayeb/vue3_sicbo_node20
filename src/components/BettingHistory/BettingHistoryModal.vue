<template>
  <n-modal
    v-model:show="visible"
    :style="modalStyle"
    :mask-closable="true"
    :close-on-esc="true"
    class="betting-history-modal"
    @close="handleModalClose"
  >
    <n-card class="modal-card" title="投注记录" :bordered="false">
      <template #header>
        <div class="modal-header">
          <div class="header-left">
            <h3 class="modal-title">投注记录</h3>
          </div>
          <div class="header-right">
            <!-- 筛选按钮 -->
            <n-button 
              quaternary 
              circle 
              @click="toggleFilter"
              :type="hasActiveFilter ? 'primary' : 'default'"
              class="action-btn filter-btn"
              title="筛选"
            >
              <template #icon>
                <n-icon>
                  <svg viewBox="0 0 24 24">
                    <path fill="currentColor" d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/>
                  </svg>
                </n-icon>
              </template>
            </n-button>
            
            <!-- 刷新按钮 -->
            <n-button 
              quaternary 
              circle 
              @click="handleRefresh"
              :loading="isLoading"
              class="action-btn refresh-btn"
              title="刷新"
            >
              <template #icon>
                <n-icon>
                  <svg viewBox="0 0 24 24">
                    <path fill="currentColor" d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                  </svg>
                </n-icon>
              </template>
            </n-button>
            
            <!-- 关闭按钮 -->
            <n-button 
              quaternary 
              circle 
              @click="handleClose"
              class="action-btn close-btn"
              title="关闭"
            >
              <template #icon>
                <n-icon>
                  <svg viewBox="0 0 24 24">
                    <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                </n-icon>
              </template>
            </n-button>
          </div>
        </div>
      </template>

      <!-- 筛选区域 -->
      <BettingHistoryFilter 
        v-if="showFilter"
        :loading="isLoading"
        @apply="handleApplyFilter"
        @reset="handleResetFilter"
        class="filter-section"
      />

      <!-- 记录列表 -->
      <div class="records-section">
        <!-- 加载中 -->
        <div v-if="isLoading && allRecords.length === 0" class="loading-container">
          <n-spin size="large">
            <template #description>
              正在加载投注记录...
            </template>
          </n-spin>
        </div>

        <!-- 错误状态 -->
        <div v-else-if="error" class="error-container">
          <n-result status="error" title="加载失败" :description="error">
            <template #footer>
              <n-space>
                <n-button @click="handleRetry" type="primary" class="action-button">重试</n-button>
                <n-button @click="handleClose" quaternary class="action-button">关闭</n-button>
              </n-space>
            </template>
          </n-result>
        </div>

        <!-- 空状态 -->
        <div v-else-if="isEmpty" class="empty-container">
          <n-empty description="暂无投注记录" size="large">
            <template #icon>
              <n-icon size="48" color="#666">
                <svg viewBox="0 0 24 24">
                  <path fill="currentColor" d="M9 11h6v2H9v-2zm0-4h6v2H9V7zm0 8h6v2H9v-2z"/>
                </svg>
              </n-icon>
            </template>
            <template #extra>
              <n-space>
                <n-button @click="handleRefresh" type="primary" ghost class="action-button">刷新数据</n-button>
                <n-button @click="handleClose" quaternary class="action-button">关闭</n-button>
              </n-space>
            </template>
          </n-empty>
        </div>

        <!-- 记录内容 -->
        <div v-else class="records-list">
          <div class="records-container">
            <!-- 🔥 修复：确保记录正确显示 -->
            <BettingHistoryItem
              v-for="record in displayRecords"
              :key="record.id"
              :record="record"
              :expandable="true"
              :show-actions="false"
              :clickable="true"
              @click="handleRecordClick"
              class="record-item"
            />
          </div>
          
          <!-- 分页控制 -->
          <div class="pagination-section">
            <!-- 加载更多 -->
            <div v-if="canLoadMore" class="load-more-container">
              <n-button 
                block 
                @click="handleLoadMore"
                :loading="loadingMore"
                class="load-more-btn action-button"
                size="large"
              >
                {{ loadingMore ? '加载中...' : '加载更多' }}
              </n-button>
            </div>

            <!-- 分页信息 -->
            <div class="pagination-info">
              <n-space justify="center" align="center">
                <span class="page-text">第 {{ currentPage }} 页，共 {{ totalRecords }} 条记录</span>
              </n-space>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部操作区 -->
      <template #action>
        <div class="modal-footer">
          <n-space justify="space-between" align="center">
            <span class="stats-text" v-if="!isEmpty">
              已显示 {{ displayRecords.length }} 条记录
            </span>
            <span v-else></span>
            <n-button @click="handleClose" type="primary" class="action-button close-button">
              关闭
            </n-button>
          </n-space>
        </div>
      </template>
    </n-card>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { 
  NModal, 
  NCard, 
  NButton, 
  NIcon, 
  NSpin, 
  NEmpty, 
  NResult,
  NDivider,
  NSpace,
  useMessage
} from 'naive-ui'
import BettingHistoryItem from './BettingHistoryItem.vue'
import BettingHistoryFilter from './BettingHistoryFilter.vue'
import { getGlobalApiService } from '@/services/gameApi'
import type { BettingRecord } from '@/types/bettingHistory'

// 🔥 修改：响应拦截器处理后的数据结构
interface BettingHistoryResponse {
  records: BettingRecord[]
  pagination: {
    current_page: number
    total_pages: number
    total_records: number
    page_size: number
    has_more: boolean
  }
}

// Props
interface Props {
  show: boolean
}

const props = withDefaults(defineProps<Props>(), {
  show: false
})

// Emits
const emit = defineEmits<{
  'update:show': [value: boolean]
  'close': []
}>()

// 组合式函数
const message = useMessage()

// 🔥 响应式数据 - 确保关闭功能正常
const visible = computed({
  get: () => {
    console.log('🎯 visible get:', props.show)
    return props.show
  },
  set: (value) => {
    console.log('🎯 visible set:', value)
    emit('update:show', value)
    if (!value) {
      emit('close')
    }
  }
})

const showFilter = ref(false)
const isLoading = ref(false)
const loadingMore = ref(false)
const error = ref<string | null>(null)

// 数据状态
const allRecords = ref<BettingRecord[]>([])
const totalRecords = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const hasMore = ref(true)

// 日期筛选
const dateFilter = ref({
  start: null as string | null,
  end: null as string | null
})

// 计算属性
const hasActiveFilter = computed(() => {
  return dateFilter.value.start !== null || dateFilter.value.end !== null
})

const modalStyle = computed(() => ({
  width: '95vw',
  maxWidth: '800px',
  height: '90vh',
  maxHeight: '900px'
}))

// 🔥 修复：添加详细的调试日志
const filteredRecords = computed(() => {
  console.log('🔍 filteredRecords 计算开始:', {
    allRecordsLength: allRecords.value.length,
    dateFilterStart: dateFilter.value.start,
    dateFilterEnd: dateFilter.value.end
  })
  
  let records = [...allRecords.value]
  
  if (dateFilter.value.start || dateFilter.value.end) {
    records = records.filter(record => {
      const recordDate = new Date(record.bet_time).toISOString().split('T')[0]
      
      if (dateFilter.value.start && recordDate < dateFilter.value.start) {
        return false
      }
      
      if (dateFilter.value.end && recordDate > dateFilter.value.end) {
        return false
      }
      
      return true
    })
    console.log('🔍 应用日期筛选后记录数量:', records.length)
  }
  
  console.log('🎯 filteredRecords 最终结果:', records.length)
  return records
})

const displayRecords = computed(() => {
  console.log('🎯 displayRecords 计算:', {
    filteredRecordsLength: filteredRecords.value.length,
    isLoading: isLoading.value,
    error: error.value
  })
  return filteredRecords.value
})

const isEmpty = computed(() => {
  const result = displayRecords.value.length === 0 && !isLoading.value && !error.value
  console.log('🎯 isEmpty 计算:', {
    displayRecordsLength: displayRecords.value.length,
    isLoading: isLoading.value,
    error: error.value,
    result
  })
  return result
})

const canLoadMore = computed(() => {
  return hasMore.value && !isLoading.value && !loadingMore.value && !error.value
})

// 🔥 关闭相关方法 - 多重保险
const handleClose = () => {
  console.log('🔴 handleClose 调用')
  try {
    showFilter.value = false
    visible.value = false
  } catch (err) {
    console.error('关闭弹窗时出错:', err)
    // 强制触发关闭
    emit('update:show', false)
    emit('close')
  }
}

const handleModalClose = () => {
  console.log('🔴 handleModalClose 调用')
  handleClose()
}

const toggleFilter = () => {
  showFilter.value = !showFilter.value
}

// 🔥 修复：API 调用函数
const fetchRecords = async (page: number = 1, append: boolean = false) => {
  try {
    console.log(`🔄 获取投注记录 - 页码: ${page}, 追加: ${append}`)
    
    if (page === 1) {
      isLoading.value = true
    } else {
      loadingMore.value = true
    }
    
    error.value = null
    
    const apiService = getGlobalApiService()
    const params = {
      page,
      pageSize: pageSize.value,
      ...(dateFilter.value.start && { start_date: dateFilter.value.start }),
      ...(dateFilter.value.end && { end_date: dateFilter.value.end })
    }
    
    console.log('📤 API 请求参数:', params)
    
    const response: BettingHistoryResponse = await apiService.getBettingHistory(params)
    
    // 🔥 修正：响应拦截器已处理，直接解析业务数据
    console.log('📥 API 响应完整信息:', {
      response,
      recordsLength: response.records?.length || 0,
      hasPagination: !!response.pagination
    })
    
    // 🔥 直接从 response 获取数据（不需要 .data）
    const { records = [], pagination = null } = response
    
    console.log('✅ 解析后的记录数量:', records.length)
    console.log('📊 分页信息:', pagination)
    
    // 🔥 修复：数据清洗和映射
    const cleanedRecords: BettingRecord[] = records.map((record: any, index: number) => {
      // 🔥 修复：使用API实际字段名称
      const cleanedRecord: BettingRecord = {
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
      }
            
      return cleanedRecord
    })
    
    // 更新记录
    if (page === 1 || !append) {
      allRecords.value = cleanedRecords
      console.log('🔄 替换数据，新记录数量:', cleanedRecords.length)
    } else {
      allRecords.value = [...allRecords.value, ...cleanedRecords]
      console.log('➕ 追加数据，总记录数量:', allRecords.value.length)
    }
    
    // 更新分页信息
    currentPage.value = pagination?.current_page || page
    totalRecords.value = pagination?.total_records || cleanedRecords.length
    hasMore.value = pagination?.has_more || false
    
    console.log(`✅ 数据加载完成 - 总记录: ${allRecords.value.length}`)
    console.log('🎯 最终状态:', {
      allRecordsLength: allRecords.value.length,
      totalRecords: totalRecords.value,
      currentPage: currentPage.value,
      hasMore: hasMore.value
    })
    
  } catch (err: any) {
    console.error('❌ 获取投注记录失败:', err)
    const errorMsg = err.message || '获取投注记录失败'
    error.value = errorMsg
    message.error(`获取数据失败: ${errorMsg}`)
  } finally {
    isLoading.value = false
    loadingMore.value = false
  }
}

// 事件处理
const handleApplyFilter = async (dateRange: { start: string | null; end: string | null }) => {
  try {
    console.log('🔍 应用日期筛选:', dateRange)
    dateFilter.value = { ...dateRange }
    currentPage.value = 1
    hasMore.value = true
    await fetchRecords(1, false)
    showFilter.value = false
    message.success('日期筛选已应用')
  } catch (error: any) {
    message.error(`应用筛选失败: ${error.message}`)
  }
}

const handleResetFilter = async () => {
  try {
    console.log('🔄 重置筛选条件')
    dateFilter.value = { start: null, end: null }
    currentPage.value = 1
    hasMore.value = true
    await fetchRecords(1, false)
    showFilter.value = false
    message.success('筛选条件已重置')
  } catch (error: any) {
    message.error(`重置失败: ${error.message}`)
  }
}

const handleRefresh = async () => {
  try {
    console.log('🔄 刷新投注记录')
    currentPage.value = 1
    hasMore.value = true
    await fetchRecords(1, false)
    message.success('数据已刷新')
  } catch (error: any) {
    message.error(`刷新失败: ${error.message}`)
  }
}

const handleLoadMore = async () => {
  if (!canLoadMore.value) return
  
  try {
    console.log('📄 加载更多记录')
    await fetchRecords(currentPage.value + 1, true)
  } catch (error: any) {
    message.error(`加载更多失败: ${error.message}`)
  }
}

const handleRetry = async () => {
  try {
    console.log('🔄 重试加载数据')
    error.value = null
    currentPage.value = 1
    hasMore.value = true
    await fetchRecords(1, false)
  } catch (error: any) {
    console.error('重试失败:', error)
  }
}

const handleRecordClick = (record: BettingRecord) => {
  console.log('🎯 点击记录:', record.game_number)
}

// 初始化数据
const initializeData = async () => {
  console.log('🚀 初始化数据开始')
  if (allRecords.value.length === 0 && !isLoading.value) {
    try {
      await fetchRecords(1, false)
    } catch (error: any) {
      console.error('初始化数据失败:', error)
    }
  } else {
    console.log('ℹ️ 数据已存在，跳过初始化')
  }
}

// 监听弹窗显示状态
watch(visible, async (newVisible) => {
  console.log('🎯 visible 变化:', newVisible)
  if (newVisible) {
    console.log('🎯 投注记录弹窗打开')
    await nextTick()
    await initializeData()
  } else {
    console.log('🎯 投注记录弹窗关闭')
    showFilter.value = false
  }
})


// 组件挂载
onMounted(() => {
  console.log('🚀 BettingHistoryModal 组件挂载完成')
})
</script>

<style scoped>
.betting-history-modal {
  /* 弹窗基础样式 */
}

.modal-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #1a1a1a;
  color: #ffffff;
  border-radius: 12px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 4px;
}

.header-left {
  flex: 1;
}

.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 🔥 优化：统一的按钮样式 */
.action-btn {
  width: 36px !important;
  height: 36px !important;
  border-radius: 8px !important;
  transition: all 0.3s ease !important;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}

.action-btn:hover {
  transform: translateY(-2px) scale(1.05) !important;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3) !important;
}

.filter-btn {
  background: rgba(24, 144, 255, 0.1) !important;
  color: #1890ff !important;
}

.filter-btn:hover {
  background: rgba(24, 144, 255, 0.2) !important;
  box-shadow: 0 8px 25px rgba(24, 144, 255, 0.4) !important;
}

.refresh-btn {
  background: rgba(82, 196, 26, 0.1) !important;
  color: #52c41a !important;
}

.refresh-btn:hover {
  background: rgba(82, 196, 26, 0.2) !important;
  box-shadow: 0 8px 25px rgba(82, 196, 26, 0.4) !important;
}

.close-btn {
  background: rgba(255, 77, 79, 0.1) !important;
  color: #ff4d4f !important;
}

.close-btn:hover {
  background: rgba(255, 77, 79, 0.2) !important;
  box-shadow: 0 8px 25px rgba(255, 77, 79, 0.4) !important;
}

.filter-section {
  margin-bottom: 16px;
}

.records-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.loading-container,
.empty-container,
.error-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.records-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.records-container {
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
  max-height: calc(90vh - 280px);
}

.record-item {
  margin-bottom: 12px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.record-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

.record-item:last-child {
  margin-bottom: 0;
}

/* 🔥 优化：分页区域样式 */
.pagination-section {
  margin-top: 16px;
  padding: 16px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.load-more-container {
  margin-bottom: 12px;
}

.pagination-info {
  text-align: center;
}

.page-text {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
}

/* 🔥 优化：通用按钮样式 */
.action-button {
  height: 40px !important;
  padding: 0 20px !important;
  border-radius: 8px !important;
  font-weight: 500 !important;
  transition: all 0.3s ease !important;
  backdrop-filter: blur(8px) !important;
}

.action-button:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3) !important;
}

.load-more-btn {
  background: linear-gradient(135deg, #1890ff, #722ed1) !important;
  border: none !important;
  color: white !important;
  font-size: 16px !important;
}

.load-more-btn:hover {
  background: linear-gradient(135deg, #40a9ff, #9254de) !important;
  box-shadow: 0 8px 25px rgba(24, 144, 255, 0.5) !important;
}

.close-button {
  background: linear-gradient(135deg, #ff4d4f, #ff7875) !important;
  border: none !important;
  min-width: 100px !important;
}

.close-button:hover {
  background: linear-gradient(135deg, #ff7875, #ffa39e) !important;
  box-shadow: 0 8px 25px rgba(255, 77, 79, 0.5) !important;
}

/* 🔥 优化：底部样式 */
.modal-footer {
  padding: 16px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.02);
}

.stats-text {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
}

/* 滚动条样式 */
.records-container::-webkit-scrollbar {
  width: 8px;
}

.records-container::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.records-container::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #1890ff, #722ed1);
  border-radius: 4px;
}

.records-container::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #40a9ff, #9254de);
}

/* 响应式适配 */
@media (max-width: 768px) {
  .modal-card {
    height: 95vh;
  }
  
  .action-btn {
    width: 32px !important;
    height: 32px !important;
  }
  
  .header-right {
    gap: 6px;
  }
  
  .records-container {
    max-height: calc(95vh - 360px);
  }
}
</style>