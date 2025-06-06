<template>
  <div class="top-toolbar">
    <div class="left-section">
      <button class="back-btn" @click="goBack">
        <
      </button>
      <div class="table-info">
        <span class="table-name">{{ gameStore.settings.tableName }}</span>
        <div class="bet-limits">
          限额: {{ gameStore.settings.limits.min }} - {{ gameStore.settings.limits.max }}
        </div>
      </div>
    </div>
    
    <div class="center-section">
      <!-- 移除第x局显示，节省空间 -->
    </div>
    
    <div class="right-section">
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
                <input type="checkbox" v-model="settings.backgroundMusic">
                <span class="slider"></span>
              </label>
            </div>
            <div class="menu-item">
              <span class="item-label">音效</span>
              <label class="switch">
                <input type="checkbox" v-model="settings.soundEffects">
                <span class="slider"></span>
              </label>
            </div>
          </div>
          
          <!-- 分割线 -->
          <div class="menu-divider"></div>
          
          <!-- 功能链接 -->
          <div class="menu-section">
            <div class="section-title">功能</div>
            <div class="menu-item clickable" @click="goToRecharge">
              <span class="item-label">💰 充值</span>
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
            <div class="menu-item clickable" @click="goToHelp">
              <span class="item-label">❓ 帮助</span>
              <span class="arrow">›</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useGameStore } from '@/stores/gameStore'

const gameStore = useGameStore()
const showSettings = ref(false)
const settingsDropdown = ref<HTMLElement>()

// 设置选项
const settings = reactive({
  backgroundMusic: true,
  soundEffects: true
})

const goBack = () => {
  // 返回逻辑
  console.log('返回上级页面')
}

const toggleSettings = () => {
  showSettings.value = !showSettings.value
}

// 功能跳转
const goToRecharge = () => {
  console.log('跳转到充值页面')
  showSettings.value = false
  // 这里可以跳转到充值页面
  // window.open('/recharge', '_blank')
}

const goToVip = () => {
  console.log('跳转到会员中心')
  showSettings.value = false
  // window.open('/vip', '_blank')
}

const contactService = () => {
  console.log('联系客服')
  showSettings.value = false
  // 可以打开客服聊天窗口或跳转到客服页面
  // window.open('/service', '_blank')
}

const goToHelp = () => {
  console.log('跳转到帮助页面')
  showSettings.value = false
  // window.open('/help', '_blank')
}

// 点击外部关闭下拉菜单
const handleClickOutside = (event: Event) => {
  if (settingsDropdown.value && !settingsDropdown.value.contains(event.target as Node)) {
    showSettings.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.top-toolbar {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  height: 50px;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  color: white;
  backdrop-filter: blur(4px);
}

.left-section {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  max-width: 60%; /* 限制左侧区域宽度 */
}

.center-section {
  display: flex;
  justify-content: center;
  flex: 0; /* 中间区域不占空间 */
}

.right-section {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  flex: 0;
  position: relative; /* 确保设置按钮定位正确 */
  width: 80px; /* 给设置按钮固定宽度 */
}

.back-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.2s;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.table-info {
  display: flex;
  flex-direction: column;
}

.table-name {
  font-weight: bold;
  font-size: 14px;
}

.bet-limits {
  font-size: 10px;
  opacity: 0.8;
}

.round-info {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(52, 152, 219, 0.3);
  padding: 8px 16px;
  border-radius: 16px;
  border: 1px solid rgba(52, 152, 219, 0.5);
}

.round-label {
  color: rgba(255, 255, 255, 0.9);
  font-size: 12px;
}

.round-number {
  color: #3498db;
  font-size: 16px;
  font-weight: bold;
  min-width: 24px;
  text-align: center;
}

.settings-dropdown {
  position: relative;
}

.settings-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 8px;
  border-radius: 50%;
  cursor: pointer;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.settings-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* 三条横线样式 */
.hamburger-menu {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 14px;
}

.hamburger-menu span {
  width: 100%;
  height: 2px;
  background: white;
  border-radius: 1px;
  transition: all 0.3s ease;
}

/* 下拉菜单 */
.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: rgba(0, 0, 0, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  min-width: 200px;
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
  padding: 12px 0;
}

.section-title {
  color: rgba(255, 255, 255, 0.6);
  font-size: 11px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 0 16px;
  margin-bottom: 8px;
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  color: white;
  font-size: 14px;
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
  gap: 8px;
}

.arrow {
  color: rgba(255, 255, 255, 0.6);
  font-size: 16px;
}

.menu-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0 12px;
}

/* 开关按钮样式 */
.switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 20px;
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
  border-radius: 20px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
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
  transform: translateX(20px);
}
</style>