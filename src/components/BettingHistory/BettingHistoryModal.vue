<template>
  <n-modal 
    v-model:show="visible" 
    class="betting-history-modal"
    :mask-closable="false"
    :close-on-esc="true"
    transform-origin="center"
    size="huge"
    :style="modalStyle"
  >
    <n-card 
      class="modal-card"
      :bordered="false"
      size="small"
      role="dialog"
      aria-labelledby="modal-header"
    >
      <!-- 头部 -->
      <template #header>
        <div class="modal-header" id="modal-header">
          <div class="header-left">
            <n-icon size="20" class="header-icon">
              <svg viewBox="0 0 24 24">
                <path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
              </svg>
            </n-icon>
            <span class="header-title">投注记录</span>
            <n-badge 
              v-if="!historyStore.isEmpty" 
              :value="historyStore.totalRecords" 
              :max="999"
              type="info"
              class="record-count-badge"
            />
          </div>
          <div class="header-right">
            <!-- 筛选按钮 -->
            <n-button 
              quaternary 
              circle 
              @click="showFilter = !showFilter"
              :type="hasActiveFilter ? 'primary' : 'default'"
              class="filter-btn"
            >
              <template #icon>
                <n-icon>
                  <svg viewBox="0 0 24 24">
                    <path fill="currentColor" d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/>
                  </svg>
                </n-icon>
              </template>
            </n-button>
            
            <!-- 关闭按钮 -->
            <n-button 
              quaternary 
              circle 
              @click="closeModal"
              class="close-btn"
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
        :filter="historyStore.filter"
        :loading="historyStore.isLoading"
        @apply="handleApplyFilter"
        @reset="handleResetFilter"
        class="filter-section"
      />

      <!-- 统计信息 -->
      <div v-if="!historyStore.isEmpty" class="stats-section">
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-label">总投注</div>
            <div class="stat-value bet-amount">{{ formatAmount(historyStore.currentPageStats.totalBet) }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">总中奖</div>
            <div class="stat-value win-amount">{{ formatAmount(historyStore.currentPageStats.totalWin) }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">净盈亏</div>
            <div 
              class="stat-value net-amount"
              :class="{
                'profit': historyStore.currentPageStats.netAmount > 0,
                'loss': historyStore.currentPageStats.netAmount < 0
              }"
            >
              {{ formatNetAmount(historyStore.currentPageStats.netAmount) }}
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-label">胜率</div>
            <div class="stat-value win-rate">{{ historyStore.currentPageStats.winRate }}%</div>
          </div>
        </div>
      </div>

      <!-- 记录列表 -->
      <div class="records-container">
        <!-- 加载状态 -->
        <div v-if="historyStore.loadingState.loading" class="loading-section">
          <n-spin size="medium">
            <template #description>
              <span class="loading-text">正在加载投注记录...</span>
            </template>
          </n-spin>
        </div>

        <!-- 空状态 -->
        <div v-else-if="historyStore.isEmpty && !historyStore.loadingState.error" class="empty-section">
          <n-empty 
            description="暂无投注记录" 
            size="large"
            class="empty-state"
          >
            <template #icon>
              <n-icon size="48" color="#d0d0d0">
                <svg viewBox="0 0 24 24">
                  <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </n-icon>
            </template>
            <template #extra>
              <n-button @click="handleRefresh" type="primary" ghost>
                刷新数据
              </n-button>
            </template>
          </n-empty>
        </div>

        <!-- 错误状态 -->
        <div v-else-if="historyStore.loadingState.error" class="error-section">
          <n-result 
            status="error"
            title="加载失败"
            :description="historyStore.loadingState.error"
            size="medium"
          >
            <template #footer>
              <n-space>
                <n-button @click="handleRetry" type="primary">
                  重试
                </n-button>
                <n-button @click="historyStore.clearError" quaternary>
                  忽略
                </n-button>
              </n-space>
            </template>
          </n-result>
        </div>

        <!-- 记录列表 -->
        <div v-else class="records-list">
          <!-- 下拉刷新提示 -->
          <div v-if="historyStore.loadingState.refreshing" class="refresh-indicator">
            <n-spin size="small" />
            <span class="refresh-text">正在刷新...</span>
          </div>

          <!-- 记录项 -->
          <BettingHistoryItem
            v-for="record in historyStore.formattedRecords"
            :key="record.id"
            :record="record as any"
            @detail="handleViewDetail"
            class="record-item"
          />

          <!-- 加载更多 -->
          <div class="load-more-section">
            <!-- 加载更多按钮 -->
            <n-button 
              v-if="historyStore.canLoadMore && !historyStore.loadingState.loadingMore"
              @click="handleLoadMore"
              type="primary"
              ghost
              block
              class="load-more-btn"
            >
              加载更多 ({{ historyStore.records.length }}/{{ historyStore.totalRecords }})
            </n-button>

            <!-- 加载中状态 -->
            <div v-if="historyStore.loadingState.loadingMore" class="loading-more">
              <n-spin size="small" />
              <span class="loading-more-text">正在加载更多...</span>
            </div>

            <!-- 没有更多数据 -->
            <div v-if="!historyStore.hasMore && !historyStore.isEmpty" class="no-more">
              <n-divider class="no-more-divider">
                已显示全部 {{ historyStore.totalRecords }} 条记录
              </n-divider>
            </div>
          </div>
        </div>
      </div>
    </n-card>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { 
  NModal, 
  NCard, 
  NButton, 
  NIcon, 
  NSpin, 
  NEmpty, 
  NResult, 
  NSpace, 
  NBadge,
  NDivider,
  useDialog,
  useMessage
} from 'naive-ui'
import { useBettingHistoryStore } from '@/stores/bettingHistoryStore'
import BettingHistoryItem from './BettingHistoryItem.vue'
import BettingHistoryFilter from './BettingHistoryFilter.vue'
import type { BettingHistoryFilter as FilterType, BettingRecord } from '@/types/bettingHistory'

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
const historyStore = useBettingHistoryStore()
const dialog = useDialog()
const message = useMessage()

// 响应式数据
const visible = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value)
})

const showFilter = ref(false)
const retryCount = ref(0)
const maxRetries = ref(3)

// 计算属性
const hasActiveFilter = computed(() => {
  const filter = historyStore.filter
  return filter.status !== 'all' ||
         filter.betType !== 'all' ||
         filter.dateRange.start !== null ||
         filter.dateRange.end !== null
})

const modalStyle = computed(() => ({
  width: '95vw',
  maxWidth: '800px',
  height: '90vh',
  maxHeight: '900px'
}))

// 格式化方法
const formatAmount = (amount: number): string => {
  return historyStore.formatAmount(amount)
}

const formatNetAmount = (amount: number): string => {
  const formatted = formatAmount(Math.abs(amount))
  if (amount > 0) {
    return `+${formatted}`
  } else if (amount < 0) {
    return `-${formatted}`
  }
  return formatted
}

// 事件处理
const closeModal = () => {
  visible.value = false
  emit('close')
}

const handleApplyFilter = async (filter: Partial<FilterType>) => {
  try {
    await historyStore.applyFilter(filter)
    showFilter.value = false
    message.success('筛选条件已应用')
  } catch (error: any) {
    message.error(`应用筛选失败: ${error.message}`)
  }
}

const handleResetFilter = async () => {
  try {
    await historyStore.resetFilter()
    showFilter.value = false
    message.success('筛选条件已重置')
  } catch (error: any) {
    message.error(`重置筛选失败: ${error.message}`)
  }
}

const handleRefresh = async () => {
  try {
    await historyStore.refreshRecords()
    message.success('数据已刷新')
  } catch (error: any) {
    message.error(`刷新失败: ${error.message}`)
  }
}

const handleLoadMore = async () => {
  try {
    await historyStore.loadMoreRecords()
  } catch (error: any) {
    message.error(`加载更多失败: ${error.message}`)
  }
}

const handleRetry = async () => {
  if (retryCount.value >= maxRetries.value) {
    message.warning('已达到最大重试次数')
    return
  }

  try {
    retryCount.value++
    historyStore.clearError()
    await historyStore.fetchRecords(1, false)
    message.success('重试成功')
    retryCount.value = 0
  } catch (error: any) {
    message.error(`重试失败: ${error.message}`)
  }
}

const handleViewDetail = (record: BettingRecord) => {
  dialog.info({
    title: '投注详情',
    content: () => {
      return `
        <div style="line-height: 1.6;">
          <div><strong>局号:</strong> ${record.game_number}</div>
          <div><strong>投注时间:</strong> ${historyStore.formatDateTime(record.bet_time)}</div>
          <div><strong>投注金额:</strong> ¥${record.total_bet_amount.toLocaleString()}</div>
          <div><strong>中奖金额:</strong> ¥${record.total_win_amount.toLocaleString()}</div>
          <div><strong>净盈亏:</strong> <span style="color: ${record.net_amount >= 0 ? '#4caf50' : '#f44336'}">
            ${record.net_amount >= 0 ? '+' : ''}¥${record.net_amount.toLocaleString()}
          </span></div>
          ${record.dice_results ? `<div><strong>开奖结果:</strong> ${record.dice_results.join(', ')} (总点数: ${record.dice_total})</div>` : ''}
          <div><strong>状态:</strong> ${historyStore.getStatusText(record.status)}</div>
        </div>
      `
    },
    positiveText: '确定'
  })
}

// 键盘事件处理
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && visible.value) {
    closeModal()
  }
}

// 初始化数据加载
const initializeData = async () => {
  if (!historyStore.records.length && !historyStore.loadingState.loading) {
    try {
      await historyStore.fetchRecords(1, false)
    } catch (error: any) {
      // 错误在 store 中已处理
      console.error('初始化投注记录失败:', error)
    }
  }
}

// 监听弹窗显示状态
watch(visible, async (newVisible) => {
  if (newVisible) {
    // 弹窗打开时初始化数据
    await nextTick()
    await initializeData()
    
    // 添加键盘事件监听
    document.addEventListener('keydown', handleKeydown)
  } else {
    // 弹窗关闭时清理
    document.removeEventListener('keydown', handleKeydown)
    showFilter.value = false
    retryCount.value = 0
  }
})

// 组件挂载和卸载
onMounted(() => {
  console.log('🎯 投注记录弹窗组件已挂载')
  historyStore.init()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  console.log('🎯 投注记录弹窗组件已卸载')
})

// 开发模式下暴露调试信息
if (import.meta.env.DEV) {
  (window as any).debugBettingHistoryModal = {
    store: historyStore,
    visible,
    showFilter,
    hasActiveFilter,
    initializeData,
    closeModal
  }
}
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
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0;
  color: #ffffff;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  color: #ffd700;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
}

.record-count-badge {
  margin-left: 8px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-btn, .close-btn {
  color: #ffffff;
}

.filter-section {
  margin-bottom: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.stats-section {
  margin-bottom: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 4px;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
}

.stat-value.bet-amount {
  color: #2196f3;
}

.stat-value.win-amount {
  color: #4caf50;
}

.stat-value.net-amount.profit {
  color: #4caf50;
}

.stat-value.net-amount.loss {
  color: #f44336;
}

.stat-value.win-rate {
  color: #ff9800;
}

.records-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.loading-section, .empty-section, .error-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.loading-text {
  color: rgba(255, 255, 255, 0.8);
  margin-top: 8px;
}

.empty-state {
  color: #ffffff;
}

.records-list {
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
}

.refresh-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  color: rgba(255, 255, 255, 0.8);
  background: rgba(33, 150, 243, 0.1);
  border-radius: 6px;
  margin-bottom: 12px;
}

.refresh-text {
  font-size: 14px;
}

.record-item {
  margin-bottom: 12px;
}

.load-more-section {
  margin-top: 16px;
  text-align: center;
}

.load-more-btn {
  width: 100%;
  color: #2196f3;
  border-color: #2196f3;
}

.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  color: rgba(255, 255, 255, 0.8);
}

.loading-more-text {
  font-size: 14px;
}

.no-more {
  margin-top: 16px;
}

.no-more-divider {
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
}

/* 滚动条样式 */
.records-list::-webkit-scrollbar {
  width: 6px;
}

.records-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.records-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.records-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .stat-value {
    font-size: 14px;
  }
  
  .header-title {
    font-size: 16px;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .header-left {
    gap: 6px;
  }
  
  .modal-card {
    margin: 8px;
  }
}
</style>