<template>
  <div class="number-bets-section">
    <!-- 上排：小数区域 4-10 -->
    <div class="number-row">
      <div class="numbers-grid">
        <button
          v-for="number in smallNumbers"
          :key="number.value"
          class="number-btn"
          :class="{ 
            selected: isSelected(`total-${number.value}`),
            'has-bet': getBetAmount(`total-${number.value}`) > 0,
            'high-odds': number.odds >= 30
          }"
          @click="placeBet(`total-${number.value}`)"
        >
          <!-- 投注金额显示 -->
          <div 
            v-if="getBetAmount(`total-${number.value}`) > 0" 
            class="bet-amount"
          >
            {{ getBetAmount(`total-${number.value}`) }}
          </div>
          
          <div class="number-value">{{ number.value }}</div>
          <div class="number-odds">{{ number.oddsDisplay }}</div>
          <div class="number-probability">{{ number.probability }}</div>
        </button>
      </div>
    </div>
    
    <!-- 下排：大数区域 11-17 (倒序) -->
    <div class="number-row">
      <div class="numbers-grid">
        <button
          v-for="number in bigNumbers"
          :key="number.value"
          class="number-btn"
          :class="{ 
            selected: isSelected(`total-${number.value}`),
            'has-bet': getBetAmount(`total-${number.value}`) > 0,
            'high-odds': number.odds >= 30
          }"
          @click="placeBet(`total-${number.value}`)"
        >
          <!-- 投注金额显示 -->
          <div 
            v-if="getBetAmount(`total-${number.value}`) > 0" 
            class="bet-amount"
          >
            {{ getBetAmount(`total-${number.value}`) }}
          </div>
          
          <div class="number-value">{{ number.value }}</div>
          <div class="number-odds">{{ number.oddsDisplay }}</div>
          <div class="number-probability">{{ number.probability }}</div>
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
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'place-bet': [betType: string]
}>()

// 点数投注配置（基于真实骰宝概率）
const numberConfigs = {
  4: { odds: 62, probability: '3种' },   // 最难出现
  5: { odds: 31, probability: '6种' },
  6: { odds: 18, probability: '10种' },
  7: { odds: 12, probability: '15种' },
  8: { odds: 8, probability: '21种' },
  9: { odds: 6, probability: '25种' },
  10: { odds: 6, probability: '27种' },  // 最容易（小数中）
  11: { odds: 6, probability: '27种' },  // 最容易（大数中）
  12: { odds: 6, probability: '25种' },
  13: { odds: 8, probability: '21种' },
  14: { odds: 12, probability: '15种' },
  15: { odds: 18, probability: '10种' },
  16: { odds: 31, probability: '6种' },
  17: { odds: 62, probability: '3种' }   // 最难出现
}

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
.number-bets-section {
  background: rgba(0,0,0,0.3);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #2d5a42;
}

/* 数字行布局 */
.number-row {
  margin-bottom: 12px;
}

.number-row:last-of-type {
  margin-bottom: 0;
}

.numbers-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}

.number-btn {
  background: #2d7a4f;
  border: 2px solid #4a9f6e;
  color: white;
  padding: 8px 4px;
  border-radius: 6px;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s ease;
  position: relative;
  min-height: 55px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.number-btn:active {
  transform: scale(0.95);
  background: #4a9f6e;
}

.number-btn.selected {
  background: #ffd700;
  color: #333;
  border-color: #ffed4e;
  box-shadow: 0 3px 8px rgba(255, 215, 0, 0.3);
}

.number-btn.has-bet {
  border-color: #ffd700;
}

/* 高赔率特殊样式 */
.number-btn.high-odds {
  background: linear-gradient(135deg, #2d7a4f, #1e5f3f);
  border-color: #ff6b6b;
}

.number-btn.high-odds.selected {
  background: linear-gradient(135deg, #ffd700, #ffed4e);
}

/* 投注金额显示 */
.bet-amount {
  position: absolute;
  top: -6px;
  right: -6px;
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
  border: 1px solid white;
  animation: betAmountAppear 0.3s ease;
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

/* 数字内容 */
.number-value {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 2px;
  line-height: 1;
}

.number-odds {
  font-size: 8px;
  color: #90ee90;
  font-weight: 600;
  margin-bottom: 1px;
}

.number-probability {
  font-size: 7px;
  color: #ccc;
  opacity: 0.8;
}

/* 响应式适配 */
@media (max-width: 375px) {
  .numbers-grid {
    gap: 4px;
  }
  
  .number-btn {
    padding: 6px 2px;
    min-height: 55px;
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
}

@media (max-width: 320px) {
  .numbers-grid {
    gap: 3px;
  }
  
  .number-btn {
    padding: 4px 1px;
    min-height: 50px;
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
}

/* 横屏适配 */
@media (orientation: landscape) and (max-height: 500px) {
  .number-btn {
    min-height: 45px;
    padding: 4px 2px;
  }
  
  .number-value {
    font-size: 12px;
  }
  
  .number-row {
    margin-bottom: 8px;
  }
}

/* 点击波纹效果 */
.number-btn {
  overflow: hidden;
}

.number-btn::before {
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

.number-btn:active::before {
  width: 60px;
  height: 60px;
}
</style>