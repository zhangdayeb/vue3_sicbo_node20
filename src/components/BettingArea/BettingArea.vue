<template>
  <div class="betting-area">
    <!-- 滚动内容区域 -->
    <div class="betting-content">
      <!-- 统一的投注容器 - 添加边框 -->
      <div class="betting-container">
        <div class="betting-sections">
          <!-- 大小单双投注区域 - 修复 props 传递 -->
          <MainBets 
            :selectedChip="selectedChip"
            :currentBets="currentBets"
            :canPlaceBet="canBet"
            :showDebugInfo="true" 
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
        :canBet="canBet"
        @cancel-current-bets="clearBets"
        @clear-field="clearBets"
        @clear-all-field="clearAllBets"
        @rebet="rebet"
        @confirm-bets="confirmBets"
      />
    </div>

    <!-- 特效组件 -->
    <ChipAnimation ref="chipAnimationRef" />
    <WinningEffect 
      ref="winningEffectRef" 
      :show="false"
      :winAmount="0"
      :winType="'normal'"
    />
    <DiceRollingEffect 
      ref="diceRollingEffectRef"
      :show="false"
      :results="[1, 1, 1]"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useBettingStore } from '@/stores/bettingStore'
import { useAudio } from '@/composables/useAudio'
import { useGameEffects } from '@/composables/useGameEffects'

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
import ChipAnimation from '@/components/Effects/ChipAnimation.vue'
import WinningEffect from '@/components/Effects/WinningEffect.vue'
import DiceRollingEffect from '@/components/Effects/DiceRollingEffect.vue'

import type { BetType } from '@/types/betting'

const bettingStore = useBettingStore()
const { playChipSelectSound, playChipPlaceSound, playBetConfirmSound, playErrorSound } = useAudio()
const { 
  playChipEffect, 
  playBetConfirmEffect,
  setChipAnimationRef,
  setWinningEffectRef,
  setDiceRollingEffectRef 
} = useGameEffects()

// 组件引用
const chipAnimationRef = ref()
const winningEffectRef = ref()
const diceRollingEffectRef = ref()

// 计算属性 - 从 bettingStore 获取状态，确保响应式
const selectedChip = computed(() => {
  const chip = bettingStore.selectedChip
  console.log('🪙 当前选中筹码:', chip)
  return chip
})

const currentBets = computed(() => {
  const bets = bettingStore.currentBets
  console.log('💰 当前投注:', bets)
  return bets
})

const lastBets = computed(() => bettingStore.lastBets)
const balance = computed(() => bettingStore.balance)
const totalBetAmount = computed(() => bettingStore.totalBetAmount)
const gamePhase = computed(() => bettingStore.gamePhase)
const canBet = computed(() => bettingStore.canPlaceBet)

// 方法
const selectChip = (value: number): void => {
  console.log('🎯 选择筹码:', value)
  const success = bettingStore.selectChip(value)
  if (success) {
    playChipSelectSound()
    console.log('✅ 筹码选择成功:', value)
  } else {
    playErrorSound()
    console.log('❌ 筹码选择失败:', value)
  }
}

const handlePlaceBet = async (betType: string): Promise<void> => {
  console.log('🎯 BettingArea 收到投注请求:', betType)
  console.log('🪙 当前筹码:', selectedChip.value)
  console.log('💰 投注前状态:', currentBets.value)
  
  const success = bettingStore.placeBet(betType as BetType, selectedChip.value)
  
  console.log('📊 投注结果:', success)
  console.log('📊 投注后状态:', currentBets.value)
  console.log('📊 Store 内部状态:', bettingStore.currentBets)
  
  if (success) {
    playChipPlaceSound()
    
    // 播放筹码飞行特效（如果有目标元素）
    const targetElement = document.querySelector(`[data-bet-type="${betType}"]`)
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect()
      await playChipEffect({
        startX: window.innerWidth / 2,
        startY: window.innerHeight - 100,
        endX: rect.left + rect.width / 2,
        endY: rect.top + rect.height / 2,
        chipValue: selectedChip.value,
        animationType: 'fly',
        duration: 800,
        showTrail: true,
        bounceOnLand: true
      })
    }
  } else {
    playErrorSound()
    console.warn('❌ 投注失败：余额不足或其他错误')
  }
}

const clearBets = (): void => {
  console.log('🧹 清除投注')
  bettingStore.clearBets()
  playChipSelectSound()
}

const clearAllBets = (): void => {
  console.log('🧹 清除所有投注')
  bettingStore.clearBets()
  playChipSelectSound()
}

const rebet = (): void => {
  console.log('🔄 重复投注')
  const success = bettingStore.rebet()
  if (success) {
    playChipPlaceSound()
  } else {
    playErrorSound()
  }
}

const confirmBets = async (): Promise<void> => {
  console.log('✅ 确认投注')
  const success = bettingStore.confirmBets()
  if (success) {
    playBetConfirmSound()
    
    // 播放确认特效
    const confirmButton = document.querySelector('.confirm-btn')
    if (confirmButton) {
      await playBetConfirmEffect(confirmButton as HTMLElement)
    }
  } else {
    playErrorSound()
  }
}

onMounted(() => {
  console.log('🚀 BettingArea 组件挂载')
  
  // 初始化 bettingStore
  bettingStore.init()
  
  // 打印初始状态
  console.log('📊 初始状态:')
  console.log('  - 选中筹码:', selectedChip.value)
  console.log('  - 当前投注:', currentBets.value)
  console.log('  - 余额:', balance.value)
  console.log('  - 可以投注:', canBet.value)
  
  // 设置特效组件引用
  if (chipAnimationRef.value) {
    setChipAnimationRef(chipAnimationRef.value)
  }
  if (winningEffectRef.value) {
    setWinningEffectRef(winningEffectRef.value)
  }
  if (diceRollingEffectRef.value) {
    setDiceRollingEffectRef(diceRollingEffectRef.value)
  }
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

.betting-content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  padding-bottom: 120px;
  /* 增加顶部padding确保第一个组件不被遮挡 */
  padding-top: 16px;
}

/* 统一的投注容器 - 添加边框 */
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
  gap: 4px; /* 减少组件间距 */
}

/* 底部固定区域 */
.bottom-fixed-area {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0,0,0,0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid #2d5a42;
  z-index: 100;
  
  /* iOS Safari安全区域适配 */
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