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

/**
 * 测试1: 快速点击锁机制
 * 确保快速连续点击不会导致打出多张牌
 */
async function testRapidClickLock(page) {
    console.log('\n🧪 测试: 快速点击锁机制');

    // 获取初始手牌数
    const initialCount = await page.locator('#player-hand .tile').count();
    console.log(`   初始手牌数: ${initialCount}`);

    // 检查是否是玩家回合
    const isPlayerTurn = await page.evaluate(() => {
        const controller = window.gameController;
        return controller && controller.game && controller.game.getCurrentPlayer() === 0;
    });

    if (!isPlayerTurn) {
        console.log('   ⚠️  当前不是玩家回合，跳过测试');
        return;
    }

    // 检查锁状态
    const lockStateBefore = await page.evaluate(() => {
        const controller = window.gameController;
        return controller ? controller.isProcessingAction : null;
    });
    console.log(`   锁状态 (点击前): ${lockStateBefore}`);

    // 快速点击第一张牌3次
    const firstTile = await page.locator('#player-hand .tile').first();
    await firstTile.click({ clickCount: 3, delay: 50 });

    await sleep(200);

    // 检查锁状态
    const lockStateAfter = await page.evaluate(() => {
        const controller = window.gameController;
        return controller ? controller.isProcessingAction : null;
    });
    console.log(`   锁状态 (点击后): ${lockStateAfter}`);

    // 等待操作完成
    await sleep(1500);

    // 检查手牌数 - 应该只减少1张
    const finalCount = await page.locator('#player-hand .tile').count();
    console.log(`   最终手牌数: ${finalCount}`);

    const discarded = initialCount - finalCount;
    if (discarded === 1) {
        console.log('   ✅ 快速点击测试通过：只打出了一张牌');
    } else if (discarded === 0) {
        console.log('   ⚠️  没有牌被打出（可能碰/杠后需要出牌）');
    } else {
        console.log(`   ❌ 快速点击测试失败：打出了 ${discarded} 张牌`);
    }
}

/**
 * 测试2: 碰牌后必须出牌
 * 确保碰牌后玩家必须打出一张牌才能继续
 */
async function testPongRequiresDiscard(page) {
    console.log('\n🧪 测试: 碰牌后必须出牌');

    // 检查游戏状态
    const state = await page.evaluate(() => {
        const controller = window.gameController;
        if (!controller || !controller.game) return null;

        const game = controller.game;
        const pendingActions = game.getPendingActions();
        const playerPengAction = pendingActions.find(a =>
            a.playerIndex === 0 && a.action === 'peng'
        );

        return {
            currentPlayer: game.getCurrentPlayer(),
            pendingActions: pendingActions.length,
            hasPlayerPeng: !!playerPengAction,
            isProcessingAction: controller.isProcessingAction
        };
    });

    if (!state) {
        console.log('   ⚠️  无法获取游戏状态');
        return;
    }

    console.log(`   当前玩家: ${state.currentPlayer}`);
    console.log(`   等待操作数: ${state.pendingActions}`);
    console.log(`   玩家可碰: ${state.hasPlayerPeng}`);

    // 如果玩家可以碰
    if (state.hasPlayerPeng) {
        // 获取碰牌前的手牌数
        const countBefore = await page.locator('#player-hand .tile').count();
        console.log(`   碰牌前手牌数: ${countBefore}`);

        // 点击碰按钮
        const pengBtn = await page.$('#peng-btn');
        if (pengBtn) {
            const isVisible = await pengBtn.isVisible();
            if (isVisible) {
                await pengBtn.click();
                console.log('   点击了碰按钮');
                await sleep(500);

                // 检查碰后的状态
                const stateAfterPeng = await page.evaluate(() => {
                    const controller = window.gameController;
                    if (!controller) return null;
                    return {
                        currentPlayer: controller.game.getCurrentPlayer(),
                        isProcessingAction: controller.isProcessingAction,
                        pendingActions: controller.game.getPendingActions().length
                    };
                });

                console.log(`   碰后当前玩家: ${stateAfterPeng.currentPlayer}`);
                console.log(`   碰后锁状态: ${stateAfterPeng.isProcessingAction}`);

                // 碰后应该轮到玩家(当前玩家=0)
                if (stateAfterPeng.currentPlayer === 0) {
                    // 锁应该被释放，允许玩家出牌
                    if (stateAfterPeng.isProcessingAction === false) {
                        console.log('   ✅ 碰牌后锁已释放，等待玩家出牌');

                        // 玩家应该能出牌
                        const countAfter = await page.locator('#player-hand .tile').count();
                        console.log(`   碰后手牌数: ${countAfter}`);

                        // 出一张牌
                        const firstTile = await page.locator('#player-hand .tile').first();
                        await firstTile.click();
                        await sleep(500);

                        const countAfterDiscard = await page.locator('#player-hand .tile').count();
                        console.log(`   出牌后手牌数: ${countAfterDiscard}`);

                        if (countAfterDiscard < countAfter) {
                            console.log('   ✅ 碰牌后出牌测试通过');
                        }
                    } else {
                        console.log('   ⚠️  碰后锁未释放');
                    }
                } else {
                    console.log('   ⚠️  碰后不是玩家回合');
                }
            } else {
                console.log('   ⚠️  碰按钮不可见');
            }
        } else {
            console.log('   ⚠️  未找到碰按钮');
        }
    } else {
        console.log('   ℹ️  当前没有碰牌机会，需要特定场景测试');
        // 说明：这个测试需要特定的牌型才能触发
        // 可以通过多次自动出牌来尝试触发碰牌场景
    }
}

/**
 * 测试3: 模拟游戏直到碰牌场景
 */
async function testPongScenario(page) {
    console.log('\n🧪 测试: 寻找碰牌场景 (最多50回合)');

    for (let i = 0; i < 50; i++) {
        // 检查是否有碰牌机会
        const hasPeng = await page.evaluate(() => {
            const controller = window.gameController;
            if (!controller || !controller.game) return false;
            const pendingActions = controller.game.getPendingActions();
            return pendingActions.some(a => a.playerIndex === 0 && a.action === 'peng');
        });

        if (hasPeng) {
            console.log(`   🎉 在第 ${i + 1} 回合找到碰牌机会`);
            await testPongRequiresDiscard(page);
            return;
        }

        // 检查游戏是否结束
        const gameOver = await page.evaluate(() => {
            const controller = window.gameController;
            return controller && controller.game && controller.game.isGameOver();
        });

        if (gameOver) {
            console.log('   ℹ️  游戏结束，未遇到碰牌场景');
            return;
        }

        // 自动出牌
        await page.click('#debug-auto-play');
        await sleep(800);
    }

    console.log('   ℹ️  50回合内未遇到碰牌场景（碰牌需要特定牌型）');
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

        // 7. 测试快速点击锁机制 (Bug 1) - 在游戏早期测试
        console.log('📍 步骤 6: 测试快速点击锁机制');
        const earlyGameState = await page.evaluate(() => {
            const controller = window.gameController;
            if (!controller || !controller.game) return null;
            const game = controller.game;
            return {
                currentPlayer: game.getCurrentPlayer(),
                isGameOver: game.isGameOver()
            };
        });

        if (earlyGameState && !earlyGameState.isGameOver && earlyGameState.currentPlayer === 0) {
            await testRapidClickLock(page);
        } else if (earlyGameState && earlyGameState.currentPlayer !== 0) {
            console.log('   当前不是玩家回合，等待玩家回合...');
            // 等待轮到玩家
            for (let i = 0; i < 10; i++) {
                await sleep(1000);
                const newState = await page.evaluate(() => {
                    const controller = window.gameController;
                    return controller && controller.game && controller.game.getCurrentPlayer() === 0;
                });
                if (newState) {
                    await testRapidClickLock(page);
                    break;
                }
            }
        } else {
            console.log('   ⚠️  无法测试快速点击锁机制');
        }

        // 8. 测试自动出牌
        console.log('📍 步骤 7: 测试自动出牌 (10回合)');
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

        // 9. 检查游戏状态
        console.log('📍 步骤 8: 检查游戏状态');
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

        if (gameState) {
            console.log('   游戏状态:', JSON.stringify(gameState, null, 2));
        } else {
            console.log('   ⚠️  游戏状态不可用');
        }

        // 9. 测试快速点击锁机制 (Bug 1)
        console.log('📍 步骤 8: 测试快速点击锁机制');
        if (gameState && !gameState.isGameOver && gameState.currentPlayer === 0) {
            await testRapidClickLock(page);
        } else if (!gameState) {
            console.log('   ⚠️  跳过快速点击测试（游戏状态不可用）');
        } else {
            console.log('   ⚠️  跳过快速点击测试（不是玩家回合或游戏已结束）');
        }

        // 10. 测试碰牌后必须出牌 (Bug 2)
        console.log('📍 步骤 9: 测试碰牌后必须出牌');
        if (gameState && !gameState.isGameOver) {
            await testPongScenario(page);
        } else if (!gameState) {
            console.log('   ⚠️  跳过碰牌测试（游戏状态不可用）');
        } else {
            console.log('   ⚠️  跳过碰牌测试（游戏已结束）');
        }

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