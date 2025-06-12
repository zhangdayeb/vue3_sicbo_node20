<template>
  <div class="top-toolbar">
    <div class="left-section">
      <button class="back-btn" @click="goBack">
        ←
      </button>
      <div class="table-info">
        <span class="table-name">{{ safeTableName }}</span>
        <div class="bet-limits">
          限红: {{ safeBetLimits }}
        </div>
      </div>
    </div>
    
    <div class="right-section">
      <!-- 局号和余额两行布局 -->
      <div class="info-section">
        <!-- 局号行 -->
        <div class="info-row">
          <span class="info-label">局号</span>
          <span class="game-number">{{ safeGameNumber }}</span>
        </div>
        
        <!-- 余额行 -->
        <div class="info-row">
          <span class="info-label">余额</span>
          <span class="balance-amount">{{ safeBalance }}</span>
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
            <div class="menu-item">
              <span class="item-label">背景音乐</span>
              <label class="switch">
                <input type="checkbox" v-model="safeBgmEnabled" @change="handleBackgroundMusicToggle">
                <span class="slider"></span>
              </label>
            </div>
            <div class="menu-item">
              <span class="item-label">音效</span>
              <label class="switch">
                <input type="checkbox" v-model="safeSfxEnabled" @change="handleSoundEffectsToggle">
                <span class="slider"></span>
              </label>
            </div>
          
            <!-- 投注记录 -->
            <div class="menu-item clickable" @click="openBettingHistory">
              <span class="item-label">💰 投注记录</span>
              <span class="arrow">›</span>
            </div>
            
            <div class="menu-item clickable" @click="goToVip">
              <span class="item-label">👑 会员中心</span>
              <span class="arrow">›</span>
            </div>
            <div class="menu-item clickable" @click="contactServiceFeiJi">
              <span class="item-label">🎧 飞机客服</span>
              <span class="arrow">›</span>
            </div>
            <div class="menu-item clickable" @click="contactService">
              <span class="item-label">🎧 在线客服</span>
              <span class="arrow">›</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 投注记录弹窗 -->
    <BettingHistoryModal 
      v-if="showBettingHistory"
      v-model:show="showBettingHistory"
      @close="handleBettingHistoryClose"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, reactive } from 'vue'
import { useGameData } from '@/composables/useGameData'
import { useWebSocketEvents } from '@/composables/useWebSocketEvents'
import { useAudio } from '@/composables/useAudio'
import { useBettingHistoryStore } from '@/stores/bettingHistoryStore'
import BettingHistoryModal from '@/components/BettingHistory/BettingHistoryModal.vue'
import { parseGameParams } from '@/utils/urlParams'
import type { GameParams } from '@/types/api'

// 解析游戏参数
const gameParams = ref<GameParams>(parseGameParams())
const referrerUrl = document.referrer.split('?')[0] || 'about:blank'

console.log('🎮 TopToolbar 初始化')
console.log('📋 游戏参数:', gameParams.value)
console.log('🔗 来源URL:', referrerUrl)

// 真实数据源
const gameDataResult = useGameData()
const webSocketEventsResult = useWebSocketEvents()
const audioResult = useAudio()

console.log('📊 组合式函数加载结果:')
console.log('  - useGameData:', !!gameDataResult)
console.log('  - useWebSocketEvents:', !!webSocketEventsResult) 
console.log('  - useAudio:', !!audioResult)

// 解构真实数据
const {
  tableInfo = ref(null),
  userInfo = ref(null), 
  formattedBalance = ref('---'),
  refreshBalance = () => Promise.resolve(),
  canOperate = ref(false)
} = gameDataResult || {}

const {
  onBalanceUpdate = () => {}
} = webSocketEventsResult || {}

const {
  config: audioConfig,
  toggleMusic,
  toggleSfx, 
  loadConfig: loadAudioConfig
} = audioResult || {
  config: reactive({ enableMusic: false, enableSfx: false }),
  toggleMusic: () => {},
  toggleSfx: () => {},
  loadConfig: () => Promise.resolve()
}

// 投注记录store
const bettingHistoryStore = useBettingHistoryStore()

// 响应式状态
const showSettings = ref(false)
const settingsDropdown = ref<HTMLElement>()
const isRefreshing = ref(false)
const showBettingHistory = ref(false)

// 安全的计算属性 - 桌台名称
const safeTableName = computed(() => {
  try {
    const table = tableInfo.value
    if (table) {
      return table.table_title || 
             table.lu_zhu_name || 
             table.name || 
             table.tableName || 
             '骰宝桌台'
    }
    return '骰宝桌台'
  } catch (error) {
    console.error('❌ 获取桌台名称失败:', error)
    return '骰宝桌台'
  }
})

const safeBetLimits = computed(() => {
  try {
    const table = tableInfo.value
    if (table) {
      const limit = table.right_money_banker_player || 
                   table.limits?.max ||
                   table.max_bet ||
                   20000
      return `20-${limit.toLocaleString()}`
    }
    return '20-20,000'
  } catch (error) {
    console.error('❌ 获取投注限额失败:', error)
    return '20-20,000'
  }
})

const safeGameNumber = computed(() => {
  try {
    const table = tableInfo.value
    const user = userInfo.value
    
    if (table?.bureau_number) {
      return table.bureau_number
    }
    
    if (user?.current_game_number) {
      return user.current_game_number
    }
    
    return generateMockGameNumber()
  } catch (error) {
    console.error('❌ 获取游戏局号失败:', error)
    return generateMockGameNumber()
  }
})

const safeBalance = computed(() => {
  try {
    return formattedBalance.value || '余额获取中...'
  } catch (error) {
    console.error('❌ 获取用户余额失败:', error)
    return '余额获取中...'
  }
})

// 音频开关的安全访问
const safeBgmEnabled = computed({
  get: () => {
    try {
      return audioConfig.enableMusic || false
    } catch (error) {
      console.error('❌ 获取背景音乐状态失败:', error)
      return false
    }
  },
  set: (value: boolean) => {
    try {
      audioConfig.enableMusic = value
    } catch (error) {
      console.error('❌ 设置背景音乐状态失败:', error)
    }
  }
})

const safeSfxEnabled = computed({
  get: () => {
    try {
      return audioConfig.enableSfx || false
    } catch (error) {
      console.error('❌ 获取音效状态失败:', error)
      return false
    }
  },
  set: (value: boolean) => {
    try {
      audioConfig.enableSfx = value
    } catch (error) {
      console.error('❌ 设置音效状态失败:', error)
    }
  }
})

// 生成模拟游戏编号
const generateMockGameNumber = () => {
  const now = new Date()
  const year = now.getFullYear().toString().slice(-2)
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hour = String(now.getHours()).padStart(2, '0')
  const minute = String(now.getMinutes()).padStart(2, '0')
  const second = String(now.getSeconds()).padStart(2, '0')
  
  return `${year}${month}${day}${hour}${minute}${second}`
}

// 事件处理方法
const goBack = () => {
  try {
    console.log('🔙 用户点击返回按钮')
    
    if (referrerUrl && referrerUrl !== 'about:blank') {
      console.log('🔗 返回到来源页面:', referrerUrl)
      window.location.href = referrerUrl
    } else {
      console.log('📱 关闭当前窗口')
      window.close()
    }
  } catch (error) {
    console.error('❌ 返回操作失败:', error)
    window.close()
  }
}

const toggleSettings = () => {
  try {
    showSettings.value = !showSettings.value
    console.log('⚙️ 切换设置面板:', showSettings.value)
  } catch (error) {
    console.error('❌ 切换设置面板失败:', error)
  }
}

const handleRefreshBalance = async () => {
  try {
    if (isRefreshing.value) return
    
    console.log('💰 开始刷新余额')
    isRefreshing.value = true
    
    await refreshBalance()
    console.log('✅ 余额刷新完成')
  } catch (error) {
    console.error('❌ 刷新余额失败:', error)
  } finally {
    isRefreshing.value = false
  }
}

const openBettingHistory = async () => {
  // 1. 关闭设置菜单
  showSettings.value = false
  
  // 2. 检查数据是否需要刷新
  await bettingHistoryStore.forceRefresh() // 强制刷新
  
  // 3. 显示弹窗
  showBettingHistory.value = true
}

const handleBettingHistoryClose = () => {
  try {
    showBettingHistory.value = false
    console.log('📋 关闭投注记录')
  } catch (error) {
    console.error('❌ 关闭投注记录失败:', error)
  }
}

const handleBackgroundMusicToggle = () => {
  try {
    console.log('🎵 切换背景音乐:', safeBgmEnabled.value)
    if (toggleMusic && typeof toggleMusic === 'function') {
      toggleMusic()
    }
  } catch (error) {
    console.error('❌ 切换背景音乐失败:', error)
  }
}

const handleSoundEffectsToggle = () => {
  try {
    console.log('🔊 切换音效:', safeSfxEnabled.value)
    if (toggleSfx && typeof toggleSfx === 'function') {
      toggleSfx()
    }
  } catch (error) {
    console.error('❌ 切换音效失败:', error)
  }
}

const goToVip = () => {
  try {
    const realUserId = gameParams.value.user_id
    const realToken = gameParams.value.token
    const url = `${referrerUrl}#/pages/user/user?user_id=${realUserId}&token=${realToken}`
    console.log('🔗 会员中心URL:', url)
    window.location.href = url
  } catch (error) {
    console.error('❌ 跳转会员中心失败:', error)
  }
}

const contactServiceFeiJi = () => {
  try {
    console.log('联系客服',userInfo.value?.app_feiji_url )
    window.open(userInfo.value?.app_feiji_url, '_blank')
    showSettings.value = false
  } catch (error) {
    console.error('❌ 联系客服失败:', error)
  }
}

const contactService = () => {
  try {
    console.log('联系客服',userInfo.value?.app_kefu_url )
    window.open(userInfo.value?.app_kefu_url, '_blank')
    showSettings.value = false
  } catch (error) {
    console.error('❌ 联系客服失败:', error)
  }
}

const handleClickOutside = (event: Event) => {
  try {
    if (settingsDropdown.value && !settingsDropdown.value.contains(event.target as Node)) {
      showSettings.value = false
    }
  } catch (error) {
    console.error('❌ 处理点击外部事件失败:', error)
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  try {
    if (event.key === 'Escape') {
      if (showBettingHistory.value) {
        showBettingHistory.value = false
      } else if (showSettings.value) {
        showSettings.value = false
      }
    }
  } catch (error) {
    console.error('❌ 处理键盘事件失败:', error)
  }
}

// 组件生命周期
onMounted(async () => {
  try {
    console.log('🔧 TopToolbar 组件已挂载')
    
    // 加载音频配置
    if (loadAudioConfig && typeof loadAudioConfig === 'function') {
      try {
        await loadAudioConfig()
        console.log('✅ 音频配置加载成功')
      } catch (error) {
        console.warn('⚠️ 音频配置加载失败:', error)
      }
    }
    
    // 监听余额更新事件
    if (onBalanceUpdate && typeof onBalanceUpdate === 'function') {
      try {
        onBalanceUpdate((data: any) => {
          console.log('💰 WebSocket 余额更新:', data)
        })
        console.log('✅ 余额更新监听设置成功')
      } catch (error) {
        console.warn('⚠️ 余额更新监听设置失败:', error)
      }
    }
    
    // 初始化投注记录store
    try {
      console.log('🎯 初始化投注记录store')
      await bettingHistoryStore.init()
      console.log('✅ 投注记录store初始化成功')
    } catch (error) {
      console.warn('⚠️ 投注记录store初始化失败:', error)
    }
    
    // 添加事件监听器
    document.addEventListener('click', handleClickOutside)
    document.addEventListener('keydown', handleKeydown)
    
    console.log('✅ TopToolbar 初始化完成')
    
    // 输出当前状态用于调试
    console.log('📊 当前真实数据状态:')
    console.log('  - 桌台信息:', tableInfo?.value)
    console.log('  - 用户信息:', userInfo?.value)
    console.log('  - 格式化余额:', formattedBalance?.value)
    console.log('  - 音频配置:', audioConfig)
    console.log('  - 显示状态:')
    console.log('    * 桌台名称:', safeTableName.value)
    console.log('    * 投注限额:', safeBetLimits.value)
    console.log('    * 游戏局号:', safeGameNumber.value)
    console.log('    * 用户余额:', safeBalance.value)
    
  } catch (error) {
    console.error('❌ TopToolbar 挂载时发生错误:', error)
  }
})

onUnmounted(() => {
  try {
    document.removeEventListener('click', handleClickOutside)
    document.removeEventListener('keydown', handleKeydown)
    console.log('🔧 TopToolbar 组件已卸载')
  } catch (error) {
    console.error('❌ TopToolbar 卸载时发生错误:', error)
  }
})
</script>

<style scoped>
/* 容器：移除统一背景，改为定位容器 */
.top-toolbar {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0;
  color: white;
  z-index: 15;
  /* 移除原有的背景、边框、模糊效果 */
}

/* 左侧区域：独立背景和圆角 */
.left-section {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 0 0 auto;
  overflow: hidden;
  /* 新增：独立背景样式 */
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 0 12px;
  height: 40px;
  min-width: 200px;
}

/* 右侧区域：独立背景和圆角 */
.right-section {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
  /* 新增：独立背景样式 */
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 0 12px;
  height: 40px;
}

.back-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 6px;
  padding: 0;
  height: 28px;
  min-width: 32px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.table-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  flex: 1;
}

.table-name {
  color: white;
  font-weight: 500;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bet-limits {
  color: rgba(255, 255, 255, 0.7);
  font-size: 10px;
  white-space: nowrap;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: flex-end;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 16px;
}

.info-label {
  color: rgba(255, 255, 255, 0.6);
  font-size: 10px;
  min-width: 24px;
  text-align: right;
}

.game-number {
  color: #3498db;
  font-weight: 600;
  font-size: 11px;
  min-width: 80px;
  text-align: right;
  font-family: 'Courier New', monospace;
}

.balance-amount {
  color: #f1c40f;
  font-weight: 600;
  font-size: 11px;
  min-width: 60px;
  text-align: right;
  font-family: 'Courier New', monospace;
}

.refresh-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  border-radius: 50%;
}

.refresh-btn:hover:not(:disabled) {
  color: white;
  background: rgba(255, 255, 255, 0.1);
  transform: rotate(90deg);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.settings-dropdown {
  position: relative;
}

.settings-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  padding: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  transition: all 0.2s ease;
}

.settings-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.hamburger-menu {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 12px;
}

.hamburger-menu span {
  display: block;
  height: 1.5px;
  width: 100%;
  background: white;
  border-radius: 1px;
  transition: all 0.2s ease;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: rgba(0, 0, 0, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  backdrop-filter: blur(10px);
  min-width: 180px;
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
  transition: all 0.2s ease;
  pointer-events: none;
  z-index: 1000;
}

.dropdown-menu.show {
  opacity: 1;
  transform: translateY(0) scale(1);
  pointer-events: auto;
}

.menu-section {
  padding: 10px;
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 4px;
  padding-left: 4px;
  padding-right: 4px;
}

.menu-item.clickable:hover {
  background: rgba(255, 255, 255, 0.1);
}

.item-label {
  color: white;
  font-size: 13px;
  flex: 1;
}

.arrow {
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
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

/* 响应式设计 */
@media (max-width: 768px) {
  .top-toolbar {
    height: 36px;
  }
  
  .left-section {
    height: 36px;
    padding: 0 10px;
    min-width: 160px;
  }
  
  .right-section {
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
    min-width: 140px;
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
    right: -10px;
  }
}
</style>