// src/utils/messageHelper.ts
import type { MessageApi } from 'naive-ui'

// 防重复提示的状态管理
interface MessageState {
  lastMessageTime: number
  lastMessageContent: string
}

const messageState: MessageState = {
  lastMessageTime: 0,
  lastMessageContent: ''
}

// 投注阶段对应的提示文案
const PHASE_MESSAGES: Record<string, string> = {
  'dealing': '正在发牌，请稍候...',
  'result': '正在开奖，请等待下局...',
  'waiting': '等待下局开始...'
}

/**
 * 显示投注被阻止的提示消息
 * @param phase 当前投注阶段
 * @param messageApi naive-ui的message API实例
 * @param preventDuplicateTime 防重复时间间隔(毫秒)，默认2000ms
 */
export const showBettingBlockedMessage = (
  phase: string,
  messageApi: MessageApi,
  preventDuplicateTime: number = 2000
): void => {
  const message = PHASE_MESSAGES[phase] || '当前无法投注'
  const currentTime = Date.now()
  
  // 防重复机制：相同内容在指定时间内不重复显示
  if (
    currentTime - messageState.lastMessageTime < preventDuplicateTime &&
    messageState.lastMessageContent === message
  ) {
    console.log('🚫 防重复提示：跳过相同消息', { phase, message })
    return
  }
  
  // 显示提示消息
  messageApi.info(message)
  
  // 更新状态
  messageState.lastMessageTime = currentTime
  messageState.lastMessageContent = message
  
  console.log('💬 显示投注阻止提示', { phase, message, time: currentTime })
}

/**
 * 清理消息历史记录（在阶段切换时调用）
 */
export const clearMessageHistory = (): void => {
  messageState.lastMessageTime = 0
  messageState.lastMessageContent = ''
  console.log('🧹 清理消息历史记录')
}

/**
 * 获取当前消息状态（调试用）
 */
export const getMessageState = (): MessageState => {
  return { ...messageState }
}