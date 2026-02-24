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
        this.pendingActions = []; // 等待响应的操作
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

            // 检查其他玩家是否可以碰、杠、胡
            this.checkOtherPlayersActions(playerIndex, discardedTile);

            return discardedTile;
        }
        return null; // 打牌失败
    }

    // 检查其他玩家是否可以碰、杠、胡
    checkOtherPlayersActions(playerIndex, discardedTile) {
        this.pendingActions = [];

        // 检查胡牌
        const winActions = this.checkWin(playerIndex, discardedTile);
        this.pendingActions.push(...winActions);

        // 检查杠牌
        const gangActions = this.checkGang(playerIndex, discardedTile);
        this.pendingActions.push(...gangActions);

        // 检查碰牌
        const pengActions = this.checkPeng(playerIndex, discardedTile);
        this.pendingActions.push(...pengActions);

        // 返回等待的操作（不自动轮换玩家，由UI层处理）
        return this.pendingActions;
    }

    // 处理等待的操作
    handlePendingAction(action, playerIndex, tile) {
        switch (action) {
            case 'peng':
                return this.pengTile(playerIndex, tile.suit, tile.value);
            case 'gang':
                return this.gangTile(playerIndex, tile.suit, tile.value);
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
                    tile: discardedTile
                });
            }
        }
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
    gangTile(playerIndex, suit, value) {
        const result = this.players[playerIndex].gangTile(suit, value);
        if (result) {
            // 杠牌成功，该玩家再摸一张牌
            const newTile = this.drawTile(playerIndex);
            if (newTile) {
                console.log(`玩家 ${playerIndex} 杠牌成功，摸到新牌: ${newTile.getName()}`);

                // 检查是否自摸胡牌
                if (this.players[playerIndex].canWin()) {
                    console.log(`玩家 ${playerIndex} 自摸胡牌！`);
                    this.endGame();
                }
            }

            // 该玩家继续出牌
            this.currentPlayer = playerIndex;
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

        // 检查自摸胡牌（不自动结束，让UI层处理）
        if (this.checkSelfWin(this.currentPlayer)) {
            this.pendingActions = [{
                playerIndex: this.currentPlayer,
                action: 'zimo',
                tile: newTile
            }];
            console.log(`玩家 ${this.currentPlayer} 可以自摸胡牌！`);
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

    // 获取等待的操作
    getPendingActions() {
        return [...this.pendingActions];
    }

    // 清除等待的操作
    clearPendingActions() {
        this.pendingActions = [];
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