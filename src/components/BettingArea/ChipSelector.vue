<template>
  <div class="chip-selector">
    <!-- Naive UI 配置提供者 - 应用游戏主题 -->
    <n-config-provider :theme-overrides="gameTheme">
      <!-- 筹码选择容器 -->
      <n-space justify="center" align="center" class="chip-container">
        <!-- 筹码选择按钮组 -->
        <n-space :size="8" align="center" class="chip-list">
          <!-- 常用筹码按钮 -->
          <n-tooltip
            v-for="chip in favoriteChips"
            :key="chip.value"
            :delay="800"
            placement="top"
            trigger="hover"
          >
            <template #trigger>
              <n-button
                :type="selectedChip === chip.value ? 'primary' : 'default'"
                size="large"
                circle
                @click="selectChip(chip.value)"
                class="chip-btn"
                :class="{ 'active-chip': selectedChip === chip.value }"
              >
                <template #icon>
                  <div class="chip-content">
                    <img 
                      :src="getChipImage(chip.value, 'selected')" 
                      :alt="chip.label"
                      class="chip-image"
                    />
                  </div>
                </template>
              </n-button>
            </template>
            <span class="chip-tooltip">
              <n-text strong>{{ chip.label }}</n-text>
              <n-divider vertical />
              <n-text depth="2">点击选择</n-text>
            </span>
          </n-tooltip>
          
          <!-- 设置按钮 -->
          <n-tooltip placement="top" trigger="hover" :delay="500">
            <template #trigger>
              <n-button
                type="tertiary"
                size="large"
                circle
                @click="openSettings"
                class="settings-btn"
              >
                <template #icon>
                  <n-icon size="20" class="settings-icon">
                    <SettingsIcon />
                  </n-icon>
                </template>
              </n-button>
            </template>
            <span>筹码设置</span>
          </n-tooltip>
        </n-space>
      </n-space>

      <!-- 设置弹窗 -->
      <n-modal 
        v-model:show="showSettings" 
        preset="card"
        :style="{ width: 'min(90vw, 650px)' }"
        title="筹码配置中心"
        size="huge"
        :bordered="false"
        :segmented="false"
        :close-on-esc="true"
        :mask-closable="true"
        :auto-focus="false"
        transform-origin="center"
        class="settings-modal"
      >
        <template #header>
          <n-space align="center" :size="12">
            <n-avatar 
              :size="32"
              color="transparent"
              style="background: linear-gradient(135deg, #ffd700, #ffed4e)"
            >
              <n-icon size="18" color="#333">
                <CasinoIcon />
              </n-icon>
            </n-avatar>
            <div class="modal-header-content">
              <n-h3 class="modal-title">筹码配置中心</n-h3>
              <n-text depth="2" class="modal-subtitle">
                自定义您的常用筹码设置
              </n-text>
            </div>
          </n-space>
        </template>

        <n-scrollbar style="max-height: 70vh;">
          <div class="settings-content">
            <!-- 当前配置卡片 -->
            <n-card 
              class="current-config-card"
              :bordered="false"
              size="small"
            >
              <template #header>
                <n-space align="center" :size="8">
                  <n-icon size="16" color="#00bcd4">
                    <CheckIcon />
                  </n-icon>
                  <n-text strong>当前配置</n-text>
                </n-space>
              </template>
              
              <n-space justify="space-between" align="center">
                <n-statistic 
                  label="已选择筹码" 
                  :value="tempFavorites.length"
                  :value-style="{ color: '#00bcd4', fontSize: '20px', fontWeight: 'bold' }"
                >
                  <template #suffix>
                    <n-text depth="2">/ 5</n-text>
                  </template>
                </n-statistic>
                
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
              
              <!-- 进度条 -->
              <n-progress 
                type="line" 
                :percentage="(tempFavorites.length / 5) * 100"
                :height="6"
                :border-radius="3"
                color="#00bcd4"
                rail-color="rgba(255, 255, 255, 0.1)"
                class="selection-progress"
              />
            </n-card>

            <!-- 快速预设 -->
            <n-card 
              class="presets-card"
              :bordered="false"
              size="small"
            >
              <template #header>
                <n-space align="center" :size="8">
                  <n-icon size="16" color="#ffd700">
                    <FlashIcon />
                  </n-icon>
                  <n-text strong>快速预设</n-text>
                </n-space>
              </template>
              
              <n-space :size="8">
                <n-button
                  v-for="preset in chipPresets"
                  :key="preset.id"
                  size="small"
                  type="tertiary"
                  @click="applyPreset(preset.chips)"
                  class="preset-btn"
                >
                  <template #icon>
                    <n-icon size="14">
                      <component :is="preset.icon" />
                    </n-icon>
                  </template>
                  {{ preset.name }}
                </n-button>
              </n-space>
            </n-card>

            <!-- 筹码选择区域 -->
            <n-card 
              class="chips-selection-card"
              :bordered="false"
              size="small"
            >
              <template #header>
                <n-space align="center" justify="space-between">
                  <n-space align="center" :size="8">
                    <n-icon size="16" color="#ffd700">
                      <GridIcon />
                    </n-icon>
                    <n-text strong>选择筹码</n-text>
                  </n-space>
                  <n-tag 
                    type="info" 
                    size="small"
                    :bordered="false"
                    class="instruction-tag"
                  >
                    点击选择，最多5个
                  </n-tag>
                </n-space>
              </template>
              
              <!-- 筹码网格 -->
              <div class="chips-grid">
                <n-tooltip
                  v-for="chip in allChips"
                  :key="chip.value"
                  :delay="600"
                  placement="top"
                  :disabled="tempFavorites.includes(chip.value)"
                >
                  <template #trigger>
                    <div
                      class="chip-item"
                      :class="{ 
                        'selected': tempFavorites.includes(chip.value),
                        'disabled': !tempFavorites.includes(chip.value) && tempFavorites.length >= 5
                      }"
                      @click="toggleChipSelection(chip.value)"
                    >
                      <!-- 筹码图像 -->
                      <div class="chip-item-image">
                        <img 
                          :src="getChipImage(chip.value, 'all')" 
                          :alt="chip.label"
                          class="chip-img"
                        />
                        
                        <!-- 选中覆盖层 -->
                        <div 
                          v-if="tempFavorites.includes(chip.value)"
                          class="selection-overlay"
                        >
                          <n-icon size="20" color="#fff">
                            <CheckIcon />
                          </n-icon>
                        </div>
                        
                        <!-- 选中序号 -->
                        <n-badge
                          v-if="tempFavorites.includes(chip.value)"
                          :value="tempFavorites.indexOf(chip.value) + 1"
                          :max="5"
                          class="selection-order"
                          color="#e74c3c"
                        />
                      </div>
                      
                      <!-- 筹码标签 -->
                      <n-text 
                        class="chip-label"
                        :type="tempFavorites.includes(chip.value) ? 'success' : 'default'"
                        strong
                      >
                        {{ chip.label }}
                      </n-text>
                    </div>
                  </template>
                  <span>点击{{ tempFavorites.includes(chip.value) ? '取消' : '选择' }}此筹码</span>
                </n-tooltip>
              </div>
            </n-card>
          </div>
        </n-scrollbar>

        <template #action>
          <n-space justify="end" :size="12">
            <n-button @click="cancelSettings" class="cancel-btn">
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
              <n-space align="center" :size="8">
                <span>保存设置</span>
                <n-badge 
                  v-if="tempFavorites.length > 0"
                  :value="tempFavorites.length"
                  :max="5"
                  class="save-badge"
                />
              </n-space>
            </n-button>
          </n-space>
        </template>
      </n-modal>
    </n-config-provider>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { 
  NConfigProvider,
  NSpace,
  NButton,
  NIcon,
  NTooltip,
  NModal,
  NCard,
  NScrollbar,
  NH3,
  NText,
  NDivider,
  NAvatar,
  NStatistic,
  NProgress,
  NTag,
  NBadge,
  useMessage 
} from 'naive-ui'
import {
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  Checkmark as CheckIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  LogoUsd as CasinoIcon,
  Flash as FlashIcon,
  Grid as GridIcon,
  TrendingUp as TrendingUpIcon,
  Star as StarIcon,
  Diamond as DiamondIcon,
  Trophy as TrophyIcon
} from '@vicons/ionicons5'

// 游戏主题配置
const gameTheme = {
  common: {
    primaryColor: '#27ae60',
    primaryColorHover: '#2ecc71',
    primaryColorPressed: '#229954',
    
    baseColor: 'rgba(13, 40, 24, 0.95)',
    modalColor: 'rgba(0, 0, 0, 0.95)',
    cardColor: 'rgba(45, 90, 66, 0.4)',
    
    textColorBase: '#ffffff',
    textColor1: 'rgba(255, 255, 255, 0.95)',
    textColor2: 'rgba(255, 255, 255, 0.82)',
    textColor3: 'rgba(255, 255, 255, 0.65)',
    
    borderRadius: '8px',
    borderColor: 'rgba(255, 215, 0, 0.3)',
    
    boxShadow1: '0 2px 8px rgba(0, 0, 0, 0.3)',
    boxShadow2: '0 4px 16px rgba(0, 0, 0, 0.4)',
    boxShadow3: '0 8px 32px rgba(0, 0, 0, 0.5)',
  },
  Button: {
    textColor: '#ffffff',
    textColorHover: '#ffffff',
    textColorPressed: '#ffffff',
    textColorFocus: '#ffffff',
    
    colorPrimary: '#27ae60',
    colorPrimaryHover: '#2ecc71',
    colorPrimaryPressed: '#229954',
    
    colorTertiary: 'rgba(255, 255, 255, 0.1)',
    colorTertiaryHover: 'rgba(255, 255, 255, 0.2)',
    colorTertiaryPressed: 'rgba(255, 255, 255, 0.15)',
    
    fontWeight: '600',
    borderRadius: '50%',
    
    paddingRoundLarge: '0',
    widthLarge: '48px',
    heightLarge: '48px',
  },
  Card: {
    color: 'rgba(45, 90, 66, 0.6)',
    borderColor: 'rgba(255, 215, 0, 0.2)',
    titleTextColor: '#ffd700',
    textColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: '12px',
    paddingMedium: '16px',
  },
  Modal: {
    color: 'rgba(13, 40, 24, 0.98)',
    textColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  Scrollbar: {
    color: 'rgba(255, 215, 0, 0.3)',
    colorHover: 'rgba(255, 215, 0, 0.5)',
  },
  Badge: {
    color: '#e74c3c',
    textColor: '#ffffff',
    fontWeight: '700',
  },
  Progress: {
    railColor: 'rgba(255, 255, 255, 0.1)',
    fillColor: '#00bcd4',
  }
}

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

// 预设方案
const chipPresets = [
  {
    id: 'beginner',
    name: '新手',
    icon: StarIcon,
    chips: [1, 10, 100, 1000, 10000]
  },
  {
    id: 'standard',
    name: '标准',
    icon: TrendingUpIcon,
    chips: [10, 50, 100, 500, 1000]
  },
  {
    id: 'high',
    name: '高额',
    icon: DiamondIcon,
    chips: [1000, 5000, 10000, 50000, 100000]
  },
  {
    id: 'vip',
    name: 'VIP',
    icon: TrophyIcon,
    chips: [10000, 50000, 100000, 500000, 1000000]
  }
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
  
  // 显示选择反馈
  message.info(`已选择 ${allChips.find(c => c.value === value)?.label} 筹码`)
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

const applyPreset = (chips: number[]): void => {
  tempFavorites.value = [...chips]
  
  const presetName = chipPresets.find(p => 
    JSON.stringify(p.chips.sort()) === JSON.stringify(chips.sort())
  )?.name || '自定义'
  
  message.success(`已应用 ${presetName} 预设`)
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
  
  message.success('筹码设置已保存！')
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
  padding: 12px;
  backdrop-filter: blur(10px);
}

.chip-container {
  width: 100%;
}

.chip-list {
  width: 100%;
  max-width: 400px;
}

/* 筹码按钮样式 */
.chip-btn {
  position: relative;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.chip-btn:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 4px 16px rgba(255, 215, 0, 0.3);
}

.chip-btn.active-chip {
  transform: translateY(-3px) scale(1.1);
  box-shadow: 0 6px 20px rgba(255, 215, 0, 0.5);
}

.chip-content {
  position: relative;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chip-image {
  width: 38px;
  height: 38px;
  object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  transition: all 0.3s ease;
}

.chip-btn.active-chip .chip-image {
  filter: drop-shadow(0 4px 8px rgba(255, 215, 0, 0.6));
}

/* 设置按钮 */
.settings-btn {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.settings-btn:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 4px 16px rgba(255, 215, 0, 0.2);
}

.settings-icon {
  transition: transform 0.3s ease;
}

.settings-btn:hover .settings-icon {
  transform: rotate(90deg);
}

/* 工具提示样式 */
.chip-tooltip {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

/* 模态框标题 */
.modal-header-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.modal-title {
  margin: 0;
  color: #ffd700;
  font-size: 18px;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.modal-subtitle {
  font-size: 12px;
  opacity: 0.8;
}

/* 设置内容 */
.settings-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px 0;
}

/* 当前配置卡片 */
.current-config-card {
  background: linear-gradient(135deg, rgba(0, 188, 212, 0.15), rgba(0, 150, 136, 0.1)) !important;
  border: 2px solid rgba(0, 188, 212, 0.3) !important;
}

.selection-progress {
  margin-top: 12px;
}

/* 预设卡片 */
.presets-card {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 193, 7, 0.1)) !important;
  border: 2px solid rgba(255, 215, 0, 0.3) !important;
}

.preset-btn {
  border-radius: 6px !important;
  font-size: 12px;
  height: 32px;
  background: rgba(255, 255, 255, 0.1) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  transition: all 0.3s ease;
}

.preset-btn:hover {
  background: rgba(255, 215, 0, 0.2) !important;
  border-color: rgba(255, 215, 0, 0.4) !important;
  transform: translateY(-1px);
}

/* 筹码选择卡片 */
.chips-selection-card {
  background: linear-gradient(135deg, rgba(45, 90, 66, 0.6), rgba(13, 40, 24, 0.4)) !important;
  border: 2px solid rgba(255, 215, 0, 0.2) !important;
}

.instruction-tag {
  background: rgba(255, 215, 0, 0.2) !important;
  border: 1px solid rgba(255, 215, 0, 0.4) !important;
  color: #ffd700 !important;
}

/* 筹码网格 */
.chips-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 12px;
  padding: 8px 0;
}

.chip-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 8px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  user-select: none;
}

.chip-item:hover:not(.disabled) {
  transform: translateY(-3px) scale(1.02);
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 193, 7, 0.05));
  border-color: rgba(255, 215, 0, 0.3);
  box-shadow: 0 4px 16px rgba(255, 215, 0, 0.2);
}

.chip-item.selected {
  background: linear-gradient(135deg, rgba(39, 174, 96, 0.2), rgba(46, 204, 113, 0.1));
  border-color: #27ae60;
  box-shadow: 0 6px 20px rgba(39, 174, 96, 0.3);
  transform: translateY(-3px) scale(1.05);
}

.chip-item.disabled {
  opacity: 0.3;
  cursor: not-allowed;
  filter: grayscale(50%);
}

.chip-item-image {
  position: relative;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chip-img {
  width: 42px;
  height: 42px;
  object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  transition: all 0.3s ease;
}

.chip-item.selected .chip-img {
  filter: drop-shadow(0 4px 8px rgba(39, 174, 96, 0.4));
}

.selection-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(39, 174, 96, 0.8);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: selectionAppear 0.3s ease;
}

@keyframes selectionAppear {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.selection-order {
  position: absolute;
  top: -6px;
  right: -6px;
  z-index: 2;
}

.chip-label {
  font-size: 12px;
  font-weight: 700;
  text-align: center;
  transition: all 0.3s ease;
}

/* 按钮样式 */
.reset-btn {
  font-size: 12px;
  height: 32px;
}

.cancel-btn,
.save-btn {
  font-size: 14px;
  height: 40px;
  border-radius: 8px !important;
  font-weight: 600;
}

.save-btn {
  position: relative;
}

.save-badge {
  margin-left: 8px;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .chips-grid {
    grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
    gap: 10px;
  }
  
  .chip-item {
    padding: 10px 6px;
  }
  
  .chip-item-image {
    width: 40px;
    height: 40px;
  }
  
  .chip-img {
    width: 38px;
    height: 38px;
  }
}

@media (max-width: 480px) {
  .chip-selector {
    padding: 8px;
  }
  
  .chip-content {
    width: 36px;
    height: 36px;
  }
  
  .chip-image {
    width: 34px;
    height: 34px;
  }
  
  .chips-grid {
    grid-template-columns: repeat(auto-fill, minmax(65px, 1fr));
    gap: 8px;
  }
  
  .chip-item {
    padding: 8px 4px;
  }
  
  .chip-label {
    font-size: 11px;
  }
}

/* 横屏适配 */
@media (orientation: landscape) and (max-height: 500px) {
  .settings-content {
    gap: 12px;
  }
  
  .chips-grid {
    grid-template-columns: repeat(auto-fill, minmax(65px, 1fr));
    gap: 8px;
  }
}

/* 深度样式覆盖 */
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
  padding: 20px 24px !important;
}

:deep(.n-modal .n-card .n-card__content) {
  background: transparent !important;
  color: rgba(255, 255, 255, 0.95) !important;
  padding: 16px 24px !important;
}

:deep(.n-modal .n-card .n-card__action) {
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.4), rgba(13, 40, 24, 0.3)) !important;
  border-top: 1px solid rgba(255, 215, 0, 0.3) !important;
  padding: 16px 24px !important;
}

:deep(.n-button--primary-type) {
  background: linear-gradient(135deg, #27ae60, #229954) !important;
  border: 2px solid #4a9f6e !important;
  color: white !important;
  font-weight: 600 !important;
  box-shadow: 0 3px 8px rgba(39, 174, 96, 0.3) !important;
}

:deep(.n-button--primary-type:hover) {
  background: linear-gradient(135deg, #2ecc71, #27ae60) !important;
  border-color: #5bb77c !important;
  box-shadow: 0 4px 12px rgba(39, 174, 96, 0.5) !important;
  transform: translateY(-1px) !important;
}

:deep(.n-button--tertiary-type) {
  background: rgba(255, 255, 255, 0.1) !important;
  border: 2px solid rgba(255, 255, 255, 0.2) !important;
  color: white !important;
}

:deep(.n-card) {
  background: rgba(45, 90, 66, 0.6) !important;
  border: 2px solid rgba(255, 215, 0, 0.2) !important;
  border-radius: 12px !important;
  backdrop-filter: blur(5px) !important;
}

:deep(.n-card .n-card-header__main) {
  color: #ffd700 !important;
  font-weight: 600 !important;
}

:deep(.n-scrollbar-rail--vertical) {
  right: 4px !important;
}

:deep(.n-scrollbar-rail__scrollbar) {
  background: rgba(255, 215, 0, 0.3) !important;
  border-radius: 4px !important;
}

:deep(.n-scrollbar-rail__scrollbar:hover) {
  background: rgba(255, 215, 0, 0.5) !important;
}

:deep(.n-statistic .n-statistic-value) {
  color: #00bcd4 !important;
  font-weight: 700 !important;
}

:deep(.n-progress .n-progress-graph .n-progress-graph-line-fill) {
  background: linear-gradient(90deg, #00bcd4, #00acc1) !important;
}

:deep(.n-badge-sup) {
  background: #e74c3c !important;
  color: white !important;
  font-weight: 700 !important;
  border: 1px solid white !important;
}

/* 消息提示样式 */
:deep(.n-message) {
  background: linear-gradient(135deg, rgba(13, 40, 24, 0.95), rgba(0, 0, 0, 0.9)) !important;
  border: 1px solid #2d5a42 !important;
  color: white !important;
  backdrop-filter: blur(8px) !important;
  border-radius: 8px !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5) !important;
}
</style>