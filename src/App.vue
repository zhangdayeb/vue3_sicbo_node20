<template>
  <div id="app">
    <!-- 顶部视频区域 - 固定350px -->
    <div class="top-section">
      <GameTopSection />
    </div>
    
    <!-- 底部投注区域 - 填充剩余空间 -->
    <div class="bottom-section">
      <BettingArea />
    </div>
  </div>
</template>

<script setup lang="ts">
import GameTopSection from '@/components/Layout/GameTopSection.vue'
import BettingArea from '@/components/BettingArea/BettingArea.vue'
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  font-family: 'Arial', sans-serif;
  margin: 0;
  padding: 0;
  overflow: hidden; /* 防止整体页面滚动 */
}

#app {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh; /* 改为全屏高度 */
  display: flex;
  flex-direction: column;
  background: transparent;
}

/* 顶部视频区域 */
.top-section {
  height: 300px;
  flex-shrink: 0;
  background: #000;
  z-index: 150;
}

/* 底部投注区域 */
.bottom-section {
  flex: 1;
  overflow: hidden;
  background: #0d2818;
  min-height: 0; /* 允许flex收缩 */
}

/* 确保在小屏幕上也保持比例 */
@media (max-width: 768px) {
  .top-section {
    height: 300px; /* 移动端稍微减小视频区域 */
  }
}

@media (max-width: 480px) {
  .top-section {
    height: 300px; /* 小屏幕进一步减小 */
  }
}

/* 横屏适配 */
@media (orientation: landscape) and (max-height: 500px) {
  .top-section {
    height: 300px; /* 横屏时减小视频区域 */
  }
}
</style>