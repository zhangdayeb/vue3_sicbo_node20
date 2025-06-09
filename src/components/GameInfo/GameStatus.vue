<template>
  <div class="game-status">
    <!-- Naive UI 配置提供者 - 应用游戏主题 -->
    <n-config-provider :theme-overrides="gameTheme">
      <!-- 状态指示器 -->
      <div class="status-indicator" :class="statusClass">
        <div class="status-dot"></div>
        <span class="status-text">{{ statusText }}</span>
      </div>
      
      <!-- 倒计时 - 只在有倒计时时显示 -->
      <div class="countdown" v-if="gameState.countdown > 0">
        <div class="countdown-container">
          <!-- 使用原有的 SVG 结构确保完全匹配 -->
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
              :class="{ 'countdown-urgent': gameState.countdown <= 5 }"
              cx="30"
              cy="30"
              r="25"
              fill="transparent"
              :stroke="progressColor"
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
              :class="{ 'countdown-urgent': gameState.countdown <= 5 }"
            >
              {{ gameState.countdown }}
            </span>
          </div>
        </div>
      </div>

      <!-- 连接状态指示器 - 仅在连接异常时显示 -->
      <div 
        v-if="!isConnected" 
        class="connection-status"
        :class="connectionStatusClass"
      >
        <div class="connection-icon">{{ connectionIcon }}</div>
        <span class="connection-text">{{ connectionText }}</span>
      </div>
    </n-config-provider>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, onMounted, onUnmounted } from 'vue'
import { NConfigProvider } from 'naive-ui'
import { useWebSocketEvents } from '@/composables/useWebSocketEvents'
import type { CountdownData, GameResultData, GameStatusData } from '@/types/api'

// 游戏主题配置 - 最小化配置，保持原有样式
const gameTheme = {
  common: {
    textColorBase: '#ffffff',
  }
}

// 游戏状态类型定义
type GameStatus = 'waiting' | 'betting' | 'dealing' | 'result' | 'maintenance'

// 组件内部状态 - 完全独立的状态管理
const gameState = reactive({
  status: 'waiting' as GameStatus,
  countdown: 0,
  gameNumber: '',
  round: 1,
  lastUpdateTime: 0
})

// 连接状态
const connectionState = reactive({
  isConnected: false,
  status: 'disconnected' as string,
  error: null as string | null
})

// WebSocket 事件监听
const { 
  onCountdown, 
  onGameResult, 
  onGameStatus, 
  onError,
  getConnectionStatus,
  isConnected: wsConnected
} = useWebSocketEvents()

// 定时器引用
let resultDisplayTimer: number | null = null
let countdownTimer: number | null = null

// 清理定时器
const clearTimers = () => {
  if (resultDisplayTimer) {
    clearTimeout(resultDisplayTimer)
    resultDisplayTimer = null
  }
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
}

// 倒计时环形进度条计算
const circumference = 2 * Math.PI * 25 // 半径25的圆周长
const totalSeconds = 30 // 总倒计时时长

const strokeDashoffset = computed(() => {
  const progress = gameState.countdown / totalSeconds
  return circumference * (1 - progress)
})

const progressColor = computed(() => {
  const countdown = gameState.countdown
  if (countdown <= 5) return '#FF5722'
  return '#00BCD4'
})

// 状态样式计算
const statusClass = computed(() => {
  const status = gameState.status
  return {
    'status-waiting': status === 'waiting',
    'status-betting': status === 'betting',
    'status-dealing': status === 'dealing',
    'status-result': status === 'result',
    'status-maintenance': status === 'maintenance'
  }
})

const statusText = computed(() => {
  const statusMap: Record<GameStatus, string> = {
    waiting: '等待开始',
    betting: '投注中',
    dealing: '开牌中',
    result: '结果公布',
    maintenance: '系统维护'
  }
  return statusMap[gameState.status] || '未知状态'
})

// 连接状态相关
const isConnected = computed(() => {
  return connectionState.isConnected && wsConnected()
})

const connectionStatusClass = computed(() => {
  return {
    'connection-error': connectionState.status === 'error',
    'connection-disconnected': connectionState.status === 'disconnected',
    'connection-reconnecting': connectionState.status === 'reconnecting'
  }
})

const connectionIcon = computed(() => {
  switch (connectionState.status) {
    case 'error': return '❌'
    case 'reconnecting': return '🔄'
    case 'disconnected': return '⚠️'
    default: return '🔌'
  }
})

const connectionText = computed(() => {
  switch (connectionState.status) {
    case 'error': return '连接错误'
    case 'reconnecting': return '重连中...'
    case 'disconnected': return '连接断开'
    default: return '连接异常'
  }
})

// WebSocket 事件处理函数

// 处理倒计时事件
const handleCountdown = (data: CountdownData) => {
  console.log('🎯 GameStatus 收到倒计时事件:', data)
  
  gameState.countdown = data.countdown
  gameState.gameNumber = data.game_number
  gameState.lastUpdateTime = Date.now()
  
  // 根据倒计时和状态更新游戏阶段
  if (data.status === 'betting' && data.countdown > 0) {
    gameState.status = 'betting'
    
    // 启动本地倒计时（防止网络延迟）
    startLocalCountdown()
  } else if (data.status === 'dealing' || data.countdown === 0) {
    gameState.status = 'dealing'
    gameState.countdown = 0
    clearTimers()
  } else if (data.status === 'waiting') {
    gameState.status = 'waiting'
    gameState.countdown = 0
    clearTimers()
  }
}

// 处理游戏结果事件
const handleGameResult = (data: GameResultData) => {
  console.log('🎲 GameStatus 收到游戏结果:', data)
  
  // 切换到结果状态
  gameState.status = 'result'
  gameState.countdown = 0
  gameState.gameNumber = data.game_number
  gameState.lastUpdateTime = Date.now()
  
  clearTimers()
  
  // 结果显示5秒后回到等待状态
  resultDisplayTimer = window.setTimeout(() => {
    if (gameState.status === 'result') {
      gameState.status = 'waiting'
      console.log('📋 结果显示完毕，回到等待状态')
    }
  }, 5000)
}

// 处理游戏状态事件（维护等）
const handleGameStatus = (data: GameStatusData) => {
  console.log('🔧 GameStatus 收到状态事件:', data)
  
  if (data.status === 'maintenance') {
    gameState.status = 'maintenance'
    gameState.countdown = 0
    clearTimers()
  }
}

// 处理连接错误
const handleError = (error: any) => {
  console.error('❌ WebSocket 错误:', error)
  connectionState.error = error.message || '连接错误'
}

// 本地倒计时（防止网络延迟造成的不准确）
const startLocalCountdown = () => {
  clearTimers()
  
  countdownTimer = window.setInterval(() => {
    if (gameState.countdown > 0) {
      gameState.countdown--
      
      // 倒计时到0时自动切换到开牌状态
      if (gameState.countdown === 0) {
        gameState.status = 'dealing'
        clearTimers()
        console.log('⏰ 本地倒计时结束，切换到开牌状态')
      }
    } else {
      clearTimers()
    }
  }, 1000)
}

// 更新连接状态
const updateConnectionStatus = () => {
  const wsStatus = getConnectionStatus()
  connectionState.status = wsStatus
  connectionState.isConnected = wsConnected()
  
  if (connectionState.isConnected) {
    connectionState.error = null
  }
}

// 生命周期管理
onMounted(() => {
  console.log('🎮 GameStatus 组件已挂载，开始监听 WebSocket 事件')
  
  // 监听 WebSocket 事件
  onCountdown(handleCountdown)
  onGameResult(handleGameResult)
  onGameStatus(handleGameStatus)
  onError(handleError)
  
  // 初始化连接状态
  updateConnectionStatus()
  
  // 定期检查连接状态
  const connectionChecker = setInterval(() => {
    updateConnectionStatus()
  }, 1000)
  
  // 组件卸载时清理
  onUnmounted(() => {
    clearInterval(connectionChecker)
  })
})

onUnmounted(() => {
  console.log('🎮 GameStatus 组件即将卸载，清理资源')
  clearTimers()
  
  // WebSocket 事件监听器会在 useWebSocketEvents 中自动清理
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

.status-maintenance .status-dot {
  background: #F44336;
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

.countdown-ring-progress {
  transition: stroke-dashoffset 1s linear, stroke 0.3s ease;
}

.countdown-ring-progress.countdown-urgent {
  stroke: #FF5722;
}

/* 连接状态指示器 */
.connection-status {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(244, 67, 54, 0.9);
  padding: 8px 12px;
  border-radius: 20px;
  backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.connection-status.connection-reconnecting {
  background: rgba(255, 152, 0, 0.9);
}

.connection-status.connection-disconnected {
  background: rgba(158, 158, 158, 0.9);
}

.connection-icon {
  font-size: 12px;
  line-height: 1;
}

.connection-text {
  color: white;
  font-size: 12px;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

/* 动画效果 */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* 重连动画 */
.connection-status.connection-reconnecting .connection-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>