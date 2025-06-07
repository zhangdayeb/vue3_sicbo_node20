<template>
  <teleport to="body">
    <div v-if="isVisible" class="dice-rolling-container">
      <!-- 背景遮罩 -->
      <div class="rolling-backdrop" :class="{ 'show': showBackdrop }"></div>
      
      <!-- 骰子容器 - 直接显示 -->
      <div class="dice-container" :class="{ 'show': showDice }">
        <div 
          v-for="(dice, index) in diceResults"
          :key="index"
          class="dice"
          :class="`dice-${index + 1}`"
          :style="{
            animationDelay: `${index * 0.1}s`
          }"
        >
          <!-- 骰子面 -->
          <div class="dice-face">
            <div 
              v-for="dot in getDotPattern(dice)" 
              :key="`dice-${index}-dot-${dot.id}`"
              class="dice-dot"
              :style="{ 
                top: dot.top, 
                left: dot.left 
              }"
            ></div>
          </div>
        </div>
      </div>
      
      <!-- 结果显示面板 -->
      <div class="result-display" :class="{ 'show': showResult }">
        <div class="result-header">
          <h3 class="result-title">开奖结果</h3>
        </div>
        
        <div class="result-summary">
          <div class="summary-item">
            <div class="summary-label">总和</div>
            <div class="summary-value total">{{ totalSum }}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">大小</div>
            <div class="summary-value size" :class="sizeClass">{{ sizeText }}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">单双</div>
            <div class="summary-value parity" :class="parityClass">{{ parityText }}</div>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'

// Props
interface Props {
  show: boolean
  results: number[]
  duration?: number
  enableSound?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  duration: 3000,
  enableSound: true
})

// Emits
const emit = defineEmits<{
  'animation-complete': []
  'phase-change': [phase: 'showing' | 'complete']
}>()

// 响应式数据
const isVisible = ref(false)
const showBackdrop = ref(false)
const showDice = ref(false)
const showResult = ref(false)
const diceResults = ref<number[]>([1, 1, 1])

// 计算属性
const totalSum = computed(() => {
  return diceResults.value.reduce((sum, dice) => sum + dice, 0)
})

const sizeText = computed(() => {
  return totalSum.value >= 11 ? '大' : '小'
})

const sizeClass = computed(() => {
  return totalSum.value >= 11 ? 'big' : 'small'
})

const parityText = computed(() => {
  return totalSum.value % 2 === 0 ? '双' : '单'
})

const parityClass = computed(() => {
  return totalSum.value % 2 === 0 ? 'even' : 'odd'
})

// 骰子点数图案配置
const getDotPattern = (value: number) => {
  const patterns: Record<number, Array<{ id: number; top: string; left: string }>> = {
    1: [
      { id: 1, top: '50%', left: '50%' }
    ],
    2: [
      { id: 1, top: '25%', left: '25%' },
      { id: 2, top: '75%', left: '75%' }
    ],
    3: [
      { id: 1, top: '25%', left: '25%' },
      { id: 2, top: '50%', left: '50%' },
      { id: 3, top: '75%', left: '75%' }
    ],
    4: [
      { id: 1, top: '25%', left: '25%' },
      { id: 2, top: '25%', left: '75%' },
      { id: 3, top: '75%', left: '25%' },
      { id: 4, top: '75%', left: '75%' }
    ],
    5: [
      { id: 1, top: '25%', left: '25%' },
      { id: 2, top: '25%', left: '75%' },
      { id: 3, top: '50%', left: '50%' },
      { id: 4, top: '75%', left: '25%' },
      { id: 5, top: '75%', left: '75%' }
    ],
    6: [
      { id: 1, top: '20%', left: '25%' },
      { id: 2, top: '20%', left: '75%' },
      { id: 3, top: '50%', left: '25%' },
      { id: 4, top: '50%', left: '75%' },
      { id: 5, top: '80%', left: '25%' },
      { id: 6, top: '80%', left: '75%' }
    ]
  }
  return patterns[value] || []
}

// 方法
const playSound = (audioUrl?: string) => {
  if (props.enableSound && audioUrl) {
    try {
      // 创建临时音频对象播放
      const audio = new Audio(audioUrl)
      audio.volume = 0.7
      audio.play().catch(e => console.warn('Audio play failed:', e))
    } catch (e) {
      console.warn('Failed to create audio:', e)
    }
  }
}

const startAnimation = async () => {
  if (props.results.length !== 3) {
    console.error('Dice results must contain exactly 3 numbers')
    return
  }
  
  // 设置结果
  diceResults.value = [...props.results]
  
  // 显示组件
  isVisible.value = true
  
  // 阶段1: 显示背景遮罩
  setTimeout(() => {
    showBackdrop.value = true
  }, 100)
  
  // 阶段2: 显示骰子（延迟300ms）
  setTimeout(() => {
    showDice.value = true
    // 播放展示音效
    playSound('./src/assets/audio/dice-roll.mp3')
    emit('phase-change', 'showing')
  }, 300)
  
  // 阶段3: 显示结果面板（延迟600ms）
  setTimeout(() => {
    showResult.value = true
    // 播放结果音效
    playSound('./src/assets/audio/win.mp3')
  }, 600)
  
  // 阶段4: 完成动画
  setTimeout(() => {
    emit('phase-change', 'complete')
    setTimeout(() => {
      endAnimation()
    }, 500)
  }, props.duration)
}

const endAnimation = () => {
  isVisible.value = false
  showBackdrop.value = false
  showDice.value = false
  showResult.value = false
  
  emit('animation-complete')
}

// 监听显示状态变化
watch(() => props.show, (newVal) => {
  if (newVal) {
    startAnimation()
  } else {
    endAnimation()
  }
})

// 组件销毁时清理
onUnmounted(() => {
  endAnimation()
})
</script>

<style scoped>
.dice-rolling-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 9998;
  overflow: hidden;
}

/* 背景遮罩 */
.rolling-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.95) 100%);
  opacity: 0;
  transition: opacity 0.5s ease;
}

.rolling-backdrop.show {
  opacity: 1;
}

/* 骰子容器 */
.dice-container {
  position: absolute;
  top: 45%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  gap: 24px;
  z-index: 5;
  opacity: 0;
  transition: all 0.6s ease;
}

.dice-container.show {
  opacity: 1;
  animation: diceAppear 0.6s ease forwards;
}

@keyframes diceAppear {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.5);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

/* 骰子 */
.dice {
  position: relative;
  width: 80px;
  height: 80px;
  animation: diceSlideIn 0.5s ease both;
}

@keyframes diceSlideIn {
  0% {
    opacity: 0;
    transform: translateY(-30px) scale(0.8);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 骰子面 */
.dice-face {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #ffffff, #f0f0f0);
  border: 3px solid #333;
  border-radius: 12px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 
    0 8px 16px rgba(0, 0, 0, 0.4), 
    inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.dice-dot {
  position: absolute;
  width: 12px;
  height: 12px;
  background: #333;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

/* 结果显示 */
.result-display {
  position: absolute;
  bottom: 20%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.9);
  border-radius: 16px;
  padding: 24px;
  border: 2px solid #ffd700;
  backdrop-filter: blur(10px);
  min-width: 320px;
  text-align: center;
  opacity: 0;
  transform: translateX(-50%) translateY(40px);
  transition: all 0.5s ease;
}

.result-display.show {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
  animation: resultSlideUp 0.5s ease forwards;
}

@keyframes resultSlideUp {
  0% {
    opacity: 0;
    transform: translateX(-50%) translateY(40px);
  }
  100% {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.result-header {
  margin-bottom: 16px;
}

.result-title {
  color: #ffd700;
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

/* 结果摘要 */
.result-summary {
  display: flex;
  justify-content: space-around;
  padding: 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.summary-label {
  color: #ccc;
  font-size: 12px;
  margin-bottom: 4px;
}

.summary-value {
  font-size: 20px;
  font-weight: bold;
}

.summary-value.total {
  color: #ffd700;
}

.summary-value.big {
  color: #e74c3c;
}

.summary-value.small {
  color: #3498db;
}

.summary-value.odd {
  color: #27ae60;
}

.summary-value.even {
  color: #9b59b6;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .dice {
    width: 70px;
    height: 70px;
  }
  
  .dice-container {
    gap: 20px;
  }
  
  .dice-dot {
    width: 10px;
    height: 10px;
  }
  
  .result-display {
    min-width: 280px;
    padding: 20px;
  }
  
  .result-title {
    font-size: 18px;
  }
  
  .summary-value {
    font-size: 18px;
  }
}

@media (max-width: 480px) {
  .dice {
    width: 60px;
    height: 60px;
  }
  
  .dice-container {
    gap: 16px;
  }
  
  .dice-dot {
    width: 8px;
    height: 8px;
  }
  
  .result-display {
    min-width: 260px;
    padding: 16px;
    bottom: 15%;
  }
  
  .result-title {
    font-size: 16px;
  }
  
  .summary-value {
    font-size: 16px;
  }
  
  .summary-label {
    font-size: 11px;
  }
}

/* 横屏适配 */
@media (orientation: landscape) and (max-height: 500px) {
  .dice-container {
    top: 40%;
  }
  
  .result-display {
    bottom: 8%;
    padding: 12px;
  }
  
  .result-title {
    font-size: 14px;
  }
  
  .summary-value {
    font-size: 16px;
  }
}

/* 性能优化 */
.dice-rolling-container * {
  will-change: transform, opacity;
}

.dice-container.show .dice {
  will-change: transform;
}

/* 高对比度模式适配 */
@media (prefers-contrast: high) {
  .dice-face {
    border-width: 4px;
  }
  
  .result-display {
    border-width: 3px;
  }
}

/* 减少动画模式适配 */
@media (prefers-reduced-motion: reduce) {
  .dice-rolling-container *,
  .dice-container,
  .result-display {
    animation: none !important;
    transition: opacity 0.3s ease !important;
  }
}
</style>