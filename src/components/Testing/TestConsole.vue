<template>
  <div class="test-console" v-if="showTestConsole">
    <!-- 测试控制台头部 -->
    <div class="console-header">
      <h3>🧪 游戏测试控制台</h3>
      <div class="console-actions">
        <button @click="toggleAutoTest" :class="{ active: autoTesting }">
          {{ autoTesting ? '停止自动测试' : '开始自动测试' }}
        </button>
        <button @click="resetAll">重置所有数据</button>
        <button @click="showTestConsole = false">关闭</button>
      </div>
    </div>

    <!-- 测试统计面板 -->
    <div class="test-stats">
      <div class="stat-card">
        <div class="stat-label">已完成轮次</div>
        <div class="stat-value">{{ testStats.completedRounds }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">总投注金额</div>
        <div class="stat-value">¥{{ testStats.totalBetAmount.toLocaleString() }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">总中奖金额</div>
        <div class="stat-value">¥{{ testStats.totalWinAmount.toLocaleString() }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">净盈亏</div>
        <div class="stat-value" :class="netProfitClass">
          ¥{{ testStats.netProfit.toLocaleString() }}
        </div>
      </div>
    </div>

    <!-- 游戏控制面板 -->
    <div class="control-panel">
      <div class="panel-section">
        <h4>🎮 游戏控制</h4>
        <div class="control-group">
          <button @click="simulator.startGame()" :disabled="simulator.isGameRunning.value">
            开始游戏
          </button>
          <button @click="simulator.stopGame()" :disabled="!simulator.isGameRunning.value">
            停止游戏
          </button>
          <button @click="simulator.skipPhase()" :disabled="!simulator.isGameRunning.value">
            跳过当前阶段
          </button>
        </div>
        
        <div class="game-status">
          <span class="status-label">当前状态:</span>
          <span class="status-value">{{ simulator.phaseDescription.value }}</span>
          <span class="countdown" v-if="simulator.countdown.value > 0">
            ({{ simulator.countdown.value }}s)
          </span>
        </div>
      </div>

      <div class="panel-section">
        <h4>🎲 结果控制</h4>
        <div class="dice-control">
          <label>手动设置开奖结果:</label>
          <div class="dice-inputs">
            <input 
              v-for="(dice, index) in manualDiceResults" 
              :key="index"
              type="number" 
              min="1" 
              max="6" 
              v-model.number="manualDiceResults[index]"
              @change="updateManualResults"
            />
          </div>
          <button @click="applyManualResults">应用结果</button>
        </div>
      </div>

      <div class="panel-section">
        <h4>💰 投注测试</h4>
        <div class="bet-presets">
          <button 
            v-for="preset in betPresets" 
            :key="preset.name"
            @click="applyBetPreset(preset)"
            :disabled="!bettingStore.canPlaceBet"
          >
            {{ preset.name }}
          </button>
        </div>
        
        <div class="current-bets" v-if="Object.keys(bettingStore.currentBets).length > 0">
          <strong>当前投注:</strong>
          <div class="bet-list">
            <div 
              v-for="(amount, betType) in bettingStore.currentBets" 
              :key="betType"
              class="bet-item"
            >
              {{ getBetTypeName(betType) }}: ¥{{ amount }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 测试日志 -->
    <div class="test-logs">
      <div class="logs-header">
        <h4>📋 测试日志</h4>
        <button @click="clearLogs">清空日志</button>
      </div>
      <div class="logs-content">
        <div 
          v-for="(log, index) in testLogs.slice(-20)" 
          :key="index"
          class="log-entry"
          :class="log.type"
        >
          <span class="log-time">{{ formatTime(log.timestamp) }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>
    </div>

    <!-- 历史记录 -->
    <div class="test-history">
      <h4>📊 测试历史</h4>
      <div class="history-table">
        <div class="table-header">
          <div>局号</div>
          <div>开奖结果</div>
          <div>投注金额</div>
          <div>中奖金额</div>
          <div>盈亏</div>
        </div>
        <div 
          v-for="record in gameHistory.slice(0, 10)" 
          :key="record.gameNumber"
          class="table-row"
        >
          <div>{{ record.gameNumber }}</div>
          <div class="dice-result">
            {{ record.diceResults.join('-') }}
            <span class="total">({{ record.diceResults.reduce((a, b) => a + b, 0) }})</span>
          </div>
          <div>¥{{ record.totalBetAmount.toLocaleString() }}</div>
          <div>¥{{ record.totalWinAmount.toLocaleString() }}</div>
          <div :class="record.netProfit >= 0 ? 'profit' : 'loss'">
            ¥{{ record.netProfit.toLocaleString() }}
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 测试控制台开关按钮 -->
  <button 
    v-if="!showTestConsole" 
    class="test-toggle-btn"
    @click="showTestConsole = true"
    title="打开测试控制台"
  >
    🧪
  </button>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted } from 'vue'
import { useGameSimulator } from '@/composables/useGameSimulator'
import { useBettingStore } from '@/stores/bettingStore'
import { mockApiService } from '@/services/mockApi'
import { BettingUtils } from '@/utils/bettingUtils'

// 状态管理
const simulator = useGameSimulator()
const bettingStore = useBettingStore()

// 测试控制台状态
const showTestConsole = ref(false)
const autoTesting = ref(false)
const manualDiceResults = ref([1, 2, 3])

// 测试统计
const testStats = reactive({
  completedRounds: 0,
  totalBetAmount: 0,
  totalWinAmount: 0,
  netProfit: 0
})

// 测试日志
const testLogs = ref<Array<{
  timestamp: Date
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
}>>([])

// 游戏历史
const gameHistory = ref<any[]>([])

// 计算属性
const netProfitClass = computed(() => ({
  'profit': testStats.netProfit >= 0,
  'loss': testStats.netProfit < 0
}))

// 投注预设
const betPresets = [
  {
    name: '保守投注',
    bets: { 'small': 10, 'big': 10 }
  },
  {
    name: '激进投注',
    bets: { 'total-7': 100, 'total-14': 100, 'any-triple': 50 }
  },
  {
    name: '全面投注',
    bets: { 
      'small': 50, 'odd': 50, 'total-10': 30, 
      'single-6': 20, 'pair-1': 10 
    }
  },
  {
    name: '高风险投注',
    bets: { 'total-4': 20, 'total-17': 20, 'triple-6': 10 }
  }
]

// 方法
const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
  testLogs.value.push({
    timestamp: new Date(),
    message,
    type
  })
}

const clearLogs = () => {
  testLogs.value = []
}

const formatTime = (date: Date): string => {
  return date.toTimeString().slice(0, 8)
}

const getBetTypeName = (betType: string): string => {
  return BettingUtils.getBetTypeName(betType as any)
}

const updateManualResults = () => {
  // 确保骰子值在1-6范围内
  manualDiceResults.value = manualDiceResults.value.map(dice => 
    Math.max(1, Math.min(6, dice || 1))
  )
}

const applyManualResults = () => {
  simulator.setManualResult(manualDiceResults.value as [number, number, number])
  addLog(`手动设置开奖结果: ${manualDiceResults.value.join('-')}`, 'info')
}

const applyBetPreset = (preset: any) => {
  if (!bettingStore.canPlaceBet) {
    addLog('当前无法投注', 'warning')
    return
  }

  // 清除当前投注
  bettingStore.clearBets()
  
  // 应用预设投注
  Object.entries(preset.bets).forEach(([betType, amount]) => {
    const success = bettingStore.placeBet(betType as any, amount as number)
    if (!success) {
      addLog(`投注失败: ${betType} ¥${amount}`, 'error')
    }
  })
  
  addLog(`应用投注预设: ${preset.name}`, 'success')
}

const toggleAutoTest = () => {
  autoTesting.value = !autoTesting.value
  
  if (autoTesting.value) {
    startAutoTest()
    addLog('开始自动测试', 'info')
  } else {
    addLog('停止自动测试', 'info')
  }
}

const startAutoTest = async () => {
  while (autoTesting.value) {
    try {
      // 等待游戏开始
      if (!simulator.isGameRunning.value) {
        await simulator.startGame()
      }
      
      // 在投注阶段随机投注
      if (simulator.currentPhase.value === 'betting') {
        const randomPreset = betPresets[Math.floor(Math.random() * betPresets.length)]
        applyBetPreset(randomPreset)
        
        // 随机等待一段时间
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000))
        
        // 确认投注
        if (bettingStore.hasActiveBets) {
          bettingStore.confirmBets()
        }
      }
      
      // 等待游戏结束
      await new Promise(resolve => setTimeout(resolve, 1000))
      
    } catch (error) {
      addLog(`自动测试错误: ${error}`, 'error')
      autoTesting.value = false
    }
  }
}

const resetAll = () => {
  simulator.stopGame()
  bettingStore.updateBalance(50000)
  mockApiService.reset()
  
  testStats.completedRounds = 0
  testStats.totalBetAmount = 0
  testStats.totalWinAmount = 0
  testStats.netProfit = 0
  
  gameHistory.value = []
  clearLogs()
  
  addLog('已重置所有测试数据', 'success')
}

// 监听游戏状态变化
watch(() => simulator.currentPhase.value, (newPhase, oldPhase) => {
  if (oldPhase && newPhase !== oldPhase) {
    addLog(`游戏阶段变更: ${oldPhase} -> ${newPhase}`, 'info')
  }
})

// 监听投注结果
watch(() => bettingStore.balance, (newBalance, oldBalance) => {
  if (oldBalance && newBalance !== oldBalance) {
    const diff = newBalance - oldBalance
    if (diff !== 0) {
      const type = diff > 0 ? 'success' : 'warning'
      addLog(`余额变更: ${diff > 0 ? '+' : ''}¥${diff.toLocaleString()}`, type)
      
      // 更新统计
      if (diff < 0) {
        testStats.totalBetAmount += Math.abs(diff)
      } else {
        testStats.totalWinAmount += diff
      }
      testStats.netProfit = testStats.totalWinAmount - testStats.totalBetAmount
    }
  }
})

// 定期获取游戏历史
const updateGameHistory = async () => {
  try {
    const history = await mockApiService.getGameHistory(1, 20)
    gameHistory.value = history.data
    testStats.completedRounds = history.total
  } catch (error) {
    console.error('获取游戏历史失败:', error)
  }
}

// 组件挂载时的初始化
onMounted(() => {
  // 检查是否是开发模式
  if (import.meta.env.DEV) {
    showTestConsole.value = true
  }
  
  addLog('测试控制台已启动', 'success')
  updateGameHistory()
  
  // 定期更新历史记录
  setInterval(updateGameHistory, 5000)
})
</script>

<style scoped>
.test-console {
  position: fixed;
  top: 10px;
  right: 10px;
  width: 400px;
  max-height: 90vh;
  background: rgba(0, 0, 0, 0.95);
  border: 2px solid #4a9f6e;
  border-radius: 12px;
  color: white;
  font-size: 12px;
  z-index: 9999;
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.console-header {
  background: linear-gradient(135deg, #4a9f6e, #27ae60);
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.console-header h3 {
  margin: 0;
  font-size: 14px;
}

.console-actions {
  display: flex;
  gap: 8px;
}

.console-actions button {
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 10px;
}

.console-actions button.active {
  background: #e74c3c;
}

.test-stats {
  padding: 12px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  border-bottom: 1px solid #2d5a42;
}

.stat-card {
  background: rgba(255, 255, 255, 0.1);
  padding: 8px;
  border-radius: 6px;
  text-align: center;
}

.stat-label {
  font-size: 10px;
  color: #ccc;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 12px;
  font-weight: bold;
}

.stat-value.profit {
  color: #27ae60;
}

.stat-value.loss {
  color: #e74c3c;
}

.control-panel {
  max-height: 200px;
  overflow-y: auto;
  border-bottom: 1px solid #2d5a42;
}

.panel-section {
  padding: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.panel-section:last-child {
  border-bottom: none;
}

.panel-section h4 {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #ffd700;
}

.control-group {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
}

.control-group button,
.bet-presets button {
  padding: 4px 8px;
  background: #2d7a4f;
  border: 1px solid #4a9f6e;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 10px;
}

.control-group button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.game-status {
  font-size: 11px;
  margin-top: 8px;
}

.status-label {
  color: #ccc;
}

.status-value {
  color: #ffd700;
  font-weight: bold;
}

.countdown {
  color: #e74c3c;
  font-weight: bold;
}

.dice-control {
  margin-top: 8px;
}

.dice-inputs {
  display: flex;
  gap: 4px;
  margin: 4px 0;
}

.dice-inputs input {
  width: 30px;
  padding: 2px;
  text-align: center;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid #4a9f6e;
  color: white;
  border-radius: 3px;
}

.bet-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 8px;
}

.current-bets {
  font-size: 10px;
  margin-top: 8px;
}

.bet-list {
  max-height: 60px;
  overflow-y: auto;
  margin-top: 4px;
}

.bet-item {
  padding: 2px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.test-logs {
  max-height: 150px;
  overflow-y: auto;
  border-bottom: 1px solid #2d5a42;
}

.logs-header {
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logs-header h4 {
  margin: 0;
  font-size: 12px;
}

.logs-header button {
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  border-radius: 3px;
  cursor: pointer;
  font-size: 9px;
}

.logs-content {
  padding: 8px 12px;
  max-height: 100px;
  overflow-y: auto;
}

.log-entry {
  display: flex;
  margin-bottom: 4px;
  font-size: 10px;
  line-height: 1.3;
}

.log-time {
  color: #888;
  margin-right: 8px;
  font-family: monospace;
  min-width: 60px;
}

.log-entry.success {
  color: #27ae60;
}

.log-entry.warning {
  color: #f39c12;
}

.log-entry.error {
  color: #e74c3c;
}

.test-history {
  max-height: 200px;
  overflow-y: auto;
  padding: 12px;
}

.test-history h4 {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #ffd700;
}

.history-table {
  font-size: 10px;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 1fr 1fr 0.8fr 0.8fr 0.8fr;
  gap: 8px;
  padding: 4px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.table-header {
  font-weight: bold;
  color: #ffd700;
}

.dice-result {
  font-family: monospace;
}

.total {
  color: #888;
  font-size: 9px;
}

.profit {
  color: #27ae60;
}

.loss {
  color: #e74c3c;
}

.test-toggle-btn {
  position: fixed;
  top: 60px;
  right: 10px;
  width: 40px;
  height: 40px;
  background: #4a9f6e;
  border: 2px solid #27ae60;
  border-radius: 50%;
  color: white;
  font-size: 16px;
  cursor: pointer;
  z-index: 9998;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 滚动条样式 */
.test-console *::-webkit-scrollbar {
  width: 4px;
}

.test-console *::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
}

.test-console *::-webkit-scrollbar-thumb {
  background: rgba(255, 215, 0, 0.3);
  border-radius: 2px;
}
</style>