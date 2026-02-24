/**
 * 麻将AI逻辑
 */

class MahjongAI {
    constructor(playerIndex) {
        this.playerIndex = playerIndex;
    }

    // AI出牌决策
    decideDiscard(hand) {
        const tiles = hand.getTiles();
        if (tiles.length === 0) return null;

        // 简单AI策略：
        // 1. 优先打出孤张（单独的牌）
        // 2. 优先打出字牌（如果有）
        // 3. 优先打出数量少的牌

        // 统计每张牌的数量
        const tileCounts = {};
        tiles.forEach(tile => {
            const id = tile.getId();
            tileCounts[id] = (tileCounts[id] || 0) + 1;
        });

        // 寻找孤张（数量为1的牌）
        const singleTiles = tiles.filter(tile => tileCounts[tile.getId()] === 1);

        if (singleTiles.length > 0) {
            // 优先打出孤张
            return singleTiles[0];
        }

        // 如果没有孤张，找出数量最少的牌
        let minCount = Infinity;
        let selectedTile = tiles[0];

        Object.entries(tileCounts).forEach(([id, count]) => {
            if (count < minCount) {
                minCount = count;
                // 根据ID找到对应的牌
                selectedTile = tiles.find(tile => tile.getId() === id);
            }
        });

        return selectedTile;
    }

    // AI碰牌决策
    decidePeng(hand, discardedTile) {
        // 简单策略：如果有对子就碰
        return hand.canPeng(discardedTile.suit, discardedTile.value);
    }

    // AI杠牌决策
    decideGang(hand, discardedTile) {
        // 简单策略：如果有三张就杠
        return hand.canMingGang(discardedTile.suit, discardedTile.value);
    }

    // AI胡牌决策
    decideWin(hand, discardedTile) {
        // 简单策略：能胡就胡
        // 临时添加牌到手牌中检查
        hand.drawTile(discardedTile);
        const canWin = hand.canWin();
        // 移除临时添加的牌
        hand.discardTile(discardedTile.suit, discardedTile.value);
        return canWin;
    }

    // AI自摸胡牌决策
    decideSelfWin(hand) {
        // 简单策略：能胡就胡
        return hand.canWin();
    }

    // AI执行出牌
    playDiscard(game) {
        const hand = game.players[this.playerIndex];
        const tileToDiscard = this.decideDiscard(hand);

        if (tileToDiscard) {
            const discardedTile = game.discardTile(this.playerIndex, tileToDiscard.suit, tileToDiscard.value);
            if (discardedTile) {
                console.log(`AI ${this.playerIndex} 出牌: ${discardedTile.getName()}`);
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
            // 简单策略：选择第一个可用的操作
            const action = aiActions[0];

            // 根据操作类型做决策
            let shouldPerform = false;
            const hand = game.players[this.playerIndex];

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
                default:
                    shouldPerform = false;
            }

            if (shouldPerform) {
                const result = game.handlePendingAction(action.action, this.playerIndex, action.tile);
                if (result) {
                    console.log(`AI ${this.playerIndex} 执行操作 ${action.action} 成功`);
                    return action.action;
                }
            }
        }

        return null;
    }

    // AI决策是否跳过操作
    decidePass(game) {
        // 简单策略：总是有机会就操作，不跳过
        return false;
    }
}

// 导出AI类
window.MahjongAI = MahjongAI;