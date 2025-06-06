<template>
  <div class="triple-bets-section">
    <div class="triple-grid">
      <!-- 特定三同号 -->
      <button
        v-for="triple in tripleOptions"
        :key="triple.value"
        class="triple-btn specific-triple"
        :class="{ 
          selected: isSelected(`triple-${triple.value}`),
          'has-bet': getBetAmount(`triple-${triple.value}`) > 0
        }"
        @click="placeBet(`triple-${triple.value}`)"
      >
        <!-- 投注金额显示 -->
        <div 
          v-if="getBetAmount(`triple-${triple.value}`) > 0" 
          class="bet-amount"
        >
          {{ getBetAmount(`triple-${triple.value}`) }}
        </div>
        
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
        
        <!-- 概率显示 -->
        <div class="triple-probability">1种</div>
      </button>
      
      <!-- 全围（任意三同号） -->
      <button
        class="triple-btn any-triple"
        :class="{ 
          selected: isSelected('any-triple'),
          'has-bet': getBetAmount('any-triple') > 0
        }"
        @click="placeBet('any-triple')"
      >
        <!-- 投注金额显示 -->
        <div 
          v-if="getBetAmount('any-triple') > 0" 
          class="bet-amount"
        >
          {{ getBetAmount('any-triple') }}
        </div>
        
        <!-- 全围图标 -->
        <div class="any-triple-icon">
          <div class="icon-text">全围</div>
          <div class="icon-subtitle">任意三同号</div>
        </div>
        
        <!-- 赔率显示 -->
        <div class="triple-odds any-odds">1:30</div>
        
        <!-- 概率显示 -->
        <div class="triple-probability">6种</div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Props
interface Props {
  selectedChip: number
  currentBets: Record<string, number>
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'place-bet': [betType: string]
}>()

// 三同号选项配置
const tripleOptions = [
  { value: 1, color: '#e74c3c' },
  { value: 2, color: '#3498db' },
  { value: 3, color: '#e67e22' },
  { value: 4, color: '#9b59b6' },
  { value: 5, color: '#27ae60' },
  { value: 6, color: '#f39c12' }
]

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

// 计算属性
const isSelected = (betType: string) => {
  return props.currentBets[betType] > 0
}

const getBetAmount = (betType: string) => {
  return props.currentBets[betType] || 0
}

// 方法
const placeBet = (betType: string) => {
  emit('place-bet', betType)
}
</script>

<style scoped>
.triple-bets-section {
  background: rgba(0,0,0,0.3);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #2d5a42;
}

/* 三同号网格 */
.triple-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}

.triple-btn {
  border: 2px solid #4a9f6e;
  color: white;
  padding: 8px 4px;
  border-radius: 8px;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s ease;
  position: relative;
  min-height: 110px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
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

.triple-btn:active {
  transform: scale(0.95);
}

.triple-btn.selected {
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #333;
  border-color: #ffed4e;
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
}

.triple-btn.has-bet {
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
  min-width: 16px;
  height: 16px;
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

/* 三个骰子容器 */
.triple-dice-container {
  display: flex;
  gap: 2px;
  align-items: center;
  justify-content: center;
  margin: 4px 0;
}

.triple-dice {
  display: flex;
  align-items: center;
  justify-content: center;
}

.dice-face {
  width: 12px;
  height: 12px;
  background: white;
  border-radius: 2px;
  position: relative;
  box-shadow: 0 1px 2px rgba(0,0,0,0.3);
}

.dice-dot {
  position: absolute;
  width: 1.5px;
  height: 1.5px;
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
  font-size: 14px;
  font-weight: bold;
  color: white;
  margin-bottom: 2px;
}

.icon-subtitle {
  font-size: 8px;
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
  line-height: 1.2;
}

/* 标签和赔率 */
.triple-label {
  font-size: 10px;
  font-weight: bold;
  color: white;
  margin: 2px 0;
}

.triple-odds {
  font-size: 8px;
  color: #90ee90;
  font-weight: 600;
  margin: 1px 0;
}

.any-odds {
  color: #ffeb3b;
}

.triple-probability {
  font-size: 7px;
  color: #ccc;
  opacity: 0.8;
}

/* 响应式适配 */
@media (max-width: 375px) {
  .triple-grid {
    gap: 4px;
  }
  
  .triple-btn {
    padding: 6px 2px;
    min-height: 90px;
  }
  
  .dice-face {
    width: 10px;
    height: 10px;
  }
  
  .dice-dot {
    width: 1px;
    height: 1px;
  }
  
  .icon-text {
    font-size: 12px;
  }
  
  .icon-subtitle {
    font-size: 7px;
  }
}

@media (max-width: 320px) {
  .triple-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 3px;
  }
  
  .any-triple {
    grid-column: span 4;
    grid-row: 2;
  }
  
  .triple-btn {
    min-height: 80px;
  }
}

/* 横屏适配 */
@media (orientation: landscape) and (max-height: 500px) {
  .triple-btn {
    min-height: 70px;
    padding: 4px 2px;
  }
}

/* 点击波纹效果 */
.triple-btn {
  overflow: hidden;
}

.triple-btn::before {
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

.triple-btn:active::before {
  width: 60px;
  height: 60px;
}

/* 选中状态的骰子面颜色调整 */
.triple-btn.selected .dice-face {
  background: #f8f9fa;
  border: 1px solid #333;
}

.triple-btn.selected .dice-dot {
  background: #333;
}
</style>