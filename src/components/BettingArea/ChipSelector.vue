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

    <!-- 使用 Naive UI Modal - 游戏风格 -->
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
      class="game-modal"
    >
      <template #header>
        <div class="modal-header">
          <n-icon size="24" color="#ffd700">
            <SettingsIcon />
          </n-icon>
          <span class="modal-title">筹码设置</span>
        </div>
      </template>

      <div class="settings-content">
        <!-- 当前选择信息 -->
        <div class="current-selection">
          <n-space justify="space-between" align="center">
            <div class="selection-info">
              <n-icon size="18" color="#00bcd4">
                <CheckIcon />
              </n-icon>
              <n-text class="selection-text">
                已选择 <span class="count-highlight">{{ tempFavorites.length }}</span> / 5 个常用筹码
              </n-text>
            </div>
            <n-button 
              size="small"
              type="primary"
              ghost
              @click="resetToDefault"
              :disabled="isDefaultSelection"
              class="reset-btn"
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
          <div class="section-header">
            <n-icon size="16" color="#ffd700">
              <CasinoIcon />
            </n-icon>
            <n-text class="section-title">
              点击选择常用筹码（最多5个）
            </n-text>
          </div>
          
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
                  <n-icon size="14" color="#fff">
                    <CheckIcon />
                  </n-icon>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <n-space justify="end" size="medium">
          <n-button 
            @click="cancelSettings"
            class="cancel-btn"
          >
            <template #icon>
              <n-icon><CloseIcon /></n-icon>
            </template>
            取消
          </n-button>
          <n-button 
            type="primary"
            @click="saveSettings"
            :disabled="tempFavorites.length === 0"
            class="save-btn"
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
  Save as SaveIcon,
  Close as CloseIcon,
  LogoUsd as CasinoIcon
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

/* Modal Header */
.modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 0;
}

.modal-title {
  font-size: 20px;
  font-weight: 700;
  color: #ffd700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.settings-content {
  padding: 8px 0;
}

/* 当前选择信息 */
.current-selection {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(0, 188, 212, 0.1));
  border: 2px solid rgba(255, 215, 0, 0.3);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
  backdrop-filter: blur(5px);
}

.selection-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.selection-text {
  color: rgba(255, 255, 255, 0.95);
  font-size: 14px;
  font-weight: 500;
}

.count-highlight {
  color: #00bcd4;
  font-weight: 700;
  font-size: 16px;
}

.reset-btn {
  background: linear-gradient(135deg, rgba(255, 152, 0, 0.2), rgba(255, 193, 7, 0.1)) !important;
  border: 1px solid rgba(255, 152, 0, 0.4) !important;
  color: #ff9800 !important;
}

/* 筹码选择区域 */
.chips-section {
  margin-bottom: 8px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 215, 0, 0.2);
}

.section-title {
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  font-weight: 600;
}

/* 筹码选择网格 */
.all-chips-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(85px, 1fr));
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
  padding: 12px;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.3), rgba(13, 40, 24, 0.2));
  border-radius: 12px;
  border: 1px solid rgba(45, 90, 66, 0.3);
  backdrop-filter: blur(5px);
}

.chip-card {
  position: relative;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  border-radius: 16px;
  overflow: hidden;
}

.chip-card:hover:not(.disabled) {
  transform: translateY(-3px) scale(1.02);
}

.chip-card.selected {
  transform: translateY(-3px) scale(1.05);
}

.chip-card.disabled {
  opacity: 0.3;
  cursor: not-allowed;
  filter: grayscale(50%);
}

.chip-card-inner {
  position: relative;
  background: linear-gradient(135deg, rgba(45, 90, 66, 0.4), rgba(0, 0, 0, 0.3));
  border: 2px solid rgba(74, 159, 110, 0.3);
  padding: 14px 10px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  backdrop-filter: blur(3px);
}

.chip-card:hover:not(.disabled) .chip-card-inner {
  background: linear-gradient(135deg, rgba(74, 159, 110, 0.4), rgba(45, 90, 66, 0.3));
  border-color: rgba(255, 215, 0, 0.5);
  box-shadow: 0 4px 16px rgba(255, 215, 0, 0.2);
}

.chip-card.selected .chip-card-inner {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.25), rgba(255, 193, 7, 0.15));
  border-color: #ffd700;
  box-shadow: 0 6px 20px rgba(255, 215, 0, 0.4);
}

.chip-card-image {
  width: 44px;
  height: 44px;
  object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  transition: all 0.3s ease;
}

.chip-card.selected .chip-card-image {
  filter: drop-shadow(0 4px 8px rgba(255, 215, 0, 0.4));
}

.chip-card-label {
  font-size: 12px;
  font-weight: 700;
  text-align: center;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.chip-card.selected .chip-card-label {
  color: #ffd700;
}

.selection-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  border: 2px solid white;
  box-shadow: 0 2px 6px rgba(231, 76, 60, 0.4);
  z-index: 2;
}

.selection-icon {
  position: absolute;
  top: 8px;
  left: 8px;
  background: linear-gradient(135deg, #27ae60, #229954);
  border-radius: 50%;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(39, 174, 96, 0.4);
  border: 2px solid rgba(255, 255, 255, 0.9);
}

/* 按钮样式 */
.cancel-btn {
  background: linear-gradient(135deg, #6c757d, #495057) !important;
  border: 2px solid #6c757d !important;
  color: white !important;
}

.save-btn {
  background: linear-gradient(135deg, #27ae60, #229954) !important;
  border: 2px solid #4a9f6e !important;
  box-shadow: 0 3px 8px rgba(39, 174, 96, 0.3);
}

/* 响应式适配 */
@media (max-width: 768px) {
  .all-chips-grid {
    grid-template-columns: repeat(auto-fill, minmax(75px, 1fr));
    gap: 10px;
    max-height: 350px;
    padding: 10px;
  }
  
  .chip-card-image {
    width: 40px;
    height: 40px;
  }
  
  .chip-card-inner {
    padding: 12px 8px;
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
    width: 36px;
    height: 36px;
  }
  
  .chip-card-label {
    font-size: 11px;
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
  width: 8px;
}

.all-chips-grid::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.all-chips-grid::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.4), rgba(255, 193, 7, 0.3));
  border-radius: 4px;
  border: 1px solid rgba(255, 215, 0, 0.2);
}

.all-chips-grid::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.6), rgba(255, 193, 7, 0.5));
}

/* Naive UI 游戏风格主题适配 - 强制覆盖 */
:deep(.n-modal .n-card) {
  background: linear-gradient(135deg, rgba(13, 40, 24, 0.98), rgba(0, 0, 0, 0.95)) !important;
  border: 2px solid #2d5a42 !important;
  border-radius: 16px !important;
  backdrop-filter: blur(12px) !important;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7) !important;
}

:deep(.n-modal .n-card .n-card-header) {
  background: linear-gradient(135deg, rgba(45, 90, 66, 0.4), rgba(0, 0, 0, 0.3)) !important;
  border-bottom: 2px solid rgba(255, 215, 0, 0.4) !important;
  border-radius: 16px 16px 0 0 !important;
  padding: 20px 24px !important;
}

:deep(.n-modal .n-card .n-card-header__main) {
  color: #ffd700 !important;
  font-weight: 700 !important;
  font-size: 18px !important;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8) !important;
}

:deep(.n-modal .n-card .n-card__content) {
  background: transparent !important;
  color: rgba(255, 255, 255, 0.95) !important;
  padding: 20px 24px !important;
}

:deep(.n-modal .n-card .n-card-footer) {
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.4), rgba(13, 40, 24, 0.3)) !important;
  border-top: 1px solid rgba(255, 215, 0, 0.3) !important;
  padding: 16px 24px !important;
  border-radius: 0 0 16px 16px !important;
}

:deep(.n-modal-mask) {
  background-color: rgba(0, 0, 0, 0.85) !important;
  backdrop-filter: blur(8px) !important;
}

:deep(.n-button--primary-type) {
  background: linear-gradient(135deg, #27ae60, #229954) !important;
  border: 2px solid #4a9f6e !important;
  color: white !important;
  font-weight: 600 !important;
  border-radius: 8px !important;
  box-shadow: 0 3px 8px rgba(39, 174, 96, 0.3) !important;
  transition: all 0.3s ease !important;
}

:deep(.n-button--primary-type:hover) {
  background: linear-gradient(135deg, #2ecc71, #27ae60) !important;
  border-color: #5bb77c !important;
  box-shadow: 0 4px 12px rgba(39, 174, 96, 0.5) !important;
  transform: translateY(-1px) !important;
}

:deep(.n-button--default-type) {
  background: linear-gradient(135deg, #6c757d, #495057) !important;
  border: 2px solid #6c757d !important;
  color: white !important;
  font-weight: 600 !important;
  border-radius: 8px !important;
}

:deep(.n-button--default-type:hover) {
  background: linear-gradient(135deg, #7a8088, #5a6268) !important;
  border-color: #7a8088 !important;
  transform: translateY(-1px) !important;
}

:deep(.n-text) {
  color: rgba(255, 255, 255, 0.9) !important;
}

:deep(.n-icon) {
  transition: all 0.3s ease !important;
}

/* 消息提示样式优化 */
:deep(.n-message-provider .n-message) {
  background: linear-gradient(135deg, rgba(13, 40, 24, 0.95), rgba(0, 0, 0, 0.9)) !important;
  border: 1px solid #2d5a42 !important;
  color: white !important;
  backdrop-filter: blur(8px) !important;
  border-radius: 8px !important;
}

/* 确保遮罩层样式正确应用 */
:deep(.n-modal-container) {
  backdrop-filter: blur(8px) !important;
}

/* 强制覆盖卡片内部元素的样式 */
:deep(.n-modal .n-card *) {
  color: inherit;
}
</style>