<template>
  <div class="bet-amount-display">
    <!-- 主要投注金额显示 -->
    <div class="main-amount-section">
      <div class="amount-container" :class="{ 'has-bets': totalBetAmount > 0, 'pulsing': isPulsing }">
        <div class="amount-header">
          <span class="amount-label">总投注</span>
          <button 
            v-if="showRefresh" 
            class="refresh-btn"
            @click="refreshAmount"
            :disabled="isRefreshing"
          >
            <span :class="{ 'spinning': isRefreshing }">🔄</span>
          </button>
        </div>
        
        <div class="amount-value">
          <span class="currency">¥</span>
          <span class="amount-number" ref="amountNumberRef">{{ formattedAmount }}</span>
        </div>
        
        <div class="amount-footer">
          <div class="bet-stats">
            <span class="bet-count">{{ betCount }}项</span>
            <span class="separator">•</span>
            <span class="avg-bet">均注{{ formattedAvgBet }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 详细投注列表 -->
    <div v-if="showDetails && Object.keys(activeBets).length > 0" class="details-section">
      <div class="details-header" @click="toggleDetails">
        <span class="details-title">投注明细</span>
        <button class="toggle-details-btn">
          <span :class="{ 'rotated': showDetailsList }">▼</span>
        </button>
      </div>
      
      <transition name="slide-down">
        <div v-if="showDetailsList" class="details-list">
          <div 
            v-for="(amount, betType) in activeBets"
            :key="betType"
            class="detail-item"
            :class="{ 'recent': isRecentBet(betType) }"
          >
            <div class="bet-info">
              <span class="bet-type">{{ getBetDisplayName(betType) }}</span>
              <span class="bet-odds">{{ getBetOdds(betType) }}</span>
            </div>
            <div class="bet-amount-info">
              <span class="bet-amount">¥{{ amount.toLocaleString() }}</span>
              <button class="remove-bet-btn" @click="removeBet(betType)">×</button>
            </div>
          </div>
        </div>
      </transition>
    </div>
    
    <!-- 盈亏预测 -->
    <div v-if="showPrediction" class="prediction-section">
      <div class="prediction-header">
        <span class="prediction-title">预期收益</span>
        <div class="prediction-toggle">
          <button 
            v-for="type in predictionTypes"
            :key="type.key"
            class="prediction-type-btn"
            :class="{ 'active': selectedPredictionType === type.key }"
            @click="selectedPredictionType = type.key"
          >
            {{ type.label }}
          </button>
        </div>
      </div>
      
      <div class="prediction-content">
        <div v-if="selectedPredictionType === 'best'" class="prediction-item best-case">
          <span class="prediction-label">最佳情况:</span>
          <span class="prediction-value positive">+¥{{ bestCaseWin.toLocaleString() }}</span>
        </div>
        
        <div v-if="selectedPredictionType === 'average'" class="prediction-item average-case">
          <span class="prediction-label">期望收益:</span>
          <span class="prediction-value" :class="{ 'positive': expectedWin > 0, 'negative': expectedWin < 0 }">
            {{ expectedWin > 0 ? '+' : '' }}¥{{ Math.abs(expectedWin).toLocaleString() }}
          </span>
        </div>
        
        <div v-if="selectedPredictionType === 'risk'" class="prediction-item risk-case">
          <span class="prediction-label">风险提示:</span>
          <span class="prediction-value negative">-¥{{ totalBetAmount.toLocaleString() }}</span>
        </div>
      </div>
    </div>
    
    <!-- 快速统计 -->
    <div v-if="showQuickStats" class="quick-stats">
      <div class="stat-item">
        <span class="stat-icon">💰</span>
        <span class="stat-label">余额占比</span>
        <span class="stat-value" :class="balanceRatioClass">{{ balanceRatioText }}</span>
      </div>
      
      <div class="stat-item">
        <span class="stat-icon">🎯</span>
        <span class="stat-label">覆盖率</span>
        <span class="stat-value">{{ coverageText }}</span>
      </div>
      
      <div class="stat-item">
        <span class="stat-icon">⚡</span>
        <span class="stat-label">风险等级</span>
        <span class="stat-value" :class="riskLevelClass">{{ riskLevelText }}</span>
      </div>
    </div>
    
    <!-- 金额变化动画 -->
    <teleport to="body">
      <transition name="amount-change">
        <div v-if="showChangeAnimation" class="amount-change-animation">
          <span class="change-sign">{{ changeAmount > 0 ? '+' : '' }}</span>
          <span class="change-amount">¥{{ Math.abs(changeAmount).toLocaleString() }}</span>
        </div>
      </transition>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'

// Props
interface Props {
  totalBetAmount: number
  currentBets: Record<string, number>
  balance: number
  showDetails?: boolean
  showPrediction?: boolean
  showQuickStats?: boolean
  showRefresh?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showDetails: true,
  showPrediction: false,
  showQuickStats: true,
  showRefresh: false
})

// Emits
const emit = defineEmits<{
  'remove-bet': [betType: string]
  'refresh-amount': []
}>()

// 响应式数据
const showDetailsList = ref(false)
const selectedPredictionType = ref<'best' | 'average' | 'risk'>('average')
const isPulsing = ref(false)
const isRefreshing = ref(false)
const showChangeAnimation = ref(false)
const changeAmount = ref(0)
const amountNumberRef = ref<HTMLElement>()
const recentBets = ref<Set<string>>(new Set())

// 预测类型配置
const predictionTypes = [
  { key: 'best' as const, label: '最佳' },
  { key: 'average' as const, label: '期望' },
  { key: 'risk' as const, label: '风险' }
]

// 投注类型名称映射
const betTypeNames: Record<string, string> = {
  'small': '小',
  'big': '大',
  'odd': '单',
  'even': '双',
  'total-4': '点数4',
  'total-5': '点数5',
  'total-6': '点数6',
  'total-7': '点数7',
  'total-8': '点数8',
  'total-9': '点数9',
  'total-10': '点数10',
  'total-11': '点数11',
  'total-12': '点数12',
  'total-13': '点数13',
  'total-14': '点数14',
  'total-15': '点数15',
  'total-16': '点数16',
  'total-17': '点数17',
  'single-1': '单骰1',
  'single-2': '单骰2',
  'single-3': '单骰3',
  'single-4': '单骰4',
  'single-5': '单骰5',
  'single-6': '单骰6',
  'pair-1': '对子1',
  'pair-2': '对子2',
  'pair-3': '对子3',
  'pair-4': '对子4',
  'pair-5': '对子5',
  'pair-6': '对子6',
  'triple-1': '围1',
  'triple-2': '围2',
  'triple-3': '围3',
  'triple-4': '围4',
  'triple-5': '围5',
  'triple-6': '围6',
  'any-triple': '全围'
}

// 赔率映射
const betOddsMap: Record<string, string> = {
  'small': '1:1',
  'big': '1:1',
  'odd': '1:1',
  'even': '1:1',
  'total-4': '1:62',
  'total-5': '1:31',
  'total-6': '1:18',
  'total-7': '1:12',
  'total-8': '1:8',
  'total-9': '1:6',
  'total-10': '1:6',
  'total-11': '1:6',
  'total-12': '1:6',
  'total-13': '1:8',
  'total-14': '1:12',
  'total-15': '1:18',
  'total-16': '1:31',
  'total-17': '1:62',
  'single-1': '1:1~3',
  'single-2': '1:1~3',
  'single-3': '1:1~3',
  'single-4': '1:1~3',
  'single-5': '1:1~3',
  'single-6': '1:1~3',
  'pair-1': '1:10',
  'pair-2': '1:10',
  'pair-3': '1:10',
  'pair-4': '1:10',
  'pair-5': '1:10',
  'pair-6': '1:10',
  'triple-1': '1:180',
  'triple-2': '1:180',
  'triple-3': '1:180',
  'triple-4': '1:180',
  'triple-5': '1:180',
  'triple-6': '1:180',
  'any-triple': '1:30'
}

// 计算属性
const formattedAmount = computed(() => {
  return props.totalBetAmount.toLocaleString()
})

const activeBets = computed(() => {
  return Object.fromEntries(
    Object.entries(props.currentBets).filter(([_, amount]) => amount > 0)
  )
})

const betCount = computed(() => {
  return Object.keys(activeBets.value).length
})

const formattedAvgBet = computed(() => {
  if (betCount.value === 0) return '0'
  const avg = props.totalBetAmount / betCount.value
  return avg.toLocaleString()
})

const balanceRatio = computed(() => {
  if (props.balance === 0) return 0
  return (props.totalBetAmount / props.balance) * 100
})

const balanceRatioText = computed(() => {
  return `${balanceRatio.value.toFixed(1)}%`
})

const balanceRatioClass = computed(() => {
  if (balanceRatio.value <= 20) return 'safe'
  if (balanceRatio.value <= 50) return 'moderate'
  return 'high'
})

const coverageText = computed(() => {
  // 简化的覆盖率计算（实际应该根据具体投注类型计算）
  const coverage = Math.min((betCount.value / 10) * 100, 100)
  return `${coverage.toFixed(0)}%`
})

const riskLevel = computed(() => {
  if (balanceRatio.value <= 10) return 'low'
  if (balanceRatio.value <= 30) return 'medium'
  if (balanceRatio.value <= 60) return 'high'
  return 'extreme'
})

const riskLevelClass = computed(() => `risk-${riskLevel.value}`)

const riskLevelText = computed(() => {
  const riskMap = {
    'low': '低风险',
    'medium': '中风险',
    'high': '高风险',
    'extreme': '极高风险'
  }
  return riskMap[riskLevel.value]
})

const bestCaseWin = computed(() => {
  // 假设最高赔率的投注中奖
  let maxWin = 0
  Object.entries(activeBets.value).forEach(([betType, amount]) => {
    const odds = getBetMultiplier(betType)
    const potentialWin = amount * odds
    if (potentialWin > maxWin) {
      maxWin = potentialWin
    }
  })
  return maxWin
})

const expectedWin = computed(() => {
  // 简化的期望值计算（实际应该考虑真实概率）
  let totalExpected = 0
  Object.entries(activeBets.value).forEach(([betType, amount]) => {
    const odds = getBetMultiplier(betType)
    const probability = getBetProbability(betType)
    const expectedValue = (amount * odds * probability) - amount
    totalExpected += expectedValue
  })
  return Math.round(totalExpected)
})

// 方法
const getBetDisplayName = (betType: string): string => {
  return betTypeNames[betType] || betType
}

const getBetOdds = (betType: string): string => {
  return betOddsMap[betType] || '1:1'
}

const getBetMultiplier = (betType: string): number => {
  const oddsStr = getBetOdds(betType)
  if (oddsStr.includes('~')) {
    // 对于单骰投注，使用平均赔率
    return 2
  }
  const parts = oddsStr.split(':')
  if (parts.length === 2) {
    return parseInt(parts[1]) || 1
  }
  return 1
}

const getBetProbability = (betType: string): number => {
  // 简化的概率计算
  if (betType.includes('small') || betType.includes('big')) return 0.486
  if (betType.includes('odd') || betType.includes('even')) return 0.486
  if (betType.includes('total-10') || betType.includes('total-11')) return 0.125
  if (betType.includes('triple') && !betType.includes('any')) return 0.0046
  if (betType.includes('any-triple')) return 0.0278
  if (betType.includes('pair')) return 0.139
  if (betType.includes('single')) return 0.421
  return 0.1 // 默认概率
}

const isRecentBet = (betType: string): boolean => {
  return recentBets.value.has(betType)
}

const toggleDetails = () => {
  showDetailsList.value = !showDetailsList.value
}

const removeBet = (betType: string) => {
  emit('remove-bet', betType)
}

const refreshAmount = async () => {
  isRefreshing.value = true
  try {
    emit('refresh-amount')
    await new Promise(resolve => setTimeout(resolve, 1000))
  } finally {
    isRefreshing.value = false
  }
}

const triggerPulse = () => {
  isPulsing.value = true
  setTimeout(() => {
    isPulsing.value = false
  }, 1000)
}

const showAmountChange = (oldAmount: number, newAmount: number) => {
  changeAmount.value = newAmount - oldAmount
  showChangeAnimation.value = true
  
  setTimeout(() => {
    showChangeAnimation.value = false
  }, 2000)
}

// 监听投注金额变化
watch(() => props.totalBetAmount, (newAmount, oldAmount) => {
  if (oldAmount !== undefined && newAmount !== oldAmount) {
    showAmountChange(oldAmount, newAmount)
    triggerPulse()
    
    // 数字滚动动画
    nextTick(() => {
      if (amountNumberRef.value) {
        amountNumberRef.value.style.transform = 'scale(1.1)'
        setTimeout(() => {
          if (amountNumberRef.value) {
            amountNumberRef.value.style.transform = 'scale(1)'
          }
        }, 200)
      }
    })
  }
})

// 监听投注变化，标记最近的投注
watch(() => props.currentBets, (newBets, oldBets) => {
  if (oldBets) {
    Object.keys(newBets).forEach(betType => {
      if (newBets[betType] > (oldBets[betType] || 0)) {
        recentBets.value.add(betType)
        setTimeout(() => {
          recentBets.value.delete(betType)
        }, 3000)
      }
    })
  }
}, { deep: true })
</script>

<style scoped>
.bet-amount-display {
  background: rgba(0, 0, 0, 0.85);
  border-radius: 12px;
  padding: 16px;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
}

/* 主要金额显示 */
.main-amount-section {
  margin-bottom: 12px;
}

.amount-container {
  text-align: center;
  padding: 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.amount-container.has-bets {
  background: rgba(255, 215, 0, 0.1);
  border-color: rgba(255, 215, 0, 0.3);
}

.amount-container.pulsing {
  animation: amountPulse 1s ease;
}

@keyframes amountPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

.amount-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 8px;
}

.amount-label {
  font-size: 12px;
  color: #ccc;
  font-weight: 600;
}

.refresh-btn {
  background: none;
  border: none;
  color: #ccc;
  cursor: pointer;
  padding: 2px;
  transition: all 0.2s ease;
  border-radius: 3px;
}

.refresh-btn:hover:not(:disabled) {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

.refresh-btn:disabled {
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

.amount-value {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 2px;
  margin-bottom: 6px;
}

.currency {
  font-size: 14px;
  color: #ffd700;
  font-weight: 600;
}

.amount-number {
  font-size: 24px;
  font-weight: 700;
  color: #ffd700;
  font-family: 'Courier New', monospace;
  transition: all 0.2s ease;
}

.amount-footer {
  display: flex;
  justify-content: center;
}

.bet-stats {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  color: #999;
}

.separator {
  opacity: 0.5;
}

/* 详细投注列表 */
.details-section {
  margin-bottom: 12px;
}

.details-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  cursor: pointer;
}

.details-title {
  font-size: 12px;
  color: #ffd700;
  font-weight: 600;
}

.toggle-details-btn {
  background: none;
  border: none;
  color: #ccc;
  cursor: pointer;
  padding: 2px;
  transition: all 0.2s ease;
}

.toggle-details-btn span {
  display: inline-block;
  transition: transform 0.3s ease;
}

.toggle-details-btn .rotated {
  transform: rotate(180deg);
}

.details-list {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  max-height: 150px;
  overflow-y: auto;
}

.detail-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.2s ease;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-item.recent {
  background: rgba(255, 215, 0, 0.1);
  border-left: 3px solid #ffd700;
}

.bet-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.bet-type {
  font-size: 11px;
  color: #fff;
  font-weight: 600;
}

.bet-odds {
  font-size: 9px;
  color: #90ee90;
}

.bet-amount-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.bet-amount {
  font-size: 11px;
  color: #ffd700;
  font-weight: 600;
}

.remove-bet-btn {
  background: #ff4757;
  border: none;
  color: white;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 12px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.remove-bet-btn:hover {
  background: #ff3742;
  transform: scale(1.1);
}

/* 盈亏预测 */
.prediction-section {
  margin-bottom: 12px;
}

.prediction-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.prediction-title {
  font-size: 12px;
  color: #ffd700;
  font-weight: 600;
}

.prediction-toggle {
  display: flex;
  gap: 4px;
}

.prediction-type-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 9px;
  transition: all 0.2s ease;
}

.prediction-type-btn.active {
  background: #ffd700;
  color: #333;
  border-color: #ffd700;
}

.prediction-content {
  padding: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
}

.prediction-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
}

.prediction-label {
  color: #ccc;
}

.prediction-value {
  font-weight: 600;
}

.prediction-value.positive {
  color: #27ae60;
}

.prediction-value.negative {
  color: #e74c3c;
}

/* 快速统计 */
.quick-stats {
  display: flex;
  gap: 8px;
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  font-size: 9px;
}

.stat-icon {
  font-size: 12px;
}

.stat-label {
  color: #999;
}

.stat-value {
  font-weight: 600;
  color: #fff;
}

.stat-value.safe {
  color: #27ae60;
}

.stat-value.moderate {
  color: #f39c12;
}

.stat-value.high {
  color: #e74c3c;
}

.risk-low {
  color: #27ae60;
}

.risk-medium {
  color: #f39c12;
}

.risk-high {
  color: #e67e22;
}

.risk-extreme {
  color: #e74c3c;
}

/* 金额变化动画 */
.amount-change-animation {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 215, 0, 0.9);
  color: #333;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  pointer-events: none;
  z-index: 10000;
}

/* 过渡动画 */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-10px);
}

.slide-down-enter-to,
.slide-down-leave-from {
  opacity: 1;
  max-height: 150px;
  transform: translateY(0);
}

.amount-change-enter-active {
  animation: amountChangeAppear 2s ease;
}

.amount-change-leave-active {
  animation: amountChangeDisappear 0.3s ease;
}

@keyframes amountChangeAppear {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.5) translateY(-20px);
  }
  20% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.2) translateY(-20px);
  }
  80% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1) translateY(-20px);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.8) translateY(-40px);
  }
}

@keyframes amountChangeDisappear {
  from {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  to {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.8);
  }
}

/* 响应式适配 */
@media (max-width: 375px) {
  .amount-number {
    font-size: 20px;
  }
  
  .currency {
    font-size: 12px;
  }
  
  .quick-stats {
    gap: 6px;
  }
  
  .stat-item {
    padding: 4px;
    font-size: 8px;
  }
  
  .stat-icon {
    font-size: 10px;
  }
}

@media (max-width: 320px) {
  .amount-number {
    font-size: 18px;
  }
  
  .details-section {
    display: none; /* 超小屏幕隐藏详细列表 */
  }
  
  .prediction-section {
    display: none; /* 超小屏幕隐藏预测 */
  }
}

/* 横屏适配 */
@media (orientation: landscape) and (max-height: 500px) {
  .amount-number {
    font-size: 18px;
  }
  
  .details-section,
  .prediction-section {
    display: none; /* 横屏时隐藏详细信息 */
  }
  
  .quick-stats {
    gap: 4px;
  }
  
  .stat-item {
    padding: 3px;
    font-size: 8px;
  }
}
</style>