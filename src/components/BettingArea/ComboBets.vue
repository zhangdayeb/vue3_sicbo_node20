<template>
  <div class="combo-bets-section">
    <div class="section-header">
      <h3 class="section-title">两两组合</h3>
      <div class="section-subtitle">投注两个特定数字组合 - 赔率 1:6</div>
    </div>
    
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
        
        <!-- 概率显示 -->
        <div class="combo-probability">{{ combo.probability }}</div>
      </button>
    </div>
    
    <!-- 规则说明 */
    <div class="rules-explanation">
      <div class="rules-title">组合投注规则</div>
      <div class="rules-content">
        <div class="rule-item">
          <span class="rule-icon">🎯</span>
          <span class="rule-text">投注两个特定数字的组合（如：1-2, 3-4等）</span>
        </div>
        <div class="rule-item">
          <span class="rule-icon">🎲</span>
          <span class="rule-text">三个骰子中包含这两个数字即中奖</span>
        </div>
        <div class="rule-item">
          <span class="rule-icon">💰</span>
          <span class="rule-text">中奖赔率：1:6（下注10获得60+本金10）</span>
        </div>
        <div class="rule-item">
          <span class="rule-icon">📊</span>
          <span class="rule-text">每个组合出现概率约为13.9%</span>
        </div>
      </div>
    </div>
    
    <!-- 快速投注区域 -->
    <div class="quick-bet-section">
      <div class="quick-bet-title">快速投注</div>
      <div class="quick-bet-buttons">
        <button 
          class="quick-bet-btn"
          @click="betAllCombos"
          :disabled="!canBetAll"
        >
          投注所有组合
        </button>
        <button 
          class="quick-bet-btn"
          @click="betLowCombos"
          :disabled="!canBetLow"
        >
          投注低位组合
        </button>
        <button 
          class="quick-bet-btn"
          @click="betHighCombos"
          :disabled="!canBetHigh"
        >
          投注高位组合
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

// 生成所有可能的两两组合
const comboOptions = [
  // 第一行：1与其他数字组合
  { type: 'combo-1-2', first: 1, second: 2, label: '1-2', probability: '30种' },
  { type: 'combo-1-3', first: 1, second: 3, label: '1-3', probability: '30种' },
  { type: 'combo-1-4', first: 1, second: 4, label: '1-4', probability: '30种' },
  { type: 'combo-1-5', first: 1, second: 5, label: '1-5', probability: '30种' },
  { type: 'combo-1-6', first: 1, second: 6, label: '1-6', probability: '30种' },
  
  // 第二行：2与其他数字组合（排除已有的1-2）
  { type: 'combo-2-3', first: 2, second: 3, label: '2-3', probability: '30种' },
  { type: 'combo-2-4', first: 2, second: 4, label: '2-4', probability: '30种' },
  { type: 'combo-2-5', first: 2, second: 5, label: '2-5', probability: '30种' },
  { type: 'combo-2-6', first: 2, second: 6, label: '2-6', probability: '30种' },
  
  // 第三行：3与其他数字组合（排除已有的）
  { type: 'combo-3-4', first: 3, second: 4, label: '3-4', probability: '30种' },
  { type: 'combo-3-5', first: 3, second: 5, label: '3-5', probability: '30种' },
  { type: 'combo-3-6', first: 3, second: 6, label: '3-6', probability: '30种' },
  
  // 第四行：4与其他数字组合（排除已有的）
  { type: 'combo-4-5', first: 4, second: 5, label: '4-5', probability: '30种' },
  { type: 'combo-4-6', first: 4, second: 6, label: '4-6', probability: '30种' },
  
  // 第五行：5与6的组合
  { type: 'combo-5-6', first: 5, second: 6, label: '5-6', probability: '30种' }
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

const canBetAll = computed(() => {
  return props.balance >= props.selectedChip * 15
})

const canBetLow = computed(() => {
  // 低位组合（包含1,2,3的组合）
  return props.balance >= props.selectedChip * 9
})

const canBetHigh = computed(() => {
  // 高位组合（包含4,5,6的组合）
  return props.balance >= props.selectedChip * 6
})

// 方法
const placeBet = (betType: string) => {
  emit('place-bet', betType)
}

const betAllCombos = () => {
  if (canBetAll.value) {
    comboOptions.forEach(combo => {
      emit('place-bet', combo.type)
    })
  }
}

const betLowCombos = () => {
  if (canBetLow.value) {
    // 包含1,2,3的组合
    const lowCombos = comboOptions.filter(combo => 
      combo.first <= 3 || combo.second <= 3
    )
    lowCombos.forEach(combo => {
      emit('place-bet', combo.type)
    })
  }
}

const betHighCombos = () => {
  if (canBetHigh.value) {
    // 包含4,5,6的组合
    const highCombos = comboOptions.filter(combo => 
      combo.first >= 4 && combo.second >= 4
    )
    highCombos.forEach(combo => {
      emit('place-bet', combo.type)
    })
  }
}
</script>

<style scoped>
.combo-bets-section {
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

/* 组合网格 - 5行3列布局 */
.combo-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
  margin-bottom: 16px;
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

/* 概率显示 */
.combo-probability {
  font-size: 7px;
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
  gap: 6px;
}

.quick-bet-btn {
  flex: 1;
  background: linear-gradient(135deg, #3498db, #2980b9);
  border: none;
  color: white;
  padding: 8px 6px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 10px;
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
  
  .quick-bet-btn {
    font-size: 9px;
    padding: 6px 4px;
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
  
  .rules-explanation {
    display: none; /* 超小屏幕隐藏规则说明 */
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
  
  .rules-explanation,
  .quick-bet-section {
    display: none; /* 横屏时隐藏说明和快速投注 */
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