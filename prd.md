# PRD: 四川麻将血战到底

## 1. 简介

创建一个网页单机版四川麻将游戏（血战到底规则），玩家与3个AI对手进行对战。采用经典四川麻将规则，简化牌组（只保留万、条、筒），支持碰、杠、吃、胡牌。游戏提供简约现代的视觉风格和多种AI难度选择。

## 2. 目标

- 实现完整的四川麻将血战到底规则（碰、杠、吃、胡）
- 提供3种AI难度（简单、中等、困难）
- 支持胡牌自动检测和番型计分
- 提供流畅的游戏操作体验
- 响应式设计，支持桌面和移动端浏览器

## 3. 用户故事

### US-001: 游戏初始化
**描述:** 作为玩家，我希望打开游戏后能快速开始游戏。

**验收标准:**
- [x] 显示游戏界面，包含玩家手牌区、AI区域、桌面
- [x] 提供3种AI难度选择（简单/中等/困难）
- [x] 自动发牌，庄家14张，闲家13张
- [x] 显示剩余牌数和当前玩家信息

### US-002: 麻将牌界面显示
**描述:** 作为玩家，我希望能看到清晰的麻将牌界面。

**验收标准:**
- [x] 玩家手牌以横向牌阵显示（可点击选择）
- [x] 桌面打出的牌按顺序排列
- [x] 显示3个AI玩家的手牌（背面朝上）
- [x] 当前回合玩家有明显提示
- [x] 牌面清晰可辨，使用麻将牌图片
- [x] 碰/杠/吃后的明牌显示在手牌旁边

### US-003: 摸牌和出牌机制
**描述:** 作为玩家，我希望能够摸牌并选择打出一张牌。

**验收标准:**
- [x] 回合开始时自动摸牌
- [x] 玩家可以从手牌中选择一张牌打出
- [x] 打出牌后轮到下一个玩家
- [x] 出牌有动画效果
- [x] 防止重复点击和并发操作

### US-004: 碰牌功能
**描述:** 当任意玩家打出的牌可以碰时，我希望能选择碰牌。

**验收标准:**
- [x] 检测可碰的组合并提示玩家
- [x] 显示碰牌按钮供玩家选择
- [x] 点击碰按钮完成碰牌
- [x] 碰完后需要打出一张牌
- [x] 碰牌有音效和动画效果

### US-004b: 吃牌功能
**描述:** 当上家打出的牌可以吃时，我希望能选择吃牌。

**验收标准:**
- [x] 检测可吃的组合并提示玩家
- [x] 显示吃牌按钮供玩家选择
- [x] 多种吃牌组合时显示选择界面
- [x] 吃完后需要打出一张牌
- [x] 吃牌有音效和动画效果

### US-005: 杠牌功能
**描述:** 当手牌满足杠牌条件时，我希望能选择杠牌。

**验收标准:**
- [x] 支持明杠（别人打出的牌，自己有3张相同）
- [x] 支持暗杠（手牌中4张相同牌）
- [x] 支持补杠（已碰的牌再摸到第4张）
- [x] 杠完后摸一张牌
- [x] 杠牌有音效和动画效果

### US-006: 胡牌检测和结算
**描述:** 当手牌满足胡牌条件时，我希望能够自动检测并胡牌。

**验收标准:**
- [x] 摸牌后自动检测是否可以自摸
- [x] 别人打出的牌可以胡时提示玩家
- [x] 显示胡牌界面，包含胡牌信息
- [x] 支持多种胡牌番型（平胡、对对胡、清一色、七对等）
- [x] 显示番型计分

### US-007: AI对手行为
**描述:** 作为玩家，我希望AI对手能够智能地摸牌、出牌、碰杠胡。

**决策策略:**
- 简单：随机出牌，减少碰杠概率
- 中等：基本策略，评估牌的价值
- 困难：高级策略，考虑牌效率和防守

**验收标准:**
- [x] AI根据难度等级做出相应决策
- [x] AI有适当的思考延迟（模拟真实对战）
- [x] AI也会进行碰杠和胡牌判定
- [x] 困难模式下AI会避免点炮

### US-008: 游戏流程控制
**描述:** 作为玩家，我希望有完整的游戏流程控制。

**验收标准:**
- [x] 显示当前回合和剩余牌数
- [x] 流局检测（牌堆耗尽）
- [x] 支持重新开始游戏
- [x] 过牌功能（放弃碰/杠/胡）

### US-009: 音效和动画
**描述:** 作为玩家，我希望游戏有适当的音效和动画提升体验。

**验收标准:**
- [x] 摸牌、出牌有音效
- [x] 碰、杠、胡有特殊音效
- [x] 牌移动有平滑动画
- [x] 胡牌有庆祝动画

### US-010: 调试功能
**描述:** 作为开发者/测试者，我希望有调试功能辅助测试。

**验收标准:**
- [x] 显示游戏状态（当前玩家、庄家、剩余牌数）
- [x] 可以查看AI手牌（作弊模式）
- [x] 自动出牌功能（测试用）
- [x] 一键新游戏

## 4. 功能需求

- FR-1: 游戏初始化，支持难度选择
- FR-2: 麻将牌渲染（万、条、筒，共108张）
- FR-3: 玩家手牌管理（最多14张）
- FR-4: 牌堆管理（发牌后剩余牌）
- FR-5: 碰牌判定和执行
- FR-6: 明杠判定和执行
- FR-7: 暗杠判定和执行
- FR-8: 补杠判定和执行
- FR-9: 胡牌自动检测
- FR-10: 胡牌番型计算（平胡、对对胡、清一色、七对、龙七对、十三幺等）
- FR-11: 3种AI难度实现
- FR-12: 回合制游戏流程控制
- FR-13: 游戏结算界面
- FR-14: 响应式布局
- FR-15: 调试面板

## 5. 非目标

- 不包含网络对战功能
- 不包含多人本地同屏模式
- 不包含保存/加载游戏进度
- 不包含社交功能（好友、排行榜等）
- 不包含抽卡/氪金系统

## 6. 设计注意事项

- 使用纯HTML/CSS/JavaScript实现（ES6+）
- 模块化架构：核心数据、游戏逻辑、AI、UI、控制器分离
- 使用DOM渲染麻将牌（配合图片资源）
- 简约现代的扁平设计风格
- 配色方案：绿色桌面背景，白色牌面
- 支持触摸操作

## 7. 技术考虑

- 纯前端实现，无需后端服务器
- 使用ES6 Class语法
- 模块间通过 window 对象导出
- 支持现代浏览器（Chrome、Firefox、Safari、Edge）
- 移动端触摸支持
- 并发控制防止操作冲突

## 8. 验收标准

- [x] 完整一局游戏可以正常进行
- [x] 胡牌判定正确
- [x] AI可以正常对战
- [x] 无控制台严重错误
- [x] 移动端可正常操作

## 9. 已实现功能

| 功能 | 状态 | 说明 |
|------|------|------|
| 核心数据结构 | ✅ | Tile, TileSet, Hand 类 |
| 游戏逻辑 | ✅ | MahjongGame 类 |
| AI 决策 | ✅ | MahjongAI 类，3种难度 |
| UI 渲染 | ✅ | MahjongUI 类 |
| 控制器 | ✅ | GameController 类 |
| 碰牌 | ✅ | 完整实现 |
| 明杠 | ✅ | 完整实现 |
| 暗杠 | ✅ | 完整实现 |
| 补杠 | ✅ | 完整实现 |
| 胡牌检测 | ✅ | 基本牌型检测 |
| 番型计分 | ✅ | 多种番型 |
| 七对 | ✅ | 特殊胡牌 |
| 十三幺 | ✅ | 特殊胡牌 |
| 调试面板 | ✅ | 状态显示、作弊模式、自动出牌 |
| 音效 | ✅ | 各种操作音效 |
| 动画 | ✅ | 发牌、出牌、碰杠胡动画 |
| 响应式 | ✅ | 支持移动端 |

---

## 10. 技术规范

### 10.1 项目结构

```
mahjong-game/
├── index.html              # 游戏主页面
├── css/
│   └── style.css           # 所有样式（单文件）
├── js/
│   ├── mahjong.js          # 核心数据结构 (Tile, TileSet, Hand)
│   ├── game.js             # 游戏逻辑 (MahjongGame)
│   ├── ai.js               # AI决策 (MahjongAI)
│   ├── ui.js               # UI渲染 (MahjongUI)
│   └── controller.js       # 控制器 (GameController)
├── assets/
│   └── tiles/              # 麻将牌图片
│       ├── Man1.png ~ Man9.png   # 万子
│       ├── Sou1.png ~ Sou9.png   # 条子
│       ├── Pin1.png ~ Pin9.png   # 筒子
│       └── Back.png             # 牌背
├── sounds/                 # 音效文件
├── test/                   # 测试文件
│   ├── static-test.js
│   └── e2e-test.js
└── package.json
```

### 10.2 模块依赖顺序

JS 文件必须按以下顺序加载：

```
mahjong.js → game.js → ai.js → ui.js → controller.js
     │         │         │        │          │
     │         │         │        │          └── 依赖以上所有
     │         │         │        └── 独立
     │         │         └── 依赖 mahjong.js
     │         └── 依赖 mahjong.js
     └── 基础模块，无依赖
```

### 10.3 类 API 规范

#### Tile 类
| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `constructor(suit, value)` | suit: '万'\|'条'\|'筒', value: 1-9 | Tile | 创建麻将牌实例 |
| `getId()` | - | string | 返回唯一标识如 "万5" |
| `getName()` | - | string | 返回中文名如 "五万" |
| `getImageName()` | - | string | 返回图片文件名如 "Man5.png" |
| `clone()` | - | Tile | 返回新实例 |

#### TileSet 类
| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `addTile(tile)` | Tile | void | 添加单张牌 |
| `addTiles(tiles)` | Tile[] | void | 批量添加 |
| `removeTile(suit, value)` | string, number | Tile \| null | 移除并返回 |
| `hasTile(suit, value)` | string, number | boolean | 是否存在 |
| `countTile(suit, value)` | string, number | number | 统计数量 |
| `getAllTiles()` | - | Tile[] | 返回副本 |
| `getCount()` | - | number | 牌数 |
| `shuffle()` | - | void | Fisher-Yates 洗牌 |
| `sort()` | - | void | 按花色和点数排序 |

#### Hand 类
| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `canPeng(suit, value)` | string, number | boolean | 能否碰 |
| `canMingGang(suit, value)` | string, number | boolean | 能否明杠 |
| `canAnGang(suit, value)` | string, number | boolean | 能否暗杠 |
| `canBuGang(suit, value)` | string, number | boolean | 能否补杠 |
| `getAnGangTiles()` | - | Tile[] | 返回可暗杠的牌 |
| `getBuGangTiles()` | - | Tile[] | 返回可补杠的牌 |
| `canWin()` | - | boolean | 胡牌检测 |
| `calculateWinFan(winType)` | string | object | 计算番型 |

#### MahjongGame 类
| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `dealTiles()` | - | void | 发牌 |
| `drawTile(playerIndex)` | number | Tile \| null | 摸牌 |
| `discardTile(playerIndex, tile)` | number, Tile | void | 出牌 |
| `getCurrentPlayer()` | - | number | 当前玩家索引 |
| `getDealer()` | - | number | 庄家索引 |
| `getRemainingTiles()` | - | number | 剩余牌数 |
| `isGameOver()` | - | boolean | 游戏是否结束 |
| `checkOtherPlayersActions(playerIndex, tile)` | number, Tile | Action[] | 检查其他玩家可执行操作 |

#### MahjongAI 类
| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `decideDiscard(hand)` | Hand | Tile | 选择打出的牌 |
| `decidePeng(hand, tile)` | Hand, Tile | boolean | 是否碰牌 |
| `decideGang(hand, tile)` | Hand, Tile | boolean | 是否杠牌 |
| `decideAnGang(hand, tile)` | Hand, Tile | boolean | 是否暗杠 |
| `decideBuGang(hand, tile)` | Hand, Tile | boolean | 是否补杠 |
| `decideWin(hand, tile)` | Hand, Tile | boolean | 是否胡牌 |
| `handlePendingActions(game)` | MahjongGame | Action \| null | 处理待定操作 |

### 10.4 数据结构定义

#### exposed 牌组结构
```javascript
{
    type: 'peng' | 'angang' | 'minggang' | 'bugang' | 'chi',
    tiles: Tile[]  // 该牌组包含的牌
}
```

#### pendingActions 结构
```javascript
{
    playerIndex: number,     // 玩家索引 0-3
    action: 'peng' | 'gang' | 'hu' | 'zimo' | 'chi',
    tile: Tile,              // 触发操作的牌
    gangType?: 'minggang' | 'angang' | 'bugang',  // 杠牌类型
    combinations?: ChiCombination[]  // 吃牌组合
}
```

#### 吃牌组合结构
```javascript
{
    type: 'lower' | 'middle' | 'upper',  // 低吃、中吃、高吃
    tiles: [Tile, Tile],                 // 手牌中需要的两张
    discardedTile: Tile                  // 打出的牌
}
```

### 10.5 算法规范

#### 胡牌判断算法
```
1. 检查牌数是否为 13 或 14 张
2. 优先检查特殊牌型（七对、龙七对）
3. 遍历寻找对子作为将牌
4. 递归检查剩余牌能否组成面子（刻子或顺子）
```

#### AI 出牌评估算法
```
牌价值 = 数量加成 + 顺子潜力 + 边张惩罚

数量加成:
  - 刻子（3张相同）: +30
  - 对子（2张相同）: +20

顺子潜力:
  - 能成顺子（已有相邻牌）: +15
  - 有潜力（间隔一张）: +8

边张惩罚:
  - 1号牌: -3
  - 9号牌: -3
```

#### AI 难度行为
| 难度 | 碰牌概率 | 杠牌概率 | 出牌策略 |
|------|----------|----------|----------|
| 简单 | 50% | 30% | 随机出牌 |
| 中等 | 评估后决定 | 评估后决定 | 打低价值牌 |
| 困难 | 评估后决定 | 考虑风险 | 听牌优先、避免点炮 |

### 10.6 番型计分规则

#### 计分公式
```
基础分 = 2^番数
最终分 = 基础分 × (自摸? 2 : 1) × (庄家? 2 : 1)
```

#### 番型番数
| 番型 | 番数 | 说明 |
|------|------|------|
| 平胡 | 1 | 基本胡牌（4面子1对子） |
| 对对胡 | 2 | 四个刻子+一对 |
| 清一色 | 4 | 单一花色 |
| 七对 | 2 | 七个对子 |
| 清七对 | 8 | 清一色七对 |
| 龙七对 | 4 | 七对中有一杠 |
| 清龙七对 | 16 | 清一色龙七对 |
| 十八学士 | 16 | 特殊牌型 |
| 天胡 | 32 | 庄家起手胡 |
| 地胡 | 32 | 闲家第一轮胡 |
| 杠上开花 | +2 | 杠后自摸 |
| 抢杠胡 | +2 | 胡别人的补杠 |
| 金钩钓 | +4 | 单吊将牌 |
| 根 | +1 | 每张多余的相同牌 |

### 10.7 资源文件规范

#### 麻将牌图片
| 花色 | 文件名 | 说明 |
|------|--------|------|
| 万子 | Man1.png ~ Man9.png | 一万到九万 |
| 条子 | Sou1.png ~ Sou9.png | 一条到九条 |
| 筒子 | Pin1.png ~ Pin9.png | 一筒到九筒 |
| 背面 | Back.png | 牌背面 |

#### 音效文件
| 文件 | 触发时机 |
|------|----------|
| deal.mp3 | 发牌、摸牌 |
| discard.mp3 | 出牌 |
| peng.mp3 | 碰牌 |
| gang.mp3 | 杠牌 |
| hu.mp3 | 胡牌 |
| win.mp3 | 游戏胜利 |

### 10.8 UI 元素规范

#### HTML 元素 ID
| ID | 用途 |
|----|------|
| `player-hand` | 玩家手牌容器 |
| `remaining-tiles` | 剩余牌数显示 |
| `player-score` | 玩家分数 |
| `peng-btn` | 碰牌按钮 |
| `gang-btn` | 杠牌按钮 |
| `hu-btn` | 胡牌按钮 |
| `pass-btn` | 过牌按钮 |
| `chi-btn` | 吃牌按钮 |
| `difficulty-select` | AI难度选择器 |
| `debug-panel` | 调试面板 |
| `debug-toggle-btn` | 调试面板开关 |
| `show-ai-hands` | 显示AI手牌复选框 |
| `debug-auto-play` | 自动出牌按钮 |
| `debug-new-game` | 新游戏按钮 |

#### CSS 动画类
| 类名 | 用途 |
|------|------|
| `.selected` | 选中的牌 |
| `.tile-back` | 牌背面 |
| `.animated-deal` | 发牌动画 |
| `.animated-discard` | 出牌动画 |
| `.animated-penggang` | 碰杠动画 |
| `.animated-win` | 胡牌动画 |
| `.thinking` | AI思考状态 |

### 10.9 配置参数

#### GameController 配置
```javascript
{
    aiDelay: 1000,        // AI思考延迟 (ms)
    actionDelay: 500,     // 操作间延迟 (ms)
    welcomeDelay: 2000    // 欢迎消息延迟 (ms)
}
```

#### 动画时长
```javascript
{
    dealDuration: 300,    // 发牌动画
    discardDuration: 200, // 出牌动画
    pengGangDuration: 300,// 碰杠动画
    winDuration: 500      // 胜利动画
}
```

### 10.10 全局导出

模块通过 `window` 对象导出：

```javascript
// mahjong.js
window.Tile
window.TileSet
window.Hand
window.createCompleteTileSet
window.checkWinSimple
window.FAN_TYPES
window.calculateFan
window.calculateFinalScore

// game.js
window.MahjongGame

// ai.js
window.MahjongAI
window.AI_DIFFICULTY

// ui.js
window.MahjongUI

// controller.js
window.GameController
```
