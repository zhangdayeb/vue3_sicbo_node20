<template>
  <div class="combo-bets-section">
    <div class="combo-grid">
      <button
        v-for="combo in comboOptions"
        :key="combo.type"
        class="combo-btn"
        :class="{ 
          selected: isSelected(combo.type),
          'has-bet': getBetAmount(combo.type) > 0
        }"
        @click="placeBet(combo.type)"
      >
        <!-- 投注金额显示 -->
        <div 
          v-if="getBetAmount(combo.type) > 0" 
          class="bet-amount"
        >
          {{ getBetAmount(combo.type) }}
        </div>
        
        <!-- 两个骰子显示 -->
        <div class="combo-dice-container">
          <div class="combo-dice">
            <div class="dice-face">
              <div 
                v-for="dot in getDotPattern(combo.first)" 
                :key="`first-${dot.id}`"
                class="dice-dot"
                :style="{ 
                  top: dot.top, 
                  left: dot.left 
                }"
              ></div>
            </div>
          </div>
          <div class="combo-separator">+</div>
          <div class="combo-dice">
            <div class="dice-face">
              <div 
                v-for="dot in getDotPattern(combo.second)" 
                :key="`second-${dot.id}`"
                class="dice-dot"
                :style="{ 
                  top: dot.top, 
                  left: dot.left 
                }"
              ></div>
            </div>
          </div>
        </div>
        
        <!-- 组合标签 -->
        <div class="combo-label">{{ combo.label }}</div>
        
        <!-- 赔率显示 -->
        <div class="combo-odds">1:6</div>
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
  balance: number
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'place-bet': [betType: string]
}>()

// 生成所有可能的两两组合
const comboOptions = [
  // 第一行：1与其他数字组合
  { type: 'combo-1-2', first: 1, second: 2, label: '1-2' },
  { type: 'combo-1-3', first: 1, second: 3, label: '1-3' },
  { type: 'combo-1-4', first: 1, second: 4, label: '1-4' },
  { type: 'combo-1-5', first: 1, second: 5, label: '1-5' },
  { type: 'combo-1-6', first: 1, second: 6, label: '1-6' },
  
  // 第二行：2与其他数字组合（排除已有的1-2）
  { type: 'combo-2-3', first: 2, second: 3, label: '2-3' },
  { type: 'combo-2-4', first: 2, second: 4, label: '2-4' },
  { type: 'combo-2-5', first: 2, second: 5, label: '2-5' },
  { type: 'combo-2-6', first: 2, second: 6, label: '2-6' },
  
  // 第三行：3与其他数字组合（排除已有的）
  { type: 'combo-3-4', first: 3, second: 4, label: '3-4' },
  { type: 'combo-3-5', first: 3, second: 5, label: '3-5' },
  { type: 'combo-3-6', first: 3, second: 6, label: '3-6' },
  
  // 第四行：4与其他数字组合（排除已有的）
  { type: 'combo-4-5', first: 4, second: 5, label: '4-5' },
  { type: 'combo-4-6', first: 4, second: 6, label: '4-6' },
  
  // 第五行：5与6的组合
  { type: 'combo-5-6', first: 5, second: 6, label: '5-6' }
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
.combo-bets-section {
  background: rgba(0,0,0,0.3);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #2d5a42;
}

/* 组合网格 - 5行3列布局 */
.combo-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
}

.combo-btn {
  background: #2d7a4f;
  border: 2px solid #4a9f6e;
  color: white;
  padding: 8px 3px;
  border-radius: 6px;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s ease;
  position: relative;
  min-height: 80px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.combo-btn:active {
  transform: scale(0.95);
  background: #4a9f6e;
}

.combo-btn.selected {
  background: #ffd700;
  color: #333;
  border-color: #ffed4e;
  box-shadow: 0 3px 8px rgba(255, 215, 0, 0.3);
}

.combo-btn.has-bet {
  border-color: #ffd700;
}

/* 投注金额显示 */
.bet-amount {
  position: absolute;
  top: -6px;
  right: -6px;
  background: #ff4757;
  color: white;
  border-radius: 50%;
  min-width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 8px;
  font-weight: bold;
  padding: 0 2px;
  border: 1px solid white;
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

/* 组合骰子容器 */
.combo-dice-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  margin: 3px 0;
  flex: 1;
}

.combo-dice {
  display: flex;
  align-items: center;
  justify-content: center;
}

.dice-face {
  width: 14px;
  height: 14px;
  background: white;
  border-radius: 2px;
  position: relative;
  box-shadow: 0 1px 2px rgba(0,0,0,0.3);
}

.dice-dot {
  position: absolute;
  width: 2px;
  height: 2px;
  background: #333;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.combo-separator {
  font-size: 8px;
  color: #ffd700;
  font-weight: bold;
  margin: 0 1px;
}

/* 组合标签 */
.combo-label {
  font-size: 10px;
  font-weight: bold;
  color: #ffd700;
  margin: 2px 0;
}

/* 赔率显示 */
.combo-odds {
  font-size: 8px;
  color: #90ee90;
  font-weight: 600;
  margin: 1px 0;
}

/* 响应式适配 */
@media (max-width: 375px) {
  .combo-grid {
    gap: 4px;
  }
  
  .combo-btn {
    padding: 6px 2px;
    min-height: 70px;
  }
  
  .dice-face {
    width: 12px;
    height: 12px;
  }
  
  .dice-dot {
    width: 1.5px;
    height: 1.5px;
  }
  
  .combo-label {
    font-size: 9px;
  }
}

@media (max-width: 320px) {
  .combo-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 3px;
  }
  
  .combo-btn {
    padding: 5px 2px;
    min-height: 65px;
  }
  
  .dice-face {
    width: 10px;
    height: 10px;
  }
  
  .combo-label {
    font-size: 8px;
  }
}

/* 横屏适配 */
@media (orientation: landscape) and (max-height: 500px) {
  .combo-btn {
    min-height: 60px;
    padding: 4px 2px;
  }
  
  .dice-face {
    width: 10px;
    height: 10px;
  }
}

/* 特殊网格布局适配（当屏幕太小时） */
@media (max-width: 280px) {
  .combo-grid {
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(5, 1fr);
  }
  
  .combo-btn {
    min-height: 55px;
  }
}

/* 点击波纹效果 */
.combo-btn {
  overflow: hidden;
}

.combo-btn::before {
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

.combo-btn:active::before {
  width: 50px;
  height: 50px;
}

/* 选中状态的骰子面颜色调整 */
.combo-btn.selected .dice-face {
  background: #f8f9fa;
  border: 1px solid #333;
}

.combo-btn.selected .dice-dot {
  background: #333;
}
</style>