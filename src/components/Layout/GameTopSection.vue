<template>
  <div class="game-top-section">
    <VideoPlayer 
      :url="gameStore.gameState.videoUrl"
      class="video-background"
    />
    
    <div class="ui-overlay">
      <TopToolbar />
      <GameStatus />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import VideoPlayer from '@/components/VideoPlayer/VideoPlayer.vue'
import TopToolbar from '@/components/GameInfo/TopToolbar.vue'
import GameStatus from '@/components/GameInfo/GameStatus.vue'

const gameStore = useGameStore()

onMounted(() => {
  gameStore.updateGameStatus('waiting')
  
  setTimeout(() => {
    gameStore.updateGameNumber('T00124060610001')
    gameStore.updateGameStatus('betting')
    gameStore.updateCountdown(30)
    
    const countdown = setInterval(() => {
      if (gameStore.gameState.countdown > 0) {
        gameStore.updateCountdown(gameStore.gameState.countdown - 1)
      } else {
        clearInterval(countdown)
        gameStore.updateGameStatus('dealing')
        setTimeout(() => {
          gameStore.updateGameStatus('result')

          setTimeout(() => {
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