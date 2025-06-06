<template>
  <div class="single-dice-section">
    <div class="dice-grid">
      <button
        v-for="dice in diceOptions"
        :key="dice.value"
        class="dice-btn"
        :class="{ 
          selected: isSelected(`single-${dice.value}`),
          'has-bet': getBetAmount(`single-${dice.value}`) > 0
        }"
        @click="placeBet(`single-${dice.value}`)"
      >
        <!-- 投注金额显示 -->
        <div 
          v-if="getBetAmount(`single-${dice.value}`) > 0" 
          class="bet-amount"
        >
          {{ getBetAmount(`single-${dice.value}`) }}
        </div>
        
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
        
        <!-- 赔率说明 -->
        <div class="dice-odds-info">
          <div class="odds-line">
            <span class="odds-count">1个</span>
            <span class="odds-ratio">1:1</span>
          </div>
          <div class="odds-line">
            <span class="odds-count">2个</span>
            <span class="odds-ratio">1:2</span>
          </div>
          <div class="odds-line">
            <span class="odds-count">3个</span>
            <span class="odds-ratio">1:3</span>
          </div>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Props定义
interface Props {
  selectedChip: number
  currentBets: Record<string, number>
}

const props = defineProps<Props>()

// Emits定义
interface Emits {
  'place-bet': [betType: string]
}

const emit = defineEmits<Emits>()

// 骰子选项配置
const diceOptions = [
  { value: 1, color: '#e74c3c' },
  { value: 2, color: '#3498db' },
  { value: 3, color: '#e67e22' },
  { value: 4, color: '#9b59b6' },
  { value: 5, color: '#27ae60' },
  { value: 6, color: '#f39c12' }
]

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

// 计算属性
const isSelected = computed(() => {
  return (betType: string) => {
    return props.currentBets[betType] > 0
  }
})

const getBetAmount = computed(() => {
  return (betType: string) => {
    return props.currentBets[betType] || 0
  }
})

// 方法
const placeBet = (betType: string) => {
  emit('place-bet', betType)
}
</script>

<style scoped>
.single-dice-section {
  /* 移除background和border */
  padding: 8px;
}

/* 骰子网格 */
.dice-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
}

.dice-btn {
  background: #2d7a4f;
  border: 2px solid #4a9f6e;
  color: white;
  padding: 12px 6px;
  border-radius: 8px;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s ease;
  position: relative;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.dice-btn:active {
  transform: scale(0.95);
  background: #4a9f6e;
}

.dice-btn.selected {
  background: #ffd700;
  color: #333;
  border-color: #ffed4e;
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
}

.dice-btn.has-bet {
  border-color: #ffd700;
}

/* 投注金额显示 */
.bet-amount {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #ff4757;
  color: white;
  border-radius: 50%;
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: bold;
  padding: 0 3px;
  border: 2px solid white;
  animation: betAmountAppear 0.3s ease;
  z-index: 2;
}

@keyframes betAmountAppear {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
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
  width: 32px;
  height: 32px;
  background: white;
  border-radius: 4px;
  position: relative;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.dice-dot {
  position: absolute;
  width: 4px;
  height: 4px;
  background: #333;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

/* 数字显示 */
.dice-number {
  font-size: 14px;
  font-weight: bold;
  margin: 4px 0;
  color: #ffd700;
}

/* 赔率信息 */
.dice-odds-info {
  width: 100%;
  font-size: 8px;
  line-height: 1.2;
}

.odds-line {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1px;
}

.odds-count {
  color: #ccc;
}

.odds-ratio {
  color: #90ee90;
  font-weight: 600;
}

/* 响应式适配 */
@media (max-width: 375px) {
  .dice-grid {
    gap: 6px;
  }
  
  .dice-btn {
    padding: 8px 4px;
    min-height: 100px;
  }
  
  .dice-face {
    width: 28px;
    height: 28px;
  }
  
  .dice-dot {
    width: 3px;
    height: 3px;
  }
  
  .dice-number {
    font-size: 12px;
  }
  
  .dice-odds-info {
    font-size: 7px;
  }
  
  .single-dice-section {
    padding: 6px;
  }
}

@media (max-width: 320px) {
  .dice-grid {
    gap: 4px;
  }
  
  .dice-btn {
    padding: 6px 2px;
    min-height: 85px;
  }
  
  .dice-face {
    width: 24px;
    height: 24px;
  }
  
  .dice-number {
    font-size: 10px;
  }
  
  .dice-odds-info {
    font-size: 6px;
  }
  
  .single-dice-section {
    padding: 4px;
  }
}

/* 横屏适配 */
@media (orientation: landscape) and (max-height: 500px) {
  .dice-btn {
    min-height: 80px;
    padding: 6px 3px;
  }
  
  .dice-face {
    width: 24px;
    height: 24px;
  }
  
  .single-dice-section {
    padding: 6px;
  }
}

/* 不同屏幕的网格适配 */
@media (max-width: 280px) {
  .dice-grid {
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(2, 1fr);
  }
  
  .dice-btn {
    min-height: 90px;
  }
}

/* 点击波纹效果 */
.dice-btn {
  overflow: hidden;
}

.dice-btn::before {
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

.dice-btn:active::before {
  width: 80px;
  height: 80px;
}

/* 选中状态的骰子面颜色调整 */
.dice-btn.selected .dice-face {
  background: #f8f9fa;
  border: 1px solid #333;
}

.dice-btn.selected .dice-dot {
  background: #333;
}
</style>