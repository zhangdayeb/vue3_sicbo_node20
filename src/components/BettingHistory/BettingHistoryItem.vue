<template>
  <div class="betting-record-item" :class="recordClasses" @click="handleClick">
    <!-- 头部信息 -->
    <div class="record-header">
      <div class="header-left">
        <div class="game-number">{{ record.game_number }}</div>
        <div class="bet-time">{{ record.formattedBetTime }}</div>
      </div>
      <div class="header-right">
        <div class="status-badge" :style="{ backgroundColor: record.statusColor }">
          {{ record.statusText }}
        </div>
        <n-icon v-if="canExpand" class="expand-icon" :class="{ 'expanded': expanded }">
          <svg viewBox="0 0 24 24">
            <path fill="currentColor" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
          </svg>
        </n-icon>
      </div>
    </div>

    <!-- 主要信息 -->
    <div class="record-main">
      <div class="amount-section">
        <div class="amount-row">
          <span class="amount-label">投注</span>
          <span class="amount-value bet-amount">¥{{ formatMoney(record.total_bet_amount) }}</span>
        </div>
        <div class="amount-row">
          <span class="amount-label">中奖</span>
          <span class="amount-value win-amount">¥{{ formatMoney(record.total_win_amount) }}</span>
        </div>
        <div class="amount-row">
          <span class="amount-label">净额</span>
          <span 
            class="amount-value net-amount"
            :class="{ 'profit': record.isProfit, 'loss': record.isLoss }"
          >
            {{ record.formattedNetAmount }}
          </span>
        </div>
      </div>

      <!-- 开奖结果 -->
      <div v-if="record.dice_results && record.dice_results.length === 3" class="dice-section">
        <div class="dice-label">开奖</div>
        <div class="dice-container">
          <div 
            v-for="(dice, index) in record.dice_results" 
            :key="index" 
            class="dice-item"
            :class="`dice-${dice}`"
          >
            {{ dice }}
          </div>
          <div class="dice-total">
            总: {{ record.dice_total }}
          </div>
        </div>
      </div>
    </div>

    <!-- 投注详情 (可展开) -->
    <div v-if="expanded && canExpand" class="record-details">
      <div class="details-title">投注详情</div>
      <div class="bet-details-list">
        <div 
          v-for="(detail, index) in record.bet_details" 
          :key="index" 
          class="bet-detail-item"
          :class="{ 'win': detail.is_win }"
        >
          <div class="detail-left">
            <span class="bet-type-name">{{ detail.bet_type_name }}</span>
            <span class="bet-odds">{{ detail.odds }}</span>
          </div>
          <div class="detail-right">
            <div class="detail-amount">¥{{ formatMoney(detail.bet_amount) }}</div>
            <div v-if="detail.is_win" class="detail-win">
              +¥{{ formatMoney(detail.win_amount) }}
            </div>
          </div>
        </div>
      </div>
      
      <!-- 结算信息 -->
      <div v-if="record.settle_time" class="settle-info">
        <div class="settle-time">
          <span class="settle-label">结算时间:</span>
          <span class="settle-value">{{ record.formattedSettleTime }}</span>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div v-if="showActions" class="record-actions">
      <n-space size="small">
        <n-button 
          size="small" 
          quaternary 
          @click.stop="handleViewDetail"
          class="action-btn detail-btn"
        >
          <template #icon>
            <n-icon>
              <svg viewBox="0 0 24 24">
                <path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
              </svg>
            </n-icon>
          </template>
          详情
        </n-button>
        <n-button 
          v-if="canRebet" 
          size="small" 
          type="primary" 
          ghost 
          @click.stop="handleRebet"
          class="action-btn rebet-btn"
        >
          <template #icon>
            <n-icon>
              <svg viewBox="0 0 24 24">
                <path fill="currentColor" d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z"/>
              </svg>
            </n-icon>
          </template>
          复投
        </n-button>
        <n-button 
          v-if="record.status === 'pending'" 
          size="small" 
          type="warning" 
          ghost 
          @click.stop="handleCancel"
          class="action-btn cancel-btn"
        >
          <template #icon>
            <n-icon>
              <svg viewBox="0 0 24 24">
                <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </n-icon>
          </template>
          取消
        </n-button>
      </n-space>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NIcon, NButton, NSpace, useMessage } from 'naive-ui'
import type { BettingRecord } from '@/types/bettingHistory'

// 🔥 创建扩展类型
type FormattedBettingRecord = BettingRecord & {
  formattedBetTime?: string
  formattedSettleTime?: string | null
  formattedNetAmount?: string
  formattedTotalBet?: string
  formattedTotalWin?: string
  statusText?: string
  statusColor?: string
  isProfit?: boolean
  isLoss?: boolean
}

// Props - 使用新的类型
interface Props {
  record: FormattedBettingRecord
  expandable?: boolean
  showActions?: boolean
  clickable?: boolean
  theme?: 'default' | 'compact' | 'detailed'
}

const props = withDefaults(defineProps<Props>(), {
  expandable: true,
  showActions: true,
  clickable: true,
  theme: 'default'
})

// Emits - 🔥 也使用扩展类型
const emit = defineEmits<{
  'detail': [record: FormattedBettingRecord]
  'rebet': [record: FormattedBettingRecord]
  'cancel': [record: FormattedBettingRecord]
  'click': [record: FormattedBettingRecord]
}>()

// 组合式函数
const message = useMessage()

// 响应式数据
const expanded = ref(false)

// 计算属性
const canExpand = computed(() => {
  return props.expandable && 
         props.record.bet_details && 
         props.record.bet_details.length > 0
})

const canRebet = computed(() => {
  return (props.record.status === 'win' || props.record.status === 'lose') &&
         props.record.bet_details &&
         props.record.bet_details.length > 0
})

const recordClasses = computed(() => ({
  'clickable': props.clickable,
  'expandable': canExpand.value,
  'expanded': expanded.value,
  'win-record': props.record.isProfit,
  'loss-record': props.record.isLoss,
  'pending-record': props.record.status === 'pending',
  'cancelled-record': props.record.status === 'cancelled',
  'processing-record': props.record.status === 'processing',
  [`theme-${props.theme}`]: true
}))

// 格式化金额
const formatMoney = (amount: number): string => {
  if (amount >= 10000) {
    return `${(amount / 10000).toFixed(1)}万`
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K`
  }
  return amount.toLocaleString()
}

// 事件处理
const handleClick = () => {
  if (!props.clickable) return
  
  if (canExpand.value) {
    expanded.value = !expanded.value
  }
  
  emit('click', props.record)
}

const handleViewDetail = () => {
  console.log('查看投注详情:', props.record.id)
  emit('detail', props.record)
}

const handleRebet = () => {
  if (!canRebet.value) {
    message.warning('当前记录不支持复投')
    return
  }
  
  console.log('复投操作:', props.record.id)
  emit('rebet', props.record)
  message.success('复投操作已触发')
}

const handleCancel = () => {
  if (props.record.status !== 'pending') {
    message.warning('只能取消待开奖的投注')
    return
  }
  
  console.log('取消投注:', props.record.id)
  emit('cancel', props.record)
}

// 开发模式下暴露调试信息
if (import.meta.env.DEV) {
  (window as any).debugBettingHistoryItem = {
    record: props.record,
    expanded,
    canExpand,
    canRebet,
    formatMoney,
    handleClick,
    handleViewDetail,
    handleRebet,
    handleCancel
  }
}
</script>

<style scoped>
.betting-record-item {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 16px;
  transition: all 0.3s ease;
  color: #ffffff;
  position: relative;
  overflow: hidden;
}

.betting-record-item.clickable {
  cursor: pointer;
}

.betting-record-item.clickable:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.betting-record-item.win-record {
  border-left: 4px solid #4caf50;
}

.betting-record-item.loss-record {
  border-left: 4px solid #f44336;
}

.betting-record-item.pending-record {
  border-left: 4px solid #ff9800;
}

.betting-record-item.cancelled-record {
  border-left: 4px solid #9e9e9e;
  opacity: 0.7;
}

.betting-record-item.processing-record {
  border-left: 4px solid #2196f3;
}

/* 主题样式 */
.betting-record-item.theme-compact {
  padding: 12px;
}

.betting-record-item.theme-detailed {
  padding: 20px;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.header-left {
  flex: 1;
}

.game-number {
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  font-family: 'Courier New', monospace;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.bet-time {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  color: #ffffff;
  text-align: center;
  min-width: 60px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.expand-icon {
  transition: transform 0.3s ease;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}

.expand-icon:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
}

.expand-icon.expanded {
  transform: rotate(180deg);
}

.record-main {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.amount-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.amount-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.amount-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  min-width: 40px;
  font-weight: 500;
}

.amount-value {
  font-size: 14px;
  font-weight: 600;
  text-align: right;
  font-family: 'Courier New', monospace;
  letter-spacing: 0.5px;
}

.amount-value.bet-amount {
  color: #2196f3;
}

.amount-value.win-amount {
  color: #4caf50;
}

.amount-value.net-amount.profit {
  color: #4caf50;
  text-shadow: 0 0 8px rgba(76, 175, 80, 0.3);
}

.amount-value.net-amount.loss {
  color: #f44336;
  text-shadow: 0 0 8px rgba(244, 67, 54, 0.3);
}

.dice-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-width: 120px;
}

.dice-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
  font-weight: 500;
}

.dice-container {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 6px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.dice-item {
  width: 24px;
  height: 24px;
  background: #ffffff;
  color: #000000;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  box-shadow: 
    0 2px 4px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  transition: transform 0.2s ease;
}

.dice-item:hover {
  transform: scale(1.05);
}

.dice-item.dice-1 { 
  background: linear-gradient(135deg, #ff4444, #e53935);
  color: #ffffff;
}

.dice-item.dice-2 { 
  background: linear-gradient(135deg, #ff8800, #fb8c00);
  color: #ffffff;
}

.dice-item.dice-3 { 
  background: linear-gradient(135deg, #ffcc00, #ffb300);
  color: #000000;
}

.dice-item.dice-4 { 
  background: linear-gradient(135deg, #44ff44, #43a047);
  color: #000000;
}

.dice-item.dice-5 { 
  background: linear-gradient(135deg, #00ccff, #0288d1);
  color: #000000;
}

.dice-item.dice-6 { 
  background: linear-gradient(135deg, #8844ff, #7b1fa2);
  color: #ffffff;
}

.dice-total {
  margin-left: 6px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
  padding: 2px 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.record-details {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  animation: expandIn 0.3s ease-out;
}

@keyframes expandIn {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 300px;
  }
}

.details-title {
  font-size: 13px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.details-title::before {
  content: '📋';
  font-size: 12px;
}

.bet-details-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.bet-detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  border-left: 3px solid rgba(255, 255, 255, 0.2);
  transition: all 0.2s ease;
}

.bet-detail-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.bet-detail-item.win {
  border-left-color: #4caf50;
  background: rgba(76, 175, 80, 0.1);
}

.detail-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.bet-type-name {
  font-size: 13px;
  font-weight: 500;
  color: #ffffff;
}

.bet-odds {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  font-family: 'Courier New', monospace;
}

.detail-right {
  text-align: right;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-amount {
  font-size: 13px;
  color: #2196f3;
  font-weight: 500;
  font-family: 'Courier New', monospace;
}

.detail-win {
  font-size: 11px;
  color: #4caf50;
  font-weight: 600;
  font-family: 'Courier New', monospace;
}

.settle-info {
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.settle-time {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.settle-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.settle-value {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
  font-family: 'Courier New', monospace;
}

.record-actions {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: flex-end;
}

.action-btn {
  border-radius: 6px;
  font-size: 12px;
  height: 32px;
  transition: all 0.2s ease;
}

.detail-btn {
  color: rgba(255, 255, 255, 0.8);
  border-color: rgba(255, 255, 255, 0.2);
}

.detail-btn:hover {
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.05);
}

.rebet-btn {
  color: #2196f3;
  border-color: #2196f3;
}

.rebet-btn:hover {
  background: rgba(33, 150, 243, 0.1);
}

.cancel-btn {
  color: #ff9800;
  border-color: #ff9800;
}

.cancel-btn:hover {
  background: rgba(255, 152, 0, 0.1);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .betting-record-item {
    padding: 12px;
  }
  
  .record-main {
    flex-direction: column;
    gap: 12px;
  }
  
  .dice-section {
    align-self: flex-start;
    min-width: auto;
  }
  
  .amount-section {
    width: 100%;
  }
  
  .dice-container {
    justify-content: flex-start;
  }
  
  .record-actions {
    justify-content: stretch;
  }
  
  .record-actions .n-space {
    width: 100%;
    justify-content: space-between;
  }
}

@media (max-width: 480px) {
  .record-header {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
  
  .header-right {
    align-self: flex-end;
  }
  
  .game-number {
    font-size: 13px;
  }
  
  .bet-time {
    font-size: 11px;
  }
  
  .amount-value {
    font-size: 13px;
  }
  
  .dice-item {
    width: 20px;
    height: 20px;
    font-size: 11px;
  }
  
  .bet-detail-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .detail-right {
    align-self: flex-end;
    align-items: flex-end;
  }
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  .betting-record-item {
    border-width: 2px;
  }
  
  .status-badge {
    font-weight: 700;
    border: 1px solid rgba(255, 255, 255, 0.3);
  }
  
  .amount-value {
    font-weight: 700;
  }
}

/* 减少动画模式 */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  .dice-item:hover {
    transform: none;
  }
  
  .betting-record-item.clickable:hover {
    transform: none;
  }
}
</style>