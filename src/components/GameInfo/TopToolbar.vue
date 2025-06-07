<template>
  <div class="top-toolbar">
    <!-- Naive UI 配置提供者 - 最小化配置 -->
    <n-config-provider :theme-overrides="gameTheme">
      <div class="left-section">
        <!-- 返回按钮 - 使用 Naive UI 按钮 -->
        <n-button 
          class="back-btn" 
          @click="goBack"
          size="small"
          tertiary
        >
          ←
        </n-button>
        
        <div class="table-info">
          <span class="table-name">{{ gameStore.settings.tableName }}</span>
          <div class="bet-limits">
            限额: {{ gameStore.settings.limits.min }} - {{ gameStore.settings.limits.max }}
          </div>
        </div>
      </div>
      
      <div class="right-section">
        <!-- 局号和余额两行布局 - 保持原有设计 -->
        <div class="info-section">
          <!-- 局号行 -->
          <div class="info-row">
            <span class="info-label">局号</span>
            <span class="game-number">{{ gameStore.gameState.gameNumber || generateGameNumber() }}</span>
          </div>
          
          <!-- 余额行 -->
          <div class="info-row">
            <span class="info-label">余额</span>
            <span class="balance-amount">{{ gameStore.formattedBalance }}</span>
            <!-- 刷新按钮 - 使用 Naive UI 按钮 -->
            <n-button 
              class="refresh-btn" 
              @click="refreshBalance"
              size="tiny"
              tertiary
            >
              🔄
            </n-button>
          </div>
        </div>
        
        <!-- 设置按钮 - 使用 Naive UI 下拉菜单 -->
        <div class="settings-dropdown" ref="settingsDropdown">
          <n-dropdown 
            :options="dropdownOptions" 
            @select="handleDropdownSelect"
            trigger="click"
            placement="bottom-end"
          >
            <n-button 
              class="settings-btn"
              size="small"
              tertiary
            >
              <div class="hamburger-menu">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </n-button>
          </n-dropdown>
        </div>
      </div>
      
      <!-- 设置弹窗 - 使用 Naive UI Modal -->
      <n-modal 
        v-model:show="showSettings"
        preset="card"
        title="游戏设置"
        :style="{ width: 'min(90vw, 320px)' }"
        size="small"
        :bordered="false"
        class="settings-modal"
      >
        <div class="settings-content">
          <!-- 音效设置 -->
          <div class="menu-section">
            <div class="section-title">音效设置</div>
            <div class="menu-item">
              <span class="item-label">背景音乐</span>
              <n-switch v-model:value="settings.backgroundMusic" size="small" />
            </div>
            <div class="menu-item">
              <span class="item-label">音效</span>
              <n-switch v-model:value="settings.soundEffects" size="small" />
            </div>
          </div>
          
          <!-- 分割线 -->
          <n-divider />
          
          <!-- 功能链接 -->
          <div class="menu-section">
            <div class="section-title">功能</div>
            <n-space vertical>
              <n-button block @click="goToRecharge" size="small" type="primary">
                💰 充值
              </n-button>
              <n-button block @click="goToVip" size="small" type="info">
                👑 会员中心
              </n-button>
              <n-button block @click="contactService" size="small" type="warning">
                🎧 客服
              </n-button>
              <n-button block @click="goToHelp" size="small" type="default">
                ❓ 帮助
              </n-button>
            </n-space>
          </div>
        </div>
      </n-modal>
    </n-config-provider>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, h } from 'vue'
import { 
  NConfigProvider,
  NButton,
  NDropdown,
  NModal,
  NSwitch,
  NDivider,
  NSpace,
  type DropdownOption
} from 'naive-ui'
import { useGameStore } from '@/stores/gameStore'

// 最小化主题配置，保持原有样式
const gameTheme = {
  common: {
    textColorBase: '#ffffff',
    primaryColor: '#27ae60',
  },
  Button: {
    textColor: '#ffffff',
    colorTertiary: 'rgba(255, 255, 255, 0.15)',
    colorTertiaryHover: 'rgba(255, 255, 255, 0.25)',
    borderRadius: '5px',
  },
  Modal: {
    color: 'rgba(0, 0, 0, 0.9)',
    textColor: 'rgba(255, 255, 255, 0.95)',
  },
  Dropdown: {
    color: 'rgba(0, 0, 0, 0.95)',
    textColor: 'rgba(255, 255, 255, 0.95)',
  }
}

const gameStore = useGameStore()
const showSettings = ref(false)

// 设置选项
const settings = reactive({
  backgroundMusic: true,
  soundEffects: true
})

// 下拉菜单选项
const dropdownOptions = computed<DropdownOption[]>(() => [
  {
    label: '设置',
    key: 'settings'
  },
  {
    type: 'divider',
    key: 'd1'
  },
  {
    label: '💰 充值',
    key: 'recharge'
  },
  {
    label: '👑 会员中心',
    key: 'vip'
  },
  {
    label: '🎧 客服',
    key: 'service'
  },
  {
    label: '❓ 帮助',
    key: 'help'
  }
])

// 生成局号
const generateGameNumber = () => {
  const tableId = 'T001'
  const now = new Date()
  const dateStr = now.getFullYear().toString().slice(-2) + 
                  String(now.getMonth() + 1).padStart(2, '0') + 
                  String(now.getDate()).padStart(2, '0')
  const sequence = String(gameStore.gameState.round).padStart(4, '0')
  return `${tableId}${dateStr}${sequence}`
}

const goBack = () => {
  console.log('返回上级页面')
}

const refreshBalance = () => {
  console.log('刷新余额')
  gameStore.updateBalance(gameStore.userBalance.total)
}

const handleDropdownSelect = (key: string) => {
  switch (key) {
    case 'settings':
      showSettings.value = true
      break
    case 'recharge':
      goToRecharge()
      break
    case 'vip':
      goToVip()
      break
    case 'service':
      contactService()
      break
    case 'help':
      goToHelp()
      break
  }
}

// 功能跳转
const goToRecharge = () => {
  console.log('跳转到充值页面')
  showSettings.value = false
}

const goToVip = () => {
  console.log('跳转到会员中心')
  showSettings.value = false
}

const contactService = () => {
  console.log('联系客服')
  showSettings.value = false
}

const goToHelp = () => {
  console.log('跳转到帮助页面')
  showSettings.value = false
}
</script>

<style scoped>
/* 保持原有的样式设计 */
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
  background: rgba(255, 255, 255, 0.15) !important;
  border: 1px solid rgba(255, 255, 255, 0.25) !important;
  color: white !important;
  padding: 4px 8px !important;
  border-radius: 5px !important;
  font-size: 13px !important;
  line-height: 1 !important;
  height: 28px !important;
  min-width: 32px !important;
  font-weight: 500 !important;
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

/* 局号和余额信息区域 - 保持原有设计 */
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
  background: rgba(255, 255, 255, 0.15) !important;
  border: 1px solid rgba(255, 255, 255, 0.25) !important;
  color: white !important;
  padding: 2px 4px !important;
  border-radius: 3px !important;
  font-size: 9px !important;
  line-height: 1 !important;
  margin-left: 3px !important;
}

/* 设置按钮 - 保持原有的汉堡菜单样式 */
.settings-btn {
  background: rgba(255, 255, 255, 0.15) !important;
  border: 1px solid rgba(255, 255, 255, 0.25) !important;
  color: white !important;
  padding: 0 !important;
  border-radius: 5px !important;
  width: 28px !important;
  height: 28px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

/* 三条横线样式 - 保持原有设计 */
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

/* 设置内容 */
.settings-content {
  padding: 8px 0;
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
  margin-bottom: 6px;
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
  color: white;
  font-size: 12px;
}

.item-label {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 深度样式覆盖 */
:deep(.n-button) {
  transition: all 0.2s ease !important;
}

:deep(.n-button:hover) {
  background: rgba(255, 255, 255, 0.25) !important;
  border-color: rgba(255, 255, 255, 0.35) !important;
}

:deep(.n-modal .n-card) {
  background: rgba(0, 0, 0, 0.95) !important;
  border: 1px solid #2d5a42 !important;
  backdrop-filter: blur(12px) !important;
}

:deep(.n-dropdown-menu) {
  background: rgba(0, 0, 0, 0.95) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  backdrop-filter: blur(10px) !important;
}
</style>