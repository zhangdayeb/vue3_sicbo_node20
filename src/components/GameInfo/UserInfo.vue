<template>
  <div class="user-info">
    <!-- 投注金额显示 - 简洁版 -->
    <div class="bet-amount-display">
      投注 {{ totalBetAmount.toLocaleString() }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'

const gameStore = useGameStore()

// 总投注额，这里可以从实际的投注状态获取
const totalBetAmount = ref(0)

// 这里可以添加更新总投注额的方法
const updateTotalBet = (amount: number) => {
  totalBetAmount.value = amount
}

// 暴露方法给外部调用
defineExpose({
  updateTotalBet
})
</script>

<style scoped>
.user-info {
  position: absolute;
  bottom: 60px; /* 向下移动，距离底部60px */
  right: 15px;
  z-index: 15;
}

.bet-amount-display {
  color: #00BCD4;
  font-size: 16px;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
  text-align: center;
  letter-spacing: 0.5px;
}
</style>