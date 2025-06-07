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
      
      <!-- 左侧区域：游戏状态和倒计时 -->
      <GameStatus />
      

    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import VideoPlayer from '@/components/VideoPlayer/VideoPlayer.vue'
import TopToolbar from '@/components/GameInfo/TopToolbar.vue'
import GameStatus from '@/components/GameInfo/GameStatus.vue'


const gameStore = useGameStore()


onMounted(() => {
  // 初始化游戏状态
  gameStore.updateGameStatus('waiting')
  
 
  // 模拟游戏状态变化和局号生成
  setTimeout(() => {
    gameStore.updateGameNumber('T00124060610001') // 模拟局号格式
    gameStore.updateGameStatus('betting')
    gameStore.updateCountdown(30)
    
    
    // 倒计时
    const countdown = setInterval(() => {
      if (gameStore.gameState.countdown > 0) {
        gameStore.updateCountdown(gameStore.gameState.countdown - 1)
      } else {
        clearInterval(countdown)
        gameStore.updateGameStatus('dealing')
        // 模拟开牌过程
        setTimeout(() => {
          gameStore.updateGameStatus('result')

          setTimeout(() => {
            // 开始新的一局
            gameStore.updateGameStatus('waiting')
            setTimeout(() => {
              gameStore.updateGameNumber('T00124060610002')
              gameStore.updateGameStatus('betting')
              gameStore.updateCountdown(30)
            }, 3000)
          }, 5000)
        }, 3000)
      }
    }, 1000)
  }, 2000)
})
</script>

<style scoped>
.game-top-section {
  position: relative;
  width: 100%;
  height: 300px;
  overflow: hidden;
  background: #000;
}

.video-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 300px;
  z-index: 1;
}

.ui-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 300px;
  z-index: 10;
  pointer-events: none;
}

.ui-overlay > * {
  pointer-events: auto;
}
</style>