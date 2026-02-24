/**
 * 麻将核心数据结构和规则引擎
 */

// 麻将牌类
class Tile {
    constructor(suit, value) {
        this.suit = suit; // 花色: '万', '条', '筒'
        this.value = value; // 数值: 1-9
    }

    // 获取牌的唯一标识
    getId() {
        return `${this.suit}${this.value}`;
    }

    // 获取牌的显示名称
    getName() {
        const suitNames = { '万': '万', '条': '条', '筒': '筒' };
        return `${this.value}${suitNames[this.suit]}`;
    }

    // 获取牌的图片文件名
    getImageName() {
        const suitMap = { '万': 'Man', '条': 'Sou', '筒': 'Pin' };
        return `${suitMap[this.suit]}${this.value}.png`;
    }

    // 复制牌
    clone() {
        return new Tile(this.suit, this.value);
    }
}

// 牌组类
class TileSet {
    constructor() {
        this.tiles = [];
    }

    // 添加牌
    addTile(tile) {
        this.tiles.push(tile.clone());
    }

    // 批量添加牌
    addTiles(tiles) {
        tiles.forEach(tile => this.addTile(tile));
    }

    // 移除指定牌
    removeTile(suit, value) {
        const index = this.tiles.findIndex(tile => tile.suit === suit && tile.value === value);
        if (index !== -1) {
            return this.tiles.splice(index, 1)[0];
        }
        return null;
    }

    // 检查是否有指定牌
    hasTile(suit, value) {
        return this.tiles.some(tile => tile.suit === suit && tile.value === value);
    }

    // 获取指定牌的数量
    countTile(suit, value) {
        return this.tiles.filter(tile => tile.suit === suit && tile.value === value).length;
    }

    // 获取所有牌
    getAllTiles() {
        return [...this.tiles];
    }

    // 获取牌的数量
    getCount() {
        return this.tiles.length;
    }

    // 洗牌
    shuffle() {
        for (let i = this.tiles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.tiles[i], this.tiles[j]] = [this.tiles[j], this.tiles[i]];
        }
    }

    // 排序
    sort() {
        this.tiles.sort((a, b) => {
            if (a.suit !== b.suit) {
                return a.suit.localeCompare(b.suit);
            }
            return a.value - b.value;
        });
    }

    // 清空
    clear() {
        this.tiles = [];
    }

    // 复制
    clone() {
        const newSet = new TileSet();
        this.tiles.forEach(tile => newSet.addTile(tile));
        return newSet;
    }
}

// 创建完整牌组（简化版：只有万条筒，无风牌箭牌）
function createCompleteTileSet() {
    const tileSet = new TileSet();

    // 万、条、筒各1-9，每张4个
    ['万', '条', '筒'].forEach(suit => {
        for (let value = 1; value <= 9; value++) {
            for (let i = 0; i < 4; i++) {
                tileSet.addTile(new Tile(suit, value));
            }
        }
    });

    return tileSet;
}

// 手牌管理类
class Hand {
    constructor() {
        this.tiles = new TileSet();
        this.exposed = []; // 已碰/杠的牌组
    }

    // 摸牌
    drawTile(tile) {
        this.tiles.addTile(tile);
    }

    // 打牌
    discardTile(suit, value) {
        return this.tiles.removeTile(suit, value);
    }

    // 碰牌
    pengTile(suit, value) {
        // 需要有两张相同的牌才能碰
        if (this.tiles.countTile(suit, value) >= 2) {
            const pengSet = new TileSet();
            pengSet.addTile(new Tile(suit, value));
            pengSet.addTile(new Tile(suit, value));
            pengSet.addTile(new Tile(suit, value));
            this.exposed.push({
                type: 'peng',
                tiles: pengSet.getAllTiles()
            });

            // 移除两张牌
            this.tiles.removeTile(suit, value);
            this.tiles.removeTile(suit, value);

            return true;
        }
        return false;
    }

    // 杠牌
    gangTile(suit, value) {
        // 暗杠：手中有四张相同的牌
        if (this.tiles.countTile(suit, value) >= 4) {
            const gangSet = new TileSet();
            for (let i = 0; i < 4; i++) {
                gangSet.addTile(new Tile(suit, value));
                this.tiles.removeTile(suit, value);
            }
            this.exposed.push({
                type: 'angang',
                tiles: gangSet.getAllTiles()
            });
            return true;
        }

        // 明杠：已碰过再摸到一张
        const pengIndex = this.exposed.findIndex(group =>
            group.type === 'peng' &&
            group.tiles[0].suit === suit &&
            group.tiles[0].value === value
        );

        if (pengIndex !== -1) {
            // 将碰转为明杠
            this.exposed[pengIndex].type = 'minggang';
            this.exposed[pengIndex].tiles.push(new Tile(suit, value));
            this.tiles.removeTile(suit, value);
            return true;
        }

        return false;
    }

    // 检查是否可以碰
    canPeng(suit, value) {
        return this.tiles.countTile(suit, value) >= 2;
    }

    // 检查是否可以明杠
    canMingGang(suit, value) {
        return this.tiles.countTile(suit, value) >= 3;
    }

    // 检查是否可以暗杠
    canAnGang(suit, value) {
        return this.tiles.countTile(suit, value) >= 4;
    }

    // 获取手牌
    getTiles() {
        return this.tiles.getAllTiles();
    }

    // 获取已暴露的牌组
    getExposed() {
        return [...this.exposed];
    }

    // 获取手牌数量
    getCount() {
        return this.tiles.getCount();
    }

    // 排序手牌
    sortTiles() {
        this.tiles.sort();
    }

    // 检查是否胡牌（简化版：平胡）
    canWin() {
        const tiles = this.tiles.getAllTiles();
        if (tiles.length !== 14 && tiles.length !== 13) {
            return false;
        }

        // 简化版胡牌检查：4个面子 + 1个对子
        return checkWinSimple(tiles);
    }
}

// 简化版胡牌检查
function checkWinSimple(tiles) {
    if (tiles.length !== 14 && tiles.length !== 13) {
        return false;
    }

    // 统计每张牌的数量
    const tileCounts = {};
    tiles.forEach(tile => {
        const id = tile.getId();
        tileCounts[id] = (tileCounts[id] || 0) + 1;
    });

    // 转换为数组格式便于处理
    const counts = Object.entries(tileCounts);

    // 寻找对子作为将牌
    for (let i = 0; i < counts.length; i++) {
        const [id, count] = counts[i];
        if (count >= 2) {
            // 尝试以这个对子为将牌
            const testCounts = {...tileCounts};
            testCounts[id] -= 2;

            if (checkMelds(testCounts)) {
                return true;
            }
        }
    }

    return false;
}

// 检查是否能组成面子
function checkMelds(counts) {
    // 移除数量为0的牌
    const nonZeroCounts = {};
    Object.entries(counts).forEach(([id, count]) => {
        if (count > 0) {
            nonZeroCounts[id] = count;
        }
    });

    // 如果没有牌了，说明匹配成功
    if (Object.keys(nonZeroCounts).length === 0) {
        return true;
    }

    // 取第一个牌型
    const [firstId, firstCount] = Object.entries(nonZeroCounts)[0];

    // 解析牌型
    const suit = firstId.charAt(0);
    const value = parseInt(firstId.slice(1));

    // 尝试组成刻子（三张相同的牌）
    if (firstCount >= 3) {
        const testCounts = {...nonZeroCounts};
        testCounts[firstId] -= 3;
        if (testCounts[firstId] === 0) {
            delete testCounts[firstId];
        }

        if (checkMelds(testCounts)) {
            return true;
        }
    }

    // 尝试组成顺子（连续三张牌，同一花色）
    if (['万', '条', '筒'].includes(suit) && value <= 7) {
        const next1Id = `${suit}${value + 1}`;
        const next2Id = `${suit}${value + 2}`;

        if (nonZeroCounts[next1Id] && nonZeroCounts[next2Id]) {
            const testCounts = {...nonZeroCounts};
            testCounts[firstId] -= 1;
            testCounts[next1Id] -= 1;
            testCounts[next2Id] -= 1;

            // 清除数量为0的项
            if (testCounts[firstId] === 0) delete testCounts[firstId];
            if (testCounts[next1Id] === 0) delete testCounts[next1Id];
            if (testCounts[next2Id] === 0) delete testCounts[next2Id];

            if (checkMelds(testCounts)) {
                return true;
            }
        }
    }

    return false;
}

// 导出类和函数
window.Tile = Tile;
window.TileSet = TileSet;
window.Hand = Hand;
window.createCompleteTileSet = createCompleteTileSet;
window.checkWinSimple = checkWinSimple;