<!-- App.vue - 修复 Safari 按钮显示问题的版本 -->
<template>
  <n-message-provider>
    <div id="app">
      <!-- 欢迎界面 - 在游戏初始化前显示 -->
      <div v-if="showWelcomeScreen" class="welcome-overlay">
        <div class="welcome-card">
          <div class="welcome-header">
            <h2 class="welcome-title">🎲 欢迎来到骰宝游戏</h2>
            <p class="welcome-subtitle">点击开始按钮进入游戏并启用音效</p>
          </div>
          
          <button class="welcome-button" @click="startGame" :disabled="isStartingGame">
            <span class="button-text">{{ isStartingGame ? '启动中...' : '开始游戏' }}</span>
            <span class="button-icon">{{ isStartingGame ? '⏳' : '🚀' }}</span>
          </button>
          
          <p class="welcome-note">
            首次点击将启用音频上下文，确保最佳游戏体验
          </p>
        </div>
      </div>

      <!-- 游戏初始化加载状态 -->
      <div v-if="showLoadingScreen" class="loading-overlay">
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <div class="loading-text">
            <h3>🎲 骰宝游戏初始化中...</h3>
            <div class="loading-steps">
              <div 
                class="loading-step" 
                :class="{ 'completed': lifecycleState.initSteps.urlParams }"
              >
                <i class="step-icon">📋</i>
                <span>解析游戏参数</span>
                <i v-if="lifecycleState.initSteps.urlParams" class="check-icon">✓</i>
              </div>
              <div 
                class="loading-step" 
                :class="{ 'completed': lifecycleState.initSteps.httpApi }"
              >
                <i class="step-icon">🌐</i>
                <span>连接游戏服务器</span>
                <i v-if="lifecycleState.initSteps.httpApi" class="check-icon">✓</i>
              </div>
              <div 
                class="loading-step" 
                :class="{ 'completed': lifecycleState.initSteps.websocket }"
              >
                <i class="step-icon">🔌</i>
                <span>建立实时连接</span>
                <i v-if="lifecycleState.initSteps.websocket" class="check-icon">✓</i>
              </div>
              <div 
                class="loading-step" 
                :class="{ 'completed': audioInitialized }"
              >
                <i class="step-icon">🎵</i>
                <span>启用音频系统</span>
                <i v-if="audioInitialized" class="check-icon">✓</i>
              </div>
            </div>
            <div class="loading-progress">
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :style="{ width: `${initializationProgress}%` }"
                ></div>
              </div>
              <span class="progress-text">{{ initializationProgress }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 错误状态 -->
      <div v-if="showErrorScreen" class="error-overlay">
        <div class="error-container">
          <div class="error-icon">❌</div>
          <h3>游戏连接失败</h3>
          <div class="error-message">请刷新页面重试</div>
        </div>
      </div>

      <!-- 游戏主界面 -->
      <div v-if="showGameScreen" class="game-container">
        <!-- 顶部视频区域 -->
        <div class="top-section">
          <GameTopSection />
        </div>
        
        <!-- 底部投注区域 -->
        <div class="bottom-section">
          <BettingArea />
        </div>
      </div>
    </div>
  </n-message-provider>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, nextTick } from 'vue'
import { NMessageProvider } from 'naive-ui'
import GameTopSection from '@/components/Layout/GameTopSection.vue'
import BettingArea from '@/components/BettingArea/BettingArea.vue'
import { useGameLifecycle } from '@/composables/useGameLifecycle'
import { initializeGlobalAudioSystem, unlockGlobalAudioContext, useAudio } from '@/composables/useAudio'
import { ENV_CONFIG } from '@/utils/envUtils'

// 欢迎界面状态
const showWelcome = ref(true)
const isStartingGame = ref(false)

// 音频系统状态
const audioInitialized = ref(false)

// 音频系统实例引用
const audioSystem = useAudio()

// 集成游戏生命周期管理
const {
  lifecycleState,
  isReady,
  initialize,
  reconnect,
  clearError
} = useGameLifecycle({
  autoInitialize: false,
  enableAudio: true,
  skipGameTypeValidation: ENV_CONFIG.IS_DEV
})

// 消息通知状态 - 延迟获取
let message: any = null

// 计算属性 - 界面显示逻辑
const showWelcomeScreen = computed(() => {
  return showWelcome.value && !isStartingGame.value
})

const showLoadingScreen = computed(() => {
  return !showWelcome.value && 
         (isStartingGame.value || lifecycleState.isLoading || 
         (!lifecycleState.isInitialized && !lifecycleState.error))
})

const showErrorScreen = computed(() => {
  return !showWelcome.value && 
         lifecycleState.error && 
         !lifecycleState.isLoading && 
         !isStartingGame.value
})

const showGameScreen = computed(() => {
  return !showWelcome.value && 
         lifecycleState.isInitialized && 
         !lifecycleState.isLoading && 
         !lifecycleState.error && 
         !isStartingGame.value
})

// 初始化进度计算 - 包含音频系统
const initializationProgress = computed(() => {
  const steps = {
    ...lifecycleState.initSteps,
    audio: audioInitialized.value
  }
  const completedSteps = Object.values(steps).filter(Boolean).length
  const totalSteps = Object.keys(steps).length
  return Math.round((completedSteps / totalSteps) * 100)
})

// 安全的消息通知函数
const showMessage = (type: 'success' | 'error' | 'info' | 'warning', text: string) => {
  try {
    if (message) {
      message[type](text)
    } else {
      console.log(`[${type.toUpperCase()}] ${text}`)
    }
  } catch (error) {
    console.log(`[${type.toUpperCase()}] ${text}`)
  }
}

// 自动播放背景音乐检查
const checkAndStartBackgroundMusic = async () => {
  try {
    console.log('🎵 检查是否需要自动播放背景音乐...')
    
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const audioInfo = audioSystem.getAudioInfo()
    console.log('🎵 当前音频系统状态:', audioInfo)
    
    if (audioInfo.config.enableMusic && audioInfo.canPlayAudio && !audioInfo.isBackgroundMusicPlaying) {
      console.log('🎵 背景音乐已开启且音频系统就绪，开始播放背景音乐')
      const success = await audioSystem.startBackgroundMusicIfEnabled()
      
      if (success) {
        console.log('✅ 背景音乐自动播放成功')
        showMessage('success', '🎵 背景音乐已开始播放')
      } else {
        console.warn('⚠️ 背景音乐自动播放失败')
      }
    } else {
      console.log('🔇 背景音乐未开启或音频系统未就绪，跳过自动播放')
    }
  } catch (error) {
    console.error('❌ 检查背景音乐播放时出错:', error)
  }
}

// 启动游戏
const startGame = async () => {
  try {
    isStartingGame.value = true
    
    console.log('🎮 用户点击开始游戏')
    
    // 步骤1：初始化音频系统
    console.log('🎵 正在初始化音频系统...')
    try {
      const audioInitResult = await initializeGlobalAudioSystem()
      if (audioInitResult) {
        console.log('✅ 音频系统初始化成功')
      } else {
        console.warn('⚠️ 音频系统初始化失败，继续游戏初始化')
      }
      audioInitialized.value = true
    } catch (error) {
      console.error('❌ 音频系统初始化异常:', error)
      audioInitialized.value = true
    }
    
    // 步骤2：解锁音频上下文
    console.log('🔓 正在解锁音频上下文...')
    try {
      await unlockGlobalAudioContext()
      console.log('✅ 音频上下文解锁成功')
    } catch (error) {
      console.warn('⚠️ 音频上下文解锁失败，继续游戏初始化:', error)
    }
    
    // 步骤3：隐藏欢迎界面
    showWelcome.value = false
    
    // 步骤4：开始游戏初始化
    console.log('🚀 开始游戏生命周期初始化...')
    await initialize()
    
    console.log('🎉 游戏启动完成！')
    showMessage('success', '🎲 欢迎来到骰宝游戏！')
    
    // 步骤5：游戏初始化完成后检查背景音乐
    await checkAndStartBackgroundMusic()
    
  } catch (error: any) {
    console.error('❌ 游戏启动失败:', error)
    showMessage('error', `游戏启动失败: ${error.message}`)
  } finally {
    isStartingGame.value = false
  }
}

// 监听器
watch(() => lifecycleState.error, (newError, oldError) => {
  if (newError && newError !== oldError) {
    console.error('🚨 游戏错误:', newError)
    showMessage('error', `游戏错误: ${newError}`)
  }
})

watch(() => lifecycleState.connectionStatus, (newStatus, oldStatus) => {
  if (newStatus !== oldStatus) {
    console.log('🔌 连接状态变化:', oldStatus, '->', newStatus)
    
    if (newStatus === 'connected') {
      showMessage('success', '🎉 游戏连接成功！')
    } else if (newStatus === 'disconnected') {
      showMessage('warning', '⚠️ 游戏连接断开')
    } else if (newStatus === 'error') {
      showMessage('error', '❌ 连接错误')
    }
  }
})

watch(isReady, async (ready) => {
  if (ready) {
    console.log('🎮 游戏已就绪，可以开始游戏！')
    showMessage('success', '🎲 骰宝游戏已就绪！')
    
    setTimeout(async () => {
      await checkAndStartBackgroundMusic()
    }, 1000)
  }
})

// 生命周期
onMounted(async () => {
  console.log('🚀 App.vue 已挂载，游戏生命周期管理已启动')
  
  await nextTick()
  
  try {
    const { message: messageInstance } = await import('@/utils/message')
    message = messageInstance
  } catch (error) {
    console.warn('⚠️ 无法获取消息实例，将使用控制台输出:', error)
  }
  
  console.log('📋 App.vue 初始化完成，等待用户启动游戏')
})
</script>

<style>
/* ========== 🔥 修复 Safari 按钮显示问题的关键样式 ========== */

/* 基础重置 - 保持不变 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* 🔥 修复1: html, body 样式调整 */
html, body {
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
  margin: 0;
  padding: 0;
  background: #000;
  color: #ffffff;
  
  /* 🔥 Safari 修复: 不要在根元素使用 overflow: hidden */
  overflow-x: hidden;
  /* overflow-y 保持默认，让子元素控制 */
}

/* 🔥 修复2: #app 关键修改 - 不使用 position: fixed */
#app {
  /* 🔥 关键修复: 使用 absolute 而不是 fixed */
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  
  /* 🔥 Safari 视口高度修复 */
  height: 100dvh; /* 动态视口高度，Safari 15.4+ */
  
  display: flex;
  flex-direction: column;
  background: #000;
  color: inherit;
  
  /* 🔥 允许子元素溢出以支持固定定位 */
  overflow: visible;
  
  /* 🔥 Safari 硬件加速 */
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
}

/* 🔥 修复3: 游戏容器样式调整 */
.game-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  color: inherit;
  
  /* 🔥 确保容器可以包含固定定位的子元素 */
  position: relative;
  overflow: hidden; /* 只在游戏容器层面控制溢出 */
}

.top-section {
  height: 300px;
  flex-shrink: 0;
  background: #000;
  z-index: 1;
  position: relative; /* 🔥 明确定位上下文 */
}

.bottom-section {
  flex: 1;
  background: #0d2818;
  min-height: 0;
  position: relative; /* 🔥 为固定定位的子元素提供定位上下文 */
  z-index: 1;
  color: inherit;
  
  /* 🔥 确保固定定位元素可见 */
  overflow: visible;
}

/* 🔥 修复4: Safari 特定的条件样式 */
@supports (-webkit-touch-callout: none) {
  /* Safari 特定修复 */
  #app {
    /* 在 Safari 中使用更保守的设置 */
    position: absolute !important;
    overflow: visible !important;
  }
  
  .game-container {
    overflow-x: hidden;
    overflow-y: auto;
  }
  
  .bottom-section {
    /* 确保底部区域在 Safari 中正确显示 */
    overflow: visible !important;
    contain: none; /* 移除 CSS containment 限制 */
  }
}

/* 🔥 修复5: iOS Safari 特定修复 */
@media screen and (-webkit-min-device-pixel-ratio: 2) {
  #app {
    /* iOS 高分辨率设备优化 */
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
}

/* 保持原有的其他样式不变 */
.bottom-section * {
  color: inherit;
}

.bottom-section .bet-amount-corner,
.bottom-section [class*="bet-amount"],
.bottom-section [class*="amount-corner"] {
  z-index: 250 !important;
}

/* ========== 欢迎界面样式 - 保持不变 ========== */
.welcome-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, 
    rgba(13, 40, 24, 0.98) 0%, 
    rgba(0, 0, 0, 0.95) 100%);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
}

.welcome-card {
  background: linear-gradient(135deg, 
    rgba(45, 90, 66, 0.9) 0%, 
    rgba(13, 40, 24, 0.9) 100%);
  border: 2px solid #4a9f6e;
  border-radius: 20px;
  padding: 40px 30px;
  text-align: center;
  max-width: 400px;
  width: 100%;
  box-shadow: 
    0 10px 30px rgba(0, 0, 0, 0.5),
    0 0 20px rgba(74, 159, 110, 0.2);
  animation: welcomeSlideIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes welcomeSlideIn {
  0% {
    opacity: 0;
    transform: translateY(50px) scale(0.9);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.welcome-header {
  margin-bottom: 30px;
}

.welcome-title {
  font-size: 24px;
  font-weight: 700;
  color: #ffd700;
  margin: 0 0 12px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.welcome-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  line-height: 1.5;
}

.welcome-button {
  background: linear-gradient(135deg, #4a9f6e, #27ae60);
  border: 2px solid #5bb77c;
  color: white;
  padding: 16px 32px;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin: 20px auto;
  box-shadow: 
    0 4px 15px rgba(74, 159, 110, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.welcome-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #5bb77c, #2ecc71);
  border-color: #6bc985;
  transform: translateY(-2px);
  box-shadow: 
    0 6px 20px rgba(74, 159, 110, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.welcome-button:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 
    0 2px 10px rgba(74, 159, 110, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.welcome-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.button-text {
  font-size: 18px;
}

.button-icon {
  font-size: 20px;
  animation: rocketFloat 2s ease-in-out infinite;
}

@keyframes rocketFloat {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}

.welcome-note {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
  line-height: 1.4;
}

/* ========== 加载界面样式 - 保持不变 ========== */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #0d2818 0%, #1a3a2e 50%, #16302b 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.loading-container {
  text-align: center;
  color: #fff;
  max-width: 500px;
  padding: 2rem;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(255, 215, 0, 0.3);
  border-top: 4px solid #ffd700;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 2rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text h3 {
  margin-bottom: 2rem;
  font-size: 1.5rem;
  color: #ffd700;
}

.loading-steps {
  margin-bottom: 2rem;
}

.loading-step {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  margin: 0.5rem 0;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.loading-step.completed {
  background: rgba(34, 197, 94, 0.2);
  border-left: 4px solid #22c55e;
}

.step-icon {
  font-size: 1.2rem;
  margin-right: 0.5rem;
}

.check-icon {
  color: #22c55e;
  font-weight: bold;
}

.loading-progress {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ffd700, #ffed4e);
  transition: width 0.3s ease;
}

.progress-text {
  color: #ffd700;
  font-weight: bold;
  min-width: 40px;
}

/* ========== 错误界面样式 - 保持不变 ========== */
.error-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #2d1b1b 0%, #3d2b2b 50%, #2d2121 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.error-container {
  text-align: center;
  color: #fff;
  max-width: 600px;
  padding: 2rem;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.7);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.error-container h3 {
  color: #ef4444;
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

.error-message {
  margin-bottom: 1rem;
  padding: 1rem;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 8px;
  color: #fca5a5;
  font-size: 1.1rem;
}

/* ========== 响应式设计 - 保持不变 ========== */
@media (max-width: 768px) {
  html, body {
    font-size: 14px;
  }
  
  .top-section {
    height: 300px;
  }

  .loading-container {
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  html, body {
    font-size: 13px;
  }
  
  .top-section {
    height: 300px;
  }

  .loading-steps {
    font-size: 0.9rem;
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

/* ========== 其他样式保持不变 ========== */
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