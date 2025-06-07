<template>
  <div class="user-info">
    <!-- 移除投注金额显示，只保留必要的用户信息 -->
    <!-- 这里可以添加其他用户相关信息，如VIP等级、昵称等 -->
    <div v-if="false" class="user-stats">
      <!-- 预留位置，暂时隐藏 -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useGameStore } from '@/stores/gameStore'

const gameStore = useGameStore()

// 移除投注金额相关的响应式数据和方法
// const totalBetAmount = ref(0)

// 预留接口，供外部调用（保持向后兼容）
const updateTotalBet = (amount: number) => {
  // 不再更新显示，由控制按钮统一管理
  console.log('UserInfo: updateTotalBet called with', amount, '- 已由控制按钮接管')
}

// 暴露方法给外部调用
defineExpose({
  updateTotalBet
})
</script>

<style scoped>
.user-info {
  position: absolute;
  bottom: 60px;
  right: 15px;
  z-index: 15;
  /* 预留位置，当前为空 */
}

.user-stats {
  /* 预留样式 */
  display: none;
}
</style>