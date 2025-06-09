<!-- src/components/BettingArea/BettingArea.vue -->
<template>
  <div class="betting-area">
    <!-- 主游戏区域 -->
    <div class="game-area">
      <!-- 滚动内容区域 -->
      <div class="betting-content">
        <!-- 统一的投注容器 -->
        <div class="betting-container">
          <div class="betting-sections">
            <!-- 大小单双投注区域 -->
            <MainBets 
              :selectedChip="selectedChip"
              :currentBets="currentBets"
              :confirmedBets="confirmedBets"
              :displayBets="displayBets"
              :canPlaceBet="canPlaceBet"
              @place-bet="handlePlaceBet"
            />

            <!-- 点数投注区域 -->
            <NumberBets 
              :selectedChip="selectedChip"
              :currentBets="currentBets"
              :confirmedBets="confirmedBets"
              :displayBets="displayBets"
              :canPlaceBet="canPlaceBet"
              @place-bet="handlePlaceBet"
            />

            <!-- 单骰投注区域 -->
            <SingleDiceBets
              :selectedChip="selectedChip"
              :currentBets="currentBets"
              :confirmedBets="confirmedBets"
              :displayBets="displayBets"
              :canPlaceBet="canPlaceBet"
              @place-bet="handlePlaceBet"
            />

            <!-- 对子投注区域 -->
            <PairBets
              :selectedChip="selectedChip"
              :currentBets="currentBets"
              :confirmedBets="confirmedBets"
              :displayBets="displayBets"
              :balance="balance"
              :canPlaceBet="canPlaceBet"
              @place-bet="handlePlaceBet"
            />

            <!-- 三同号投注区域 -->
            <TripleBets
              :selectedChip="selectedChip"
              :currentBets="currentBets"
              :confirmedBets="confirmedBets"
              :displayBets="displayBets"
              :canPlaceBet="canPlaceBet"
              @place-bet="handlePlaceBet"
            />

            <!-- 两两组合投注区域 -->
            <ComboBets
              :selectedChip="selectedChip"
              :currentBets="currentBets"
              :confirmedBets="confirmedBets"
              :displayBets="displayBets"
              :balance="balance"
              :canPlaceBet="canPlaceBet"
              @place-bet="handlePlaceBet"
            />
          </div>
        </div>
      </div>

      <!-- 底部固定区域 -->
      <div class="bottom-fixed-area">
        <!-- 筹码选择器 -->
        <ChipSelector
          :selectedChip="selectedChip"
          @select-chip="selectChip"
        />

        <!-- 控制按钮 -->
        <ControlButtons
          :totalBetAmount="totalBetAmount"
          :currentBets="currentBets"
          :lastBets="lastBets"
          :balance="balance"
          @cancel-current-bets="clearCurrentBets"
          @clear-field="clearField"
          @clear-all-field="clearAllField"
          @rebet="rebet"
          @confirm-bets="confirmBets"
        />
      </div>
    </div>

    <!-- 🎯 特效组件 -->
    <DiceRollingEffect ref="diceEffectRef" />
    <WinningEffect ref="winEffectRef" />

    <!-- 简化的调试信息 -->
    <div v-if="showDebugInfo" class="debug-info">
      <div class="debug-item">
        <span>连接:</span>
        <span :class="`status-${getConnectionStatus()}`">
          {{ getConnectionStatus() }}
        </span>
      </div>
      <div class="debug-item">
        <span>游戏:</span>
        <span>{{ gamePhase }}</span>
      </div>
      <div class="debug-item">
        <span>投注:</span>
        <span :class="`phase-${bettingStore.bettingPhase}`">{{ bettingStore.bettingPhase }}</span>
      </div>
      <div class="debug-item">
        <span>倒计时:</span>
        <span>{{ countdown }}s</span>
      </div>
      <div class="debug-item">
        <span>余额:</span>
        <span>¥{{ balance.toLocaleString() }}</span>
      </div>
      <div class="debug-item">
        <span>当前:</span>
        <span>¥{{ totalBetAmount.toLocaleString() }}</span>
      </div>
      <div class="debug-item">
        <span>已确认:</span>
        <span class="confirmed-amount">¥{{ bettingStore.confirmedBetAmount.toLocaleString() }}</span>
      </div>
      <!-- 🎯 新增：游戏结果信息 -->
      <div v-if="currentGameInfo.isProcessing" class="debug-item">
        <span>结果:</span>
        <span class="processing">处理中 {{ currentGameInfo.pushCount }}/5</span>
      </div>
      <div v-if="currentGameInfo.hasWon" class="debug-item">
        <span>中奖:</span>
        <span class="win-amount">¥{{ currentGameInfo.totalWinAmount.toLocaleString() }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useBettingStore } from '@/stores/bettingStore'
import { useAudio } from '@/composables/useAudio'
import { useWebSocketEvents } from '@/composables/useWebSocketEvents'
import { useGameData } from '@/composables/useGameData'
import { useGameResults } from '@/composables/useGameResults'

// 投注区域组件
import MainBets from './MainBets.vue'
import NumberBets from './NumberBets.vue'
import SingleDiceBets from './SingleDiceBets.vue'
import PairBets from './PairBets.vue'
import TripleBets from './TripleBets.vue'
import ComboBets from './ComboBets.vue'

// 控制和显示组件
import ChipSelector from './ChipSelector.vue'
import ControlButtons from './ControlButtons.vue'

// 🎯 特效组件（根据实际路径调整）
import DiceRollingEffect from '@/components/Effects/DiceRollingEffect.vue'
import WinningEffect from '@/components/Effects/WinningEffect.vue'

import type { BetType } from '@/types/betting'
import type { CountdownData, GameStatusData } from '@/types/api'

// Store 和 Composables
const bettingStore = useBettingStore()
const { 
  playChipSelectSound, 
  playChipPlaceSound, 
  playBetConfirmSound, 
  playErrorSound
} = useAudio()

// 🎯 游戏结果处理
const {
  currentGameInfo,
  isWaitingForResults,
  setEffectRefs
} = useGameResults()

// WebSocket 事件监听
const {
  onCountdown,
  onGameStatus,
  onBalanceUpdate,
  onError,
  getConnectionStatus
} = useWebSocketEvents()

// 游戏数据
const {
  userInfo,
  isInitialized
} = useGameData()

// 本地状态
const countdown = ref(0)
const currentGameNumber = ref('')
const gamePhase = ref<'waiting' | 'betting' | 'dealing' | 'result'>('waiting')
const showDebugInfo = ref(true)

// 🎯 特效组件引用
const diceEffectRef = ref()
const winEffectRef = ref()

// 计算属性 - 从 bettingStore 获取状态
const selectedChip = computed(() => bettingStore.selectedChip)
const currentBets = computed(() => bettingStore.currentBets)
const confirmedBets = computed(() => bettingStore.confirmedBets)
const displayBets = computed(() => bettingStore.displayBets)
const lastBets = computed(() => bettingStore.lastBets)
const balance = computed(() => {
  if (userInfo.value?.balance !== undefined) {
    return userInfo.value.balance
  }
  return bettingStore.balance
})
const totalBetAmount = computed(() => bettingStore.totalBetAmount)
const canPlaceBet = computed(() => bettingStore.canPlaceBet)

// 简单的音效回退函数
const createSimpleBeep = (frequency: number = 800, duration: number = 100) => {
  try {
    if ('vibrate' in navigator) {
      navigator.vibrate(duration / 2)
    }
  } catch (error) {
    // 静默处理
  }
}

// 方法 - 筹码选择
const selectChip = (value: number): void => {
  bettingStore.selectChip(value)
  
  try {
    playChipSelectSound()
  } catch (error) {
    createSimpleBeep(600, 80)
  }
}

// 方法 - 处理投注
const handlePlaceBet = async (betType: string): Promise<void> => {
  const success = bettingStore.placeBet(betType as BetType, selectedChip.value)
  
  if (success) {
    try {
      playChipPlaceSound()
    } catch (error) {
      createSimpleBeep(800, 120)
    }
  } else {
    try {
      playErrorSound()
    } catch (error) {
      createSimpleBeep(300, 300)
    }
  }
}

// 方法 - 清除当前投注
const clearCurrentBets = (): void => {
  bettingStore.clearBets()
  try {
    playChipSelectSound()
  } catch (error) {
    createSimpleBeep(600, 80)
  }
}

// 方法 - 清除投注区域
const clearField = (): void => {
  bettingStore.clearBets()
  try {
    playChipSelectSound()
  } catch (error) {
    createSimpleBeep(600, 80)
  }
}

// 方法 - 完全清场
const clearAllField = (): void => {
  try {
    playChipSelectSound()
  } catch (error) {
    createSimpleBeep(600, 80)
  }
}

// 方法 - 重复投注
const rebet = (): void => {
  const success = bettingStore.rebet()
  
  if (success) {
    try {
      playChipPlaceSound()
    } catch (error) {
      createSimpleBeep(800, 120)
    }
  } else {
    try {
      playErrorSound()
    } catch (error) {
      createSimpleBeep(300, 300)
    }
  }
}

// 方法 - 确认投注
const confirmBets = async (): Promise<void> => {
  try {
    playBetConfirmSound()
  } catch (error) {
    createSimpleBeep(1000, 200)
  }
}

// ======================================
// 🎯 WebSocket 事件处理器
// ======================================

// 倒计时事件处理
onCountdown((data: CountdownData) => {
  countdown.value = data.countdown
  currentGameNumber.value = data.game_number
  
  const newPhase = data.status
  if (newPhase !== gamePhase.value) {
    gamePhase.value = newPhase
    bettingStore.updateGamePhase(newPhase)
    
    if (newPhase === 'betting') {
      if (bettingStore.bettingPhase === 'result') {
        bettingStore.updateBettingPhase('betting')
      }
    } else if (newPhase === 'dealing') {
      bettingStore.updateBettingPhase('dealing')
    }
  }
})

// 余额更新事件处理
onBalanceUpdate((data: { balance: number; spend: number }) => {
  bettingStore.updateBalance(data.balance)
})

// 游戏状态事件处理
onGameStatus((data: GameStatusData) => {
  if (data.status === 'maintenance') {
    gamePhase.value = 'waiting'
    bettingStore.updateBettingPhase('waiting')
  }
})

// 错误事件处理
onError((error) => {
  try {
    playErrorSound()
  } catch (e) {
    createSimpleBeep(300, 500)
  }
})

// 生命周期
onMounted(() => {
  // 确保有默认筹码
  if (!bettingStore.selectedChip || bettingStore.selectedChip <= 0) {
    bettingStore.selectedChip = 10
  }
  
  // 如果已有用户信息，同步余额
  if (userInfo.value?.balance !== undefined) {
    bettingStore.updateBalance(userInfo.value.balance)
  }

  // 🎯 设置特效组件引用
  setTimeout(() => {
    setEffectRefs(diceEffectRef.value, winEffectRef.value)
  }, 100)
})
</script>

<style scoped>
.betting-area {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #0d2818;
  color: white;
  position: relative;
}

/* 游戏区域样式 */
.game-area {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.betting-content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  padding-bottom: 120px;
  padding-top: 16px;
}

.betting-container {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid #2d5a42;
  border-radius: 12px;
  margin: 0 10px;
  padding: 12px;
  backdrop-filter: blur(5px);
}

.betting-sections {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.bottom-fixed-area {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0,0,0,0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid #2d5a42;
  z-index: 100;
  padding-bottom: max(8px, env(safe-area-inset-bottom));
}

/* 简化的调试信息样式 */
.debug-info {
  position: fixed;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid #333;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 12px;
  z-index: 9999;
  max-width: 220px;
}

.debug-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  gap: 8px;
}

.debug-item:last-child {
  margin-bottom: 0;
}

.debug-item span:first-child {
  color: #ccc;
  font-weight: 500;
}

.debug-item span:last-child {
  color: #fff;
  font-weight: 600;
}

/* 已确认金额的特殊样式 */
.confirmed-amount {
  color: #00bcd4 !important;
  text-shadow: 0 0 4px rgba(0, 188, 212, 0.6);
}

/* 🎯 新增：特效相关样式 */
.processing {
  color: #f59e0b !important;
  animation: pulse 1s infinite;
}

.win-amount {
  color: #10b981 !important;
  text-shadow: 0 0 4px rgba(16, 185, 129, 0.6);
  font-weight: bold;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

/* 连接状态样式 */
.status-connected {
  color: #22c55e !important;
}

.status-connecting {
  color: #f59e0b !important;
}

.status-disconnected {
  color: #ef4444 !important;
}

.status-error {
  color: #dc2626 !important;
}

/* 投注阶段状态样式 */
.phase-betting {
  color: #4ade80 !important;
}

.phase-confirmed {
  color: #00bcd4 !important;
  text-shadow: 0 0 4px rgba(0, 188, 212, 0.6);
}

.phase-dealing {
  color: #f59e0b !important;
}

.phase-result {
  color: #a855f7 !important;
}

.phase-waiting {
  color: #6b7280 !important;
}

/* 响应式适配 */
@media (max-width: 375px) {
  .betting-container {
    margin: 0 8px;
    padding: 10px;
  }
  
  .betting-sections {
    gap: 3px;
  }
  
  .betting-content {
    padding-bottom: 110px;
    padding-top: 12px;
  }
  
  .debug-info {
    top: 5px;
    right: 5px;
    padding: 6px 8px;
    font-size: 11px;
    max-width: 200px;
  }
}

@media (max-height: 667px) {
  .betting-content {
    padding-bottom: 110px;
    padding-top: 12px;
  }
  
  .betting-sections {
    gap: 3px;
  }
}

/* 横屏适配 */
@media (orientation: landscape) and (max-height: 500px) {
  .bottom-fixed-area {
    position: relative;
  }
  
  .betting-content {
    padding-bottom: 0;
    padding-top: 8px;
  }
  
  .betting-sections {
    gap: 3px;
  }
  
  .debug-info {
    display: none; /* 横屏时隐藏调试信息 */
  }
}

/* 滚动条样式 */
.betting-content::-webkit-scrollbar {
  width: 4px;
}

.betting-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
}

.betting-content::-webkit-scrollbar-thumb {
  background: rgba(255, 215, 0, 0.3);
  border-radius: 2px;
}

.betting-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 215, 0, 0.5);
}

@media (hover: none) and (pointer: coarse) {
  *:hover {
    /* 在触摸设备上禁用 hover 效果 */
  }
}
</style>