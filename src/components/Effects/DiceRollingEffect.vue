<template>
  <teleport to="body">
    <div v-if="isVisible" class="dice-rolling-container">
      <!-- 背景遮罩 -->
      <div class="rolling-backdrop" :class="{ 'show': showBackdrop }"></div>
      
      <!-- 弹窗卡片 -->
      <div class="result-modal-card" :class="{ 'show': showModal }">
        <!-- 标题 -->
        <div class="modal-header">
          <h3 class="modal-title">🎲 开奖结果</h3>
        </div>
        
        <!-- 骰子容器 -->
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
        <div class="result-summary" :class="{ 'show': showResult }">
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
import { ref, computed, watch, onUnmounted, defineExpose } from 'vue'

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
const showModal = ref(false)
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

// 🔥 修复：主要动画启动方法
const startAnimation = async (newResults?: number[]) => {
  console.log('🎲 DiceRollingEffect 启动动画:', {
    newResults,
    propsResults: props.results,
    propsShow: props.show
  })
  
  // 使用传入的结果或 props 中的结果
  const resultsToUse = newResults || props.results
  
  if (!resultsToUse || resultsToUse.length !== 3) {
    console.error('🎲 骰子结果必须包含3个数字:', resultsToUse)
    return
  }
  
  // 验证骰子结果的有效性
  const validResults = resultsToUse.every(num => num >= 1 && num <= 6)
  if (!validResults) {
    console.error('🎲 骰子结果数值无效（必须是1-6）:', resultsToUse)
    return
  }
  
  // 设置结果
  diceResults.value = [...resultsToUse]
  
  console.log('🎲 开始播放开牌动画:', diceResults.value)
  
  // 显示组件
  isVisible.value = true
  
  // 阶段1: 显示背景遮罩
  setTimeout(() => {
    showBackdrop.value = true
  }, 100)
  
  // 阶段2: 显示弹窗卡片
  setTimeout(() => {
    showModal.value = true
  }, 200)
  
  // 阶段3: 显示骰子（延迟400ms）
  setTimeout(() => {
    showDice.value = true
    // 🔥 修改1：播放展示音效
    playSound('/audio/dice-roll.mp3') 
    emit('phase-change', 'showing')
  }, 400)
  
  // 阶段4: 显示结果面板（延迟800ms）
  setTimeout(() => {
    showResult.value = true
    // 🔥 修改2：播放结果音效
    playSound('/audio/win.mp3') 
  }, 800)
  
  // 阶段5: 完成动画
  setTimeout(() => {
    emit('phase-change', 'complete')
    setTimeout(() => {
      endAnimation()
    }, 500)
  }, props.duration)
}

const endAnimation = () => {
  console.log('🎲 结束开牌动画')
  
  isVisible.value = false
  showBackdrop.value = false
  showModal.value = false
  showDice.value = false
  showResult.value = false
  
  emit('animation-complete')
}

// 🔥 修复：响应式地监听 props 变化
watch(() => props.show, (newVal) => {
  console.log('🎲 监听到 show 属性变化:', newVal)
  if (newVal) {
    startAnimation()
  } else {
    endAnimation()
  }
})

watch(() => props.results, (newResults) => {
  console.log('🎲 监听到 results 属性变化:', newResults)
  if (props.show && newResults && newResults.length === 3) {
    startAnimation(newResults)
  }
})

// 🔥 暴露方法给父组件
defineExpose({
  startAnimation,
  endAnimation,
  isVisible,
  diceResults
})

// 组件销毁时清理
onUnmounted(() => {
  endAnimation()
})

// 🔥 开发模式调试
if (import.meta.env.DEV) {
  // 暴露到全局用于调试
  ;(window as any).debugDiceEffect = {
    startAnimation,
    endAnimation,
    isVisible,
    diceResults,
    showBackdrop,
    showModal,
    showDice,
    showResult
  }
}
</script>

<style scoped>
.dice-rolling-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
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
  background: rgba(0, 0, 0, 0.8);
  opacity: 0;
  transition: opacity 0.5s ease;
}

.rolling-backdrop.show {
  opacity: 1;
}

/* 弹窗卡片 */
.result-modal-card {
  background: linear-gradient(135deg, rgba(13, 40, 24, 0.95), rgba(0, 0, 0, 0.9));
  border: 2px solid #ffd700;
  border-radius: 20px;
  padding: 30px;
  max-width: 420px;
  width: 90%;
  text-align: center;
  box-shadow: 
    0 10px 30px rgba(0, 0, 0, 0.7),
    0 0 20px rgba(255, 215, 0, 0.3);
  backdrop-filter: blur(15px);
  transform: scale(0.8);
  opacity: 0;
  transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  z-index: 10;
}

.result-modal-card.show {
  transform: scale(1);
  opacity: 1;
}

/* 标题 */
.modal-header {
  margin-bottom: 20px;
}

.modal-title {
  color: #ffd700;
  font-size: 22px;
  font-weight: 700;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

/* 骰子容器 */
.dice-container {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin: 20px 0;
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
    transform: scale(0.5) translateY(-20px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* 骰子 */
.dice {
  position: relative;
  width: 60px;
  height: 60px;
  animation: diceSlideIn 0.5s ease both;
}

@keyframes diceSlideIn {
  0% {
    opacity: 0;
    transform: translateY(-20px) scale(0.8) rotateX(45deg);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1) rotateX(0deg);
  }
}

/* 骰子面 */
.dice-face {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #ffffff, #f0f0f0);
  border: 2px solid #333;
  border-radius: 8px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 
    0 6px 12px rgba(0, 0, 0, 0.4), 
    inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.dice-dot {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #333;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

/* 结果摘要 */
.result-summary {
  display: flex;
  justify-content: space-around;
  padding: 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  margin-top: 20px;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.5s ease;
}

.result-summary.show {
  opacity: 1;
  transform: translateY(0);
  animation: resultSlideUp 0.5s ease forwards;
}

@keyframes resultSlideUp {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.summary-label {
  color: #ccc;
  font-size: 12px;
  font-weight: 600;
}

.summary-value {
  font-size: 24px;
  font-weight: 900;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
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
  .result-modal-card {
    max-width: 380px;
    padding: 25px;
  }
  
  .dice {
    width: 55px;
    height: 55px;
  }
  
  .dice-container {
    gap: 16px;
  }
  
  .dice-dot {
    width: 7px;
    height: 7px;
  }
  
  .modal-title {
    font-size: 20px;
  }
  
  .summary-value {
    font-size: 20px;
  }
}

@media (max-width: 480px) {
  .result-modal-card {
    max-width: 340px;
    padding: 20px;
    margin: 0 15px;
  }
  
  .dice {
    width: 50px;
    height: 50px;
  }
  
  .dice-container {
    gap: 12px;
    margin: 15px 0;
  }
  
  .dice-dot {
    width: 6px;
    height: 6px;
  }
  
  .modal-title {
    font-size: 18px;
  }
  
  .summary-value {
    font-size: 18px;
  }
  
  .summary-label {
    font-size: 11px;
  }
  
  .result-summary {
    padding: 12px;
    margin-top: 15px;
  }
}

/* 横屏适配 */
@media (orientation: landscape) and (max-height: 500px) {
  .result-modal-card {
    padding: 20px;
    max-width: 500px;
  }
  
  .dice-container {
    margin: 15px 0;
  }
  
  .modal-title {
    font-size: 18px;
  }
  
  .summary-value {
    font-size: 18px;
  }
  
  .result-summary {
    margin-top: 15px;
    padding: 12px;
  }
}

/* 超小屏幕适配 */
@media (max-width: 320px) {
  .result-modal-card {
    max-width: 300px;
    padding: 15px;
  }
  
  .dice {
    width: 45px;
    height: 45px;
  }
  
  .dice-container {
    gap: 10px;
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
    border-width: 3px;
  }
  
  .result-modal-card {
    border-width: 3px;
  }
}

/* 减少动画模式适配 */
@media (prefers-reduced-motion: reduce) {
  .dice-rolling-container *,
  .dice-container,
  .result-summary,
  .result-modal-card {
    animation: none !important;
    transition: opacity 0.3s ease !important;
  }
}

/* 弹窗光晕效果 */
.result-modal-card::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, 
    rgba(255, 215, 0, 0.6) 0%, 
    rgba(255, 193, 7, 0.4) 25%, 
    rgba(255, 235, 59, 0.6) 50%, 
    rgba(255, 193, 7, 0.4) 75%, 
    rgba(255, 215, 0, 0.6) 100%);
  border-radius: 22px;
  z-index: -1;
  animation: borderGlow 3s ease-in-out infinite;
}

@keyframes borderGlow {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}
</style>