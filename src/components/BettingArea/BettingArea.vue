<template>
  <div class="betting-layout">
    <!-- 滚动内容区域 -->
    <div class="betting-content">
      <div class="betting-sections">
        <!-- 投注历史显示 -->
        <div class="bet-history" v-if="Object.keys(currentBets).length > 0">
          <div class="bet-history-title">当前投注</div>
          <div class="bet-list">
            <div 
              v-for="(amount, betType) in currentBets"
              :key="betType"
              class="bet-item"
            >
              {{ getBetDisplayName(betType) }}: {{ amount }}
            </div>
          </div>
        </div>

        <!-- 大小单双投注区域 -->
        <MainBets 
          :selectedChip="selectedChip"
          :currentBets="currentBets"
          @place-bet="handlePlaceBet"
        />

        <!-- 点数投注区域 -->
        <NumberBets 
          :selectedChip="selectedChip"
          :currentBets="currentBets"
          @place-bet="handlePlaceBet"
        />

        <!-- 其他投注区域占位 -->
        <div class="coming-soon">
          <div class="section-title">更多投注选项</div>
          <div class="placeholder">单骰、对子、三同号等投注区域即将上线...</div>
        </div>
      </div>
    </div>

    <!-- 底部固定区域 -->
    <div class="bottom-fixed-area">
      <!-- 筹码选择器 -->
      <div class="chip-selector">
        <div class="chip-list">
          <button
            v-for="chip in chips"
            :key="chip.value"
            class="chip-btn"
            :class="[`chip-${chip.value}`, { active: selectedChip === chip.value }]"
            @click="selectChip(chip.value)"
          >
            {{ chip.label }}
          </button>
        </div>
        <div class="bet-summary">
          <span class="balance">余额: {{ balance.toLocaleString() }}</span>
          <span class="total-bet">投注: {{ totalBetAmount.toLocaleString() }}</span>
        </div>
      </div>

      <!-- 控制按钮 -->
      <div class="control-buttons">
        <button 
          class="control-btn clear-btn" 
          @click="clearBets"
          :disabled="totalBetAmount === 0"
        >
          清除
        </button>
        <button 
          class="control-btn rebet-btn" 
          @click="rebet"
          :disabled="Object.keys(lastBets).length === 0"
        >
          重复投注
        </button>
        <button 
          class="control-btn confirm-btn" 
          @click="confirmBets"
          :disabled="totalBetAmount === 0"
        >
          确认投注
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBettingStore } from '@/stores/bettingStore'
import { useAudio } from '@/composables/useAudio'
import MainBets from './MainBets.vue'
import NumberBets from './NumberBets.vue'

const bettingStore = useBettingStore()
const { playSound } = useAudio()

// 筹码配置
const chips = [
  { value: 1, label: '1', color: '#8b4513' },
  { value: 10, label: '10', color: '#dc143c' },
  { value: 100, label: '100', color: '#ffd700' },
  { value: 1000, label: '1K', color: '#4169e1' },
  { value: 10000, label: '10K', color: '#9370db' }
]

// 响应式数据
const selectedChip = computed(() => bettingStore.selectedChip)
const currentBets = computed(() => bettingStore.currentBets)
const lastBets = computed(() => bettingStore.lastBets)
const balance = computed(() => bettingStore.balance)
const totalBetAmount = computed(() => bettingStore.totalBetAmount)

// 方法
const selectChip = (value: number) => {
  bettingStore.selectChip(value)
  playSound('chipSelect')
}

const handlePlaceBet = (betType: string) => {
  const success = bettingStore.placeBet(betType, selectedChip.value)
  if (success) {
    playSound('chipPlace')
  } else {
    // 余额不足，播放错误音效或显示提示
    console.log('余额不足')
  }
}

const clearBets = () => {
  bettingStore.clearBets()
  playSound('chipSelect')
}

const rebet = () => {
  bettingStore.rebet()
  playSound('chipPlace')
}

const confirmBets = () => {
  bettingStore.confirmBets()
  playSound('betConfirm')
}

const getBetDisplayName = (betType: string): string => {
  const nameMap: Record<string, string> = {
    'small': '小',
    'big': '大',
    'odd': '单',
    'even': '双',
    'total-4': '点数4',
    'total-5': '点数5',
    'total-6': '点数6',
    'total-7': '点数7',
    'total-8': '点数8',
    'total-9': '点数9',
    'total-10': '点数10',
    'total-11': '点数11',
    'total-12': '点数12',
    'total-13': '点数13',
    'total-14': '点数14',
    'total-15': '点数15',
    'total-16': '点数16',
    'total-17': '点数17'
  }
  return nameMap[betType] || betType
}

onMounted(() => {
  // 初始化音效
  playSound('chipSelect')
})
</script>

<style scoped>
.betting-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #0d2818;
  color: white;
  
  /* iOS Safari安全区域适配 */
  padding-bottom: env(safe-area-inset-bottom);
}

.betting-content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  padding-bottom: 160px; /* 为底部固定区域留空间 */
}

.betting-sections {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 投注历史 */
.bet-history {
  background: rgba(0,0,0,0.4);
  border-radius: 8px;
  padding: 12px;
  border: 1px solid #2d5a42;
}

.bet-history-title {
  font-size: 12px;
  color: #ffd700;
  margin-bottom: 8px;
  font-weight: 600;
}

.bet-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.bet-item {
  background: #4a7c59;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

/* 占位区域 */
.coming-soon {
  background: rgba(0,0,0,0.2);
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  border: 1px dashed #4a7c59;
}

.section-title {
  font-size: 14px;
  color: #ffd700;
  margin-bottom: 8px;
  font-weight: 600;
}

.placeholder {
  font-size: 12px;
  color: #888;
  font-style: italic;
}

/* 底部固定区域 */
.bottom-fixed-area {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0,0,0,0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid #2d5a42;
  z-index: 100;
  
  /* iOS Safari安全区域适配 */
  padding-bottom: max(12px, env(safe-area-inset-bottom));
}

/* 筹码选择器 */
.chip-selector {
  padding: 12px;
  border-bottom: 1px solid #4a7c59;
}

.chip-list {
  display: flex;
  justify-content: space-around;
  gap: 8px;
  margin-bottom: 10px;
}

.chip-btn {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 2px solid #666;
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.chip-btn:active {
  transform: scale(0.95);
}

.chip-1 { background: #8b4513; }
.chip-10 { background: #dc143c; }
.chip-100 { background: #ffd700; color: #333; }
.chip-1000 { background: #4169e1; }
.chip-10000 { background: #9370db; }

.chip-btn.active {
  border-color: #ffd700;
  box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.5);
  transform: scale(1.05);
}

.bet-summary {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 600;
}

.balance {
  color: #4CAF50;
}

.total-bet {
  color: #ff6b6b;
}

/* 控制按钮 */
.control-buttons {
  padding: 12px;
  display: flex;
  gap: 10px;
}

.control-btn {
  flex: 1;
  padding: 12px 8px;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s ease;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.control-btn:active {
  transform: scale(0.95);
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.clear-btn {
  background: #dc3545;
  color: white;
}

.rebet-btn {
  background: #ffc107;
  color: #333;
}

.confirm-btn {
  background: #28a745;
  color: white;
}

/* 响应式适配 */
@media (max-width: 375px) {
  .chip-btn {
    width: 45px;
    height: 45px;
    font-size: 10px;
  }
  
  .betting-sections {
    padding: 10px;
    gap: 12px;
  }
}

@media (max-height: 667px) {
  .betting-content {
    padding-bottom: 140px;
  }
  
  .chip-selector {
    padding: 10px;
  }
  
  .control-buttons {
    padding: 10px;
  }
}

/* 横屏适配 */
@media (orientation: landscape) and (max-height: 500px) {
  .bottom-fixed-area {
    position: relative;
  }
  
  .betting-content {
    padding-bottom: 0;
  }
}
</style>