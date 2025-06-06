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
    <div class="video-controls" v-if="showControls">
      <button @click="toggleZoom" class="control-btn">
        {{ isZoomed ? '正常' : '放大' }}
      </button>
      <button @click="refreshVideo" class="control-btn">
        刷新
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
  top: 10px;
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