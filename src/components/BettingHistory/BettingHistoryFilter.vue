<template>
  <div class="betting-history-filter">
    <!-- 筛选标题 -->
    <div class="filter-header">
      <div class="filter-title">
        <n-icon size="16" class="filter-icon">
          <svg viewBox="0 0 24 24">
            <path fill="currentColor" d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/>
          </svg>
        </n-icon>
        <span>筛选条件</span>
      </div>
      <n-button 
        text 
        size="small" 
        @click="handleReset"
        :disabled="loading"
        class="reset-btn"
      >
        重置
      </n-button>
    </div>

    <!-- 筛选表单 -->
    <div class="filter-form">
      <!-- 第一行：状态和投注类型 -->
      <div class="filter-row">
        <div class="filter-item">
          <div class="filter-label">状态</div>
          <n-select
            v-model:value="localFilter.status"
            :options="statusOptions"
            size="small"
            :disabled="loading"
            class="filter-select"
            placeholder="选择状态"
          />
        </div>
        
        <div class="filter-item">
          <div class="filter-label">投注类型</div>
          <n-select
            v-model:value="localFilter.betType"
            :options="betTypeOptions"
            size="small"
            :disabled="loading"
            class="filter-select"
            placeholder="选择类型"
          />
        </div>
      </div>

      <!-- 第二行：日期范围 -->
      <div class="filter-row">
        <div class="filter-item full-width">
          <div class="filter-label">日期范围</div>
          <n-date-picker
            v-model:value="dateRange"
            type="daterange"
            size="small"
            :disabled="loading"
            clearable
            class="date-picker"
            placeholder="选择日期范围"
            format="yyyy-MM-dd"
          />
        </div>
      </div>

      <!-- 第三行：排序选项 -->
      <div class="filter-row">
        <div class="filter-item">
          <div class="filter-label">排序</div>
          <n-select
            v-model:value="localFilter.sortBy"
            :options="sortByOptions"
            size="small"
            :disabled="loading"
            class="filter-select"
            placeholder="排序字段"
          />
        </div>
        
        <div class="filter-item">
          <div class="filter-label">顺序</div>
          <n-select
            v-model:value="localFilter.sortOrder"
            :options="sortOrderOptions"
            size="small"
            :disabled="loading"
            class="filter-select"
            placeholder="排序顺序"
          />
        </div>
      </div>

      <!-- 快速筛选按钮 -->
      <div class="quick-filters">
        <div class="quick-filter-label">快速筛选:</div>
        <n-space size="small" class="quick-filter-buttons">
          <n-button 
            size="small" 
            :type="getQuickFilterType('today')"
            @click="handleQuickFilter('today')"
            :disabled="loading"
          >
            今日
          </n-button>
          <n-button 
            size="small" 
            :type="getQuickFilterType('week')"
            @click="handleQuickFilter('week')"
            :disabled="loading"
          >
            本周
          </n-button>
          <n-button 
            size="small" 
            :type="getQuickFilterType('month')"
            @click="handleQuickFilter('month')"
            :disabled="loading"
          >
            本月
          </n-button>
          <n-button 
            size="small" 
            :type="getQuickFilterType('win')"
            @click="handleQuickFilter('win')"
            :disabled="loading"
          >
            中奖记录
          </n-button>
          <n-button 
            size="small" 
            :type="getQuickFilterType('loss')"
            @click="handleQuickFilter('loss')"
            :disabled="loading"
          >
            未中奖
          </n-button>
        </n-space>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="filter-actions">
      <n-space size="medium">
        <n-button 
          @click="handleCancel"
          :disabled="loading"
          quaternary
        >
          取消
        </n-button>
        <n-button 
          @click="handleApply"
          type="primary"
          :loading="loading"
          :disabled="!hasChanges"
        >
          应用筛选
        </n-button>
      </n-space>
    </div>

    <!-- 当前筛选条件显示 -->
    <div v-if="hasActiveFilters" class="current-filters">
      <div class="current-filters-title">当前筛选:</div>
      <n-space size="small" class="filter-tags">
        <n-tag 
          v-if="localFilter.status !== 'all'" 
          closable 
          @close="removeFilter('status')"
          size="small"
          type="info"
        >
          状态: {{ getStatusLabel(localFilter.status) }}
        </n-tag>
        <n-tag 
          v-if="localFilter.betType !== 'all'" 
          closable 
          @close="removeFilter('betType')"
          size="small"
          type="info"
        >
          类型: {{ getBetTypeLabel(localFilter.betType) }}
        </n-tag>
        <n-tag 
          v-if="localFilter.dateRange.start" 
          closable 
          @close="removeFilter('dateRange')"
          size="small"
          type="info"
        >
          日期: {{ formatDateRange() }}
        </n-tag>
      </n-space>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import { 
  NSelect, 
  NDatePicker, 
  NButton, 
  NSpace, 
  NIcon, 
  NTag,
  useMessage
} from 'naive-ui'
import type { 
  BettingHistoryFilter, 
  BettingStatus, 
  STATUS_LABELS 
} from '@/types/bettingHistory'

// Props
interface Props {
  filter: BettingHistoryFilter
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

// Emits
const emit = defineEmits<{
  'apply': [filter: Partial<BettingHistoryFilter>]
  'reset': []
}>()

// 组合式函数
const message = useMessage()

// 响应式数据
const localFilter = reactive<BettingHistoryFilter>({ ...props.filter })
const dateRange = ref<[number, number] | null>(null)
const quickFilterActive = ref<string | null>(null)

// 选项数据
const statusOptions = [
  { label: '全部', value: 'all' },
  { label: '待开奖', value: 'pending' },
  { label: '已中奖', value: 'win' },
  { label: '未中奖', value: 'lose' },
  { label: '已取消', value: 'cancelled' },
  { label: '处理中', value: 'processing' }
]

const betTypeOptions = [
  { label: '全部', value: 'all' },
  { label: '大小单双', value: 'basic' },
  { label: '点数投注', value: 'number' },
  { label: '单骰投注', value: 'single' },
  { label: '对子投注', value: 'pair' },
  { label: '三同号', value: 'triple' },
  { label: '组合投注', value: 'combo' }
]

const sortByOptions = [
  { label: '投注时间', value: 'bet_time' },
  { label: '净盈亏', value: 'net_amount' }
]

const sortOrderOptions = [
  { label: '降序', value: 'desc' },
  { label: '升序', value: 'asc' }
]

// 日期快捷选项
const dateShortcuts = {
  '今天': () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
    return [start.getTime(), end.getTime()]
  },
  '昨天': () => {
    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const start = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())
    const end = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59)
    return [start.getTime(), end.getTime()]
  },
  '本周': () => {
    const now = new Date()
    const dayOfWeek = now.getDay() || 7 // 周日为0，转为7
    const start = new Date(now.getTime() - (dayOfWeek - 1) * 24 * 60 * 60 * 1000)
    start.setHours(0, 0, 0, 0)
    const end = new Date(now.getTime() + (7 - dayOfWeek) * 24 * 60 * 60 * 1000)
    end.setHours(23, 59, 59, 999)
    return [start.getTime(), end.getTime()]
  },
  '本月': () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    return [start.getTime(), end.getTime()]
  },
  '最近7天': () => {
    const now = new Date()
    const start = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000)
    start.setHours(0, 0, 0, 0)
    const end = new Date()
    end.setHours(23, 59, 59, 999)
    return [start.getTime(), end.getTime()]
  },
  '最近30天': () => {
    const now = new Date()
    const start = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000)
    start.setHours(0, 0, 0, 0)
    const end = new Date()
    end.setHours(23, 59, 59, 999)
    return [start.getTime(), end.getTime()]
  }
}

// 计算属性
const hasChanges = computed(() => {
  return JSON.stringify(localFilter) !== JSON.stringify(props.filter) ||
         dateRangeChanged.value
})

const dateRangeChanged = computed(() => {
  const currentStart = localFilter.dateRange.start
  const currentEnd = localFilter.dateRange.end
  const originalStart = props.filter.dateRange.start
  const originalEnd = props.filter.dateRange.end
  
  return currentStart !== originalStart || currentEnd !== originalEnd
})

const hasActiveFilters = computed(() => {
  return localFilter.status !== 'all' ||
         localFilter.betType !== 'all' ||
         localFilter.dateRange.start !== null ||
         localFilter.dateRange.end !== null
})

// 监听日期范围变化
watch(dateRange, (newRange) => {
  if (newRange && newRange.length === 2) {
    localFilter.dateRange.start = formatDate(new Date(newRange[0]))
    localFilter.dateRange.end = formatDate(new Date(newRange[1]))
  } else {
    localFilter.dateRange.start = null
    localFilter.dateRange.end = null
  }
  
  // 清除快速筛选状态
  quickFilterActive.value = null
})

// 监听 props 变化
watch(() => props.filter, (newFilter) => {
  Object.assign(localFilter, newFilter)
  
  // 同步日期范围到日期选择器
  if (newFilter.dateRange.start && newFilter.dateRange.end) {
    dateRange.value = [
      new Date(newFilter.dateRange.start).getTime(),
      new Date(newFilter.dateRange.end).getTime()
    ]
  } else {
    dateRange.value = null
  }
}, { deep: true, immediate: true })

// 事件处理
const handleApply = () => {
  const filterToApply: Partial<BettingHistoryFilter> = {
    status: localFilter.status,
    betType: localFilter.betType,
    dateRange: {
      start: localFilter.dateRange.start,
      end: localFilter.dateRange.end
    },
    sortBy: localFilter.sortBy,
    sortOrder: localFilter.sortOrder
  }
  
  emit('apply', filterToApply)
  message.success('筛选条件已应用')
}

const handleReset = () => {
  // 重置本地筛选条件
  localFilter.status = 'all'
  localFilter.betType = 'all'
  localFilter.dateRange.start = null
  localFilter.dateRange.end = null
  localFilter.sortBy = 'bet_time'
  localFilter.sortOrder = 'desc'
  
  // 重置日期选择器
  dateRange.value = null
  
  // 清除快速筛选状态
  quickFilterActive.value = null
  
  emit('reset')
  message.success('筛选条件已重置')
}

const handleCancel = () => {
  // 恢复到原始状态
  Object.assign(localFilter, props.filter)
  
  // 同步日期范围
  if (props.filter.dateRange.start && props.filter.dateRange.end) {
    dateRange.value = [
      new Date(props.filter.dateRange.start).getTime(),
      new Date(props.filter.dateRange.end).getTime()
    ]
  } else {
    dateRange.value = null
  }
  
  quickFilterActive.value = null
}

// 快速筛选处理
const handleQuickFilter = (type: string) => {
  quickFilterActive.value = type
  
  const today = new Date()
  const formatToday = formatDate(today)
  
  switch (type) {
    case 'today':
      localFilter.dateRange.start = formatToday
      localFilter.dateRange.end = formatToday
      dateRange.value = [
        new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime(),
        new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).getTime()
      ]
      break
      
    case 'week':
      const weekStart = new Date(today)
      const dayOfWeek = weekStart.getDay() || 7
      weekStart.setDate(weekStart.getDate() - dayOfWeek + 1)
      weekStart.setHours(0, 0, 0, 0)
      
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      weekEnd.setHours(23, 59, 59, 999)
      
      localFilter.dateRange.start = formatDate(weekStart)
      localFilter.dateRange.end = formatDate(weekEnd)
      dateRange.value = [weekStart.getTime(), weekEnd.getTime()]
      break
      
    case 'month':
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59)
      
      localFilter.dateRange.start = formatDate(monthStart)
      localFilter.dateRange.end = formatDate(monthEnd)
      dateRange.value = [monthStart.getTime(), monthEnd.getTime()]
      break
      
    case 'win':
      localFilter.status = 'win'
      break
      
    case 'loss':
      localFilter.status = 'lose'
      break
  }
}

const getQuickFilterType = (type: string): 'primary' | 'default' => {
  return quickFilterActive.value === type ? 'primary' : 'default'
}

// 移除筛选条件
const removeFilter = (filterType: string) => {
  switch (filterType) {
    case 'status':
      localFilter.status = 'all'
      break
    case 'betType':
      localFilter.betType = 'all'
      break
    case 'dateRange':
      localFilter.dateRange.start = null
      localFilter.dateRange.end = null
      dateRange.value = null
      break
  }
  
  quickFilterActive.value = null
}

// 工具函数
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0]
}

const formatDateRange = (): string => {
  if (localFilter.dateRange.start && localFilter.dateRange.end) {
    if (localFilter.dateRange.start === localFilter.dateRange.end) {
      return localFilter.dateRange.start
    }
    return `${localFilter.dateRange.start} ~ ${localFilter.dateRange.end}`
  }
  return ''
}

const getStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    'all': '全部',
    'pending': '待开奖',
    'win': '已中奖',
    'lose': '未中奖',
    'cancelled': '已取消',
    'processing': '处理中'
  }
  return statusMap[status] || status
}

const getBetTypeLabel = (betType: string): string => {
  const betTypeMap: Record<string, string> = {
    'all': '全部',
    'basic': '大小单双',
    'number': '点数投注',
    'single': '单骰投注',
    'pair': '对子投注',
    'triple': '三同号',
    'combo': '组合投注'
  }
  return betTypeMap[betType] || betType
}
</script>

<style scoped>
.betting-history-filter {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.filter-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
}

.filter-icon {
  color: #ffd700;
}

.reset-btn {
  color: rgba(255, 255, 255, 0.8);
}

.filter-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-item.full-width {
  grid-column: 1 / -1;
}

.filter-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

.filter-select,
.date-picker {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 4px;
}

.quick-filters {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.quick-filter-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

.quick-filter-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-actions {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: flex-end;
}

.current-filters {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.current-filters-title {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 8px;
  font-weight: 500;
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .filter-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .quick-filter-buttons {
    gap: 6px;
  }
  
  .filter-actions {
    justify-content: stretch;
  }
  
  .filter-actions .n-space {
    width: 100%;
    justify-content: space-between;
  }
}

@media (max-width: 480px) {
  .betting-history-filter {
    padding: 12px;
  }
  
  .filter-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .quick-filter-buttons {
    flex-direction: column;
    width: 100%;
  }
  
  .filter-tags {
    flex-direction: column;
    gap: 4px;
  }
}

/* 深色主题适配 */
:deep(.n-select) {
  background: rgba(255, 255, 255, 0.05) !important;
}

:deep(.n-date-picker) {
  background: rgba(255, 255, 255, 0.05) !important;
}

:deep(.n-input) {
  background: rgba(255, 255, 255, 0.05) !important;
  color: #ffffff !important;
}

:deep(.n-button) {
  border-color: rgba(255, 255, 255, 0.15) !important;
}

:deep(.n-tag) {
  background: rgba(33, 150, 243, 0.2) !important;
  color: #ffffff !important;
  border-color: rgba(33, 150, 243, 0.3) !important;
}
</style>