<template>
  <div class="game-status">
    <div class="status-indicator" :class="statusClass">
      <div class="status-dot"></div>
      <span class="status-text">{{ statusText }}</span>
    </div>
    
    <div class="countdown" v-if="gameStore.gameState.countdown > 0">
      <div class="countdown-container">
        <svg class="countdown-ring" width="60" height="60">
          <circle
            class="countdown-ring-background"
            cx="30"
            cy="30"
            r="25"
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.15)"
            stroke-width="3"
          />
          <circle
            class="countdown-ring-progress"
            :class="{ 'countdown-urgent': gameStore.gameState.countdown <= 5 }"
            cx="30"
            cy="30"
            r="25"
            fill="transparent"
            stroke="#00BCD4"
            stroke-width="3"
            stroke-linecap="round"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="strokeDashoffset"
            transform="rotate(-90 30 30)"
          />
        </svg>
        <div class="countdown-content">
          <span 
            class="countdown-number"
            :class="{ 'countdown-urgent': gameStore.gameState.countdown <= 5 }"
          >
            {{ gameStore.gameState.countdown }}
          </span>
        </div>
      </div>
      <span class="countdown-label">{{ countdownLabel }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'

const gameStore = useGameStore()

// 倒计时环形进度条计算
const circumference = 2 * Math.PI * 25 // 半径25的圆周长
const totalSeconds = 30 // 假设总倒计时时长为30秒

const strokeDashoffset = computed(() => {
  const progress = gameStore.gameState.countdown / totalSeconds
  return circumference * (1 - progress)
})

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
  left: 15px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  z-index: 15;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.85);
  padding: 10px 16px;
  border-radius: 25px;
  backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.status-waiting .status-dot {
  background: #9E9E9E;
}

.status-betting .status-dot {
  background: #FF5722;
}

.status-dealing .status-dot {
  background: #FF9800;
}

.status-result .status-dot {
  background: #4CAF50;
}

.status-text {
  color: white;
  font-size: 14px;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.countdown {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.countdown-container {
  position: relative;
  width: 60px;
  height: 60px;
}

.countdown-ring {
  position: absolute;
  top: 0;
  left: 0;
  transform: rotate(0deg);
}

.countdown-ring-progress {
  transition: stroke-dashoffset 1s linear, stroke 0.3s ease;
}

.countdown-ring-progress.countdown-urgent {
  stroke: #FF5722;
}

.countdown-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.countdown-number {
  color: white;
  font-size: 18px;
  font-weight: 700;
  transition: color 0.3s ease;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.countdown-number.countdown-urgent {
  color: #FF5722;
}

.countdown-label {
  color: white;
  font-size: 12px;
  opacity: 0.85;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>