<template>
  <div class="control-buttons">
    <!-- 保持 Naive UI 配置提供者 - 添加 Safari 兼容性配置 -->
    <n-config-provider :theme-overrides="safariOptimizedTheme">
      <!-- 主要控制按钮组 -->
      <n-button-group class="main-controls">
        <!-- 取消按钮 -->
        <n-button
          type="error"
          size="large"
          :disabled="!canCancel"
          @click="handleCancel"
          @contextmenu.prevent="handleClearAll"
          @touchstart="handleTouchStart"
          @touchend="handleTouchEnd"
          class="control-button cancel-button safari-button-fix"
          ref="cancelButtonRef"
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
          @touchstart="handleTouchStart"
          @touchend="handleTouchEnd"
          class="control-button rebet-button safari-button-fix"
          ref="rebetButtonRef"
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
          @touchstart="handleTouchStart"
          @touchend="handleTouchEnd"
          class="control-button confirm-button safari-button-fix"
          :class="{ 'pulsing': canConfirm && totalBetAmount > 0 }"
          ref="confirmButtonRef"
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
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, nextTick } from 'vue'
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
import { useBettingStore } from '@/stores/bettingStore'
import { useGameData } from '@/composables/useGameData'
import { getGlobalApiService } from '@/services/gameApi'
import type { BetRequest, BetResponse } from '@/services/gameApi'

// 🔥 Safari 检测
const isSafari = () => {
  const userAgent = navigator.userAgent.toLowerCase()
  return userAgent.includes('safari') && !userAgent.includes('chrome') && !userAgent.includes('chromium')
}

const isIOSSafari = () => {
  const userAgent = navigator.userAgent.toLowerCase()
  return /iphone|ipad|ipod/.test(userAgent) && userAgent.includes('safari')
}

// 🔥 Safari 优化的主题配置
const safariOptimizedTheme = computed(() => {
  const baseTheme = {
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
      
      borderRadius: '6px',
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
    Badge: {
      color: '#ff4757',
      textColor: '#ffffff',
      fontWeight: '700',
    }
  }

  // 🔥 Safari 特定优化
  if (isSafari()) {
    return {
      ...baseTheme,
      Button: {
        ...baseTheme.Button,
        // Safari 特定优化
        borderRadius: '6px', // 使用更保守的圆角
        fontWeight: '600',
        // 移除可能有问题的 CSS 属性
        backdropFilter: 'none',
      }
    }
  }

  return baseTheme
})

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

// 获取useGameData的refreshBalance方法
const { refreshBalance } = useGameData()

// 使用 Naive UI 消息组件
const message = useMessage()

// 响应式数据
const isSubmitting = ref(false)

// 🔥 按钮引用
const cancelButtonRef = ref()
const rebetButtonRef = ref()
const confirmButtonRef = ref()

// 🔥 触摸事件处理（Safari 兼容性）
const touchStartTime = ref(0)
const isTouching = ref(false)

const handleTouchStart = (event: TouchEvent) => {
  if (!isSafari()) return
  
  touchStartTime.value = Date.now()
  isTouching.value = true
  
  // 添加视觉反馈
  const target = event.currentTarget as HTMLElement
  target.style.transform = 'scale(0.98)'
  target.style.transition = 'transform 0.1s ease'
}

const handleTouchEnd = (event: TouchEvent) => {
  if (!isSafari()) return
  
  const target = event.currentTarget as HTMLElement
  target.style.transform = 'scale(1)'
  
  isTouching.value = false
  
  // 计算触摸时间，如果是短按，触发点击
  const touchDuration = Date.now() - touchStartTime.value
  if (touchDuration < 500) { // 500ms 内的触摸认为是点击
    // 延迟一小段时间确保触摸事件完成
    setTimeout(() => {
      // 手动触发点击事件（Safari 兼容性）
      target.click()
    }, 10)
  }
}

// 计算属性
const currentBetCount = computed(() => {
  return Object.keys(props.currentBets).filter(key => props.currentBets[key] > 0).length
})

const lastBetAmount = computed(() => {
  return Object.values(props.lastBets).reduce((sum, amount) => sum + amount, 0)
})

const canCancel = computed(() => {
  return props.totalBetAmount > 0
})

const canRebet = computed(() => {
  return lastBetAmount.value > 0 && props.balance >= lastBetAmount.value 
})

const canConfirm = computed(() => {
  return props.totalBetAmount > 0 && !isSubmitting.value && bettingStore.canPlaceBet
})

// 获取确认按钮文本
const getConfirmButtonText = (): string => {
  if (isSubmitting.value) {
    return '提交中...'
  }
  
  if (bettingStore.bettingPhase === 'confirmed' && props.totalBetAmount > 0) {
    return '追加投注'
  }
  
  return '确认投注'
}

// 方法
const formatAmount = (amount: number): string => {
  if (amount >= 10000) {
    return (amount / 10000).toFixed(1) + 'W'
  } else if (amount >= 1000) {
    return (amount / 1000).toFixed(1) + 'K'
  }
  return amount.toString()
}

// 投注数据转换 - 发送累计总金额
const prepareBetRequests = (displayBets: Record<string, { current: number; confirmed: number; total: number }>): BetRequest[] => {
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
  
  // 发送累计总金额
  Object.entries(displayBets).forEach(([betType, betData]) => {
    const rateId = betTypeToRateId[betType]
    if (rateId && betData.total > 0) {
      betRequests.push({
        money: betData.total,
        rate_id: rateId
      })
    }
  })
  
  return betRequests
}

// 真实投注提交 - 增加余额刷新
const submitRealBets = async (): Promise<void> => {
  try {
    isSubmitting.value = true
    
    // 🔥 Safari 防重复提交
    if (isSafari() && isTouching.value) {
      console.log('🚫 Safari 触摸事件进行中，跳过提交')
      return
    }
    
    // 发送 displayBets 的累计总金额
    const betRequests = prepareBetRequests(bettingStore.displayBets)
    
    if (betRequests.length === 0) {
      message.error('没有有效的投注数据')
      return
    }
    
    // 调用API
    const apiService = getGlobalApiService()
    const result: BetResponse = await apiService.placeBets(betRequests)
    
    // 投注成功处理
    const isFirstBet = bettingStore.bettingPhase === 'betting'
    const actionText = isFirstBet ? '投注成功' : '追加成功'
    
    // 确认当前投注到已确认投注
    bettingStore.confirmCurrentBets()
    
    // 投注成功后刷新余额
    try {
      console.log('💰 投注成功，正在刷新余额...')
      await refreshBalance()
      console.log('✅ 余额刷新成功')
    } catch (balanceError) {
      console.error('❌ 刷新余额失败:', balanceError)
      // 不影响投注成功的提示，只是余额可能不是最新的
    }
    
    // 显示简化的成功消息
    message.success(actionText)
    
  } catch (error: any) {
    // 错误处理
    const errorMessage = error.response?.data?.message || error.message || '投注提交失败'
    message.error(errorMessage)
    
  } finally {
    isSubmitting.value = false
  }
}

const handleCancel = () => {
  if (!canCancel.value) return
  
  if (props.totalBetAmount > 0) {
    emit('cancel-current-bets')
  }
}

const handleClearAll = () => {
  bettingStore.clearAllBets()
  emit('clear-all-field')
  message.info('已清除所有投注')
}

const handleRebet = () => {
  if (!canRebet.value) return
  emit('rebet')
}

const handleConfirm = () => {
  if (!canConfirm.value) return
  
  // 🔥 Safari 兼容性：添加防抖处理
  if (isSubmitting.value) {
    console.log('🚫 正在提交中，忽略重复点击')
    return
  }
  
  console.log('🎯 确认投注按钮被点击')
  submitRealBets()
}

// 🔥 Safari 按钮修复函数
const applySafariButtonFixes = () => {
  if (!isSafari()) return
  
  console.log('🔧 应用 Safari 按钮修复...')
  
  nextTick(() => {
    const buttons = [cancelButtonRef.value, rebetButtonRef.value, confirmButtonRef.value]
    
    buttons.forEach((buttonRef, index) => {
      if (buttonRef?.$el) {
        const buttonElement = buttonRef.$el as HTMLElement
        
        // 添加 Safari 特定样式
const style = buttonElement.style as any
style.cursor = 'pointer'
style.webkitTapHighlightColor = 'transparent'
style.webkitTouchCallout = 'none'
style.webkitUserSelect = 'none'
style.userSelect = 'none'
        
        // 确保按钮可见
        buttonElement.style.display = 'flex'
        buttonElement.style.visibility = 'visible'
        buttonElement.style.opacity = '1'
        
        // 添加 Safari 标识
        buttonElement.setAttribute('data-safari-fixed', 'true')
        
        console.log(`🔧 按钮 ${index + 1} Safari 修复完成`)
      }
    })
  })
}

// 🔥 强制刷新按钮状态（调试用）
const refreshButtonStates = () => {
  console.log('🔄 刷新按钮状态', {
    canCancel: canCancel.value,
    canRebet: canRebet.value,
    canConfirm: canConfirm.value,
    totalBetAmount: props.totalBetAmount,
    isSubmitting: isSubmitting.value
  })
  
  // 如果是 Safari，重新应用修复
  if (isSafari()) {
    applySafariButtonFixes()
  }
}

// 生命周期
onMounted(() => {
  console.log('🎯 ControlButtons 组件已挂载', {
    isSafari: isSafari(),
    isIOSSafari: isIOSSafari(),
    canConfirm: canConfirm.value,
    totalBetAmount: props.totalBetAmount
  })
  
  // Safari 特殊处理
  if (isSafari()) {
    // 延迟应用修复，确保 Naive UI 完全渲染
    setTimeout(() => {
      applySafariButtonFixes()
    }, 100)
    
    // 再次延迟检查
    setTimeout(() => {
      refreshButtonStates()
    }, 500)
  }
  
  // 🔥 开发模式下暴露调试方法
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    ;(window as any).debugControlButtons = {
      refreshButtonStates,
      applySafariButtonFixes,
      canConfirm: canConfirm,
      canCancel: canCancel,
      canRebet: canRebet,
      submitRealBets,
      buttonRefs: {
        cancel: cancelButtonRef,
        rebet: rebetButtonRef,
        confirm: confirmButtonRef
      }
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
  
  /* 🔥 Safari 兼容性 */
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

/* 🔥 Safari 按钮修复类 */
.safari-button-fix {
  /* 确保在 Safari 中正确显示 */
  display: flex !important;
  visibility: visible !important;
  opacity: 1 !important;
  cursor: pointer !important;
  
  /* Safari 特定优化 */
  -webkit-tap-highlight-color: transparent !important;
  -webkit-touch-callout: none !important;
  -webkit-user-select: none !important;
  user-select: none !important;
  
  /* 确保触摸事件正常 */
  touch-action: manipulation !important;
  
  /* 防止 Safari 中的变形 */
  -webkit-appearance: none !important;
  -webkit-transform: translateZ(0) !important;
  transform: translateZ(0) !important;
}

/* 🔥 Safari 触摸反馈 */
.safari-button-fix:active {
  transform: scale(0.98) translateZ(0) !important;
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

/* 🔥 Safari 特定修复 */
@supports (-webkit-touch-callout: none) {
  .safari-button-fix {
    /* Safari 特定样式 */
    -webkit-touch-callout: none !important;
    -webkit-user-select: none !important;
    user-select: none !important;
  }
  
  .safari-button-fix:active {
    /* Safari 点击反馈 */
    transform: scale(0.95) translateZ(0) !important;
    transition: transform 0.1s ease !important;
  }
}

/* 🔥 iOS Safari 特定修复 */
@media screen and (-webkit-min-device-pixel-ratio: 2) {
  .safari-button-fix {
    /* 高分辨率屏幕优化 */
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
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

/* 🔥 确保 Naive UI 按钮组样式在 Safari 中正确 */
:deep(.n-button-group .n-button) {
  border-radius: 6px !important;
  display: flex !important;
  visibility: visible !important;
  opacity: 1 !important;
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

/* 🔥 Safari 深度选择器修复 */
:deep(.safari-button-fix .n-button__content) {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 4px !important;
}

:deep(.safari-button-fix .n-button__icon) {
  display: flex !important;
  align-items: center !important;
}

/* 🔥 确保加载状态在 Safari 中可见 */
:deep(.safari-button-fix .n-button__icon .n-base-loading) {
  color: currentColor !important;
}

/* 🔥 减少动画模式兼容 */
@media (prefers-reduced-motion: reduce) {
  .control-button,
  .safari-button-fix {
    animation: none !important;
    transition: none !important;
  }
}
</style>