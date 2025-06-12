<template>
  <div class="roadmap-chart">
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p class="loading-text">正在加载路纸数据...</p>
    </div>
    
    <!-- 错误状态 -->
    <div v-else-if="hasError" class="error-container">
      <div class="error-icon">⚠️</div>
      <p class="error-text">路纸数据加载失败</p>
      <button class="retry-btn" @click="loadData">重新加载</button>
    </div>
    
    <!-- 空数据状态 -->
    <div v-else-if="gameResults.length === 0" class="empty-container">
      <div class="empty-icon">📊</div>
      <p class="empty-text">暂无路纸数据</p>
      <button class="reload-btn" @click="loadData">刷新数据</button>
    </div>
    
    <!-- 路纸图表 -->
    <div v-else class="chart-container" ref="chartContainer">
      <!-- 骰子1行 -->
      <RoadmapRow 
        label="骰子1"
        type="dice"
        :data="dice1Data"
        :max-columns="maxColumns"
      />
      
      <!-- 骰子2行 -->
      <RoadmapRow 
        label="骰子2"
        type="dice"
        :data="dice2Data"
        :max-columns="maxColumns"
      />
      
      <!-- 骰子3行 -->
      <RoadmapRow 
        label="骰子3"
        type="dice"
        :data="dice3Data"
        :max-columns="maxColumns"
      />
      
      <!-- 大小行 -->
      <RoadmapRow 
        label="大小"
        type="size"
        :data="sizeData"
        :max-columns="maxColumns"
      />
      
      <!-- 单双行 -->
      <RoadmapRow 
        label="单双"
        type="parity"
        :data="parityData"
        :max-columns="maxColumns"
      />
      
      <!-- 总和行 -->
      <RoadmapRow 
        label="总和"
        type="sum"
        :data="sumData"
        :max-columns="maxColumns"
      />
    </div>
    
    <!-- 统计信息 -->
    <div v-if="gameResults.length > 0" class="stats-container">
      <div class="stats-item">
        <span class="stats-label">记录数:</span>
        <span class="stats-value">{{ gameResults.length }}</span>
      </div>
      <div class="stats-item">
        <span class="stats-label">最新:</span>
        <span class="stats-value">{{ getLatestResultText() }}</span>
      </div>
    </div>
  </div>
</template>










<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import RoadmapRow from './RoadmapRow.vue'
import { useGameData } from '@/composables/useGameData'
import type { GameResult, HistoryData, RoadmapApiResponse } from '@/types/roadmapTypes'
import { calculateGameResult } from '@/types/roadmapTypes'

interface Props {
  tableId?: string | number
  autoRefresh?: boolean
  refreshInterval?: number
}

const props = withDefaults(defineProps<Props>(), {
  autoRefresh: false,
  refreshInterval: 30000 // 30秒
})

const emit = defineEmits<{
  'data-loaded': [data: HistoryData]
  'data-error': [error: string]
}>()

// 响应式数据
const isLoading = ref(true)
const hasError = ref(false)
const gameResults = ref<GameResult[]>([])
const chartContainer = ref<HTMLElement>()
const maxColumns = ref(20)

// 获取游戏数据
const { userInfo, tableInfo } = useGameData()

// 计算各行数据
const dice1Data = computed(() => gameResults.value.map(r => r.dice1))
const dice2Data = computed(() => gameResults.value.map(r => r.dice2))
const dice3Data = computed(() => gameResults.value.map(r => r.dice3))
const sizeData = computed(() => gameResults.value.map(r => r.size))
const parityData = computed(() => gameResults.value.map(r => r.parity))
const sumData = computed(() => gameResults.value.map(r => r.sum))

// 获取当前tableId
const getCurrentTableId = (): string => {
  return props.tableId?.toString() || 
         tableInfo.value?.id?.toString() || 
         tableInfo.value?.table_id?.toString() || 
         'default'
}

// 加载路纸数据
const loadData = async () => {
  console.log('🔄 开始加载路纸数据')
  
  isLoading.value = true
  hasError.value = false
  
  try {
    const tableId = getCurrentTableId()
    console.log('📡 请求路纸数据，tableId:', tableId)
    
    // 🔥 使用统一的API服务
    const { getGlobalApiService } = await import('@/services/gameApi')
    const apiService = getGlobalApiService()
    
    const data: RoadmapApiResponse = await apiService.getRoadmapData()
    console.log('📊 接收到路纸数据:', data)
    
    // 解析数据并转换为GameResult格式
    const parsedResults = parseRoadmapData(data || {})
    gameResults.value = parsedResults
    
    const historyData: HistoryData = {
      results: parsedResults,
      total: parsedResults.length
    }
    
    emit('data-loaded', historyData)
    console.log('✅ 路纸数据加载成功，共', parsedResults.length, '条记录')
    
  } catch (error: any) {
    console.error('❌ 路纸数据加载失败:', error)
    hasError.value = true
    gameResults.value = []
    emit('data-error', error.message || '加载失败')
    
  } finally {
    isLoading.value = false
  }
}

// 解析路纸数据 - 修复版本
const parseRoadmapData = (rawData: any): GameResult[] => {
  console.log('🔍 解析原始数据:', rawData)
  
  if (!rawData || typeof rawData !== 'object') {
    console.warn('⚠️ 数据格式不正确，使用模拟数据')
    return generateMockData()
  }
  
  const results: GameResult[] = []
  
  // 按数字排序，确保顺序正确
  const gameKeys = Object.keys(rawData)
    .filter(key => key.startsWith('k'))
    .sort((a, b) => {
      const numA = parseInt(a.substring(1))
      const numB = parseInt(b.substring(1))
      return numA - numB
    })
  
  console.log('📋 发现期次:', gameKeys)
  
  for (const key of gameKeys) {
    try {
      const gameDataStr = rawData[key]
      
      // 修复1: 更严格的空值检查
      if (gameDataStr === null || gameDataStr === undefined || gameDataStr === '') {
        continue
      }
      
      if (typeof gameDataStr !== 'string') {
        continue
      }
      
      // 修复2: 安全的JSON解析
      let gameData
      try {
        gameData = JSON.parse(gameDataStr)
      } catch {
        continue
      }
      
      // 修复3: 更严格的对象验证
      if (!gameData || typeof gameData !== 'object') {
        continue
      }
      
      // 修复4: 明确检查每个必需的键
      if (!gameData.hasOwnProperty("1") || 
          !gameData.hasOwnProperty("2") || 
          !gameData.hasOwnProperty("3")) {
        continue
      }
      
      // 修复5: 更安全的数值转换
      const dice1 = parseInt(gameData["1"])
      const dice2 = parseInt(gameData["2"]) 
      const dice3 = parseInt(gameData["3"])
      
      // 修复6: 严格的数值验证
      if (isNaN(dice1) || isNaN(dice2) || isNaN(dice3) ||
          dice1 < 1 || dice1 > 6 ||
          dice2 < 1 || dice2 > 6 ||
          dice3 < 1 || dice3 > 6) {
        continue
      }
      
      // 计算游戏结果
      const gameResult = calculateGameResult(dice1, dice2, dice3)
      results.push(gameResult)
      
    } catch (error) {
      // 遇到错误时跳过，继续处理下一条
      continue
    }
  }
  
  console.log('✅ 总共解析', results.length, '条路纸记录')
  return results
}

// 生成模拟数据（用于测试）
const generateMockData = (): GameResult[] => {
  const results: GameResult[] = []
  
  for (let i = 0; i < 30; i++) {
    const dice1 = Math.floor(Math.random() * 6) + 1
    const dice2 = Math.floor(Math.random() * 6) + 1
    const dice3 = Math.floor(Math.random() * 6) + 1
    
    const gameResult = calculateGameResult(dice1, dice2, dice3)
    results.push(gameResult)
  }
  
  return results
}

// 获取最新结果文本
const getLatestResultText = (): string => {
  if (gameResults.value.length === 0) return '-'
  
  const latest = gameResults.value[gameResults.value.length - 1]
  const sizeText = latest.size === 'big' ? '大' : '小'
  const parityText = latest.parity === 'odd' ? '单' : '双'
  
  return `${latest.dice1}-${latest.dice2}-${latest.dice3} (${latest.sum}, ${sizeText}${parityText})`
}

// 计算容器宽度对应的最大列数
const calculateMaxColumns = () => {
  if (!chartContainer.value) return
  
  const containerWidth = chartContainer.value.clientWidth
  const columnWidth = 45 // 考虑骰子列的宽度
  const labelWidth = 60
  const padding = 20
  
  const availableWidth = containerWidth - labelWidth - padding
  const columns = Math.floor(availableWidth / columnWidth)
  maxColumns.value = Math.max(8, Math.min(columns, 30)) // 限制在8-30列之间
}

// 窗口尺寸变化处理
const handleResize = () => {
  calculateMaxColumns()
}

// 自动刷新
let refreshTimer: number | null = null

const startAutoRefresh = () => {
  if (!props.autoRefresh) return
  
  stopAutoRefresh()
  refreshTimer = window.setInterval(() => {
    if (!isLoading.value) {
      loadData()
    }
  }, props.refreshInterval)
}

const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

// 暴露方法给父组件
defineExpose({
  loadData,
  refresh: loadData,
  gameResults: computed(() => gameResults.value),
  isLoading: computed(() => isLoading.value),
  hasError: computed(() => hasError.value)
})

// 生命周期
onMounted(() => {
  calculateMaxColumns()
  window.addEventListener('resize', handleResize)
  
  // 初始加载数据
  loadData()
  
  // 启动自动刷新
  startAutoRefresh()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  stopAutoRefresh()
})
</script>










<style scoped>
.roadmap-chart {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.loading-container,
.error-container,
.empty-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 40px 20px;
  color: rgba(255, 255, 255, 0.8);
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid #4a9f6e;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text,
.error-text,
.empty-text {
  font-size: 14px;
  margin: 0;
  text-align: center;
}

.error-icon,
.empty-icon {
  font-size: 32px;
}

.retry-btn,
.reload-btn {
  background: #4a9f6e;
  border: 1px solid #5bb77c;
  border-radius: 6px;
  padding: 8px 16px;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 12px;
}

.retry-btn:hover,
.reload-btn:hover {
  background: #27ae60;
  transform: translateY(-1px);
}

.chart-container {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  max-height: calc(100% - 60px);
}

.stats-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.1);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.stats-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stats-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.stats-value {
  font-size: 12px;
  color: #ffd700;
  font-weight: 600;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .chart-container {
    padding: 12px;
  }
  
  .stats-container {
    padding: 8px 12px;
    gap: 16px;
  }
  
  .stats-label,
  .stats-value {
    font-size: 11px;
  }
}

@media (max-width: 480px) {
  .loading-container,
  .error-container,
  .empty-container {
    padding: 20px 16px;
  }
  
  .chart-container {
    padding: 8px;
  }
  
  .stats-container {
    flex-direction: column;
    gap: 8px;
    padding: 8px;
  }
  
  .stats-item {
    justify-content: center;
  }
}
</style>