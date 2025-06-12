<template>
  <div class="control-buttons">
    <n-config-provider :theme-overrides="gameTheme">
      <!-- 主要控制按钮组 -->
      <n-button-group class="main-controls">
        <!-- 路纸按钮 -->
        <n-button
          type="info"
          size="large"
          @click="handleShowRoadmap"
          class="control-button roadmap-button"
        >
          <template #icon>
            <n-icon><GridIcon /></n-icon>
          </template>
          路纸
        </n-button>

        <!-- 取消按钮 -->
        <n-button
          type="error"
          size="large"
          :disabled="!canCancel"
          @click="handleCancel"
          class="control-button cancel-button"
        >
          <template #icon>
            <n-icon><TrashIcon /></n-icon>
          </template>
          取消
          <n-badge
            v-if="canCancel && currentBetCount > 0"
            :value="currentBetCount"
            :max="99"
            class="button-badge"
          />
        </n-button>
        
        <!-- 重复投注按钮 -->
        <n-button
          type="warning"
          size="large"
          :disabled="!canRebet"
          @click="handleRebet"
          class="control-button rebet-button"
        >
          <template #icon>
            <n-icon><RefreshIcon /></n-icon>
          </template>
          重复
          <n-badge
            v-if="lastBetAmount > 0"
            :value="formatAmount(lastBetAmount)"
            :max="999"
            class="button-badge"
          />
        </n-button>
        
        <!-- 确认投注按钮 -->
        <n-button
          type="success"
          size="large"
          :disabled="!canConfirm"
          :loading="isSubmitting"
          @click="handleConfirm"
          class="control-button confirm-button"
          :class="{ 'pulsing': canConfirm && totalBetAmount > 0 }"
        >
          <template #icon>
            <n-icon><CheckmarkIcon /></n-icon>
          </template>
          {{ getConfirmButtonText() }}
          <n-badge
            v-if="totalBetAmount > 0"
            :value="formatAmount(totalBetAmount)"
            :max="999"
            class="button-badge"
          />
        </n-button>
      </n-button-group>
    </n-config-provider>

    <!-- 路纸弹窗 -->
    <RoadmapModal 
      v-if="showRoadmap"
      v-model:show="showRoadmap"
      :table-id="currentTableId"
      @close="handleRoadmapClose"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { 
  NConfigProvider,
  NButtonGroup,
  NButton, 
  NIcon, 
  NBadge,
  useMessage
} from 'naive-ui'
import {
  TrashOutline as TrashIcon,
  RefreshOutline as RefreshIcon,
  CheckmarkCircleOutline as CheckmarkIcon,
  GridOutline as GridIcon
} from '@vicons/ionicons5'
import { useBettingStore } from '@/stores/bettingStore'
import { useGameData } from '@/composables/useGameData'
import { getGlobalApiService } from '@/services/gameApi'
import RoadmapModal from '../Roadmap/RoadmapModal.vue'
import type { BetRequest, BetResponse } from '@/services/gameApi'
// 🔥 新增：导入提示工具函数
import { showBettingBlockedMessage } from '@/utils/messageHelper'

// 游戏主题配置 - 简化版本
const gameTheme = {
  common: {
    primaryColor: '#27ae60',
    primaryColorHover: '#2ecc71',
    primaryColorPressed: '#229954',
    
    errorColor: '#e74c3c',
    errorColorHover: '#c0392b',
    errorColorPressed: '#a93226',
    
    warningColor: '#f39c12',
    warningColorHover: '#e67e22',
    warningColorPressed: '#d68910',
    
    infoColor: '#3498db',
    infoColorHover: '#2980b9',
    infoColorPressed: '#1f4e79',
    
    successColor: '#27ae60',
    successColorHover: '#2ecc71',
    successColorPressed: '#229954',
    
    textColorBase: '#ffffff',
    borderRadius: '6px',
  },
  Button: {
    textColor: '#ffffff',
    fontWeight: '600',
    borderRadius: '6px',
  },
  Badge: {
    color: '#ff4757',
    textColor: '#ffffff',
    fontWeight: '700',
  }
}

// Props
interface Props {
  totalBetAmount: number
  currentBets: Record<string, number>
  lastBets: Record<string, number>
  balance: number
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'cancel-current-bets': []
  'clear-field': []
  'clear-all-field': []
  'rebet': []
  'confirm-bets': []
}>()

// 使用 BettingStore
const bettingStore = useBettingStore()

// 获取游戏数据
const { refreshBalance, userInfo, tableInfo } = useGameData()

// 使用 Naive UI 消息组件
const message = useMessage()

// 响应式数据
const isSubmitting = ref(false)
const showRoadmap = ref(false)

// 路纸相关 - 获取当前tableId
const currentTableId = computed(() => {
  return tableInfo.value?.id || tableInfo.value?.table_id || 'default'
})

// 计算属性
const currentBetCount = computed(() => {
  return Object.keys(props.currentBets).length
})

const lastBetAmount = computed(() => {
  return Object.values(props.lastBets).reduce((sum, amount) => sum + amount, 0)
})

const canCancel = computed(() => {
  return props.totalBetAmount > 0
})

const canRebet = computed(() => {
  return Object.keys(props.lastBets).length > 0 && lastBetAmount.value > 0
})

const canConfirm = computed(() => {
  return props.totalBetAmount > 0 && props.totalBetAmount <= props.balance && !isSubmitting.value
})

// 格式化金额显示
const formatAmount = (amount: number): string => {
  if (amount >= 10000) {
    return `${(amount / 10000).toFixed(1)}万`
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K`
  }
  return amount.toString()
}

// 获取确认按钮文字
const getConfirmButtonText = (): string => {
  if (isSubmitting.value) return '提交中...'
  if (!canConfirm.value) return '确认投注'
  
  const hasConfirmedBets = Object.keys(bettingStore.confirmedBets).length > 0
  return hasConfirmedBets ? '追加投注' : '确认投注'
}

// 提交真实投注
const submitRealBets = async () => {
  if (!canConfirm.value || isSubmitting.value) return
  
  isSubmitting.value = true
  
  try {
    console.log('📤 开始提交投注:', props.currentBets)
    
    const apiService = getGlobalApiService()
    if (!apiService) {
      throw new Error('API服务未初始化')
    }
    
    // 转换投注数据格式
    const betRequests: BetRequest[] = Object.entries(props.currentBets).map(([betType, amount]) => ({
      money: amount,
      rate_id: bettingStore.getBetTypeId(betType) || 1
    }))
    
    console.log('🎯 投注请求数据:', betRequests)
    
    // 提交投注
    const response: BetResponse = await apiService.placeBets(betRequests)
    
    console.log('✅ 投注成功:', response)
    
    // 发出确认事件
    emit('confirm-bets')
    
    const actionText = Object.keys(bettingStore.confirmedBets).length > 0 ? 
      '追加成功' : '投注成功'
    
    // 确认当前投注到已确认投注
    bettingStore.confirmCurrentBets()
    
    // 投注成功后刷新余额
    try {
      console.log('💰 投注成功，正在刷新余额...')
      await refreshBalance()
      console.log('✅ 余额刷新成功')
    } catch (balanceError) {
      console.error('❌ 刷新余额失败:', balanceError)
    }
    
    message.success(actionText)
    
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || '投注提交失败'
    message.error(errorMessage)
    
  } finally {
    isSubmitting.value = false
  }
}

// 🔥 修改：事件处理 - 添加状态检查和提示
const handleCancel = () => {
  // 🔥 新增：检查投注状态，显示提示
  if (!bettingStore.canPlaceBet) {
    showBettingBlockedMessage(bettingStore.bettingPhase, message)
    return
  }
  
  if (!canCancel.value) return
  if (props.totalBetAmount > 0) {
    emit('cancel-current-bets')
  }
}

const handleRebet = () => {
  // 🔥 新增：检查投注状态，显示提示
  if (!bettingStore.canPlaceBet) {
    showBettingBlockedMessage(bettingStore.bettingPhase, message)
    return
  }
  
  if (!canRebet.value) return
  emit('rebet')
}

const handleConfirm = () => {
  // 🔥 新增：检查投注状态，显示提示
  if (!bettingStore.canPlaceBet) {
    showBettingBlockedMessage(bettingStore.bettingPhase, message)
    return
  }
  
  if (!canConfirm.value) return
  if (isSubmitting.value) return
  
  console.log('🎯 确认投注按钮被点击')
  submitRealBets()
}

const handleShowRoadmap = () => {
  console.log('📊 打开路纸，当前tableId:', currentTableId.value)
  showRoadmap.value = true
}

const handleRoadmapClose = () => {
  showRoadmap.value = false
  console.log('📊 关闭路纸')
}

// 开发模式调试
onMounted(() => {
  console.log('🎯 ControlButtons 组件已挂载', {
    canConfirm: canConfirm.value,
    totalBetAmount: props.totalBetAmount,
    currentTableId: currentTableId.value
  })
  
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    ;(window as any).debugControlButtons = {
      canConfirm,
      canCancel,
      canRebet,
      submitRealBets,
      currentTableId,
      showRoadmap: () => showRoadmap.value = true
    }
    console.log('🐛 控制按钮调试工具已添加到 window.debugControlButtons')
  }
})
</script>

<style scoped>
.control-buttons {
  background: rgba(0, 0, 0, 0.95);
  border-top: 1px solid #2d5a42;
  padding: 8px;
  padding-bottom: max(8px, env(safe-area-inset-bottom));
  position: relative;
  z-index: 100;
}

.main-controls {
  width: 100%;
  display: flex;
}

.control-button {
  flex: 1;
  height: 48px;
  font-weight: 600;
  position: relative;
  transition: all 0.3s ease;
  font-size: 12px;
}

.control-button:active {
  transform: scale(0.98);
}

.confirm-button.pulsing {
  animation: confirmPulse 2s infinite;
}

@keyframes confirmPulse {
  0%, 100% { 
    box-shadow: 0 0 0 0 rgba(39, 174, 96, 0.4);
  }
  50% { 
    box-shadow: 0 0 0 8px rgba(39, 174, 96, 0);
  }
}

.button-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  z-index: 10;
}

/* 响应式设计 */
@media (max-width: 375px) {
  .control-button {
    height: 44px;
    font-size: 11px;
  }
}

@media (max-width: 320px) {
  .control-button {
    height: 40px;
    font-size: 10px;
  }
  
  .control-buttons {
    padding: 6px;
  }
}

@media (orientation: landscape) and (max-height: 500px) {
  .control-button {
    height: 40px;
    font-size: 11px;
  }
  
  .control-buttons {
    padding: 6px;
  }
}

/* Naive UI 按钮组样式 */
:deep(.n-button-group .n-button) {
  border-radius: 6px !important;
}

:deep(.n-button-group .n-button:first-child) {
  border-top-right-radius: 0 !important;
  border-bottom-right-radius: 0 !important;
}

:deep(.n-button-group .n-button:last-child) {
  border-top-left-radius: 0 !important;
  border-bottom-left-radius: 0 !important;
}

:deep(.n-button-group .n-button:not(:first-child):not(:last-child)) {
  border-radius: 0 !important;
}

:deep(.n-badge .n-badge-sup) {
  background: #ff4757 !important;
  color: white !important;
  font-weight: 700 !important;
  border: 1px solid white !important;
  font-size: 10px !important;
}
</style>