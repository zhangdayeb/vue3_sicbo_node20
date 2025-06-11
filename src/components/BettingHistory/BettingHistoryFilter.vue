<template>
  <div class="betting-history-filter">
    <!-- 日期范围筛选 -->
    <div class="filter-group">
      <div class="filter-label">日期范围</div>
      <n-date-picker
        v-model:value="dateRange"
        type="daterange"
        clearable
        size="medium"
        :disabled="loading"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        @update:value="handleDateRangeChange"
      />
    </div>

    <!-- 快捷筛选按钮 -->
    <div class="quick-filters">
      <n-space size="small">
        <n-button
          size="small"
          :type="quickFilterActive === 'today' ? 'primary' : 'default'"
          @click="setQuickFilter('today')"
          :disabled="loading"
        >
          今天
        </n-button>
        <n-button
          size="small"
          :type="quickFilterActive === 'yesterday' ? 'primary' : 'default'"
          @click="setQuickFilter('yesterday')"
          :disabled="loading"
        >
          昨天
        </n-button>
        <n-button
          size="small"
          :type="quickFilterActive === 'week' ? 'primary' : 'default'"
          @click="setQuickFilter('week')"
          :disabled="loading"
        >
          本周
        </n-button>
      </n-space>
    </div>

    <!-- 操作按钮 -->
    <div class="filter-actions">
      <n-space size="medium">
        <n-button 
          @click="handleReset"
          :disabled="loading"
          quaternary
        >
          重置
        </n-button>
        <n-button 
          @click="handleApply"
          type="primary"
          :loading="loading"
        >
          应用筛选
        </n-button>
      </n-space>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { 
  NDatePicker, 
  NButton, 
  NSpace
} from 'naive-ui'

// Props
interface Props {
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

// Emits
const emit = defineEmits<{
  'apply': [dateRange: { start: string | null; end: string | null }]
  'reset': []
}>()

// 响应式数据
const dateRange = ref<[number, number] | null>(null)
const quickFilterActive = ref<string | null>(null)
const startDate = ref<string | null>(null)
const endDate = ref<string | null>(null)

// 方法
const handleDateRangeChange = (value: [number, number] | null) => {
  if (value) {
    startDate.value = formatDate(new Date(value[0]))
    endDate.value = formatDate(new Date(value[1]))
  } else {
    startDate.value = null
    endDate.value = null
  }
  quickFilterActive.value = null
}

const setQuickFilter = (type: string) => {
  const now = new Date()
  let start: Date, end: Date

  switch (type) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
      break
    case 'yesterday':
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      start = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())
      end = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59)
      break
    case 'week':
      const weekStart = new Date(now.getTime() - (now.getDay() * 24 * 60 * 60 * 1000))
      start = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate())
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
      break
    default:
      return
  }

  dateRange.value = [start.getTime(), end.getTime()]
  startDate.value = formatDate(start)
  endDate.value = formatDate(end)
  quickFilterActive.value = type
}

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0]
}

const handleApply = () => {
  emit('apply', {
    start: startDate.value,
    end: endDate.value
  })
}

const handleReset = () => {
  startDate.value = null
  endDate.value = null
  dateRange.value = null
  quickFilterActive.value = null
  emit('reset')
}
</script>

<style scoped>
.betting-history-filter {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.filter-group {
  margin-bottom: 16px;
}

.filter-label {
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
}

.quick-filters {
  margin-bottom: 20px;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 16px;
}
</style>