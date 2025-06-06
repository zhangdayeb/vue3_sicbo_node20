<template>
  <div class="game-status">
    <div class="status-indicator" :class="statusClass">
      <div class="status-dot"></div>
      <span class="status-text">{{ statusText }}</span>
    </div>
    
    <div class="countdown" v-if="gameStore.gameState.countdown > 0">
      <div class="countdown-circle">
        <span class="countdown-number">{{ gameStore.gameState.countdown }}</span>
      </div>
      <span class="countdown-label">{{ countdownLabel }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'

const gameStore = useGameStore()

const statusClass = computed(() => {
  const status = gameStore.gameState.status
  return {
    'status-waiting': status === 'waiting',
    'status-betting': status === 'betting',
    'status-dealing': status === 'dealing',
    'status-result': status === 'result'
  }
})

const statusText = computed(() => {
  const statusMap = {
    waiting: '等待开始',
    betting: '投注中',
    dealing: '开牌中',
    result: '结果公布'
  }
  return statusMap[gameStore.gameState.status] || '未知状态'
})

const countdownLabel = computed(() => {
  const labelMap = {
    betting: '投注倒计时',
    dealing: '开牌倒计时',
    result: '下局开始'
  }
  return labelMap[gameStore.gameState.status] || '倒计时'
})
</script>

<style scoped>
.game-status {
  position: absolute;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  z-index: 15;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.8);
  padding: 8px 16px;
  border-radius: 20px;
  backdrop-filter: blur(4px);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.status-waiting .status-dot {
  background: #95a5a6;
}

.status-betting .status-dot {
  background: #e74c3c;
}

.status-dealing .status-dot {
  background: #f39c12;
}

.status-result .status-dot {
  background: #27ae60;
}

.status-text {
  color: white;
  font-size: 14px;
  font-weight: 500;
}

.countdown {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.countdown-circle {
  width: 50px;
  height: 50px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid #e74c3c;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: spin 1s linear infinite;
  background: rgba(0, 0, 0, 0.8);
}

.countdown-number {
  color: white;
  font-size: 18px;
  font-weight: bold;
}

.countdown-label {
  color: white;
  font-size: 12px;
  opacity: 0.8;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>