<template>
  <div class="chip-selector">
    <!-- 筹码选择区域 -->
    <div class="chip-container">
      <div class="chip-list">
        <button
          v-for="chip in chips"
          :key="chip.value"
          class="chip-btn"
          :class="[
            `chip-${chip.value}`,
            { 'active': selectedChip === chip.value }
          ]"
          @click="selectChip(chip.value)"
        >
          <!-- 筹码视觉效果 -->
          <div class="chip-inner">
            <div class="chip-edge"></div>
            <div class="chip-center">
              <span class="chip-value">{{ chip.label }}</span>
            </div>
            <div class="chip-reflection"></div>
          </div>
          
          <!-- 选中指示器 -->
          <div v-if="selectedChip === chip.value" class="selection-indicator">
            <div class="indicator-ring"></div>
            <div class="indicator-glow"></div>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Props
interface Props {
  selectedChip: number
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'select-chip': [value: number]
}>()

// 筹码配置
const chips = [
  { 
    value: 1, 
    label: '1', 
    color: '#8b4513',
    textColor: 'white'
  },
  { 
    value: 10, 
    label: '10', 
    color: '#dc143c',
    textColor: 'white'
  },
  { 
    value: 100, 
    label: '100', 
    color: '#ffd700',
    textColor: '#333'
  },
  { 
    value: 1000, 
    label: '1K', 
    color: '#4169e1',
    textColor: 'white'
  },
  { 
    value: 10000, 
    label: '10K', 
    color: '#9370db',
    textColor: 'white'
  }
]

// 业务逻辑
const selectChip = (chipValue: number) => {
  // 极简的筹码选择逻辑：
  // 直接发射选择事件，不做任何检查
  emit('select-chip', chipValue)
}
</script>

<style scoped>
.chip-selector {
  background: rgba(0, 0, 0, 0.9);
  border-top: 1px solid #2d5a42;
  padding: 12px;
}

/* 筹码容器 */
.chip-container {
  display: flex;
  justify-content: center;
}

.chip-list {
  display: flex;
  justify-content: space-around;
  align-items: center;
  gap: 8px;
  max-width: 400px;
  width: 100%;
}

.chip-btn {
  position: relative;
  width: 52px;
  height: 52px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  background: transparent;
  padding: 0;
}

.chip-btn:active {
  transform: scale(0.95);
}

/* 筹码内部结构 */
.chip-inner {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.chip-edge {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.3);
  pointer-events: none;
}

.chip-center {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.chip-value {
  font-weight: bold;
  font-size: 11px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  pointer-events: none;
}

.chip-reflection {
  position: absolute;
  top: 15%;
  left: 20%;
  width: 30%;
  height: 30%;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.4), transparent);
  border-radius: 50%;
  pointer-events: none;
}

/* 筹码颜色样式 */
.chip-1 .chip-center { background: #8b4513; color: white; }
.chip-10 .chip-center { background: #dc143c; color: white; }
.chip-100 .chip-center { background: #ffd700; color: #333; }
.chip-1000 .chip-center { background: #4169e1; color: white; }
.chip-10000 .chip-center { background: #9370db; color: white; }

/* 选中状态 */
.chip-btn.active .chip-inner {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(255, 215, 0, 0.4);
}

.selection-indicator {
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  pointer-events: none;
}

.indicator-ring {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 2px solid #ffd700;
  border-radius: 50%;
  animation: pulseRing 2s infinite;
}

.indicator-glow {
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.3), transparent);
  animation: pulseGlow 2s infinite;
}

@keyframes pulseRing {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
}

@keyframes pulseGlow {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.8; }
}

/* 响应式适配 */
@media (max-width: 375px) {
  .chip-btn {
    width: 48px;
    height: 48px;
  }
  
  .chip-value {
    font-size: 10px;
  }
  
  .chip-list {
    gap: 6px;
  }
}

@media (max-width: 320px) {
  .chip-btn {
    width: 44px;
    height: 44px;
  }
  
  .chip-value {
    font-size: 9px;
  }
  
  .chip-list {
    gap: 4px;
  }
}

/* 横屏适配 */
@media (orientation: landscape) and (max-height: 500px) {
  .chip-btn {
    width: 40px;
    height: 40px;
  }
  
  .chip-value {
    font-size: 9px;
  }
}
</style>