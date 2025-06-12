<!-- src/components/BettingArea/MainBets.vue -->
<template>
  <div class="main-bets-section">
    <div class="main-bets-grid">
      <div
        v-for="bet in mainBets"
        :key="bet.type"
        class="main-bet-wrapper"
        :class="{ 
          'selected': getTotalBetAmount(bet.type) > 0,
          'has-bet': getTotalBetAmount(bet.type) > 0,
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
        <!-- 投注金额显示 - 右上角（显示总投注金额） -->
        <div 
          v-if="getTotalBetAmount(bet.type) > 0" 
          class="bet-amount-corner"
        >
          {{ formatBetAmount(getTotalBetAmount(bet.type)) }}
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
        <div class="bet-border-glow" v-if="getTotalBetAmount(bet.type) > 0"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
// 🔥 新增：导入 naive-ui 和提示工具函数
import { useMessage } from 'naive-ui'
import { useBettingStore } from '@/stores/bettingStore'
import { showBettingBlockedMessage } from '@/utils/messageHelper'

// Props
interface Props {
  selectedChip: number
  currentBets: Record<string, number>
  confirmedBets: Record<string, number>
  displayBets: Record<string, { current: number; confirmed: number; total: number }>
  canPlaceBet?: boolean
  enableHapticFeedback?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  canPlaceBet: true,
  enableHapticFeedback: true
})

// Emits
const emit = defineEmits<{
  'place-bet': [betType: string]
}>()

// 🔥 新增：使用 Store 和消息API
const bettingStore = useBettingStore()
const message = useMessage()

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

// 计算属性 - 获取总投注金额
const getTotalBetAmount = computed(() => {
  return (betType: string) => {
    const display = props.displayBets[betType]
    return display ? display.total : 0
  }
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

// 🔥 修改：投注点击处理 - 添加状态检查和提示
const handleBetClick = (bet: any) => {
  // 🔥 新增：检查投注能力，显示提示
  if (!props.canPlaceBet) {
    showBettingBlockedMessage(bettingStore.bettingPhase, message)
    return
  }

  if (!props.selectedChip || props.selectedChip <= 0) {
    return
  }

  // 触发震动反馈
  if (props.enableHapticFeedback && 'vibrate' in navigator) {
    navigator.vibrate(50)
  }

  // 发射投注事件
  emit('place-bet', bet.type)
}

const startPressAnimation = () => {
  pressAnimationActive.value = true
}

const endPressAnimation = () => {
  pressAnimationActive.value = false
}
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
  overflow: visible;
  padding: 6px;
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
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  overflow: visible;
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
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.main-bet-wrapper.has-bet:not(.selected) {
  border-color: #ffd700;
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
}

.main-bet-wrapper.disabled {
  opacity: 0.6;
  cursor: not-allowed;
  filter: grayscale(30%);
}

/* 投注金额显示 */
.bet-amount-corner {
  position: absolute;
  top: 2px;
  right: 2px;
  background: linear-gradient(135deg, #ff4757, #ff3742);
  color: white;
  border-radius: 8px;
  min-width: 24px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 900;
  padding: 0 4px;
  border: 2px solid white;
  box-shadow: 
    0 2px 6px rgba(0, 0, 0, 0.8),
    0 0 0 1px rgba(255, 71, 87, 0.9),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
  z-index: 30;
  text-shadow: 
    0 1px 0 rgba(0, 0, 0, 1),
    0 1px 3px rgba(0, 0, 0, 0.9);
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  letter-spacing: 0.2px;
  animation: betAmountAppear 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  opacity: 1 !important;
  visibility: visible !important;
  transform: translateZ(15px);
  pointer-events: none;
}

@keyframes betAmountAppear {
  0% {
    opacity: 0;
    transform: scale(0.2) rotate(-15deg) translateZ(0);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.2) rotate(5deg) translateZ(0);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0deg) translateZ(0);
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

/* 投注标签 */
.bet-label {
  font-size: 20px;
  font-weight: 900;
  margin-bottom: 2px;
  line-height: 1;
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
  color: rgba(255, 255, 255, 0.9);
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

/* 响应式适配 */
@media (max-width: 375px) {
  .main-bet-wrapper {
    padding: 10px 4px;
    min-height: 65px;
    margin: 4px 2px;
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
    min-width: 20px;
    height: 16px;
    font-size: 9px;
    top: 1px;
    right: 1px;
    border-width: 1.5px;
    padding: 0 3px;
  }
  
  .main-bets-grid {
    gap: 6px;
    padding: 4px;
  }
  
  .main-bets-section {
    padding: 6px;
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