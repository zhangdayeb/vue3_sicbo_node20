<template>
  <n-message-provider>
    <div id="app">
      <!-- 顶部视频区域 -->
      <div class="top-section">
        <GameTopSection />
      </div>
      
      <!-- 底部投注区域 -->
      <div class="bottom-section">
        <BettingArea />
      </div>


    </div>
  </n-message-provider>
</template>

<script setup lang="ts">
import { NMessageProvider } from 'naive-ui'
import GameTopSection from '@/components/Layout/GameTopSection.vue'
import BettingArea from '@/components/BettingArea/BettingArea.vue'
</script>

<style>
/* 保持原有样式不变 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
  margin: 0;
  padding: 0;
  overflow: hidden;
  background: #000;
}

#app {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #000;
}

.top-section {
  height: 300px;
  flex-shrink: 0;
  background: #000;
  z-index: 150;
}

.bottom-section {
  flex: 1;
  overflow: hidden;
  background: #0d2818;
  min-height: 0;
}

/* 其他响应式样式保持不变... */
@media (max-width: 768px) {
  html, body {
    font-size: 14px;
  }
  
  .top-section {
    height: 300px;
  }
}

@media (max-width: 480px) {
  html, body {
    font-size: 13px;
  }
  
  .top-section {
    height: 300px;
  }
}

@media (orientation: landscape) and (max-height: 500px) {
  html, body {
    font-size: 12px;
  }
  
  .top-section {
    height: 300px;
  }
}

@media (prefers-contrast: high) {
  #app {
    border: 2px solid #fff;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@supports (-webkit-touch-callout: none) {
  #app {
    overscroll-behavior: none;
  }
}

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 215, 0, 0.3);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 215, 0, 0.5);
}

@media (hover: none) and (pointer: coarse) {
  *:hover {
    /* 在触摸设备上禁用 hover 效果 */
  }
}
</style>