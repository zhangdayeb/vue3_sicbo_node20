<template>
  <div class="user-info">
    <!-- 移除所有 VIP 等级功能，保持空的占位 -->
    <div v-if="false" class="user-stats">
      <!-- 预留位置，暂时隐藏 -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// 预留接口，供外部调用（保持向后兼容）
const updateTotalBet = (amount: number) => {
  // 投注金额显示已移至控制按钮，这里保持空实现以兼容现有调用
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