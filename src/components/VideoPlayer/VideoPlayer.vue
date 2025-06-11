<template>
  <div class="video-player">
    <!-- 远景视频 iframe -->
    <iframe
      ref="farVideoIframe"
      :src="farUrl"
      frameborder="0"
      allowfullscreen
      scrolling="no"
      class="video-iframe far-video"
      :class="{ 'active': !isNearMode }"
      @load="onFarVideoLoad"
    />
    
    <!-- 近景视频 iframe -->
    <iframe
      ref="nearVideoIframe"
      :src="nearUrl"
      frameborder="0"
      allowfullscreen
      scrolling="no"
      class="video-iframe near-video"
      :class="{ 'active': isNearMode }"
      @load="onNearVideoLoad"
    />
    
    <!-- 视频控制按钮 -->
    <div class="video-controls" v-if="showControls">
      <!-- 手动切换远近景按钮 -->
      <button @click="manualToggleView" class="control-btn" :title="isNearMode ? '切换到远景' : '切换到近景'">
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path fill="currentColor" 
            d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"/>
        </svg>
        <span class="btn-text">{{ isNearMode ? '远景' : '近景' }}</span>
      </button>
    </div>

    <!-- 加载状态指示器 -->
    <div v-if="showLoadingIndicator" class="loading-indicator">
      <div class="loading-spinner"></div>
      <span>视频加载中...</span>
    </div>

    <!-- 当前模式指示器 -->
    <div v-if="showControls" class="mode-indicator">
      <span class="mode-text">{{ isNearMode ? '近景模式' : '远景模式' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount, computed } from 'vue'

interface Props {
  farUrl: string      // 远景视频地址
  nearUrl: string     // 近景视频地址
  autoSwitch?: boolean // 是否启用自动切换
  autoSwitchDuration?: number // 自动切回时间(秒)
  showControls?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  autoSwitch: true,
  autoSwitchDuration: 15,
  showControls: true
})

// 模板引用
const farVideoIframe = ref<HTMLIFrameElement>()
const nearVideoIframe = ref<HTMLIFrameElement>()

// 状态管理
const isNearMode = ref(false)          // 当前是否显示近景
const autoSwitchTimer = ref<number>()  // 自动切回定时器
const farVideoLoaded = ref(false)      // 远景视频加载状态
const nearVideoLoaded = ref(false)     // 近景视频加载状态

// 计算属性
const showLoadingIndicator = computed(() => {
  return !farVideoLoaded.value || !nearVideoLoaded.value
})

// 视频加载事件处理
const onFarVideoLoad = () => {
  console.log('远景视频加载完成')
  farVideoLoaded.value = true
}

const onNearVideoLoad = () => {
  console.log('近景视频加载完成')
  nearVideoLoaded.value = true
}

// 切换到近景
const switchToNear = () => {
  if (isNearMode.value) {
    console.log('已经是近景模式，无需切换')
    return
  }
  
  console.log('🎬 切换到近景视频')
  isNearMode.value = true
  
  // 启动自动切回定时器
  if (props.autoSwitch && props.autoSwitchDuration > 0) {
    clearAutoSwitchTimer()
    autoSwitchTimer.value = window.setTimeout(() => {
      console.log('⏰ 自动切回远景')
      switchToFar()
    }, props.autoSwitchDuration * 1000)
    
    console.log(`将在 ${props.autoSwitchDuration} 秒后自动切回远景`)
  }
}

// 切换到远景
const switchToFar = () => {
  if (!isNearMode.value) {
    console.log('已经是远景模式，无需切换')
    return
  }
  
  console.log('🎬 切换到远景视频')
  isNearMode.value = false
  clearAutoSwitchTimer()
}

// 清除自动切换定时器
const clearAutoSwitchTimer = () => {
  if (autoSwitchTimer.value) {
    clearTimeout(autoSwitchTimer.value)
    autoSwitchTimer.value = undefined
  }
}

// 手动切换远近景
const manualToggleView = () => {
  console.log('手动切换视频视角')
  if (isNearMode.value) {
    switchToFar()
  } else {
    switchToNear()
  }
}

// 组件卸载时清理定时器
onBeforeUnmount(() => {
  clearAutoSwitchTimer()
})

// 暴露方法给父组件
defineExpose({
  switchToNear,
  switchToFar,
  manualToggleView,
  isNearMode: () => isNearMode.value,
  clearAutoSwitchTimer
})
</script>

<style scoped>
.video-player {
  position: relative;
  width: 100%;
  height: 350px;
  overflow: hidden;
  background: #000;
  box-sizing: border-box;
  display: block;
}

.video-iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
  background: #000;
  transition: opacity 0.5s ease-in-out;
  opacity: 0;
  z-index: 1;
  pointer-events: none;
  object-fit: cover;
}

.video-iframe.active {
  opacity: 1;
  z-index: 2;
  pointer-events: auto;
}

.video-controls {
  position: absolute;
  top: 60px;
  right: 10px;
  display: flex;
  gap: 8px;
  z-index: 20;
}

.control-btn {
  background: rgba(0, 0, 0, 0.8);
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 60px;
  justify-content: center;
}

.control-btn:hover {
  background: rgba(0, 0, 0, 0.95);
  transform: translateY(-1px);
}

.control-btn:active {
  transform: translateY(0);
}

.btn-text {
  font-size: 11px;
  font-weight: 500;
}

.mode-indicator {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  z-index: 20;
}

.mode-text {
  font-weight: 500;
}

.loading-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: white;
  font-size: 14px;
  z-index: 10;
  background: rgba(0, 0, 0, 0.7);
  padding: 20px;
  border-radius: 8px;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .video-controls {
    top: 50px;
    right: 5px;
    gap: 4px;
  }
  
  .control-btn {
    padding: 6px 8px;
    font-size: 10px;
    min-width: 50px;
  }
  
  .btn-text {
    font-size: 10px;
  }
  
  .mode-indicator {
    top: 5px;
    left: 5px;
    padding: 4px 8px;
    font-size: 10px;
  }
  
  .loading-indicator {
    font-size: 12px;
    padding: 15px;
  }

  .video-player {
    height: 300px;
  }
}
</style>