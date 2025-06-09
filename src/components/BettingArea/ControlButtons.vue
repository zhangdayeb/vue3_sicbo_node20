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

      <!-- 确认对话框 -->
      <n-modal
        v-model:show="showConfirmDialog"
        preset="dialog"
        :type="dialogType"
        :title="confirmTitle"
        :positive-text="confirmButtonText"
        :negative-text="'取消'"
        :mask-closable="true"
        :close-on-esc="true"
        :on-positive-click="confirmAction"
        :on-negative-click="cancelConfirm"
        class="confirm-dialog"
      >
        <template #header>
          <n-space align="center">
            <n-icon size="20" :color="getDialogIconColor()">
              <component :is="getDialogIcon()" />
            </n-icon>
            <span>{{ confirmTitle }}</span>
          </n-space>
        </template>

        <div class="dialog-content">
          <p class="dialog-message">{{ confirmMessage }}</p>
          
          <!-- 详细信息卡片 -->
          <n-card 
            v-if="confirmDetails" 
            size="small" 
            class="details-card"
            :bordered="false"
          >
            <template #header>
              <n-space align="center" size="small">
                <n-icon size="16" :color="getDialogIconColor()">
                  <InfoIcon />
                </n-icon>
                <n-text depth="2">详细信息</n-text>
              </n-space>
            </template>
            
            <n-space vertical size="small">
              <div 
                v-for="detail in confirmDetails" 
                :key="detail.label" 
                class="detail-row"
              >
                <n-space justify="space-between" align="center">
                  <n-text depth="2">{{ detail.label }}:</n-text>
                  <n-text 
                    strong 
                    :type="getDetailValueType(detail.label)"
                    class="detail-value"
                  >
                    {{ detail.value }}
                  </n-text>
                </n-space>
              </div>
            </n-space>
          </n-card>
          
          <!-- 风险提示 -->
          <n-alert 
            v-if="shouldShowRiskWarning()" 
            type="warning" 
            size="small"
            class="risk-warning"
            :show-icon="true"
          >
            <template #header>风险提示</template>
            {{ getRiskWarningText() }}
          </n-alert>
        </div>
      </n-modal>
    </n-config-provider>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { 
  NConfigProvider,
  NButtonGroup,
  NButton, 
  NCard, 
  NSpace, 
  NText, 
  NIcon, 
  NAlert,
  NModal,
  NBadge,
  useMessage
} from 'naive-ui'
import {
  TrashOutline as TrashIcon,
  RefreshOutline as RefreshIcon,
  CheckmarkCircleOutline as CheckmarkIcon,
  WarningOutline as WarningIcon,
  InformationCircleOutline as InfoIcon,
  AlertCircleOutline as AlertIcon
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
const showConfirmDialog = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
const confirmButtonText = ref('')
const confirmDetails = ref<Array<{label: string, value: string}> | null>(null)
const pendingAction = ref<(() => void) | null>(null)
const dialogType = ref<'info' | 'success' | 'warning' | 'error'>('info')
const actionType = ref<'cancel' | 'clear' | 'clearAll' | 'rebet' | 'confirm'>('confirm')
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
      throw new Error('没有有效的投注数据')
    }
    
    // 调用API
    const apiService = getGlobalApiService()
    const result: BetResponse = await apiService.placeBets(betRequests)
    
    // 处理成功结果
    message.success(`投注成功！消费: ¥${result.money_spend}`)
    
    // 触发原有的确认事件（清空本地投注）
    emit('confirm-bets')
    
  } catch (error: any) {
    let errorMessage = '投注失败，请重试'
    
    // 根据错误类型提供具体提示
    if (error.message?.includes('balance') || error.message?.includes('余额')) {
      errorMessage = '余额不足，请充值后重试'
    } else if (error.message?.includes('token') || error.code === 'UNAUTHORIZED') {
      errorMessage = '登录已过期，请重新登录'
    } else if (error.message?.includes('betting') || error.message?.includes('投注')) {
      errorMessage = '当前不在投注时间'
    } else if (error.message?.includes('network') || error.code === 'NETWORK_ERROR') {
      errorMessage = '网络连接失败，请检查网络'
    } else if (error.message) {
      errorMessage = error.message
    }
    
    message.error(errorMessage)
    console.error('投注API调用失败:', error)
  } finally {
    isSubmitting.value = false
  }
}

const getDialogType = (action: string) => {
  switch (action) {
    case 'cancel':
    case 'clear':
    case 'clearAll':
      return 'warning'
    case 'rebet':
      return 'info'
    case 'confirm':
      return 'success'
    default:
      return 'info'
  }
}

const getDialogIcon = () => {
  switch (actionType.value) {
    case 'cancel':
    case 'clear':
    case 'clearAll':
      return TrashIcon
    case 'rebet':
      return RefreshIcon
    case 'confirm':
      return CheckmarkIcon
    default:
      return InfoIcon
  }
}

const getDialogIconColor = () => {
  switch (actionType.value) {
    case 'cancel':
    case 'clear':
    case 'clearAll':
      return '#f39c12'
    case 'rebet':
      return '#00bcd4'
    case 'confirm':
      return '#27ae60'
    default:
      return '#00bcd4'
  }
}

const getDetailValueType = (label: string) => {
  if (label.includes('金额') || label.includes('余额')) {
    return 'success'
  }
  if (label.includes('项目') || label.includes('投注')) {
    return 'info'
  }
  return 'default'
}

const shouldShowRiskWarning = () => {
  if (actionType.value === 'confirm' && props.totalBetAmount > props.balance * 0.5) {
    return true
  }
  if (actionType.value === 'rebet' && lastBetAmount.value > props.balance * 0.3) {
    return true
  }
  return false
}

const getRiskWarningText = () => {
  if (actionType.value === 'confirm') {
    return '投注金额较大，请谨慎操作。建议合理控制投注风险。'
  }
  if (actionType.value === 'rebet') {
    return '重复投注金额较大，请确认您的投注策略。'
  }
  return ''
}

const handleCancel = () => {
  if (!canCancel.value) return
  
  if (props.totalBetAmount > 0) {
    actionType.value = 'cancel'
    showConfirmation(
      '取消投注',
      '确定要取消当前投注吗？将恢复到上次确认的状态。',
      '取消投注',
      [
        { label: '当前投注', value: `${betCount.value} 项` },
        { label: '投注金额', value: `¥${props.totalBetAmount.toLocaleString()}` }
      ],
      () => emit('cancel-current-bets')
    )
  } else if (hasLastConfirmedBets.value) {
    actionType.value = 'clear'
    showConfirmation(
      '清场操作',
      '确定要清场吗？将清除所有筹码展示。',
      '确认清场',
      [
        { label: '操作类型', value: '清场' },
        { label: '影响范围', value: '所有筹码展示' }
      ],
      () => emit('clear-field')
    )
  }
}

const handleClearAll = () => {
  actionType.value = 'clearAll'
  showConfirmation(
    '完全清场',
    '确定要完全清场吗？这将清除所有投注记录和筹码展示。',
    '完全清场',
    [
      { label: '操作类型', value: '完全清场' },
      { label: '影响范围', value: '所有记录和展示' }
    ],
    () => emit('clear-all-field')
  )
}

const handleRebet = () => {
  if (!canRebet.value) return
  
  const lastBetCount = Object.keys(props.lastBets).filter(key => props.lastBets[key] > 0).length
  
  actionType.value = 'rebet'
  showConfirmation(
    '重复投注',
    '确定要重复上次的投注吗？',
    '重复投注',
    [
      { label: '上次投注', value: `${lastBetCount} 项` },
      { label: '投注金额', value: `¥${lastBetAmount.value.toLocaleString()}` },
      { label: '投注后余额', value: `¥${(props.balance - lastBetAmount.value).toLocaleString()}` }
    ],
    () => emit('rebet')
  )
}

const handleConfirm = () => {
  if (!canConfirm.value) return
  
  actionType.value = 'confirm'
  showConfirmation(
    '确认投注',
    '确定要提交当前投注吗？投注一旦确认将无法撤销。',
    '确认投注',
    [
      { label: '投注项目', value: `${betCount.value} 项` },
      { label: '投注金额', value: `¥${props.totalBetAmount.toLocaleString()}` },
      { label: '投注后余额', value: `¥${(props.balance - props.totalBetAmount).toLocaleString()}` }
    ],
    () => submitRealBets()
  )
}

const showConfirmation = (
  title: string,
  messageText: string,
  buttonText: string,
  details: Array<{label: string, value: string}> | null,
  action: () => void
) => {
  confirmTitle.value = title
  confirmMessage.value = messageText
  confirmButtonText.value = buttonText
  confirmDetails.value = details
  pendingAction.value = action
  dialogType.value = getDialogType(actionType.value)
  showConfirmDialog.value = true
}

const confirmAction = () => {
  if (pendingAction.value) {
    pendingAction.value()
    
    // 显示成功消息（除了确认投注，因为它有自己的处理）
    if (actionType.value !== 'confirm') {
      const actionNames = {
        cancel: '已取消投注',
        clear: '已清场',
        clearAll: '已完全清场',
        rebet: '已重复投注'
      }
      
      const actionName = actionNames[actionType.value as keyof typeof actionNames]
      if (actionName) {
        message.success(actionName)
      }
    }
  }
  cancelConfirm()
  return true
}

const cancelConfirm = () => {
  showConfirmDialog.value = false
  confirmTitle.value = ''
  confirmMessage.value = ''
  confirmButtonText.value = ''
  confirmDetails.value = null
  pendingAction.value = null
  return true
}
</script>

<style scoped>
.control-buttons {
  background: rgba(0, 0, 0, 0.95);
  border-top: 1px solid #2d5a42;
  padding: 8px;
  /* iOS Safari安全区域适配 */
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

/* 确认按钮脉冲动画 */
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

/* 徽章样式 */
.button-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  z-index: 10;
}

/* 对话框内容样式 */
.dialog-content {
  padding: 8px 0;
}

.dialog-message {
  margin: 0 0 16px 0;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.9);
}

.details-card {
  margin: 16px 0;
  background: rgba(45, 90, 66, 0.3) !important;
  border: 1px solid rgba(255, 215, 0, 0.2) !important;
}

.detail-row {
  padding: 4px 0;
}

.detail-value {
  font-family: 'Monaco', 'Menlo', monospace;
  letter-spacing: 0.5px;
}

.risk-warning {
  margin-top: 16px;
  background: rgba(243, 156, 18, 0.1) !important;
  border: 1px solid rgba(243, 156, 18, 0.3) !important;
}

/* 响应式适配 */
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

/* 横屏适配 */
@media (orientation: landscape) and (max-height: 500px) {
  .control-button {
    height: 40px;
    font-size: 11px;
  }
  
  .control-buttons {
    padding: 6px;
  }
}

/* 深度样式覆盖 */
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

:deep(.n-modal .n-dialog) {
  background: rgba(13, 40, 24, 0.98) !important;
  border: 2px solid #2d5a42 !important;
  backdrop-filter: blur(12px);
}

:deep(.n-modal .n-dialog .n-dialog__title) {
  color: #ffd700 !important;
  font-weight: 700 !important;
}

:deep(.n-badge .n-badge-sup) {
  background: #ff4757 !important;
  color: white !important;
  font-weight: 700 !important;
  border: 1px solid white !important;
  font-size: 10px !important;
}
</style>