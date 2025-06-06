<template>
  <div class="betting-area">
    <!-- 滚动内容区域 -->
    <div class="betting-content">
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

    <!-- 底部固定区域 -->
    <div class="bottom-fixed-area">
      <!-- 筹码选择器 -->
      <ChipSelector
        :selectedChip="selectedChip"
        :balance="balance"
        :totalBetAmount="totalBetAmount"
        :currentBets="currentBets"
        :betLimits="{ min: 1, max: 10000 }"
        @select-chip="selectChip"
      />

      <!-- 控制按钮 -->
      <ControlButtons
        :totalBetAmount="totalBetAmount"
        :currentBets="currentBets"
        :lastBets="lastBets"
        :balance="balance"
        :canBet="canBet"
        @clear-bets="clearBets"
        @clear-all-bets="clearAllBets"
        @rebet="rebet"
        @confirm-bets="confirmBets"
        @undo-last="undoLast"
        @quick-bet="quickBet"
        @max-bet="maxBet"
        @open-settings="openSettings"
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

// 计算属性 - 从 bettingStore 获取状态
const selectedChip = computed(() => bettingStore.selectedChip)
const currentBets = computed(() => bettingStore.currentBets)
const lastBets = computed(() => bettingStore.lastBets)
const balance = computed(() => bettingStore.balance)
const totalBetAmount = computed(() => bettingStore.totalBetAmount)
const gamePhase = computed(() => bettingStore.gamePhase)
const canBet = computed(() => bettingStore.canPlaceBet)

// 方法
const selectChip = (value: number): void => {
  const success = bettingStore.selectChip(value)
  if (success) {
    playChipSelectSound()
  } else {
    playErrorSound()
  }
}

const handlePlaceBet = async (betType: string): Promise<void> => {
  const success = bettingStore.placeBet(betType as BetType, selectedChip.value)
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
    // 可以添加错误提示
    console.warn('投注失败：余额不足或其他错误')
  }
}

const clearBets = (): void => {
  bettingStore.clearBets()
  playChipSelectSound()
}

const clearAllBets = (): void => {
  bettingStore.clearBets() // 可以扩展为清除历史记录
  playChipSelectSound()
}

const rebet = (): void => {
  const success = bettingStore.rebet()
  if (success) {
    playChipPlaceSound()
  } else {
    playErrorSound()
  }
}

const confirmBets = async (): Promise<void> => {
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

const undoLast = (): void => {
  // 撤销最后一次投注的逻辑
  playChipSelectSound()
}

const quickBet = (): void => {
  // 快速投注逻辑
  playChipPlaceSound()
}

const maxBet = (): void => {
  // 梭哈投注逻辑
  playBetConfirmSound()
}

const openSettings = (): void => {
  // 打开设置面板
  console.log('打开设置')
}

onMounted(() => {
  // 初始化 bettingStore
  bettingStore.init()
  
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
  padding-bottom: 120px; /* 从160px减少到120px */
}

.betting-sections {
  padding: 10px; /* 从12px减少到10px */
  display: flex;
  flex-direction: column;
  gap: 8px; /* 从16px减少到8px */
  min-height: calc(100vh - 300px - 120px); /* 调整高度计算：300px视频 + 120px底部 */
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
  padding-bottom: max(8px, env(safe-area-inset-bottom)); /* 从12px减少到8px */
}

/* 响应式适配 */
@media (max-width: 375px) {
  .betting-sections {
    padding: 8px; /* 从10px减少到8px */
    gap: 6px; /* 从8px减少到6px */
  }
  
  .betting-content {
    padding-bottom: 110px; /* 小屏幕调整 */
  }
}

@media (max-height: 667px) {
  .betting-content {
    padding-bottom: 110px;
  }
  
  .betting-sections {
    gap: 6px;
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
  
  .betting-sections {
    min-height: auto;
    gap: 6px;
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