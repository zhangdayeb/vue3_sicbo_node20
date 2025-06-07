<template>
  <div class="betting-area">
    <!-- 欢迎页面覆盖层 -->
    <div v-if="showWelcome" class="welcome-overlay">
      <div class="welcome-card">
        <div class="welcome-header">
          <h2 class="welcome-title">🎲 欢迎来到骰宝游戏</h2>
          <p class="welcome-subtitle">点击开始按钮进入游戏并启用音效</p>
        </div>
        
        <div class="welcome-features">
          <div class="feature-item">
            <span class="feature-icon">🎵</span>
            <span class="feature-text">沉浸式音效体验</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">📱</span>
            <span class="feature-text">触觉反馈支持</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">⚡</span>
            <span class="feature-text">流畅投注体验</span>
          </div>
        </div>
        
        <button class="welcome-button" @click="startGame">
          <span class="button-text">开始游戏</span>
          <span class="button-icon">🚀</span>
        </button>
        
        <p class="welcome-note">
          首次点击将启用音频上下文，确保最佳游戏体验
        </p>
      </div>
    </div>

    <!-- 主游戏区域 -->
    <div v-show="!showWelcome" class="game-area">
      <!-- 滚动内容区域 -->
      <div class="betting-content">
        <!-- 统一的投注容器 -->
        <div class="betting-container">
          <div class="betting-sections">
            <!-- 大小单双投注区域 -->
            <MainBets 
              :selectedChip="selectedChip"
              :currentBets="currentBets"
              :canPlaceBet="canBet"
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useBettingStore } from '@/stores/bettingStore'
import { useAudio } from '@/composables/useAudio'
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

const bettingStore = useBettingStore()
const { 
  playChipSelectSound, 
  playChipPlaceSound, 
  playBetConfirmSound, 
  playErrorSound,
  unlockAudioContext 
} = useAudio()

// 欢迎页面状态
const showWelcome = ref(true)

// 计算属性 - 从 bettingStore 获取状态
const selectedChip = computed(() => bettingStore.selectedChip)
const currentBets = computed(() => bettingStore.currentBets)
const lastBets = computed(() => bettingStore.lastBets)
const balance = computed(() => bettingStore.balance)
const totalBetAmount = computed(() => bettingStore.totalBetAmount)
const gamePhase = computed(() => bettingStore.gamePhase)
const canBet = computed(() => bettingStore.canPlaceBet)

// 简单的音效回退函数
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

// 启动游戏
const startGame = async () => {
  try {
    // 尝试解锁音频上下文
    await unlockAudioContext()
    console.log('音频上下文已解锁')
  } catch (error) {
    console.log('音频解锁失败，使用静默模式:', error)
  }
  
  // 隐藏欢迎页面
  showWelcome.value = false
  
  // 播放欢迎音效或触觉反馈
  try {
    playChipSelectSound()
  } catch (error) {
    createSimpleBeep(1000, 200)
  }
  
  console.log('🎮 游戏已启动')
}

// 方法
const selectChip = (value: number): void => {
  const success = bettingStore.selectChip(value)
  if (success) {
    try {
      playChipSelectSound()
    } catch (error) {
      createSimpleBeep(600, 80)
    }
  } else {
    try {
      playErrorSound()
    } catch (error) {
      createSimpleBeep(300, 200)
    }
  }
}

const handlePlaceBet = async (betType: string): Promise<void> => {
  console.log('🎯 投注请求:', { betType, chip: selectedChip.value })
  
  const success = bettingStore.placeBet(betType as BetType, selectedChip.value)
  
  if (success) {
    try {
      playChipPlaceSound()
    } catch (error) {
      createSimpleBeep(800, 120)
    }
    
    console.log('✅ 投注成功:', { 
      betType, 
      amount: selectedChip.value,
      total: totalBetAmount.value 
    })
  } else {
    try {
      playErrorSound()
    } catch (error) {
      createSimpleBeep(300, 300)
    }
    console.warn('❌ 投注失败')
  }
}

const clearBets = (): void => {
  bettingStore.clearBets()
  try {
    playChipSelectSound()
  } catch (error) {
    createSimpleBeep(600, 80)
  }
}

const clearAllBets = (): void => {
  bettingStore.clearBets()
  try {
    playChipSelectSound()
  } catch (error) {
    createSimpleBeep(600, 80)
  }
}

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

const confirmBets = async (): Promise<void> => {
  const success = bettingStore.confirmBets()
  if (success) {
    try {
      playBetConfirmSound()
    } catch (error) {
      createSimpleBeep(1000, 200)
    }
  } else {
    try {
      playErrorSound()
    } catch (error) {
      createSimpleBeep(300, 300)
    }
  }
}

onMounted(() => {
  console.log('🚀 BettingArea 组件已挂载')
  
  // 初始化 bettingStore
  bettingStore.init()
  
  console.log('📊 等待用户点击开始游戏...')
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

/* 欢迎页面样式 */
.welcome-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, 
    rgba(13, 40, 24, 0.98) 0%, 
    rgba(0, 0, 0, 0.95) 100%);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.welcome-card {
  background: linear-gradient(135deg, 
    rgba(45, 90, 66, 0.9) 0%, 
    rgba(13, 40, 24, 0.9) 100%);
  border: 2px solid #4a9f6e;
  border-radius: 20px;
  padding: 40px 30px;
  text-align: center;
  max-width: 400px;
  width: 100%;
  box-shadow: 
    0 10px 30px rgba(0, 0, 0, 0.5),
    0 0 20px rgba(74, 159, 110, 0.2);
  animation: welcomeSlideIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes welcomeSlideIn {
  0% {
    opacity: 0;
    transform: translateY(50px) scale(0.9);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.welcome-header {
  margin-bottom: 30px;
}

.welcome-title {
  font-size: 24px;
  font-weight: 700;
  color: #ffd700;
  margin: 0 0 12px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.welcome-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  line-height: 1.5;
}

.welcome-features {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 30px 0;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(74, 159, 110, 0.3);
}

.feature-icon {
  font-size: 20px;
}

.feature-text {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}

.welcome-button {
  background: linear-gradient(135deg, #4a9f6e, #27ae60);
  border: 2px solid #5bb77c;
  color: white;
  padding: 16px 32px;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin: 30px auto 20px;
  box-shadow: 
    0 4px 15px rgba(74, 159, 110, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.welcome-button:hover {
  background: linear-gradient(135deg, #5bb77c, #2ecc71);
  border-color: #6bc985;
  transform: translateY(-2px);
  box-shadow: 
    0 6px 20px rgba(74, 159, 110, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.welcome-button:active {
  transform: translateY(0);
  box-shadow: 
    0 2px 10px rgba(74, 159, 110, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.button-text {
  font-size: 18px;
}

.button-icon {
  font-size: 20px;
  animation: rocketFloat 2s ease-in-out infinite;
}

@keyframes rocketFloat {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}

.welcome-note {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
  line-height: 1.4;
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
  .welcome-card {
    padding: 30px 20px;
    margin: 0 15px;
  }
  
  .welcome-title {
    font-size: 20px;
  }
  
  .welcome-button {
    padding: 14px 28px;
    font-size: 16px;
  }
  
  .button-text {
    font-size: 16px;
  }
  
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
  .welcome-card {
    padding: 25px 20px;
  }
  
  .welcome-features {
    margin: 20px 0;
    gap: 12px;
  }
  
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
  .welcome-card {
    padding: 20px;
    max-width: 350px;
  }
  
  .welcome-features {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
  }
  
  .feature-item {
    flex: 1;
    min-width: 100px;
    padding: 8px 12px;
  }
  
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