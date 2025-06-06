import { ref, computed, reactive, watch } from 'vue'

// 筹码配置接口
export interface ChipConfig {
  value: number
  label: string
  filename: string
  color?: string
  enabled: boolean
}

// 筹码设置状态
export interface ChipSettings {
  favorites: number[]
  defaultChip: number
  autoSelectNext: boolean
  showLabels: boolean
  enableHapticFeedback: boolean
}

// 预设方案
export interface ChipPreset {
  id: string
  name: string
  description: string
  chips: number[]
}

export const useChipSettings = () => {
  // 所有可用筹码配置
  const allChips = ref<ChipConfig[]>([
    { value: 1, label: '1', filename: '01', enabled: true },
    { value: 5, label: '5', filename: '05', enabled: true },
    { value: 10, label: '10', filename: '10', enabled: true },
    { value: 50, label: '50', filename: '50', enabled: true },
    { value: 100, label: '100', filename: '100', enabled: true },
    { value: 500, label: '500', filename: '500', enabled: true },
    { value: 1000, label: '1K', filename: '1K', enabled: true },
    { value: 5000, label: '5K', filename: '5K', enabled: true },
    { value: 10000, label: '10K', filename: '10K', enabled: true },
    { value: 50000, label: '50K', filename: '50K', enabled: true },
    { value: 100000, label: '100K', filename: '100K', enabled: true },
    { value: 500000, label: '500K', filename: '500K', enabled: true },
    { value: 1000000, label: '1M', filename: '1M', enabled: true },
    { value: 5000000, label: '5M', filename: '5M', enabled: true },
    { value: 10000000, label: '10M', filename: '10M', enabled: true },
    { value: 20000000, label: '20M', filename: '20M', enabled: true },
    { value: 50000000, label: '50M', filename: '50M', enabled: true },
    { value: 100000000, label: '100M', filename: '100M', enabled: true },
    { value: 200000000, label: '200M', filename: '200M', enabled: true },
    { value: 500000000, label: '500M', filename: '500M', enabled: true },
    { value: 1000000000, label: '1000M', filename: '1000M', enabled: true }
  ])

  // 预设方案
  const presets = ref<ChipPreset[]>([
    {
      id: 'beginner',
      name: '新手推荐',
      description: '适合新手玩家',
      chips: [1, 10, 100, 1000, 10000]
    },
    {
      id: 'standard',
      name: '标准配置',
      description: '最常用的筹码组合',
      chips: [10, 50, 100, 500, 1000]
    },
    {
      id: 'high_roller',
      name: '高额玩家',
      description: '适合高额投注',
      chips: [1000, 5000, 10000, 50000, 100000]
    },
    {
      id: 'vip',
      name: 'VIP专享',
      description: '超高额投注配置',
      chips: [10000, 50000, 100000, 500000, 1000000]
    },
    {
      id: 'mega',
      name: '超级富豪',
      description: '顶级玩家专用',
      chips: [100000, 500000, 1000000, 5000000, 10000000]
    }
  ])

  // 默认设置
  const defaultSettings: ChipSettings = {
    favorites: [1, 10, 100, 1000, 10000],
    defaultChip: 10,
    autoSelectNext: false,
    showLabels: true,
    enableHapticFeedback: true
  }

  // 当前设置
  const settings = reactive<ChipSettings>({ ...defaultSettings })

  // 临时设置（用于设置界面）
  const tempSettings = reactive<ChipSettings>({ ...defaultSettings })

  // 计算属性
  const favoriteChips = computed(() => {
    return settings.favorites
      .map(value => allChips.value.find(chip => chip.value === value))
      .filter(chip => chip !== undefined) as ChipConfig[]
  })

  const enabledChips = computed(() => {
    return allChips.value.filter(chip => chip.enabled)
  })

  const availableChips = computed(() => {
    return enabledChips.value.filter(chip => !settings.favorites.includes(chip.value))
  })

  // 根据余额推荐筹码
  const getRecommendedChips = (balance: number): ChipConfig[] => {
    const maxChipValue = Math.floor(balance * 0.1) // 不超过余额的10%
    return enabledChips.value.filter(chip => chip.value <= maxChipValue)
  }

  // 获取筹码图片路径
  const getChipImagePath = (chip: ChipConfig, type: 'selected' | 'all'): string => {
    const prefix = type === 'selected' ? 'S_' : 'B_'
    return `/src/assets/images/chips/${prefix}${chip.filename}.png`
  }

  // 获取设置图标路径
  const getSettingsIconPath = (): string => {
    return '/src/assets/images/chips/chip.png'
  }

  // 应用预设
  const applyPreset = (presetId: string): boolean => {
    const preset = presets.value.find(p => p.id === presetId)
    if (!preset) return false

    // 验证预设中的筹码是否都可用
    const validChips = preset.chips.filter(value => 
      enabledChips.value.some(chip => chip.value === value)
    )

    if (validChips.length === 0) return false

    // 如果预设筹码少于5个，用默认值补齐
    const finalChips = [...validChips]
    if (finalChips.length < 5) {
      const defaultChips = defaultSettings.favorites.filter(value => 
        !finalChips.includes(value) && 
        enabledChips.value.some(chip => chip.value === value)
      )
      finalChips.push(...defaultChips.slice(0, 5 - finalChips.length))
    }

    settings.favorites = finalChips.slice(0, 5)
    
    // 确保默认筹码在常用筹码中
    if (!settings.favorites.includes(settings.defaultChip)) {
      settings.defaultChip = settings.favorites[0]
    }

    return true
  }

  // 创建自定义预设
  const createCustomPreset = (name: string, description: string, chips: number[]): string => {
    const id = `custom_${Date.now()}`
    const newPreset: ChipPreset = {
      id,
      name,
      description,
      chips: chips.slice(0, 5)
    }
    
    presets.value.push(newPreset)
    saveToLocalStorage()
    return id
  }

  // 删除自定义预设
  const deleteCustomPreset = (presetId: string): boolean => {
    if (!presetId.startsWith('custom_')) return false
    
    const index = presets.value.findIndex(p => p.id === presetId)
    if (index > -1) {
      presets.value.splice(index, 1)
      saveToLocalStorage()
      return true
    }
    return false
  }

  // 验证筹码设置
  const validateSettings = (newSettings: Partial<ChipSettings>): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []

    if (newSettings.favorites) {
      // 检查常用筹码数量
      if (newSettings.favorites.length === 0) {
        errors.push('至少需要选择一个常用筹码')
      } else if (newSettings.favorites.length > 5) {
        errors.push('常用筹码最多只能选择5个')
      }

      // 检查筹码是否可用
      const invalidChips = newSettings.favorites.filter(value =>
        !enabledChips.value.some(chip => chip.value === value)
      )
      if (invalidChips.length > 0) {
        errors.push(`以下筹码不可用: ${invalidChips.join(', ')}`)
      }
    }

    if (newSettings.defaultChip !== undefined) {
      // 检查默认筹码是否在常用筹码中
      const favorites = newSettings.favorites || settings.favorites
      if (!favorites.includes(newSettings.defaultChip)) {
        errors.push('默认筹码必须在常用筹码中')
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // 更新设置
  const updateSettings = (newSettings: Partial<ChipSettings>): boolean => {
    const validation = validateSettings(newSettings)
    if (!validation.isValid) {
      console.warn('设置验证失败:', validation.errors)
      return false
    }

    Object.assign(settings, newSettings)
    saveToLocalStorage()
    return true
  }

  // 重置为默认设置
  const resetToDefault = (): void => {
    Object.assign(settings, defaultSettings)
    saveToLocalStorage()
  }

  // 开始临时编辑
  const startTempEdit = (): void => {
    Object.assign(tempSettings, settings)
  }

  // 提交临时编辑
  const commitTempEdit = (): boolean => {
    const validation = validateSettings(tempSettings)
    if (!validation.isValid) {
      return false
    }

    Object.assign(settings, tempSettings)
    saveToLocalStorage()
    return true
  }

  // 取消临时编辑
  const cancelTempEdit = (): void => {
    Object.assign(tempSettings, settings)
  }

  // 获取筹码统计信息
  const getChipUsageStats = (): Record<number, { count: number; totalAmount: number; lastUsed: Date | null }> => {
    try {
      const stats = localStorage.getItem('sicbo_chip_usage_stats')
      return stats ? JSON.parse(stats) : {}
    } catch {
      return {}
    }
  }

  // 记录筹码使用
  const recordChipUsage = (chipValue: number, amount: number): void => {
    try {
      const stats = getChipUsageStats()
      if (!stats[chipValue]) {
        stats[chipValue] = { count: 0, totalAmount: 0, lastUsed: null }
      }
      
      stats[chipValue].count++
      stats[chipValue].totalAmount += amount
      stats[chipValue].lastUsed = new Date()
      
      localStorage.setItem('sicbo_chip_usage_stats', JSON.stringify(stats))
    } catch (error) {
      console.warn('Failed to record chip usage:', error)
    }
  }

  // 获取推荐的筹码配置
  const getSmartRecommendations = (balance: number, gameHistory: any[] = []): ChipConfig[] => {
    const usageStats = getChipUsageStats()
    const availableChips = getRecommendedChips(balance)
    
    // 基于使用频率和余额推荐
    const scored = availableChips.map(chip => {
      const usage = usageStats[chip.value] || { count: 0, totalAmount: 0, lastUsed: null }
      const balanceRatio = chip.value / balance
      const usageScore = usage.count * 0.4 + (usage.totalAmount / 10000) * 0.3
      const balanceScore = balanceRatio < 0.01 ? 1 : balanceRatio < 0.05 ? 0.8 : 0.5
      
      return {
        chip,
        score: usageScore + balanceScore
      }
    })
    
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(item => item.chip)
  }

  // 保存到本地存储
  const saveToLocalStorage = (): void => {
    try {
      const data = {
        settings,
        customPresets: presets.value.filter(p => p.id.startsWith('custom_')),
        timestamp: Date.now()
      }
      localStorage.setItem('sicbo_chip_settings', JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to save chip settings:', error)
    }
  }

  // 从本地存储加载
  const loadFromLocalStorage = (): void => {
    try {
      const saved = localStorage.getItem('sicbo_chip_settings')
      if (saved) {
        const data = JSON.parse(saved)
        
        // 加载设置
        if (data.settings) {
          const validation = validateSettings(data.settings)
          if (validation.isValid) {
            Object.assign(settings, data.settings)
          }
        }
        
        // 加载自定义预设
        if (data.customPresets && Array.isArray(data.customPresets)) {
          // 移除旧的自定义预设
          presets.value = presets.value.filter(p => !p.id.startsWith('custom_'))
          // 添加保存的自定义预设
          presets.value.push(...data.customPresets)
        }
      }
    } catch (error) {
      console.warn('Failed to load chip settings:', error)
    }
  }

  // 导出设置
  const exportSettings = (): string => {
    const data = {
      version: '1.0',
      settings,
      customPresets: presets.value.filter(p => p.id.startsWith('custom_')),
      exportTime: new Date().toISOString()
    }
    return JSON.stringify(data, null, 2)
  }

  // 导入设置
  const importSettings = (jsonData: string): boolean => {
    try {
      const data = JSON.parse(jsonData)
      
      if (data.settings) {
        const validation = validateSettings(data.settings)
        if (validation.isValid) {
          Object.assign(settings, data.settings)
        }
      }
      
      if (data.customPresets && Array.isArray(data.customPresets)) {
        // 移除现有自定义预设
        presets.value = presets.value.filter(p => !p.id.startsWith('custom_'))
        // 添加导入的预设
        presets.value.push(...data.customPresets)
      }
      
      saveToLocalStorage()
      return true
    } catch (error) {
      console.warn('Failed to import settings:', error)
      return false
    }
  }

  // 监听设置变化
  watch(settings, () => {
    saveToLocalStorage()
  }, { deep: true })

  return {
    // 状态
    allChips,
    presets,
    settings,
    tempSettings,
    
    // 计算属性
    favoriteChips,
    enabledChips,
    availableChips,
    
    // 方法
    getRecommendedChips,
    getChipImagePath,
    getSettingsIconPath,
    applyPreset,
    createCustomPreset,
    deleteCustomPreset,
    validateSettings,
    updateSettings,
    resetToDefault,
    startTempEdit,
    commitTempEdit,
    cancelTempEdit,
    recordChipUsage,
    getChipUsageStats,
    getSmartRecommendations,
    saveToLocalStorage,
    loadFromLocalStorage,
    exportSettings,
    importSettings
  }
}