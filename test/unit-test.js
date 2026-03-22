/**
 * 麻将游戏单元测试
 * 测试新增的功能：136张牌、海底捞月、听牌检测、字牌番型等
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// 创建模拟的 window 对象
const window = {};

// 加载 JS 文件到上下文
function loadScript(filePath) {
    const code = fs.readFileSync(path.join(__dirname, '..', filePath), 'utf-8');
    vm.runInNewContext(code, { window, console, Math, Object, Array, Set, Map });
}

// 加载所有依赖
loadScript('js/mahjong.js');

console.log('🎮 麻将游戏单元测试\n');
console.log('========================================\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`   ✅ ${name}`);
        passed++;
    } catch (error) {
        console.log(`   ❌ ${name}`);
        console.log(`      错误: ${error.message}`);
        failed++;
    }
}

function assertEqual(actual, expected, message = '') {
    if (actual !== expected) {
        throw new Error(`${message} 期望: ${expected}, 实际: ${actual}`);
    }
}

function assertTrue(condition, message = '') {
    if (!condition) {
        throw new Error(message || '断言失败');
    }
}

// ==================== 测试136张牌 ====================
console.log('🧪 测试136张牌组');

test('createCompleteTileSet 创建136张牌', () => {
    const tileSet = window.createCompleteTileSet();
    assertEqual(tileSet.getCount(), 136, '牌组应有136张牌');
});

test('包含风牌（东南西北）', () => {
    const tileSet = window.createCompleteTileSet();
    for (let i = 1; i <= 4; i++) {
        const count = tileSet.countTile('风', i);
        assertEqual(count, 4, `风牌${i}应有4张`);
    }
});

test('包含箭牌（中发白）', () => {
    const tileSet = window.createCompleteTileSet();
    for (let i = 1; i <= 3; i++) {
        const count = tileSet.countTile('箭', i);
        assertEqual(count, 4, `箭牌${i}应有4张`);
    }
});

test('Tile.isZiPai 方法', () => {
    const wanTile = new window.Tile('万', 1);
    const fengTile = new window.Tile('风', 1);
    const jianTile = new window.Tile('箭', 1);

    assertTrue(!wanTile.isZiPai(), '万牌不是字牌');
    assertTrue(fengTile.isZiPai(), '风牌是字牌');
    assertTrue(jianTile.isZiPai(), '箭牌是字牌');
});

test('Tile.getName 字牌名称', () => {
    const dong = new window.Tile('风', 1);
    const nan = new window.Tile('风', 2);
    const zhong = new window.Tile('箭', 1);
    const fa = new window.Tile('箭', 2);

    assertEqual(dong.getName(), '东', '风1应为东');
    assertEqual(nan.getName(), '南', '风2应为南');
    assertEqual(zhong.getName(), '中', '箭1应为中');
    assertEqual(fa.getName(), '发', '箭2应为发');
});

test('Tile.getImageName 字牌图片名', () => {
    const dong = new window.Tile('风', 1);
    const xi = new window.Tile('风', 3);
    const zhong = new window.Tile('箭', 1);
    const bai = new window.Tile('箭', 3);

    assertEqual(dong.getImageName(), 'Ton.png', '风1图片应为Ton.png');
    assertEqual(xi.getImageName(), 'Shaa.png', '风3图片应为Shaa.png');
    assertEqual(zhong.getImageName(), 'Chun.png', '箭1图片应为Chun.png');
    assertEqual(bai.getImageName(), 'Haku.png', '箭3图片应为Haku.png');
});

// ==================== 测试海底捞月番型 ====================
console.log('\n🧪 测试海底捞月番型');

test('FAN_TYPES 包含 HAI_DI_LAO_YUE', () => {
    assertTrue(window.FAN_TYPES.HAI_DI_LAO_YUE, 'FAN_TYPES 应包含 HAI_DI_LAO_YUE');
    assertEqual(window.FAN_TYPES.HAI_DI_LAO_YUE.name, '海底捞月', '番型名称应为海底捞月');
    assertEqual(window.FAN_TYPES.HAI_DI_LAO_YUE.fan, 1, '海底捞月应为1番');
});

test('calculateFan 支持 haidilaoyue 类型', () => {
    // 创建一副可以胡的牌（七对）
    const tiles = [];
    for (let i = 1; i <= 7; i++) {
        tiles.push(new window.Tile('万', i));
        tiles.push(new window.Tile('万', i));
    }
    tiles.push(new window.Tile('万', 1));

    const result = window.calculateFan(tiles, [], 'haidilaoyue');
    assertTrue(result.fanTypes.some(f => f.name === '海底捞月'), '应包含海底捞月番型');
    assertTrue(result.totalFan >= 1, '总番数应至少为1');
});

// ==================== 测试字牌番型 ====================
console.log('\n🧪 测试字牌番型');

test('FAN_TYPES 包含字牌番型', () => {
    assertTrue(window.FAN_TYPES.ZI_YI_SE, '应有字一色');
    assertTrue(window.FAN_TYPES.DA_SI_XI, '应有大四喜');
    assertTrue(window.FAN_TYPES.DA_SAN_YUAN, '应有大三元');
});

test('isZiYiSe 字一色检测', () => {
    // 全部是字牌
    const ziTiles = [];
    for (let i = 1; i <= 4; i++) {
        for (let j = 0; j < 3; j++) {
            ziTiles.push(new window.Tile('风', i));
        }
    }
    ziTiles.push(new window.Tile('箭', 1));
    ziTiles.push(new window.Tile('箭', 1));

    assertTrue(window.isZiYiSe(ziTiles, []), '应识别为字一色');

    // 混合序数牌
    const mixedTiles = [...ziTiles, new window.Tile('万', 1)];
    assertTrue(!window.isZiYiSe(mixedTiles, []), '混合牌不是字一色');
});

test('isDaSanYuan 大三元检测', () => {
    // 中发白三刻
    const tileCounts = {
        '箭1': 3, '箭2': 3, '箭3': 3,
        '万1': 2
    };

    assertTrue(window.isDaSanYuan(tileCounts, []), '应识别为大三元');
});

test('isXiaoSanYuan 小三元检测', () => {
    // 中发白两刻一对
    const tileCounts = {
        '箭1': 3, '箭2': 3, '箭3': 2,
        '万1': 3, '万2': 2
    };

    assertTrue(window.isXiaoSanYuan(tileCounts, []), '应识别为小三元');
});

// ==================== 测试听牌检测 ====================
console.log('\n🧪 测试听牌检测功能');

test('Hand.getTingTiles 方法存在', () => {
    const hand = new window.Hand();
    assertTrue(typeof hand.getTingTiles === 'function', 'Hand 应有 getTingTiles 方法');
});

test('Hand.isTing 方法存在', () => {
    const hand = new window.Hand();
    assertTrue(typeof hand.isTing === 'function', 'Hand 应有 isTing 方法');
});

test('听牌检测 - 单吊将', () => {
    const hand = new window.Hand();

    // 添加4个刻子（12张）
    for (let i = 0; i < 3; i++) {
        hand.tiles.addTile(new window.Tile('万', 1));
        hand.tiles.addTile(new window.Tile('万', 2));
        hand.tiles.addTile(new window.Tile('条', 3));
        hand.tiles.addTile(new window.Tile('筒', 4));
    }
    // 添加一个对子（2张），然后移除一张
    hand.tiles.addTile(new window.Tile('筒', 5));
    hand.tiles.addTile(new window.Tile('筒', 5));
    hand.tiles.removeTile('筒', 5);

    const tingTiles = hand.getTingTiles();
    assertTrue(tingTiles.length > 0, '应该听牌');
    assertTrue(tingTiles.some(t => t.id === '筒5'), '应该听5筒');
});

// ==================== 测试胡牌检测 ====================
console.log('\n🧪 测试胡牌检测');

test('Hand.canWin 方法存在', () => {
    const hand = new window.Hand();
    assertTrue(typeof hand.canWin === 'function', 'Hand 应有 canWin 方法');
});

test('七对胡牌检测', () => {
    const hand = new window.Hand();
    for (let i = 1; i <= 7; i++) {
        hand.tiles.addTile(new window.Tile('万', i));
        hand.tiles.addTile(new window.Tile('万', i));
    }

    assertTrue(hand.canWin(), '七对应该可以胡牌');
});

test('平胡胡牌检测', () => {
    const hand = new window.Hand();
    for (let i = 1; i <= 9; i++) {
        hand.tiles.addTile(new window.Tile('万', i));
    }
    for (let i = 1; i <= 3; i++) {
        hand.tiles.addTile(new window.Tile('条', i));
    }
    hand.tiles.addTile(new window.Tile('筒', 1));
    hand.tiles.addTile(new window.Tile('筒', 1));

    assertTrue(hand.canWin(), '平胡应该可以胡牌');
});

test('字牌刻子胡牌检测', () => {
    const hand = new window.Hand();
    // 东南西北四刻 + 一对中
    for (let i = 1; i <= 4; i++) {
        for (let j = 0; j < 3; j++) {
            hand.tiles.addTile(new window.Tile('风', i));
        }
    }
    hand.tiles.addTile(new window.Tile('箭', 1));
    hand.tiles.addTile(new window.Tile('箭', 1));

    assertTrue(hand.canWin(), '字牌刻子应该可以胡牌');
});

test('带明牌的胡牌检测', () => {
    const hand = new window.Hand();

    // 添加一个明牌组（吃牌组合：123万）
    hand.exposed.push({
        type: 'chi',
        tiles: [
            new window.Tile('万', 1),
            new window.Tile('万', 2),
            new window.Tile('万', 3)
        ]
    });

    // 手牌：11张，需要组成 3 个面子 + 1 个对子
    // 刻子：444万, 777条, 888筒
    // 对子：99万
    for (let i = 0; i < 3; i++) {
        hand.tiles.addTile(new window.Tile('万', 4));
        hand.tiles.addTile(new window.Tile('条', 7));
        hand.tiles.addTile(new window.Tile('筒', 8));
    }
    hand.tiles.addTile(new window.Tile('万', 9));
    hand.tiles.addTile(new window.Tile('万', 9));

    // 手牌11张 + 明牌3张 = 14张
    assertTrue(hand.canWin(), '带明牌应该可以胡牌');
});

test('带明牌的点炮胡牌检测', () => {
    const hand = new window.Hand();

    // 添加一个明牌组（碰牌：333万）
    hand.exposed.push({
        type: 'peng',
        tiles: [
            new window.Tile('万', 3),
            new window.Tile('万', 3),
            new window.Tile('万', 3)
        ]
    });

    // 手牌：11张，听牌状态（需要组成 3 个面子 + 1 个对子）
    // 刻子：444万, 777条
    // 顺子：567筒
    // 对子：99万（单吊）
    for (let i = 0; i < 3; i++) {
        hand.tiles.addTile(new window.Tile('万', 4));
        hand.tiles.addTile(new window.Tile('条', 7));
    }
    hand.tiles.addTile(new window.Tile('筒', 5));
    hand.tiles.addTile(new window.Tile('筒', 6));
    hand.tiles.addTile(new window.Tile('筒', 7));
    hand.tiles.addTile(new window.Tile('万', 9));

    // 手牌11张 + 明牌3张 = 14张，已听牌
    // 再临时添加一张9万来模拟点炮检查
    hand.tiles.addTile(new window.Tile('万', 9));

    // 手牌12张 + 明牌3张 = 15张，点炮检查模式
    assertTrue(hand.canWin(true), '带明牌点炮检查应该可以胡牌');
});

test('多个明牌组的胡牌检测', () => {
    const hand = new window.Hand();

    // 添加两个明牌组
    hand.exposed.push({
        type: 'peng',
        tiles: [
            new window.Tile('万', 1),
            new window.Tile('万', 1),
            new window.Tile('万', 1)
        ]
    });
    hand.exposed.push({
        type: 'chi',
        tiles: [
            new window.Tile('条', 4),
            new window.Tile('条', 5),
            new window.Tile('条', 6)
        ]
    });

    // 手牌：8张，需要组成 2 个面子 + 1 个对子
    for (let i = 0; i < 3; i++) {
        hand.tiles.addTile(new window.Tile('筒', 7));
    }
    for (let i = 0; i < 3; i++) {
        hand.tiles.addTile(new window.Tile('万', 9));
    }
    hand.tiles.addTile(new window.Tile('条', 2));
    hand.tiles.addTile(new window.Tile('条', 2));

    // 手牌8张 + 明牌6张 = 14张
    assertTrue(hand.canWin(), '多个明牌组应该可以胡牌');
});

test('碰牌后的点炮胡牌检测', () => {
    const hand = new window.Hand();

    // 碰牌后：明牌3张
    hand.exposed.push({
        type: 'peng',
        tiles: [
            new window.Tile('万', 5),
            new window.Tile('万', 5),
            new window.Tile('万', 5)
        ]
    });

    // 手牌10张（碰后摸了一张），听牌
    // 三个顺子 + 一个单钓
    hand.tiles.addTile(new window.Tile('万', 1));
    hand.tiles.addTile(new window.Tile('万', 2));
    hand.tiles.addTile(new window.Tile('万', 3));
    hand.tiles.addTile(new window.Tile('条', 2));
    hand.tiles.addTile(new window.Tile('条', 3));
    hand.tiles.addTile(new window.Tile('条', 4));
    hand.tiles.addTile(new window.Tile('筒', 7));
    hand.tiles.addTile(new window.Tile('筒', 8));
    hand.tiles.addTile(new window.Tile('筒', 9));
    hand.tiles.addTile(new window.Tile('条', 9)); // 单钓

    // 手牌10张 + 明牌3张 = 13张，听牌
    // 别人打出9条，临时添加
    hand.tiles.addTile(new window.Tile('条', 9));

    // 手牌11张 + 明牌3张 = 14张，点炮检查
    assertTrue(hand.canWin(true), '碰牌后点炮应该可以胡牌');
});

// ==================== 测试番型计算 ====================
console.log('\n🧪 测试番型计算');

test('清一色检测', () => {
    const tiles = [];
    for (let i = 1; i <= 9; i++) {
        tiles.push(new window.Tile('万', i));
    }
    tiles.push(new window.Tile('万', 1));
    tiles.push(new window.Tile('万', 2));
    tiles.push(new window.Tile('万', 3));
    tiles.push(new window.Tile('万', 4));
    tiles.push(new window.Tile('万', 5));

    const isQing = window.isQingYiSe(tiles, []);
    assertTrue(isQing, '应该识别为清一色');
});

test('对对胡检测', () => {
    const tileCounts = {
        '万1': 3, '万2': 3, '万3': 3, '万4': 3
    };

    const isDuiDui = window.isDuiDuiHu(tileCounts);
    assertTrue(isDuiDui, '应该识别为对对胡');
});

test('七对检测', () => {
    const tileCounts = {
        '万1': 2, '万2': 2, '万3': 2, '万4': 2, '万5': 2, '万6': 2, '万7': 2
    };

    const isQiDui = window.isQiDui(tileCounts);
    assertTrue(isQiDui, '应该识别为七对');
});

test('龙七对检测', () => {
    const tileCounts = {
        '万1': 4, '万2': 2, '万3': 2, '万4': 2, '万5': 2, '万6': 2
    };

    const isLongQiDui = window.isLongQiDui(tileCounts);
    assertTrue(isLongQiDui, '应该识别为龙七对');
});

test('番型累加计算', () => {
    const tiles = [];
    for (let i = 1; i <= 7; i++) {
        tiles.push(new window.Tile('万', i));
        tiles.push(new window.Tile('万', i));
    }

    const result = window.calculateFan(tiles, [], 'normal');
    assertTrue(result.fanTypes.some(f => f.name === '清七对'), '应包含清七对番型');
    assertTrue(result.fanTypes.some(f => f.name === '清一色'), '应包含清一色番型');
    assertEqual(result.totalFan, 12, '清一色(4番) + 清七对(8番) = 12番');
});

// 测试结果
console.log('\n========================================');
console.log(`📊 测试结果: ${passed} 通过, ${failed} 失败`);
console.log('========================================\n');

if (failed > 0) {
    console.log('❌ 单元测试失败\n');
    process.exit(1);
} else {
    console.log('✅ 单元测试全部通过\n');
}
