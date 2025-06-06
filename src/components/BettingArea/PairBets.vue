<template>
  <div class="pair-bets-section">
    <div class="section-header">
      <h3 class="section-title">对子投注</h3>
      <div class="section-subtitle">投注特定对子 - 赔率 1:10</div>
    </div>
    
    <div class="pairs-grid">
      <button
        v-for="pair in pairOptions"
        :key="pair.value"
        class="pair-btn"
        :class="{ 
          selected: isSelected(`pair-${pair.value}`),
          'has-bet': getBetAmount(`pair-${pair.value}`) > 0
        }"
        @click="placeBet(`pair-${pair.value}`)"
      >
        <!-- 投注金额显示 -->
        <div 
          v-if="getBetAmount(`pair-${pair.value}`) > 0" 
          class="bet-amount"
        >
          {{ getBetAmount(`pair-${pair.value}`) }}
        </div>
        
        <!-- 对子骰子显示 -->
        <div class="pair-dice-container">
          <div class="pair-dice">
            <div class="dice-face">
              <div 
                v-for="dot in getDotPattern(pair.value)" 
                :key="`left-${dot.id}`"
                class="dice-dot"
                :style="{ 
                  top: dot.top, 
                  left: dot.left 
                }"
              ></div>
            </div>
          </div>
          <div class="pair-dice">
            <div class="dice-face">
              <div 
                v-for="dot in getDotPattern(pair.value)" 
                :key="`right-${dot.id}`"
                class="dice-dot"
                :style="{ 
                  top: dot.top, 
                  left: dot.left 
                }"
              ></div>
            </div>
          </div>
        </div>
        
        <!-- 对子标签 */
        <div class="pair-label">{{ pair.value }}{{ pair.value }}</div>
        
        <!-- 赔率显示 */
        <div class="pair-odds">1:10</div>
        
        <!-- 概率显示 -->
        <div class="pair-probability">{{ pair.probability }}</div>
      </button>
    </div>
    
    <!-- 规则说明 */
    <div class="rules-explanation">
      <div class="rules-title">对子投注规则</div>
      <div class="rules-content">
        <div class="rule-item">
          <span class="rule-icon">🎯</span>
          <span class="rule-text">投注特定的对子组合（如：1-1, 2-2等）</span>
        </div>
        <div class="rule-item">
          <span class="rule-icon">🎲</span>
          <span class="rule-text">三个骰子中至少有两个显示相同数字即中奖</span>
        </div>
        <div class="rule-item">
          <span class="rule-icon">💰</span>
          <span class="rule-text">中奖赔率：1:10（下注10获得100+本金10）</span>
        </div>
        <div class="rule-item">
          <span class="rule-icon">📊</span>
          <span class="rule-text">每个对子出现概率约为13.9%</span>
        </div>
      </div>
    </div>
    
    <!-- 快速投注 -->
    <div class="quick-bet-section">
      <div class="quick-bet-title">快速投注</div>
      <div class="quick-bet-buttons">
        <button 
          class="quick-bet-btn"
          @click="betAllPairs"
          :disabled="!canBetAll"
        >
          投注所有对子
        </button>
        <button 
          class="quick-bet-btn"
          @click="betHighPairs"
          :disabled="!canBetHigh"
        >
          投注高位对子(4-6)
        </button>
        <button 
          class="quick-bet-btn"
          @click="betLowPairs"
          :disabled="!canBetLow"
        >
          投注低位对子(1-3)
        </button>
      </div>
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

// 对子选项配置
const pairOptions = [
  { value: 1, probability: '15种', color: '#e74c3c' },
  { value: 2, probability: '15种', color: '#3498db' },
  { value: 3, probability: '15种', color: '#e67e22' },
  { value: 4, probability: '15种', color: '#9b59b6' },
  { value: 5, probability: '15种', color: '#27ae60' },
  { value: 6, probability: '15种', color: '#f39c12' }
]

// 骰子点数图案配置（复用SingleDiceBets的逻辑）
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

const canBetAll = computed(() => {
  return props.balance >= props.selectedChip * 6
})

const canBetHigh = computed(() => {
  return props.balance >= props.selectedChip * 3
})

const canBetLow = computed(() => {
  return props.balance >= props.selectedChip * 3
})

// 方法
const placeBet = (betType: string) => {
  emit('place-bet', betType)
}

const betAllPairs = () => {
  if (canBetAll.value) {
    pairOptions.forEach(pair => {
      emit('place-bet', `pair-${pair.value}`)
    })
  }
}

const betHighPairs = () => {
  if (canBetHigh.value) {
    [4, 5, 6].forEach(value => {
      emit('place-bet', `pair-${value}`)
    })
  }
}

const betLowPairs = () => {
  if (canBetLow.value) {
    [1, 2, 3].forEach(value => {
      emit('place-bet', `pair-${value}`)
    })
  }
}
</script>

<style scoped>
.pair-bets-section {
  background: rgba(0,0,0,0.3);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #2d5a42;
}

.section-header {
  margin-bottom: 16px;
  text-align: center;
}

.section-title {
  font-size: 16px;
  color: #ffd700;
  margin: 0 0 4px 0;
  font-weight: 700;
}

.section-subtitle {
  font-size: 11px;
  color: #90ee90;
  opacity: 0.8;
}

/* 对子网格 */
.pairs-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.pair-btn {
  background: #2d7a4f;
  border: 2px solid #4a9f6e;
  color: white;
  padding: 10px 4px;
  border-radius: 8px;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s ease;
  position: relative;
  min-height: 100px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.pair-btn:active {
  transform: scale(0.95);
  background: #4a9f6e;
}

.pair-btn.selected {
  background: #ffd700;
  color: #333;
  border-color: #ffed4e;
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
}

.pair-btn.has-bet {
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

/* 对子骰子容器 */
.pair-dice-container {
  display: flex;
  gap: 4px;
  align-items: center;
  justify-content: center;
  margin: 4px 0;
}

.pair-dice {
  display: flex;
  align-items: center;
  justify-content: center;
}

.dice-face {
  width: 18px;
  height: 18px;
  background: white;
  border-radius: 3px;
  position: relative;
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
}

.dice-dot {
  position: absolute;
  width: 2.5px;
  height: 2.5px;
  background: #333;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

/* 对子标签 */
.pair-label {
  font-size: 12px;
  font-weight: bold;
  color: #ffd700;
  margin: 2px 0;
}

/* 赔率显示 */
.pair-odds {
  font-size: 9px;
  color: #90ee90;
  font-weight: 600;
  margin: 1px 0;
}

/* 概率显示 */
.pair-probability {
  font-size: 8px;
  color: #ccc;
  opacity: 0.8;
}

/* 规则说明 */
.rules-explanation {
  background: rgba(0,0,0,0.4);
  border-radius: 8px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 12px;
}

.rules-title {
  font-size: 12px;
  color: #ffd700;
  font-weight: 600;
  margin-bottom: 8px;
  text-align: center;
}

.rules-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rule-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 10px;
  color: #ccc;
}

.rule-icon {
  font-size: 12px;
  min-width: 16px;
}

.rule-text {
  flex: 1;
  line-height: 1.3;
}

/* 快速投注区域 */
.quick-bet-section {
  background: rgba(0,0,0,0.4);
  border-radius: 8px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.quick-bet-title {
  font-size: 12px;
  color: #ffd700;
  font-weight: 600;
  margin-bottom: 8px;
  text-align: center;
}

.quick-bet-buttons {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.quick-bet-btn {
  background: linear-gradient(135deg, #3498db, #2980b9);
  border: none;
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 600;
  transition: all 0.2s ease;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.quick-bet-btn:active {
  transform: scale(0.95);
}

.quick-bet-btn:disabled {
  background: #666;
  cursor: not-allowed;
  transform: none;
  opacity: 0.5;
}

.quick-bet-btn:not(:disabled):hover {
  background: linear-gradient(135deg, #2980b9, #21618c);
}

/* 响应式适配 */
@media (max-width: 375px) {
  .pairs-grid {
    gap: 6px;
  }
  
  .pair-btn {
    padding: 8px 3px;
    min-height: 85px;
  }
  
  .dice-face {
    width: 16px;
    height: 16px;
  }
  
  .dice-dot {
    width: 2px;
    height: 2px;
  }
  
  .pair-label {
    font-size: 11px;
  }
  
  .quick-bet-buttons {
    flex-direction: row;
    gap: 4px;
  }
  
  .quick-bet-btn {
    font-size: 9px;
    padding: 6px 8px;
  }
}

@media (max-width: 320px) {
  .pairs-grid {
    gap: 4px;
  }
  
  .pair-btn {
    padding: 6px 2px;
    min-height: 75px;
  }
  
  .dice-face {
    width: 14px;
    height: 14px;
  }
  
  .pair-label {
    font-size: 10px;
  }
  
  .rules-explanation {
    display: none; /* 超小屏幕隐藏规则说明 */
  }
}

/* 横屏适配 */
@media (orientation: landscape) and (max-height: 500px) {
  .pair-btn {
    min-height: 70px;
    padding: 6px 3px;
  }
  
  .dice-face {
    width: 14px;
    height: 14px;
  }
  
  .rules-explanation {
    display: none; /* 横屏时隐藏规则说明 */
  }
  
  .quick-bet-section {
    display: none; /* 横屏时隐藏快速投注 */
  }
}

/* 不同屏幕的网格适配 */
@media (max-width: 280px) {
  .pairs-grid {
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(2, 1fr);
  }
  
  .pair-btn {
    min-height: 80px;
  }
}

/* 点击波纹效果 */
.pair-btn {
  overflow: hidden;
}

.pair-btn::before {
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

.pair-btn:active::before {
  width: 60px;
  height: 60px;
}

/* 选中状态的骰子面颜色调整 */
.pair-btn.selected .dice-face {
  background: #f8f9fa;
  border: 1px solid #333;
}

.pair-btn.selected .dice-dot {
  background: #333;
}
</style>