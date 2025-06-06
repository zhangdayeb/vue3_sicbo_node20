<template>
  <div class="chip-selector">
    <!-- 筹码选择区域 -->
    <div class="chip-container">
      <div class="chip-list">
        <button
          v-for="chip in chips"
          :key="chip.value"
          class="chip-btn"
          :class="[
            `chip-${chip.value}`,
            { 
              'active': selectedChip === chip.value,
              'disabled': balance < chip.value
            }
          ]"
          @click="selectChip(chip.value)"
          :disabled="balance < chip.value"
        >
          <!-- 筹码视觉效果 -->
          <div class="chip-inner">
            <div class="chip-edge"></div>
            <div class="chip-center">
              <span class="chip-value">{{ chip.label }}</span>
            </div>
            <div class="chip-reflection"></div>
          </div>
          
          <!-- 选中指示器 -->
          <div v-if="selectedChip === chip.value" class="selection-indicator">
            <div class="indicator-ring"></div>
            <div class="indicator-glow"></div>
          </div>
          
          <!-- 余额不足遮罩 -->
          <div v-if="balance < chip.value" class="insufficient-overlay">
            <span class="insufficient-text">余额不足</span>
          </div>
        </button>
      </div>
      
      <!-- 筹码信息显示 -->
      <div class="chip-info">
        <div class="selected-chip-info">
          <span class="info-label">选中筹码:</span>
          <span class="info-value">{{ selectedChipLabel }}</span>
        </div>
        <div class="chip-tips">
          <div class="tip-item">
            <span class="tip-icon">💡</span>
            <span class="tip-text">点击筹码切换面值</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 余额和投注统计 -->
    <div class="balance-summary">
      <div class="summary-row main-row">
        <div class="balance-info">
          <span class="balance-label">可用余额</span>
          <span class="balance-amount">{{ formattedBalance }}</span>
          <button class="refresh-balance-btn" @click="refreshBalance" :disabled="isRefreshing">
            <span :class="{ 'spinning': isRefreshing }">🔄</span>
          </button>
        </div>
        <div class="bet-info">
          <span class="bet-label">总投注</span>
          <span class="bet-amount" :class="{ 'has-bets': totalBetAmount > 0 }">
            {{ formattedTotalBet }}
          </span>
        </div>
      </div>
      
      <!-- 次要统计行 -->
      <div class="summary-row secondary-row">
        <div class="remaining-balance">
          <span class="remaining-label">投注后余额:</span>
          <span class="remaining-amount" :class="{ 'low-balance': remainingBalance < selectedChip }">
            {{ formattedRemainingBalance }}
          </span>
        </div>
        <div class="bet-count">
          <span class="count-label">投注项:</span>
          <span class="count-value">{{ betCount }}</span>
        </div>
      </div>
      
      <!-- 投注限额提示 -->
      <div class="bet-limits-hint">
        <span class="limits-text">
          单注限额: {{ betLimits.min }} - {{ betLimits.max }}
        </span>
      </div>
    </div>
    
    <!-- 快捷筹码操作 -->
    <div class="quick-actions">
      <button 
        class="quick-action-btn"
        @click="selectPreviousChip"
        :disabled="!canSelectPrevious"
      >
        ← 减小
      </button>
      <button 
        class="quick-action-btn auto-select"
        @click="autoSelectChip"
        :disabled="!canAutoSelect"
      >
        🎯 智能选择
      </button>
      <button 
        class="quick-action-btn"
        @click="selectNextChip"
        :disabled="!canSelectNext"
      >
        增大 →
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

// Props
interface Props {
  selectedChip: number
  balance: number
  totalBetAmount: number
  currentBets: Record<string, number>
  betLimits: {
    min: number
    max: number
  }
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'select-chip': [value: number]
  'refresh-balance': []
}>()

// 筹码配置
const chips = [
  { 
    value: 1, 
    label: '1', 
    color: '#8b4513',
    textColor: '#ffffff',
    description: '基础筹码'
  },
  { 
    value: 10, 
    label: '10', 
    color: '#dc143c',
    textColor: '#ffffff',
    description: '常用筹码'
  },
  { 
    value: 100, 
    label: '100', 
    color: '#ffd700',
    textColor: '#333333',
    description: '中等筹码'
  },
  { 
    value: 1000, 
    label: '1K', 
    color: '#4169e1',
    textColor: '#ffffff',
    description: '高级筹码'
  },
  { 
    value: 10000, 
    label: '10K', 
    color: '#9370db',
    textColor: '#ffffff',
    description: '豪华筹码'
  }
]

// 响应式数据
const isRefreshing = ref(false)

// 计算属性
const formattedBalance = computed(() => {
  return `¥${props.balance.toLocaleString()}`
})

const formattedTotalBet = computed(() => {
  return `¥${props.totalBetAmount.toLocaleString()}`
})

const remainingBalance = computed(() => {
  return props.balance - props.totalBetAmount
})

const formattedRemainingBalance = computed(() => {
  return `¥${remainingBalance.value.toLocaleString()}`
})

const betCount = computed(() => {
  return Object.keys(props.currentBets).filter(key => props.currentBets[key] > 0).length
})

const selectedChipLabel = computed(() => {
  const chip = chips.find(c => c.value === props.selectedChip)
  return chip ? chip.label : '未选择'
})

const currentChipIndex = computed(() => {
  return chips.findIndex(chip => chip.value === props.selectedChip)
})

const canSelectPrevious = computed(() => {
  return currentChipIndex.value > 0 && props.balance >= chips[currentChipIndex.value - 1].value
})

const canSelectNext = computed(() => {
  return currentChipIndex.value < chips.length - 1 && props.balance >= chips[currentChipIndex.value + 1].value
})

const canAutoSelect = computed(() => {
  return remainingBalance.value > 0
})

// 方法
const selectChip = (value: number) => {
  if (props.balance >= value) {
    emit('select-chip', value)
  }
}

const selectPreviousChip = () => {
  if (canSelectPrevious.value) {
    const prevChip = chips[currentChipIndex.value - 1]
    selectChip(prevChip.value)
  }
}

const selectNextChip = () => {
  if (canSelectNext.value) {
    const nextChip = chips[currentChipIndex.value + 1]
    selectChip(nextChip.value)
  }
}

const autoSelectChip = () => {
  // 智能选择：选择余额能承受的最大筹码，但不超过剩余余额的1/10
  const remainingAfterBets = remainingBalance.value
  const targetAmount = Math.max(props.betLimits.min, Math.floor(remainingAfterBets / 10))
  
  // 找到最接近目标金额且不超过余额的筹码
  let bestChip = chips[0]
  for (const chip of chips) {
    if (chip.value <= remainingAfterBets && chip.value <= targetAmount) {
      bestChip = chip
    } else {
      break
    }
  }
  
  selectChip(bestChip.value)
}

const refreshBalance = async () => {
  isRefreshing.value = true
  try {
    emit('refresh-balance')
    // 模拟刷新延迟
    await new Promise(resolve => setTimeout(resolve, 1000))
  } finally {
    isRefreshing.value = false
  }
}
</script>

<style scoped>
.chip-selector {
  background: rgba(0, 0, 0, 0.9);
  border-top: 1px solid #2d5a42;
  padding: 12px;
}

/* 筹码容器 */
.chip-container {
  margin-bottom: 12px;
}

.chip-list {
  display: flex;
  justify-content: space-around;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.chip-btn {
  position: relative;
  width: 52px;
  height: 52px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  background: transparent;
  padding: 0;
}

.chip-btn:active {
  transform: scale(0.95);
}

.chip-btn.disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

/* 筹码内部结构 */
.chip-inner {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.chip-edge {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.3);
  pointer-events: none;
}

.chip-center {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.chip-value {
  font-weight: bold;
  font-size: 11px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  pointer-events: none;
}

.chip-reflection {
  position: absolute;
  top: 15%;
  left: 20%;
  width: 30%;
  height: 30%;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.4), transparent);
  border-radius: 50%;
  pointer-events: none;
}

/* 筹码颜色样式 */
.chip-1 .chip-center { background: #8b4513; color: white; }
.chip-10 .chip-center { background: #dc143c; color: white; }
.chip-100 .chip-center { background: #ffd700; color: #333; }
.chip-1000 .chip-center { background: #4169e1; color: white; }
.chip-10000 .chip-center { background: #9370db; color: white; }

/* 选中状态 */
.chip-btn.active .chip-inner {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(255, 215, 0, 0.4);
}

.selection-indicator {
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  pointer-events: none;
}

.indicator-ring {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 2px solid #ffd700;
  border-radius: 50%;
  animation: pulseRing 2s infinite;
}

.indicator-glow {
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.3), transparent);
  animation: pulseGlow 2s infinite;
}

@keyframes pulseRing {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
}

@keyframes pulseGlow {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.8; }
}

/* 余额不足遮罩 */
.insufficient-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.insufficient-text {
  color: #ff6b6b;
  font-size: 8px;
  font-weight: bold;
  text-align: center;
  line-height: 1.2;
}

/* 筹码信息 */
.chip-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
}

.selected-chip-info {
  display: flex;
  gap: 4px;
}

.info-label {
  color: #ccc;
}

.info-value {
  color: #ffd700;
  font-weight: 600;
}

.chip-tips {
  display: flex;
  align-items: center;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tip-icon {
  font-size: 10px;
}

.tip-text {
  color: #999;
  font-size: 10px;
}

/* 余额统计 */
.balance-summary {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.summary-row:last-child {
  margin-bottom: 0;
}

.main-row {
  font-size: 12px;
  font-weight: 600;
}

.secondary-row {
  font-size: 10px;
  opacity: 0.85;
}

.balance-info,
.bet-info,
.remaining-balance,
.bet-count {
  display: flex;
  align-items: center;
  gap: 4px;
}

.balance-label,
.bet-label,
.remaining-label,
.count-label {
  color: #ccc;
}

.balance-amount {
  color: #4CAF50;
  font-weight: 700;
}

.bet-amount {
  color: #ff6b6b;
  font-weight: 700;
  transition: all 0.3s ease;
}

.bet-amount.has-bets {
  color: #ffd700;
  text-shadow: 0 0 4px rgba(255, 215, 0, 0.5);
}

.remaining-amount {
  color: #4CAF50;
  font-weight: 600;
}

.remaining-amount.low-balance {
  color: #ff9800;
}

.count-value {
  color: #00BCD4;
  font-weight: 600;
}

.refresh-balance-btn {
  background: none;
  border: none;
  color: #ccc;
  cursor: pointer;
  padding: 2px;
  transition: all 0.2s ease;
}

.refresh-balance-btn:hover:not(:disabled) {
  color: #fff;
}

.refresh-balance-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.bet-limits-hint {
  text-align: center;
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.limits-text {
  color: #999;
  font-size: 9px;
}

/* 快捷操作 */
.quick-actions {
  display: flex;
  gap: 6px;
}

.quick-action-btn {
  flex: 1;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 8px 6px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 10px;
  font-weight: 600;
  transition: all 0.2s ease;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.quick-action-btn:active {
  transform: scale(0.95);
}

.quick-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.quick-action-btn:not(:disabled):hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
}

.auto-select {
  background: linear-gradient(135deg, #3498db, #2980b9);
  border-color: #3498db;
}

.auto-select:not(:disabled):hover {
  background: linear-gradient(135deg, #2980b9, #21618c);
}

/* 响应式适配 */
@media (max-width: 375px) {
  .chip-btn {
    width: 48px;
    height: 48px;
  }
  
  .chip-value {
    font-size: 10px;
  }
  
  .chip-list {
    gap: 6px;
  }
  
  .main-row {
    font-size: 11px;
  }
  
  .secondary-row {
    font-size: 9px;
  }
}

@media (max-width: 320px) {
  .chip-btn {
    width: 44px;
    height: 44px;
  }
  
  .chip-value {
    font-size: 9px;
  }
  
  .chip-list {
    gap: 4px;
  }
  
  .quick-actions {
    flex-direction: column;
    gap: 4px;
  }
  
  .quick-action-btn {
    font-size: 9px;
    padding: 6px 4px;
  }
}

/* 横屏适配 */
@media (orientation: landscape) and (max-height: 500px) {
  .chip-btn {
    width: 40px;
    height: 40px;
  }
  
  .chip-value {
    font-size: 9px;
  }
  
  .balance-summary {
    padding: 8px;
  }
  
  .chip-info {
    display: none; /* 横屏时隐藏提示信息 */
  }
  
  .bet-limits-hint {
    display: none;
  }
}
</style>