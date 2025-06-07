# 🎲 骰宝游戏 API 接口文档

## 📋 概述

本文档定义了骰宝游戏前后端的接口规范，采用 **HTTP + WebSocket** 混合架构：
- **HTTP**：处理用户初始化和投注提交
- **WebSocket**：处理实时游戏状态推送和数据同步

## 🌐 HTTP 接口

### 基础信息
- **Base URL**: `https://api.domain.com`
- **Content-Type**: `application/json`
- **认证方式**: URL参数中的token

### 1. 获取用户信息

**接口地址**: `GET /api/user/info`

**请求参数**:
```
user_id={user_id}&token={token}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "user_id": "8",
    "username": "player001",
    "balance": 12500.50,
    "vip_level": 2,
    "currency": "CNY"
  },
  "message": "success"
}
```

### 2. 提交投注

**接口地址**: `POST /api/game/bet`

**请求体**:
```json
{
  "table_id": "3",
  "game_number": "T00124060610001",
  "user_id": "8",
  "bets": [
    { "bet_type": "small", "amount": 100 },
    { "bet_type": "total-7", "amount": 50 }
  ],
  "token": "9eb5fcdac259fd6cedacad3e04bacf2ed7M3m261WOCWcaAKFFa2Nu"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "bet_id": "bet_20241207_001",
    "game_number": "T00124060610001",
    "total_amount": 150,
    "new_balance": 12350.50,
    "bets": [
      {
        "bet_type": "small",
        "amount": 100,
        "odds": "1:1"
      },
      {
        "bet_type": "total-7",
        "amount": 50,
        "odds": "1:12"
      }
    ]
  },
  "message": "投注成功"
}
```

**错误响应示例**:
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "余额不足",
    "details": {
      "required": 150,
      "available": 120
    }
  }
}
```

## 🔌 WebSocket 接口

### 连接信息
- **WebSocket URL**: `ws://domain.com/ws`
- **连接参数**: `?table_id={table_id}&user_id={user_id}&token={token}`

### 客户端发送事件

#### 1. 加入桌台
```json
{
  "event": "join_table",
  "data": {
    "table_id": "3",
    "user_id": "8",
    "token": "xxx"
  }
}
```

#### 2. 心跳检测
```json
{
  "event": "heartbeat",
  "data": {
    "timestamp": 1701936000000
  }
}
```

### 服务端推送事件

#### 1. 连接确认 + 初始状态
```json
{
  "event": "table_joined",
  "data": {
    "table_id": "3",
    "user_id": "8",
    "current_game": {
      "game_number": "T00124060610001",
      "status": "betting",
      "countdown": 25,
      "round": 1001
    },
    "user_balance": 12500.50,
    "table_info": {
      "table_name": "骰宝001",
      "min_bet": 10,
      "max_bet": 50000
    }
  }
}
```

#### 2. 新游戏开始
```json
{
  "event": "new_game_started",
  "data": {
    "table_id": "3",
    "game_number": "T00124060610002",
    "status": "betting",
    "countdown": 30,
    "round": 1002
  }
}
```

#### 3. 游戏状态变化
```json
{
  "event": "game_status_change",
  "data": {
    "table_id": "3",
    "game_number": "T00124060610001",
    "status": "dealing",
    "countdown": 3
  }
}
```

**状态说明**:
- `waiting`: 等待开始
- `betting`: 投注阶段
- `dealing`: 开牌阶段  
- `result`: 结果展示

#### 4. 倒计时更新
```json
{
  "event": "countdown_tick",
  "data": {
    "table_id": "3",
    "countdown": 24,
    "status": "betting"
  }
}
```

#### 5. 开奖结果
```json
{
  "event": "game_result",
  "data": {
    "table_id": "3",
    "game_number": "T00124060610001",
    "dice_results": [3, 4, 6],
    "total": 13,
    "is_big": true,
    "is_odd": true,
    "special_results": [
      {
        "type": "combo-3-4",
        "description": "组合3-4"
      }
    ],
    "timestamp": "2024-06-07T10:30:00Z"
  }
}
```

#### 6. 用户余额更新
```json
{
  "event": "balance_update",
  "data": {
    "user_id": "8",
    "balance": 15420.50,
    "change": 1420.50,
    "reason": "win_settlement",
    "game_number": "T00124060610001"
  }
}
```

**余额变化原因**:
- `bet_placed`: 投注扣款
- `win_settlement`: 中奖结算
- `lose_settlement`: 输局确认

#### 7. 心跳响应
```json
{
  "event": "heartbeat_response",
  "data": {
    "timestamp": 1701936000000,
    "server_time": 1701936001000
  }
}
```

#### 8. 错误信息
```json
{
  "event": "error",
  "data": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "余额不足",
    "details": {
      "required": 150,
      "available": 120
    }
  }
}
```

**错误代码说明**:
- `INSUFFICIENT_BALANCE`: 余额不足
- `INVALID_TOKEN`: 令牌无效
- `BETTING_CLOSED`: 投注已关闭
- `INVALID_BET_TYPE`: 无效的投注类型
- `BET_AMOUNT_INVALID`: 投注金额无效
- `GAME_NOT_FOUND`: 游戏不存在
- `TABLE_MAINTENANCE`: 桌台维护中

## 🔄 数据流程

### 1. 页面初始化流程
```
1. 解析URL参数 (table_id, user_id, token, game_type)
2. HTTP请求获取用户信息 (/api/user/info)
3. 建立WebSocket连接
4. 发送join_table事件
5. 接收table_joined事件，获取当前游戏状态
6. 更新前端Store，初始化UI
```

### 2. 游戏进行流程
```
1. WebSocket推送: new_game_started (新局开始)
2. WebSocket推送: countdown_tick (倒计时更新)
3. 用户操作: HTTP投注 (/api/game/bet)
4. WebSocket推送: balance_update (投注扣款)
5. WebSocket推送: game_status_change (进入开牌阶段)
6. WebSocket推送: game_result (开奖结果)
7. WebSocket推送: balance_update (中奖结算)
8. 循环到步骤1
```

### 3. 错误处理流程
```
1. HTTP请求失败 → 显示错误提示，允许重试
2. WebSocket断开 → 自动重连，显示连接状态
3. 业务错误 → 根据错误代码显示对应提示
4. 网络异常 → 降级到轮询模式(可选)
```

## 🎯 投注类型定义

### 大小单双投注
- `small`: 小 (4-10点)
- `big`: 大 (11-17点)  
- `odd`: 单
- `even`: 双

### 点数投注
- `total-4` 到 `total-17`: 具体点数

### 单骰投注
- `single-1` 到 `single-6`: 单个骰子点数

### 对子投注
- `pair-1` 到 `pair-6`: 特定对子

### 三同号投注
- `triple-1` 到 `triple-6`: 指定三同号
- `any-triple`: 任意三同号

### 组合投注
- `combo-1-2`, `combo-1-3`, ..., `combo-5-6`: 两两组合

## 🔧 技术要求

### HTTP接口
- 支持CORS跨域
- 请求超时时间: 10秒
- 支持gzip压缩
- 返回格式统一为JSON

### WebSocket连接
- 支持自动重连
- 心跳间隔: 30秒
- 连接超时: 60秒
- 支持消息队列处理

### 安全要求
- 所有接口需要token验证
- 敏感数据加密传输
- 防重放攻击
- 接口频率限制

### 性能要求
- HTTP接口响应时间 < 500ms
- WebSocket消息推送延迟 < 100ms
- 支持并发连接数 > 1000
- 消息可靠性保证

## 📝 部署说明

### 开发环境
```bash
# 前端
VITE_API_BASE_URL=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3001/ws
VITE_ENABLE_MOCK=true

# 后端
PORT=3001
CORS_ORIGIN=http://localhost:8080
```

### 生产环境
```bash
# 前端
VITE_API_BASE_URL=https://api.game.com/api
VITE_WS_URL=wss://ws.game.com
VITE_ENABLE_MOCK=false

# 后端
PORT=80
CORS_ORIGIN=https://game.com
SSL_CERT_PATH=/path/to/cert
```

## 🧪 测试用例

### HTTP接口测试
```bash
# 获取用户信息
curl "https://api.domain.com/api/user/info?user_id=8&token=xxx"

# 提交投注
curl -X POST "https://api.domain.com/api/game/bet" \
  -H "Content-Type: application/json" \
  -d '{"table_id":"3","game_number":"T001","user_id":"8","bets":[{"bet_type":"small","amount":100}],"token":"xxx"}'
```

### WebSocket测试
```javascript
// 连接测试
const ws = new WebSocket('ws://domain.com/ws?table_id=3&user_id=8&token=xxx');

// 发送加入桌台
ws.send(JSON.stringify({
  event: 'join_table',
  data: { table_id: '3', user_id: '8', token: 'xxx' }
}));

// 监听消息
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('收到消息:', message);
};
```

## 📞 联系方式

如有接口问题或建议，请联系开发团队。

---

*本文档版本: v1.0*  
*最后更新: 2024-12-07*