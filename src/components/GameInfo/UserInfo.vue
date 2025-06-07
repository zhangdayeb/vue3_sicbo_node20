<template>
  <div class="user-info">
    <!-- Naive UI 配置提供者 - 应用游戏主题 -->
    <n-config-provider :theme-overrides="gameTheme">
      <!-- VIP 状态显示（可选） -->
      <div v-if="showVipStatus" class="vip-status">
        <n-tag 
          type="warning" 
          size="small" 
          :bordered="false"
          class="vip-tag"
        >
          <template #icon>
            <n-icon><CrownIcon /></n-icon>
          </template>
          VIP {{ vipLevel }}
        </n-tag>
      </div>

      <!-- 玩家等级（可选） -->
      <div v-if="showPlayerLevel" class="player-level">
        <n-tag 
          type="info" 
          size="small" 
          :bordered="false"
          class="level-tag"
        >
          <template #icon>
            <n-icon><TrophyIcon /></n-icon>
          </template>
          Lv.{{ playerLevel }}
        </n-tag>
      </div>

      <!-- 连胜记录（可选） -->
      <div v-if="showWinStreak && winStreak > 0" class="win-streak">
        <n-tag 
          type="success" 
          size="small" 
          :bordered="false"
          class="streak-tag"
        >
          <template #icon>
            <n-icon><FlameIcon /></n-icon>
          </template>
          连胜 {{ winStreak }}
        </n-tag>
      </div>
    </n-config-provider>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { 
  NConfigProvider,
  NTag,
  NIcon
} from 'naive-ui'
import {
  Trophy as TrophyIcon,
  Flame as FlameIcon,
  Diamond as CrownIcon
} from '@vicons/ionicons5'

// 游戏主题配置
const gameTheme = {
  common: {
    successColor: '#4CAF50',
    warningColor: '#FF9800',
    infoColor: '#00BCD4',
    
    textColorBase: '#ffffff',
    
    borderRadius: '8px',
  },
  Tag: {
    color: 'rgba(13, 40, 24, 0.8)',
    textColor: '#ffffff',
    borderColor: 'rgba(255, 215, 0, 0.4)',
    fontWeight: '700',
    fontSize: '11px',
  }
}

// 可配置的显示选项
const showVipStatus = ref(true) // 是否显示VIP状态
const showPlayerLevel = ref(true) // 是否显示玩家等级
const showWinStreak = ref(true) // 是否显示连胜记录

// 示例数据（实际应该从用户状态获取）
const vipLevel = ref(3)
const playerLevel = ref(15)
const winStreak = ref(0) // 当前连胜次数，0表示无连胜

// 预留接口，供外部调用（保持向后兼容）
const updateTotalBet = (amount: number) => {
  // 投注金额显示已移至控制按钮，这里保持空实现以兼容现有调用
  console.log('UserInfo: updateTotalBet called with', amount, '- 已由控制按钮接管')
}

const updateVipLevel = (level: number) => {
  vipLevel.value = level
}

const updatePlayerLevel = (level: number) => {
  playerLevel.value = level
}

const updateWinStreak = (streak: number) => {
  winStreak.value = streak
}

// 暴露方法给外部调用
defineExpose({
  updateTotalBet, // 保持兼容性
  updateVipLevel,
  updatePlayerLevel,
  updateWinStreak
})
</script>

<style scoped>
.user-info {
  position: absolute;
  bottom: 130px; /* 调整位置避免与控制按钮重叠 */
  right: 15px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 15;
  align-items: flex-end;
}

.vip-status,
.player-level,
.win-streak {
  animation: slideInRight 0.3s ease-out;
}

.vip-tag {
  background: linear-gradient(135deg, #FF9800, #F57C00) !important;
  border: 1px solid rgba(255, 152, 0, 0.6) !important;
  backdrop-filter: blur(6px);
  box-shadow: 
    0 2px 8px rgba(255, 152, 0, 0.3),
    0 0 12px rgba(255, 152, 0, 0.2);
}

.level-tag {
  background: linear-gradient(135deg, #00BCD4, #00ACC1) !important;
  border: 1px solid rgba(0, 188, 212, 0.6) !important;
  backdrop-filter: blur(6px);
  box-shadow: 
    0 2px 8px rgba(0, 188, 212, 0.3),
    0 0 12px rgba(0, 188, 212, 0.2);
}

.streak-tag {
  background: linear-gradient(135deg, #4CAF50, #388E3C) !important;
  border: 1px solid rgba(76, 175, 80, 0.6) !important;
  backdrop-filter: blur(6px);
  box-shadow: 
    0 2px 8px rgba(76, 175, 80, 0.3),
    0 0 12px rgba(76, 175, 80, 0.2);
  animation: streakPulse 2s infinite ease-in-out;
}

@keyframes slideInRight {
  0% {
    opacity: 0;
    transform: translateX(20px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes streakPulse {
  0%, 100% {
    box-shadow: 
      0 2px 8px rgba(76, 175, 80, 0.3),
      0 0 12px rgba(76, 175, 80, 0.2);
  }
  50% {
    box-shadow: 
      0 4px 12px rgba(76, 175, 80, 0.5),
      0 0 20px rgba(76, 175, 80, 0.4);
  }
}

/* 响应式适配 */
@media (max-width: 375px) {
  .user-info {
    bottom: 120px;
    right: 12px;
    gap: 6px;
  }
}

@media (max-width: 320px) {
  .user-info {
    bottom: 115px;
    right: 10px;
    gap: 4px;
  }
}

/* 横屏适配 */
@media (orientation: landscape) and (max-height: 500px) {
  .user-info {
    bottom: 110px;
    right: 10px;
    gap: 4px;
  }
}

/* 深度样式覆盖 */
:deep(.n-tag) {
  font-weight: 700 !important;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

:deep(.n-tag .n-tag__content) {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 高对比度模式适配 */
@media (prefers-contrast: high) {
  .vip-tag,
  .level-tag,
  .streak-tag {
    border-width: 2px !important;
  }
}

/* 减少动画模式适配 */
@media (prefers-reduced-motion: reduce) {
  .vip-status,
  .player-level,
  .win-streak {
    animation: none !important;
  }
  
  .streak-tag {
    animation: none !important;
  }
}
</style>