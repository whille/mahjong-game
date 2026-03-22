/**
 * 麻将AI逻辑 - 支持多种难度级别
 */

// AI难度级别
const AI_DIFFICULTY = {
    EASY: 'easy',       // 简单：随机出牌，减少碰杠
    MEDIUM: 'medium',   // 中等：基本策略
    HARD: 'hard'        // 困难：高级策略，考虑牌效率
};

class MahjongAI {
    constructor(playerIndex, difficulty = AI_DIFFICULTY.MEDIUM) {
        this.playerIndex = playerIndex;
        this.difficulty = difficulty;

        // 记录已打出的牌（用于困难模式的推断）
        this.knownDiscards = [];
        // 记录其他玩家可能的牌
        this.inferredTiles = {};
        // 当前听的牌
        this.tingTiles = [];
    }

    // 设置难度
    setDifficulty(difficulty) {
        this.difficulty = difficulty;
    }

    // 获取难度
    getDifficulty() {
        return this.difficulty;
    }

    // 更新听的牌列表
    updateTingTiles(hand, game) {
        if (game && typeof game.getValidTingTiles === 'function') {
            this.tingTiles = game.getValidTingTiles(this.playerIndex);
        } else {
            this.tingTiles = hand.getTingTiles();
        }
    }

    // 检查是否听牌
    isTing() {
        return this.tingTiles.length > 0;
    }

    // 获取听的牌列表
    getTingTiles() {
        return this.tingTiles;
    }

    // 检查打出的牌是否会影响听牌
    wouldBreakTing(tile, hand) {
        if (!this.isTing()) return false;

        // 模拟打出这张牌后检查是否还听牌
        const originalTiles = hand.getTiles();
        hand.tiles.removeTile(tile.suit, tile.value);
        const stillTing = hand.isTing();
        hand.tiles.addTile(tile);

        return !stillTing;
    }

    // 记录打出的牌
    recordDiscard(tile, playerIndex) {
        this.knownDiscards.push({
            tile: tile,
            player: playerIndex,
            timestamp: Date.now()
        });
    }

    // AI出牌决策
    decideDiscard(hand) {
        const tiles = hand.getTiles();
        if (tiles.length === 0) return null;

        switch (this.difficulty) {
            case AI_DIFFICULTY.EASY:
                return this.decideDiscardEasy(tiles);
            case AI_DIFFICULTY.MEDIUM:
                return this.decideDiscardMedium(tiles, hand);
            case AI_DIFFICULTY.HARD:
                return this.decideDiscardHard(tiles, hand);
            default:
                return this.decideDiscardMedium(tiles, hand);
        }
    }

    // 简单难度：随机出牌，略优先孤张
    decideDiscardEasy(tiles) {
        // 30%概率完全随机
        if (Math.random() < 0.3) {
            return tiles[Math.floor(Math.random() * tiles.length)];
        }

        // 70%概率优先打出孤张
        const tileCounts = this.getTileCounts(tiles);
        const singleTiles = tiles.filter(tile => tileCounts[tile.getId()] === 1);

        if (singleTiles.length > 0) {
            return singleTiles[Math.floor(Math.random() * singleTiles.length)];
        }

        // 否则随机
        return tiles[Math.floor(Math.random() * tiles.length)];
    }

    // 中等难度：基本策略
    decideDiscardMedium(tiles, hand) {
        // 统计每张牌的数量
        const tileCounts = this.getTileCounts(tiles);

        // 如果听牌了，保持听牌状态优先
        if (this.isTing()) {
            // 找到不会破坏听牌的牌
            const safeTiles = tiles.filter(tile => !this.wouldBreakTing(tile, hand));
            if (safeTiles.length > 0) {
                // 从安全的牌中随机选一张
                return safeTiles[Math.floor(Math.random() * safeTiles.length)];
            }
        }

        // 评估每张牌的价值
        const tileValues = tiles.map(tile => ({
            tile: tile,
            value: this.evaluateTileValue(tile, tileCounts, hand)
        }));

        // 按价值排序，选择价值最低的
        tileValues.sort((a, b) => a.value - b.value);

        // 从价值最低的几张中随机选一张（增加不可预测性）
        const lowValueTiles = tileValues.slice(0, Math.min(3, tileValues.length));
        return lowValueTiles[Math.floor(Math.random() * lowValueTiles.length)].tile;
    }

    // 困难难度：高级策略
    decideDiscardHard(tiles, hand) {
        const tileCounts = this.getTileCounts(tiles);

        // 如果听牌了，保持听牌状态优先
        if (this.isTing()) {
            // 找到不会破坏听牌的牌
            const safeTiles = tiles.filter(tile => !this.wouldBreakTing(tile, hand));
            if (safeTiles.length > 0) {
                // 从安全的牌中选择价值最低的
                const tileValues = safeTiles.map(tile => ({
                    tile: tile,
                    value: this.evaluateTileValue(tile, tileCounts, hand)
                }));
                tileValues.sort((a, b) => a.value - b.value);
                return tileValues[0].tile;
            }
        }

        // 计算每种牌型的完整性得分
        const analysis = this.analyzeHand(tiles, tileCounts);

        // 找出对胡牌贡献最小的牌
        let worstTile = null;
        let worstScore = Infinity;

        tiles.forEach(tile => {
            const score = this.calculateDiscardScore(tile, tiles, tileCounts, analysis);
            if (score < worstScore) {
                worstScore = score;
                worstTile = tile;
            }
        });

        return worstTile || tiles[0];
    }

    // 统计每张牌的数量
    getTileCounts(tiles) {
        const counts = {};
        tiles.forEach(tile => {
            const id = tile.getId();
            counts[id] = (counts[id] || 0) + 1;
        });
        return counts;
    }

    // 评估牌的价值（越高越应该保留）
    evaluateTileValue(tile, tileCounts, hand) {
        let value = 0;
        const suit = tile.suit;
        const value_num = tile.value;

        // 字牌价值评估
        if (tile.isZiPai && tile.isZiPai()) {
            // 字牌数量加成
            const count = tileCounts[tile.getId()] || 0;
            if (count >= 3) value += 35; // 刻子很有价值
            else if (count >= 2) value += 25; // 对子也有价值
            else value += 5; // 单张字牌价值较低

            return value;
        }

        // 序数牌价值评估
        // 数量加成：对子和刻子更有价值
        const count = tileCounts[tile.getId()] || 0;
        if (count >= 3) value += 30;
        else if (count >= 2) value += 20;

        // 顺子潜力加成
        if (['万', '条', '筒'].includes(suit)) {
            // 检查与相邻牌的关系
            const hasLower = tileCounts[`${suit}${value_num - 1}`];
            const hasUpper = tileCounts[`${suit}${value_num + 1}`];

            if (hasLower && hasUpper) value += 15; // 可以组成顺子
            else if (hasLower || hasUpper) value += 8; // 有组成顺子的潜力
        }

        // 边张（1和9）价值略低
        if (value_num === 1 || value_num === 9) {
            value -= 3;
        }

        return value;
    }

    // 分析手牌结构
    analyzeHand(tiles, tileCounts) {
        const analysis = {
            pairs: 0,           // 对子数
            pungs: 0,           // 刻子数
            chows: 0,           // 顺子潜力
            isolated: 0,        // 孤张数
            needsForWin: 0      // 距离胡牌还需要几步
        };

        const checked = new Set();

        tiles.forEach(tile => {
            const id = tile.getId();
            if (checked.has(id)) return;

            const count = tileCounts[id];

            if (count >= 3) {
                analysis.pungs++;
            } else if (count === 2) {
                analysis.pairs++;
            } else if (count === 1) {
                // 检查是否有顺子潜力
                const suit = tile.suit;
                const value = tile.value;

                if (['万', '条', '筒'].includes(suit)) {
                    const hasLower = tileCounts[`${suit}${value - 1}`];
                    const hasUpper = tileCounts[`${suit}${value + 1}`];

                    if (hasLower || hasUpper) {
                        analysis.chows++;
                    } else {
                        analysis.isolated++;
                    }
                } else {
                    analysis.isolated++;
                }
            }

            checked.add(id);
        });

        return analysis;
    }

    // 计算打出某张牌的得分（越高越不应该打）
    calculateDiscardScore(tile, tiles, tileCounts, analysis) {
        let score = 0;

        const id = tile.getId();
        const count = tileCounts[id];

        // 如果打出后变成孤张，扣分
        if (count === 2) {
            score -= 20; // 打出对子的一张
        }

        // 检查顺子联系
        const suit = tile.suit;
        const value = tile.value;

        if (['万', '条', '筒'].includes(suit)) {
            let connections = 0;

            // 检查与相邻牌的关系
            if (tileCounts[`${suit}${value - 1}`]) connections++;
            if (tileCounts[`${suit}${value - 2}`]) connections++;
            if (tileCounts[`${suit}${value + 1}`]) connections++;
            if (tileCounts[`${suit}${value + 2}`]) connections++;

            // 打出断联的牌扣分更多
            score += connections * 5;
        }

        // 考虑已打出的牌（困难模式特有）
        if (this.difficulty === AI_DIFFICULTY.HARD) {
            // 检查这张牌是否已经打出过3张
            const discardedCount = this.knownDiscards.filter(
                d => d.tile.getId() === id
            ).length;

            // 如果外面已经有3张，这张牌很难凑成刻子，降低保留价值
            if (discardedCount >= 3) {
                score -= 15;
            }
        }

        return score;
    }

    // AI碰牌决策
    decidePeng(hand, discardedTile) {
        if (!hand.canPeng(discardedTile.suit, discardedTile.value)) {
            return false;
        }

        switch (this.difficulty) {
            case AI_DIFFICULTY.EASY:
                // 简单：50%概率碰
                return Math.random() < 0.5;

            case AI_DIFFICULTY.MEDIUM:
                // 中等：评估碰牌价值
                return this.evaluatePengValue(hand, discardedTile) > 0;

            case AI_DIFFICULTY.HARD:
                // 困难：更精确的评估
                return this.evaluatePengValueAdvanced(hand, discardedTile) > 0;

            default:
                return true;
        }
    }

    // 评估碰牌价值
    evaluatePengValue(hand, discardedTile) {
        const tiles = hand.getTiles();
        const tileCounts = this.getTileCounts(tiles);

        // 基础价值：碰牌可以形成一个面子
        let value = 10;

        // 检查碰后是否影响其他牌型
        const suit = discardedTile.suit;
        const value_num = discardedTile.value;

        // 如果有相邻牌，可能会影响顺子
        if (['万', '条', '筒'].includes(suit)) {
            if (tileCounts[`${suit}${value_num - 1}`] || tileCounts[`${suit}${value_num + 1}`]) {
                value -= 3; // 可能影响顺子组成
            }
        }

        return value;
    }

    // 高级评估碰牌价值
    evaluatePengValueAdvanced(hand, discardedTile) {
        let value = this.evaluatePengValue(hand, discardedTile);

        // 困难模式：考虑已打出的牌
        const id = discardedTile.getId();
        const discardedCount = this.knownDiscards.filter(
            d => d.tile.getId() === id
        ).length;

        // 如果这是最后一张能碰的牌，更有价值
        if (discardedCount === 0) {
            value += 5;
        }

        return value;
    }

    // AI杠牌决策
    decideGang(hand, discardedTile) {
        if (!hand.canMingGang(discardedTile.suit, discardedTile.value)) {
            return false;
        }

        switch (this.difficulty) {
            case AI_DIFFICULTY.EASY:
                // 简单：30%概率杠
                return Math.random() < 0.3;

            case AI_DIFFICULTY.MEDIUM:
                // 中等：杠牌通常有利
                return true;

            case AI_DIFFICULTY.HARD:
                // 困难：考虑杠后风险
                return this.evaluateGangRisk(hand, discardedTile);

            default:
                return true;
        }
    }

    // 评估杠牌风险
    evaluateGangRisk(hand, discardedTile) {
        // 杠牌会多摸一张牌，通常有利
        // 但也会暴露牌型信息

        // 基本策略：总是杠
        return true;
    }

    // AI暗杠决策
    decideAnGang(hand, tile) {
        if (!hand.canAnGang(tile.suit, tile.value)) {
            return false;
        }

        switch (this.difficulty) {
            case AI_DIFFICULTY.EASY:
                return Math.random() < 0.4;

            case AI_DIFFICULTY.MEDIUM:
            case AI_DIFFICULTY.HARD:
                // 暗杠通常有利
                return true;

            default:
                return true;
        }
    }

    // AI补杠决策
    decideBuGang(hand, tile) {
        if (!hand.canBuGang(tile.suit, tile.value)) {
            return false;
        }

        switch (this.difficulty) {
            case AI_DIFFICULTY.EASY:
                return Math.random() < 0.3;

            case AI_DIFFICULTY.MEDIUM:
                return true;

            case AI_DIFFICULTY.HARD:
                // 困难模式考虑被抢杠的风险
                // 但通常补杠还是有利
                return true;

            default:
                return true;
        }
    }

    // AI胡牌决策
    decideWin(hand, discardedTile) {
        // 临时添加牌到手牌中检查
        hand.drawTile(discardedTile);
        const canWin = hand.canWin();
        // 移除临时添加的牌
        hand.discardTile(discardedTile.suit, discardedTile.value);

        if (!canWin) return false;

        // 简单策略：能胡就胡
        // 困难模式可以考虑等更大番型，但这里简化处理
        return true;
    }

    // AI自摸胡牌决策
    decideSelfWin(hand) {
        // 简单策略：能胡就胡
        return hand.canWin();
    }

    // AI吃牌决策
    decideChi(hand, discardedTile) {
        if (!hand.canChi(discardedTile.suit, discardedTile.value)) {
            return false;
        }

        switch (this.difficulty) {
            case AI_DIFFICULTY.EASY:
                // 简单：40%概率吃
                return Math.random() < 0.4;

            case AI_DIFFICULTY.MEDIUM:
            case AI_DIFFICULTY.HARD:
                // 评估吃牌价值
                return this.evaluateChiValue(hand, discardedTile) > 0;

            default:
                return true;
        }
    }

    // 评估吃牌价值
    evaluateChiValue(hand, discardedTile) {
        const combinations = hand.getChiCombinations(discardedTile.suit, discardedTile.value);
        if (combinations.length === 0) return -1;

        // 选择最优的吃牌组合
        let bestValue = -1;

        combinations.forEach(combo => {
            let value = 5; // 基础价值

            // 检查吃后手牌的完整性
            // 简化：吃牌总是有价值的
            if (value > bestValue) {
                bestValue = value;
            }
        });

        return bestValue;
    }

    // 获取最佳吃牌组合
    getBestChiCombination(hand, discardedTile) {
        const combinations = hand.getChiCombinations(discardedTile.suit, discardedTile.value);
        if (combinations.length === 0) return null;

        if (this.difficulty === AI_DIFFICULTY.EASY) {
            // 简单：随机选择
            return combinations[Math.floor(Math.random() * combinations.length)];
        }

        // 中等和困难：选择第一个（简化处理）
        return combinations[0];
    }

    // AI执行出牌
    playDiscard(game) {
        const hand = game.players[this.playerIndex];

        // 更新听牌状态
        this.updateTingTiles(hand, game);

        const tileToDiscard = this.decideDiscard(hand);

        if (tileToDiscard) {
            const discardedTile = game.discardTile(this.playerIndex, tileToDiscard.suit, tileToDiscard.value);
            if (discardedTile) {
                console.log(`AI ${this.playerIndex} (${this.difficulty}) 出牌: ${discardedTile.getName()}`);

                // 记录打出的牌
                this.recordDiscard(discardedTile, this.playerIndex);

                return discardedTile;
            }
        }

        return null;
    }

    // AI处理等待的操作
    handlePendingActions(game) {
        const pendingActions = game.getPendingActions();
        const aiActions = pendingActions.filter(action => action.playerIndex === this.playerIndex);

        if (aiActions.length > 0) {
            // 按优先级选择操作：胡 > 杠 > 碰 > 吃
            const priorityOrder = { 'hu': 4, 'gang': 3, 'peng': 2, 'chi': 1 };
            aiActions.sort((a, b) => (priorityOrder[b.action] || 0) - (priorityOrder[a.action] || 0));

            const action = aiActions[0];
            const hand = game.players[this.playerIndex];

            let shouldPerform = false;
            let combination = null;

            switch (action.action) {
                case 'peng':
                    shouldPerform = this.decidePeng(hand, action.tile);
                    break;
                case 'gang':
                    shouldPerform = this.decideGang(hand, action.tile);
                    break;
                case 'hu':
                    shouldPerform = this.decideWin(hand, action.tile);
                    break;
                case 'chi':
                    shouldPerform = this.decideChi(hand, action.tile);
                    if (shouldPerform) {
                        combination = this.getBestChiCombination(hand, action.tile);
                    }
                    break;
            }

            if (shouldPerform) {
                return { action: action.action, tile: action.tile, combination };
            }
        }

        return null;
    }
}

// 导出AI类和难度常量
window.MahjongAI = MahjongAI;
window.AI_DIFFICULTY = AI_DIFFICULTY;