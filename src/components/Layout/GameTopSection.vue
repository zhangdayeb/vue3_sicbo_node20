<template>
  <div class="game-top-section">
    <!-- 只有当视频地址有效时才渲染 VideoPlayer -->
    <VideoPlayer 
      v-if="hasValidVideoUrls"
      :farUrl="videoUrls.far"
      :nearUrl="videoUrls.near"
      :autoSwitch="true"
      :switchTrigger="shouldSwitchToNear"
      :autoSwitchDuration="15"
      :showControls="true"
      :showManualSwitch="isDevelopment"
      class="video-background"
      ref="videoPlayerRef"
    />
    
    <!-- 视频地址未准备好时显示加载状态 -->
    <div v-else class="video-loading">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <div class="loading-text">正在获取视频地址...</div>
      </div>
    </div>
    
    <div class="ui-overlay">
      <TopToolbar />
      <GameStatus />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { useGameLifecycle } from '@/composables/useGameLifecycle'
import VideoPlayer from '@/components/VideoPlayer/VideoPlayer.vue'
import TopToolbar from '@/components/GameInfo/TopToolbar.vue'
import GameStatus from '@/components/GameInfo/GameStatus.vue'

const gameStore = useGameStore()
const { lifecycleState } = useGameLifecycle()

// 视频播放器引用
const videoPlayerRef = ref()

// 开发环境检测
const isDevelopment = import.meta.env.DEV

// 使用 gameStore 中的视频地址，只有当地址有效时才渲染视频
const videoUrls = computed(() => {
  const storeUrls = gameStore.gameState.videoUrls
  return storeUrls
})

// 检查视频地址是否有效
const hasValidVideoUrls = computed(() => {
  return videoUrls.value.far && videoUrls.value.near
})

// 计算切换触发条件
const shouldSwitchToNear = computed(() => {
  // 当游戏状态从 betting 切换到 dealing 时触发
  return gameStore.gameState.status === 'dealing'
})

// 监听游戏状态变化，同步到 gameStore（添加安全检查）
watch(() => gameStore.gameState.status, (newStatus, oldStatus) => {
  console.log(`游戏状态变化: ${oldStatus} -> ${newStatus}`)
  
  try {
    if (newStatus === 'dealing' && oldStatus === 'betting') {
      console.log('触发视频切换到近景')
      if (gameStore && typeof gameStore.updateVideoMode === 'function') {
        gameStore.updateVideoMode('near')
      }
    } else if (newStatus === 'betting' && oldStatus !== 'betting') {
      console.log('切换回远景视频')
      if (gameStore && typeof gameStore.updateVideoMode === 'function') {
        gameStore.updateVideoMode('far')
      }
    }
  } catch (error) {
    console.error('更新视频模式失败:', error)
  }
})

// 监听 tableInfo 变化，更新视频地址（移除 immediate）
watch(() => lifecycleState.tableInfo, (newTableInfo) => {
  if (newTableInfo) {
    updateVideoUrls(newTableInfo)
  }
  // 移除 { immediate: true }，改为在 onMounted 中手动调用
})

// 更新视频地址到 gameStore（移除默认值）
const updateVideoUrls = (tableInfo: any) => {
  console.log('更新视频地址，tableInfo:', tableInfo)
  
  try {
    // 检查 gameStore 和方法是否可用
    if (!gameStore || typeof gameStore.updateVideoUrls !== 'function') {
      console.error('gameStore 或 updateVideoUrls 方法不可用')
      return
    }
    
    // 从 tableInfo 获取远近景地址
    const farUrl = tableInfo.video_far || tableInfo.videoFar
    const nearUrl = tableInfo.video_near || tableInfo.videoNear
    
    if (farUrl && nearUrl) {
      // 更新到 gameStore
      gameStore.updateVideoUrls(farUrl, nearUrl)
      console.log('视频地址更新完成:', gameStore.gameState.videoUrls)
    } else {
      console.warn('视频地址不完整:', { far: farUrl, near: nearUrl })
    }
  } catch (error) {
    console.error('更新视频地址失败:', error)
  }
}

// 初始化视频地址（移除默认值设置）
const initializeVideoUrls = () => {
  try {
    if (lifecycleState.tableInfo) {
      updateVideoUrls(lifecycleState.tableInfo)
    } else {
      console.log('等待 tableInfo 获取视频地址...')
    }
  } catch (error) {
    console.error('初始化视频地址失败:', error)
  }
}

// 手动切换视频 (用于调试)
const manualSwitchToNear = () => {
  if (videoPlayerRef.value) {
    videoPlayerRef.value.switchToNear()
  }
}

const manualSwitchToFar = () => {
  if (videoPlayerRef.value) {
    videoPlayerRef.value.switchToFar()
  }
}

// 组件挂载
onMounted(() => {
  console.log('GameTopSection 组件已挂载')
  console.log('gameStore:', gameStore)
  console.log('gameStore methods:', {
    updateVideoUrls: gameStore.updateVideoUrls,
    updateVideoMode: gameStore.updateVideoMode
  })
  
  // 手动检查初始 tableInfo（替代 immediate: true）
  if (lifecycleState.tableInfo) {
    updateVideoUrls(lifecycleState.tableInfo)
  }
  
  // 延迟初始化视频地址，确保 store 完全就绪
  setTimeout(() => {
    initializeVideoUrls()
  }, 100)
  
  // 启动游戏状态模拟 (保持原有逻辑)
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
        
        // 切换到 dealing 状态，这会触发视频切换
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

// 开发环境下暴露调试方法
if (isDevelopment) {
  // 暴露到全局，方便控制台调试
  ;(window as any).gameTopSectionDebug = {
    manualSwitchToNear,
    manualSwitchToFar,
    getVideoUrls: () => gameStore.gameState.videoUrls,
    getCurrentGameStatus: () => gameStore.gameState.status,
    getCurrentVideoMode: () => gameStore.gameState.currentVideoMode,
    getVideoPlayerRef: () => videoPlayerRef.value,
    getGameStore: () => gameStore
  }
}

// 暴露方法给父组件
defineExpose({
  manualSwitchToNear,
  manualSwitchToFar,
  getVideoUrls: () => gameStore.gameState.videoUrls,
  videoPlayerRef
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

/* 视频加载状态样式 */
.video-loading {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 300px;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: white;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  font-size: 14px;
  opacity: 0.8;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>