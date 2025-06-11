<template>
  <div :class="recordClasses" @click="handleClick">
    <!-- 记录头部 -->
    <div class="record-header">
      <div class="header-left">
        <div class="game-number">{{ record.game_number }}</div>
        <div class="bet-time">{{ formatDateTime(record.bet_time) }}</div>
      </div>
      <div class="header-right">
        <div class="status-badge" :style="{ backgroundColor: getStatusColor(record.status) }">
          {{ getStatusText(record.status) }}
        </div>
        <div v-if="canExpand" class="expand-icon" :class="{ expanded }">
          ▼
        </div>
      </div>
    </div>

    <!-- 记录主体 -->
    <div class="record-main">
      <!-- 投注信息 -->
      <div class="amount-section">
        <div class="amount-row">
          <span class="amount-label">投注:</span>
          <span class="amount-value bet-amount">¥{{ formatMoney(record.total_bet_amount) }}</span>
        </div>
        
        <!-- 只在已开奖时显示中奖金额 -->
        <div v-if="record.status !== 'pending'" class="amount-row">
          <span class="amount-label">中奖:</span>
          <span class="amount-value win-amount">¥{{ formatMoney(record.total_win_amount) }}</span>
        </div>
      </div>

      <!-- 开奖结果 -->
      <div v-if="record.dice_results" class="dice-section">
        <div class="dice-label">开奖结果</div>
        <div class="dice-container">
          <div 
            v-for="(dice, index) in record.dice_results" 
            :key="index" 
            class="dice-item"
          >
            {{ dice }}
          </div>
          <div class="dice-total">= {{ record.dice_total }}</div>
        </div>
      </div>
    </div>

    <!-- 🔥 展开的投注详情 -->
    <div v-if="expanded && record.bet_details && record.bet_details.length > 0" class="record-details">
      <div class="details-title">投注明细</div>
      <div class="bet-details-list">
        <div 
          v-for="(detail, index) in record.bet_details" 
          :key="index" 
          class="bet-detail-item"
          :class="{ 'win': detail.is_win }"
        >
          <div class="detail-left">
            <div class="bet-type-name">{{ detail.bet_type_name || getBetTypeName(detail.bet_type) }}</div>
            <div class="bet-odds">{{ detail.odds || '1:1' }}</div>
          </div>
          <div class="detail-right">
            <div class="detail-amount">¥{{ formatMoney(detail.bet_amount) }}</div>
            <div v-if="detail.win_amount > 0" class="detail-win">
              +¥{{ formatMoney(detail.win_amount) }}
            </div>
          </div>
        </div>
      </div>
      
      <!-- 结算信息 -->
      <div v-if="record.settle_time" class="settle-info">
        <div class="settle-time">
          <span class="settle-label">结算时间:</span>
          <span class="settle-value">{{ formatDateTime(record.settle_time) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { BettingRecord } from '@/types/bettingHistory'

// Props
interface Props {
  record: BettingRecord
  expandable?: boolean
  showActions?: boolean
  clickable?: boolean
  theme?: 'default' | 'compact' | 'detailed'
}

const props = withDefaults(defineProps<Props>(), {
  expandable: true,
  showActions: false, // 🔥 默认不显示操作按钮
  clickable: true,
  theme: 'default'
})

// Emits
const emit = defineEmits<{
  'click': [record: BettingRecord]
}>()

// 响应式数据
const expanded = ref(false)

// 计算属性
const canExpand = computed(() => {
  return props.expandable && props.record.bet_details && props.record.bet_details.length > 0
})

const recordClasses = computed(() => {
  return [
    'betting-record-item',
    {
      'clickable': props.clickable,
      'win-record': props.record.total_win_amount > 0,
      'lose-record': props.record.total_win_amount === 0 && props.record.status !== 'pending',
      'pending-record': props.record.status === 'pending',
      'cancelled-record': props.record.status === 'cancelled',
      'processing-record': props.record.status === 'processing',
      [`theme-${props.theme}`]: true
    }
  ]
})

// 方法
const formatMoney = (amount: number): string => {
  return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    'pending': '待开奖',
    'win': '已中奖',
    'lose': '未中奖',
    'cancelled': '已取消',
    'processing': '处理中'
  }
  return statusMap[status] || '未知'
}

const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    'pending': '#ff9800',
    'win': '#4caf50',
    'lose': '#f44336',
    'cancelled': '#9e9e9e',
    'processing': '#2196f3'
  }
  return colorMap[status] || '#9e9e9e'
}

// 🔥 投注类型名称映射
const getBetTypeName = (betType: string): string => {
  const typeMap: Record<string, string> = {
    'big': '大',
    'small': '小',
    'odd': '单',
    'even': '双',
    'total-4': '总和4',
    'total-5': '总和5',
    'total-6': '总和6',
    'total-7': '总和7',
    'total-8': '总和8',
    'total-9': '总和9',
    'total-10': '总和10',
    'total-11': '总和11',
    'total-12': '总和12',
    'total-13': '总和13',
    'total-14': '总和14',
    'total-15': '总和15',
    'total-16': '总和16',
    'total-17': '总和17',
    'triple-1': '三同号1',
    'triple-2': '三同号2',
    'triple-3': '三同号3',
    'triple-4': '三同号4',
    'triple-5': '三同号5',
    'triple-6': '三同号6',
    'any-triple': '全围',
    'pair-1': '对子1',
    'pair-2': '对子2',
    'pair-3': '对子3',
    'pair-4': '对子4',
    'pair-5': '对子5',
    'pair-6': '对子6'
  }
  return typeMap[betType] || betType
}

const handleClick = () => {
  if (props.clickable) {
    if (canExpand.value) {
      expanded.value = !expanded.value
    }
    emit('click', props.record)
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

/* 🔥 优化状态指示 - 左边框颜色 */
.betting-record-item.win-record {
  border-left: 4px solid #4caf50;
}

.betting-record-item.lose-record {
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
}

.expand-icon {
  transition: transform 0.3s ease;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  font-size: 12px;
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
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
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
</style>