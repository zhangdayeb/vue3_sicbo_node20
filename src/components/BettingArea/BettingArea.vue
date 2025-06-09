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

    <!-- 特效组件 -->
    <DiceRollingEffect ref="diceEffectRef" />
    <WinningEffect ref="winEffectRef" />
  </div>
</template>

<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
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

// 特效组件
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

// 游戏结果处理
const {
  setEffectRefs
} = useGameResults()

// WebSocket 事件监听
const {
  onCountdown,
  onGameStatus,
  onBalanceUpdate,
  onError
} = useWebSocketEvents()

// 游戏数据
const {
  userInfo
} = useGameData()

// 特效组件引用
// ✅ 正确定义特效组件引用类型
const diceEffectRef = ref<ComponentPublicInstance | null>(null)
const winEffectRef = ref<ComponentPublicInstance | null>(null)

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

// WebSocket 事件处理器
onCountdown((data: CountdownData) => {
  const newPhase = data.status
  bettingStore.updateGamePhase(newPhase)
  
  if (newPhase === 'betting') {
    if (bettingStore.bettingPhase === 'result') {
      bettingStore.updateBettingPhase('betting')
    }
  } else if (newPhase === 'dealing') {
    bettingStore.updateBettingPhase('dealing')
  }
})

onBalanceUpdate((data: { balance: number; spend: number }) => {
  bettingStore.updateBalance(data.balance)
})

onGameStatus((data: GameStatusData) => {
  if (data.status === 'maintenance') {
    bettingStore.updateBettingPhase('waiting')
  }
})

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

  // 设置特效组件引用
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