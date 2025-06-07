<template>
  <div class="chip-selector">
    <!-- 筹码选择区域 -->
    <div class="chip-container">
      <div class="chip-list">
        <!-- 5个常用筹码 -->
        <button
          v-for="chip in favoriteChips"
          :key="chip.value"
          class="chip-btn"
          :class="{ 'active': selectedChip === chip.value }"
          @click="selectChip(chip.value)"
        >
          <img 
            :src="getChipImage(chip.value, 'selected')" 
            :alt="chip.label"
            class="chip-image"
          />
        </button>
        
        <!-- 设置按钮 -->
        <button
          class="chip-btn settings-btn"
          @click="openSettings"
        >
          <img 
            src="/src/assets/images/chips/chip.png" 
            alt="设置"
            class="chip-image settings-icon"
          />
        </button>
      </div>
    </div>

    <!-- 使用 Naive UI Modal -->
    <n-modal 
      v-model:show="showSettings" 
      preset="card"
      :style="{ width: '90%', maxWidth: '600px' }"
      title="筹码设置"
      size="huge"
      :bordered="false"
      :segmented="false"
      :close-on-esc="true"
      :mask-closable="true"
      :auto-focus="false"
    >
      <template #header>
        <div class="modal-header">
          <n-icon size="20" color="#ffd700">
            <SettingsIcon />
          </n-icon>
          <span class="modal-title">筹码设置</span>
        </div>
      </template>

      <div class="settings-content">
        <!-- 当前选择信息 -->
        <div class="current-selection">
          <n-space justify="space-between" align="center">
            <n-text type="info">
              已选择 {{ tempFavorites.length }} / 5 个常用筹码
            </n-text>
            <n-button 
              size="small"
              type="primary"
              ghost
              @click="resetToDefault"
              :disabled="isDefaultSelection"
            >
              <template #icon>
                <n-icon><RefreshIcon /></n-icon>
              </template>
              恢复默认
            </n-button>
          </n-space>
        </div>

        <!-- 筹码选择网格 -->
        <div class="chips-section">
          <n-text depth="2" style="margin-bottom: 12px; display: block;">
            点击选择常用筹码（最多5个）
          </n-text>
          
          <div class="all-chips-grid">
            <div
              v-for="chip in allChips"
              :key="chip.value"
              class="chip-card"
              :class="{ 
                'selected': tempFavorites.includes(chip.value),
                'disabled': !tempFavorites.includes(chip.value) && tempFavorites.length >= 5
              }"
              @click="toggleChipSelection(chip.value)"
            >
              <div class="chip-card-inner">
                <img 
                  :src="getChipImage(chip.value, 'all')" 
                  :alt="chip.label"
                  class="chip-card-image"
                />
                <n-text class="chip-card-label">{{ chip.label }}</n-text>
                
                <!-- 选中序号 -->
                <div 
                  v-if="tempFavorites.includes(chip.value)" 
                  class="selection-badge"
                >
                  {{ tempFavorites.indexOf(chip.value) + 1 }}
                </div>
                
                <!-- 选中图标 -->
                <div 
                  v-if="tempFavorites.includes(chip.value)"
                  class="selection-icon"
                >
                  <n-icon size="16" color="#fff">
                    <CheckIcon />
                  </n-icon>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <n-space justify="end">
          <n-button @click="cancelSettings">
            取消
          </n-button>
          <n-button 
            type="primary"
            @click="saveSettings"
            :disabled="tempFavorites.length === 0"
          >
            <template #icon>
              <n-icon><SaveIcon /></n-icon>
            </template>
            保存设置
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { 
  NModal, 
  NButton, 
  NIcon, 
  NSpace, 
  NText,
  useMessage 
} from 'naive-ui'
import {
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  Checkmark as CheckIcon,
  Save as SaveIcon
} from '@vicons/ionicons5'

// Props
interface Props {
  selectedChip: number
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'select-chip': [value: number]
  'settings-changed': [favorites: number[]]
}>()

// 使用 Naive UI 的消息组件
const message = useMessage()

// 筹码配置接口
interface ChipConfig {
  value: number
  label: string
  filename: string
}

// 所有可用筹码配置
const allChips: ChipConfig[] = [
  { value: 1, label: '1', filename: '01' },
  { value: 5, label: '5', filename: '05' },
  { value: 10, label: '10', filename: '10' },
  { value: 50, label: '50', filename: '50' },
  { value: 100, label: '100', filename: '100' },
  { value: 500, label: '500', filename: '500' },
  { value: 1000, label: '1K', filename: '1K' },
  { value: 5000, label: '5K', filename: '5K' },
  { value: 10000, label: '10K', filename: '10K' },
  { value: 50000, label: '50K', filename: '50K' },
  { value: 100000, label: '100K', filename: '100K' },
  { value: 500000, label: '500K', filename: '500K' },
  { value: 1000000, label: '1M', filename: '1M' },
  { value: 5000000, label: '5M', filename: '5M' },
  { value: 10000000, label: '10M', filename: '10M' },
  { value: 20000000, label: '20M', filename: '20M' },
  { value: 50000000, label: '50M', filename: '50M' },
  { value: 100000000, label: '100M', filename: '100M' },
  { value: 200000000, label: '200M', filename: '200M' },
  { value: 500000000, label: '500M', filename: '500M' },
  { value: 1000000000, label: '1000M', filename: '1000M' }
]

// 默认常用筹码
const defaultFavorites = [1, 10, 100, 1000, 10000]

// 响应式数据
const showSettings = ref(false)
const favoriteChipValues = ref<number[]>([...defaultFavorites])
const tempFavorites = ref<number[]>([])

// 计算属性
const favoriteChips = computed(() => {
  return favoriteChipValues.value
    .map(value => allChips.find(chip => chip.value === value))
    .filter(chip => chip !== undefined) as ChipConfig[]
})

const isDefaultSelection = computed(() => {
  return JSON.stringify([...tempFavorites.value].sort()) === JSON.stringify([...defaultFavorites].sort())
})

// 方法
const getChipImage = (value: number, type: 'selected' | 'all'): string => {
  const chip = allChips.find(c => c.value === value)
  if (!chip) return ''
  
  const prefix = type === 'selected' ? 'S_' : 'B_'
  return `/src/assets/images/chips/${prefix}${chip.filename}.png`
}

const selectChip = (value: number): void => {
  emit('select-chip', value)
}

const openSettings = (): void => {
  tempFavorites.value = [...favoriteChipValues.value]
  showSettings.value = true
}

const closeSettings = (): void => {
  showSettings.value = false
  tempFavorites.value = []
}

const toggleChipSelection = (value: number): void => {
  const index = tempFavorites.value.indexOf(value)
  
  if (index > -1) {
    // 移除选择
    tempFavorites.value.splice(index, 1)
  } else {
    // 添加选择（最多5个）
    if (tempFavorites.value.length < 5) {
      tempFavorites.value.push(value)
    } else {
      message.warning('最多只能选择5个常用筹码')
    }
  }
}

const resetToDefault = (): void => {
  tempFavorites.value = [...defaultFavorites]
  message.info('已恢复默认设置')
}

const cancelSettings = (): void => {
  closeSettings()
}

const saveSettings = (): void => {
  if (tempFavorites.value.length === 0) {
    message.error('请至少选择一个筹码')
    return
  }
  
  // 如果选择少于5个，用默认值补齐
  const finalFavorites = [...tempFavorites.value]
  if (finalFavorites.length < 5) {
    const needed = 5 - finalFavorites.length
    const defaults = defaultFavorites.filter(v => !finalFavorites.includes(v))
    finalFavorites.push(...defaults.slice(0, needed))
  }
  
  favoriteChipValues.value = finalFavorites.slice(0, 5)
  
  // 保存到本地存储
  saveToLocalStorage()
  
  // 发送事件
  emit('settings-changed', favoriteChipValues.value)
  
  message.success('筹码设置已保存')
  closeSettings()
}

const saveToLocalStorage = (): void => {
  try {
    localStorage.setItem('sicbo_favorite_chips', JSON.stringify(favoriteChipValues.value))
  } catch (error) {
    console.warn('Failed to save chip settings:', error)
    message.error('保存设置失败')
  }
}

const loadFromLocalStorage = (): void => {
  try {
    const saved = localStorage.getItem('sicbo_favorite_chips')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) {
        favoriteChipValues.value = parsed.slice(0, 5)
      }
    }
  } catch (error) {
    console.warn('Failed to load chip settings:', error)
  }
}

// 生命周期
onMounted(() => {
  loadFromLocalStorage()
})
</script>

<style scoped>
.chip-selector {
  background: rgba(0, 0, 0, 0.95);
  border-top: 1px solid #2d5a42;
  padding: 8px;
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
  gap: 6px;
  max-width: 400px;
  width: 100%;
}

.chip-btn {
  position: relative;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  padding: 3px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.chip-btn:active {
  transform: scale(0.95);
}

.chip-btn.active {
  transform: scale(1.1);
}

.chip-image {
  width: 42px;
  height: 42px;
  object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  transition: all 0.3s ease;
}

.chip-btn.active .chip-image {
  filter: drop-shadow(0 4px 8px rgba(255, 215, 0, 0.5));
}

.settings-icon {
  opacity: 0.8;
}

.settings-btn:hover .settings-icon {
  opacity: 1;
  transform: rotate(15deg);
}

/* Modal 自定义样式 */
.modal-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #ffd700;
}

.settings-content {
  padding: 0;
}

.current-selection {
  background: rgba(255, 215, 0, 0.1);
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid rgba(255, 215, 0, 0.2);
}

.chips-section {
  margin-bottom: 8px;
}

/* 筹码选择网格 */
.all-chips-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(85px, 1fr));
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
  padding: 8px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.chip-card {
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 12px;
  overflow: hidden;
}

.chip-card:hover:not(.disabled) {
  transform: translateY(-2px);
}

.chip-card.selected {
  transform: translateY(-2px);
}

.chip-card.disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.chip-card-inner {
  position: relative;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid transparent;
  padding: 12px 8px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.chip-card:hover:not(.disabled) .chip-card-inner {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 215, 0, 0.3);
}

.chip-card.selected .chip-card-inner {
  background: rgba(255, 215, 0, 0.15);
  border-color: #ffd700;
  box-shadow: 0 0 16px rgba(255, 215, 0, 0.3);
}

.chip-card-image {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.chip-card-label {
  font-size: 12px;
  font-weight: 600;
  text-align: center;
}

.selection-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #e74c3c;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: bold;
  border: 2px solid white;
  z-index: 2;
}

.selection-icon {
  position: absolute;
  top: 8px;
  left: 8px;
  background: #27ae60;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* 响应式适配 */
@media (max-width: 768px) {
  .all-chips-grid {
    grid-template-columns: repeat(auto-fill, minmax(75px, 1fr));
    gap: 10px;
    max-height: 350px;
  }
  
  .chip-card-image {
    width: 36px;
    height: 36px;
  }
  
  .chip-card-inner {
    padding: 10px 6px;
  }
}

@media (max-width: 375px) {
  .chip-list {
    gap: 4px;
  }
  
  .chip-image {
    width: 38px;
    height: 38px;
  }
  
  .all-chips-grid {
    grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
    gap: 8px;
    max-height: 300px;
  }
  
  .chip-card-image {
    width: 32px;
    height: 32px;
  }
  
  .chip-card-label {
    font-size: 11px;
  }
}

@media (max-width: 320px) {
  .all-chips-grid {
    grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
    gap: 6px;
    max-height: 280px;
  }
  
  .chip-card-image {
    width: 28px;
    height: 28px;
  }
  
  .chip-card-inner {
    padding: 8px 4px;
  }
  
  .chip-card-label {
    font-size: 10px;
  }
}

/* 横屏适配 */
@media (orientation: landscape) and (max-height: 500px) {
  .all-chips-grid {
    max-height: 250px;
    grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
  }
}

/* 滚动条样式 */
.all-chips-grid::-webkit-scrollbar {
  width: 6px;
}

.all-chips-grid::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.all-chips-grid::-webkit-scrollbar-thumb {
  background: rgba(255, 215, 0, 0.3);
  border-radius: 3px;
}

.all-chips-grid::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 215, 0, 0.5);
}

/* Naive UI 深色主题适配 */
:deep(.n-card) {
  background-color: rgba(40, 40, 40, 0.95) !important;
  backdrop-filter: blur(10px);
}

:deep(.n-card .n-card-header) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

:deep(.n-card .n-card-footer) {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

:deep(.n-modal-mask) {
  backdrop-filter: blur(4px);
}
</style>