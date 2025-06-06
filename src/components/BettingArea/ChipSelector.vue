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

    <!-- 筹码设置弹窗 -->
    <div v-if="showSettings" class="settings-overlay" @click="closeSettings">
      <div class="settings-dialog" @click.stop>
        <div class="settings-header">
          <h3 class="settings-title">筹码设置</h3>
          <button class="close-btn" @click="closeSettings">×</button>
        </div>
        
        <div class="settings-content">
          <div class="settings-section">
            <h4 class="section-title">选择常用筹码（最多5个）</h4>
            <div class="current-selection">
              <div class="selection-info">
                已选择 {{ tempFavorites.length }} / 5
              </div>
              <button 
                class="reset-btn" 
                @click="resetToDefault"
                :disabled="isDefaultSelection"
              >
                恢复默认
              </button>
            </div>
          </div>
          
          <div class="all-chips-grid">
            <button
              v-for="chip in allChips"
              :key="chip.value"
              class="all-chip-btn"
              :class="{ 
                'selected': tempFavorites.includes(chip.value),
                'disabled': !tempFavorites.includes(chip.value) && tempFavorites.length >= 5
              }"
              @click="toggleChipSelection(chip.value)"
            >
              <img 
                :src="getChipImage(chip.value, 'all')" 
                :alt="chip.label"
                class="all-chip-image"
              />
              <div class="all-chip-label">{{ chip.label }}</div>
              <div v-if="tempFavorites.includes(chip.value)" class="selection-badge">
                {{ tempFavorites.indexOf(chip.value) + 1 }}
              </div>
            </button>
          </div>
        </div>
        
        <div class="settings-actions">
          <button class="action-btn cancel-btn" @click="cancelSettings">
            取消
          </button>
          <button 
            class="action-btn save-btn" 
            @click="saveSettings"
            :disabled="tempFavorites.length === 0"
          >
            保存设置
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

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

// 筹码配置接口
interface ChipConfig {
  value: number
  label: string
  filename: string // 文件名前缀，如 '1K', '5M' 等
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

// 默认常用筹码（前5个）
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
  return JSON.stringify(tempFavorites.value.sort()) === JSON.stringify(defaultFavorites.sort())
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
  // 阻止页面滚动
  document.body.style.overflow = 'hidden'
}

const closeSettings = (): void => {
  showSettings.value = false
  tempFavorites.value = []
  // 恢复页面滚动
  document.body.style.overflow = ''
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
    }
  }
}

const resetToDefault = (): void => {
  tempFavorites.value = [...defaultFavorites]
}

const cancelSettings = (): void => {
  closeSettings()
}

const saveSettings = (): void => {
  if (tempFavorites.value.length === 0) return
  
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
  
  closeSettings()
}

const saveToLocalStorage = (): void => {
  try {
    localStorage.setItem('sicbo_favorite_chips', JSON.stringify(favoriteChipValues.value))
  } catch (error) {
    console.warn('Failed to save chip settings:', error)
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
  background: rgba(0, 0, 0, 0.95); /* 统一背景色 */
  border-top: 1px solid #2d5a42;
  padding: 8px; /* 从12px减少到8px */
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
  gap: 6px; /* 从8px减少到6px */
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
  padding: 3px; /* 从4px减少到3px */
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
  width: 42px; /* 从48px减少到42px */
  height: 42px; /* 从48px减少到42px */
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

/* 移除文字标签 - 删除 .chip-label 相关样式 */

/* 设置弹窗 - 调整为垂直居中 */
.settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center; /* 垂直居中 */
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.settings-dialog {
  background: #2c3e50;
  border-radius: 16px;
  border: 1px solid #34495e;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  animation: dialogAppear 0.3s ease;
}

@keyframes dialogAppear {
  0% {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #34495e;
}

.settings-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #ecf0f1;
}

.close-btn {
  background: none;
  border: none;
  color: #bdc3c7;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.settings-content {
  flex: 1;
  padding: 20px 24px;
  overflow-y: auto;
}

.settings-section {
  margin-bottom: 20px;
}

.section-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #ecf0f1;
}

.current-selection {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(0, 0, 0, 0.2);
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.selection-info {
  color: #bdc3c7;
  font-size: 12px;
}

.reset-btn {
  background: #3498db;
  border: none;
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
}

.reset-btn:hover:not(:disabled) {
  background: #2980b9;
}

.reset-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 所有筹码网格 */
.all-chips-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
  padding: 8px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

.all-chip-btn {
  position: relative;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid transparent;
  cursor: pointer;
  padding: 8px;
  border-radius: 12px;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.all-chip-btn:hover:not(.disabled) {
  background: rgba(255, 255, 255, 0.1);
  border-color: #3498db;
}

.all-chip-btn.selected {
  background: rgba(52, 152, 219, 0.2);
  border-color: #3498db;
  box-shadow: 0 0 12px rgba(52, 152, 219, 0.3);
}

.all-chip-btn.disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.all-chip-image {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.all-chip-label {
  color: #ecf0f1;
  font-size: 10px;
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
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: bold;
  border: 2px solid white;
}

/* 设置操作按钮 */
.settings-actions {
  padding: 16px 24px;
  border-top: 1px solid #34495e;
  display: flex;
  gap: 12px;
}

.action-btn {
  flex: 1;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.cancel-btn {
  background: #7f8c8d;
  color: white;
}

.cancel-btn:hover {
  background: #95a5a6;
}

.save-btn {
  background: #27ae60;
  color: white;
}

.save-btn:hover:not(:disabled) {
  background: #229954;
}

.save-btn:disabled {
  background: #7f8c8d;
  cursor: not-allowed;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .settings-dialog {
    max-width: 90vw;
    max-height: 90vh;
  }
  
  .all-chips-grid {
    grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
    gap: 8px;
  }
  
  .all-chip-image {
    width: 36px;
    height: 36px;
  }
}

@media (max-width: 375px) {
  .chip-list {
    gap: 4px; /* 从6px减少到4px */
  }
  
  .chip-image {
    width: 38px; /* 从42px减少到38px */
    height: 38px; /* 从42px减少到38px */
  }
  
  .settings-header,
  .settings-content,
  .settings-actions {
    padding-left: 16px;
    padding-right: 16px;
  }
  
  .all-chips-grid {
    grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
    gap: 6px;
  }
}

/* 横屏适配 */
@media (orientation: landscape) and (max-height: 500px) {
  .chip-image {
    width: 36px;
    height: 36px;
  }
  
  .settings-dialog {
    max-height: 95vh;
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
</style>