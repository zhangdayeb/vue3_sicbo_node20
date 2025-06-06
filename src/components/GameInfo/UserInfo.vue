<template>
  <div class="user-info">
    <div class="balance-display">
      <div class="balance-label">余额</div>
      <div class="balance-amount">{{ gameStore.formattedBalance }}</div>
      <button class="refresh-btn" @click="refreshBalance">
        🔄
      </button>
    </div>
    
    <div class="total-bet" v-if="totalBet > 0">
      <div class="bet-label">本局投注</div>
      <div class="bet-amount">{{ formatCurrency(totalBet) }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useGameStore } from '@/stores/gameStore'

const gameStore = useGameStore()
const totalBet = ref(0)

const formatCurrency = (amount: number) => {
  return `${gameStore.userBalance.currency} ${amount.toLocaleString()}`
}

const refreshBalance = () => {
  // 刷新余额逻辑
  console.log('刷新余额')
  // 这里可以调用API获取最新余额
}

// 监听来自Cocos的投注更新
const listenToBetUpdates = () => {
  window.addEventListener('cocos-to-vue-betUpdate', (event: any) => {
    totalBet.value = event.detail.totalBet || 0
  })
}

// 初始化监听
listenToBetUpdates()
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