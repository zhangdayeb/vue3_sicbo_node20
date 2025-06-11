<template>
  <teleport to="body">
    <div v-if="modalVisible" class="roadmap-modal-overlay" @click="handleOverlayClick">
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
          <RoadmapChart 
            ref="roadmapChart"
            :table-id="tableId"
            :auto-refresh="false"
            @data-loaded="handleDataLoaded"
            @data-error="handleDataError"
          />
        </div>
        
        <!-- 弹窗底部 -->
        <div class="modal-footer">
          <div class="footer-info">
            <span class="update-time">更新时间: {{ updateTime }}</span>
            <span v-if="dataStatus" class="data-status" :class="dataStatus.type">
              {{ dataStatus.message }}
            </span>
          </div>
          <div class="footer-actions">
            <button 
              class="refresh-btn" 
              @click="refreshRoadmap" 
              :disabled="isRefreshing"
              title="刷新路纸数据"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" :class="{ 'spinning': isRefreshing }">
                <path fill="currentColor" d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"/>
              </svg>
              {{ isRefreshing ? '刷新中' : '刷新' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import RoadmapChart from './RoadmapChart.vue'
import { useGameData } from '@/composables/useGameData'
import type { HistoryData } from '@/types/roadmapTypes'

interface Props {
  show: boolean
  tableId?: string | number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  'close': []
}>()

// 响应式数据
const updateTime = ref('')
const isRefreshing = ref(false)
const roadmapChart = ref<InstanceType<typeof RoadmapChart>>()
const dataStatus = ref<{
  type: 'success' | 'error' | 'warning'
  message: string
} | null>(null)

// 获取游戏数据
const { tableInfo } = useGameData()

// 弹窗显示状态
const modalVisible = computed({
  get: () => props.show,
  set: (value: boolean) => {
    emit('update:show', value)
  }
})

// 获取当前tableId
const tableId = computed(() => {
  return props.tableId?.toString() || 
         tableInfo.value?.id?.toString() || 
         tableInfo.value?.table_id?.toString() || 
         'default'
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

// 刷新路纸数据
const refreshRoadmap = async () => {
  if (isRefreshing.value || !roadmapChart.value) return
  
  console.log('🔄 手动刷新路纸数据')
  isRefreshing.value = true
  dataStatus.value = null
  
  try {
    await roadmapChart.value.refresh()
  } catch (error) {
    console.error('❌ 刷新失败:', error)
  } finally {
    isRefreshing.value = false
  }
}

// 数据加载成功处理
const handleDataLoaded = (data: HistoryData) => {
  console.log('✅ 路纸数据加载成功:', data)
  updateCurrentTime()
  dataStatus.value = {
    type: 'success',
    message: `已加载 ${data.total} 条记录`
  }
  
  // 3秒后清除状态信息
  setTimeout(() => {
    dataStatus.value = null
  }, 3000)
}

// 数据加载错误处理
const handleDataError = (error: string) => {
  console.error('❌ 路纸数据加载失败:', error)
  updateCurrentTime()
  dataStatus.value = {
    type: 'error',
    message: '数据加载失败'
  }
}

// 关闭处理
const handleClose = () => {
  modalVisible.value = false
  emit('close')
}

const handleOverlayClick = () => {
  handleClose()
}

// 键盘事件处理
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && modalVisible.value) {
    handleClose()
  } else if (event.key === 'F5' && modalVisible.value) {
    event.preventDefault()
    refreshRoadmap()
  }
}

// 监听显示状态变化
watch(() => props.show, (newVal) => {
  console.log('📊 路纸弹窗显示状态变化:', newVal)
  
  if (newVal) {
    // 显示时初始化
    updateCurrentTime()
    dataStatus.value = null
    
    // 添加键盘监听
    document.addEventListener('keydown', handleKeydown)
    
    // 禁止背景滚动
    document.body.style.overflow = 'hidden'
    
    console.log('📊 路纸弹窗已显示，当前tableId:', tableId.value)
  } else {
    // 隐藏时清理
    document.removeEventListener('keydown', handleKeydown)
    
    // 恢复背景滚动
    document.body.style.overflow = ''
    
    console.log('📊 路纸弹窗已隐藏')
  }
}, { immediate: true })

// 监听tableId变化，自动刷新数据
watch(() => tableId.value, (newTableId, oldTableId) => {
  if (newTableId !== oldTableId && modalVisible.value && roadmapChart.value) {
    console.log('🔄 tableId变化，刷新路纸数据:', { old: oldTableId, new: newTableId })
    refreshRoadmap()
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
  console.log('📊 RoadmapModal 组件已挂载')
})

// 暴露方法给父组件
defineExpose({
  refresh: refreshRoadmap,
  close: handleClose
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
  max-width: 1000px;
  height: 80%;
  max-height: 700px;
  min-height: 500px;
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
  flex-shrink: 0;
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
  overflow: hidden;
  position: relative;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
}

.footer-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.update-time {
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
}

.data-status {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: 500;
}

.data-status.success {
  background: rgba(39, 174, 96, 0.2);
  color: #27ae60;
  border: 1px solid rgba(39, 174, 96, 0.3);
}

.data-status.error {
  background: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
  border: 1px solid rgba(231, 76, 60, 0.3);
}

.data-status.warning {
  background: rgba(243, 156, 18, 0.2);
  color: #f39c12;
  border: 1px solid rgba(243, 156, 18, 0.3);
}

.footer-actions {
  display: flex;
  gap: 8px;
}

.refresh-btn {
  background: #4a9f6e;
  border: 1px solid #5bb77c;
  border-radius: 6px;
  padding: 8px 12px;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
}

.refresh-btn:hover:not(:disabled) {
  background: #27ae60;
  transform: translateY(-1px);
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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
  
  .footer-info {
    gap: 12px;
  }
  
  .update-time,
  .data-status {
    font-size: 11px;
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
  
  .modal-footer {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }
  
  .footer-info {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .footer-actions {
    justify-content: center;
  }
}
</style>