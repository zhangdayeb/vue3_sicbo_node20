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
              @place-bet="handlePlaceBet"
            />

            <!-- 点数投注区域 -->
            <NumberBets 
              :selectedChip="selectedChip"
              :currentBets="currentBets"
              @place-bet="handlePlaceBet"
            />

            <!-- 单骰投注区域 -->
            <SingleDiceBets
              :selectedChip="selectedChip"
              :currentBets="currentBets"
              @place-bet="handlePlaceBet"
            />

            <!-- 对子投注区域 -->
            <PairBets
              :selectedChip="selectedChip"
              :currentBets="currentBets"
              :balance="balance"
              @place-bet="handlePlaceBet"
            />

            <!-- 三同号投注区域 -->
            <TripleBets
              :selectedChip="selectedChip"
              :currentBets="currentBets"
              @place-bet="handlePlaceBet"
            />

            <!-- 两两组合投注区域 -->
            <ComboBets
              :selectedChip="selectedChip"
              :currentBets="currentBets"
              :balance="balance"
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
          @cancel-current-bets="clearBets"
          @clear-field="clearBets"
          @clear-all-field="clearAllBets"
          @rebet="rebet"
          @confirm-bets="confirmBets"
        />
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

import type { BetType } from '@/types/betting'
import type { CountdownData, GameResultData, WinData } from '@/types/api'

// 🎮 Store 和 Composables
const bettingStore = useBettingStore()
const { 
  playChipSelectSound, 
  playChipPlaceSound, 
  playBetConfirmSound, 
  playErrorSound,
  playWinSound
} = useAudio()

// 🌐 WebSocket 事件监听
const {
  onCountdown,
  onGameResult,
  onWinData,
  onBalanceUpdate,
  onGameStatus,
  onError,
  getConnectionStatus,
  isConnected
} = useWebSocketEvents()

// 📊 游戏数据
const {
  userInfo,
  isInitialized,
  refreshBalance
} = useGameData()

// 📱 本地状态
const countdown = ref(0)
const currentGameNumber = ref('')
const gamePhase = ref<'waiting' | 'betting' | 'dealing' | 'result'>('waiting')

// 🧮 计算属性 - 从 bettingStore 获取状态
const selectedChip = computed(() => bettingStore.selectedChip)
const currentBets = computed(() => bettingStore.currentBets)
const lastBets = computed(() => bettingStore.lastBets)
const balance = computed(() => {
  // 优先使用 WebSocket 获取的用户信息中的余额
  if (userInfo.value?.balance !== undefined) {
    return userInfo.value.balance
  }
  // 兜底使用 bettingStore 的余额
  return bettingStore.balance
})
const totalBetAmount = computed(() => bettingStore.totalBetAmount)

// 🎯 简化的投注状态 - 移除复杂的前端限制
const canPlaceChip = computed(() => {
  // 只保留最基础的检查
  const hasConnection = isConnected()
  const isSystemReady = isInitialized.value
  
  return hasConnection && isSystemReady
})

// 🎵 简单的音效回退函数
const createSimpleBeep = (frequency: number = 800, duration: number = 100) => {
  try {
    // 如果音频上下文不可用，提供触觉反馈
    if ('vibrate' in navigator) {
      navigator.vibrate(duration / 2)
    }
  } catch (error) {
    console.log('音效播放失败，使用静默模式')
  }
}

// 🎯 方法 - 筹码选择（无限制）
const selectChip = (value: number): void => {
  console.log('🪙 选择筹码:', value)
  
  // 直接选择筹码，不做复杂验证
  const success = bettingStore.selectChip(value)
  
  if (success) {
    try {
      playChipSelectSound()
    } catch (error) {
      createSimpleBeep(600, 80)
    }
  }
}

// 🎯 方法 - 处理投注（完全放开前端限制）
const handlePlaceBet = async (betType: string): Promise<void> => {
  console.log('🎯 投注请求:', { 
    betType, 
    chip: selectedChip.value,
    gamePhase: gamePhase.value,
    connected: isConnected()
  })
  
  // 🔥 移除所有前端业务限制，只做基础检查
  
  // 检查是否有选中的筹码
  if (!selectedChip.value || selectedChip.value <= 0) {
    console.warn('❌ 未选择有效筹码')
    try {
      playErrorSound()
    } catch (error) {
      createSimpleBeep(300, 300)
    }
    return
  }

  // 检查基础连接状态
  if (!canPlaceChip.value) {
    console.warn('❌ 系统未就绪:', {
      connected: isConnected(),
      initialized: isInitialized.value
    })
    try {
      playErrorSound()
    } catch (error) {
      createSimpleBeep(300, 300)
    }
    return
  }
  
  // 🔥 乐观更新：立即在UI上显示投注
  const success = bettingStore.placeBet(betType as BetType, selectedChip.value)
  
  if (success) {
    // 立即播放成功音效，提供即时反馈
    try {
      playChipPlaceSound()
    } catch (error) {
      createSimpleBeep(800, 120)
    }
    
    console.log('✅ 投注已添加到UI:', { 
      betType, 
      amount: selectedChip.value,
      total: totalBetAmount.value 
    })
    
    // 注意：此时只是UI更新，真实投注在确认时由后端验证
  } else {
    // 只有在基础验证失败时才播放错误音效
    try {
      playErrorSound()
    } catch (error) {
      createSimpleBeep(300, 300)
    }
    console.warn('❌ UI投注添加失败')
  }
}

// 🎯 方法 - 清除投注（UI操作，无限制）
const clearBets = (): void => {
  console.log('🧹 清除投注')
  bettingStore.clearBets()
  try {
    playChipSelectSound()
  } catch (error) {
    createSimpleBeep(600, 80)
  }
}

const clearAllBets = (): void => {
  console.log('🧹 清除所有投注')
  bettingStore.clearBets()
  try {
    playChipSelectSound()
  } catch (error) {
    createSimpleBeep(600, 80)
  }
}

// 🎯 方法 - 重复投注（UI操作，无限制）
const rebet = (): void => {
  console.log('🔄 重复投注')
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

// 🎯 方法 - 确认投注（真实业务由后端控制）
const confirmBets = async (): Promise<void> => {
  console.log('📤 确认投注 - 将由ControlButtons组件处理后端提交')
  
  // 播放确认音效
  try {
    playBetConfirmSound()
  } catch (error) {
    createSimpleBeep(1000, 200)
  }
  
  // 注意：真实的投注提交逻辑在ControlButtons.vue中
  // 这里只是UI反馈，后端成功/失败会通过WebSocket事件返回
}

// 🌐 WebSocket 事件处理器（保持不变）

// 倒计时事件处理
onCountdown((data: CountdownData) => {
  console.log('🕐 收到倒计时:', data)
  
  countdown.value = data.countdown
  currentGameNumber.value = data.game_number
  
  // 更新游戏阶段（仅用于显示，不影响投注功能）
  const newPhase = data.status
  if (newPhase !== gamePhase.value) {
    console.log('🎮 游戏阶段变化:', gamePhase.value, '->', newPhase)
    gamePhase.value = newPhase
    
    // 更新 bettingStore 的游戏阶段（主要用于显示）
    bettingStore.updateGamePhase(newPhase)
    
    // 阶段变化音效
    if (newPhase === 'betting') {
      console.log('💰 投注阶段开始（前端已完全开放投注）')
    } else if (newPhase === 'dealing') {
      console.log('🎲 开牌阶段开始')
    }
  }
})

// 游戏结果事件处理
onGameResult((data: GameResultData) => {
  console.log('🎲 收到游戏结果:', data)
  
  currentGameNumber.value = data.game_number
  gamePhase.value = 'result'
  
  // 更新 bettingStore 的游戏阶段
  bettingStore.updateGamePhase('result')
  
  console.log('🎯 骰子结果:', data.dice_results, '总和:', data.total)
})

// 中奖数据事件处理
onWinData((data: WinData) => {
  console.log('🎉 收到中奖数据:', data)
  
  if (data.win_amount > 0) {
    // 播放中奖音效
    try {
      if (data.win_amount >= 1000) {
        playWinSound('big')
      } else {
        playWinSound('small')
      }
    } catch (error) {
      createSimpleBeep(1200, 300)
    }
    
    console.log('💰 中奖金额:', data.win_amount)
  }
})

// 余额更新事件处理（后端控制的真实余额）
onBalanceUpdate((data: { balance: number; spend: number }) => {
  console.log('💳 余额更新:', data)
  
  // 更新 bettingStore 的余额
  bettingStore.updateBalance(data.balance)
  
  // 如果有花费，说明投注成功
  if (data.spend > 0) {
    console.log('💸 投注消费:', data.spend, '剩余余额:', data.balance)
  }
})

// 游戏状态事件处理
onGameStatus((data) => {
  console.log('🎮 游戏状态:', data)
  
  if (data.status === 'maintenance') {
    console.log('🔧 游戏维护中')
    gamePhase.value = 'waiting'
    bettingStore.updateGamePhase('waiting')
  }
})

// 错误事件处理
onError((error) => {
  console.error('🚨 WebSocket 错误:', error)
  
  try {
    playErrorSound()
  } catch (e) {
    createSimpleBeep(300, 500)
  }
})

// 🚀 生命周期
onMounted(() => {
  console.log('🚀 BettingArea 组件已挂载 (前端限制已移除，UI完全开放)')
  
  // 初始化 bettingStore
  bettingStore.init()
  
  // 如果已有用户信息，同步余额
  if (userInfo.value?.balance !== undefined) {
    bettingStore.updateBalance(userInfo.value.balance)
  }
  
  // 获取当前连接状态
  const currentStatus = getConnectionStatus()
  console.log('🔌 当前连接状态:', currentStatus)
  
  console.log('📊 投注区域已就绪 (UI开放，后端控制业务)')
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

/* 调试信息样式 */
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
  max-width: 200px;
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
  border-radius: 2px;
}

.betting-content::-webkit-scrollbar-thumb {
  background: rgba(255, 215, 0, 0.3);
  border-radius: 2px;
}

.betting-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 215, 0, 0.5);
}
</style>