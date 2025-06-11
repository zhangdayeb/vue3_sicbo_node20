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
import { useWebSocketEvents } from '@/composables/useWebSocketEvents'
import VideoPlayer from '@/components/VideoPlayer/VideoPlayer.vue'
import TopToolbar from '@/components/GameInfo/TopToolbar.vue'
import GameStatus from '@/components/GameInfo/GameStatus.vue'
import type { CountdownData } from '@/types/api'

const gameStore = useGameStore()
const { lifecycleState } = useGameLifecycle()
const { onCountdown } = useWebSocketEvents()

// 视频播放器引用
const videoPlayerRef = ref()

// 开发环境检测
const isDevelopment = import.meta.env.DEV

// 视频切换状态管理 - 简化版本
const videoSwitchState = ref({
  lastCountdown: 30,         // 上一次的倒计时值
})

// 使用 gameStore 中的视频地址，只有当地址有效时才渲染视频
const videoUrls = computed(() => {
  const storeUrls = gameStore.gameState.videoUrls
  return storeUrls
})

// 检查视频地址是否有效
const hasValidVideoUrls = computed(() => {
  return videoUrls.value.far && videoUrls.value.near
})

// WebSocket倒计时事件处理 - 简化版本：只监听倒计时从1到0
const handleCountdownEvent = (data: CountdownData) => {
  console.log('收到倒计时事件:', data)
  
  const { countdown } = data
  
  // 检测倒计时从1变为0，触发切换到近景
  if (videoSwitchState.value.lastCountdown === 1 && countdown === 0) {
    console.log('🎬 倒计时从1到0，切换到近景视频')
    
    // 直接调用VideoPlayer的切换方法
    if (videoPlayerRef.value && typeof videoPlayerRef.value.switchToNear === 'function') {
      videoPlayerRef.value.switchToNear()
    }
  }
  
  // 更新上一次倒计时值
  videoSwitchState.value.lastCountdown = countdown
}

// 计算切换触发条件（移除可能导致循环的日志）
const shouldSwitchToNear = computed(() => {
  // 简化逻辑，避免在 computed 中进行复杂操作
  return gameStore.gameState.status === 'dealing'
})

// 单独的 watch 来监听状态变化并输出日志
watch(() => gameStore.gameState.status, (newStatus, oldStatus) => {
  console.log('shouldSwitchToNear 状态变化:', {
    oldStatus,
    newStatus,
    shouldSwitch: newStatus === 'dealing',
    timestamp: new Date().toLocaleTimeString()
  })
}, { immediate: false })

// 监听游戏状态变化，同步到 gameStore（简化版本）
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
  
  // 监听WebSocket倒计时事件
  console.log('开始监听WebSocket倒计时事件...')
  onCountdown(handleCountdownEvent)
  
  // 移除模拟游戏状态的逻辑，改为依赖真实的WebSocket事件
  console.log('视频切换逻辑已切换为基于WebSocket倒计时事件')
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
    getGameStore: () => gameStore,
    getVideoSwitchState: () => videoSwitchState.value,  // 新增：获取切换状态
    simulateCountdownChange: (from: number, to: number) => {  // 新增：模拟倒计时变化测试
      videoSwitchState.value.lastCountdown = from
      handleCountdownEvent({
        countdown: to,
        status: 'betting' as any,
        game_number: 'TEST_' + Date.now()
      })
    }
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