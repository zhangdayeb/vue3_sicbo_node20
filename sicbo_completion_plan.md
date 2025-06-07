# 🎲 骰宝游戏完善计划

## 📋 当前状态评估

### ✅ 已完成功能 (85%)
- 完整的UI界面和投注系统
- 状态管理和数据流
- 音效和特效系统
- 移动端响应式适配
- 基础游戏逻辑

### ⚠️ 待完善功能 (15%)

## 🚀 第一阶段：模拟数据层 (预计2-3天)

### 1. Mock数据服务
```typescript
// src/services/mockApi.ts
interface MockGameData {
  gameNumber: string
  diceResults: [number, number, number]
  gamePhase: 'betting' | 'rolling' | 'result'
  countdown: number
  round: number
}

class MockApiService {
  // 模拟游戏数据
  generateGameData(): MockGameData
  // 模拟投注结果
  calculateWinnings(bets: Record<string, number>, results: number[]): WinResult
  // 模拟余额更新
  updateBalance(amount: number): Promise<number>
}
```

### 2. 游戏流程模拟器
```typescript
// src/composables/useGameSimulator.ts
export const useGameSimulator = () => {
  const startGameCycle = () => {
    // 30秒投注阶段
    // 3秒开牌阶段
    // 2秒结果展示
    // 5秒结算阶段
  }
  
  const generateRandomResults = (): [number, number, number]
  const simulateNetworkDelay = (min: number, max: number): Promise<void>
}
```

### 3. 投注结算逻辑
```typescript
// src/utils/bettingCalculator.ts
export class BettingCalculator {
  calculateWinnings(bets: BetRecord[], diceResults: number[]): WinResult[]
  getOdds(betType: BetType): number
  validateBet(betType: BetType, amount: number, balance: number): boolean
}
```

## 🔗 第二阶段：API接口层 (预计3-4天)

### 1. HTTP客户端配置
```typescript
// src/services/httpClient.ts
import axios from 'axios'

const apiClient = axios.create({
  baseURL: process.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器 - 添加认证token
// 响应拦截器 - 错误处理和重试机制
```

### 2. API服务层
```typescript
// src/services/gameApi.ts
export class GameApiService {
  // 用户相关
  async getUserInfo(): Promise<UserInfo>
  async updateBalance(amount: number): Promise<BalanceResponse>
  
  // 游戏相关
  async getCurrentGame(): Promise<GameInfo>
  async placeBets(bets: BetRequest[]): Promise<BetResponse>
  async getGameResult(gameId: string): Promise<GameResult>
  
  // 历史记录
  async getBettingHistory(page: number, limit: number): Promise<HistoryResponse>
  async getGameHistory(page: number, limit: number): Promise<GameHistoryResponse>
}
```

### 3. WebSocket连接（实时数据）
```typescript
// src/services/websocket.ts
export class GameWebSocket {
  connect(token: string): Promise<void>
  
  // 监听游戏状态变化
  onGameStateChange(callback: (state: GameState) => void): void
  
  // 监听倒计时更新
  onCountdownUpdate(callback: (countdown: number) => void): void
  
  // 监听开奖结果
  onGameResult(callback: (result: GameResult) => void): void
  
  // 发送投注
  sendBets(bets: BetRequest[]): void
  
  // 处理断线重连
  setupReconnection(): void
}
```

## 📊 第三阶段：数据管理优化 (预计2天)

### 1. 增强状态管理
```typescript
// src/stores/gameStore.ts - 增强版
export const useGameStore = defineStore('game', () => {
  // 新增状态
  const gameHistory = ref<GameResult[]>([])
  const bettingHistory = ref<BetRecord[]>([])
  const connectionStatus = ref<'connected' | 'disconnected' | 'reconnecting'>('disconnected')
  const serverTime = ref<Date>(new Date())
  
  // 新增方法
  const syncWithServer = async (): Promise<void>
  const loadGameHistory = async (page: number): Promise<void>
  const loadBettingHistory = async (page: number): Promise<void>
})
```

### 2. 缓存和持久化
```typescript
// src/utils/storage.ts
export class GameStorage {
  // 本地缓存投注历史
  cacheBettingHistory(history: BetRecord[]): void
  getCachedBettingHistory(): BetRecord[]
  
  // 保存用户设置
  saveUserSettings(settings: UserSettings): void
  getUserSettings(): UserSettings
  
  // 缓存游戏状态（离线恢复用）
  cacheGameState(state: GameState): void
  getCachedGameState(): GameState | null
}
```

## 🛡️ 第四阶段：错误处理和用户体验 (预计2天)

### 1. 全局错误处理
```typescript
// src/utils/errorHandler.ts
export class ErrorHandler {
  handleApiError(error: AxiosError): void
  handleWebSocketError(error: Event): void
  handleGameLogicError(error: GameError): void
  
  // 用户友好的错误提示
  showUserFriendlyError(errorType: string, context?: any): void
}
```

### 2. 网络状态监控
```typescript
// src/composables/useNetworkStatus.ts
export const useNetworkStatus = () => {
  const isOnline = ref(navigator.onLine)
  const connectionQuality = ref<'good' | 'poor' | 'offline'>('good')
  
  const handleOffline = (): void
  const handleOnline = (): void
  const measureConnectionQuality = (): void
}
```

### 3. 性能监控
```typescript
// src/utils/performance.ts
export class PerformanceMonitor {
  trackPageLoad(): void
  trackApiResponse(endpoint: string, duration: number): void
  trackUserInteraction(action: string, duration: number): void
  
  getPerformanceReport(): PerformanceReport
}
```

## 🔧 第五阶段：生产环境准备 (预计1-2天)

### 1. 环境配置
```typescript
// .env.development
VITE_API_BASE_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3000/ws
VITE_ENABLE_MOCK=true

// .env.production
VITE_API_BASE_URL=https://api.sicbo.com/v1
VITE_WS_URL=wss://ws.sicbo.com
VITE_ENABLE_MOCK=false
```

### 2. 构建优化
```javascript
// vite.config.ts 优化
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['vue', 'pinia'],
          'naive-ui': ['naive-ui'],
          'audio': ['tone']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
```

## 📋 建议的API接口规范

### 认证接口
```
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
```

### 游戏接口
```
GET /api/game/current          # 获取当前游戏状态
GET /api/game/history          # 获取游戏历史
POST /api/game/bet             # 提交投注
GET /api/game/result/:gameId   # 获取游戏结果
```

### 用户接口
```
GET /api/user/info             # 获取用户信息
GET /api/user/balance          # 获取用户余额
POST /api/user/balance         # 更新余额
GET /api/user/betting-history  # 投注历史
```

### WebSocket事件
```
// 客户端发送
game.join          # 加入游戏
game.bet           # 投注
game.leave         # 离开游戏

// 服务端推送
game.state         # 游戏状态更新
game.countdown     # 倒计时更新
game.result        # 开奖结果
user.balance       # 余额更新
```

## 🎯 总结建议

1. **优先级1**：完成模拟数据层，确保游戏流程完整可演示
2. **优先级2**：设计和实现API接口，准备与后端对接
3. **优先级3**：完善错误处理和用户体验细节
4. **优先级4**：性能优化和生产环境配置

**预计总工期：10-12天完成所有功能**

当前前端架构已经非常完善，主要缺少的是数据层和API集成，建议按照上述计划逐步完善。