# 骰宝投注区域 - 项目文档

## 📋 项目概述

这是一个专为移动端优化的骰宝游戏投注区域，采用Vue3 + TypeScript + Pinia技术栈开发。项目提供完整的投注功能、特效系统和音效管理，确保在移动设备上提供流畅的游戏体验。

## 🏗️ 技术架构

### 核心技术栈
- **前端框架**: Vue 3.5.16 + TypeScript 5.8.3
- **状态管理**: Pinia 3.0.3
- **构建工具**: Vite 6.3.5
- **UI组件**: 自定义组件
- **样式方案**: CSS3 + CSS Grid + Flexbox

### 项目特色
- 🎯 专为移动端优化的交互体验
- 📱 iOS Safari完美兼容，支持安全区域
- 🎮 丰富的特效和音效系统
- 🎲 完整的骰宝游戏投注逻辑
- ⚡ 高性能的动画和渲染

## 📁 文件结构

```
src/
├── components/
│   ├── BettingArea/                 # 投注区域组件
│   │   ├── BettingArea.vue         # 主投注区域容器
│   │   ├── MainBets.vue            # 大小单双投注区域
│   │   ├── NumberBets.vue          # 点数投注区域
│   │   ├── SingleDiceBets.vue      # 单骰投注区域
│   │   ├── PairBets.vue            # 对子投注区域
│   │   ├── TripleBets.vue          # 三同号投注区域
│   │   ├── ComboBets.vue           # 两两组合投注区域
│   │   ├── ChipSelector.vue        # 筹码选择器
│   │   ├── ControlButtons.vue      # 控制按钮组
│   │   └── BetAmountDisplay.vue    # 投注金额显示
│   ├── Effects/                     # 特效组件
│   │   ├── WinningEffect.vue       # 中奖特效
│   │   ├── DiceRollingEffect.vue   # 开牌动画
│   │   └── ChipAnimation.vue       # 筹码动画
│   └── Audio/                       # 音频组件
│       └── SoundManager.vue        # 音效管理器
├── composables/                     # 组合式函数
│   ├── useBetting.ts               # 投注逻辑
│   ├── useChips.ts                 # 筹码管理
│   ├── useAudio.ts                 # 音效管理
│   └── useGameEffects.ts           # 游戏特效
├── stores/                          # 状态管理
│   └── bettingStore.ts             # 投注状态管理
├── types/                           # 类型定义
│   ├── betting.ts                  # 投注相关类型
│   ├── game.ts                     # 游戏相关类型
│   └── audio.ts                    # 音频相关类型
└── assets/                          # 静态资源
    ├── audio/                      # 音效文件
    │   ├── chip-place.mp3         # 放置筹码音效
    │   ├── chip-select.mp3        # 选择筹码音效
    │   ├── bet-confirm.mp3        # 确认投注音效
    │   ├── win.mp3                # 中奖音效
    │   └── dice-roll.mp3          # 摇骰音效
    └── images/                     # 图片资源
        └── chips/                  # 筹码图片
```

## 🎮 功能模块

### 1. 投注区域组件

#### MainBets.vue - 大小单双投注
- **布局**: 2x2网格布局
- **功能**: 主要投注选项，赔率1:1
- **包含**: 小(4-10)、大(11-17)、单、双

#### NumberBets.vue - 点数投注
- **布局**: 双行布局，上排4-10，下排17-11
- **功能**: 具体点数投注，不同赔率
- **特色**: 根据概率显示对应赔率

#### SingleDiceBets.vue - 单骰投注
- **布局**: 1行6列
- **功能**: 投注单个骰子点数
- **赔率**: 出现1个1:1，2个1:2，3个1:3

#### PairBets.vue - 对子投注
- **布局**: 1行6列
- **功能**: 投注特定对子(11,22,33,44,55,66)
- **赔率**: 1:10

#### TripleBets.vue - 三同号投注
- **布局**: 1行7列
- **功能**: 投注三个相同数字或全围
- **赔率**: 指定三同号1:180，全围1:30

#### ComboBets.vue - 组合投注
- **布局**: 3行5列，共15个组合
- **功能**: 投注两个特定数字的组合
- **赔率**: 1:6

### 2. 交互系统

#### ChipSelector.vue - 筹码选择器
```typescript
interface Chip {
  value: number;        // 筹码面值
  color: string;        // 筹码颜色
  textColor: string;    // 文字颜色
}

const chips: Chip[] = [
  { value: 1, color: '#8b4513', textColor: 'white' },
  { value: 10, color: '#dc143c', textColor: 'white' },
  { value: 100, color: '#ffd700', textColor: '#333' },
  { value: 1000, color: '#4169e1', textColor: 'white' },
  { value: 10000, color: '#9370db', textColor: 'white' }
]
```

#### ControlButtons.vue - 控制按钮
- **清除按钮**: 清空所有未确认投注
- **重复投注**: 重复上次的投注组合
- **确认投注**: 提交当前投注并开始游戏

### 3. 特效系统

#### WinningEffect.vue - 中奖特效
- 金币雨动画
- 闪光效果
- 中奖金额飞入动画
- 屏幕震动反馈

#### DiceRollingEffect.vue - 开牌动画
- 骰子滚动动画
- 结果显示动画
- 摇骰音效配合

#### ChipAnimation.vue - 筹码动画
- 筹码飞行到投注位置
- 投注金额数字动画
- 选中状态过渡动画

### 4. 音效管理

#### useAudio.ts - 音效管理
```typescript
interface AudioManager {
  playChipSelect(): void;    // 选择筹码音效
  playChipPlace(): void;     // 放置投注音效
  playBetConfirm(): void;    // 确认投注音效
  playDiceRoll(): void;      // 摇骰音效
  playWin(): void;           // 中奖音效
  setEnabled(enabled: boolean): void;  // 开关音效
}
```

## 📱 移动端优化

### 布局策略
- **固定底部**: 筹码选择器和控制按钮固定在底部
- **滚动区域**: 投注区域支持流畅滚动
- **安全区域**: 完美适配iOS Safari的安全区域

### 触摸优化
- **触摸目标**: 最小44px的触摸目标
- **点击反馈**: scale(0.95)缩放效果
- **防误触**: 合理的按钮间距设计

### iOS Safari兼容
```css
/* 安全区域适配 */
.bottom-fixed-area {
  padding-bottom: max(12px, env(safe-area-inset-bottom));
}

/* 流畅滚动 */
.betting-content {
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}

/* 防止缩放 */
.bet-button {
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}
```

## 📊 状态管理

### bettingStore.ts - 核心状态
```typescript
interface BettingState {
  balance: number;                    // 用户余额
  selectedChip: number;               // 选中的筹码面值
  currentBets: Record<string, number>; // 当前投注
  lastBets: Record<string, number>;   // 上次投注记录
  totalBetAmount: number;             // 总投注金额
  gamePhase: GamePhase;               // 游戏阶段
  soundEnabled: boolean;              // 音效开关
}

type GamePhase = 'betting' | 'rolling' | 'result';
```

### 核心方法
- `placeBet(betType: string, amount: number)`: 下注
- `clearBets()`: 清除投注
- `confirmBets()`: 确认投注
- `calculateWinnings(diceResults: number[])`: 计算中奖

## 🎨 视觉设计

### 色彩方案
- **主色调**: 深绿色 (#1a4c2d)
- **投注按钮**: 中绿色 (#2d7a4f)
- **选中状态**: 金黄色 (#ffd700)
- **筹码颜色**: 经典赌场配色

### 动画效果
- **点击反馈**: 0.1s的缩放动画
- **状态切换**: 0.2s的颜色过渡
- **特效动画**: 流畅的CSS3动画

## 🚀 性能优化

### 渲染优化
- 使用CSS Transform避免回流
- 合理使用will-change属性
- 音频文件预加载和缓存

### 内存管理
- 及时清理动画元素
- 音频对象复用
- 避免内存泄漏

## 📦 安装和运行

### 环境要求
- Node.js 18+
- npm 8+ 或 yarn 1.22+

### 安装依赖
```bash
npm install
# 或
yarn install
```

### 开发运行
```bash
npm run dev
# 或
yarn dev
```

### 构建生产版本
```bash
npm run build
# 或
yarn build
```

## 🧪 测试

### 兼容性测试
- iOS Safari 14+
- Android Chrome 90+
- 不同屏幕尺寸测试
- 横竖屏切换测试

### 功能测试
- 投注流程完整性
- 音效播放正常性
- 特效显示效果
- 状态管理准确性

## 📈 后续规划

### 功能扩展
- [ ] 多语言支持
- [ ] 主题切换功能
- [ ] 投注历史记录
- [ ] 统计数据展示

### 性能优化
- [ ] 组件懒加载
- [ ] 图片资源优化
- [ ] 代码分割优化
- [ ] PWA支持

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交代码更改
4. 推送到分支
5. 创建 Pull Request

## 📄 许可证

MIT License

## 📞 支持与反馈

如有问题或建议，请创建Issue或联系开发团队。