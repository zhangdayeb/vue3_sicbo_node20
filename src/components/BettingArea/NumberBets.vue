<template>
  <div class="number-bets-section">
    <!-- Naive UI 配置提供者 - 应用游戏主题 -->
    <n-config-provider :theme-overrides="gameTheme">
      <!-- 上排：小数区域 4-10 -->
      <div class="number-row">
        <div class="numbers-grid">
          <div
            v-for="number in smallNumbers"
            :key="number.value"
            class="number-bet-wrapper"
            :class="{ 
              'selected': getTotalBetAmount(`total-${number.value}`) > 0,
              'has-bet': getTotalBetAmount(`total-${number.value}`) > 0,
              'disabled': !canPlaceBet
            }"
            :data-bet-type="`total-${number.value}`"
            @click="handleBetClick(number)"
            @touchstart="startPressAnimation"
            @touchend="endPressAnimation"
            @mousedown="startPressAnimation"
            @mouseup="endPressAnimation"
            @mouseleave="endPressAnimation"
          >
            <!-- 投注金额显示 - 右上角 -->
            <div 
              v-if="getTotalBetAmount(`total-${number.value}`) > 0" 
              class="bet-amount-corner"
            >
              {{ formatBetAmount(getTotalBetAmount(`total-${number.value}`)) }}
            </div>
            
            <!-- 按钮内容 -->
            <div class="bet-content">
              <!-- 数字值 -->
              <div class="number-value">{{ number.value }}</div>
              
              <!-- 赔率显示 -->
              <div class="number-odds">{{ number.oddsDisplay }}</div>
              
              <!-- 概率显示 -->
              <div class="number-probability">{{ number.probability }}</div>
            </div>

            <!-- 按钮边框装饰 -->
            <div class="bet-border-glow" v-if="getTotalBetAmount(`total-${number.value}`) > 0"></div>
          </div>
        </div>
      </div>
      
      <!-- 下排：大数区域 11-17 (倒序) -->
      <div class="number-row">
        <div class="numbers-grid">
          <div
            v-for="number in bigNumbers"
            :key="number.value"
            class="number-bet-wrapper"
            :class="{ 
              'selected': getTotalBetAmount(`total-${number.value}`) > 0,
              'has-bet': getTotalBetAmount(`total-${number.value}`) > 0,
              'disabled': !canPlaceBet
            }"
            :data-bet-type="`total-${number.value}`"
            @click="handleBetClick(number)"
            @touchstart="startPressAnimation"
            @touchend="endPressAnimation"
            @mousedown="startPressAnimation"
            @mouseup="endPressAnimation"
            @mouseleave="endPressAnimation"
          >
            <!-- 投注金额显示 - 右上角 -->
            <div 
              v-if="getTotalBetAmount(`total-${number.value}`) > 0" 
              class="bet-amount-corner"
            >
              {{ formatBetAmount(getTotalBetAmount(`total-${number.value}`)) }}
            </div>
            
            <!-- 按钮内容 -->
            <div class="bet-content">
              <!-- 数字值 -->
              <div class="number-value">{{ number.value }}</div>
              
              <!-- 赔率显示 -->
              <div class="number-odds">{{ number.oddsDisplay }}</div>
              
              <!-- 概率显示 -->
              <div class="number-probability">{{ number.probability }}</div>
            </div>

            <!-- 按钮边框装饰 -->
            <div class="bet-border-glow" v-if="getTotalBetAmount(`total-${number.value}`) > 0"></div>
          </div>
        </div>
      </div>
    </n-config-provider>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { NConfigProvider } from 'naive-ui'
// 🔥 新增：导入 naive-ui 消息和提示工具函数
import { useMessage } from 'naive-ui'
import { useBettingStore } from '@/stores/bettingStore'
import { showBettingBlockedMessage } from '@/utils/messageHelper'

// 游戏主题配置
const gameTheme = {
  common: {
    primaryColor: '#27ae60',
    primaryColorHover: '#2ecc71',
    primaryColorPressed: '#229954',
    
    textColorBase: '#ffffff',
    textColor1: 'rgba(255, 255, 255, 0.95)',
    textColor2: 'rgba(255, 255, 255, 0.82)',
    
    baseColor: 'rgba(13, 40, 24, 0.95)',
    cardColor: 'rgba(45, 90, 66, 0.4)',
    
    borderRadius: '8px',
    borderColor: 'rgba(255, 215, 0, 0.3)',
    
    boxShadow1: '0 2px 8px rgba(0, 0, 0, 0.3)',
    boxShadow2: '0 4px 16px rgba(0, 0, 0, 0.4)',
  }
}

// Props - 与 MainBets.vue 保持一致
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

// 点数投注配置（基于真实骰宝概率）
const numberConfigs = {
  4: { flashClass: '', odds: 62, probability: '3种' },   // 最难出现
  5: { flashClass: '', odds: 31, probability: '6种' },
  6: { flashClass: '', odds: 18, probability: '10种' },
  7: { flashClass: '', odds: 12, probability: '15种' },
  8: { flashClass: '', odds: 8, probability: '21种' },
  9: { flashClass: '', odds: 6, probability: '25种' },
  10: { flashClass: '', odds: 6, probability: '27种' },  // 最容易（小数中）
  11: { flashClass: '', odds: 6, probability: '27种' },  // 最容易（大数中）
  12: { flashClass: '', odds: 6, probability: '25种' },
  13: { flashClass: '', odds: 8, probability: '21种' },
  14: { flashClass: '', odds: 12, probability: '15种' },
  15: { flashClass: '', odds: 18, probability: '10种' },
  16: { flashClass: '', odds: 31, probability: '6种' },
  17: { flashClass: '', odds: 62, probability: '3种' }   // 最难出现
}

// 响应式数据
const pressAnimationActive = ref(false)

// 小数区域 4-10
const smallNumbers = computed(() => {
  return [4, 5, 6, 7, 8, 9, 10].map(num => ({
    value: num,
    odds: numberConfigs[num as keyof typeof numberConfigs].odds,
    oddsDisplay: `1:${numberConfigs[num as keyof typeof numberConfigs].odds}`,
    probability: numberConfigs[num as keyof typeof numberConfigs].probability
  }))
})

// 大数区域 17-11 (倒序排列)
const bigNumbers = computed(() => {
  return [17, 16, 15, 14, 13, 12, 11].map(num => ({
    value: num,
    odds: numberConfigs[num as keyof typeof numberConfigs].odds,
    oddsDisplay: `1:${numberConfigs[num as keyof typeof numberConfigs].odds}`,
    probability: numberConfigs[num as keyof typeof numberConfigs].probability
  }))
})

// 计算属性 - 获取总投注金额（与 MainBets.vue 一致）
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
const handleBetClick = (number: any) => {
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
  emit('place-bet', `total-${number.value}`)
}

const startPressAnimation = () => {
  pressAnimationActive.value = true
}

const endPressAnimation = () => {
  pressAnimationActive.value = false
}
</script>

<style scoped>
.number-bets-section {
  padding: 8px;
}

/* 数字行布局 */
.number-row {
  margin-bottom: 8px;
}

.number-row:last-of-type {
  margin-bottom: 0;
}

.numbers-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
  overflow: visible;
  padding: 4px;
}

/* 数字投注包装器 */
.number-bet-wrapper {
  position: relative;
  background: #2d7a4f;
  border: 2px solid #4a9f6e;
  color: white;
  padding: 8px 4px;
  border-radius: 6px;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s ease;
  min-height: 55px;
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
  
  /* 确保不会裁剪投注金额 */
  overflow: visible;
}

.number-bet-wrapper:active {
  transform: scale(0.95);
  background: #4a9f6e;
}

.number-bet-wrapper.selected {
  background: #ffd700;
  color: #333;
  border-color: #ffed4e;
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
  
  /* 选中状态的文字阴影调整 */
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.number-bet-wrapper.has-bet:not(.selected) {
  border-color: #ffd700;
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
}

.number-bet-wrapper.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

/* 右上角投注金额显示 */
.bet-amount-corner {
  position: absolute;
  top: 2px;
  right: 2px;
  background: linear-gradient(135deg, #ff4757, #ff3742);
  color: white;
  border-radius: 8px;
  min-width: 20px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 900;
  padding: 0 3px;
  border: 2px solid white;
  box-shadow: 
    0 2px 6px rgba(0, 0, 0, 0.8),
    0 0 0 1px rgba(255, 71, 87, 0.9),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
  z-index: 30;
  
  /* 强化文字对比度 */
  text-shadow: 
    0 1px 0 rgba(0, 0, 0, 1),
    0 1px 3px rgba(0, 0, 0, 0.9);
  
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  letter-spacing: 0.2px;
  
  /* 入场动画 */
  animation: betAmountAppear 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  
  /* 强制显示并确保在最顶层 */
  opacity: 1 !important;
  visibility: visible !important;
  transform: translateZ(15px);
  
  /* 防止被其他元素遮挡 */
  pointer-events: none;
}

/* 强化动画确保可见性 */
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
  gap: 2px;
}

/* 数字值 - 强化对比度 */
.number-value {
  font-size: 16px;
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

.number-bet-wrapper.selected .number-value {
  color: #1a1a1a;
  text-shadow: 
    0 1px 0 rgba(255, 255, 255, 0.9),
    0 1px 3px rgba(255, 215, 0, 0.8);
}

/* 赔率显示 */
.number-odds {
  font-size: 8px;
  color: #90ee90;
  font-weight: 800;
  margin-bottom: 1px;
  text-shadow: 
    0 1px 0 rgba(0, 0, 0, 1),
    0 0 6px rgba(144, 238, 144, 0.8);
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  letter-spacing: 0.5px;
}

.number-bet-wrapper.selected .number-odds {
  color: #2d5a2d;
  text-shadow: 
    0 1px 0 rgba(255, 255, 255, 0.8),
    0 0 4px rgba(45, 90, 45, 0.6);
}

/* 概率显示 */
.number-probability {
  font-size: 7px;
  color: #ccc;
  opacity: 0.8;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
}

.number-bet-wrapper.selected .number-probability {
  color: #666;
  opacity: 0.9;
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
  border-radius: 10px;
  z-index: -1;
  animation: borderGlow 2s infinite;
}

@keyframes borderGlow {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

/* 响应式适配 */
@media (max-width: 375px) {
  .numbers-grid {
    gap: 4px;
    padding: 2px;
  }
  
  .number-bet-wrapper {
    padding: 6px 2px;
    min-height: 50px;
    margin: 2px 1px;
  }
  
  .number-value {
    font-size: 14px;
  }
  
  .number-odds {
    font-size: 7px;
  }
  
  .number-probability {
    font-size: 6px;
  }
  
  .bet-amount-corner {
    min-width: 18px;
    height: 14px;
    font-size: 8px;
    top: 1px;
    right: 1px;
    border-width: 1.5px;
    padding: 0 2px;
  }
  
  .number-bets-section {
    padding: 6px;
  }
  
  .number-row {
    margin-bottom: 6px;
  }
  
  .high-odds-badge {
    width: 14px;
    height: 14px;
    top: -1px;
    left: -1px;
  }
}

@media (max-width: 320px) {
  .numbers-grid {
    gap: 3px;
    padding: 1px;
  }
  
  .number-bet-wrapper {
    padding: 4px 1px;
    min-height: 45px;
  }
  
  .number-value {
    font-size: 12px;
  }
  
  .number-odds {
    font-size: 6px;
  }
  
  .number-probability {
    display: none; /* 超小屏幕隐藏概率显示 */
  }
  
  .number-bets-section {
    padding: 4px;
  }
  
  .bet-amount-corner {
    min-width: 16px;
    height: 12px;
    font-size: 7px;
  }
}

/* 横屏适配 */
@media (orientation: landscape) and (max-height: 500px) {
  .number-bet-wrapper {
    min-height: 40px;
    padding: 4px 2px;
  }
  
  .number-value {
    font-size: 12px;
  }
  
  .number-row {
    margin-bottom: 6px;
  }
  
  .number-bets-section {
    padding: 6px;
  }
  
  .bet-amount-corner {
    min-width: 16px;
    height: 12px;
    font-size: 7px;
  }
}

/* 点击波纹效果 */
.number-bet-wrapper {
  overflow: hidden;
}

.number-bet-wrapper::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.2s ease, height 0.2s ease;
}

.number-bet-wrapper:active::before {
  width: 60px;
  height: 60px;
}

/* 深度样式覆盖 */
/* 高对比度模式适配 */
@media (prefers-contrast: high) {
  .number-bet-wrapper {
    border-width: 3px;
  }
  
  .bet-amount-corner {
    border-width: 2px;
  }
}

/* 减少动画模式适配 */
@media (prefers-reduced-motion: reduce) {
  .number-bet-wrapper,
  .bet-amount-corner,
  .bet-border-glow {
    animation: none;
    transition: none;
  }
}
</style>