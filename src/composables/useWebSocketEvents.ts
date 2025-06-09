// src/composables/useWebSocketEvents.ts
import { onUnmounted } from 'vue'
import { getGameLifecycle } from './useGameLifecycle'
import type { CountdownData, GameResultData, WinData, GameStatusData } from '@/types/api'

export const useWebSocketEvents = () => {
  const lifecycle = getGameLifecycle()
  const listeners: Array<{ event: string; callback: Function }> = []

  const addListener = <T>(event: string, callback: (data: T) => void) => {
    lifecycle.wsService.on(event, callback)
    listeners.push({ event, callback })
  }

  const removeListener = <T>(event: string, callback: (data: T) => void) => {
    lifecycle.wsService.off(event, callback)
  }

  // 自动清理监听器
  onUnmounted(() => {
    listeners.forEach(({ event, callback }) => {
      lifecycle.wsService.off(event, callback)
    })
    listeners.length = 0
  })

  return {
    // 事件监听方法
    onCountdown: (callback: (data: CountdownData) => void) => 
      addListener('countdown', callback),
    
    onGameResult: (callback: (data: GameResultData) => void) => 
      addListener('game_result', callback),
    
    onWinData: (callback: (data: WinData) => void) => 
      addListener('win_data', callback),
    
    onBalanceUpdate: (callback: (data: { balance: number; spend: number }) => void) => 
      addListener('balance_update', callback),
    
    onGameStatus: (callback: (data: GameStatusData) => void) => 
      addListener('game_status', callback),
    
    onError: (callback: (data: any) => void) => 
      addListener('error', callback),
    
    // 手动移除监听器
    removeListener,
    
    // 获取连接状态
    getConnectionStatus: () => lifecycle.connectionStatus,
    isConnected: () => lifecycle.connectionStatus === 'connected'
  }
}