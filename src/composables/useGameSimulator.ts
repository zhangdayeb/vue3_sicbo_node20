// src/composables/useGameSimulator.ts
import { ref, computed, readonly, onUnmounted } from 'vue'
import { mockApiService } from '@/services/mockApi'
import { useBettingStore } from '@/stores/bettingStore'
import { useGameStore } from '@/stores/gameStore'
import { useAudio } from '@/composables/useAudio'
import type { GamePhase } from '@/types/game'

export interface GameCycleConfig {
  bettingDuration: number      // 投注阶段时长(秒)
  rollingDuration: number      // 开牌阶段时长(秒)
  resultDuration: number       // 结果展示时长(秒)
  settlementDuration: number   // 结算阶段时长(秒)
  autoStart: boolean           // 是否自动开始下一局
  enableAudio: boolean         // 是否启用音效
}

export interface GameSimulatorState {
  isRunning: boolean
  currentPhase: GamePhase
  countdown: number
  gameNumber: string
  roundCount: number
  lastResults?: [number, number, number]
}

export const useGameSimulator = (config: Partial<GameCycleConfig> = {}) => {
  const bettingStore = useBettingStore()
  const gameStore = useGameStore()
  const { playSound, playDiceEffect, playWinSound } = useAudio()

  // 默认配置
  const defaultConfig: GameCycleConfig = {
    bettingDuration: 30,
    rollingDuration: 3,
    resultDuration: 5,
    settlementDuration: 2,
    autoStart: true,
    enableAudio: true
  }

  const gameConfig = ref<GameCycleConfig>({ ...defaultConfig, ...config })

  // 游戏状态
  const simulatorState = ref<GameSimulatorState>({
    isRunning: false,
    currentPhase: 'waiting',
    countdown: 0,
    gameNumber: '',
    roundCount: 0,
    lastResults: undefined
  })

  // 定时器引用
  let countdownTimer: number | null = null
  let phaseTimer: number | null = null
  let gameLoopTimer: number | null = null

  // 计算属性
  const isGameRunning = computed(() => simulatorState.value.isRunning)
  const currentPhase = computed(() => simulatorState.value.currentPhase)
  const countdown = computed(() => simulatorState.value.countdown)
  const roundCount = computed(() => simulatorState.value.roundCount)

  // 游戏阶段描述
  const phaseDescription = computed(() => {
    const descriptions: Record<GamePhase, string> = {
      'waiting': '等待开始',
      'betting': '投注进行中',
      'rolling': '开牌中',
      'result': '结果公布',
      'settling': '结算中'
    }
    return descriptions[simulatorState.value.currentPhase] || '未知状态'
  })

  /**
   * 生成随机骰子结果
   */
  const generateRandomResults = (): [number, number, number] => {
    return [
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1
    ]
  }

  /**
   * 模拟网络延迟
   */
  const simulateNetworkDelay = (min: number = 100, max: number = 300): Promise<void> => {
    const delay = Math.random() * (max - min) + min
    return new Promise(resolve => setTimeout(resolve, delay))
  }

  /**
   * 更新倒计时
   */
  const updateCountdown = (seconds: number): void => {
    simulatorState.value.countdown = seconds
    gameStore.updateCountdown(seconds)
    
    if (countdownTimer) {
      clearInterval(countdownTimer)
    }
    
    countdownTimer = window.setInterval(() => {
      simulatorState.value.countdown--
      gameStore.updateCountdown(simulatorState.value.countdown)
      
      // 播放倒计时音效
      if (gameConfig.value.enableAudio) {
        if (simulatorState.value.countdown <= 5 && simulatorState.value.countdown > 0) {
          playSound('countdown-tick')
        } else if (simulatorState.value.countdown === 0) {
          playSound('countdown-end')
        }
      }
      
      if (simulatorState.value.countdown <= 0) {
        clearInterval(countdownTimer!)
        countdownTimer = null
      }
    }, 1000)
  }

  /**
   * 更新游戏阶段
   */
  const updatePhase = (phase: GamePhase): void => {
    console.log(`🎮 游戏阶段变更: ${simulatorState.value.currentPhase} -> ${phase}`)
    
    simulatorState.value.currentPhase = phase
    gameStore.updateGameStatus(phase)
    bettingStore.updateGamePhase(phase)
    
    // 更新 mock 数据
    mockApiService.updateGamePhase(phase)
  }

  /**
   * 开始新一局游戏
   */
  const startNewRound = async (): Promise<void> => {
    try {
      console.log('🚀 开始新一局游戏')
      
      // 生成新的游戏数据
      const gameData = mockApiService.generateGameData()
      simulatorState.value.gameNumber = gameData.gameNumber
      simulatorState.value.roundCount++
      
      // 更新游戏store
      gameStore.updateGameNumber(gameData.gameNumber)
      
      console.log(`📋 局号: ${gameData.gameNumber}`)
      
      // 开始投注阶段
      await startBettingPhase()
      
    } catch (error) {
      console.error('启动新游戏失败:', error)
      handleGameError(error)
    }
  }

  /**
   * 投注阶段
   */
  const startBettingPhase = async (): Promise<void> => {
    console.log('💰 进入投注阶段')
    
    updatePhase('betting')
    updateCountdown(gameConfig.value.bettingDuration)
    
    if (gameConfig.value.enableAudio) {
      playSound('phase-betting')
    }
    
    // 设置阶段结束定时器
    phaseTimer = window.setTimeout(() => {
      startRollingPhase()
    }, gameConfig.value.bettingDuration * 1000)
  }

  /**
   * 开牌阶段
   */
  const startRollingPhase = async (): Promise<void> => {
    console.log('🎲 进入开牌阶段')
    
    updatePhase('rolling')
    updateCountdown(gameConfig.value.rollingDuration)
    
    // 停止接受新的投注
    bettingStore.updateGamePhase('rolling')
    
    if (gameConfig.value.enableAudio) {
      playSound('dice-shake')
      // 延迟播放滚动音效
      setTimeout(() => {
        playSound('dice-roll')
      }, 1000)
    }
    
    // 生成结果
    const diceResults = generateRandomResults()
    simulatorState.value.lastResults = diceResults
    
    console.log(`🎯 开奖结果: ${diceResults.join('-')} (总和: ${diceResults.reduce((a, b) => a + b, 0)})`)
    
    // 模拟网络延迟
    await simulateNetworkDelay(500, 1000)
    
    phaseTimer = window.setTimeout(() => {
      startResultPhase(diceResults)
    }, gameConfig.value.rollingDuration * 1000)
  }

  /**
   * 结果阶段
   */
  const startResultPhase = async (diceResults: [number, number, number]): Promise<void> => {
    console.log('📊 进入结果阶段')
    
    updatePhase('result')
    updateCountdown(gameConfig.value.resultDuration)
    
    try {
      // 计算投注结果
      const currentBets = { ...bettingStore.currentBets }
      const hasBets = Object.keys(currentBets).length > 0
      
      if (hasBets) {
        const winResults = mockApiService.calculateWinnings(currentBets, diceResults)
        
        console.log('💸 投注结算结果:')
        console.log(`- 总投注: ¥${winResults.totalBetAmount}`)
        console.log(`- 总中奖: ¥${winResults.totalWinAmount}`)
        console.log(`- 净盈亏: ¥${winResults.netProfit}`)
        
        // 更新余额
        const newBalance = bettingStore.balance + winResults.netProfit
        await bettingStore.updateBalance(newBalance)
        await mockApiService.updateBalance(newBalance)
        
        // 保存历史记录
        mockApiService.saveBettingHistory(
          simulatorState.value.gameNumber,
          currentBets,
          winResults.results
        )
        
        // 播放结果音效
        if (gameConfig.value.enableAudio) {
          if (winResults.netProfit > 0) {
            // 根据盈利大小播放不同音效
            const profitRatio = winResults.netProfit / winResults.totalBetAmount
            if (profitRatio >= 10) {
              playWinSound('jackpot')
            } else if (profitRatio >= 5) {
              playWinSound('big')
            } else if (profitRatio >= 2) {
              playWinSound('medium')
            } else {
              playWinSound('small')
            }
          } else {
            playSound('result-lose')
          }
        }
        
        // 显示中奖特效
        if (winResults.netProfit > 0) {
          // 这里可以触发中奖特效组件
          console.log('🎉 触发中奖特效')
        }
      } else {
        console.log('ℹ️ 本局无投注')
      }
      
      // 更新游戏store中的结果
      gameStore.updateGameNumber(simulatorState.value.gameNumber)
      
    } catch (error) {
      console.error('结果处理失败:', error)
      handleGameError(error)
    }
    
    phaseTimer = window.setTimeout(() => {
      startSettlementPhase()
    }, gameConfig.value.resultDuration * 1000)
  }

  /**
   * 结算阶段
   */
  const startSettlementPhase = async (): Promise<void> => {
    console.log('⚖️ 进入结算阶段')
    
    updatePhase('settling')
    updateCountdown(gameConfig.value.settlementDuration)
    
    // 清除当前投注
    bettingStore.clearBets()
    
    // 模拟结算处理
    await simulateNetworkDelay(200, 500)
    
    if (gameConfig.value.enableAudio) {
      playSound('settlement')
    }
    
    phaseTimer = window.setTimeout(() => {
      // 检查是否自动开始下一局
      if (gameConfig.value.autoStart && simulatorState.value.isRunning) {
        updatePhase('waiting')
        // 短暂等待后开始新一局
        setTimeout(() => {
          if (simulatorState.value.isRunning) {
            startNewRound()
          }
        }, 2000)
      } else {
        updatePhase('waiting')
        console.log('⏸️ 游戏暂停，等待手动开始')
      }
    }, gameConfig.value.settlementDuration * 1000)
  }

  /**
   * 开始游戏循环
   */
  const startGame = async (): Promise<void> => {
    if (simulatorState.value.isRunning) {
      console.warn('游戏已在运行中')
      return
    }
    
    console.log('🎮 开始游戏模拟器')
    
    simulatorState.value.isRunning = true
    simulatorState.value.roundCount = 0
    
    // 重置投注store
    bettingStore.init()
    
    await startNewRound()
  }

  /**
   * 停止游戏循环
   */
  const stopGame = (): void => {
    console.log('⏹️ 停止游戏模拟器')
    
    simulatorState.value.isRunning = false
    
    // 清除所有定时器
    if (countdownTimer) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
    
    if (phaseTimer) {
      clearTimeout(phaseTimer)
      phaseTimer = null
    }
    
    if (gameLoopTimer) {
      clearTimeout(gameLoopTimer)
      gameLoopTimer = null
    }
    
    updatePhase('waiting')
    simulatorState.value.countdown = 0
    gameStore.updateCountdown(0)
  }

  /**
   * 暂停/恢复游戏
   */
  const togglePause = (): void => {
    if (simulatorState.value.isRunning) {
      stopGame()
    } else {
      startGame()
    }
  }

  /**
   * 跳过当前阶段
   */
  const skipPhase = (): void => {
    if (!simulatorState.value.isRunning) return
    
    console.log(`⏭️ 跳过当前阶段: ${simulatorState.value.currentPhase}`)
    
    // 清除当前定时器
    if (phaseTimer) {
      clearTimeout(phaseTimer)
      phaseTimer = null
    }
    
    if (countdownTimer) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
    
    // 根据当前阶段跳转到下一阶段
    switch (simulatorState.value.currentPhase) {
      case 'betting':
        startRollingPhase()
        break
      case 'rolling':
        const results = simulatorState.value.lastResults || generateRandomResults()
        startResultPhase(results)
        break
      case 'result':
        startSettlementPhase()
        break
      case 'settling':
        if (gameConfig.value.autoStart) {
          startNewRound()
        } else {
          updatePhase('waiting')
        }
        break
    }
  }

  /**
   * 手动设置开奖结果（用于测试）
   */
  const setManualResult = (diceResults: [number, number, number]): void => {
    simulatorState.value.lastResults = diceResults
    console.log(`🎯 手动设置开奖结果: ${diceResults.join('-')}`)
  }

  /**
   * 更新配置
   */
  const updateConfig = (newConfig: Partial<GameCycleConfig>): void => {
    gameConfig.value = { ...gameConfig.value, ...newConfig }
    console.log('⚙️ 更新游戏配置:', newConfig)
  }

  /**
   * 错误处理
   */
  const handleGameError = (error: any): void => {
    console.error('🚨 游戏错误:', error)
    
    // 停止游戏
    stopGame()
    
    // 这里可以添加错误上报逻辑
    // errorReporter.report(error)
  }

  /**
   * 获取游戏统计信息
   */
  const getGameStats = () => ({
    isRunning: simulatorState.value.isRunning,
    currentPhase: simulatorState.value.currentPhase,
    countdown: simulatorState.value.countdown,
    roundCount: simulatorState.value.roundCount,
    gameNumber: simulatorState.value.gameNumber,
    lastResults: simulatorState.value.lastResults,
    config: { ...gameConfig.value }
  })

  // 监听页面关闭，清理定时器
  const cleanup = (): void => {
    stopGame()
  }

  // 组件卸载时清理
  onUnmounted(cleanup)

  // 监听窗口关闭
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', cleanup)
  }

  return {
    // 状态
    simulatorState: readonly(simulatorState),
    gameConfig: readonly(gameConfig),
    
    // 计算属性
    isGameRunning,
    currentPhase,
    countdown,
    roundCount,
    phaseDescription,
    
    // 控制方法
    startGame,
    stopGame,
    togglePause,
    skipPhase,
    startNewRound,
    
    // 配置方法
    updateConfig,
    setManualResult,
    
    // 工具方法
    generateRandomResults,
    getGameStats,
    
    // 清理方法
    cleanup
  }
}