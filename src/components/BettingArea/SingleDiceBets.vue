<template>
  <div class="single-dice-section">
    <!-- Naive UI 配置提供者 - 应用游戏主题 -->
    <n-config-provider :theme-overrides="gameTheme">
      <div class="dice-grid">
        <div
          v-for="dice in diceOptions"
          :key="dice.value"
          class="dice-bet-wrapper"
          :class="{ 
            'selected': getTotalBetAmount(`single-${dice.value}`) > 0,
            'has-bet': getTotalBetAmount(`single-${dice.value}`) > 0,
            'disabled': !canPlaceBet
          }"
          :data-bet-type="`single-${dice.value}`"
          @click="handleBetClick(dice)"
          @touchstart="startPressAnimation"
          @touchend="endPressAnimation"
          @mousedown="startPressAnimation"
          @mouseup="endPressAnimation"
          @mouseleave="endPressAnimation"
        >
          <!-- 投注金额显示 - 右上角 -->
          <div 
            v-if="getTotalBetAmount(`single-${dice.value}`) > 0" 
            class="bet-amount-corner"
          >
            {{ formatBetAmount(getTotalBetAmount(`single-${dice.value}`)) }}
          </div>
          
          <!-- 按钮内容 -->
          <div class="bet-content">
            <!-- 骰子图案 -->
            <div class="dice-pattern">
              <div class="dice-face">
                <div 
                  v-for="dot in getDotPattern(dice.value)" 
                  :key="dot.id"
                  class="dice-dot"
                  :style="{ 
                    top: dot.top, 
                    left: dot.left 
                  }"
                />
              </div>
            </div>
            
            <!-- 数字显示 -->
            <div class="dice-number">{{ dice.value }}</div>
            
            <!-- 赔率显示 -->
            <div class="dice-odds">动态赔率</div>
          </div>

          <!-- 按钮边框装饰 -->
          <div class="bet-border-glow" v-if="getTotalBetAmount(`single-${dice.value}`) > 0"></div>
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

// 骰子选项配置
const diceOptions = [
  { flashClass: '', value: 1, color: '#e74c3c' },
  { flashClass: '', value: 2, color: '#3498db' },
  { flashClass: '', value: 3, color: '#e67e22' },
  { flashClass: '', value: 4, color: '#9b59b6' },
  { flashClass: '', value: 5, color: '#27ae60' },
  { flashClass: '', value: 6, color: '#f39c12' }
]

// 响应式数据
const pressAnimationActive = ref(false)

// 骰子点数图案配置
interface DotPattern {
  id: number
  top: string
  left: string
}

const getDotPattern = (value: number): DotPattern[] => {
  const patterns: Record<number, DotPattern[]> = {
    1: [
      { id: 1, top: '50%', left: '50%' }
    ],
    2: [
      { id: 1, top: '25%', left: '25%' },
      { id: 2, top: '75%', left: '75%' }
    ],
    3: [
      { id: 1, top: '25%', left: '25%' },
      { id: 2, top: '50%', left: '50%' },
      { id: 3, top: '75%', left: '75%' }
    ],
    4: [
      { id: 1, top: '25%', left: '25%' },
      { id: 2, top: '25%', left: '75%' },
      { id: 3, top: '75%', left: '25%' },
      { id: 4, top: '75%', left: '75%' }
    ],
    5: [
      { id: 1, top: '25%', left: '25%' },
      { id: 2, top: '25%', left: '75%' },
      { id: 3, top: '50%', left: '50%' },
      { id: 4, top: '75%', left: '25%' },
      { id: 5, top: '75%', left: '75%' }
    ],
    6: [
      { id: 1, top: '20%', left: '25%' },
      { id: 2, top: '20%', left: '75%' },
      { id: 3, top: '50%', left: '25%' },
      { id: 4, top: '50%', left: '75%' },
      { id: 5, top: '80%', left: '25%' },
      { id: 6, top: '80%', left: '75%' }
    ]
  }
  return patterns[value] || []
}

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
const handleBetClick = (dice: any) => {
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
  emit('place-bet', `single-${dice.value}`)
}

const startPressAnimation = () => {
  pressAnimationActive.value = true
}

const endPressAnimation = () => {
  pressAnimationActive.value = false
}
</script>

<style scoped>
.single-dice-section {
  padding: 8px;
}

/* 骰子网格 */
.dice-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
  overflow: visible;
  padding: 6px;
}

/* 骰子投注包装器 */
.dice-bet-wrapper {
  position: relative;
  background: #2d7a4f;
  border: 2px solid #4a9f6e;
  color: white;
  padding: 12px 6px;
  border-radius: 8px;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s ease;
  min-height: 100px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
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

.dice-bet-wrapper:active {
  transform: scale(0.95);
  background: #4a9f6e;
}

.dice-bet-wrapper.selected {
  background: #ffd700;
  color: #333;
  border-color: #ffed4e;
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
  
  /* 选中状态的文字阴影调整 */
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.dice-bet-wrapper.has-bet:not(.selected) {
  border-color: #ffd700;
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
}

.dice-bet-wrapper.disabled {
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
  justify-content: space-between;
  align-items: center;
  gap: 4px;
}

/* 骰子图案 */
.dice-pattern {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 4px 0;
}

.dice-face {
  width: 28px;
  height: 28px;
  background: white;
  border-radius: 4px;
  position: relative;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.dice-dot {
  position: absolute;
  width: 3.5px;
  height: 3.5px;
  background: #333;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

/* 数字显示 - 强化对比度 */
.dice-number {
  font-size: 14px;
  font-weight: 900;
  margin: 4px 0;
  color: #ffd700;
  
  /* 增强文字清晰度 */
  text-shadow: 
    0 1px 0 rgba(0, 0, 0, 0.9),
    0 2px 4px rgba(0, 0, 0, 0.7);
  
  font-family: 'PingFang SC', 'Microsoft YaHei', 'Arial Black', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.dice-bet-wrapper.selected .dice-number {
  color: #1a1a1a;
  text-shadow: 
    0 1px 0 rgba(255, 255, 255, 0.9),
    0 1px 3px rgba(255, 215, 0, 0.8);
}

/* 赔率显示 */
.dice-odds {
  font-size: 8px;
  color: #90ee90;
  font-weight: 800;
  margin: 2px 0;
  text-shadow: 
    0 1px 0 rgba(0, 0, 0, 1),
    0 0 6px rgba(144, 238, 144, 0.8);
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  letter-spacing: 0.5px;
}

.dice-bet-wrapper.selected .dice-odds {
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
  .dice-grid {
    gap: 6px;
    padding: 4px;
  }
  
  .dice-bet-wrapper {
    padding: 8px 4px;
    min-height: 85px;
    margin: 2px 1px;
  }
  
  .dice-face {
    width: 24px;
    height: 24px;
  }
  
  .dice-dot {
    width: 3px;
    height: 3px;
  }
  
  .dice-number {
    font-size: 12px;
  }
  
  .dice-odds {
    font-size: 7px;
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
  
  .single-dice-section {
    padding: 6px;
  }
}

@media (max-width: 320px) {
  .dice-grid {
    gap: 4px;
    padding: 2px;
  }
  
  .dice-bet-wrapper {
    padding: 6px 2px;
    min-height: 75px;
  }
  
  .dice-face {
    width: 20px;
    height: 20px;
  }
  
  .dice-dot {
    width: 2.5px;
    height: 2.5px;
  }
  
  .dice-number {
    font-size: 10px;
  }
  
  .dice-odds {
    font-size: 6px;
  }
  
  .bet-amount-corner {
    min-width: 16px;
    height: 12px;
    font-size: 7px;
  }
  
  .single-dice-section {
    padding: 4px;
  }
}

/* 横屏适配 */
@media (orientation: landscape) and (max-height: 500px) {
  .dice-bet-wrapper {
    min-height: 70px;
    padding: 6px 3px;
  }
  
  .dice-face {
    width: 20px;
    height: 20px;
  }
  
  .single-dice-section {
    padding: 6px;
  }
  
  .bet-amount-corner {
    min-width: 16px;
    height: 12px;
    font-size: 7px;
  }
}

/* 不同屏幕的网格适配 */
@media (max-width: 280px) {
  .dice-grid {
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(2, 1fr);
  }
  
  .dice-bet-wrapper {
    min-height: 80px;
  }
}

/* 点击波纹效果 */
.dice-bet-wrapper {
  overflow: hidden;
}

.dice-bet-wrapper::before {
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

.dice-bet-wrapper:active::before {
  width: 60px;
  height: 60px;
}

/* 选中状态的骰子面颜色调整 */
.dice-bet-wrapper.selected .dice-face {
  background: #f8f9fa;
  border: 1px solid #333;
}

.dice-bet-wrapper.selected .dice-dot {
  background: #333;
}

/* 高对比度模式适配 */
@media (prefers-contrast: high) {
  .dice-bet-wrapper {
    border-width: 3px;
  }
  
  .bet-amount-corner {
    border-width: 2px;
  }
}

/* 减少动画模式适配 */
@media (prefers-reduced-motion: reduce) {
  .dice-bet-wrapper,
  .bet-amount-corner,
  .bet-border-glow {
    animation: none;
    transition: none;
  }
}
</style>