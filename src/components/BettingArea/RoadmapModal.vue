<template>
  <teleport to="body">
    <div v-if="visible" class="roadmap-modal-overlay" @click="handleOverlayClick">
      <div class="roadmap-modal" @click.stop>
        <!-- 弹窗头部 -->
        <div class="modal-header">
          <div class="header-left">
            <div class="modal-icon">📊</div>
            <div class="header-info">
              <h3 class="modal-title">路纸</h3>
              <p class="modal-subtitle">历史开奖走势图</p>
            </div>
          </div>
          <button class="close-btn" @click="handleClose" title="关闭">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
            </svg>
          </button>
        </div>
        
        <!-- 弹窗内容 -->
        <div class="modal-content">
          <!-- 加载状态 -->
          <div v-if="isLoading" class="loading-container">
            <div class="loading-spinner"></div>
            <p class="loading-text">正在加载路纸数据...</p>
          </div>
          
          <!-- 错误状态 -->
          <div v-else-if="hasError" class="error-container">
            <div class="error-icon">⚠️</div>
            <p class="error-text">路纸加载失败</p>
            <button class="retry-btn" @click="retryLoad">重新加载</button>
          </div>
          
          <!-- iframe 内容 -->
          <iframe
            v-else
            ref="roadmapIframe"
            :src="roadmapUrl"
            class="roadmap-iframe"
            frameborder="0"
            scrolling="auto"
            @load="handleIframeLoad"
            @error="handleIframeError"
          />
        </div>
        
        <!-- 弹窗底部 -->
        <div class="modal-footer">
          <div class="footer-info">
            <span class="update-time">更新时间: {{ updateTime }}</span>
          </div>
          <div class="footer-actions">
            <button class="refresh-btn" @click="refreshRoadmap" :disabled="isLoading">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"/>
              </svg>
              刷新
            </button>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

interface Props {
  show: boolean
  roadmapUrl: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  'close': []
}>()

// 响应式状态
const visible = ref(false)
const isLoading = ref(true)
const hasError = ref(false)
const updateTime = ref('')
const roadmapIframe = ref<HTMLIFrameElement>()

// 计算属性
const modalVisible = computed({
  get: () => props.show,
  set: (value: boolean) => {
    emit('update:show', value)
  }
})

// 更新时间
const updateCurrentTime = () => {
  const now = new Date()
  updateTime.value = now.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// iframe 加载处理
const handleIframeLoad = () => {
  console.log('📊 路纸 iframe 加载完成')
  isLoading.value = false
  hasError.value = false
  updateCurrentTime()
}

const handleIframeError = () => {
  console.error('📊 路纸 iframe 加载失败')
  isLoading.value = false
  hasError.value = true
}

// 重新加载
const retryLoad = () => {
  console.log('🔄 重新加载路纸')
  isLoading.value = true
  hasError.value = false
  
  if (roadmapIframe.value) {
    roadmapIframe.value.src = props.roadmapUrl
  }
}

// 刷新路纸
const refreshRoadmap = () => {
  console.log('🔄 刷新路纸数据')
  if (roadmapIframe.value) {
    isLoading.value = true
    hasError.value = false
    
    // 添加时间戳强制刷新
    const separator = props.roadmapUrl.includes('?') ? '&' : '?'
    const refreshUrl = `${props.roadmapUrl}${separator}_t=${Date.now()}`
    roadmapIframe.value.src = refreshUrl
  }
}

// 关闭处理
const handleClose = () => {
  visible.value = false
  modalVisible.value = false
  emit('close')
}

const handleOverlayClick = () => {
  handleClose()
}

// 键盘事件处理
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && visible.value) {
    handleClose()
  }
}

// 监听显示状态变化
watch(() => props.show, (newVal) => {
  visible.value = newVal
  
  if (newVal) {
    // 显示时重置状态
    isLoading.value = true
    hasError.value = false
    updateCurrentTime()
    
    // 添加键盘监听
    document.addEventListener('keydown', handleKeydown)
    
    // 禁止背景滚动
    document.body.style.overflow = 'hidden'
  } else {
    // 隐藏时清理
    document.removeEventListener('keydown', handleKeydown)
    
    // 恢复背景滚动
    document.body.style.overflow = ''
  }
})

// 组件卸载时清理
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})

// 挂载时初始化
onMounted(() => {
  updateCurrentTime()
})
</script>

<style scoped>
.roadmap-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.roadmap-modal {
  background: linear-gradient(135deg, 
    rgba(13, 40, 24, 0.98) 0%, 
    rgba(0, 0, 0, 0.95) 100%);
  border: 2px solid #4a9f6e;
  border-radius: 12px;
  width: 90%;
  max-width: 900px;
  height: 80%;
  max-height: 600px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.3);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-icon {
  font-size: 24px;
  width: 40px;
  height: 40px;
  background: rgba(74, 159, 110, 0.2);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(74, 159, 110, 0.3);
}

.header-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.modal-title {
  color: #ffd700;
  font-size: 18px;
  font-weight: 700;
  margin: 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.modal-subtitle {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  margin: 0;
}

.close-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  padding: 8px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.8);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.modal-content {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.roadmap-iframe {
  width: 100%;
  height: 100%;
  background: white;
  border-radius: 4px;
}

.loading-container,
.error-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid #4a9f6e;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text,
.error-text {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
}

.error-icon {
  font-size: 32px;
}

.retry-btn,
.refresh-btn {
  background: #4a9f6e;
  border: 1px solid #5bb77c;
  border-radius: 6px;
  padding: 8px 16px;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.retry-btn:hover,
.refresh-btn:hover:not(:disabled) {
  background: #27ae60;
  transform: translateY(-1px);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.3);
}

.footer-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.update-time {
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
}

.footer-actions {
  display: flex;
  gap: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .roadmap-modal {
    width: 95%;
    height: 85%;
    margin: 10px;
  }
  
  .modal-header {
    padding: 12px 16px;
  }
  
  .modal-title {
    font-size: 16px;
  }
  
  .modal-subtitle {
    font-size: 11px;
  }
  
  .modal-footer {
    padding: 10px 16px;
  }
}

@media (max-width: 480px) {
  .roadmap-modal-overlay {
    padding: 10px;
  }
  
  .roadmap-modal {
    width: 100%;
    height: 90%;
  }
  
  .header-left {
    gap: 8px;
  }
  
  .modal-icon {
    width: 32px;
    height: 32px;
    font-size: 20px;
  }
}
</style>