<template>
  <div class="top-toolbar">
    <div class="left-section">
      <button class="back-btn" @click="goBack">
        ← 返回
      </button>
      <div class="table-info">
        <span class="table-name">{{ gameStore.settings.tableName }}</span>
        <div class="bet-limits">
          限额: {{ gameStore.settings.limits.min }} - {{ gameStore.settings.limits.max }}
        </div>
      </div>
    </div>
    
    <div class="right-section">
      <div class="game-number">
        局号: {{ gameStore.gameState.gameNumber || '等待中...' }}
      </div>
      <button class="settings-btn" @click="openSettings">
        ⚙️
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGameStore } from '@/stores/gameStore'

const gameStore = useGameStore()

const goBack = () => {
  // 返回逻辑
  console.log('返回上级页面')
}

const openSettings = () => {
  // 打开设置
  console.log('打开设置')
}
</script>

<style scoped>
.top-toolbar {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  height: 50px; /* 调整高度适应350px总高度 */
  background: rgba(0, 0, 0, 0.8);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  color: white;
  backdrop-filter: blur(4px);
}

.left-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.table-info {
  display: flex;
  flex-direction: column;
}

.table-name {
  font-weight: bold;
  font-size: 14px;
}

.bet-limits {
  font-size: 10px;
  opacity: 0.8;
}

.right-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.game-number {
  font-size: 12px;
}

.settings-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 6px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}
</style>