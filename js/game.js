/**
 * 麻将游戏主逻辑
 */

class MahjongGame {
    constructor() {
        this.tileSet = null; // 完整牌组
        this.players = []; // 玩家手牌
        this.discardedTiles = []; // 已打出的牌
        this.currentPlayer = 0; // 当前玩家索引
        this.gameOver = false; // 游戏是否结束
        this.dealer = 0; // 庄家索引
        this.lastDiscardedTile = null; // 最后打出的牌
        this.lastDiscardPlayer = null; // 最后出牌的玩家索引
        this.pendingActions = []; // 等待响应的操作
        this.isAnimating = false; // 并发控制标志
        this.chiCombinations = []; // 存储吃牌的可选组合
    }

    // 初始化游戏
    initGame() {
        // 创建完整牌组
        this.tileSet = createCompleteTileSet();

        // 创建4个玩家手牌
        for (let i = 0; i < 4; i++) {
            this.players.push(new Hand());
        }

        // 洗牌
        this.tileSet.shuffle();

        // 发牌
        this.dealTiles();

        // 设置当前玩家为庄家
        this.currentPlayer = this.dealer;

        // 游戏开始时，庄家先出牌
        console.log(`游戏开始，庄家是玩家 ${this.dealer}`);
    }

    // 发牌
    dealTiles() {
        // 庄家发14张牌，其他玩家发13张牌
        for (let i = 0; i < 4; i++) {
            const tileCount = (i === this.dealer) ? 14 : 13;
            for (let j = 0; j < tileCount; j++) {
                if (this.tileSet.getCount() > 0) {
                    const tile = this.tileSet.tiles.pop();
                    this.players[i].drawTile(tile);
                }
            }
            // 排序手牌
            this.players[i].sortTiles();
        }
    }

    // 摸牌
    drawTile(playerIndex) {
        if (this.tileSet.getCount() > 0) {
            const tile = this.tileSet.tiles.pop();
            this.players[playerIndex].drawTile(tile);
            return tile;
        }
        return null; // 牌堆已空
    }

    // 打牌
    discardTile(playerIndex, suit, value) {
        const discardedTile = this.players[playerIndex].discardTile(suit, value);
        if (discardedTile) {
            this.discardedTiles.push(discardedTile);
            this.lastDiscardedTile = discardedTile;
            this.lastDiscardPlayer = playerIndex;

            // 检查其他玩家是否可以碰、杠、胡、吃
            this.checkOtherPlayersActions(playerIndex, discardedTile);

            return discardedTile;
        }
        return null; // 打牌失败
    }

    // 检查其他玩家是否可以碰、杠、胡、吃
    checkOtherPlayersActions(playerIndex, discardedTile) {
        this.pendingActions = [];
        this.chiCombinations = [];

        // 检查胡牌（最高优先级）
        const winActions = this.checkWin(playerIndex, discardedTile);
        this.pendingActions.push(...winActions);

        // 检查杠牌
        const gangActions = this.checkGang(playerIndex, discardedTile);
        this.pendingActions.push(...gangActions);

        // 检查碰牌
        const pengActions = this.checkPeng(playerIndex, discardedTile);
        this.pendingActions.push(...pengActions);

        // 检查吃牌（只有下家可以吃，且无人碰/杠/胡时才能吃）
        // 如果已经有胡/杠/碰的操作，则不吃
        const hasHigherPriority = this.pendingActions.length > 0;
        if (!hasHigherPriority) {
            const chiActions = this.checkChi(playerIndex, discardedTile);
            this.pendingActions.push(...chiActions);
        }

        // 返回等待的操作（不自动轮换玩家，由UI层处理）
        return this.pendingActions;
    }

    // 处理等待的操作
    handlePendingAction(action, playerIndex, tile, combination = null, gangType = null) {
        switch (action) {
            case 'chi':
                return this.chiTile(playerIndex, tile.suit, tile.value, combination);
            case 'peng':
                return this.pengTile(playerIndex, tile.suit, tile.value);
            case 'gang':
                return this.gangTile(playerIndex, tile.suit, tile.value, gangType || 'minggang');
            case 'hu':
            case 'zimo':
                // 胡牌逻辑
                console.log(`玩家 ${playerIndex} ${action === 'zimo' ? '自摸' : ''}胡牌！`);
                this.endGame();
                return true;
            default:
                return false;
        }
    }

    // 检查是否有玩家可以碰牌
    checkPeng(playerIndex, discardedTile) {
        // 检查除了出牌玩家外的其他玩家是否可以碰牌
        const results = [];
        for (let i = 0; i < 4; i++) {
            if (i !== playerIndex && this.players[i].canPeng(discardedTile.suit, discardedTile.value)) {
                results.push({
                    playerIndex: i,
                    action: 'peng',
                    tile: discardedTile
                });
            }
        }
        return results;
    }

    // 检查是否有玩家可以杠牌
    checkGang(playerIndex, discardedTile) {
        // 检查除了出牌玩家外的其他玩家是否可以明杠
        const results = [];
        for (let i = 0; i < 4; i++) {
            if (i !== playerIndex && this.players[i].canMingGang(discardedTile.suit, discardedTile.value)) {
                results.push({
                    playerIndex: i,
                    action: 'gang',
                    gangType: 'minggang',
                    tile: discardedTile
                });
            }
        }
        return results;
    }

    // 检查当前玩家是否可以自杠（暗杠或补杠）
    checkSelfGang(playerIndex) {
        const results = [];
        const player = this.players[playerIndex];

        // 检查暗杠
        const anGangTiles = player.getAnGangTiles();
        anGangTiles.forEach(tile => {
            results.push({
                playerIndex: playerIndex,
                action: 'gang',
                gangType: 'angang',
                tile: tile
            });
        });

        // 检查补杠
        const buGangTiles = player.getBuGangTiles();
        buGangTiles.forEach(tile => {
            results.push({
                playerIndex: playerIndex,
                action: 'gang',
                gangType: 'bugang',
                tile: tile
            });
        });

        return results;
    }

    // 检查是否有玩家可以胡牌
    checkWin(playerIndex, discardedTile) {
        // 检查除了出牌玩家外的其他玩家是否可以胡牌
        const results = [];
        for (let i = 0; i < 4; i++) {
            if (i !== playerIndex) {
                // 临时添加打出的牌到玩家手牌中检查是否能胡
                this.players[i].drawTile(discardedTile);
                if (this.players[i].canWin()) {
                    results.push({
                        playerIndex: i,
                        action: 'hu',
                        tile: discardedTile
                    });
                }
                // 移除临时添加的牌
                this.players[i].discardTile(discardedTile.suit, discardedTile.value);
            }
        }
        return results;
    }

    // 检查是否有玩家可以吃牌（只有下家可以吃）
    checkChi(playerIndex, discardedTile) {
        const results = [];
        // 下家索引 = (playerIndex + 1) % 4
        const nextPlayerIndex = (playerIndex + 1) % 4;

        // 检查下家是否可以吃牌
        if (this.players[nextPlayerIndex].canChi(discardedTile.suit, discardedTile.value)) {
            const combinations = this.players[nextPlayerIndex].getChiCombinations(discardedTile.suit, discardedTile.value);
            // 存储吃牌组合供后续选择
            this.chiCombinations = combinations;

            results.push({
                playerIndex: nextPlayerIndex,
                action: 'chi',
                tile: discardedTile,
                combinations: combinations
            });
        }
        return results;
    }

    // 碰牌
    pengTile(playerIndex, suit, value) {
        const result = this.players[playerIndex].pengTile(suit, value);
        if (result) {
            // 碰牌成功，该玩家成为当前玩家
            this.currentPlayer = playerIndex;
            console.log(`玩家 ${playerIndex} 碰牌成功`);
        }
        return result;
    }

    // 杠牌
    gangTile(playerIndex, suit, value, gangType = 'minggang') {
        let result = false;

        switch (gangType) {
            case 'angang':
                result = this.players[playerIndex].doAnGang(suit, value);
                break;
            case 'bugang':
                result = this.players[playerIndex].doBuGang(suit, value);
                break;
            case 'minggang':
            default:
                result = this.players[playerIndex].doMingGang(suit, value);
                break;
        }

        if (result) {
            // 杠牌成功，该玩家再摸一张牌
            const newTile = this.drawTile(playerIndex);
            if (newTile) {
                console.log(`玩家 ${playerIndex} ${this.getGangTypeName(gangType)}成功，摸到新牌: ${newTile.getName()}`);

                // 检查是否自摸胡牌
                if (this.players[playerIndex].canWin()) {
                    this.pendingActions = [{
                        playerIndex: playerIndex,
                        action: 'zimo',
                        tile: newTile
                    }];
                    console.log(`玩家 ${playerIndex} 可以自摸胡牌！`);
                } else {
                    // 检查是否可以继续杠
                    const selfGangActions = this.checkSelfGang(playerIndex);
                    if (selfGangActions.length > 0) {
                        this.pendingActions = selfGangActions;
                        console.log(`玩家 ${playerIndex} 可以继续杠牌！`);
                    }
                }
            }

            // 该玩家继续出牌
            this.currentPlayer = playerIndex;
        }
        return result;
    }

    // 获取杠牌类型名称
    getGangTypeName(gangType) {
        const names = {
            'angang': '暗杠',
            'bugang': '补杠',
            'minggang': '明杠'
        };
        return names[gangType] || '杠牌';
    }

    // 吃牌
    chiTile(playerIndex, suit, value, combination) {
        const result = this.players[playerIndex].chiTile(suit, value, combination);
        if (result) {
            // 吃牌成功，该玩家成为当前玩家
            this.currentPlayer = playerIndex;
            console.log(`玩家 ${playerIndex} 吃牌成功`);
        }
        return result;
    }

    // 检查自摸胡牌
    checkSelfWin(playerIndex) {
        return this.players[playerIndex].canWin();
    }

    // 轮到下一位玩家
    nextPlayer() {
        this.currentPlayer = (this.currentPlayer + 1) % 4;

        // 当前玩家摸牌
        const newTile = this.drawTile(this.currentPlayer);
        if (!newTile) {
            console.log("牌堆已空，游戏结束");
            this.endGame();
            return null;
        }

        console.log(`玩家 ${this.currentPlayer} 摸牌: ${newTile.getName()}`);

        // 检查自摸胡牌（最高优先级）
        if (this.checkSelfWin(this.currentPlayer)) {
            this.pendingActions = [{
                playerIndex: this.currentPlayer,
                action: 'zimo',
                tile: newTile
            }];
            console.log(`玩家 ${this.currentPlayer} 可以自摸胡牌！`);
        } else {
            // 检查是否可以自杠（暗杠或补杠）
            const selfGangActions = this.checkSelfGang(this.currentPlayer);
            if (selfGangActions.length > 0) {
                this.pendingActions = selfGangActions;
                console.log(`玩家 ${this.currentPlayer} 可以自杠！`);
            }
        }

        return newTile;
    }

    // 获取剩余牌数
    getRemainingTiles() {
        return this.tileSet.getCount();
    }

    // 获取已打出的牌
    getDiscardedTiles() {
        return [...this.discardedTiles];
    }

    // 设置当前玩家
    setCurrentPlayer(playerIndex) {
        this.currentPlayer = playerIndex;
    }

    // 获取当前玩家
    getCurrentPlayer() {
        return this.currentPlayer;
    }

    // 获取庄家
    getDealer() {
        return this.dealer;
    }

    // 获取等待的操作
    getPendingActions() {
        return [...this.pendingActions];
    }

    // 获取吃牌组合
    getChiCombinations() {
        return [...this.chiCombinations];
    }

    // 清除等待的操作
    clearPendingActions() {
        this.pendingActions = [];
        this.chiCombinations = [];
    }

    // 游戏是否结束
    isGameOver() {
        return this.gameOver || this.tileSet.getCount() === 0;
    }

    // 结束游戏
    endGame() {
        this.gameOver = true;
        console.log("游戏结束");
    }
}

// 导出游戏类
window.MahjongGame = MahjongGame;