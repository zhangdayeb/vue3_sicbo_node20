import { ref, computed, reactive, watch, readonly } from 'vue'

export interface ChipConfig {
  value: number
  label: string
  color: string
  textColor: string
  description: string
  isEnabled: boolean
  hotkey?: string
}

export interface ChipPreset {
  id: string
  name: string
  chips: number[]
  description: string
}

export interface ChipSelection {
  currentChip: number
  availableChips: number[]
  quickSelectEnabled: boolean
  autoSelectEnabled: boolean
}

export interface ChipAnimation {
  enabled: boolean
  duration: number
  easing: string
  showTrails: boolean
}

export interface ChipStatistics {
  mostUsedChip: number
  totalChipsUsed: number
  averageChipValue: number
  chipUsageHistory: Array<{
    chipValue: number
    timestamp: Date
    betType?: string
  }>
}

export const useChips = () => {
  // 筹码配置
  const chipConfigs = ref<ChipConfig[]>([
    {
      value: 1,
      label: '1',
      color: '#8b4513',
      textColor: '#ffffff',
      description: '基础筹码',
      isEnabled: true,
      hotkey: '1'
    },
    {
      value: 5,
      label: '5',
      color: '#dc143c',
      textColor: '#ffffff',
      description: '小额筹码',
      isEnabled: true,
      hotkey: '2'
    },
    {
      value: 10,
      label: '10',
      color: '#ff4500',
      textColor: '#ffffff',
      description: '常用筹码',
      isEnabled: true,
      hotkey: '3'
    },
    {
      value: 25,
      label: '25',
      color: '#228b22',
      textColor: '#ffffff',
      description: '中等筹码',
      isEnabled: true,
      hotkey: '4'
    },
    {
      value: 50,
      label: '50',
      color: '#4169e1',
      textColor: '#ffffff',
      description: '中高筹码',
      isEnabled: true,
      hotkey: '5'
    },
    {
      value: 100,
      label: '100',
      color: '#ffd700',
      textColor: '#333333',
      description: '高级筹码',
      isEnabled: true,
      hotkey: '6'
    },
    {
      value: 500,
      label: '500',
      color: '#9370db',
      textColor: '#ffffff',
      description: '豪华筹码',
      isEnabled: true,
      hotkey: '7'
    },
    {
      value: 1000,
      label: '1K',
      color: '#ff1493',
      textColor: '#ffffff',
      description: '顶级筹码',
      isEnabled: true,
      hotkey: '8'
    },
    {
      value: 5000,
      label: '5K',
      color: '#00ced1',
      textColor: '#ffffff',
      description: '至尊筹码',
      isEnabled: false,
      hotkey: '9'
    },
    {
      value: 10000,
      label: '10K',
      color: '#ff6347',
      textColor: '#ffffff',
      description: '传奇筹码',
      isEnabled: false,
      hotkey: '0'
    }
  ])

  // 筹码预设
  const chipPresets = ref<ChipPreset[]>([
    {
      id: 'beginner',
      name: '新手推荐',
      chips: [1, 5, 10, 25],
      description: '适合新手玩家的筹码配置'
    },
    {
      id: 'casual',
      name: '休闲模式',
      chips: [5, 10, 25, 50, 100],
      description: '休闲娱乐的筹码配置'
    },
    {
      id: 'standard',
      name: '标准配置',
      chips: [10, 25, 50, 100, 500],
      description: '最常用的筹码配置'
    },
    {
      id: 'advanced',
      name: '进阶玩家',
      chips: [25, 50, 100, 500, 1000],
      description: '适合有经验玩家的配置'
    },
    {
      id: 'vip',
      name: 'VIP专享',
      chips: [100, 500, 1000, 5000, 10000],
      description: '高额投注玩家专享配置'
    }
  ])

  // 当前状态
  const selectedChip = ref<number>(10)
  const lastUsedChips = ref<number[]>([])
  const chipSelection = reactive<ChipSelection>({
    currentChip: 10,
    availableChips: [1, 5, 10, 25, 50, 100],
    quickSelectEnabled: true,
    autoSelectEnabled: false
  })

  // 动画设置
  const chipAnimation = reactive<ChipAnimation>({
    enabled: true,
    duration: 300,
    easing: 'ease-out',
    showTrails: true
  })

  // 统计信息
  const statistics = reactive<ChipStatistics>({
    mostUsedChip: 10,
    totalChipsUsed: 0,
    averageChipValue: 0,
    chipUsageHistory: []
  })

  // 计算属性
  const enabledChips = computed(() => 
    chipConfigs.value.filter(chip => chip.isEnabled)
  )

  const availableChips = computed(() => {
    if (chipSelection.availableChips.length > 0) {
      return chipConfigs.value.filter(chip => 
        chipSelection.availableChips.includes(chip.value) && chip.isEnabled
      )
    }
    return enabledChips.value
  })

  const currentChipConfig = computed(() => 
    chipConfigs.value.find(chip => chip.value === selectedChip.value)
  )

  const chipsByValue = computed(() => {
    const map = new Map<number, ChipConfig>()
    chipConfigs.value.forEach(chip => {
      map.set(chip.value, chip)
    })
    return map
  })

  const sortedChips = computed(() => 
    [...availableChips.value].sort((a, b) => a.value - b.value)
  )

  const canSelectChip = computed(() => (chipValue: number) => {
    const chip = chipsByValue.value.get(chipValue)
    return chip?.isEnabled ?? false
  })

  // 根据余额推荐筹码
  const getRecommendedChips = (balance: number): ChipConfig[] => {
    const maxRecommendedValue = Math.floor(balance * 0.1) // 不超过余额的10%
    return enabledChips.value.filter(chip => chip.value <= maxRecommendedValue)
  }

  // 智能筹码选择
  const getSmartChipSelection = (targetAmount: number, availableBalance: number): number[] => {
    const recommendedChips = getRecommendedChips(availableBalance)
    if (recommendedChips.length === 0) return []

    // 贪心算法找到最接近目标金额的筹码组合
    const chips = recommendedChips.map(c => c.value).sort((a, b) => b - a)
    const result: number[] = []
    let remaining = targetAmount

    for (const chipValue of chips) {
      while (remaining >= chipValue && result.length < 10) { // 限制筹码数量
        result.push(chipValue)
        remaining -= chipValue
      }
    }

    return result
  }

  // 选择筹码
  const selectChip = (chipValue: number): boolean => {
    if (!canSelectChip.value(chipValue)) {
      return false
    }

    const previousChip = selectedChip.value
    selectedChip.value = chipValue
    chipSelection.currentChip = chipValue

    // 记录使用历史
    recordChipUsage(chipValue)

    // 更新最近使用的筹码
    updateLastUsedChips(chipValue)

    console.log(`筹码选择: ${previousChip} → ${chipValue}`)
    return true
  }

  // 快速选择筹码（键盘快捷键）
  const quickSelectChip = (hotkey: string): boolean => {
    if (!chipSelection.quickSelectEnabled) return false

    const chip = chipConfigs.value.find(c => c.hotkey === hotkey && c.isEnabled)
    if (chip) {
      return selectChip(chip.value)
    }
    return false
  }

  // 选择下一个筹码
  const selectNextChip = (): boolean => {
    const currentIndex = sortedChips.value.findIndex(chip => chip.value === selectedChip.value)
    if (currentIndex < sortedChips.value.length - 1) {
      return selectChip(sortedChips.value[currentIndex + 1].value)
    }
    return false
  }

  // 选择上一个筹码
  const selectPreviousChip = (): boolean => {
    const currentIndex = sortedChips.value.findIndex(chip => chip.value === selectedChip.value)
    if (currentIndex > 0) {
      return selectChip(sortedChips.value[currentIndex - 1].value)
    }
    return false
  }

  // 自动选择合适的筹码
  const autoSelectChip = (targetAmount: number, balance: number): boolean => {
    if (!chipSelection.autoSelectEnabled) return false

    const recommendedChips = getRecommendedChips(balance)
    if (recommendedChips.length === 0) return false

    // 选择最接近但不超过目标金额的筹码
    const suitableChip = recommendedChips
      .filter(chip => chip.value <= targetAmount)
      .reduce((best, current) => 
        current.value > best.value ? current : best, 
        recommendedChips[0]
      )

    if (suitableChip) {
      return selectChip(suitableChip.value)
    }

    return false
  }

  // 批量操作：设置可用筹码
  const setAvailableChips = (chipValues: number[]): void => {
    chipSelection.availableChips = chipValues.filter(value => 
      chipConfigs.value.some(chip => chip.value === value && chip.isEnabled)
    )
  }

  // 应用筹码预设
  const applyChipPreset = (presetId: string): boolean => {
    const preset = chipPresets.value.find(p => p.id === presetId)
    if (!preset) return false

    setAvailableChips(preset.chips)
    
    // 选择预设中的第一个可用筹码
    const firstAvailableChip = preset.chips.find(value => canSelectChip.value(value))
    if (firstAvailableChip) {
      selectChip(firstAvailableChip)
    }

    console.log(`应用筹码预设: ${preset.name}`)
    return true
  }

  // 创建自定义预设
  const createCustomPreset = (name: string, chips: number[], description?: string): string => {
    const id = `custom_${Date.now()}`
    const newPreset: ChipPreset = {
      id,
      name,
      chips: chips.filter(value => canSelectChip.value(value)),
      description: description || '自定义筹码配置'
    }
    
    chipPresets.value.push(newPreset)
    return id
  }

  // 删除自定义预设
  const deleteCustomPreset = (presetId: string): boolean => {
    if (!presetId.startsWith('custom_')) return false
    
    const index = chipPresets.value.findIndex(p => p.id === presetId)
    if (index > -1) {
      chipPresets.value.splice(index, 1)
      return true
    }
    return false
  }

  // 启用/禁用筹码
  const toggleChipEnabled = (chipValue: number): boolean => {
    const chip = chipsByValue.value.get(chipValue)
    if (chip) {
      chip.isEnabled = !chip.isEnabled
      
      // 如果禁用的是当前选中的筹码，自动选择另一个
      if (!chip.isEnabled && selectedChip.value === chipValue) {
        const firstAvailable = enabledChips.value[0]
        if (firstAvailable) {
          selectChip(firstAvailable.value)
        }
      }
      
      return true
    }
    return false
  }

  // 自定义筹码配置
  const updateChipConfig = (chipValue: number, updates: Partial<ChipConfig>): boolean => {
    const chip = chipsByValue.value.get(chipValue)
    if (chip) {
      Object.assign(chip, updates)
      return true
    }
    return false
  }

  // 记录筹码使用
  const recordChipUsage = (chipValue: number, betType?: string): void => {
    statistics.chipUsageHistory.push({
      chipValue,
      timestamp: new Date(),
      betType
    })

    // 保持历史记录数量
    if (statistics.chipUsageHistory.length > 1000) {
      statistics.chipUsageHistory = statistics.chipUsageHistory.slice(-500)
    }

    updateStatistics()
  }

  // 更新最近使用的筹码
  const updateLastUsedChips = (chipValue: number): void => {
    // 移除重复项
    lastUsedChips.value = lastUsedChips.value.filter(value => value !== chipValue)
    
    // 添加到开头
    lastUsedChips.value.unshift(chipValue)
    
    // 保持最多5个
    if (lastUsedChips.value.length > 5) {
      lastUsedChips.value = lastUsedChips.value.slice(0, 5)
    }
  }

  // 更新统计信息
  const updateStatistics = (): void => {
    if (statistics.chipUsageHistory.length === 0) return

    // 计算最常用的筹码
    const usageCount = new Map<number, number>()
    statistics.chipUsageHistory.forEach(usage => {
      usageCount.set(usage.chipValue, (usageCount.get(usage.chipValue) || 0) + 1)
    })

    let mostUsed = 0
    let maxCount = 0
    for (const [chipValue, count] of usageCount) {
      if (count > maxCount) {
        maxCount = count
        mostUsed = chipValue
      }
    }
    statistics.mostUsedChip = mostUsed

    // 计算总使用次数
    statistics.totalChipsUsed = statistics.chipUsageHistory.length

    // 计算平均筹码价值
    const totalValue = statistics.chipUsageHistory.reduce((sum, usage) => sum + usage.chipValue, 0)
    statistics.averageChipValue = totalValue / statistics.chipUsageHistory.length
  }

  // 获取筹码使用趋势
  const getChipUsageTrend = (days: number = 7): Array<{date: string, chips: Record<number, number>}> => {
    const now = new Date()
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    
    const trendData: Array<{date: string, chips: Record<number, number>}> = []
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      
      const dayUsage = statistics.chipUsageHistory.filter(usage => {
        const usageDate = usage.timestamp.toISOString().split('T')[0]
        return usageDate === dateStr
      })
      
      const chipCount: Record<number, number> = {}
      dayUsage.forEach(usage => {
        chipCount[usage.chipValue] = (chipCount[usage.chipValue] || 0) + 1
      })
      
      trendData.push({ date: dateStr, chips: chipCount })
    }
    
    return trendData
  }

  // 重置统计
  const resetStatistics = (): void => {
    statistics.mostUsedChip = 0
    statistics.totalChipsUsed = 0
    statistics.averageChipValue = 0
    statistics.chipUsageHistory = []
    lastUsedChips.value = []
  }

  // 导出配置
  const exportConfig = (): object => {
    return {
      chipConfigs: chipConfigs.value,
      chipPresets: chipPresets.value,
      chipSelection: chipSelection,
      chipAnimation: chipAnimation,
      selectedChip: selectedChip.value,
      lastUsedChips: lastUsedChips.value
    }
  }

  // 导入配置
  const importConfig = (config: any): boolean => {
    try {
      if (config.chipConfigs) {
        chipConfigs.value = config.chipConfigs
      }
      if (config.chipPresets) {
        chipPresets.value = config.chipPresets
      }
      if (config.chipSelection) {
        Object.assign(chipSelection, config.chipSelection)
      }
      if (config.chipAnimation) {
        Object.assign(chipAnimation, config.chipAnimation)
      }
      if (config.selectedChip && canSelectChip.value(config.selectedChip)) {
        selectChip(config.selectedChip)
      }
      if (config.lastUsedChips) {
        lastUsedChips.value = config.lastUsedChips
      }
      return true
    } catch (error) {
      console.error('导入筹码配置失败:', error)
      return false
    }
  }

  // 保存到本地存储
  const saveToLocalStorage = (): void => {
    try {
      const config = exportConfig()
      localStorage.setItem('sicbo_chip_config', JSON.stringify(config))
    } catch (error) {
      console.error('保存筹码配置失败:', error)
    }
  }

  // 从本地存储加载
  const loadFromLocalStorage = (): boolean => {
    try {
      const saved = localStorage.getItem('sicbo_chip_config')
      if (saved) {
        const config = JSON.parse(saved)
        return importConfig(config)
      }
      return false
    } catch (error) {
      console.error('加载筹码配置失败:', error)
      return false
    }
  }

  // 监听选中筹码变化
  watch(selectedChip, (newValue, oldValue) => {
    chipSelection.currentChip = newValue
    console.log(`筹码变更: ${oldValue} → ${newValue}`)
  })

  // 键盘事件处理
  const handleKeydown = (event: KeyboardEvent): void => {
    if (!chipSelection.quickSelectEnabled) return
    
    // 数字键选择筹码
    if (event.key >= '0' && event.key <= '9') {
      event.preventDefault()
      quickSelectChip(event.key)
      return
    }
    
    // 方向键切换筹码
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault()
      selectPreviousChip()
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault()
      selectNextChip()
    }
  }

  // 初始化
  const init = (): void => {
    // 从本地存储加载配置
    loadFromLocalStorage()
    
    // 确保有一个选中的筹码
    if (!canSelectChip.value(selectedChip.value)) {
      const firstAvailable = enabledChips.value[0]
      if (firstAvailable) {
        selectChip(firstAvailable.value)
      }
    }
    
    // 绑定键盘事件
    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', handleKeydown)
    }
  }

  // 清理
  const cleanup = (): void => {
    if (typeof document !== 'undefined') {
      document.removeEventListener('keydown', handleKeydown)
    }
    saveToLocalStorage()
  }

  return {
    // 状态
    chipConfigs,
    chipPresets,
    selectedChip: readonly(selectedChip),
    lastUsedChips: readonly(lastUsedChips),
    chipSelection,
    chipAnimation,
    statistics: readonly(statistics),
    
    // 计算属性
    enabledChips,
    availableChips,
    currentChipConfig,
    chipsByValue,
    sortedChips,
    canSelectChip,
    
    // 方法
    selectChip,
    quickSelectChip,
    selectNextChip,
    selectPreviousChip,
    autoSelectChip,
    setAvailableChips,
    applyChipPreset,
    createCustomPreset,
    deleteCustomPreset,
    toggleChipEnabled,
    updateChipConfig,
    recordChipUsage,
    getRecommendedChips,
    getSmartChipSelection,
    getChipUsageTrend,
    resetStatistics,
    exportConfig,
    importConfig,
    saveToLocalStorage,
    loadFromLocalStorage,
    init,
    cleanup
  }
}