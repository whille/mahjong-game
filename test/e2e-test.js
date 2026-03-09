/**
 * 麻将游戏自动化测试脚本
 * 使用 Playwright 模拟用户操作
 *
 * 安装: npm install
 * 运行: npm run test:e2e
 * 无头模式: npm run test:headless
 */

const { chromium } = require('playwright');
const path = require('path');

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
    console.log('🎮 启动麻将游戏自动化测试...\n');

    const headless = process.env.HEADLESS === 'true';
    const browser = await chromium.launch({
        headless: headless,
        slowMo: headless ? 0 : 50,
    });

    const context = await browser.newContext({
        viewport: { width: 1280, height: 800 }
    });

    const page = await context.newPage();

    // 监听控制台输出
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('   🖥️  浏览器错误:', msg.text());
        }
    });

    try {
        // 1. 打开游戏
        console.log('📍 步骤 1: 打开游戏页面');
        const htmlPath = path.resolve(__dirname, '../index.html');
        await page.goto('file://' + htmlPath, { waitUntil: 'networkidle' });
        await sleep(1000);

        // 2. 检查游戏元素
        console.log('📍 步骤 2: 检查游戏元素');
        const playerHand = await page.$('#player-hand');
        const remainingTiles = await page.$('#remaining-tiles');
        const difficultySelect = await page.$('#difficulty-select');
        const debugBtn = await page.$('#debug-toggle-btn');

        const missingElements = [];
        if (!playerHand) missingElements.push('player-hand');
        if (!remainingTiles) missingElements.push('remaining-tiles');
        if (!difficultySelect) missingElements.push('difficulty-select');
        if (!debugBtn) missingElements.push('debug-toggle-btn');

        if (missingElements.length > 0) {
            throw new Error(`游戏元素缺失: ${missingElements.join(', ')}`);
        }
        console.log('   ✅ 游戏元素正常');

        // 3. 检查初始手牌数量
        console.log('📍 步骤 3: 检查初始手牌');
        const initialTiles = await page.locator('#player-hand .tile').count();
        console.log(`   玩家手牌数: ${initialTiles}`);
        if (initialTiles < 13 || initialTiles > 14) {
            console.log('   ⚠️  手牌数量异常（应为13或14张）');
        } else {
            console.log('   ✅ 手牌数量正常');
        }

        // 4. 检查剩余牌数
        const remaining = await page.locator('#remaining-tiles').textContent();
        console.log(`   剩余牌数: ${remaining}`);

        // 5. 选择难度
        console.log('📍 步骤 4: 选择AI难度');
        await page.selectOption('#difficulty-select', 'easy');
        console.log('   ✅ 已选择简单难度');

        // 6. 测试调试面板
        console.log('📍 步骤 5: 测试调试面板');
        await page.click('#debug-toggle-btn');
        await sleep(300);

        const debugPanelVisible = await page.locator('#debug-panel').isVisible();
        console.log(`   调试面板可见: ${debugPanelVisible ? '是' : '否'}`);

        // 开启作弊模式
        await page.check('#show-ai-hands');
        await sleep(300);
        console.log('   ✅ 已开启显示AI手牌');

        // 7. 测试自动出牌
        console.log('📍 步骤 6: 测试自动出牌 (10回合)');
        for (let i = 0; i < 10; i++) {
            await page.click('#debug-auto-play');
            await sleep(1200);

            // 检查游戏是否结束
            const gameOver = await page.evaluate(() => {
                const controller = window.gameController;
                return controller && controller.game && controller.game.isGameOver();
            });

            if (gameOver) {
                console.log(`   🎉 游戏在第 ${i + 1} 回合结束！`);
                break;
            }
            console.log(`   自动出牌 ${i + 1}/10`);
        }

        // 8. 检查游戏状态
        console.log('📍 步骤 7: 检查游戏状态');
        const gameState = await page.evaluate(() => {
            const controller = window.gameController;
            if (!controller || !controller.game) return null;
            const game = controller.game;
            return {
                currentPlayer: game.getCurrentPlayer(),
                dealer: game.getDealer(),
                remainingTiles: game.getRemainingTiles(),
                isGameOver: game.isGameOver()
            };
        });
        console.log('   游戏状态:', JSON.stringify(gameState, null, 2));

        // 测试结果
        console.log('\n========================================');
        console.log('✅ 自动化测试完成！');
        console.log('========================================\n');

        // 截图
        await page.screenshot({ path: 'test/screenshot.png' });
        console.log('📸 截图已保存: test/screenshot.png');

    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        await page.screenshot({ path: 'test/error-screenshot.png' });
        console.log('📸 错误截图: test/error-screenshot.png');
    } finally {
        if (headless) {
            await browser.close();
        } else {
            console.log('\n浏览器保持打开，按 Ctrl+C 退出...');
        }
    }
}

// 运行测试
runTest().catch(console.error);