<template>
  <div class="control-buttons">
    <!-- Naive UI 配置提供者 - 应用游戏主题 -->
    <n-config-provider :theme-overrides="gameTheme">
      <!-- 主要控制按钮组 -->
      <n-button-group class="main-controls">
        <!-- 取消按钮 -->
        <n-button
          type="error"
          size="large"
          :disabled="!canCancel"
          @click="handleCancel"
          @contextmenu.prevent="handleClearAll"
          class="control-button cancel-button"
        >
          <template #icon>
            <n-icon><TrashIcon /></n-icon>
          </template>
          取消
          <n-badge
            v-if="canCancel && betCount > 0"
            :value="betCount"
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
          {{ isSubmitting ? '提交中...' : '确认' }}
          <n-badge
            v-if="totalBetAmount > 0"
            :value="formatAmount(totalBetAmount)"
            :max="999"
            class="button-badge"
          />
        </n-button>
      </n-button-group>
    </n-config-provider>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
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
  CheckmarkCircleOutline as CheckmarkIcon
} from '@vicons/ionicons5'
import { getGlobalApiService } from '@/services/gameApi'
import type { BetRequest, BetResponse } from '@/services/gameApi'

// 游戏主题配置
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
    
    successColor: '#27ae60',
    successColorHover: '#2ecc71',
    successColorPressed: '#229954',
    
    textColorBase: '#ffffff',
    textColor1: 'rgba(255, 255, 255, 0.95)',
    textColor2: 'rgba(255, 255, 255, 0.82)',
    
    baseColor: 'rgba(13, 40, 24, 0.95)',
    modalColor: 'rgba(0, 0, 0, 0.9)',
    cardColor: 'rgba(45, 90, 66, 0.4)',
    
    borderRadius: '8px',
    borderColor: 'rgba(255, 215, 0, 0.3)',
    
    boxShadow1: '0 2px 8px rgba(0, 0, 0, 0.3)',
    boxShadow2: '0 4px 16px rgba(0, 0, 0, 0.4)',
  },
  Button: {
    textColor: '#ffffff',
    textColorHover: '#ffffff',
    textColorPressed: '#ffffff',
    textColorFocus: '#ffffff',
    
    colorError: '#e74c3c',
    colorErrorHover: '#c0392b',
    colorErrorPressed: '#a93226',
    
    colorWarning: '#f39c12',
    colorWarningHover: '#e67e22',
    colorWarningPressed: '#d68910',
    
    colorSuccess: '#27ae60',
    colorSuccessHover: '#2ecc71',
    colorSuccessPressed: '#229954',
    
    fontWeight: '600',
    borderRadius: '6px',
  },
  Card: {
    color: 'rgba(45, 90, 66, 0.4)',
    borderColor: 'rgba(255, 215, 0, 0.2)',
    titleTextColor: '#ffd700',
    textColor: 'rgba(255, 255, 255, 0.9)',
  },
  Dialog: {
    color: 'rgba(13, 40, 24, 0.95)',
    textColor: 'rgba(255, 255, 255, 0.95)',
    titleTextColor: '#ffd700',
    borderColor: 'rgba(255, 215, 0, 0.3)',
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

// 使用 Naive UI 消息组件
const message = useMessage()

// 响应式数据
const isSubmitting = ref(false)

// 计算属性
const betCount = computed(() => {
  return Object.keys(props.currentBets).filter(key => props.currentBets[key] > 0).length
})

const lastBetAmount = computed(() => {
  return Object.values(props.lastBets).reduce((sum, amount) => sum + amount, 0)
})

const canCancel = computed(() => {
  return (props.totalBetAmount > 0 || hasLastConfirmedBets.value) 
})

const hasLastConfirmedBets = computed(() => {
  return Object.values(props.lastBets).some(amount => amount > 0)
})

const canRebet = computed(() => {
  return lastBetAmount.value > 0 && props.balance >= lastBetAmount.value 
})

const canConfirm = computed(() => {
  return props.totalBetAmount > 0 && !isSubmitting.value
})

// 方法
const formatAmount = (amount: number): string => {
  if (amount >= 10000) {
    return (amount / 10000).toFixed(1) + 'W'
  } else if (amount >= 1000) {
    return (amount / 1000).toFixed(1) + 'K'
  }
  return amount.toString()
}

// 投注数据转换
const prepareBetRequests = (currentBets: Record<string, number>): BetRequest[] => {
  const betRequests: BetRequest[] = []
  
  // 投注类型到API rate_id的映射
  const betTypeToRateId: Record<string, number> = {
    // 大小单双
    'small': 304,
    'big': 305, 
    'odd': 306,
    'even': 307,
    
    // 点数投注
    'total-4': 308,
    'total-5': 309,
    'total-6': 310,
    'total-7': 311,
    'total-8': 312,
    'total-9': 313,
    'total-10': 314,
    'total-11': 315,
    'total-12': 316,
    'total-13': 317,
    'total-14': 318,
    'total-15': 319,
    'total-16': 320,
    'total-17': 321,
    
    // 单骰投注
    'single-1': 322,
    'single-2': 323,
    'single-3': 324,
    'single-4': 325,
    'single-5': 326,
    'single-6': 327,
    
    // 对子投注
    'pair-1': 328,
    'pair-2': 329,
    'pair-3': 330,
    'pair-4': 331,
    'pair-5': 332,
    'pair-6': 333,
    
    // 三同号投注
    'triple-1': 334,
    'triple-2': 335,
    'triple-3': 336,
    'triple-4': 337,
    'triple-5': 338,
    'triple-6': 339,
    
    // 全围
    'any-triple': 340,
    
    // 组合投注
    'combo-1-2': 341,
    'combo-1-3': 342,
    'combo-1-4': 343,
    'combo-1-5': 344,
    'combo-1-6': 345,
    'combo-2-3': 346,
    'combo-2-4': 347,
    'combo-2-5': 348,
    'combo-2-6': 349,
    'combo-3-4': 350,
    'combo-3-5': 351,
    'combo-3-6': 352,
    'combo-4-5': 353,
    'combo-4-6': 354,
    'combo-5-6': 355
  }
  
  // 转换每个投注
  Object.entries(currentBets).forEach(([betType, amount]) => {
    const rateId = betTypeToRateId[betType]
    if (rateId && amount > 0) {
      betRequests.push({
        money: amount,
        rate_id: rateId
      })
    }
  })
  
  return betRequests
}

// 真实投注提交
const submitRealBets = async (): Promise<void> => {
  try {
    isSubmitting.value = true
    
    // 准备投注数据
    const betRequests = prepareBetRequests(props.currentBets)
    
    if (betRequests.length === 0) {
      message.error('没有有效的投注数据')
      return
    }
    
    // 调用API
    const apiService = getGlobalApiService()
    const result: BetResponse = await apiService.placeBets(betRequests)
    
    // 处理成功结果
    message.success(`投注成功！消费: ¥${result.money_spend}`)
    
    // 触发原有的确认事件（清空本地投注）
    emit('confirm-bets')
    
  } catch (error: any) {
    // 直接使用后台返回的错误信息
    const errorMessage = error.response?.data?.message || error.message || '请求失败'
    message.error(errorMessage)
    
  } finally {
    isSubmitting.value = false
  }
}

const handleCancel = () => {
  if (!canCancel.value) return
  
  if (props.totalBetAmount > 0) {
    emit('cancel-current-bets')
  } else if (hasLastConfirmedBets.value) {
    emit('clear-field')
  }
}

const handleClearAll = () => {
  emit('clear-all-field')
}

const handleRebet = () => {
  if (!canRebet.value) return
  emit('rebet')
}

const handleConfirm = () => {
  if (!canConfirm.value) return
  
  // 直接提交投注，无需确认对话框
  submitRealBets()
}
</script>

<style scoped>
.control-buttons {
  background: rgba(0, 0, 0, 0.95);
  border-top: 1px solid #2d5a42;
  padding: 8px;
  padding-bottom: max(8px, env(safe-area-inset-bottom));
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