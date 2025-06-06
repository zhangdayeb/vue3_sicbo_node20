<template>
  <teleport to="body">
    <div v-if="isVisible" class="dice-rolling-container">
      <!-- 背景遮罩 -->
      <div class="rolling-backdrop" :class="{ 'show': showBackdrop }"></div>
      
      <!-- 骰盅容器 -->
      <div class="dice-cup-container" :class="{ 'shaking': isShaking, 'opening': isOpening }">
        <div class="dice-cup">
          <div class="cup-body"></div>
          <div class="cup-lid" :class="{ 'lifting': isOpening }"></div>
          <div class="cup-shine"></div>
        </div>
        
        <!-- 震动线条效果 -->
        <div class="shake-lines" v-if="isShaking">
          <div class="shake-line" v-for="i in 6" :key="i"></div>
        </div>
      </div>
      
      <!-- 骰子容器 -->
      <div class="dice-container" :class="{ 'rolling': isRolling, 'revealed': isRevealed }">
        <div 
          v-for="(dice, index) in diceResults"
          :key="index"
          class="dice"
          :class="`dice-${index + 1}`"
          :style="{
            animationDelay: `${index * 0.2}s`
          }"
        >
          <!-- 骰子的6个面 -->
          <div class="dice-face dice-front">
            <div 
              v-for="dot in getDotPattern(dice)" 
              :key="`front-${dot.id}`"
              class="dice-dot"
              :style="{ 
                top: dot.top, 
                left: dot.left 
              }"
            ></div>
          </div>
          <div class="dice-face dice-back">
            <div 
              v-for="dot in getDotPattern(7 - dice)" 
              :key="`back-${dot.id}`"
              class="dice-dot"
              :style="{ 
                top: dot.top, 
                left: dot.left 
              }"
            ></div>
          </div>
          <div class="dice-face dice-left">
            <div 
              v-for="dot in getDotPattern(getLeftFaceValue(dice))" 
              :key="`left-${dot.id}`"
              class="dice-dot"
              :style="{ 
                top: dot.top, 
                left: dot.left 
              }"
            ></div>
          </div>
          <div class="dice-face dice-right">
            <div 
              v-for="dot in getDotPattern(getRightFaceValue(dice))" 
              :key="`right-${dot.id}`"
              class="dice-dot"
              :style="{ 
                top: dot.top, 
                left: dot.left 
              }"
            ></div>
          </div>
          <div class="dice-face dice-top">
            <div 
              v-for="dot in getDotPattern(getTopFaceValue(dice))" 
              :key="`top-${dot.id}`"
              class="dice-dot"
              :style="{ 
                top: dot.top, 
                left: dot.left 
              }"
            ></div>
          </div>
          <div class="dice-face dice-bottom">
            <div 
              v-for="dot in getDotPattern(getBottomFaceValue(dice))" 
              :key="`bottom-${dot.id}`"
              class="dice-dot"
              :style="{ 
                top: dot.top, 
                left: dot.left 
              }"
            ></div>
          </div>
        </div>
      </div>
      
      <!-- 结果显示区域 -->
      <div class="result-display" :class="{ 'show': showResult }">
        <div class="result-header">
          <h3 class="result-title">开奖结果</h3>
        </div>
        
        <div class="result-dice">
          <div 
            v-for="(result, index) in diceResults"
            :key="index"
            class="result-dice-item"
            :style="{ animationDelay: `${index * 0.1}s` }"
          >
            <div class="mini-dice">
              <div 
                v-for="dot in getDotPattern(result)" 
                :key="`result-${index}-${dot.id}`"
                class="mini-dot"
                :style="{ 
                  top: dot.top, 
                  left: dot.left 
                }"
              ></div>
            </div>
            <span class="dice-number">{{ result }}</span>
          </div>
        </div>
        
        <div class="result-summary">
          <div class="summary-item">
            <span class="summary-label">总和:</span>
            <span class="summary-value total">{{ totalSum }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">大小:</span>
            <span class="summary-value size" :class="sizeClass">{{ sizeText }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">单双:</span>
            <span class="summary-value parity" :class="parityClass">{{ parityText }}</span>
          </div>
        </div>
        
        <!-- 特殊结果提示 -->
        <div v-if="specialResult" class="special-result">
          <div class="special-icon">{{ specialResult.icon }}</div>
          <div class="special-text">{{ specialResult.text }}</div>
        </div>
      </div>
      
      <!-- 音效控制（隐藏） -->
      <audio ref="shakeSound" preload="auto">
        <source src="/audio/dice-shake.mp3" type="audio/mpeg">
      </audio>
      <audio ref="rollSound" preload="auto">
        <source src="/audio/dice-roll.mp3" type="audio/mpeg">
      </audio>
      <audio ref="revealSound" preload="auto">
        <source src="/audio/dice-reveal.mp3" type="audio/mpeg">
      </audio>
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
  duration: 5000,
  enableSound: true
})

// Emits
const emit = defineEmits<{
  'animation-complete': []
  'phase-change': [phase: 'shaking' | 'rolling' | 'revealing' | 'complete']
}>()

// 响应式数据
const isVisible = ref(false)
const showBackdrop = ref(false)
const isShaking = ref(false)
const isOpening = ref(false)
const isRolling = ref(false)
const isRevealed = ref(false)
const showResult = ref(false)
const diceResults = ref<number[]>([1, 1, 1])

// 音频引用
const shakeSound = ref<HTMLAudioElement>()
const rollSound = ref<HTMLAudioElement>()
const revealSound = ref<HTMLAudioElement>()

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

const specialResult = computed(() => {
  const results = diceResults.value
  
  // 检查三同号
  if (results[0] === results[1] && results[1] === results[2]) {
    return {
      icon: '🎯',
      text: `围${results[0]} - 三同号！`
    }
  }
  
  // 检查对子
  const pairs = []
  if (results[0] === results[1]) pairs.push(results[0])
  if (results[1] === results[2]) pairs.push(results[1])
  if (results[0] === results[2]) pairs.push(results[0])
  
  if (pairs.length > 0) {
    return {
      icon: '🎲',
      text: `对子${pairs[0]}！`
    }
  }
  
  // 检查特殊点数
  if (totalSum.value === 4 || totalSum.value === 17) {
    return {
      icon: '💎',
      text: '极值点数！'
    }
  }
  
  return null
})

// 骰子点数图案配置
const getDotPattern = (value: number) => {
  const patterns: Record<number, Array<{ id: number; top: string; left: string }>> = {
    1: [{ id: 1, top: '50%', left: '50%' }],
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

// 骰子面值计算函数
const getLeftFaceValue = (frontValue: number): number => {
  const faceMap: Record<number, number> = {
    1: 2, 2: 1, 3: 5, 4: 6, 5: 3, 6: 4
  }
  return faceMap[frontValue] || 1
}

const getRightFaceValue = (frontValue: number): number => {
  const faceMap: Record<number, number> = {
    1: 6, 2: 5, 3: 1, 4: 2, 5: 4, 6: 3
  }
  return faceMap[frontValue] || 1
}

const getTopFaceValue = (frontValue: number): number => {
  const faceMap: Record<number, number> = {
    1: 3, 2: 4, 3: 2, 4: 1, 5: 6, 6: 5
  }
  return faceMap[frontValue] || 1
}

const getBottomFaceValue = (frontValue: number): number => {
  const faceMap: Record<number, number> = {
    1: 4, 2: 3, 3: 6, 4: 5, 5: 1, 6: 2
  }
  return faceMap[frontValue] || 1
}

// 方法
const playSound = (audio: HTMLAudioElement | undefined) => {
  if (props.enableSound && audio) {
    audio.currentTime = 0
    audio.play().catch(e => console.warn('Audio play failed:', e))
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
  
  // 阶段1: 显示背景和骰盅
  setTimeout(() => {
    showBackdrop.value = true
  }, 100)
  
  // 阶段2: 开始摇骰
  setTimeout(() => {
    isShaking.value = true
    playSound(shakeSound.value)
    emit('phase-change', 'shaking')
  }, 300)
  
  // 阶段3: 停止摇骰，开始开盅
  setTimeout(() => {
    isShaking.value = false
    isOpening.value = true
    emit('phase-change', 'rolling')
  }, 2000)
  
  // 阶段4: 骰子开始滚动
  setTimeout(() => {
    isRolling.value = true
    playSound(rollSound.value)
  }, 2500)
  
  // 阶段5: 骰子停止，显示结果
  setTimeout(() => {
    isRolling.value = false
    isRevealed.value = true
    playSound(revealSound.value)
    emit('phase-change', 'revealing')
  }, 4000)
  
  // 阶段6: 显示结果面板
  setTimeout(() => {
    showResult.value = true
  }, 4500)
  
  // 阶段7: 完成动画
  setTimeout(() => {
    emit('phase-change', 'complete')
    setTimeout(() => {
      endAnimation()
    }, 2000)
  }, 5000)
}

const endAnimation = () => {
  isVisible.value = false
  showBackdrop.value = false
  isShaking.value = false
  isOpening.value = false
  isRolling.value = false
  isRevealed.value = false
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
  background: radial-gradient(circle, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.95) 100%);
  opacity: 0;
  transition: opacity 0.5s ease;
}

.rolling-backdrop.show {
  opacity: 1;
}

/* 骰盅容器 */
.dice-cup-container {
  position: absolute;
  top: 30%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
}

.dice-cup {
  position: relative;
  width: 120px;
  height: 120px;
}

.cup-body {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 60px;
  background: linear-gradient(135deg, #8b4513, #a0522d);
  border-radius: 0 0 50px 50px;
  border: 3px solid #654321;
  box-shadow: 
    0 4px 8px rgba(0, 0, 0, 0.3),
    inset 0 2px 4px rgba(255, 255, 255, 0.2);
}

.cup-lid {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  width: 110px;
  height: 80px;
  background: linear-gradient(135deg, #8b4513, #a0522d);
  border-radius: 55px 55px 20px 20px;
  border: 3px solid #654321;
  box-shadow: 
    0 4px 8px rgba(0, 0, 0, 0.3),
    inset 0 2px 4px rgba(255, 255, 255, 0.2);
  transition: all 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  z-index: 2;
}

.cup-lid.lifting {
  transform: translateX(-50%) translateY(-60px) rotateX(45deg);
  opacity: 0.7;
}

.cup-shine {
  position: absolute;
  top: 20px;
  left: 30%;
  width: 20px;
  height: 40px;
  background: linear-gradient(45deg, rgba(255, 255, 255, 0.4), transparent);
  border-radius: 50%;
  transform: rotate(45deg);
}

/* 摇动特效 */
.dice-cup-container.shaking {
  animation: cupShake 0.1s infinite;
}

@keyframes cupShake {
  0%, 100% { transform: translate(-50%, -50%) rotate(0deg); }
  25% { transform: translate(-52%, -48%) rotate(1deg); }
  50% { transform: translate(-48%, -52%) rotate(0deg); }
  75% { transform: translate(-50%, -48%) rotate(-1deg); }
}

/* 震动线条 */
.shake-lines {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 150px;
  height: 150px;
}

.shake-line {
  position: absolute;
  width: 100%;
  height: 2px;
  background: rgba(255, 255, 255, 0.3);
  animation: shakeLine 0.1s infinite;
}

.shake-line:nth-child(1) { top: 20%; transform: rotate(0deg); }
.shake-line:nth-child(2) { top: 40%; transform: rotate(30deg); }
.shake-line:nth-child(3) { top: 60%; transform: rotate(60deg); }
.shake-line:nth-child(4) { top: 80%; transform: rotate(90deg); }
.shake-line:nth-child(5) { top: 20%; transform: rotate(120deg); }
.shake-line:nth-child(6) { top: 40%; transform: rotate(150deg); }

@keyframes shakeLine {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.8; }
}

/* 骰子容器 */
.dice-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  gap: 20px;
  z-index: 5;
}

.dice {
  position: relative;
  width: 50px;
  height: 50px;
  transform-style: preserve-3d;
  transition: all 0.5s ease;
  opacity: 0;
}

.dice-container.rolling .dice {
  animation: diceRoll 2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.dice-container.revealed .dice {
  opacity: 1;
  animation: diceReveal 0.5s ease forwards;
}

@keyframes diceRoll {
  0% {
    opacity: 0;
    transform: rotateX(0deg) rotateY(0deg) translateY(50px);
  }
  50% {
    opacity: 1;
    transform: rotateX(720deg) rotateY(360deg) translateY(0px);
  }
  100% {
    opacity: 1;
    transform: rotateX(1440deg) rotateY(720deg) translateY(0px);
  }
}

@keyframes diceReveal {
  0% {
    transform: scale(0.8) rotateY(180deg);
    opacity: 0.7;
  }
  100% {
    transform: scale(1) rotateY(0deg);
    opacity: 1;
  }
}

/* 骰子面 */
.dice-face {
  position: absolute;
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #ffffff, #f0f0f0);
  border: 2px solid #333;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.dice-front { transform: rotateY(0deg) translateZ(25px); }
.dice-back { transform: rotateY(180deg) translateZ(25px); }
.dice-left { transform: rotateY(-90deg) translateZ(25px); }
.dice-right { transform: rotateY(90deg) translateZ(25px); }
.dice-top { transform: rotateX(90deg) translateZ(25px); }
.dice-bottom { transform: rotateX(-90deg) translateZ(25px); }

.dice-dot {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #333;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

/* 结果显示 */
.result-display {
  position: absolute;
  bottom: 15%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.9);
  border-radius: 16px;
  padding: 20px;
  border: 2px solid #ffd700;
  backdrop-filter: blur(10px);
  opacity: 0;
  transform: translateX(-50%) translateY(50px);
  transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  min-width: 280px;
  text-align: center;
}

.result-display.show {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

.result-header {
  margin-bottom: 16px;
}

.result-title {
  color: #ffd700;
  font-size: 18px;
  font-weight: 700;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

/* 结果骰子 */
.result-dice {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 16px;
}

.result-dice-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  animation: resultDiceAppear 0.5s ease forwards;
  opacity: 0;
}

@keyframes resultDiceAppear {
  0% {
    opacity: 0;
    transform: scale(0.5) rotateY(180deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotateY(0deg);
  }
}

.mini-dice {
  position: relative;
  width: 30px;
  height: 30px;
  background: linear-gradient(135deg, #ffffff, #f0f0f0);
  border: 1px solid #333;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.mini-dot {
  position: absolute;
  width: 4px;
  height: 4px;
  background: #333;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.dice-number {
  color: #ffd700;
  font-size: 14px;
  font-weight: bold;
}

/* 结果摘要 */
.result-summary {
  display: flex;
  justify-content: space-around;
  margin-bottom: 12px;
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
}

.summary-value {
  font-size: 16px;
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

/* 特殊结果 */
.special-result {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #333;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: bold;
  animation: specialResultGlow 2s infinite;
}

@keyframes specialResultGlow {
  0%, 100% {
    box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
  }
  50% {
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
  }
}

.special-icon {
  font-size: 16px;
}

.special-text {
  font-size: 14px;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .dice-cup {
    width: 100px;
    height: 100px;
  }
  
  .cup-body {
    width: 80px;
    height: 50px;
  }
  
  .cup-lid {
    width: 90px;
    height: 65px;
  }
  
  .dice {
    width: 40px;
    height: 40px;
  }
  
  .dice-face {
    width: 40px;
    height: 40px;
  }
  
  .dice-dot {
    width: 6px;
    height: 6px;
  }
  
  .result-display {
    min-width: 240px;
    padding: 16px;
  }
  
  .result-title {
    font-size: 16px;
  }
  
  .mini-dice {
    width: 25px;
    height: 25px;
  }
  
  .mini-dot {
    width: 3px;
    height: 3px;
  }
}

@media (max-width: 480px) {
  .dice-container {
    gap: 15px;
  }
  
  .dice {
    width: 35px;
    height: 35px;
  }
  
  .dice-face {
    width: 35px;
    height: 35px;
  }
  
  .dice-dot {
    width: 5px;
    height: 5px;
  }
  
  .result-display {
    min-width: 220px;
    padding: 12px;
    bottom: 10%;
  }
  
  .result-dice {
    gap: 8px;
  }
  
  .mini-dice {
    width: 22px;
    height: 22px;
  }
  
  .summary-item {
    gap: 2px;
  }
  
  .summary-label {
    font-size: 10px;
  }
  
  .summary-value {
    font-size: 14px;
  }
}

/* 横屏适配 */
@media (orientation: landscape) and (max-height: 500px) {
  .dice-cup-container {
    top: 25%;
  }
  
  .result-display {
    bottom: 8%;
    padding: 10px;
  }
  
  .result-title {
    font-size: 14px;
  }
  
  .result-dice {
    margin-bottom: 10px;
  }
  
  .result-summary {
    margin-bottom: 8px;
    padding: 8px;
  }
}

/* 性能优化 */
.dice-rolling-container * {
  will-change: transform, opacity;
}

.dice-container.rolling .dice {
  will-change: transform;
}

.cup-lid.lifting {
  will-change: transform, opacity;
}
</style>