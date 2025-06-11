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
      <button @click="toggleZoom" class="control-btn" :title="isZoomed ? '恢复正常' : '放大视频'">
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path v-if="isZoomed" fill="currentColor" 
            d="M15.5,14H20.5L16,9.5L14.5,11L16,12.5H15.5C13.6,12.5 12,10.9 12,9S13.6,5.5 15.5,5.5H16L14.5,7L16,8.5L20.5,4H15.5C12.5,4 10,6.5 10,9.5C10,12.5 12.5,15 15.5,15H20.5L16,10.5L14.5,12L16,13.5H15.5M9,15V9H7V7H9C10.1,7 11,7.9 11,9V15C11,16.1 10.1,17 9,17H2V15H9Z"/>
          <path v-else fill="currentColor" 
            d="M15.5,14H20.5L16,9.5L14.5,11L16,12.5H15.5C13.6,12.5 12,10.9 12,9S13.6,5.5 15.5,5.5H16L14.5,7L16,8.5L20.5,4H15.5C12.5,4 10,6.5 10,9.5C10,12.5 12.5,15 15.5,15M2,7V9H7V15H9V9C9,7.9 8.1,7 7,7H2M20.5,16H15.5C12.5,16 10,13.5 10,10.5H12C12,12.4 13.6,14 15.5,14H16L14.5,12.5L16,11L20.5,15.5V16Z"/>
        </svg>
      </button>
      
      <button @click="refreshVideo" class="control-btn" title="刷新视频">
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path fill="currentColor" 
            d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"/>
        </svg>
      </button>

      <!-- 手动切换按钮 (可选，用于测试) -->
      <button v-if="showManualSwitch" @click="manualToggleView" class="control-btn" :title="isNearMode ? '切换到远景' : '切换到近景'">
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path fill="currentColor" 
            d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"/>
        </svg>
      </button>
    </div>

    <!-- 加载状态指示器 -->
    <div v-if="showLoadingIndicator" class="loading-indicator">
      <div class="loading-spinner"></div>
      <span>视频加载中...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue'

interface Props {
  farUrl: string      // 远景视频地址
  nearUrl: string     // 近景视频地址
  autoSwitch?: boolean // 是否启用自动切换
  switchTrigger?: boolean // 切换触发器
  autoSwitchDuration?: number // 自动切回时间(秒)
  showControls?: boolean
  showManualSwitch?: boolean // 是否显示手动切换按钮(用于调试)
}

const props = withDefaults(defineProps<Props>(), {
  autoSwitch: true,
  autoSwitchDuration: 15,
  showControls: true,
  showManualSwitch: false
})

// 模板引用
const farVideoIframe = ref<HTMLIFrameElement>()
const nearVideoIframe = ref<HTMLIFrameElement>()

// 状态管理
const isNearMode = ref(false)          // 当前是否显示近景
const isZoomed = ref(false)            // 缩放状态
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
  if (isNearMode.value) return
  
  console.log('切换到近景视频')
  isNearMode.value = true
  
  // 启动自动切回定时器
  if (props.autoSwitch && props.autoSwitchDuration > 0) {
    clearAutoSwitchTimer()
    autoSwitchTimer.value = window.setTimeout(() => {
      switchToFar()
    }, props.autoSwitchDuration * 1000)
    
    console.log(`将在 ${props.autoSwitchDuration} 秒后自动切回远景`)
  }
}

// 切换到远景
const switchToFar = () => {
  if (!isNearMode.value) return
  
  console.log('切换到远景视频')
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

// 手动切换 (用于测试)
const manualToggleView = () => {
  if (isNearMode.value) {
    switchToFar()
  } else {
    switchToNear()
  }
}

// 监听切换触发器
watch(() => props.switchTrigger, (newVal, oldVal) => {
  // 当 switchTrigger 从 false 变为 true 时触发切换到近景
  if (newVal === true && oldVal === false) {
    switchToNear()
  }
}, { immediate: false })

// 监听 URL 变化，重置加载状态
watch(() => props.farUrl, () => {
  farVideoLoaded.value = false
})

watch(() => props.nearUrl, () => {
  nearVideoLoaded.value = false
})

// 缩放功能
const toggleZoom = () => {
  const activeIframe = isNearMode.value ? nearVideoIframe.value : farVideoIframe.value
  if (!activeIframe) return
  
  if (isZoomed.value) {
    // 恢复正常
    activeIframe.style.transform = 'scale(1)'
    activeIframe.style.transformOrigin = 'center center'
  } else {
    // 放大模式
    activeIframe.style.transform = 'scale(1.5)'
    activeIframe.style.transformOrigin = 'center center'
  }
  
  isZoomed.value = !isZoomed.value
}

// 刷新视频
const refreshVideo = () => {
  if (farVideoIframe.value) {
    farVideoIframe.value.src = farVideoIframe.value.src
  }
  if (nearVideoIframe.value) {
    nearVideoIframe.value.src = nearVideoIframe.value.src
  }
  
  // 重置加载状态
  farVideoLoaded.value = false
  nearVideoLoaded.value = false
}

// 组件卸载时清理定时器
onBeforeUnmount(() => {
  clearAutoSwitchTimer()
})

// 暴露方法给父组件
defineExpose({
  switchToNear,
  switchToFar,
  refreshVideo,
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
}

.video-iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 350px;
  border: none;
  background: #000;
  transition: opacity 0.5s ease-in-out, transform 0.3s ease;
  opacity: 0;
  z-index: 1;
}

.video-iframe.active {
  opacity: 1;
  z-index: 2;
}

.far-video {
  /* 远景视频默认显示 */
}

.near-video {
  /* 近景视频初始隐藏 */
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
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.control-btn:hover {
  background: rgba(0, 0, 0, 0.9);
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
    top: 10px;
    right: 5px;
    gap: 4px;
  }
  
  .control-btn {
    padding: 6px 8px;
    font-size: 10px;
  }
  
  .loading-indicator {
    font-size: 12px;
    padding: 15px;
  }
}
</style>