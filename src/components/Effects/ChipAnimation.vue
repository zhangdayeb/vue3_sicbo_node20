<template>
  <teleport to="body">
    <!-- 筹码飞行动画容器 -->
    <div class="chip-animation-container">
      <!-- 筹码飞行轨迹 -->
      <div 
        v-for="animation in activeAnimations"
        :key="animation.id"
        class="chip-flight-path"
      >
        <div 
          class="flying-chip"
          :class="[
            `chip-${animation.chipValue}`,
            { 'bouncing': animation.bouncing }
          ]"
          :style="{
            left: animation.currentX + 'px',
            top: animation.currentY + 'px',
            transform: `scale(${animation.scale}) rotate(${animation.rotation}deg)`,
            opacity: animation.opacity
          }"
        >
          <!-- 筹码主体 -->
          <div class="chip-body">
            <div class="chip-edge"></div>
            <div class="chip-center">
              <span class="chip-value">{{ getChipLabel(animation.chipValue) }}</span>
            </div>
            <div class="chip-reflection"></div>
          </div>
          
          <!-- 飞行轨迹特效 -->
          <div class="flight-trail" v-if="animation.showTrail">
            <div class="trail-particle" v-for="i in 5" :key="i"></div>
          </div>
          
          <!-- 金额显示 -->
          <div class="amount-display" v-if="animation.showAmount">
            +{{ animation.chipValue }}
          </div>
        </div>
      </div>
    </div>
    
    <!-- 筹码堆叠动画容器 -->
    <div class="chip-stack-container">
      <div 
        v-for="stack in activeStacks"
        :key="stack.id"
        class="chip-stack"
        :style="{
          left: stack.x + 'px',
          top: stack.y + 'px'
        }"
      >
        <div 
          v-for="(chip, index) in stack.chips"
          :key="index"
          class="stacked-chip"
          :class="`chip-${chip.value}`"
          :style="{
            transform: `translateZ(${index * 4}px) translateY(-${index * 3}px)`,
            animationDelay: `${index * 0.1}s`,
            zIndex: stack.chips.length - index
          }"
        >
          <div class="chip-body">
            <div class="chip-edge"></div>
            <div class="chip-center">
              <span class="chip-value">{{ getChipLabel(chip.value) }}</span>
            </div>
            <div class="chip-reflection"></div>
          </div>
        </div>
        
        <!-- 堆叠总额显示 -->
        <div class="stack-amount" v-if="stack.showAmount">
          <div class="amount-value">{{ stack.totalAmount }}</div>
          <div class="amount-label">总额</div>
        </div>
      </div>
    </div>
    
    <!-- 筹码收集动画容器 -->
    <div class="chip-collect-container">
      <div 
        v-for="collect in activeCollections"
        :key="collect.id"
        class="collect-animation"
        :style="{
          left: collect.x + 'px',
          top: collect.y + 'px'
        }"
      >
        <!-- 收集涡流效果 -->
        <div class="collect-vortex">
          <div class="vortex-ring" v-for="i in 3" :key="i"></div>
        </div>
        
        <!-- 被收集的筹码 -->
        <div 
          v-for="(chip, index) in collect.chips"
          :key="index"
          class="collecting-chip"
          :class="`chip-${chip.value}`"
          :style="{
            animationDelay: `${index * 0.1}s`,
            '--spiral-angle': `${index * 72}deg`
          }"
        >
          <div class="chip-body">
            <div class="chip-edge"></div>
            <div class="chip-center">
              <span class="chip-value">{{ getChipLabel(chip.value) }}</span>
            </div>
          </div>
        </div>
        
        <!-- 收集完成效果 -->
        <div class="collect-complete" v-if="collect.isComplete">
          <div class="complete-burst">
            <div class="burst-particle" v-for="i in 8" :key="i"></div>
          </div>
          <div class="complete-text">+{{ collect.totalValue }}</div>
        </div>
      </div>
    </div>
    
    <!-- 筹码分散动画容器 -->
    <div class="chip-scatter-container">
      <div 
        v-for="scatter in activeScatters"
        :key="scatter.id"
        class="scatter-animation"
        :style="{
          left: scatter.centerX + 'px',
          top: scatter.centerY + 'px'
        }"
      >
        <div 
          v-for="(chip, index) in scatter.chips"
          :key="index"
          class="scattering-chip"
          :class="`chip-${chip.value}`"
          :style="{
            '--scatter-angle': `${chip.angle}deg`,
            '--scatter-distance': `${chip.distance}px`,
            animationDelay: `${index * 0.05}s`
          }"
        >
          <div class="chip-body">
            <div class="chip-edge"></div>
            <div class="chip-center">
              <span class="chip-value">{{ getChipLabel(chip.value) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 筹码脉冲动画容器 -->
    <div class="chip-pulse-container">
      <div 
        v-for="pulse in activePulses"
        :key="pulse.id"
        class="pulse-animation"
        :style="{
          left: pulse.x + 'px',
          top: pulse.y + 'px'
        }"
      >
        <div class="pulse-chip" :class="`chip-${pulse.chipValue}`">
          <div class="chip-body">
            <div class="chip-edge"></div>
            <div class="chip-center">
              <span class="chip-value">{{ getChipLabel(pulse.chipValue) }}</span>
            </div>
            <div class="chip-reflection"></div>
          </div>
          
          <!-- 脉冲波效果 -->
          <div class="pulse-rings">
            <div class="pulse-ring" v-for="i in 3" :key="i"></div>
          </div>
          
          <!-- 能量光环 -->
          <div class="energy-aura"></div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'

// 接口定义
interface ChipFlightAnimation {
  id: string
  chipValue: number
  startX: number
  startY: number
  endX: number
  endY: number
  currentX: number
  currentY: number
  scale: number
  rotation: number
  opacity: number
  bouncing: boolean
  showTrail: boolean
  showAmount: boolean
  duration: number
  startTime: number
}

interface ChipStack {
  id: string
  x: number
  y: number
  chips: Array<{ value: number }>
  totalAmount: number
  showAmount: boolean
}

interface ChipCollection {
  id: string
  x: number
  y: number
  chips: Array<{ value: number }>
  totalValue: number
  isComplete: boolean
}

interface ChipScatter {
  id: string
  centerX: number
  centerY: number
  chips: Array<{ value: number; angle: number; distance: number }>
}

interface ChipPulse {
  id: string
  x: number
  y: number
  chipValue: number
}

// Props
interface Props {
  enableTrails?: boolean
  enableSounds?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  enableTrails: true,
  enableSounds: true
})

// Emits
const emit = defineEmits<{
  'animation-complete': [id: string, type: string]
  'chip-landed': [x: number, y: number, value: number]
}>()

// 响应式数据
const activeAnimations = ref<ChipFlightAnimation[]>([])
const activeStacks = ref<ChipStack[]>([])
const activeCollections = ref<ChipCollection[]>([])
const activeScatters = ref<ChipScatter[]>([])
const activePulses = ref<ChipPulse[]>([])

// 筹码配置
const chipConfigs: Record<number, { label: string; color: string }> = {
  1: { label: '1', color: '#8b4513' },
  10: { label: '10', color: '#dc143c' },
  100: { label: '100', color: '#ffd700' },
  1000: { label: '1K', color: '#4169e1' },
  10000: { label: '10K', color: '#9370db' }
}

// 动画ID计数器
let animationIdCounter = 0

// 方法
const getChipLabel = (value: number): string => {
  return chipConfigs[value]?.label || value.toString()
}

const generateId = (): string => {
  return `chip_anim_${++animationIdCounter}_${Date.now()}`
}

// 筹码飞行动画
const flyChip = (
  chipValue: number,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  options: {
    duration?: number
    bounceOnLand?: boolean
    showTrail?: boolean
    showAmount?: boolean
    curve?: 'linear' | 'arc' | 'spiral'
  } = {}
): string => {
  const {
    duration = 1000,
    bounceOnLand = true,
    showTrail = props.enableTrails,
    showAmount = false,
    curve = 'arc'
  } = options

  const id = generateId()
  const animation: ChipFlightAnimation = {
    id,
    chipValue,
    startX,
    startY,
    endX,
    endY,
    currentX: startX,
    currentY: startY,
    scale: 1,
    rotation: 0,
    opacity: 1,
    bouncing: false,
    showTrail,
    showAmount,
    duration,
    startTime: Date.now()
  }

  activeAnimations.value.push(animation)

  // 动画更新循环
  const updateAnimation = () => {
    const elapsed = Date.now() - animation.startTime
    const progress = Math.min(elapsed / duration, 1)

    if (progress >= 1) {
      // 动画完成
      if (bounceOnLand) {
        animation.bouncing = true
        setTimeout(() => {
          removeAnimation(id)
          emit('animation-complete', id, 'flight')
          emit('chip-landed', endX, endY, chipValue)
        }, 300)
      } else {
        removeAnimation(id)
        emit('animation-complete', id, 'flight')
        emit('chip-landed', endX, endY, chipValue)
      }
      return
    }

    // 计算位置
    let t = progress
    if (curve === 'arc') {
      // 抛物线轨迹
      const height = Math.abs(endY - startY) * 0.5
      animation.currentX = startX + (endX - startX) * t
      animation.currentY = startY + (endY - startY) * t - height * Math.sin(Math.PI * t)
    } else if (curve === 'spiral') {
      // 螺旋轨迹
      const angle = t * Math.PI * 4
      const radius = 50 * (1 - t)
      animation.currentX = startX + (endX - startX) * t + Math.cos(angle) * radius
      animation.currentY = startY + (endY - startY) * t + Math.sin(angle) * radius
    } else {
      // 直线轨迹
      animation.currentX = startX + (endX - startX) * t
      animation.currentY = startY + (endY - startY) * t
    }

    // 计算旋转和缩放
    animation.rotation = progress * 720 // 旋转两圈
    animation.scale = 1 + Math.sin(progress * Math.PI) * 0.2 // 轻微缩放

    requestAnimationFrame(updateAnimation)
  }

  requestAnimationFrame(updateAnimation)
  return id
}

// 筹码堆叠动画
const stackChips = (
  x: number,
  y: number,
  chipValues: number[],
  options: {
    showAmount?: boolean
    stackDelay?: number
  } = {}
): string => {
  const { showAmount = true, stackDelay = 100 } = options
  const id = generateId()

  const stack: ChipStack = {
    id,
    x,
    y,
    chips: chipValues.map(value => ({ value })),
    totalAmount: chipValues.reduce((sum, value) => sum + value, 0),
    showAmount
  }

  activeStacks.value.push(stack)

  // 自动清理
  setTimeout(() => {
    removeStack(id)
    emit('animation-complete', id, 'stack')
  }, 3000 + chipValues.length * stackDelay)

  return id
}

// 筹码收集动画
const collectChips = (
  centerX: number,
  centerY: number,
  chipValues: number[],
  options: {
    spiralRadius?: number
    collectDuration?: number
  } = {}
): string => {
  const { spiralRadius = 100, collectDuration = 2000 } = options
  const id = generateId()

  const collection: ChipCollection = {
    id,
    x: centerX,
    y: centerY,
    chips: chipValues.map(value => ({ value })),
    totalValue: chipValues.reduce((sum, value) => sum + value, 0),
    isComplete: false
  }

  activeCollections.value.push(collection)

  // 收集完成
  setTimeout(() => {
    collection.isComplete = true
    setTimeout(() => {
      removeCollection(id)
      emit('animation-complete', id, 'collect')
    }, 1000)
  }, collectDuration)

  return id
}

// 筹码分散动画
const scatterChips = (
  centerX: number,
  centerY: number,
  chipValues: number[],
  options: {
    minDistance?: number
    maxDistance?: number
    duration?: number
  } = {}
): string => {
  const { minDistance = 50, maxDistance = 150, duration = 1500 } = options
  const id = generateId()

  const scatter: ChipScatter = {
    id,
    centerX,
    centerY,
    chips: chipValues.map((value, index) => ({
      value,
      angle: (360 / chipValues.length) * index,
      distance: minDistance + Math.random() * (maxDistance - minDistance)
    }))
  }

  activeScatters.value.push(scatter)

  // 自动清理
  setTimeout(() => {
    removeScatter(id)
    emit('animation-complete', id, 'scatter')
  }, duration)

  return id
}

// 筹码脉冲动画
const pulseChip = (
  x: number,
  y: number,
  chipValue: number,
  options: {
    pulseCount?: number
    pulseDuration?: number
  } = {}
): string => {
  const { pulseCount = 3, pulseDuration = 1000 } = options
  const id = generateId()

  const pulse: ChipPulse = {
    id,
    x,
    y,
    chipValue
  }

  activePulses.value.push(pulse)

  // 自动清理
  setTimeout(() => {
    removePulse(id)
    emit('animation-complete', id, 'pulse')
  }, pulseCount * pulseDuration)

  return id
}

// 清理方法
const removeAnimation = (id: string) => {
  const index = activeAnimations.value.findIndex(anim => anim.id === id)
  if (index > -1) {
    activeAnimations.value.splice(index, 1)
  }
}

const removeStack = (id: string) => {
  const index = activeStacks.value.findIndex(stack => stack.id === id)
  if (index > -1) {
    activeStacks.value.splice(index, 1)
  }
}

const removeCollection = (id: string) => {
  const index = activeCollections.value.findIndex(collection => collection.id === id)
  if (index > -1) {
    activeCollections.value.splice(index, 1)
  }
}

const removeScatter = (id: string) => {
  const index = activeScatters.value.findIndex(scatter => scatter.id === id)
  if (index > -1) {
    activeScatters.value.splice(index, 1)
  }
}

const removePulse = (id: string) => {
  const index = activePulses.value.findIndex(pulse => pulse.id === id)
  if (index > -1) {
    activePulses.value.splice(index, 1)
  }
}

// 清理所有动画
const clearAllAnimations = () => {
  activeAnimations.value = []
  activeStacks.value = []
  activeCollections.value = []
  activeScatters.value = []
  activePulses.value = []
}

// 暴露方法
defineExpose({
  flyChip,
  stackChips,
  collectChips,
  scatterChips,
  pulseChip,
  clearAllAnimations
})

// 组件销毁时清理
onUnmounted(() => {
  clearAllAnimations()
})
</script>

<style scoped>
/* 动画容器 */
.chip-animation-container,
.chip-stack-container,
.chip-collect-container,
.chip-scatter-container,
.chip-pulse-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 9997;
  overflow: hidden;
}

/* 筹码基础样式 */
.chip-body {
  position: relative;
  width: 40px;
  height: 40px;
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
  border: 2px solid rgba(255, 255, 255, 0.3);
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
  font-size: 10px;
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

/* 飞行动画 */
.flying-chip {
  position: absolute;
  z-index: 1000;
  transition: transform 0.3s ease;
}

.flying-chip.bouncing {
  animation: chipBounce 0.3s ease;
}

@keyframes chipBounce {
  0%, 100% { transform: scale(1) translateY(0); }
  50% { transform: scale(1.2) translateY(-10px); }
}

/* 飞行轨迹特效 */
.flight-trail {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  pointer-events: none;
}

.trail-particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: rgba(255, 215, 0, 0.6);
  border-radius: 50%;
  animation: trailParticle 0.5s ease-out infinite;
}

.trail-particle:nth-child(1) { top: 20%; left: 20%; animation-delay: 0s; }
.trail-particle:nth-child(2) { top: 40%; left: 40%; animation-delay: 0.1s; }
.trail-particle:nth-child(3) { top: 60%; left: 60%; animation-delay: 0.2s; }
.trail-particle:nth-child(4) { top: 80%; left: 80%; animation-delay: 0.3s; }
.trail-particle:nth-child(5) { top: 50%; left: 50%; animation-delay: 0.4s; }

@keyframes trailParticle {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(0.5) translateX(-20px) translateY(-20px);
  }
}

/* 金额显示 */
.amount-display {
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 215, 0, 0.9);
  color: #333;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: bold;
  white-space: nowrap;
  animation: amountDisplay 1s ease;
}

@keyframes amountDisplay {
  0% {
    opacity: 0;
    transform: translateX(-50%) translateY(10px) scale(0.5);
  }
  50% {
    opacity: 1;
    transform: translateX(-50%) translateY(-5px) scale(1.1);
  }
  100% {
    opacity: 1;
    transform: translateX(-50%) translateY(-30px) scale(1);
  }
}

/* 堆叠动画 */
.chip-stack {
  position: absolute;
  transform-style: preserve-3d;
}

.stacked-chip {
  position: absolute;
  animation: chipStack 0.3s ease forwards;
  opacity: 0;
}

@keyframes chipStack {
  0% {
    opacity: 0;
    transform: translateZ(0px) translateY(50px) scale(0.8);
  }
  100% {
    opacity: 1;
    transform: translateZ(var(--z-offset, 0px)) translateY(var(--y-offset, 0px)) scale(1);
  }
}

.stack-amount {
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  background: rgba(0, 0, 0, 0.8);
  color: #ffd700;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid #ffd700;
  animation: stackAmountShow 0.5s ease 1s forwards;
  opacity: 0;
}

@keyframes stackAmountShow {
  0% {
    opacity: 0;
    transform: translateX(-50%) translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.amount-value {
  font-size: 12px;
  font-weight: bold;
}

.amount-label {
  font-size: 8px;
  opacity: 0.8;
}

/* 收集动画 */
.collect-animation {
  position: absolute;
}

.collect-vortex {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100px;
  height: 100px;
}

.vortex-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border: 2px solid rgba(255, 215, 0, 0.3);
  border-radius: 50%;
  animation: vortexRing 2s linear infinite;
}

.vortex-ring:nth-child(1) {
  width: 40px;
  height: 40px;
  animation-delay: 0s;
}

.vortex-ring:nth-child(2) {
  width: 60px;
  height: 60px;
  animation-delay: 0.3s;
}

.vortex-ring:nth-child(3) {
  width: 80px;
  height: 80px;
  animation-delay: 0.6s;
}

@keyframes vortexRing {
  0% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(0.5) rotate(0deg);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(1.5) rotate(360deg);
  }
}

.collecting-chip {
  position: absolute;
  animation: chipCollect 2s ease-in-out forwards;
}

@keyframes chipCollect {
  0% {
    transform: rotate(var(--spiral-angle)) translateX(80px) rotate(calc(-1 * var(--spiral-angle)));
    opacity: 1;
  }
  100% {
    transform: rotate(calc(var(--spiral-angle) + 720deg)) translateX(0px) rotate(calc(-1 * (var(--spiral-angle) + 720deg)));
    opacity: 0;
  }
}

/* 收集完成效果 */
.collect-complete {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.complete-burst {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
}

.burst-particle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 4px;
  height: 4px;
  background: #ffd700;
  border-radius: 50%;
  animation: burstParticle 0.8s ease-out forwards;
}

.burst-particle:nth-child(1) { transform: translate(-50%, -50%) rotate(0deg); }
.burst-particle:nth-child(2) { transform: translate(-50%, -50%) rotate(45deg); }
.burst-particle:nth-child(3) { transform: translate(-50%, -50%) rotate(90deg); }
.burst-particle:nth-child(4) { transform: translate(-50%, -50%) rotate(135deg); }
.burst-particle:nth-child(5) { transform: translate(-50%, -50%) rotate(180deg); }
.burst-particle:nth-child(6) { transform: translate(-50%, -50%) rotate(225deg); }
.burst-particle:nth-child(7) { transform: translate(-50%, -50%) rotate(270deg); }
.burst-particle:nth-child(8) { transform: translate(-50%, -50%) rotate(315deg); }

@keyframes burstParticle {
  0% {
    opacity: 1;
    transform: translate(-50%, -50%) translateX(0);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) translateX(40px);
  }
}

.complete-text {
  background: rgba(255, 215, 0, 0.9);
  color: #333;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  animation: completeTextShow 0.5s ease 0.3s forwards;
  opacity: 0;
}

@keyframes completeTextShow {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* 分散动画 */
.scatter-animation {
  position: absolute;
}

.scattering-chip {
  position: absolute;
  animation: chipScatter 1.5s ease-out forwards;
}

@keyframes chipScatter {
  0% {
    transform: translate(-50%, -50%) rotate(0deg) scale(1);
    opacity: 1;
  }
  100% {
    transform: 
      translate(-50%, -50%) 
      rotate(var(--scatter-angle)) 
      translateX(var(--scatter-distance)) 
      rotate(calc(-1 * var(--scatter-angle)))
      scale(0.7);
    opacity: 0.3;
  }
}

/* 脉冲动画 */
.pulse-animation {
  position: absolute;
}

.pulse-chip {
  position: relative;
  animation: chipPulseMain 1s ease-in-out infinite;
}

@keyframes chipPulseMain {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.9;
  }
}

/* 脉冲波效果 */
.pulse-rings {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 80px;
}

.pulse-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border: 2px solid rgba(255, 215, 0, 0.6);
  border-radius: 50%;
  animation: pulseRing 1s ease-out infinite;
}

.pulse-ring:nth-child(1) {
  animation-delay: 0s;
}

.pulse-ring:nth-child(2) {
  animation-delay: 0.3s;
}

.pulse-ring:nth-child(3) {
  animation-delay: 0.6s;
}

@keyframes pulseRing {
  0% {
    width: 40px;
    height: 40px;
    opacity: 1;
  }
  100% {
    width: 80px;
    height: 80px;
    opacity: 0;
  }
}

/* 能量光环 */
.energy-aura {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  background: radial-gradient(
    circle,
    rgba(255, 215, 0, 0.3) 0%,
    rgba(255, 215, 0, 0.1) 50%,
    transparent 100%
  );
  border-radius: 50%;
  animation: energyAura 2s ease-in-out infinite;
}

@keyframes energyAura {
  0%, 100% {
    opacity: 0.3;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 0.8;
    transform: translate(-50%, -50%) scale(1.2);
  }
}

/* 响应式适配 */
@media (max-width: 768px) {
  .chip-body {
    width: 35px;
    height: 35px;
  }
  
  .chip-value {
    font-size: 9px;
  }
  
  .amount-display {
    font-size: 9px;
    padding: 1px 4px;
  }
  
  .stack-amount {
    padding: 3px 6px;
  }
  
  .amount-value {
    font-size: 11px;
  }
  
  .amount-label {
    font-size: 7px;
  }
  
  .complete-text {
    font-size: 11px;
    padding: 3px 6px;
  }
  
  .vortex-ring:nth-child(1) {
    width: 30px;
    height: 30px;
  }
  
  .vortex-ring:nth-child(2) {
    width: 45px;
    height: 45px;
  }
  
  .vortex-ring:nth-child(3) {
    width: 60px;
    height: 60px;
  }
  
  .pulse-rings {
    width: 60px;
    height: 60px;
  }
  
  .energy-aura {
    width: 45px;
    height: 45px;
  }
}

@media (max-width: 480px) {
  .chip-body {
    width: 30px;
    height: 30px;
  }
  
  .chip-value {
    font-size: 8px;
  }
  
  .flight-trail {
    width: 45px;
    height: 45px;
  }
  
  .trail-particle {
    width: 3px;
    height: 3px;
  }
  
  .amount-display {
    font-size: 8px;
    padding: 1px 3px;
  }
  
  .complete-burst {
    width: 45px;
    height: 45px;
  }
  
  .burst-particle {
    width: 3px;
    height: 3px;
  }
}

/* 横屏适配 */
@media (orientation: landscape) and (max-height: 500px) {
  .chip-body {
    width: 32px;
    height: 32px;
  }
  
  .chip-value {
    font-size: 8px;
  }
  
  .amount-display {
    top: -25px;
    font-size: 8px;
  }
  
  .stack-amount {
    top: -35px;
    padding: 2px 5px;
  }
  
  .amount-value {
    font-size: 10px;
  }
  
  .amount-label {
    font-size: 6px;
  }
}

/* 性能优化 */
.flying-chip,
.stacked-chip,
.collecting-chip,
.scattering-chip,
.pulse-chip {
  will-change: transform, opacity;
}

.pulse-ring,
.vortex-ring,
.trail-particle,
.burst-particle {
  will-change: transform, opacity;
}

/* 高对比度模式适配 */
@media (prefers-contrast: high) {
  .chip-edge {
    border-color: rgba(255, 255, 255, 0.8);
  }
  
  .trail-particle {
    background: rgba(255, 255, 0, 0.9);
  }
  
  .pulse-ring,
  .vortex-ring {
    border-color: rgba(255, 255, 0, 0.9);
  }
  
  .amount-display,
  .complete-text {
    background: rgba(255, 255, 0, 1);
    color: #000;
  }
}

/* 减少动画模式适配 */
@media (prefers-reduced-motion: reduce) {
  .flying-chip,
  .stacked-chip,
  .collecting-chip,
  .scattering-chip,
  .pulse-chip {
    animation-duration: 0.1s;
  }
  
  .pulse-ring,
  .vortex-ring,
  .trail-particle,
  .burst-particle {
    animation: none;
  }
  
  .energy-aura {
    animation: none;
    opacity: 0.5;
  }
}

/* GPU 加速优化 */
.flying-chip,
.collecting-chip,
.scattering-chip,
.pulse-chip {
  transform: translateZ(0);
  backface-visibility: hidden;
  perspective: 1000px;
}

/* 3D 变换优化 */
.chip-stack {
  perspective: 1000px;
}

.stacked-chip {
  transform-style: preserve-3d;
  backface-visibility: hidden;
}
</style>