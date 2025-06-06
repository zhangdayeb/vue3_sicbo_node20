<template>
  <div class="control-buttons">
    <!-- 主要控制按钮行 -->
    <div class="main-controls">
      <button 
        class="control-btn clear-btn" 
        @click="handleClear"
        :disabled="!canClear"
        v-long-press="handleClearAll"
      >
        <div class="btn-content">
          <span class="btn-icon">🗑️</span>
          <span class="btn-text">清除</span>
          <div v-if="canClear" class="btn-badge">{{ betCount }}</div>
        </div>
        <div class="btn-subtitle">长按清除所有</div>
      </button>
      
      <button 
        class="control-btn rebet-btn" 
        @click="handleRebet"
        :disabled="!canRebet"
      >
        <div class="btn-content">
          <span class="btn-icon">🔄</span>
          <span class="btn-text">重复投注</span>
          <div v-if="lastBetAmount > 0" class="btn-badge">{{ lastBetAmount }}</div>
        </div>
        <div class="btn-subtitle">重复上次投注</div>
      </button>
      
      <button 
        class="control-btn confirm-btn" 
        @click="handleConfirm"
        :disabled="!canConfirm"
        :class="{ 'pulsing': canConfirm && totalBetAmount > 0 }"
      >
        <div class="btn-content">
          <span class="btn-icon">✅</span>
          <span class="btn-text">确认投注</span>
          <div v-if="totalBetAmount > 0" class="btn-badge">{{ totalBetAmount }}</div>
        </div>
        <div class="btn-subtitle">提交投注</div>
      </button>
    </div>
    
    <!-- 辅助控制按钮行 -->
    <div class="auxiliary-controls">
      <button 
        class="aux-btn undo-btn"
        @click="handleUndo"
        :disabled="!canUndo"
      >
        <span class="aux-icon">↶</span>
        <span class="aux-text">撤销</span>
      </button>
      
      <button 
        class="aux-btn quick-bet-btn"
        @click="handleQuickBet"
        :disabled="!canQuickBet"
      >
        <span class="aux-icon">⚡</span>
        <span class="aux-text">快速投注</span>
      </button>
      
      <button 
        class="aux-btn max-bet-btn"
        @click="handleMaxBet"
        :disabled="!canMaxBet"
      >
        <span class="aux-icon">💎</span>
        <span class="aux-text">梭哈</span>
      </button>
      
      <button 
        class="aux-btn settings-btn"
        @click="handleSettings"
      >
        <span class="aux-icon">⚙️</span>
        <span class="aux-text">设置</span>
      </button>
    </div>
    
    <!-- 状态指示器 -->
    <div class="status-indicators">
      <div class="status-item">
        <span class="status-label">投注状态:</span>
        <span class="status-value" :class="betStatusClass">{{ betStatusText }}</span>
      </div>
      <div class="status-item" v-if="gamePhase">
        <span class="status-label">游戏阶段:</span>
        <span class="status-value phase" :class="phaseClass">{{ phaseText }}</span>
      </div>
    </div>
    
    <!-- 操作确认弹窗 -->
    <div v-if="showConfirmDialog" class="confirm-dialog-overlay" @click="cancelConfirm">
      <div class="confirm-dialog" @click.stop>
        <div class="dialog-header">
          <h3 class="dialog-title">{{ confirmTitle }}</h3>
        </div>
        <div class="dialog-content">
          <p class="dialog-message">{{ confirmMessage }}</p>
          <div v-if="confirmDetails" class="dialog-details">
            <div v-for="detail in confirmDetails" :key="detail.label" class="detail-item">
              <span class="detail-label">{{ detail.label }}:</span>
              <span class="detail-value">{{ detail.value }}</span>
            </div>
          </div>
        </div>
        <div class="dialog-actions">
          <button class="dialog-btn cancel-btn" @click="cancelConfirm">
            取消
          </button>
          <button class="dialog-btn confirm-action-btn" @click="confirmAction">
            {{ confirmButtonText }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'

// Props
interface Props {
  totalBetAmount: number
  currentBets: Record<string, number>
  lastBets: Record<string, number>
  balance: number
  gamePhase?: 'betting' | 'rolling' | 'result' | 'waiting'
  canBet: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'clear-bets': []
  'clear-all-bets': []
  'rebet': []
  'confirm-bets': []
  'undo-last': []
  'quick-bet': []
  'max-bet': []
  'open-settings': []
}>()

// 响应式数据
const showConfirmDialog = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
const confirmButtonText = ref('')
const confirmDetails = ref<Array<{label: string, value: string}> | null>(null)
const pendingAction = ref<(() => void) | null>(null)

// 计算属性
const betCount = computed(() => {
  return Object.keys(props.currentBets).filter(key => props.currentBets[key] > 0).length
})

const lastBetAmount = computed(() => {
  return Object.values(props.lastBets).reduce((sum, amount) => sum + amount, 0)
})

const canClear = computed(() => {
  return props.totalBetAmount > 0 && props.canBet
})

const canRebet = computed(() => {
  return lastBetAmount.value > 0 && props.balance >= lastBetAmount.value && props.canBet
})

const canConfirm = computed(() => {
  return props.totalBetAmount > 0 && props.canBet
})

const canUndo = computed(() => {
  return props.totalBetAmount > 0 && props.canBet
})

const canQuickBet = computed(() => {
  return props.balance > 0 && props.canBet
})

const canMaxBet = computed(() => {
  return props.balance > props.totalBetAmount && props.canBet
})

const betStatusClass = computed(() => {
  if (props.totalBetAmount === 0) return 'status-empty'
  if (props.totalBetAmount > props.balance * 0.5) return 'status-high'
  return 'status-normal'
})

const betStatusText = computed(() => {
  if (props.totalBetAmount === 0) return '未投注'
  if (props.totalBetAmount > props.balance * 0.5) return '高额投注'
  return '正常投注'
})

const phaseClass = computed(() => {
  return `phase-${props.gamePhase || 'waiting'}`
})

const phaseText = computed(() => {
  const phaseMap = {
    'betting': '投注中',
    'rolling': '开牌中',
    'result': '结算中',
    'waiting': '等待中'
  }
  return phaseMap[props.gamePhase || 'waiting']
})

// 方法
const handleClear = () => {
  if (!canClear.value) return
  
  showConfirmation(
    '清除投注',
    `确定要清除当前的 ${betCount.value} 项投注吗？`,
    '清除',
    [
      { label: '投注项目', value: `${betCount.value} 项` },
      { label: '投注金额', value: `¥${props.totalBetAmount.toLocaleString()}` }
    ],
    () => emit('clear-bets')
  )
}

const handleClearAll = () => {
  showConfirmation(
    '清除所有投注',
    '确定要清除所有投注记录吗？这将清除当前投注和历史记录。',
    '全部清除',
    null,
    () => emit('clear-all-bets')
  )
}

const handleRebet = () => {
  if (!canRebet.value) return
  
  const lastBetCount = Object.keys(props.lastBets).filter(key => props.lastBets[key] > 0).length
  
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
  
  showConfirmation(
    '确认投注',
    '确定要提交当前投注吗？投注一旦确认将无法撤销。',
    '确认投注',
    [
      { label: '投注项目', value: `${betCount.value} 项` },
      { label: '投注金额', value: `¥${props.totalBetAmount.toLocaleString()}` },
      { label: '投注后余额', value: `¥${(props.balance - props.totalBetAmount).toLocaleString()}` }
    ],
    () => emit('confirm-bets')
  )
}

const handleUndo = () => {
  if (!canUndo.value) return
  emit('undo-last')
}

const handleQuickBet = () => {
  if (!canQuickBet.value) return
  emit('quick-bet')
}

const handleMaxBet = () => {
  if (!canMaxBet.value) return
  
  const remainingBalance = props.balance - props.totalBetAmount
  
  showConfirmation(
    '梭哈投注',
    '确定要投注所有剩余余额吗？这是高风险操作！',
    '确认梭哈',
    [
      { label: '当前余额', value: `¥${props.balance.toLocaleString()}` },
      { label: '当前投注', value: `¥${props.totalBetAmount.toLocaleString()}` },
      { label: '剩余可投', value: `¥${remainingBalance.toLocaleString()}` }
    ],
    () => emit('max-bet')
  )
}

const handleSettings = () => {
  emit('open-settings')
}

const showConfirmation = (
  title: string,
  message: string,
  buttonText: string,
  details: Array<{label: string, value: string}> | null,
  action: () => void
) => {
  confirmTitle.value = title
  confirmMessage.value = message
  confirmButtonText.value = buttonText
  confirmDetails.value = details
  pendingAction.value = action
  showConfirmDialog.value = true
}

const confirmAction = () => {
  if (pendingAction.value) {
    pendingAction.value()
  }
  cancelConfirm()
}

const cancelConfirm = () => {
  showConfirmDialog.value = false
  confirmTitle.value = ''
  confirmMessage.value = ''
  confirmButtonText.value = ''
  confirmDetails.value = null
  pendingAction.value = null
}

// 长按指令
const longPressDirective = {
  mounted(el: HTMLElement, binding: any) {
    let timer: number | null = null
    
    const startPress = () => {
      timer = window.setTimeout(() => {
        binding.value()
      }, 1000) // 长按1秒触发
    }
    
    const endPress = () => {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
    }
    
    el.addEventListener('touchstart', startPress)
    el.addEventListener('touchend', endPress)
    el.addEventListener('touchcancel', endPress)
    el.addEventListener('mousedown', startPress)
    el.addEventListener('mouseup', endPress)
    el.addEventListener('mouseleave', endPress)
    
    // 存储清理函数
    ;(el as any)._longPressCleanup = () => {
      el.removeEventListener('touchstart', startPress)
      el.removeEventListener('touchend', endPress)
      el.removeEventListener('touchcancel', endPress)
      el.removeEventListener('mousedown', startPress)
      el.removeEventListener('mouseup', endPress)
      el.removeEventListener('mouseleave', endPress)
    }
  },
  unmounted(el: HTMLElement) {
    if ((el as any)._longPressCleanup) {
      ;(el as any)._longPressCleanup()
    }
  }
}

// 注册指令
const vLongPress = longPressDirective
</script>

<style scoped>
.control-buttons {
  background: rgba(0, 0, 0, 0.95);
  padding: 12px;
  border-top: 1px solid #4a7c59;
  
  /* iOS Safari安全区域适配 */
  padding-bottom: max(12px, env(safe-area-inset-bottom));
}

/* 主要控制按钮 */
.main-controls {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.control-btn {
  flex: 1;
  background: linear-gradient(135deg, #4a7c59, #2d5a42);
  border: 2px solid #4a7c59;
  color: white;
  padding: 12px 6px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  position: relative;
  min-height: 70px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  overflow: hidden;
}

.control-btn:active {
  transform: scale(0.95);
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* 按钮特定样式 */
.clear-btn {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  border-color: #e74c3c;
}

.rebet-btn {
  background: linear-gradient(135deg, #f39c12, #d68910);
  border-color: #f39c12;
}

.confirm-btn {
  background: linear-gradient(135deg, #27ae60, #229954);
  border-color: #27ae60;
}

.confirm-btn.pulsing {
  animation: confirmPulse 2s infinite;
  box-shadow: 0 0 20px rgba(39, 174, 96, 0.5);
}

@keyframes confirmPulse {
  0%, 100% { 
    transform: scale(1); 
    box-shadow: 0 0 20px rgba(39, 174, 96, 0.5);
  }
  50% { 
    transform: scale(1.02); 
    box-shadow: 0 0 30px rgba(39, 174, 96, 0.8);
  }
}

/* 按钮内容 */
.btn-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  position: relative;
}

.btn-icon {
  font-size: 16px;
  line-height: 1;
}

.btn-text {
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
}

.btn-subtitle {
  font-size: 9px;
  opacity: 0.8;
  margin-top: 2px;
  line-height: 1;
}

.btn-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: #ff4757;
  color: white;
  border-radius: 50%;
  min-width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: bold;
  padding: 0 3px;
  border: 1px solid white;
  animation: badgeAppear 0.3s ease;
}

@keyframes badgeAppear {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* 辅助控制按钮 */
.auxiliary-controls {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
}

.aux-btn {
  flex: 1;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 8px 4px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 10px;
  font-weight: 600;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.aux-btn:active {
  transform: scale(0.95);
}

.aux-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.aux-btn:not(:disabled):hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
}

.aux-icon {
  font-size: 12px;
  line-height: 1;
}

.aux-text {
  font-size: 9px;
  line-height: 1;
}

/* 特殊辅助按钮样式 */
.quick-bet-btn:not(:disabled) {
  background: linear-gradient(135deg, #3498db, #2980b9);
  border-color: #3498db;
}

.max-bet-btn:not(:disabled) {
  background: linear-gradient(135deg, #9b59b6, #8e44ad);
  border-color: #9b59b6;
}

/* 状态指示器 */
.status-indicators {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.status-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
}

.status-label {
  color: #ccc;
}

.status-value {
  font-weight: 600;
}

.status-empty {
  color: #95a5a6;
}

.status-normal {
  color: #27ae60;
}

.status-high {
  color: #e67e22;
}

.phase {
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 9px;
}

.phase-waiting {
  background: rgba(149, 165, 166, 0.2);
  color: #95a5a6;
}

.phase-betting {
  background: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
}

.phase-rolling {
  background: rgba(243, 156, 18, 0.2);
  color: #f39c12;
}

.phase-result {
  background: rgba(39, 174, 96, 0.2);
  color: #27ae60;
}

/* 确认对话框 */
.confirm-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.confirm-dialog {
  background: #2c3e50;
  border-radius: 12px;
  border: 1px solid #34495e;
  min-width: 280px;
  max-width: 400px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  animation: dialogAppear 0.3s ease;
}

@keyframes dialogAppear {
  0% {
    opacity: 0;
    transform: scale(0.8) translateY(-20px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.dialog-header {
  padding: 16px 20px 12px 20px;
  border-bottom: 1px solid #34495e;
}

.dialog-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #ecf0f1;
  text-align: center;
}

.dialog-content {
  padding: 16px 20px;
}

.dialog-message {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #bdc3c7;
  line-height: 1.4;
  text-align: center;
}

.dialog-details {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  padding: 10px;
  margin-top: 12px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  font-size: 12px;
}

.detail-item:last-child {
  margin-bottom: 0;
}

.detail-label {
  color: #95a5a6;
}

.detail-value {
  color: #ecf0f1;
  font-weight: 600;
}

.dialog-actions {
  padding: 12px 20px 16px 20px;
  display: flex;
  gap: 10px;
  border-top: 1px solid #34495e;
}

.dialog-btn {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.dialog-btn:active {
  transform: scale(0.95);
}

.cancel-btn {
  background: #7f8c8d;
  color: white;
}

.cancel-btn:hover {
  background: #95a5a6;
}

.confirm-action-btn {
  background: #e74c3c;
  color: white;
}

.confirm-action-btn:hover {
  background: #c0392b;
}

/* 响应式适配 */
@media (max-width: 375px) {
  .main-controls {
    gap: 6px;
  }
  
  .control-btn {
    padding: 10px 4px;
    min-height: 65px;
  }
  
  .btn-icon {
    font-size: 14px;
  }
  
  .btn-text {
    font-size: 11px;
  }
  
  .btn-subtitle {
    font-size: 8px;
  }
  
  .auxiliary-controls {
    gap: 4px;
  }
  
  .aux-btn {
    padding: 6px 3px;
  }
  
  .aux-icon {
    font-size: 11px;
  }
  
  .aux-text {
    font-size: 8px;
  }
  
  .confirm-dialog {
    min-width: 260px;
    margin: 0 10px;
  }
}

@media (max-width: 320px) {
  .main-controls {
    gap: 4px;
  }
  
  .control-btn {
    padding: 8px 3px;
    min-height: 60px;
  }
  
  .btn-icon {
    font-size: 13px;
  }
  
  .btn-text {
    font-size: 10px;
  }
  
  .btn-subtitle {
    display: none; /* 超小屏幕隐藏副标题 */
  }
  
  .auxiliary-controls {
    display: none; /* 超小屏幕隐藏辅助按钮 */
  }
  
  .status-indicators {
    padding: 4px 6px;
  }
  
  .status-item {
    font-size: 9px;
  }
}

/* 横屏适配 */
@media (orientation: landscape) and (max-height: 500px) {
  .control-btn {
    min-height: 50px;
    padding: 6px 4px;
  }
  
  .btn-icon {
    font-size: 12px;
  }
  
  .btn-text {
    font-size: 10px;
  }
  
  .btn-subtitle {
    display: none; /* 横屏时隐藏副标题 */
  }
  
  .auxiliary-controls {
    display: none; /* 横屏时隐藏辅助按钮 */
  }
  
  .status-indicators {
    margin-bottom: 0;
  }
}

/* 按钮波纹效果 */
.control-btn {
  overflow: hidden;
}

.control-btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.3s ease, height 0.3s ease;
}

.control-btn:active::before {
  width: 120px;
  height: 120px;
}

/* 按钮悬浮效果（非移动端） */
@media (hover: hover) {
  .control-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
  
  .clear-btn:hover:not(:disabled) {
    box-shadow: 0 4px 12px rgba(231, 76, 60, 0.4);
  }
  
  .rebet-btn:hover:not(:disabled) {
    box-shadow: 0 4px 12px rgba(243, 156, 18, 0.4);
  }
  
  .confirm-btn:hover:not(:disabled) {
    box-shadow: 0 4px 12px rgba(39, 174, 96, 0.4);
  }
}
</style>