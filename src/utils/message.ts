// src/utils/message.ts
import { createDiscreteApi } from 'naive-ui'

// 创建独立的消息 API
const { message, notification, dialog, loadingBar } = createDiscreteApi([
  'message',
  'notification', 
  'dialog',
  'loadingBar'
])

export { message, notification, dialog, loadingBar }