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

    // 检查是否可以补杠（已有碰，摸到第4张）
    canBuGang(suit, value) {
        const pengIndex = this.exposed.findIndex(group =>
            group.type === 'peng' &&
            group.tiles[0].suit === suit &&
            group.tiles[0].value === value
        );
        return pengIndex !== -1 && this.tiles.countTile(suit, value) >= 1;
    }

    // 获取所有可以暗杠的牌
    getAnGangTiles() {
        const results = [];
        const checked = new Set();

        this.tiles.getAllTiles().forEach(tile => {
            const key = tile.getId();
            if (!checked.has(key) && this.tiles.countTile(tile.suit, tile.value) >= 4) {
                results.push(new Tile(tile.suit, tile.value));
                checked.add(key);
            }
        });

        return results;
    }

    // 获取所有可以补杠的牌
    getBuGangTiles() {
        const results = [];

        this.exposed.forEach(group => {
            if (group.type === 'peng') {
                const suit = group.tiles[0].suit;
                const value = group.tiles[0].value;
                if (this.tiles.countTile(suit, value) >= 1) {
                    results.push(new Tile(suit, value));
                }
            }
        });

        return results;
    }

    // 执行暗杠
    doAnGang(suit, value) {
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
        return false;
    }

    // 执行补杠
    doBuGang(suit, value) {
        const pengIndex = this.exposed.findIndex(group =>
            group.type === 'peng' &&
            group.tiles[0].suit === suit &&
            group.tiles[0].value === value
        );

        if (pengIndex !== -1 && this.tiles.countTile(suit, value) >= 1) {
            this.exposed[pengIndex].type = 'bugang';
            this.exposed[pengIndex].tiles.push(new Tile(suit, value));
            this.tiles.removeTile(suit, value);
            return true;
        }
        return false;
    }

    // 执行明杠（别人打出的牌）
    doMingGang(suit, value) {
        if (this.tiles.countTile(suit, value) >= 3) {
            const gangSet = new TileSet();
            for (let i = 0; i < 3; i++) {
                gangSet.addTile(new Tile(suit, value));
                this.tiles.removeTile(suit, value);
            }
            gangSet.addTile(new Tile(suit, value)); // 打出的牌
            this.exposed.push({
                type: 'minggang',
                tiles: gangSet.getAllTiles()
            });
            return true;
        }
        return false;
    }

    // 检查是否可以吃牌（只有数字牌可以吃）
    canChi(suit, value) {
        if (!['万', '条', '筒'].includes(suit)) return false;

        // 检查是否能与手牌组成顺子
        const combinations = this.getChiCombinations(suit, value);
        return combinations.length > 0;
    }

    // 获取所有可能的吃牌组合
    // 返回数组，每个元素是需要的手牌组合
    getChiCombinations(suit, value) {
        if (!['万', '条', '筒'].includes(suit)) return [];

        const combinations = [];

        // 模式 1-2-3: 需要 [v-2, v-1]
        if (value >= 3 &&
            this.tiles.hasTile(suit, value - 2) &&
            this.tiles.hasTile(suit, value - 1)) {
            combinations.push({
                type: 'lower',
                tiles: [
                    new Tile(suit, value - 2),
                    new Tile(suit, value - 1)
                ],
                discardedTile: new Tile(suit, value)
            });
        }

        // 模式 2-3-4: 需要 [v-1, v+1]
        if (value >= 2 && value <= 8 &&
            this.tiles.hasTile(suit, value - 1) &&
            this.tiles.hasTile(suit, value + 1)) {
            combinations.push({
                type: 'middle',
                tiles: [
                    new Tile(suit, value - 1),
                    new Tile(suit, value + 1)
                ],
                discardedTile: new Tile(suit, value)
            });
        }

        // 模式 3-4-5: 需要 [v+1, v+2]
        if (value <= 7 &&
            this.tiles.hasTile(suit, value + 1) &&
            this.tiles.hasTile(suit, value + 2)) {
            combinations.push({
                type: 'upper',
                tiles: [
                    new Tile(suit, value + 1),
                    new Tile(suit, value + 2)
                ],
                discardedTile: new Tile(suit, value)
            });
        }

        return combinations;
    }

    // 吃牌
    chiTile(suit, value, combination) {
        // combination 是 getChiCombinations 返回的组合之一
        const chiSet = new TileSet();

        // 添加吃牌组合中的所有牌
        chiSet.addTile(combination.tiles[0]);
        chiSet.addTile(combination.tiles[1]);
        chiSet.addTile(new Tile(suit, value)); // 打出的牌

        this.exposed.push({
            type: 'chi',
            tiles: chiSet.getAllTiles()
        });

        // 从手牌中移除两张牌
        this.tiles.removeTile(combination.tiles[0].suit, combination.tiles[0].value);
        this.tiles.removeTile(combination.tiles[1].suit, combination.tiles[1].value);

        return true;
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

    // 检查是否胡牌（简化版：平胡 + 七对）
    canWin() {
        const tiles = this.tiles.getAllTiles();
        if (tiles.length !== 14 && tiles.length !== 13) {
            return false;
        }

        // 检查七对
        if (tiles.length === 14) {
            const tileCounts = {};
            tiles.forEach(tile => {
                const id = tile.getId();
                tileCounts[id] = (tileCounts[id] || 0) + 1;
            });

            if (isQiDui(tileCounts) || isLongQiDui(tileCounts)) {
                return true;
            }
        }

        // 简化版胡牌检查：4个面子 + 1个对子
        return checkWinSimple(tiles);
    }

    // 计算胡牌番型
    calculateWinFan(winType = 'normal') {
        const tiles = this.tiles.getAllTiles();
        return calculateFan(tiles, this.exposed, winType);
    }

    // 检查是否是七对
    checkQiDui() {
        const tiles = this.tiles.getAllTiles();
        if (tiles.length !== 14) return false;

        const tileCounts = {};
        tiles.forEach(tile => {
            const id = tile.getId();
            tileCounts[id] = (tileCounts[id] || 0) + 1;
        });

        return isQiDui(tileCounts);
    }

    // 检查是否是龙七对
    checkLongQiDui() {
        const tiles = this.tiles.getAllTiles();
        if (tiles.length !== 14) return false;

        const tileCounts = {};
        tiles.forEach(tile => {
            const id = tile.getId();
            tileCounts[id] = (tileCounts[id] || 0) + 1;
        });

        return isLongQiDui(tileCounts);
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

// ==================== 番型计分系统 ====================

// 番型定义
const FAN_TYPES = {
    PING_HU: { name: '平胡', fan: 1 },           // 基本胡
    DUI_DUI_HU: { name: '对对胡', fan: 2 },      // 四刻（杠）+ 一对
    QING_YI_SE: { name: '清一色', fan: 4 },      // 只有一种花色
    QI_DUI: { name: '七对', fan: 2 },            // 七个对子
    QING_QI_DUI: { name: '清七对', fan: 8 },     // 清一色 + 七对
    LONG_QI_DUI: { name: '龙七对', fan: 4 },     // 七对中有一个杠
    QING_LONG_QI_DUI: { name: '清龙七对', fan: 16 }, // 清一色 + 龙七对
    SHI_BA_XUE_SHI: { name: '十八学士', fan: 16 }, // 清一色 + 对对胡
    TIAN_HU: { name: '天胡', fan: 32 },          // 庄家起手胡
    DI_HU: { name: '地胡', fan: 32 },            // 闲家第一轮胡
    GANG_SHANG_KAI_HUA: { name: '杠上开花', fan: 2 }, // 杠后摸牌胡
    QIANG_GANG_HU: { name: '抢杠胡', fan: 2 },   // 抢别人的补杠
    // 四川麻将特殊番型
    JIN_GOU_DIAO: { name: '金钩钓', fan: 4 },    // 单钓将
    GEN: { name: '根', fan: 1 }                  // 每一个杠算一根
};

// 检查是否是清一色
function isQingYiSe(tiles, exposed = []) {
    const allTiles = [...tiles];
    exposed.forEach(group => {
        group.tiles.forEach(tile => allTiles.push(tile));
    });

    if (allTiles.length === 0) return false;

    const suit = allTiles[0].suit;
    return allTiles.every(tile => tile.suit === suit);
}

// 检查是否是对对胡（全部是刻子/杠子，没有顺子）
function isDuiDuiHu(tileCounts) {
    // 如果能组成面子且全部是刻子（没有顺子）
    return checkMeldsAllPung(tileCounts);
}

// 检查是否能全部组成刻子
function checkMeldsAllPung(counts) {
    const nonZeroCounts = {};
    Object.entries(counts).forEach(([id, count]) => {
        if (count > 0) {
            nonZeroCounts[id] = count;
        }
    });

    if (Object.keys(nonZeroCounts).length === 0) {
        return true;
    }

    const [firstId, firstCount] = Object.entries(nonZeroCounts)[0];

    // 只尝试刻子，不尝试顺子
    if (firstCount >= 3) {
        const testCounts = {...nonZeroCounts};
        testCounts[firstId] -= 3;
        if (testCounts[firstId] === 0) {
            delete testCounts[firstId];
        }
        if (checkMeldsAllPung(testCounts)) {
            return true;
        }
    }

    return false;
}

// 检查是否是七对
function isQiDui(tileCounts) {
    const counts = Object.values(tileCounts);
    // 七对：7个对子（2张相同）
    if (counts.length !== 7) return false;
    return counts.every(count => count === 2);
}

// 检查是否是龙七对（七对中有一个杠）
function isLongQiDui(tileCounts) {
    const counts = Object.values(tileCounts);
    if (counts.length !== 6) return false;
    // 5个对子 + 1个杠
    const hasGang = counts.some(count => count === 4);
    const pairs = counts.filter(count => count === 2);
    return hasGang && pairs.length === 5;
}

// 计算番型
function calculateFan(tiles, exposed = [], winType = 'normal') {
    const fanResults = [];
    let totalFan = 0;

    // 统计手牌
    const tileCounts = {};
    tiles.forEach(tile => {
        const id = tile.getId();
        tileCounts[id] = (tileCounts[id] || 0) + 1;
    });

    const isQing = isQingYiSe(tiles, exposed);
    const isQiDuiResult = isQiDui(tileCounts);
    const isLongQiDuiResult = isLongQiDui(tileCounts);
    const isDuiDuiResult = isDuiDuiHu(tileCounts);

    // 检查清一色
    if (isQing) {
        fanResults.push(FAN_TYPES.QING_YI_SE);
        totalFan += FAN_TYPES.QING_YI_SE.fan;
    }

    // 检查七对/龙七对
    if (isLongQiDuiResult) {
        if (isQing) {
            fanResults.push(FAN_TYPES.QING_LONG_QI_DUI);
            totalFan += FAN_TYPES.QING_LONG_QI_DUI.fan;
        } else {
            fanResults.push(FAN_TYPES.LONG_QI_DUI);
            totalFan += FAN_TYPES.LONG_QI_DUI.fan;
        }
    } else if (isQiDuiResult) {
        if (isQing) {
            fanResults.push(FAN_TYPES.QING_QI_DUI);
            totalFan += FAN_TYPES.QING_QI_DUI.fan;
        } else {
            fanResults.push(FAN_TYPES.QI_DUI);
            totalFan += FAN_TYPES.QI_DUI.fan;
        }
    } else if (isDuiDuiResult) {
        if (isQing) {
            fanResults.push(FAN_TYPES.SHI_BA_XUE_SHI);
            totalFan += FAN_TYPES.SHI_BA_XUE_SHI.fan;
        } else {
            fanResults.push(FAN_TYPES.DUI_DUI_HU);
            totalFan += FAN_TYPES.DUI_DUI_HU.fan;
        }
    } else {
        // 平胡
        fanResults.push(FAN_TYPES.PING_HU);
        totalFan += FAN_TYPES.PING_HU.fan;
    }

    // 检查杠（根）
    let gangCount = 0;
    exposed.forEach(group => {
        if (['minggang', 'angang', 'bugang'].includes(group.type)) {
            gangCount++;
        }
    });
    if (gangCount > 0) {
        for (let i = 0; i < gangCount; i++) {
            fanResults.push(FAN_TYPES.GEN);
            totalFan += FAN_TYPES.GEN.fan;
        }
    }

    // 检查特殊胡法
    if (winType === 'gangshangkaihua') {
        fanResults.push(FAN_TYPES.GANG_SHANG_KAI_HUA);
        totalFan += FAN_TYPES.GANG_SHANG_KAI_HUA.fan;
    } else if (winType === 'qiangganghu') {
        fanResults.push(FAN_TYPES.QIANG_GANG_HU);
        totalFan += FAN_TYPES.QIANG_GANG_HU.fan;
    } else if (winType === 'tianhu') {
        fanResults.push(FAN_TYPES.TIAN_HU);
        totalFan += FAN_TYPES.TIAN_HU.fan;
    } else if (winType === 'dihu') {
        fanResults.push(FAN_TYPES.DI_HU);
        totalFan += FAN_TYPES.DI_HU.fan;
    }

    return {
        fanTypes: fanResults,
        totalFan: totalFan,
        score: Math.pow(2, totalFan) // 分数 = 2^n
    };
}

// 计算最终得分（四川麻将血战到底规则）
function calculateFinalScore(fanResult, isZimo = false, isDealer = false) {
    let baseScore = fanResult.score;

    // 自摸翻倍
    if (isZimo) {
        baseScore *= 2;
    }

    // 庄家翻倍
    if (isDealer) {
        baseScore *= 2;
    }

    return {
        ...fanResult,
        isZimo,
        isDealer,
        finalScore: baseScore
    };
}

// 导出类和函数
window.Tile = Tile;
window.TileSet = TileSet;
window.Hand = Hand;
window.createCompleteTileSet = createCompleteTileSet;
window.checkWinSimple = checkWinSimple;
window.FAN_TYPES = FAN_TYPES;
window.calculateFan = calculateFan;
window.calculateFinalScore = calculateFinalScore;
window.isQingYiSe = isQingYiSe;
window.isDuiDuiHu = isDuiDuiHu;
window.isQiDui = isQiDui;
window.isLongQiDui = isLongQiDui;