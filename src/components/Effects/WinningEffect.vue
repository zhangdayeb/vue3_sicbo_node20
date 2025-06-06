<template>
  <teleport to="body">
    <div v-if="isVisible" class="winning-effect-container">
      <!-- 背景闪光效果 -->
      <div class="background-flash" :class="{ 'flash-active': showFlash }"></div>
      
      <!-- 金币雨效果 -->
      <div class="coin-rain-container">
        <div 
          v-for="coin in coins"
          :key="coin.id"
          class="coin"
          :style="{
            left: coin.x + 'px',
            animationDelay: coin.delay + 's',
            animationDuration: coin.duration + 's'
          }"
        >
          💰
        </div>
      </div>
      
      <!-- 烟花爆炸效果 -->
      <div class="fireworks-container">
        <div 
          v-for="firework in fireworks"
          :key="firework.id"
          class="firework"
          :style="{
            left: firework.x + 'px',
            top: firework.y + 'px',
            animationDelay: firework.delay + 's'
          }"
        >
          <div class="firework-spark"></div>
          <div class="firework-spark"></div>
          <div class="firework-spark"></div>
          <div class="firework-spark"></div>
          <div class="firework-spark"></div>
          <div class="firework-spark"></div>
          <div class="firework-spark"></div>
          <div class="firework-spark"></div>
        </div>
      </div>
      
      <!-- 中奖金额显示 */
      <div class="win-amount-display" :class="{ 'show': showWinAmount }">
        <div class="win-text">恭喜中奖！</div>
        <div class="win-amount">
          <span class="currency">¥</span>
          <span class="amount">{{ formattedWinAmount }}</span>
        </div>
        <div class="win-subtitle">{{ winDescription }}</div>
      </div>
      
      <!-- 光环效果 */
      <div class="light-ring-container">
        <div 
          v-for="ring in lightRings"
          :key="ring.id"
          class="light-ring"
          :style="{
            animationDelay: ring.delay + 's',
            animationDuration: ring.duration + 's'
          }"
        ></div>
      </div>
      
      <!-- 星星闪烁效果 */
      <div class="stars-container">
        <div 
          v-for="star in stars"
          :key="star.id"
          class="star"
          :style="{
            left: star.x + 'px',
            top: star.y + 'px',
            animationDelay: star.delay + 's',
            fontSize: star.size + 'px'
          }"
        >
          ✨
        </div>
      </div>
      
      <!-- 彩带效果 -->
      <div class="confetti-container">
        <div 
          v-for="confetti in confettiPieces"
          :key="confetti.id"
          class="confetti"
          :style="{
            left: confetti.x + 'px',
            backgroundColor: confetti.color,
            animationDelay: confetti.delay + 's',
            animationDuration: confetti.duration + 's'
          }"
        ></div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

// Props
interface Props {
  show: boolean
  winAmount: number
  winType?: 'normal' | 'big' | 'super' | 'jackpot'
  duration?: number
}

const props = withDefaults(defineProps<Props>(), {
  winType: 'normal',
  duration: 3000
})

// Emits
const emit = defineEmits<{
  'finished': []
}>()

// 响应式数据
const isVisible = ref(false)
const showFlash = ref(false)
const showWinAmount = ref(false)
const coins = ref<Array<{id: number, x: number, delay: number, duration: number}>>([])
const fireworks = ref<Array<{id: number, x: number, y: number, delay: number}>>([])
const lightRings = ref<Array<{id: number, delay: number, duration: number}>>([])
const stars = ref<Array<{id: number, x: number, y: number, delay: number, size: number}>>([])
const confettiPieces = ref<Array<{id: number, x: number, color: string, delay: number, duration: number}>>([])

// 计算属性
const formattedWinAmount = computed(() => {
  return props.winAmount.toLocaleString()
})

const winDescription = computed(() => {
  const descriptions = {
    'normal': '恭喜获得奖金！',
    'big': '大奖来袭！',
    'super': '超级大奖！',
    'jackpot': '超级头奖！'
  }
  return descriptions[props.winType]
})

// 方法
const generateCoins = () => {
  coins.value = []
  const coinCount = props.winType === 'jackpot' ? 30 : props.winType === 'super' ? 20 : props.winType === 'big' ? 15 : 10
  
  for (let i = 0; i < coinCount; i++) {
    coins.value.push({
      id: i,
      x: Math.random() * window.innerWidth,
      delay: Math.random() * 1,
      duration: 2 + Math.random() * 2
    })
  }
}

const generateFireworks = () => {
  fireworks.value = []
  const fireworkCount = props.winType === 'jackpot' ? 8 : props.winType === 'super' ? 6 : props.winType === 'big' ? 4 : 2
  
  for (let i = 0; i < fireworkCount; i++) {
    fireworks.value.push({
      id: i,
      x: Math.random() * window.innerWidth,
      y: 100 + Math.random() * 200,
      delay: Math.random() * 1.5
    })
  }
}

const generateLightRings = () => {
  lightRings.value = []
  const ringCount = props.winType === 'jackpot' ? 5 : props.winType === 'super' ? 4 : props.winType === 'big' ? 3 : 2
  
  for (let i = 0; i < ringCount; i++) {
    lightRings.value.push({
      id: i,
      delay: i * 0.3,
      duration: 2 + Math.random() * 1
    })
  }
}

const generateStars = () => {
  stars.value = []
  const starCount = props.winType === 'jackpot' ? 25 : props.winType === 'super' ? 20 : props.winType === 'big' ? 15 : 10
  
  for (let i = 0; i < starCount; i++) {
    stars.value.push({
      id: i,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      delay: Math.random() * 2,
      size: 12 + Math.random() * 12
    })
  }
}

const generateConfetti = () => {
  confettiPieces.value = []
  const confettiCount = props.winType === 'jackpot' ? 40 : props.winType === 'super' ? 30 : props.winType === 'big' ? 20 : 15
  const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8']
  
  for (let i = 0; i < confettiCount; i++) {
    confettiPieces.value.push({
      id: i,
      x: Math.random() * window.innerWidth,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 1,
      duration: 3 + Math.random() * 2
    })
  }
}

const startEffect = () => {
  isVisible.value = true
  
  // 生成所有特效元素
  generateCoins()
  generateFireworks()
  generateLightRings()
  generateStars()
  generateConfetti()
  
  // 背景闪光
  setTimeout(() => {
    showFlash.value = true
  }, 100)
  
  // 显示中奖金额
  setTimeout(() => {
    showWinAmount.value = true
  }, 500)
  
  // 触发屏幕震动（如果支持）
  if (navigator.vibrate) {
    const vibrationPattern = props.winType === 'jackpot' ? [200, 100, 200, 100, 200] :
                           props.winType === 'super' ? [150, 100, 150] :
                           props.winType === 'big' ? [100, 50, 100] : [100]
    navigator.vibrate(vibrationPattern)
  }
  
  // 结束特效
  setTimeout(() => {
    endEffect()
  }, props.duration)
}

const endEffect = () => {
  isVisible.value = false
  showFlash.value = false
  showWinAmount.value = false
  
  // 清空所有特效数组
  coins.value = []
  fireworks.value = []
  lightRings.value = []
  stars.value = []
  confettiPieces.value = []
  
  emit('finished')
}

// 监听显示状态变化
watch(() => props.show, (newVal) => {
  if (newVal) {
    startEffect()
  } else {
    endEffect()
  }
})

// 组件销毁时清理
onUnmounted(() => {
  endEffect()
})
</script>

<style scoped>
.winning-effect-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 9999;
  overflow: hidden;
}

/* 背景闪光效果 */
.background-flash {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.3) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.background-flash.flash-active {
  opacity: 1;
  animation: flashPulse 2s ease-in-out infinite;
}

@keyframes flashPulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
}

/* 金币雨效果 */
.coin-rain-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.coin {
  position: absolute;
  top: -50px;
  font-size: 24px;
  animation: coinFall linear forwards;
  pointer-events: none;
}

@keyframes coinFall {
  0% {
    transform: translateY(-50px) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(360deg);
    opacity: 0.7;
  }
}

/* 烟花爆炸效果 */
.fireworks-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.firework {
  position: absolute;
  width: 4px;
  height: 4px;
  animation: fireworkExplode 1.5s ease-out forwards;
}

.firework-spark {
  position: absolute;
  width: 4px;
  height: 4px;
  background: #FFD700;
  border-radius: 50%;
  animation: sparkFly 1.5s ease-out forwards;
}

.firework-spark:nth-child(1) { transform: rotate(0deg); }
.firework-spark:nth-child(2) { transform: rotate(45deg); }
.firework-spark:nth-child(3) { transform: rotate(90deg); }
.firework-spark:nth-child(4) { transform: rotate(135deg); }
.firework-spark:nth-child(5) { transform: rotate(180deg); }
.firework-spark:nth-child(6) { transform: rotate(225deg); }
.firework-spark:nth-child(7) { transform: rotate(270deg); }
.firework-spark:nth-child(8) { transform: rotate(315deg); }

@keyframes fireworkExplode {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  50% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

@keyframes sparkFly {
  0% {
    transform: translateX(0) translateY(0);
    opacity: 1;
  }
  100% {
    transform: translateX(60px) translateY(60px);
    opacity: 0;
  }
}

/* 中奖金额显示 */
.win-amount-display {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.95), rgba(255, 193, 7, 0.95));
  border-radius: 20px;
  padding: 30px 40px;
  border: 3px solid #FFD700;
  box-shadow: 0 10px 30px rgba(255, 215, 0, 0.5);
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.5);
  transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.win-amount-display.show {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1);
  animation: winAmountBounce 2s ease-in-out infinite;
}

@keyframes winAmountBounce {
  0%, 100% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-50%, -50%) scale(1.05); }
}

.win-text {
  font-size: 18px;
  font-weight: bold;
  color: #B8860B;
  margin-bottom: 10px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.win-amount {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
  margin-bottom: 8px;
}

.currency {
  font-size: 24px;
  font-weight: bold;
  color: #B8860B;
}

.amount {
  font-size: 36px;
  font-weight: 900;
  color: #B8860B;
  font-family: 'Courier New', monospace;
  text-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
}

.win-subtitle {
  font-size: 14px;
  color: #8B7355;
  font-weight: 600;
}

/* 光环效果 */
.light-ring-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.light-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 200px;
  height: 200px;
  border: 3px solid rgba(255, 215, 0, 0.6);
  border-radius: 50%;
  animation: ringExpand ease-out forwards;
}

@keyframes ringExpand {
  0% {
    width: 50px;
    height: 50px;
    opacity: 1;
  }
  100% {
    width: 400px;
    height: 400px;
    opacity: 0;
  }
}

/* 星星闪烁效果 */
.stars-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.star {
  position: absolute;
  animation: starTwinkle 2s ease-in-out infinite;
}

@keyframes starTwinkle {
  0%, 100% {
    opacity: 0.3;
    transform: scale(0.8) rotate(0deg);
  }
  50% {
    opacity: 1;
    transform: scale(1.2) rotate(180deg);
  }
}

/* 彩带效果 */
.confetti-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.confetti {
  position: absolute;
  top: -10px;
  width: 10px;
  height: 10px;
  animation: confettiFall linear forwards;
}

@keyframes confettiFall {
  0% {
    transform: translateY(-10px) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
}

/* 响应式适配 */
@media (max-width: 768px) {
  .win-amount-display {
    padding: 20px 30px;
    margin: 0 20px;
  }
  
  .win-text {
    font-size: 16px;
  }
  
  .currency {
    font-size: 20px;
  }
  
  .amount {
    font-size: 28px;
  }
  
  .win-subtitle {
    font-size: 12px;
  }
  
  .coin {
    font-size: 20px;
  }
  
  .star {
    font-size: 16px !important;
  }
}

@media (max-width: 480px) {
  .win-amount-display {
    padding: 15px 20px;
    margin: 0 15px;
  }
  
  .win-text {
    font-size: 14px;
  }
  
  .currency {
    font-size: 18px;
  }
  
  .amount {
    font-size: 24px;
  }
  
  .win-subtitle {
    font-size: 11px;
  }
  
  .coin {
    font-size: 18px;
  }
}

/* 横屏适配 */
@media (orientation: landscape) and (max-height: 500px) {
  .win-amount-display {
    padding: 15px 25px;
  }
  
  .win-text {
    font-size: 14px;
  }
  
  .amount {
    font-size: 24px;
  }
}
</style>