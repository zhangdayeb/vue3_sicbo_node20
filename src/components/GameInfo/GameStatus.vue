<template>
  <div class="game-status">
    <!-- Naive UI 配置提供者 - 应用游戏主题 -->
    <n-config-provider :theme-overrides="gameTheme">
      <!-- 状态指示器 - 保持原有设计 -->
      <div class="status-indicator" :class="statusClass">
        <div class="status-dot"></div>
        <span class="status-text">{{ statusText }}</span>
      </div>
      
      <!-- 倒计时 - 使用 Naive UI 圆形进度条替代 SVG -->
      <div class="countdown" v-if="gameStore.gameState.countdown > 0">
        <div class="countdown-container">
          <n-progress 
            type="circle" 
            :percentage="countdownPercentage"
            :color="progressColor"
            :rail-color="'rgba(255, 255, 255, 0.15)'"
            :stroke-width="3"
            :show-indicator="false"
            :size="60"
            class="countdown-ring"
          />
          <div class="countdown-content">
            <span 
              class="countdown-number"
              :class="{ 'countdown-urgent': gameStore.gameState.countdown <= 5 }"
            >
              {{ gameStore.gameState.countdown }}
            </span>
          </div>
        </div>
      </div>
    </n-config-provider>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NConfigProvider, NProgress } from 'naive-ui'
import { useGameStore } from '@/stores/gameStore'

// 游戏主题配置 - 最小化配置，保持原有样式
const gameTheme = {
  common: {
    textColorBase: '#ffffff',
  },
  Progress: {
    fillColor: '#00BCD4',
    railColor: 'rgba(255, 255, 255, 0.15)',
  }
}

const gameStore = useGameStore()

// 倒计时环形进度条计算
const totalSeconds = 30 // 假设总倒计时时长为30秒

const countdownPercentage = computed(() => {
  const progress = gameStore.gameState.countdown / totalSeconds
  return Math.max(0, Math.min(100, progress * 100))
})

const progressColor = computed(() => {
  const countdown = gameStore.gameState.countdown
  if (countdown <= 5) return '#FF5722'
  return '#00BCD4'
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
  const status = gameStore.gameState.status
  const statusMap: Record<string, string> = {
    waiting: '等待开始',
    betting: '投注中',
    dealing: '开牌中',
    result: '结果公布'
  }
  return statusMap[status] || '未知状态'
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

/* 状态指示器 - 保持原有样式 */
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

/* 倒计时 - 保持原有布局，只替换圆形进度条 */
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

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* 深度样式覆盖 - 确保 Naive UI 进度条样式正确 */
:deep(.n-progress.n-progress--circle) {
  position: absolute;
  top: 0;
  left: 0;
}

:deep(.n-progress .n-progress-graph-circle-fill) {
  transition: stroke-dashoffset 1s linear;
}
</style>