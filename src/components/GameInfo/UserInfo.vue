.user-info {
  position: absolute;
  top: 10px;
  right: 70px; /* 给设置按钮留出空间 */
  display: flex;
  flex-direction: column;
  gap: 6px;
  z-index: 15;
}

.info-row {
  display: flex;
  gap: 8px;<template>
  <div class="user-info">
    <!-- 局号和余额并排显示 -->
    <div class="info-row">
      <div class="game-number-display">
        <div class="game-number-label">局号</div>
        <div class="game-number">{{ gameStore.gameState.gameNumber || generateGameNumber() }}</div>
      </div>
      
      <div class="balance-display">
        <div class="balance-label">余额</div>
        <div class="balance-amount">{{ gameStore.formattedBalance }}</div>
        <button class="refresh-btn" @click="refreshBalance">
          🔄
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'

const gameStore = useGameStore()

const formatCurrency = (amount: number) => {
  return `${gameStore.userBalance.currency} ${amount.toLocaleString()}`
}

// 生成局号：tableId + 年月日 + 序号
const generateGameNumber = () => {
  const tableId = 'T001' // 桌台ID
  const now = new Date()
  const dateStr = now.getFullYear().toString().slice(-2) + 
                  String(now.getMonth() + 1).padStart(2, '0') + 
                  String(now.getDate()).padStart(2, '0')
  const sequence = String(gameStore.gameState.round).padStart(4, '0')
  return `${tableId}${dateStr}${sequence}`
}

const refreshBalance = () => {
  // 刷新余额逻辑
  console.log('刷新余额')
  // 这里可以调用API获取最新余额
}
</script>

<style scoped>
.user-info {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  z-index: 15;
}

.game-number-display {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(52, 152, 219, 0.8);
  padding: 6px 10px;
  border-radius: 6px;
  backdrop-filter: blur(4px);
}

.game-number-label {
  color: white;
  font-size: 10px;
  opacity: 0.9;
}

.game-number {
  color: white;
  font-size: 11px;
  font-weight: bold;
  font-family: 'Courier New', monospace;
  letter-spacing: 0.5px;
}

.balance-display {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(0, 0, 0, 0.8);
  padding: 6px 10px;
  border-radius: 6px;
  backdrop-filter: blur(4px);
}

.balance-label {
  color: rgba(255, 255, 255, 0.8);
  font-size: 10px;
}

.balance-amount {
  color: #27ae60;
  font-size: 12px;
  font-weight: bold;
  min-width: 80px;
  text-align: right;
}

.refresh-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 3px 5px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 10px;
}

.refresh-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.total-bet {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(231, 76, 60, 0.8);
  padding: 4px 10px;
  border-radius: 6px;
  backdrop-filter: blur(4px);
}

.bet-label {
  color: white;
  font-size: 10px;
}

.bet-amount {
  color: white;
  font-size: 12px;
  font-weight: bold;
  min-width: 60px;
  text-align: right;
}
</style>