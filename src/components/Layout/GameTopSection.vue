<template>
  <div class="game-top-section">
    <!-- 视频背景层 -->
    <VideoPlayer 
      :url="gameStore.gameState.videoUrl"
      class="video-background"
    />
    
    <!-- UI覆盖层 -->
    <div class="ui-overlay">
      <!-- 顶部工具栏 -->
      <TopToolbar />
      
      <!-- 游戏状态显示 -->
      <GameStatus />
      
      <!-- 用户信息 -->
      <UserInfo />
      
      <!-- 游戏信息 -->
      <GameInfo />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import VideoPlayer from '@/components/VideoPlayer/VideoPlayer.vue'
import TopToolbar from '@/components/GameInfo/TopToolbar.vue'
import GameStatus from '@/components/GameInfo/GameStatus.vue'
import UserInfo from '@/components/GameInfo/UserInfo.vue'
import GameInfo from '@/components/GameInfo/GameInfo.vue'

const gameStore = useGameStore()

onMounted(() => {
  // 初始化游戏状态
  gameStore.updateGameStatus('waiting')
  
  // 模拟游戏状态变化
  setTimeout(() => {
    gameStore.updateGameStatus('betting')
    gameStore.updateCountdown(30)
    
    // 倒计时
    const countdown = setInterval(() => {
      if (gameStore.gameState.countdown > 0) {
        gameStore.updateCountdown(gameStore.gameState.countdown - 1)
      } else {
        clearInterval(countdown)
        gameStore.updateGameStatus('dealing')
      }
    }, 1000)
  }, 2000)
})
</script>

<style scoped>
.game-top-section {
  position: relative;
  width: 100%;
  height: 350px; /* 固定高度350px */
  overflow: hidden;
  background: #000;
}

/* 确保视频背景也是固定高度 */
.video-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 350px; /* 固定高度350px */
  z-index: 1;
}

/* 确保UI覆盖层也是固定高度 */
.ui-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 350px; /* 固定高度350px */
  z-index: 10;
  pointer-events: none;
}
</style>