/**
 * 麻将游戏静态验证脚本
 * 不需要浏览器，直接验证 HTML 结构和 JS 文件
 *
 * 运行: node test/static-test.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function checkFile(filePath, description) {
    const fullPath = path.join(ROOT, filePath);
    if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        console.log(`   ✅ ${description}: ${filePath} (${stats.size} bytes)`);
        return true;
    } else {
        console.log(`   ❌ ${description}: ${filePath} NOT FOUND`);
        return false;
    }
}

function checkHtmlElement(html, selector) {
    // Simple regex-based check for element existence
    const idMatch = selector.match(/^#([\w-]+)$/);
    if (idMatch) {
        const pattern = new RegExp(`id=["']${idMatch[1]}["']`, 'i');
        return pattern.test(html);
    }
    return false;
}

function runTests() {
    console.log('🎮 麻将游戏静态验证测试\n');
    console.log('========================================\n');

    let passed = 0;
    let failed = 0;

    // 1. 检查文件结构
    console.log('📁 步骤 1: 检查文件结构');
    const files = [
        ['index.html', '游戏主页面'],
        ['css/style.css', '样式文件'],
        ['js/mahjong.js', '核心数据模块'],
        ['js/game.js', '游戏逻辑模块'],
        ['js/ai.js', 'AI模块'],
        ['js/ui.js', 'UI模块'],
    ];

    for (const [file, desc] of files) {
        if (checkFile(file, desc)) {
            passed++;
        } else {
            failed++;
        }
    }

    // 2. 检查 HTML 元素
    console.log('\n📄 步骤 2: 检查 HTML 元素');
    const htmlPath = path.join(ROOT, 'index.html');
    const html = fs.readFileSync(htmlPath, 'utf-8');

    const elements = [
        ['#player-hand', '玩家手牌区'],
        ['#remaining-tiles', '剩余牌数显示'],
        ['#difficulty-select', '难度选择'],
        ['#debug-toggle-btn', '调试按钮'],
        ['#debug-panel', '调试面板'],
        ['#show-ai-hands', '显示AI手牌开关'],
        ['#debug-auto-play', '自动出牌按钮'],
    ];

    for (const [selector, desc] of elements) {
        if (checkHtmlElement(html, selector)) {
            console.log(`   ✅ ${desc}: ${selector}`);
            passed++;
        } else {
            console.log(`   ❌ ${desc}: ${selector} NOT FOUND`);
            failed++;
        }
    }

    // 3. 检查 JS 模块导出
    console.log('\n📦 步骤 3: 检查 JS 模块导出');
    const jsFiles = {
        'js/mahjong.js': ['Tile', 'TileSet', 'Hand', 'checkWinSimple'],
        'js/game.js': ['MahjongGame'],
        'js/ai.js': ['MahjongAI'],
        'js/ui.js': ['MahjongUI'],
    };

    for (const [file, exports] of Object.entries(jsFiles)) {
        const content = fs.readFileSync(path.join(ROOT, file), 'utf-8');
        for (const exportName of exports) {
            const pattern = new RegExp(`window\\.${exportName}\\s*=`, 'g');
            if (pattern.test(content)) {
                console.log(`   ✅ ${file}: ${exportName} 导出正确`);
                passed++;
            } else {
                console.log(`   ❌ ${file}: ${exportName} 导出缺失`);
                failed++;
            }
        }
    }

    // 4. 检查游戏初始化
    console.log('\n🎮 步骤 4: 检查游戏初始化代码');
    const gameContent = fs.readFileSync(path.join(ROOT, 'js/game.js'), 'utf-8');
    const uiContent = fs.readFileSync(path.join(ROOT, 'js/ui.js'), 'utf-8');

    const checks = [
        [gameContent, 'dealTiles\\(', '发牌方法'],
        [gameContent, 'drawTile\\(', '摸牌方法'],
        [gameContent, 'discardTile\\(', '出牌方法'],
        [gameContent, 'pengTile\\(', '碰牌方法'],
        [gameContent, 'kongTile|gangTile\\(', '杠牌方法'],
        [gameContent, 'checkWin\\(', '胡牌检测'],
        [uiContent, 'renderPlayerHand\\(', '手牌渲染'],
        [uiContent, 'renderDiscardedTiles\\(', '弃牌区渲染'],
    ];

    for (const [content, pattern, desc] of checks) {
        const regex = new RegExp(pattern, 'g');
        if (regex.test(content)) {
            console.log(`   ✅ ${desc}存在`);
            passed++;
        } else {
            console.log(`   ❌ ${desc}缺失`);
            failed++;
        }
    }

    // 测试结果
    console.log('\n========================================');
    console.log(`📊 测试结果: ${passed} 通过, ${failed} 失败`);
    console.log('========================================\n');

    if (failed > 0) {
        console.log('❌ 静态验证失败\n');
        process.exit(1);
    } else {
        console.log('✅ 静态验证通过\n');
        console.log('💡 提示: 要运行完整的浏览器测试，请确保使用 arm64 Node.js:');
        console.log('   brew install node  # 安装 arm64 Node');
        console.log('   nvm install node   # 或使用 nvm\n');
    }
}

// 运行测试
runTests();