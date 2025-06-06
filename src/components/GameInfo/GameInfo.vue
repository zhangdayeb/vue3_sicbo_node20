<template>
  <div class="game-info">
    <div class="game-round">
      <span class="round-label">第</span>
      <span class="round-number">{{ gameStore.gameState.round }}</span>
      <span class="round-label">局</span>
    </div>
    
    <div class="game-history" v-if="recentResults.length > 0">
      <div class="history-title">历史开奖</div>
      <div class="history-list">
        <div 
          v-for="result in recentResults.slice(0, 5)" 
          :key="result.round"
          class="history-item"
          :class="getResultClass(result)"
        >
          <div class="dice-result">
            <span v-for="dice in result.dices" :key="dice" class="dice">{{ dice }}</span>
          </div>
          <div class="result-info">
            <span class="total">{{ result.total }}</span>
            <span class="size">{{ result.size }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useGameStore } from '@/stores/gameStore'

interface GameResult {
  round: number
  dices: number[]
  total: number
  size: 'big' | 'small'
  isTriple: boolean
}

const gameStore = useGameStore()

// 模拟历史开奖数据
const recentResults = ref<GameResult[]>([
  { round: 1, dices: [4, 5, 6], total: 15, size: 'big', isTriple: false },
  { round: 2, dices: [2, 2, 3], total: 7, size: 'small', isTriple: false },
  { round: 3, dices: [1, 1, 1], total: 3, size: 'small', isTriple: true },
  { round: 4, dices: [6, 6, 5], total: 17, size: 'big', isTriple: false },
  { round: 5, dices: [3, 4, 2], total: 9, size: 'small', isTriple: false }
])

const getResultClass = (result: GameResult) => {
  return {
    'result-big': result.size === 'big',
    'result-small': result.size === 'small',
    'result-triple': result.isTriple
  }
}

// 监听新的开奖结果
const listenToGameResults = () => {
  window.addEventListener('cocos-to-vue-gameResult', (event: any) => {
    const newResult = event.detail
    recentResults.value.unshift(newResult)
    if (recentResults.value.length > 10) {
      recentResults.value.pop()
    }
  })
}

// 初始化监听
listenToGameResults()
</script>

<style scoped>
.game-info {
  position: absolute;
  bottom: 15px;
  left: 15px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 15;
}

.game-round {
  display: flex;
  align-items: center;
  gap: 3px;
  background: rgba(0, 0, 0, 0.8);
  padding: 6px 10px;
  border-radius: 6px;
  backdrop-filter: blur(4px);
}

.round-label {
  color: rgba(255, 255, 255, 0.8);
  font-size: 11px;
}

.round-number {
  color: #3498db;
  font-size: 14px;
  font-weight: bold;
  min-width: 20px;
  text-align: center;
}

.game-history {
  background: rgba(0, 0, 0, 0.8);
  padding: 8px;
  border-radius: 6px;
  backdrop-filter: blur(4px);
  max-width: 200px;
}

.history-title {
  color: white;
  font-size: 11px;
  font-weight: bold;
  margin-bottom: 6px;
  text-align: center;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
  max-height: 120px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 6px;
  border-radius: 3px;
  font-size: 10px;
}

.result-big {
  background: rgba(231, 76, 60, 0.3);
  border-left: 2px solid #e74c3c;
}

.result-small {
  background: rgba(52, 152, 219, 0.3);
  border-left: 2px solid #3498db;
}

.result-triple {
  background: rgba(241, 196, 15, 0.3);
  border-left: 2px solid #f1c40f;
}

.dice-result {
  display: flex;
  gap: 1px;
}

.dice {
  background: white;
  color: #333;
  width: 12px;
  height: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 1px;
  font-size: 8px;
  font-weight: bold;
}

.result-info {
  display: flex;
  align-items: center;
  gap: 4px;
  color: white;
}

.total {
  font-weight: bold;
  font-size: 10px;
}

.size {
  font-size: 8px;
  opacity: 0.8;
}
</style>