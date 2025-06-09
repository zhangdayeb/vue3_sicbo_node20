import { defineStore } from 'pinia'
import type { GameState, BetLimits, UserBalance, GameSettings } from '@/types/game'

export const useGameStore = defineStore('game', {
  state: (): {
    gameState: GameState
    userBalance: UserBalance
    settings: GameSettings
    isConnected: boolean
  } => ({
    gameState: {
      videoUrl: '',
      gameNumber: '',
      status: 'waiting',
      countdown: 0,
      round: 1
    },
    userBalance: {
      total: 10000,
      currency: 'CNY'
    },
    settings: {
      tableName: '骰宝001',
      limits: { min: 10, max: 10000 },
      language: 'zh'
    },
    isConnected: false
  }),

  getters: {
    formattedBalance: (state) => {
      return `${state.userBalance.currency} ${state.userBalance.total.toLocaleString()}`
    },
    isGameActive: (state) => {
      return ['betting', 'dealing'].includes(state.gameState.status)
    },
    fullGameNumber: (state) => {
      if (state.gameState.gameNumber) {
        return state.gameState.gameNumber
      }
      const tableId = 'T001'
      const now = new Date()
      const dateStr = now.getFullYear().toString().slice(-2) + 
                      String(now.getMonth() + 1).padStart(2, '0') + 
                      String(now.getDate()).padStart(2, '0')
      const sequence = String(state.gameState.round).padStart(4, '0')
      return `${tableId}${dateStr}${sequence}`
    }
  },

  actions: {
    updateGameStatus(status: GameState['status']) {
      this.gameState.status = status
      this.notifyCocos('gameStatusChange', { status })
    },

    updateCountdown(seconds: number) {
      this.gameState.countdown = seconds
    },

    updateBalance(amount: number) {
      this.userBalance.total = amount
      this.notifyCocos('balanceChange', { balance: amount })
    },

    updateGameNumber(gameNumber: string) {
      this.gameState.gameNumber = gameNumber
      this.gameState.round++
    },

    updateVideoUrl(videoUrl: string) {
      this.gameState.videoUrl = videoUrl
    },

    generateNewGameNumber() {
      const tableId = 'T001'
      const now = new Date()
      const dateStr = now.getFullYear().toString().slice(-2) + 
                      String(now.getMonth() + 1).padStart(2, '0') + 
                      String(now.getDate()).padStart(2, '0')
      const sequence = String(this.gameState.round).padStart(4, '0')
      const newGameNumber = `${tableId}${dateStr}${sequence}`
      this.gameState.gameNumber = newGameNumber
      return newGameNumber
    },

    startNewRound() {
      this.gameState.round++
      this.generateNewGameNumber()
      this.updateGameStatus('betting')
      this.updateCountdown(30)
    },

    notifyCocos(event: string, data: any) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(`vue-to-cocos-${event}`, {
          detail: data
        }))
      }
    }
  }
})