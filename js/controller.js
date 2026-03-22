/**
 * 麻将游戏控制器
 * 负责协调Game、UI、AI之间的交互
 */

class GameController {
    constructor() {
        this.game = null;
        this.ui = null;
        this.ais = [];
        this.aiDifficulty = AI_DIFFICULTY.MEDIUM; // 默认难度

        // 并发控制
        this.isProcessingAction = false; // 防止快速点击打出多张牌

        // 配置
        this.config = {
            aiDelay: 1000,        // AI思考延迟
            actionDelay: 500,     // 操作间延迟
            welcomeDelay: 2000    // 欢迎消息延迟
        };
    }

    // 设置AI难度
    setAIDifficulty(difficulty) {
        this.aiDifficulty = difficulty;
        // 更新所有AI的难度
        this.ais.forEach(ai => ai.setDifficulty(difficulty));
        console.log(`AI难度已设置为: ${difficulty}`);
    }

    // 获取AI难度
    getAIDifficulty() {
        return this.aiDifficulty;
    }

    // 初始化游戏
    init() {
        // 创建游戏实例
        this.game = new MahjongGame();

        // 创建UI实例
        this.ui = new MahjongUI();

        // 从UI读取初始难度
        const selectedDifficulty = this.ui.getSelectedDifficulty();
        this.aiDifficulty = selectedDifficulty;

        // 创建AI实例（使用配置的难度）
        this.ais = [
            new MahjongAI(1, this.aiDifficulty),
            new MahjongAI(2, this.aiDifficulty),
            new MahjongAI(3, this.aiDifficulty)
        ];

        console.log(`AI难度: ${this.aiDifficulty}`);

        // 设置UI回调
        this.setupUICallbacks();

        // 初始化游戏逻辑
        this.game.initGame();

        // 渲染初始UI
        this.updateUI();

        // 显示欢迎消息
        this.showWelcome();

        // 检查庄家起手状态
        this.checkDealerInitialHand();

        console.log('游戏初始化完成');
    }

    // 设置UI回调
    setupUICallbacks() {
        // 设置牌被选择的回调
        this.ui.setOnTileSelected((suit, value, index) => {
            this.handleTileSelected(suit, value, index);
        });

        // 设置操作按钮回调
        this.ui.setOnAction((action) => {
            this.handleAction(action);
        });

        // 设置难度变化回调
        this.ui.setOnDifficultyChange((difficulty) => {
            this.setAIDifficulty(difficulty);
        });

        // 初始化调试面板
        this.ui.initDebugPanel();

        // 设置调试面板回调
        this.ui.setOnShowAiHandsChange((show) => {
            this.updateUI();
        });

        this.ui.setOnDebugNewGame(() => {
            location.reload();
        });

        this.ui.setOnDebugAutoPlay(() => {
            this.autoPlayForPlayer();
        });
    }

    // 显示欢迎消息
    showWelcome() {
        this.ui.showGameTip("欢迎来到四川麻将血战到底！");
        setTimeout(() => {
            this.ui.showGameTip("请选择一张牌出牌");
        }, this.config.welcomeDelay);
    }

    // 检查庄家起手状态
    checkDealerInitialHand() {
        const dealer = this.game.dealer;

        if (dealer === 0) {
            // 玩家是庄家，检查是否可以自摸
            if (this.game.players[0].canWin()) {
                this.game.pendingActions = [{
                    playerIndex: 0,
                    action: 'zimo',
                    tile: null
                }];
                this.updateUI();
            }
            // 等待玩家出牌或自摸
        } else {
            // AI是庄家，检查是否可以自摸
            if (this.game.players[dealer].canWin()) {
                console.log(`AI ${dealer} 天和！`);
                this.ui.playSound('win');
                this.ui.showWinAnimation();
                this.game.endGame();
                this.updateUI();
                this.ui.showGameOver(`AI ${dealer} 天和！`);
                return;
            }
            // AI先出牌
            setTimeout(() => {
                this.ui.showGameTip(`AI ${dealer} 正在思考...`);
                setTimeout(() => {
                    this.aiPlayTurn(dealer);
                }, this.config.aiDelay);
            }, this.config.aiDelay);
        }
    }

    // 处理牌被选择
    handleTileSelected(suit, value, index) {
        console.log(`选择了牌: ${suit}${value} (索引: ${index})`);

        // 如果正在处理其他操作，忽略点击（防止快速打出多张牌）
        if (this.isProcessingAction) {
            console.log('操作处理中，忽略点击');
            return;
        }

        // 如果不是当前玩家或有等待的操作，忽略
        if (this.game.getCurrentPlayer() !== 0 || this.game.getPendingActions().length > 0) {
            return;
        }

        // 设置处理锁
        this.isProcessingAction = true;

        // 执行出牌
        const discardedTile = this.game.discardTile(0, suit, value);
        if (!discardedTile) {
            this.isProcessingAction = false;
            return;
        }

        console.log(`玩家出牌: ${discardedTile.getName()}`);
        this.ui.showGameTip(`你打出了 ${discardedTile.getName()}`);

        // 语音播报出牌
        this.ui.announce(discardedTile.getName(), 0);

        // 更新UI
        this.updateUI();

        // 检查游戏是否结束
        if (this.checkGameEnd()) {
            this.isProcessingAction = false;
            return;
        }

        // 处理后续操作
        this.handleAfterDiscard();
    }

    // 处理操作按钮点击
    handleAction(action) {
        console.log(`执行操作: ${action}`);

        if (action === 'pass') {
            this.handlePass();
        } else {
            this.handlePlayerAction(action);
        }
    }

    // 处理过牌
    handlePass() {
        this.game.clearPendingActions();
        this.ui.showGameTip("你选择过了");
        this.updateUI();

        setTimeout(() => {
            this.nextPlayerTurn();
        }, this.config.actionDelay);
    }

    // 处理玩家操作（碰/杠/胡/自摸/吃）
    handlePlayerAction(action) {
        const pendingActions = this.game.getPendingActions();
        const actionItem = pendingActions.find(item =>
            (item.action === action || (action === 'hu' && item.action === 'zimo')) &&
            item.playerIndex === 0
        );

        if (!actionItem) return;

        const actualAction = actionItem.action;

        // 吃牌需要选择组合
        if (actualAction === 'chi') {
            this.handleChiAction(actionItem);
            return;
        }

        const result = this.game.handlePendingAction(actualAction, 0, actionItem.tile, null, actionItem.gangType);

        if (!result) return;

        console.log(`操作 ${actualAction} 成功`);

        // 播放音效和显示动画（玩家操作，playerIndex = 0）
        this.playActionFeedback(actualAction, 0);

        this.game.clearPendingActions();
        this.updateUI();

        // 检查游戏是否结束
        if (this.checkGameEnd()) return;

        // 碰或杠后继续出牌，否则轮到下一位
        if (actualAction !== 'peng' && actualAction !== 'gang') {
            setTimeout(() => {
                this.nextPlayerTurn();
            }, this.config.actionDelay);
        } else {
            // 碰或杠后，释放锁让玩家可以出牌
            this.releaseActionLock();
            this.ui.showGameTip("请出一张牌");
        }
    }

    // 处理吃牌操作
    handleChiAction(actionItem) {
        const combinations = actionItem.combinations || this.game.getChiCombinations();

        if (!combinations || combinations.length === 0) {
            console.log('没有可用的吃牌组合');
            return;
        }

        // 如果只有一个组合，直接执行
        if (combinations.length === 1) {
            this.executeChi(combinations[0], actionItem.tile);
            return;
        }

        // 多个组合时，让玩家选择
        this.showChiSelection(combinations, actionItem.tile);
    }

    // 显示吃牌选择界面
    showChiSelection(combinations, tile) {
        // 创建选择面板
        const panel = document.createElement('div');
        panel.className = 'chi-selection-panel';
        panel.innerHTML = '<div class="chi-selection-title">选择吃牌组合</div>';

        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'chi-options';

        combinations.forEach((combo, index) => {
            const option = document.createElement('div');
            option.className = 'chi-option';
            option.innerHTML = `
                <div class="chi-tiles">
                    ${combo.tiles.map(t => `<span class="chi-tile">${t.getName()}</span>`).join(' + ')}
                    + <span class="chi-tile chi-discard">${tile.getName()}</span>
                </div>
            `;
            option.addEventListener('click', () => {
                this.executeChi(combo, tile);
                document.body.removeChild(panel);
            });
            optionsContainer.appendChild(option);
        });

        panel.appendChild(optionsContainer);

        // 添加取消按钮
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'chi-cancel-btn';
        cancelBtn.textContent = '取消';
        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(panel);
            this.handlePass();
        });
        panel.appendChild(cancelBtn);

        document.body.appendChild(panel);
    }

    // 执行吃牌
    executeChi(combination, tile) {
        const result = this.game.handlePendingAction('chi', 0, tile, combination);

        if (!result) {
            console.log('吃牌失败');
            return;
        }

        console.log('吃牌成功');

        // 播放音效和语音（玩家操作，playerIndex = 0）
        this.playActionFeedback('chi', 0);

        this.ui.showGameTip("你吃了！");

        this.game.clearPendingActions();
        this.updateUI();

        // 检查游戏是否结束
        if (this.checkGameEnd()) return;

        // 吃牌后需要出牌
        this.releaseActionLock();
        this.ui.showGameTip("请出一张牌");
    }

    // 播放操作反馈（音效和动画）- 玩家操作
    playActionFeedback(action, playerIndex = 0) {
        const sounds = {
            'peng': 'peng',
            'gang': 'gang',
            'hu': 'hu',
            'zimo': 'hu',
            'chi': 'peng' // 吃牌使用碰的音效
        };

        const tips = {
            'peng': "你碰了！",
            'gang': "你杠了！",
            'hu': "你胡牌了！",
            'zimo': "你自摸胡牌！",
            'chi': "你吃了！"
        };

        if (sounds[action]) {
            this.ui.playSound(sounds[action]);
        }

        // 语音播报操作
        this.ui.announceAction(action, playerIndex);

        if (action === 'peng' || action === 'gang') {
            this.ui.showPengGangAnimation();
        } else if (action === 'hu' || action === 'zimo') {
            this.ui.showWinAnimation();
        }

        this.ui.showGameTip(tips[action] || "");
    }

    // 出牌后的处理
    handleAfterDiscard() {
        const pendingActions = this.game.getPendingActions();

        if (pendingActions.length > 0) {
            setTimeout(() => {
                this.handleAIPendingActions();
            }, this.config.actionDelay);
        } else {
            setTimeout(() => {
                this.nextPlayerTurn();
            }, this.config.actionDelay);
        }
    }

    // 释放操作锁
    releaseActionLock() {
        this.isProcessingAction = false;
    }

    // AI处理等待的操作
    handleAIPendingActions() {
        if (this.game.isGameOver()) return;

        const pendingActions = this.game.getPendingActions();

        if (pendingActions.length === 0) {
            setTimeout(() => {
                this.nextPlayerTurn();
            }, this.config.actionDelay);
            return;
        }

        // 检查是否有玩家的操作
        const playerActions = pendingActions.filter(action => action.playerIndex === 0);
        if (playerActions.length > 0) {
            // 有玩家操作，释放锁让玩家可以操作
            this.releaseActionLock();
            this.handlePlayerPendingActions(playerActions);
            return;
        }

        // 只有AI的操作，自动处理
        this.executeAIAction();
    }

    // 处理玩家的等待操作
    handlePlayerPendingActions(playerActions) {
        this.updateUI();

        const actionNames = {
            'peng': '碰',
            'gang': '杠',
            'hu': '胡',
            'zimo': '自摸',
            'chi': '吃'
        };

        const actions = playerActions.map(action => action.action);
        const actionText = actions.map(action => actionNames[action] || action).join('、');
        this.ui.showGameTip(`你可以${actionText}！`);
    }

    // 执行AI操作
    executeAIAction() {
        const pendingActions = this.game.getPendingActions();
        const aiActions = pendingActions.filter(action => action.playerIndex !== 0);

        if (aiActions.length === 0) return;

        // 检查是否有人可以胡牌（胡牌优先级最高）
        const huActions = aiActions.filter(action => action.action === 'hu');

        if (huActions.length > 0) {
            // 四川麻将血战到底：多人可以同时胡牌
            // 处理所有胡牌操作
            this.handleMultipleHuActions(huActions);
            return;
        }

        // 没有胡牌，按优先级选择操作：杠 > 碰 > 吃
        const priorityOrder = { 'gang': 3, 'peng': 2, 'chi': 1 };
        aiActions.sort((a, b) => (priorityOrder[b.action] || 0) - (priorityOrder[a.action] || 0));

        const action = aiActions[0];
        const ai = this.ais[action.playerIndex - 1];
        const hand = this.game.players[action.playerIndex];

        // 根据操作类型做决策
        let shouldPerform = this.decideAIAction(ai, hand, action);

        if (shouldPerform) {
            this.performAIAction(action);
        } else {
            // AI选择不操作，清除并继续
            this.game.clearPendingActions();
            setTimeout(() => {
                this.nextPlayerTurn();
            }, this.config.actionDelay);
        }
    }

    // 处理多人胡牌（血战到底规则）
    handleMultipleHuActions(huActions) {
        // 先检查玩家是否可以胡
        const playerHu = huActions.find(action => action.playerIndex === 0);

        if (playerHu) {
            // 玩家可以胡，让玩家决定
            this.releaseActionLock();
            this.handlePlayerPendingActions([playerHu]);
            return;
        }

        // 只有 AI 可以胡，按顺序处理
        // 在血战到底中，第一个胡牌的人决定游戏结束
        // 这里简化处理：第一个 AI 胡
        const firstHu = huActions[0];
        this.performAIAction(firstHu);
    }

    // AI决策
    decideAIAction(ai, hand, action) {
        switch (action.action) {
            case 'peng':
                return ai.decidePeng(hand, action.tile);
            case 'gang':
                return ai.decideGang(hand, action.tile);
            case 'hu':
                return ai.decideWin(hand, action.tile);
            case 'chi':
                return ai.decideChi(hand, action.tile);
            default:
                return false;
        }
    }

    // 执行AI操作
    performAIAction(action) {
        let result;

        // 吃牌需要选择组合
        if (action.action === 'chi') {
            const combinations = this.game.getChiCombinations();
            if (combinations && combinations.length > 0) {
                // AI 选择第一个组合（简化处理）
                result = this.game.handlePendingAction('chi', action.playerIndex, action.tile, combinations[0]);
            }
        } else {
            result = this.game.handlePendingAction(action.action, action.playerIndex, action.tile);
        }

        if (!result) return;

        console.log(`AI ${action.playerIndex} 执行操作 ${action.action} 成功`);

        // 播放音效和显示提示
        this.playAIActionFeedback(action);

        this.game.clearPendingActions();
        this.updateUI();

        // 检查游戏是否结束
        if (this.checkGameEnd()) return;

        // 碰、杠、吃后AI继续出牌，否则轮到下一位
        if (action.action === 'peng' || action.action === 'gang' || action.action === 'chi') {
            setTimeout(() => {
                this.aiPlayTurn(action.playerIndex);
            }, this.config.aiDelay);
        } else {
            setTimeout(() => {
                this.nextPlayerTurn();
            }, this.config.actionDelay);
        }
    }

    // 播放AI操作反馈
    playAIActionFeedback(action) {
        const sounds = {
            'peng': 'peng',
            'gang': 'gang',
            'hu': 'hu',
            'chi': 'peng' // 吃牌使用碰的音效
        };

        const tips = {
            'peng': `AI ${action.playerIndex} 碰了`,
            'gang': `AI ${action.playerIndex} 杠了`,
            'hu': `AI ${action.playerIndex} 胡了你的牌！`,
            'chi': `AI ${action.playerIndex} 吃了`
        };

        if (sounds[action.action]) {
            this.ui.playSound(sounds[action.action]);
        }

        // 语音播报AI操作（使用AI的音色，每个AI固定一个声音）
        this.ui.announceAction(action.action, action.playerIndex);

        if (action.action === 'hu') {
            this.ui.showWinAnimation();
        }

        this.ui.showGameTip(tips[action.action] || "");
    }

    // AI执行出牌
    aiPlayTurn(playerIndex) {
        if (this.game.isGameOver()) return;

        const ai = this.ais[playerIndex - 1];
        const hand = this.game.players[playerIndex];

        // 先检查AI是否可以自摸胡牌
        if (hand.canWin()) {
            this.aiSelfWin(playerIndex);
            return;
        }

        // 显示AI思考提示
        this.ui.showGameTip(`AI ${playerIndex} 正在思考出牌...`);

        // 延迟执行AI出牌，增加真实感
        setTimeout(() => {
            const discardedTile = ai.playDiscard(this.game);

            if (discardedTile) {
                this.ui.showGameTip(`AI ${playerIndex} 打出了 ${discardedTile.getName()}`);

                // 语音播报AI出牌（使用AI的音色）
                this.ui.announce(discardedTile.getName(), playerIndex);

                this.updateUI();

                if (this.checkGameEnd()) return;

                this.handleAfterDiscard();
            }
        }, this.config.aiDelay);
    }

    // AI自摸
    aiSelfWin(playerIndex) {
        console.log(`AI ${playerIndex} 自摸胡牌！`);
        this.ui.playSound('win');
        this.ui.showWinAnimation();

        // 语音播报自摸（使用AI的音色）
        this.ui.announceAction('zimo', playerIndex);

        this.ui.showGameTip(`AI ${playerIndex} 自摸胡牌！`);
        this.game.endGame();
        this.updateUI();
        this.ui.showGameOver(`AI ${playerIndex} 自摸胡牌！`);
    }

    // 轮到下一位玩家
    nextPlayerTurn() {
        if (this.game.isGameOver()) return;

        this.game.nextPlayer();
        this.updateUI();

        // 检查游戏是否结束
        if (this.checkGameEnd()) return;

        // 检查是否有自摸操作
        if (this.checkSelfWinAction()) return;

        // 如果轮到AI，AI执行出牌
        const currentPlayer = this.game.getCurrentPlayer();
        if (currentPlayer !== 0) {
            setTimeout(() => {
                this.aiPlayTurn(currentPlayer);
            }, this.config.aiDelay);
        } else {
            // 轮到玩家，释放操作锁
            this.releaseActionLock();
        }
    }

    // 检查自摸操作
    checkSelfWinAction() {
        const pendingActions = this.game.getPendingActions();
        if (pendingActions.length === 0) return false;

        const currentPlayer = this.game.getCurrentPlayer();
        const selfWinAction = pendingActions.find(a =>
            a.playerIndex === currentPlayer && a.action === 'zimo'
        );

        if (!selfWinAction) return false;

        if (currentPlayer === 0) {
            // 玩家可以自摸，释放锁让玩家可以操作
            this.releaseActionLock();
            this.ui.enableActions(['zimo']);
            this.ui.showGameTip("你可以自摸胡牌！");
            return true;
        } else {
            // AI可以自摸
            const ai = this.ais[currentPlayer - 1];
            if (ai.decideSelfWin(this.game.players[currentPlayer])) {
                this.aiSelfWin(currentPlayer);
                return true;
            } else {
                // AI选择不自摸（不应该发生，但作为保险）
                this.game.clearPendingActions();
                setTimeout(() => {
                    this.aiPlayTurn(currentPlayer);
                }, this.config.aiDelay);
                return true;
            }
        }
    }

    // 检查游戏是否结束
    checkGameEnd() {
        if (this.game.isGameOver()) {
            this.releaseActionLock();
            // 显示亮牌
            this.ui.showAllHands(this.game);

            if (this.game.tileSet.getCount() === 0) {
                this.ui.showGameOver("牌堆已空，游戏结束！");
            }
            return true;
        }
        return false;
    }

    // 更新UI
    updateUI() {
        if (!this.game || !this.ui) return;

        // 渲染玩家手牌
        this.ui.renderPlayerHand(this.game.players[0]);

        // 渲染AI手牌
        const aiHands = [
            this.game.players[1],
            this.game.players[2],
            this.game.players[3]
        ];
        this.ui.renderAIHands(aiHands, this.ui.getShowAiHands());

        // 渲染已打出的牌
        this.ui.renderDiscardedTiles(this.game.getDiscardedTiles());

        // 更新游戏信息
        this.ui.updateGameInfo(this.game);

        // 更新调试面板状态
        this.ui.updateDebugGameState(this.game);

        // 检查是否有等待的操作（只显示玩家的操作按钮）
        const pendingActions = this.game.getPendingActions();
        const playerActions = pendingActions.filter(action => action.playerIndex === 0);
        if (playerActions.length > 0) {
            const actions = playerActions.map(action => action.action);
            this.ui.enableActions(actions);
        } else {
            this.ui.hideActions();
        }
    }

    // 自动出牌（调试功能）
    autoPlayForPlayer() {
        if (this.game.getCurrentPlayer() !== 0) {
            console.log('当前不是玩家回合');
            return;
        }

        const hand = this.game.players[0];
        const tiles = hand.getTiles();
        if (tiles.length === 0) return;

        // 检查是否有等待的操作
        const pendingActions = this.game.getPendingActions();
        const playerActions = pendingActions.filter(action => action.playerIndex === 0);

        if (playerActions.length > 0) {
            // 优先处理等待的操作
            const action = playerActions[0];
            this.handlePlayerAction(action.action);
        } else {
            // 随机出一张牌
            const randomIndex = Math.floor(Math.random() * tiles.length);
            const tile = tiles[randomIndex];
            this.handleTileSelected(tile.suit, tile.value, randomIndex);
        }
    }
}

// 导出控制器类
window.GameController = GameController;