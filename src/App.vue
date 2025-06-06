<template>
  <div id="app">
    <GameTopSection />
  </div>
</template>

<script setup lang="ts">
import GameTopSection from '@/components/Layout/GameTopSection.vue'
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
}

#app {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 350px !important; /* 固定高度350px */
  z-index: 150;
  background: transparent;
  overflow: hidden; /* 防止内容溢出 */
}

/* 确保在小屏幕上也保持350px */
@media (max-width: 768px) {
  #app {
    height: 350px !important; /* 移动端也保持350px */
  }
}

@media (max-width: 480px) {
  #app {
    height: 350px !important; /* 小屏幕也保持350px */
  }
}
</style>