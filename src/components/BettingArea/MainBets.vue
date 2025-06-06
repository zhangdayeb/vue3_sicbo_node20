@media (max-width: 280px) {
  .main-bets-grid {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(2, 1fr);
    gap: 3px;
  }
  
  .main-bet-btn {
    min-height: 55px;
  }
}<template>
  <div class="main-bets-section">
    <div class="main-bets-grid">
      <button
        v-for="bet in mainBets"
        :key="bet.type"
        class="main-bet-btn"
        :class="{ 
          selected: isSelected(bet.type),
          'has-bet': getBetAmount(bet.type) > 0
        }"
        @click="placeBet(bet.type)"
      >
        <!-- 投注金额显示 -->
        <div 
          v-if="getBetAmount(bet.type) > 0" 
          class="bet-amount"
        >
          {{ getBetAmount(bet.type) }}
        </div>
        
        <!-- 主标签 -->
        <div class="bet-label">{{ bet.label }}</div>
        
        <!-- 点数范围（大小有显示） -->
        <div v-if="bet.range" class="bet-range">{{ bet.range }}</div>
        
        <!-- 赔率显示 -->
        <div class="bet-odds">{{ bet.odds }}</div>
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

// 大小单双投注配置
const mainBets = [
  {
    type: 'small',
    label: '小',
    range: '4-10',
    odds: '1:1',
    color: '#2d7a4f'
  },
  {
    type: 'odd',
    label: '单',
    range: null,
    odds: '1:1',
    color: '#2d7a4f'
  },
  {
    type: 'even',
    label: '双',
    range: null,
    odds: '1:1',
    color: '#2d7a4f'
  },
  {
    type: 'big',
    label: '大',
    range: '11-17',
    odds: '1:1',
    color: '#2d7a4f'
  }
]

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
.main-bets-section {
  background: rgba(0,0,0,0.3);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #2d5a42;
}

/* 1x4网格布局 */
.main-bets-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.main-bet-btn {
  background: #2d7a4f;
  border: 2px solid #4a9f6e;
  color: white;
  padding: 16px 8px;
  border-radius: 8px;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s ease;
  position: relative;
  min-height: 80px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-weight: 600;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.main-bet-btn:active {
  transform: scale(0.95);
  background: #4a9f6e;
}

.main-bet-btn.selected {
  background: #ffd700;
  color: #333;
  border-color: #ffed4e;
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
}

.main-bet-btn.has-bet {
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
  min-width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: bold;
  padding: 0 4px;
  border: 2px solid white;
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

/* 投注内容 */
.bet-label {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 4px;
  line-height: 1;
}

.bet-range {
  font-size: 11px;
  opacity: 0.9;
  margin-bottom: 4px;
  color: #e8e8e8;
}

.bet-odds {
  font-size: 10px;
  color: #90ee90;
  font-weight: 600;
}

/* 响应式适配 */
@media (max-width: 375px) {
  .main-bet-btn {
    padding: 10px 4px;
    min-height: 65px;
  }
  
  .bet-label {
    font-size: 16px;
  }
  
  .main-bets-grid {
    gap: 6px;
  }
}

@media (max-width: 320px) {
  .main-bets-grid {
    gap: 4px;
  }
  
  .main-bet-btn {
    padding: 8px 2px;
    min-height: 60px;
  }
  
  .bet-label {
    font-size: 14px;
  }
  
  .bet-range {
    font-size: 9px;
  }
  
  .bet-odds {
    font-size: 8px;
  }
}

/* 横屏适配 */
@media (orientation: landscape) and (max-height: 500px) {
  .main-bet-btn {
    min-height: 50px;
    padding: 6px 3px;
  }
  
  .bet-label {
    font-size: 14px;
  }
  
  .bet-range {
    font-size: 9px;
  }
  
  .bet-odds {
    font-size: 8px;
  }
  
  .main-bets-grid {
    gap: 6px;
  }
}

/* 点击波纹效果 */
.main-bet-btn {
  overflow: hidden;
}

.main-bet-btn::before {
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

.main-bet-btn:active::before {
  width: 100px;
  height: 100px;
}
</style>