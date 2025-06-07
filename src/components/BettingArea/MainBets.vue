<template>
  <div class="main-bets-section">
    <div class="main-bets-grid">
      <div
        v-for="bet in mainBets"
        :key="bet.type"
        class="main-bet-wrapper"
        :class="{ 
          'selected': isSelected(bet.type),
          'has-bet': getBetAmount(bet.type) > 0,
          'disabled': !canPlaceBet
        }"
        :data-bet-type="bet.type"
        @click="handleBetClick(bet)"
        @touchstart="startPressAnimation"
        @touchend="endPressAnimation"
        @mousedown="startPressAnimation"
        @mouseup="endPressAnimation"
        @mouseleave="endPressAnimation"
      >
        <!-- 投注金额显示 - 右上角 -->
        <div 
          v-show="getBetAmount(bet.type) > 0" 
          class="bet-amount-corner"
        >
          {{ formatBetAmount(getBetAmount(bet.type)) }}
        </div>
        
        <!-- 按钮内容 -->
        <div class="bet-content">
          <!-- 主标签 -->
          <div class="bet-label">{{ bet.label }}</div>
          
          <!-- 点数范围（大小有显示） -->
          <div v-if="bet.range" class="bet-range">{{ bet.range }}</div>
          
          <!-- 赔率显示 -->
          <div class="bet-odds">{{ bet.odds }}</div>
        </div>

        <!-- 按钮边框装饰 -->
        <div class="bet-border-glow" v-if="isSelected(bet.type)"></div>
      </div>
    </div>

    <!-- 调试面板 - 帮助排查问题 -->
    <div v-if="showDebugInfo" class="debug-panel">
      <h4>🔍 调试信息</h4>
      
      <div class="debug-section">
        <div class="debug-title">📊 当前状态</div>
        <div class="debug-row">
          <span class="debug-label">选中筹码:</span>
          <span class="debug-value highlight">{{ selectedChip }}</span>
        </div>
        <div class="debug-row">
          <span class="debug-label">可以投注:</span>
          <span class="debug-value" :class="canPlaceBet ? 'success' : 'error'">
            {{ canPlaceBet ? '✅ 是' : '❌ 否' }}
          </span>
        </div>
      </div>

      <div class="debug-section">
        <div class="debug-title">💰 投注记录</div>
        <div class="debug-row">
          <span class="debug-label">总投注项目:</span>
          <span class="debug-value highlight">{{ Object.keys(currentBets).filter(key => currentBets[key] > 0).length }}</span>
        </div>
        <div class="debug-row">
          <span class="debug-label">总投注金额:</span>
          <span class="debug-value highlight">{{ totalBetAmount }}</span>
        </div>
        <div class="debug-row">
          <span class="debug-label">详细投注:</span>
        </div>
        <div class="debug-bets">
          <div v-if="Object.keys(currentBets).length === 0" class="no-bets">
            暂无投注记录
          </div>
          <div v-else>
            <div 
              v-for="(amount, betType) in currentBets" 
              :key="betType"
              v-show="amount > 0"
              class="bet-record"
            >
              <span class="bet-type">{{ getBetLabel(betType) }}</span>
              <span class="bet-amount">{{ amount }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="debug-section">
        <div class="debug-title">🎯 各按钮投注金额</div>
        <div class="bet-amounts-grid">
          <div 
            v-for="bet in mainBets" 
            :key="bet.type"
            class="bet-amount-item"
            :class="{ 'has-amount': getBetAmount(bet.type) > 0 }"
          >
            <span class="bet-name">{{ bet.label }}</span>
            <span class="amount">{{ getBetAmount(bet.type) || 0 }}</span>
          </div>
        </div>
      </div>

      <div class="debug-section">
        <div class="debug-title">📝 操作日志</div>
        <div class="debug-logs">
          <div 
            v-for="(log, index) in debugLogs" 
            :key="index"
            class="log-entry"
            :class="log.type"
          >
            <span class="log-time">{{ log.time }}</span>
            <span class="log-message">{{ log.message }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

// Props
interface Props {
  selectedChip: number
  currentBets: Record<string, number>
  canPlaceBet?: boolean
  enableHapticFeedback?: boolean
  showDebugInfo?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  canPlaceBet: true,
  enableHapticFeedback: true,
  showDebugInfo: true // 默认开启调试，方便排查问题
})

// Emits
const emit = defineEmits<{
  'place-bet': [betType: string]
}>()

// 大小单双投注配置
const mainBets = [
  {
    type: 'small',
    label: '小',
    range: '4-10',
    odds: '1:1'
  },
  {
    type: 'odd',
    label: '单',
    range: null,
    odds: '1:1'
  },
  {
    type: 'even',
    label: '双',
    range: null,
    odds: '1:1'
  },
  {
    type: 'big',
    label: '大',
    range: '11-17',
    odds: '1:1'
  }
]

// 响应式数据
const pressAnimationActive = ref(false)
const debugLogs = ref<Array<{time: string, message: string, type: string}>>([])

// 计算属性
const isSelected = computed(() => {
  return (betType: string) => {
    const amount = props.currentBets[betType] || 0
    return amount > 0
  }
})

const getBetAmount = computed(() => {
  return (betType: string) => {
    const amount = props.currentBets[betType] || 0
    return amount
  }
})

const totalBetAmount = computed(() => {
  return Object.values(props.currentBets).reduce((sum, amount) => sum + amount, 0)
})

// 方法
const formatBetAmount = (amount: number): string => {
  if (amount >= 10000) {
    return (amount / 10000).toFixed(1) + 'W'
  } else if (amount >= 1000) {
    return (amount / 1000).toFixed(1) + 'K'
  }
  return amount.toString()
}

const getBetLabel = (betType: string): string => {
  const bet = mainBets.find(b => b.type === betType)
  return bet ? bet.label : betType
}

const addDebugLog = (message: string, type: string = 'info') => {
  const now = new Date()
  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
  
  debugLogs.value.unshift({
    time,
    message,
    type
  })
  
  // 只保留最近20条日志
  if (debugLogs.value.length > 20) {
    debugLogs.value = debugLogs.value.slice(0, 20)
  }
}

const handleBetClick = (bet: any) => {
  addDebugLog(`🎯 点击投注: ${bet.label} (${bet.type})`, 'action')
  
  if (!props.canPlaceBet) {
    addDebugLog('❌ 无法投注: canPlaceBet为false', 'error')
    return
  }

  if (!props.selectedChip || props.selectedChip <= 0) {
    addDebugLog('❌ 无法投注: 未选择有效筹码', 'error')
    return
  }

  addDebugLog(`💰 投注参数: 筹码=${props.selectedChip}, 目标=${bet.type}`, 'info')

  try {
    // 触发震动反馈
    if (props.enableHapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(50)
    }

    // 发射投注事件 - 这应该会更新父组件的 currentBets
    emit('place-bet', bet.type)
    
    addDebugLog(`✅ 发射投注事件: place-bet(${bet.type})`, 'success')

  } catch (error) {
    addDebugLog(`💥 投注出错: ${error}`, 'error')
    console.error('投注失败:', error)
  }
}

const startPressAnimation = () => {
  pressAnimationActive.value = true
}

const endPressAnimation = () => {
  pressAnimationActive.value = false
}

// 监听投注变化
watch(() => props.currentBets, (newBets, oldBets) => {
  addDebugLog(`📊 投注数据变化检测`, 'watch')
  addDebugLog(`  旧数据: ${JSON.stringify(oldBets)}`, 'watch')
  addDebugLog(`  新数据: ${JSON.stringify(newBets)}`, 'watch')
  
  // 检查具体变化
  for (const betType of Object.keys({...oldBets, ...newBets})) {
    const oldAmount = oldBets?.[betType] || 0
    const newAmount = newBets?.[betType] || 0
    if (oldAmount !== newAmount) {
      addDebugLog(`  🔄 ${getBetLabel(betType)}: ${oldAmount} → ${newAmount}`, 'watch')
    }
  }
}, {
  deep: true,
  immediate: true
})

// 监听筹码变化
watch(() => props.selectedChip, (newChip, oldChip) => {
  addDebugLog(`🪙 筹码变化: ${oldChip} → ${newChip}`, 'watch')
})

// 监听投注能力变化
watch(() => props.canPlaceBet, (newValue, oldValue) => {
  addDebugLog(`🎮 投注能力变化: ${oldValue} → ${newValue}`, 'watch')
})
</script>

<style scoped>
.main-bets-section {
  padding: 8px;
}

/* 网格布局 */
.main-bets-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

/* 主要投注包装器 */
.main-bet-wrapper {
  position: relative;
  background: #2d7a4f;
  border: 2px solid #4a9f6e;
  color: white;
  padding: 16px 8px;
  border-radius: 8px;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s ease;
  min-height: 70px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-weight: 600;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  
  /* 提高文字对比度 */
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.main-bet-wrapper:active {
  transform: scale(0.95);
  background: #4a9f6e;
}

.main-bet-wrapper.selected {
  background: #ffd700;
  color: #333;
  border-color: #ffed4e;
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
  
  /* 选中状态的文字阴影调整 */
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.main-bet-wrapper.has-bet:not(.selected) {
  border-color: #ffd700;
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
}

.main-bet-wrapper.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

/* 右上角投注金额显示 */
.bet-amount-corner {
  position: absolute;
  top: -3px;
  right: -3px;
  background: linear-gradient(135deg, #ff4757, #ff3742);
  color: white;
  border-radius: 8px;
  min-width: 28px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 900;
  padding: 0 6px;
  border: 2px solid white;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.5);
  z-index: 10;
  
  /* 强化文字对比度 */
  text-shadow: 
    0 1px 0 rgba(0, 0, 0, 0.9),
    0 1px 3px rgba(0, 0, 0, 0.7);
  
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  letter-spacing: 0.5px;
  
  /* 入场动画 */
  animation: betAmountAppear 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes betAmountAppear {
  0% {
    opacity: 0;
    transform: scale(0.2) rotate(-15deg);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.1) rotate(5deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

/* 按钮内容 */
.bet-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 4px;
}

/* 投注标签 - 强化对比度 */
.bet-label {
  font-size: 20px;
  font-weight: 900;
  margin-bottom: 2px;
  line-height: 1;
  
  /* 增强文字清晰度 */
  text-shadow: 
    0 1px 0 rgba(0, 0, 0, 0.9),
    0 2px 4px rgba(0, 0, 0, 0.7);
  
  font-family: 'PingFang SC', 'Microsoft YaHei', 'Arial Black', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.main-bet-wrapper.selected .bet-label {
  color: #1a1a1a;
  text-shadow: 
    0 1px 0 rgba(255, 255, 255, 0.9),
    0 1px 3px rgba(255, 215, 0, 0.8);
}

/* 点数范围 */
.bet-range {
  font-size: 11px;
  margin-bottom: 2px;
  color: #e8e8e8;
  font-weight: 700;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9);
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
}

.main-bet-wrapper.selected .bet-range {
  color: #444;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.7);
}

/* 赔率显示 */
.bet-odds {
  font-size: 10px;
  color: #90ee90;
  font-weight: 800;
  text-shadow: 
    0 1px 0 rgba(0, 0, 0, 1),
    0 0 6px rgba(144, 238, 144, 0.8);
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  letter-spacing: 0.5px;
}

.main-bet-wrapper.selected .bet-odds {
  color: #2d5a2d;
  text-shadow: 
    0 1px 0 rgba(255, 255, 255, 0.8),
    0 0 4px rgba(45, 90, 45, 0.6);
}

/* 选中状态边框发光效果 */
.bet-border-glow {
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  background: linear-gradient(45deg, 
    rgba(255, 215, 0, 0.4) 0%, 
    rgba(255, 193, 7, 0.3) 25%, 
    rgba(255, 235, 59, 0.4) 50%, 
    rgba(255, 193, 7, 0.3) 75%, 
    rgba(255, 215, 0, 0.4) 100%);
  border-radius: 12px;
  z-index: -1;
  animation: borderGlow 2s infinite;
}

@keyframes borderGlow {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

/* 调试面板样式 */
.debug-panel {
  margin-top: 16px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(13, 40, 24, 0.8));
  border: 2px solid #2d5a42;
  border-radius: 12px;
  color: white;
  font-size: 12px;
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  backdrop-filter: blur(5px);
}

.debug-panel h4 {
  margin: 0 0 12px 0;
  color: #ffd700;
  font-size: 14px;
  text-align: center;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.debug-section {
  margin-bottom: 12px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.debug-title {
  color: #00bcd4;
  font-weight: bold;
  margin-bottom: 8px;
  font-size: 11px;
}

.debug-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  padding: 2px 0;
}

.debug-label {
  color: #ccc;
  font-size: 10px;
}

.debug-value {
  color: white;
  font-weight: bold;
  font-size: 10px;
}

.debug-value.highlight {
  color: #ffd700;
}

.debug-value.success {
  color: #4caf50;
}

.debug-value.error {
  color: #f44336;
}

.debug-bets {
  margin-top: 4px;
  padding: 4px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
}

.no-bets {
  color: #888;
  font-style: italic;
  text-align: center;
  padding: 8px;
}

.bet-record {
  display: flex;
  justify-content: space-between;
  padding: 2px 4px;
  margin-bottom: 2px;
  background: rgba(255, 215, 0, 0.1);
  border-radius: 3px;
}

.bet-type {
  color: #ffd700;
}

.bet-amount {
  color: #4caf50;
  font-weight: bold;
}

.bet-amounts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px;
}

.bet-amount-item {
  display: flex;
  justify-content: space-between;
  padding: 4px 6px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  font-size: 10px;
}

.bet-amount-item.has-amount {
  background: rgba(255, 215, 0, 0.2);
  border: 1px solid rgba(255, 215, 0, 0.4);
}

.bet-name {
  color: #ccc;
}

.amount {
  color: #4caf50;
  font-weight: bold;
}

.debug-logs {
  max-height: 200px;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 4px;
  padding: 4px;
}

.log-entry {
  display: flex;
  gap: 8px;
  padding: 2px 4px;
  margin-bottom: 1px;
  border-radius: 2px;
  font-size: 9px;
  line-height: 1.3;
}

.log-entry.action {
  background: rgba(0, 188, 212, 0.2);
}

.log-entry.success {
  background: rgba(76, 175, 80, 0.2);
}

.log-entry.error {
  background: rgba(244, 67, 54, 0.2);
}

.log-entry.watch {
  background: rgba(255, 193, 7, 0.2);
}

.log-time {
  color: #888;
  min-width: 50px;
}

.log-message {
  color: white;
  flex: 1;
}

/* 响应式适配 */
@media (max-width: 375px) {
  .main-bet-wrapper {
    padding: 10px 4px;
    min-height: 65px;
  }
  
  .bet-label {
    font-size: 16px;
  }
  
  .bet-range {
    font-size: 10px;
  }
  
  .bet-odds {
    font-size: 9px;
  }
  
  .bet-amount-corner {
    min-width: 24px;
    height: 20px;
    font-size: 10px;
    top: -2px;
    right: -2px;
  }
  
  .main-bets-grid {
    gap: 6px;
  }
  
  .main-bets-section {
    padding: 6px;
  }
  
  .debug-panel {
    font-size: 10px;
    padding: 12px;
  }
}

/* 点击波纹效果 */
.main-bet-wrapper {
  overflow: hidden;
}

.main-bet-wrapper::before {
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

.main-bet-wrapper:active::before {
  width: 100px;
  height: 100px;
}
</style>