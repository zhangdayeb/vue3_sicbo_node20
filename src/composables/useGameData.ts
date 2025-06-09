// src/composables/useGameData.ts
import { computed } from 'vue'
import { getGameLifecycle } from './useGameLifecycle'
import { getGlobalApiService } from '@/services/gameApi'
import { useBettingStore } from '@/stores/bettingStore'

export const useGameData = () => {
  const lifecycle = getGameLifecycle()
  const bettingStore = useBettingStore()

  // 数据访问
  const tableInfo = computed(() => lifecycle.tableInfo)
  const userInfo = computed(() => lifecycle.userInfo)
  const connectionStatus = computed(() => lifecycle.connectionStatus)
  const isInitialized = computed(() => lifecycle.isInitialized)
  const error = computed(() => lifecycle.error)

  // 格式化余额
  const formattedBalance = computed(() => {
    if (!userInfo.value) return '---'
    
    const balance = userInfo.value.money_balance
    if (balance >= 10000) {
      return `${(balance / 10000).toFixed(1)}万`
    } else if (balance >= 1000) {
      return `${(balance / 1000).toFixed(1)}K`
    }
    return balance.toString()
  })

  // 操作状态
  const canOperate = computed(() => {
    return isInitialized.value && 
           connectionStatus.value === 'connected' && 
           !error.value
  })

  // 刷新用户余额
  const refreshBalance = async (): Promise<void> => {
    const apiService = getGlobalApiService()
    const latestUserInfo = await apiService.getUserInfo()
    
    lifecycle.updateUserInfo(latestUserInfo)
    bettingStore.updateBalance(latestUserInfo.balance)
  }

  // 刷新台桌信息
  const refreshTableInfo = async (): Promise<void> => {
    const apiService = getGlobalApiService()
    const latestTableInfo = await apiService.getTableInfo()
    lifecycle.updateTableInfo(latestTableInfo)
  }

  return {
    // 数据
    tableInfo,
    userInfo,
    connectionStatus,
    isInitialized,
    error,
    
    // 计算属性
    formattedBalance,
    canOperate,
    
    // 操作方法
    refreshBalance,
    refreshTableInfo
  }
}