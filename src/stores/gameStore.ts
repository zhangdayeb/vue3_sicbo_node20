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
      videoUrl: 'https://video.xinghao998.top/index.html?tableVideo=bjl_y1',
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
      tableName: 'SicBo Table 1',
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

    // 与Cocos通信
    notifyCocos(event: string, data: any) {
      window.dispatchEvent(new CustomEvent(`vue-to-cocos-${event}`, {
        detail: data
      }))
    }
  }
})