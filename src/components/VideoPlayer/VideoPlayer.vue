<template>
  <div class="video-player">
    <iframe
      ref="videoIframe"
      :src="url"
      frameborder="0"
      allowfullscreen
      scrolling="no"
      class="video-iframe"
      @load="onVideoLoad"
    />
    
    <!-- 视频控制按钮 -->
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
</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  url: string
  showControls?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showControls: true
})

const videoIframe = ref<HTMLIFrameElement>()
const isZoomed = ref(false)

const onVideoLoad = () => {
  console.log('视频加载完成')
}

const toggleZoom = () => {
  if (!videoIframe.value) return
  
  if (isZoomed.value) {
    // 恢复正常
    videoIframe.value.style.transform = 'scale(1)'
    videoIframe.value.style.transformOrigin = 'center center'
  } else {
    // 放大模式
    videoIframe.value.style.transform = 'scale(1.5)'
    videoIframe.value.style.transformOrigin = 'center center'
  }
  
  isZoomed.value = !isZoomed.value
}

const refreshVideo = () => {
  if (videoIframe.value) {
    videoIframe.value.src = videoIframe.value.src
  }
}
</script>

<style scoped>
.video-player {
  position: relative;
  width: 100%;
  height: 350px; /* 固定高度350px */
  overflow: hidden; /* 隐藏溢出内容 */
}

.video-iframe {
  width: 100%;
  height: 350px; /* 固定高度350px */
  border: none;
  background: #000;
  transition: transform 0.3s ease;
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
}

.control-btn:hover {
  background: rgba(0, 0, 0, 0.9);
}
</style>