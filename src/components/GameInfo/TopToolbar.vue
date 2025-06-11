<template>
  <div class="top-toolbar">
    <div class="left-section">
      <button class="back-btn" @click="goBack">
        ←
      </button>
      <div class="table-info">
        <span class="table-name">{{ tableInfo?.table_title || '加载中...' }}</span>
        <div class="bet-limits">
          限红: {{ tableInfo?.right_money_banker_player || '---' }}
        </div>
      </div>
    </div>
    
    <div class="right-section">
      <!-- 局号和余额两行布局 -->
      <div class="info-section">
        <!-- 局号行 -->
        <div class="info-row">
          <span class="info-label">局号</span>
          <span class="game-number">{{ gameNumber }}</span>
        </div>
        
        <!-- 余额行 -->
        <div class="info-row">
          <span class="info-label">余额</span>
          <span class="balance-amount">{{ formattedBalance }}</span>
          <button class="refresh-btn" @click="handleRefreshBalance" :disabled="isRefreshing">
            {{ isRefreshing ? '⏳' : '🔄' }}
          </button>
        </div>
      </div>
      
      <!-- 设置按钮 -->
      <div class="settings-dropdown" ref="settingsDropdown">
        <button class="settings-btn" @click="toggleSettings">
          <div class="hamburger-menu">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </button>
        
        <!-- 下拉菜单 -->
        <div class="dropdown-menu" :class="{ 'show': showSettings }">
          <!-- 音效设置 -->
          <div class="menu-section">
            <div class="section-title">音效设置</div>
            <div class="menu-item">
              <span class="item-label">背景音乐</span>
              <label class="switch">
                <input type="checkbox" v-model="backgroundMusicEnabled" @change="handleBackgroundMusicToggle">
                <span class="slider"></span>
              </label>
            </div>
            <div class="menu-item">
              <span class="item-label">音效</span>
              <label class="switch">
                <input type="checkbox" v-model="soundEffectsEnabled" @change="handleSoundEffectsToggle">
                <span class="slider"></span>
              </label>
            </div>
          </div>
          
          <!-- 分割线 -->
          <div class="menu-divider"></div>
          
          <!-- 功能链接 -->
          <div class="menu-section">
            <div class="section-title">功能</div>
            <!-- 🔥 修改：投注记录点击事件 -->
            <div class="menu-item clickable" @click="openBettingHistory">
              <span class="item-label">💰 投注记录</span>
              <span class="arrow">›</span>
            </div>
            <div class="menu-item clickable" @click="goToVip">
              <span class="item-label">👑 会员中心</span>
              <span class="arrow">›</span>
            </div>
            <div class="menu-item clickable" @click="contactService">
              <span class="item-label">🎧 客服</span>
              <span class="arrow">›</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 🔥 新增：投注记录弹窗 -->
    <BettingHistoryModal 
      v-model:show="showBettingHistory"
      @close="handleBettingHistoryClose"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useGameData } from '@/composables/useGameData'
import { useWebSocketEvents } from '@/composables/useWebSocketEvents'
import { useAudio } from '@/composables/useAudio'
import { useBettingHistoryStore } from '@/stores/bettingHistoryStore' // 🔥 新增：导入投注记录store
import BettingHistoryModal from '@/components/BettingHistory/BettingHistoryModal.vue' // 🔥 新增：导入投注记录弹窗
import { parseGameParams } from '@/utils/urlParams'
import type { GameParams } from '@/types/api'

// 解析URL参数
const gameParams = ref<GameParams>(parseGameParams())
const referrerUrl = document.referrer.split('?')[0]
console.log('来路地址:', referrerUrl);

// 数据访问
const { userInfo, tableInfo, formattedBalance, refreshBalance } = useGameData()
const realUserId = userInfo.value?.user_id || gameParams.value.user_id
const realToken = gameParams.value.token

// 🔥 新增：投注记录store
const bettingHistoryStore = useBettingHistoryStore()

// 音频系统集成
const { 
  config: audioConfig, 
  toggleMusic, 
  toggleSfx, 
  loadConfig: loadAudioConfig,
  getAudioInfo
} = useAudio()

// WebSocket 事件监听
const { onBalanceUpdate } = useWebSocketEvents()

const showSettings = ref(false)
const settingsDropdown = ref<HTMLElement>()
const isRefreshing = ref(false)

// 🔥 新增：投注记录弹窗控制
const showBettingHistory = ref(false)

// 音频设置的响应式计算属性
const backgroundMusicEnabled = computed({
  get: () => audioConfig.enableMusic,
  set: (value) => {
    if (value !== audioConfig.enableMusic) {
      toggleMusic()
    }
  }
})

const soundEffectsEnabled = computed({
  get: () => audioConfig.enableSfx,
  set: (value) => {
    if (value !== audioConfig.enableSfx) {
      toggleSfx()
    }
  }
})

// 计算局号 - 可以从多个来源获取
const gameNumber = computed(() => {
  // 优先从 tableInfo 获取，如果没有则显示默认值
  return tableInfo.value?.bureau_number || 'T001250115001'
})

// 音频开关处理方法
const handleBackgroundMusicToggle = () => {
  console.log('🎵 用户切换背景音乐:', audioConfig.enableMusic ? '开启' : '关闭')
  // 由于使用了 computed 的 setter，toggleMusic() 已经被调用
}

const handleSoundEffectsToggle = () => {
  console.log('🎵 用户切换音效:', audioConfig.enableSfx ? '开启' : '关闭')
  // 由于使用了 computed 的 setter，toggleSfx() 已经被调用
}

const goBack = () => {
  console.log('返回上级页面')
  const url = referrerUrl+'#/pages/index/index?user_id='+realUserId+'&token='+realToken
  window.location.href = url
}

const toggleSettings = () => {
  showSettings.value = !showSettings.value
}

// 处理刷新余额
const handleRefreshBalance = async () => {
  if (isRefreshing.value) return
  
  try {
    isRefreshing.value = true
    await refreshBalance()
  } catch (error) {
    console.error('刷新余额失败:', error)
  } finally {
    isRefreshing.value = false
  }
}

// 🔥 新增：打开投注记录弹窗
const openBettingHistory = () => {
  console.log('🎯 打开投注记录弹窗')
  
  // 关闭设置菜单
  showSettings.value = false
  
  // 显示投注记录弹窗
  showBettingHistory.value = true
  
  // 初始化投注记录store（如果还没有初始化）
  if (!bettingHistoryStore.records.length && !bettingHistoryStore.loadingState.loading) {
    console.log('🎯 初始化投注记录数据')
    bettingHistoryStore.init()
  }
}

// 🔥 新增：投注记录弹窗关闭处理
const handleBettingHistoryClose = () => {
  console.log('🎯 投注记录弹窗已关闭')
  showBettingHistory.value = false
}

// 功能跳转
const goToVip = () => {
  console.log('跳转到会员中心')
  showSettings.value = false
  const url = referrerUrl+'#/pages/user/user?user_id='+realUserId+'&token='+realToken
  window.location.href = url
}

const contactService = () => {
  console.log('联系客服')
  showSettings.value = false
}

// 点击外部关闭下拉菜单
const handleClickOutside = (event: Event) => {
  if (settingsDropdown.value && !settingsDropdown.value.contains(event.target as Node)) {
    showSettings.value = false
  }
}

// 🔥 新增：键盘事件处理（ESC关闭弹窗）
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    if (showBettingHistory.value) {
      showBettingHistory.value = false
    } else if (showSettings.value) {
      showSettings.value = false
    }
  }
}

// 监听 WebSocket 余额更新
onBalanceUpdate((data) => {
  console.log('💰 余额自动更新:', data.balance)
  // 余额会通过 WebSocket 自动更新到 useGameData 中
})

// 组件挂载时加载音频配置
onMounted(() => {
  console.log('🔧 TopToolbar 组件已挂载')
  
  // 加载音频配置
  loadAudioConfig()
  
  // 🔥 新增：初始化投注记录store
  console.log('🎯 初始化投注记录store')
  bettingHistoryStore.init()
  
  // 开发模式下输出音频状态
  if (import.meta.env.DEV) {
    console.log('🎵 当前音频设置状态:', getAudioInfo())
    console.log('🎯 投注记录store状态:', {
      records: bettingHistoryStore.records.length,
      loading: bettingHistoryStore.loadingState.loading,
      error: bettingHistoryStore.loadingState.error
    })
  }
  
  // 添加事件监听器
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  // 清理事件监听器
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeydown)
  
  console.log('🔧 TopToolbar 组件已卸载')
})

// 🔥 新增：开发模式下暴露调试信息
if (import.meta.env.DEV) {
  (window as any).debugTopToolbar = {
    showBettingHistory,
    showSettings,
    bettingHistoryStore,
    openBettingHistory,
    handleBettingHistoryClose,
    gameParams: gameParams.value,
    userInfo: userInfo.value,
    tableInfo: tableInfo.value
  }
}
</script>

<style scoped>
.top-toolbar {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  height: 40px;
  background: rgba(0, 0, 0, 0.85);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  color: white;
  backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 15;
}

.left-section {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  overflow: hidden;
}

.right-section {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.back-btn {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: white;
  padding: 4px 8px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 13px;
  line-height: 1;
  height: 28px;
  min-width: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-weight: 500;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.35);
}

.table-info {
  overflow: hidden;
  min-width: 0;
}

.table-name {
  font-weight: 700;
  font-size: 13px;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #ffffff;
}

.bet-limits {
  font-size: 10px;
  opacity: 0.75;
  line-height: 1.1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #e8e8e8;
  font-weight: 400;
}

/* 局号和余额信息区域 */
.info-section {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-right: 8px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.info-label {
  color: rgba(255, 255, 255, 0.85);
  font-size: 10px;
  min-width: 24px;
  font-weight: 500;
}

.game-number {
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
  font-family: 'Courier New', monospace;
  letter-spacing: 0.5px;
  line-height: 1.1;
}

.balance-amount {
  color: #4CAF50;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.1;
}

.refresh-btn {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: white;
  padding: 2px 4px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 9px;
  line-height: 1;
  transition: all 0.2s ease;
  margin-left: 3px;
}

.refresh-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.35);
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 设置下拉菜单 */
.settings-dropdown {
  position: relative;
}

.settings-btn {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: white;
  padding: 0;
  border-radius: 5px;
  cursor: pointer;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.settings-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.35);
}

/* 三条横线样式 */
.hamburger-menu {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 12px;
}

.hamburger-menu span {
  width: 100%;
  height: 1.5px;
  background: white;
  border-radius: 1px;
  transition: all 0.3s ease;
}

/* 下拉菜单 */
.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 6px;
  background: rgba(0, 0, 0, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  min-width: 180px;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-10px);
  transition: all 0.3s ease;
  z-index: 1000;
  backdrop-filter: blur(10px);
}

.dropdown-menu.show {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.menu-section {
  padding: 10px 0;
}

.section-title {
  color: rgba(255, 255, 255, 0.6);
  font-size: 10px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 0 12px;
  margin-bottom: 6px;
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  color: white;
  font-size: 12px;
  transition: background 0.2s;
}

.menu-item.clickable {
  cursor: pointer;
}

.menu-item.clickable:hover {
  background: rgba(255, 255, 255, 0.1);
}

.item-label {
  display: flex;
  align-items: center;
  gap: 6px;
}

.arrow {
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
}

.menu-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0 10px;
}

/* 开关按钮样式 */
.switch {
  position: relative;
  display: inline-block;
  width: 32px;
  height: 16px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.3);
  transition: 0.3s;
  border-radius: 16px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 12px;
  width: 12px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #3498db;
}

input:checked + .slider:before {
  transform: translateX(16px);
}

/* 🔥 新增：投注记录弹窗样式覆盖 */
:deep(.betting-history-modal) {
  z-index: 2000; /* 确保在顶部工具栏之上 */
}

/* 响应式设计 */
@media (max-width: 768px) {
  .top-toolbar {
    height: 36px;
    padding: 0 10px;
  }
  
  .back-btn {
    height: 24px;
    min-width: 28px;
    font-size: 12px;
  }
  
  .settings-btn {
    width: 24px;
    height: 24px;
  }
  
  .info-section {
    gap: 1px;
  }
  
  .game-number,
  .balance-amount {
    font-size: 10px;
  }
  
  .info-label {
    font-size: 9px;
    min-width: 20px;
  }
}

@media (max-width: 480px) {
  .left-section {
    gap: 8px;
  }
  
  .right-section {
    gap: 6px;
  }
  
  .table-name {
    font-size: 12px;
  }
  
  .bet-limits {
    font-size: 9px;
  }
  
  .dropdown-menu {
    min-width: 160px;
    right: -10px; /* 向左偏移，避免超出屏幕 */
  }
}

/* 🔥 新增：动画效果 */
@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 弹窗打开时的动画 */
:deep(.betting-history-modal .n-modal) {
  animation: fadeInScale 0.3s ease-out;
}
</style>