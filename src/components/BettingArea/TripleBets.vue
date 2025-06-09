<template>
  <div class="triple-bets-section">
    <!-- Naive UI 配置提供者 - 应用游戏主题 -->
    <n-config-provider :theme-overrides="gameTheme">
      <div class="triple-grid">
        <!-- 特定三同号 -->
        <div
          v-for="triple in tripleOptions"
          :key="triple.value"
          class="triple-bet-wrapper specific-triple"
          :class="{ 
            'selected': getTotalBetAmount(`triple-${triple.value}`) > 0,
            'has-bet': getTotalBetAmount(`triple-${triple.value}`) > 0,
            'disabled': !canPlaceBet
          }"
          :data-bet-type="`triple-${triple.value}`"
          @click="handleBetClick(`triple-${triple.value}`)"
          @touchstart="startPressAnimation"
          @touchend="endPressAnimation"
          @mousedown="startPressAnimation"
          @mouseup="endPressAnimation"
          @mouseleave="endPressAnimation"
        >
          <!-- 投注金额显示 - 右上角 -->
          <div 
            v-if="getTotalBetAmount(`triple-${triple.value}`) > 0" 
            class="bet-amount-corner"
          >
            {{ formatBetAmount(getTotalBetAmount(`triple-${triple.value}`)) }}
          </div>
          
          <!-- 按钮内容 -->
          <div class="bet-content">
            <!-- 三个骰子显示 -->
            <div class="triple-dice-container">
              <div 
                v-for="index in 3"
                :key="index"
                class="triple-dice"
              >
                <div class="dice-face">
                  <div 
                    v-for="dot in getDotPattern(triple.value)" 
                    :key="`${index}-${dot.id}`"
                    class="dice-dot"
                    :style="{ 
                      top: dot.top, 
                      left: dot.left 
                    }"
                  ></div>
                </div>
              </div>
            </div>
            
            <!-- 三同号标签 -->
            <div class="triple-label">围{{ triple.value }}</div>
            
            <!-- 赔率显示 -->
            <div class="triple-odds">1:180</div>
          </div>

          <!-- 按钮边框装饰 -->
          <div class="bet-border-glow" v-if="getTotalBetAmount(`triple-${triple.value}`) > 0"></div>
        </div>
        
        <!-- 全围（任意三同号） -->
        <div
          class="triple-bet-wrapper any-triple"
          :class="{ 
            'selected': getTotalBetAmount('any-triple') > 0,
            'has-bet': getTotalBetAmount('any-triple') > 0,
            'disabled': !canPlaceBet
          }"
          :data-bet-type="'any-triple'"
          @click="handleBetClick('any-triple')"
          @touchstart="startPressAnimation"
          @touchend="endPressAnimation"
          @mousedown="startPressAnimation"
          @mouseup="endPressAnimation"
          @mouseleave="endPressAnimation"
        >
          <!-- 投注金额显示 - 右上角 -->
          <div 
            v-if="getTotalBetAmount('any-triple') > 0" 
            class="bet-amount-corner"
          >
            {{ formatBetAmount(getTotalBetAmount('any-triple')) }}
          </div>
          
          <!-- 按钮内容 -->
          <div class="bet-content">
            <!-- 全围图标 -->
            <div class="any-triple-icon">
              <div class="icon-text">全围</div>
              <div class="icon-subtitle">任意三同号</div>
            </div>
            
            <!-- 赔率显示 -->
            <div class="triple-odds any-odds">1:30</div>
          </div>

          <!-- 按钮边框装饰 -->
          <div class="bet-border-glow" v-if="getTotalBetAmount('any-triple') > 0"></div>
        </div>
      </div>
    </n-config-provider>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { NConfigProvider } from 'naive-ui'

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

// 三同号选项配置
const tripleOptions = [
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
const getDotPattern = (value: number) => {
  const patterns = {
    1: [{ id: 1, top: '50%', left: '50%' }],
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
  return patterns[value as keyof typeof patterns] || []
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

const handleBetClick = (betType: string) => {
  if (!props.canPlaceBet) {
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
  emit('place-bet', betType)
}

const startPressAnimation = () => {
  pressAnimationActive.value = true
}

const endPressAnimation = () => {
  pressAnimationActive.value = false
}
</script>

<style scoped>
.triple-bets-section {
  padding: 8px;
}

/* 三同号网格 */
.triple-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
  overflow: visible;
  padding: 6px;
}

/* 三同号投注包装器 */
.triple-bet-wrapper {
  position: relative;
  border: 2px solid #4a9f6e;
  color: white;
  padding: 8px 4px;
  border-radius: 8px;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s ease;
  min-height: 90px;
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

/* 特定三同号按钮 */
.specific-triple {
  background: linear-gradient(135deg, #8e44ad, #9b59b6);
}

/* 全围按钮 */
.any-triple {
  background: linear-gradient(135deg, #c0392b, #e74c3c);
  grid-column: span 1;
}

.triple-bet-wrapper:active {
  transform: scale(0.95);
}

.triple-bet-wrapper.selected {
  background: #ffd700 !important;
  color: #333;
  border-color: #ffed4e;
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
  
  /* 选中状态的文字阴影调整 */
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.triple-bet-wrapper.has-bet:not(.selected) {
  border-color: #ffd700;
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
}

.triple-bet-wrapper.disabled {
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
  min-width: 18px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 8px;
  font-weight: 900;
  padding: 0 2px;
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
  gap: 3px;
}

/* 三个骰子容器 */
.triple-dice-container {
  display: flex;
  gap: 2px;
  align-items: center;
  justify-content: center;
  margin: 4px 0;
  flex: 1;
}

.triple-dice {
  display: flex;
  align-items: center;
  justify-content: center;
}

.dice-face {
  width: 10px;
  height: 10px;
  background: white;
  border-radius: 2px;
  position: relative;
  box-shadow: 0 1px 2px rgba(0,0,0,0.3);
}

.dice-dot {
  position: absolute;
  width: 1.2px;
  height: 1.2px;
  background: #333;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

/* 全围图标 */
.any-triple-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 4px 0;
  flex: 1;
}

.icon-text {
  font-size: 12px;
  font-weight: 900;
  color: white;
  margin-bottom: 2px;
  
  /* 增强文字清晰度 */
  text-shadow: 
    0 1px 0 rgba(0, 0, 0, 0.9),
    0 2px 4px rgba(0, 0, 0, 0.7);
  
  font-family: 'PingFang SC', 'Microsoft YaHei', 'Arial Black', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.any-triple.selected .icon-text {
  color: #1a1a1a;
  text-shadow: 
    0 1px 0 rgba(255, 255, 255, 0.9),
    0 1px 3px rgba(255, 215, 0, 0.8);
}

.icon-subtitle {
  font-size: 7px;
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
  line-height: 1.2;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}

.any-triple.selected .icon-subtitle {
  color: rgba(26, 26, 26, 0.8);
}

/* 标签和赔率 */
.triple-label {
  font-size: 9px;
  font-weight: 900;
  color: white;
  margin: 2px 0;
  
  /* 增强文字清晰度 */
  text-shadow: 
    0 1px 0 rgba(0, 0, 0, 0.9),
    0 2px 4px rgba(0, 0, 0, 0.7);
  
  font-family: 'PingFang SC', 'Microsoft YaHei', 'Arial Black', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.triple-bet-wrapper.selected .triple-label {
  color: #1a1a1a;
  text-shadow: 
    0 1px 0 rgba(255, 255, 255, 0.9),
    0 1px 3px rgba(255, 215, 0, 0.8);
}

.triple-odds {
  font-size: 7px;
  color: #90ee90;
  font-weight: 800;
  margin: 1px 0;
  text-shadow: 
    0 1px 0 rgba(0, 0, 0, 1),
    0 0 6px rgba(144, 238, 144, 0.8);
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  letter-spacing: 0.5px;
}

.any-odds {
  color: #ffeb3b;
}

.triple-bet-wrapper.selected .triple-odds {
  color: #2d5a2d;
  text-shadow: 
    0 1px 0 rgba(255, 255, 255, 0.8),
    0 0 4px rgba(45, 90, 45, 0.6);
}

.triple-bet-wrapper.selected .any-odds {
  color: #8a6914;
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
  .triple-grid {
    gap: 4px;
    padding: 4px;
  }
  
  .triple-bet-wrapper {
    padding: 6px 2px;
    min-height: 75px;
    margin: 2px 1px;
  }
  
  .dice-face {
    width: 8px;
    height: 8px;
  }
  
  .dice-dot {
    width: 1px;
    height: 1px;
  }
  
  .icon-text {
    font-size: 10px;
  }
  
  .icon-subtitle {
    font-size: 6px;
  }
  
  .triple-label {
    font-size: 8px;
  }
  
  .triple-odds {
    font-size: 6px;
  }
  
  .bet-amount-corner {
    min-width: 16px;
    height: 12px;
    font-size: 7px;
    top: 1px;
    right: 1px;
    border-width: 1.5px;
    padding: 0 2px;
  }
  
  .triple-bets-section {
    padding: 6px;
  }
}

@media (max-width: 320px) {
  .triple-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 3px;
    padding: 2px;
  }
  
  .any-triple {
    grid-column: span 4;
    grid-row: 2;
  }
  
  .triple-bet-wrapper {
    min-height: 65px;
    padding: 5px 2px;
  }
  
  .dice-face {
    width: 7px;
    height: 7px;
  }
  
  .icon-text {
    font-size: 9px;
  }
  
  .icon-subtitle {
    font-size: 5px;
  }
  
  .triple-label {
    font-size: 7px;
  }
  
  .triple-odds {
    font-size: 5px;
  }
  
  .bet-amount-corner {
    min-width: 14px;
    height: 10px;
    font-size: 6px;
  }
  
  .triple-bets-section {
    padding: 4px;
  }
}

/* 横屏适配 */
@media (orientation: landscape) and (max-height: 500px) {
  .triple-bet-wrapper {
    min-height: 60px;
    padding: 4px 2px;
  }
  
  .dice-face {
    width: 7px;
    height: 7px;
  }
  
  .triple-bets-section {
    padding: 6px;
  }
  
  .bet-amount-corner {
    min-width: 14px;
    height: 10px;
    font-size: 6px;
  }
}

/* 点击波纹效果 */
.triple-bet-wrapper {
  overflow: hidden;
}

.triple-bet-wrapper::before {
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

.triple-bet-wrapper:active::before {
  width: 50px;
  height: 50px;
}

/* 选中状态的骰子面颜色调整 */
.triple-bet-wrapper.selected .dice-face {
  background: #f8f9fa;
  border: 1px solid #333;
}

.triple-bet-wrapper.selected .dice-dot {
  background: #333;
}

/* 高对比度模式适配 */
@media (prefers-contrast: high) {
  .triple-bet-wrapper {
    border-width: 3px;
  }
  
  .bet-amount-corner {
    border-width: 2px;
  }
}

/* 减少动画模式适配 */
@media (prefers-reduced-motion: reduce) {
  .triple-bet-wrapper,
  .bet-amount-corner,
  .bet-border-glow {
    animation: none;
    transition: none;
  }
}
</style>