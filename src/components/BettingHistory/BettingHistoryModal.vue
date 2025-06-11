<template>
  <n-modal
    v-model:show="visible"
    :style="modalStyle"
    :mask-closable="false"
    :close-on-esc="true"
    class="betting-history-modal"
  >
    <n-card class="modal-card" :title="null" :bordered="false">
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
            
            <!-- 刷新按钮 -->
            <n-button 
              quaternary 
              circle 
              @click="handleRefresh"
              :loading="historyStore.isLoading"
              class="refresh-btn"
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
              :class="{ 'profit': historyStore.currentPageStats.netAmount > 0, 'loss': historyStore.currentPageStats.netAmount < 0 }"
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
      <div class="records-section">
        <!-- 加载中 -->
        <div v-if="historyStore.loadingState.loading" class="loading-container">
          <n-spin size="large">
            <template #description>
              正在加载投注记录...
            </template>
          </n-spin>
        </div>

        <!-- 空状态 -->
        <div v-else-if="historyStore.isEmpty" class="empty-container">
          <n-empty description="暂无投注记录" size="large">
            <template #icon>
              <n-icon size="48">
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
        <div v-else-if="historyStore.loadingState.error" class="error-container">
          <n-result status="error" title="加载失败" :description="historyStore.loadingState.error">
            <template #footer>
              <n-space>
                <n-button @click="handleRetry" type="primary">
                  重试
                </n-button>
                <n-button @click="closeModal" quaternary>
                  关闭
                </n-button>
              </n-space>
            </template>
          </n-result>
        </div>

        <!-- 记录列表 -->
        <div v-else class="records-list">
          <div class="records-container">
            <BettingHistoryItem
              v-for="record in historyStore.records"
              :key="record.id"
              :record="record"
              @view-detail="handleViewDetail"
              @rebet="handleRebet"
              class="record-item"
            />
          </div>

          <!-- 加载更多 -->
          <div v-if="historyStore.canLoadMore" class="load-more-container">
            <n-button 
              @click="handleLoadMore"
              :loading="historyStore.loadingState.loadingMore"
              block
              size="large"
              quaternary
            >
              {{ historyStore.loadingState.loadingMore ? '加载中...' : '加载更多' }}
            </n-button>
          </div>

          <!-- 数据统计 -->
          <div class="records-footer">
            <n-divider>
              共 {{ historyStore.totalRecords }} 条记录
            </n-divider>
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
  NDivider,
  useDialog,
  useMessage
} from 'naive-ui'
import { useBettingHistoryStore } from '@/stores/bettingHistoryStore'
import BettingHistoryItem from './BettingHistoryItem.vue'
import BettingHistoryFilter from './BettingHistoryFilter.vue'
import type { BettingRecord } from '@/types/bettingHistory'

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

// 计算属性
const hasActiveFilter = computed(() => {
  return historyStore.dateFilter.start !== null ||
         historyStore.dateFilter.end !== null
})

const modalStyle = computed(() => ({
  width: '95vw',
  maxWidth: '800px',
  height: '90vh',
  maxHeight: '900px'
}))

// 格式化方法
const formatAmount = (amount: number): string => {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
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

const handleApplyFilter = async (dateRange: { start: string | null; end: string | null }) => {
  try {
    await historyStore.applyDateFilter(dateRange)
    showFilter.value = false
    message.success('日期筛选已应用')
  } catch (error: any) {
    message.error(`应用筛选失败: ${error.message}`)
  }
}

const handleResetFilter = async () => {
  try {
    await historyStore.resetDateFilter()
    showFilter.value = false
    message.success('日期筛选已重置')
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
  try {
    historyStore.clearError()
    await historyStore.fetchRecords(1, false)
    message.success('重试成功')
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
          <div><strong>投注时间:</strong> ${record.bet_time}</div>
          <div><strong>投注金额:</strong> ${formatAmount(record.total_bet_amount)}</div>
          <div><strong>中奖金额:</strong> ${formatAmount(record.total_win_amount)}</div>
          <div><strong>净盈亏:</strong> <span style="color: ${record.net_amount >= 0 ? '#4caf50' : '#f44336'}">
            ${formatNetAmount(record.net_amount)}
          </span></div>
          ${record.dice_results ? `<div><strong>开奖结果:</strong> ${record.dice_results.join(', ')} (总点数: ${record.dice_total})</div>` : ''}
          <div><strong>状态:</strong> ${getStatusText(record.status)}</div>
        </div>
      `
    },
    positiveText: '确定'
  })
}

const handleRebet = (record: BettingRecord) => {
  message.info('复投功能开发中...')
}

const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    'pending': '待开奖',
    'win': '已中奖',
    'lose': '未中奖',
    'cancelled': '已取消',
    'processing': '处理中'
  }
  return statusMap[status] || '未知'
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
      console.error('初始化投注记录失败:', error)
    }
  }
}

// 监听弹窗显示状态
watch(visible, async (newVisible) => {
  if (newVisible) {
    await nextTick()
    await initializeData()
    document.addEventListener('keydown', handleKeydown)
  } else {
    document.removeEventListener('keydown', handleKeydown)
    showFilter.value = false
  }
})

// 组件挂载和卸载
onMounted(() => {
  historyStore.init()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
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

.filter-section {
  margin-bottom: 16px;
}

.stats-section {
  margin-bottom: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
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
  font-family: 'Courier New', monospace;
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
}

.record-item {
  margin-bottom: 12px;
}

.record-item:last-child {
  margin-bottom: 0;
}

.load-more-container {
  margin-top: 16px;
  padding: 0 4px;
}

.records-footer {
  margin-top: 16px;
  text-align: center;
}

/* 滚动条样式 */
.records-container::-webkit-scrollbar {
  width: 6px;
}

.records-container::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.records-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.records-container::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
</style>