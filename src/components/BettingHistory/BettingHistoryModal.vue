<template>
  <n-modal
    v-model:show="visible"
    class="betting-history-modal"
    :style="modalStyle"
    :bordered="false"
    :closable="false"
    :close-on-esc="true"
    :mask-closable="true"
    transform-origin="center"
    @after-leave="handleModalClose"
  >
    <!-- 自定义内容区域 -->
    <div class="modal-container">
      <!-- 标题栏 -->
      <div class="modal-header">
        <div class="header-left">
          <h3 class="modal-title">💰 投注记录</h3>
        </div>
        <div class="header-right">
          <!-- 筛选按钮 -->
          <n-button
            circle
            quaternary
            @click="toggleFilter"
            class="action-btn filter-btn"
            :type="hasActiveFilter ? 'info' : 'default'"
          >
            <template #icon>
              <n-icon>
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path fill="currentColor" d="M3,2H21V6H19V4H5V6H3V2M7,10V8H17V10H7M11,14V12H13V14H11Z"/>
                </svg>
              </n-icon>
            </template>
          </n-button>
          
          <!-- 刷新按钮 -->
          <n-button
            circle
            quaternary
            @click="handleRefresh"
            :loading="isLoading"
            class="action-btn refresh-btn"
          >
            <template #icon>
              <n-icon>
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path fill="currentColor" d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"/>
                </svg>
              </n-icon>
            </template>
          </n-button>
          
          <!-- 关闭按钮 -->
          <n-button
            circle
            quaternary
            @click="handleClose"
            class="action-btn close-btn"
          >
            <template #icon>
              <n-icon>
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </n-icon>
            </template>
          </n-button>
        </div>
      </div>

      <!-- 筛选区域 -->
      <BettingHistoryFilter 
        v-if="showFilter"
        :loading="isLoading"
        @apply="handleApplyFilter"
        @reset="handleResetFilter"
        class="filter-section"
      />

      <!-- 记录列表区域 -->
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
                <n-button @click="handleRetry" type="primary" size="medium">重试</n-button>
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
              <n-button @click="handleRefresh" type="primary" ghost size="medium">
                刷新数据
              </n-button>
            </template>
          </n-empty>
        </div>

        <!-- 记录内容 -->
        <div v-else class="records-list">
          <div class="records-container">
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
                class="load-more-btn"
                size="large"
                type="primary"
                ghost
              >
                {{ loadingMore ? '加载中...' : '加载更多' }}
              </n-button>
            </div>

            <!-- 底部状态信息 -->
            <div class="status-info">
              <n-space justify="space-between" align="center">
                <span class="page-text">第 {{ currentPage }} 页，共 {{ totalRecords }} 条记录</span>
                <span class="stats-text" v-if="!isEmpty">
                  已显示 {{ displayRecords.length }} 条
                </span>
              </n-space>
            </div>
          </div>
        </div>
      </div>
    </div>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { 
  NModal, 
  NButton, 
  NIcon, 
  NSpin, 
  NEmpty, 
  NResult,
  NSpace,
  useMessage
} from 'naive-ui'
import BettingHistoryItem from './BettingHistoryItem.vue'
import BettingHistoryFilter from './BettingHistoryFilter.vue'
import { useBettingHistoryStore } from '@/stores/bettingHistoryStore'
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
const message = useMessage()
const bettingHistoryStore = useBettingHistoryStore()

// 组件本地状态
const showFilter = ref(false)
const error = ref<string | null>(null)

// 使用 Store 状态
const allRecords = computed(() => bettingHistoryStore.records)
const totalRecords = computed(() => bettingHistoryStore.totalRecords)
const currentPage = computed(() => bettingHistoryStore.currentPage)
const hasMore = computed(() => bettingHistoryStore.hasMore)
const isLoading = computed(() => bettingHistoryStore.isLoading)
const loadingMore = computed(() => bettingHistoryStore.loadingState.loadingMore)
const dateFilter = computed(() => bettingHistoryStore.dateFilter)

// 弹窗显示状态
const visible = computed({
  get: () => props.show,
  set: (value) => {
    emit('update:show', value)
    if (!value) {
      emit('close')
    }
  }
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

const displayRecords = computed(() => {
  return allRecords.value
})

const isEmpty = computed(() => {
  return displayRecords.value.length === 0 && !isLoading.value && !error.value
})

const canLoadMore = computed(() => {
  return hasMore.value && !isLoading.value && !loadingMore.value && !error.value
})

// 方法
const handleClose = () => {
  try {
    showFilter.value = false
    visible.value = false
  } catch (err) {
    console.error('关闭弹窗时出错:', err)
    emit('update:show', false)
    emit('close')
  }
}

const handleModalClose = () => {
  handleClose()
}

const toggleFilter = () => {
  showFilter.value = !showFilter.value
}

const handleRefresh = async () => {
  try {
    await bettingHistoryStore.refreshRecords()
    message.success('数据已刷新')
  } catch (error: any) {
    message.error(`刷新失败: ${error.message}`)
  }
}

const handleLoadMore = async () => {
  if (!canLoadMore.value) return
  
  try {
    await bettingHistoryStore.loadMoreRecords()
  } catch (error: any) {
    message.error(`加载更多失败: ${error.message}`)
  }
}

const handleApplyFilter = async (dateRange: { start: string | null; end: string | null }) => {
  try {
    await bettingHistoryStore.applyDateFilter(dateRange)
    showFilter.value = false
    message.success('日期筛选已应用')
  } catch (error: any) {
    message.error(`应用筛选失败: ${error.message}`)
  }
}

const handleResetFilter = async () => {
  try {
    await bettingHistoryStore.resetDateFilter()
    showFilter.value = false
    message.success('筛选条件已重置')
  } catch (error: any) {
    message.error(`重置失败: ${error.message}`)
  }
}

const handleRetry = async () => {
  try {
    error.value = null
    bettingHistoryStore.clearError()
    await bettingHistoryStore.init()
  } catch (error: any) {
    console.error('重试失败:', error)
  }
}

const handleRecordClick = (record: BettingRecord) => {
  // 记录点击处理逻辑
}

// 初始化数据
const initializeData = async () => {
  if (allRecords.value.length === 0 && !isLoading.value) {
    try {
      await bettingHistoryStore.init()
    } catch (error: any) {
      console.error('初始化数据失败:', error)
      error.value = error.message || '初始化数据失败'
    }
  }
}

// 监听弹窗显示状态
watch(visible, async (newVisible) => {
  if (newVisible) {
    await nextTick()
    error.value = null
    bettingHistoryStore.clearError()
    await initializeData()
  } else {
    showFilter.value = false
  }
})

// 监听 Store 错误状态
watch(() => bettingHistoryStore.loadingState.error, (newError) => {
  if (newError) {
    error.value = newError
  }
})

// 组件挂载
onMounted(() => {
  // 组件挂载完成
})
</script>

<style scoped>
/* 弹窗容器 */
.betting-history-modal {
  /* 确保弹窗在最上层 */
  z-index: 9999;
}

/* 主容器 - 扁平化设计 */
.modal-container {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, 
    rgba(26, 26, 26, 0.98) 0%, 
    rgba(35, 35, 35, 0.98) 100%);
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  color: #ffffff;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.05);
}

/* 标题栏 */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
}

.header-left {
  flex: 1;
}

.modal-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 统一按钮样式 */
.action-btn {
  width: 40px !important;
  height: 40px !important;
  border-radius: 12px !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  position: relative;
  overflow: hidden;
}

.action-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transform: translateX(-100%);
  transition: transform 0.6s;
}

.action-btn:hover::before {
  transform: translateX(100%);
}

.action-btn:hover {
  transform: translateY(-2px) scale(1.05) !important;
}

.filter-btn {
  background: rgba(24, 144, 255, 0.15) !important;
  color: #40a9ff !important;
}

.filter-btn:hover {
  background: rgba(24, 144, 255, 0.25) !important;
  box-shadow: 0 8px 32px rgba(24, 144, 255, 0.4) !important;
}

.refresh-btn {
  background: rgba(82, 196, 26, 0.15) !important;
  color: #73d13d !important;
}

.refresh-btn:hover {
  background: rgba(82, 196, 26, 0.25) !important;
  box-shadow: 0 8px 32px rgba(82, 196, 26, 0.4) !important;
}

.close-btn {
  background: rgba(255, 77, 79, 0.15) !important;
  color: #ff7875 !important;
}

.close-btn:hover {
  background: rgba(255, 77, 79, 0.25) !important;
  box-shadow: 0 8px 32px rgba(255, 77, 79, 0.4) !important;
}

/* 筛选区域 */
.filter-section {
  margin: 0 24px 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

/* 记录区域 */
.records-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 0 24px 24px;
}

.loading-container,
.empty-container,
.error-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
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
  padding-right: 8px;
  margin-bottom: 16px;
}

.record-item {
  margin-bottom: 12px;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.record-item:hover {
  transform: translateY(-3px);
  box-shadow: 
    0 12px 40px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
}

.record-item:last-child {
  margin-bottom: 0;
}

/* 分页区域 */
.pagination-section {
  flex-shrink: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 16px;
}

.load-more-container {
  margin-bottom: 16px;
}

.load-more-btn {
  background: rgba(24, 144, 255, 0.1) !important;
  color: #40a9ff !important;
  border: 1px solid rgba(24, 144, 255, 0.3) !important;
  border-radius: 12px !important;
  height: 48px !important;
  font-weight: 600 !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.load-more-btn:hover {
  background: rgba(24, 144, 255, 0.2) !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 12px 40px rgba(24, 144, 255, 0.4) !important;
}

.status-info {
  text-align: center;
}

.page-text,
.stats-text {
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  font-weight: 500;
}

/* 滚动条样式 */
.records-container::-webkit-scrollbar {
  width: 8px;
}

.records-container::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.records-container::-webkit-scrollbar-thumb {
  background: rgba(255, 215, 0, 0.3);
  border-radius: 4px;
  transition: background 0.3s;
}

.records-container::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 215, 0, 0.5);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .modal-container {
    border-radius: 12px;
  }
  
  .modal-header {
    padding: 16px 20px 12px;
  }
  
  .modal-title {
    font-size: 18px;
  }
  
  .action-btn {
    width: 36px !important;
    height: 36px !important;
    border-radius: 10px !important;
  }
  
  .header-right {
    gap: 8px;
  }
  
  .records-section {
    padding: 0 20px 20px;
  }
  
  .filter-section {
    margin: 0 20px 12px;
    padding: 12px;
  }
}

@media (max-width: 480px) {
  .modal-header {
    padding: 12px 16px 8px;
  }
  
  .modal-title {
    font-size: 16px;
  }
  
  .action-btn {
    width: 32px !important;
    height: 32px !important;
    border-radius: 8px !important;
  }
  
  .header-right {
    gap: 6px;
  }
  
  .records-section {
    padding: 0 16px 16px;
  }
  
  .filter-section {
    margin: 0 16px 8px;
    padding: 8px;
  }
  
  .load-more-btn {
    height: 44px !important;
  }
}

/* 动画效果 */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-container {
  animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .modal-container {
    border: 2px solid #ffffff;
  }
  
  .action-btn {
    border: 2px solid currentColor !important;
  }
}

/* 减少动画模式支持 */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>