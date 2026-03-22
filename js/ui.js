/**
 * 麻将游戏UI渲染
 */

// 语音播报管理器（支持多音色）
class VoiceAnnouncer {
    constructor() {
        this.enabled = true;
        this.synth = window.speechSynthesis;
        this.lang = 'zh-CN';
        this.voices = [];
        this.voicesLoaded = false;

        // 不同玩家的音色配置
        this.playerConfigs = {
            0: { name: '你', gender: 'male' },        // 玩家（男声）
            1: { name: 'AI 1', gender: 'female' },    // AI 1（女声）
            2: { name: 'AI 2', gender: 'male' },      // AI 2（男声）
            3: { name: 'AI 3', gender: 'female' }     // AI 3（女声）
        };

        // 预定义的播报文本
        this.announcements = {
            peng: '碰',
            gang: '杠',
            hu: '胡',
            chi: '吃',
            zimo: '自摸',
            tianhu: '天胡',
            dihu: '地胡',
            haidilaoyue: '海底捞月',
            gameStart: '游戏开始',
            gameOver: '游戏结束',
            yourTurn: '轮到你出牌',
            wait: '等待',
            discard: '打'
        };

        // 加载可用语音
        this.loadVoices();
    }

    // 加载系统可用语音
    loadVoices() {
        // 某些浏览器需要异步加载语音列表
        const loadVoiceList = () => {
            this.voices = this.synth.getVoices();
            if (this.voices.length > 0) {
                this.voicesLoaded = true;
                this.assignPlayerVoices();
                console.log(`已加载 ${this.voices.length} 个语音`);
            }
        };

        // 立即尝试加载
        loadVoiceList();

        // 监听语音列表变化（某些浏览器需要）
        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = loadVoiceList;
        }
    }

    // 为玩家分配语音
    assignPlayerVoices() {
        // 获取中文语音
        const chineseVoices = this.voices.filter(v =>
            v.lang.includes('zh') || v.lang.includes('CN')
        );

        // 尝试找到男声和女声
        // 常见的中文语音关键词
        const femaleKeywords = ['female', '女', 'xiaoxiao', 'tingting', 'yaoyao', 'xiaoyan'];
        const maleKeywords = ['male', '男', 'kangkang', 'zhipeng', 'xiaofeng'];

        const femaleVoices = chineseVoices.filter(v =>
            femaleKeywords.some(k => v.name.toLowerCase().includes(k))
        );

        const maleVoices = chineseVoices.filter(v =>
            maleKeywords.some(k => v.name.toLowerCase().includes(k))
        );

        // 按 playerConfigs 的性别配置分配语音
        // 玩家 0: 男, AI 1: 女, AI 2: 男, AI 3: 女
        this.playerVoices = {
            0: maleVoices[0] || chineseVoices[0] || this.voices[0],    // 玩家 - 男声
            1: femaleVoices[0] || chineseVoices[1] || this.voices[1],  // AI 1 - 女声
            2: maleVoices[1] || maleVoices[0] || chineseVoices[2] || this.voices[2], // AI 2 - 男声
            3: femaleVoices[1] || femaleVoices[0] || chineseVoices[3] || this.voices[3] // AI 3 - 女声
        };

        // 打印分配结果
        for (let i = 0; i < 4; i++) {
            const voice = this.playerVoices[i];
            if (voice) {
                const gender = this.playerConfigs[i].gender === 'male' ? '男' : '女';
                console.log(`玩家 ${i} (${gender}): ${voice.name}`);
            }
        }
    }

    // 设置是否启用
    setEnabled(enabled) {
        this.enabled = enabled;
    }

    // 获取是否启用
    isEnabled() {
        return this.enabled;
    }

    // 播报文本（指定玩家）
    speak(text, playerIndex = 0) {
        if (!this.enabled || !this.synth) return;

        // 取消之前的播报
        this.synth.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = this.lang;

        // 设置指定玩家的语音
        if (this.playerVoices && this.playerVoices[playerIndex]) {
            utterance.voice = this.playerVoices[playerIndex];
        }

        // 根据性别调整音调（女声高，男声低）
        const config = this.playerConfigs[playerIndex];
        if (config.gender === 'female') {
            utterance.pitch = 1.1;  // 女声稍高
            utterance.rate = 1.0;
        } else {
            utterance.pitch = 0.9;  // 男声稍低
            utterance.rate = 0.95;
        }
        utterance.volume = 1.0;

        this.synth.speak(utterance);
    }

    // 播报操作（指定玩家）
    announceAction(action, playerIndex = 0) {
        const text = this.announcements[action];
        if (text) {
            this.speak(text, playerIndex);
        }
    }

    // 播报出牌（包含牌名）
    announceDiscard(tileName, playerIndex = 0) {
        if (!this.enabled || !this.synth) return;
        this.speak(tileName, playerIndex);
    }

    // 播报摸牌
    announceDraw(playerIndex = 0) {
        if (playerIndex === 0) {
            this.speak('摸牌', playerIndex);
        }
    }

    // 播报自定义文本
    announce(text, playerIndex = 0) {
        this.speak(text, playerIndex);
    }

    // 获取玩家名称
    getPlayerName(playerIndex) {
        const config = this.playerConfigs[playerIndex];
        return config ? config.name : `玩家${playerIndex + 1}`;
    }

    // 获取可用语音列表（调试用）
    getAvailableVoices() {
        return this.voices.map(v => ({
            name: v.name,
            lang: v.lang,
            voiceURI: v.voiceURI
        }));
    }
}

class MahjongUI {
    constructor() {
        this.gameContainer = document.querySelector('.game-container');
        this.playerHandElement = document.getElementById('player-hand');
        this.remainingTilesElement = document.getElementById('remaining-tiles');
        this.playerScoreElement = document.getElementById('player-score');
        this.pengBtn = document.getElementById('peng-btn');
        this.gangBtn = document.getElementById('gang-btn');
        this.huBtn = document.getElementById('hu-btn');
        this.passBtn = document.getElementById('pass-btn');
        this.chiBtn = document.getElementById('chi-btn'); // 吃牌按钮
        this.difficultySelect = document.getElementById('difficulty-select');

        // 初始化语音播报
        this.voiceAnnouncer = new VoiceAnnouncer();

        // 调试面板元素
        this.debugPanel = document.getElementById('debug-panel');
        this.debugToggleBtn = document.getElementById('debug-toggle-btn');
        this.debugGameState = document.getElementById('debug-game-state');
        this.showAiHandsCheckbox = document.getElementById('show-ai-hands');
        this.debugNewGameBtn = document.getElementById('debug-new-game');
        this.debugAutoPlayBtn = document.getElementById('debug-auto-play');
        this.closeDebugBtn = document.getElementById('close-debug-btn');

        // 调试状态
        this.showAiHands = false;

        // 音频元素
        this.dealSound = document.getElementById('deal-sound');
        this.discardSound = document.getElementById('discard-sound');
        this.pengSound = document.getElementById('peng-sound');
        this.gangSound = document.getElementById('gang-sound');
        this.huSound = document.getElementById('hu-sound');
        this.winSound = document.getElementById('win-sound');

        // AI手牌区域元素
        this.aiHandElements = [
            document.querySelector('.ai-left .ai-hand'),
            document.querySelector('.ai-top .ai-hand'),
            document.querySelector('.ai-right .ai-hand')
        ];

        // 玩家明牌区域元素
        this.playerExposedElement = document.getElementById('player-exposed');
        this.aiExposedElements = [
            document.getElementById('ai1-exposed'),
            document.getElementById('ai3-exposed'),
            document.getElementById('ai2-exposed')
        ];

        // 已打出的牌区域元素
        this.discardedRows = [
            document.querySelector('.discarded-row.top-row'),
            document.querySelector('.discarded-row.middle-row'),
            document.querySelector('.discarded-row.bottom-row')
        ];

        // 并发控制
        this.isAnimating = false;
        this.actionQueue = [];
        this.animationLockCount = 0;

        this.initEventListeners();
    }

    // 获取动画状态
    getIsAnimating() {
        return this.isAnimating;
    }

    // 开始动画（锁定UI）
    beginAnimation() {
        this.animationLockCount++;
        this.isAnimating = true;
        this.updateUICursor();
    }

    // 结束动画（解锁UI）
    endAnimation() {
        this.animationLockCount = Math.max(0, this.animationLockCount - 1);
        if (this.animationLockCount === 0) {
            this.isAnimating = false;
            this.updateUICursor();
            // 处理队列中的操作
            this.processActionQueue();
        }
    }

    // 更新UI光标状态
    updateUICursor() {
        if (this.isAnimating) {
            this.gameContainer.classList.add('animating');
        } else {
            this.gameContainer.classList.remove('animating');
        }
    }

    // 将操作加入队列
    queueAction(action, ...args) {
        this.actionQueue.push({ action, args });
    }

    // 处理操作队列
    processActionQueue() {
        if (this.actionQueue.length > 0 && !this.isAnimating) {
            const { action, args } = this.actionQueue.shift();
            this.handleAction(action, ...args);
        }
    }

    // 等待动画完成
    async waitForAnimation(duration = 300) {
        return new Promise(resolve => {
            this.beginAnimation();
            setTimeout(() => {
                this.endAnimation();
                resolve();
            }, duration);
        });
    }

    // 初始化事件监听器
    initEventListeners() {
        // 玩家手牌点击事件委托
        this.playerHandElement.addEventListener('click', (e) => {
            const tileElement = e.target.closest('.tile');
            if (tileElement) {
                this.selectTile(tileElement);
            }
        });

        // 操作按钮事件
        this.pengBtn.addEventListener('click', () => this.handleAction('peng'));
        this.gangBtn.addEventListener('click', () => this.handleAction('gang'));
        this.huBtn.addEventListener('click', () => this.handleAction('hu'));
        this.passBtn.addEventListener('click', () => this.handleAction('pass'));

        // 吃牌按钮
        if (this.chiBtn) {
            this.chiBtn.addEventListener('click', () => this.handleAction('chi'));
        }
    }

    // 渲染玩家手牌
    renderPlayerHand(hand) {
        // 先渲染明牌
        this.renderExposedTiles(hand.getExposed(), this.playerExposedElement);

        // 再渲染手牌
        this.playerHandElement.innerHTML = '';
        const tiles = hand.getTiles();

        tiles.forEach((tile, index) => {
            const tileElement = this.createTileElement(tile, false, index);
            // 添加发牌动画类
            tileElement.classList.add('animated-deal');
            this.playerHandElement.appendChild(tileElement);
        });

        // 播放发牌音效
        if (tiles.length > 0) {
            this.playSound('deal');
        }
    }

    // 渲染明牌（碰/杠/吃的牌组）
    renderExposedTiles(exposed, container) {
        if (!container) return;
        container.innerHTML = '';

        exposed.forEach(group => {
            const groupElement = document.createElement('div');
            groupElement.className = `exposed-group exposed-${group.type}`;

            group.tiles.forEach(tile => {
                const tileElement = this.createTileElement(tile, false);
                tileElement.classList.add('exposed-tile');
                groupElement.appendChild(tileElement);
            });

            container.appendChild(groupElement);
        });
    }

    // 渲染AI手牌
    renderAIHands(aiHands, showCards = false) {
        let hasTiles = false;
        aiHands.forEach((hand, index) => {
            const handElement = this.aiHandElements[index];
            const exposedElement = this.aiExposedElements[index];

            // 渲染明牌
            if (exposedElement) {
                this.renderExposedTiles(hand.getExposed(), exposedElement);
            }

            if (handElement) {
                handElement.innerHTML = '';
                const tileCount = hand.getCount();

                // 显示背面朝上的牌或正面（作弊模式）
                if (showCards) {
                    // 显示正面
                    const tiles = hand.getTiles();
                    tiles.forEach((tile) => {
                        const tileElement = this.createTileElement(tile, false);
                        tileElement.classList.add('animated-deal');
                        handElement.appendChild(tileElement);
                        hasTiles = true;
                    });
                } else {
                    // 显示背面
                    for (let i = 0; i < tileCount; i++) {
                        const tileElement = this.createTileElement(null, true);
                        tileElement.classList.add('animated-deal');
                        handElement.appendChild(tileElement);
                        hasTiles = true;
                    }
                }
            }
        });

        // 播放发牌音效
        if (hasTiles) {
            this.playSound('deal');
        }
    }

    // 渲染已打出的牌
    renderDiscardedTiles(discardedTiles) {
        // 清空所有行
        this.discardedRows.forEach(row => row.innerHTML = '');

        // 将打出的牌分配到不同的行
        discardedTiles.forEach((tile, index) => {
            const rowIndex = index % 3;
            const tileElement = this.createTileElement(tile, false);
            // 添加弃牌样式类（小尺寸）
            tileElement.classList.add('discarded-tile');
            tileElement.classList.add('animated-discard');
            this.discardedRows[rowIndex].appendChild(tileElement);
        });

        // 播放出牌音效
        if (discardedTiles.length > 0) {
            this.playSound('discard');
        }
    }

    // 创建牌元素
    createTileElement(tile, isBack, index = null) {
        const tileElement = document.createElement('div');
        tileElement.className = 'tile';

        // 添加唯一的ID以便于动画追踪
        if (tile) {
            tileElement.id = `tile-${tile.getId()}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        }

        if (isBack) {
            // 背面朝上的牌
            tileElement.classList.add('tile-back');
            tileElement.innerHTML = `
                <img src="assets/tiles/Back.png" alt="牌背" draggable="false">
            `;
        } else if (tile) {
            // 正面朝上的牌
            tileElement.classList.add('tile-front');
            tileElement.dataset.suit = tile.suit;
            tileElement.dataset.value = tile.value;

            if (index !== null) {
                tileElement.dataset.index = index;
            }

            tileElement.innerHTML = `
                <img src="assets/tiles/${tile.getImageName()}" alt="${tile.getName()}" draggable="false">
            `;
        }

        return tileElement;
    }

    // 选择牌（高亮显示）
    selectTile(tileElement) {
        // 如果正在动画中，忽略点击
        if (this.isAnimating) {
            return;
        }

        // 移除其他已选择的牌的高亮
        document.querySelectorAll('.tile.selected').forEach(el => {
            el.classList.remove('selected');
        });

        // 高亮当前选择的牌
        tileElement.classList.add('selected');

        // 触发选择事件（可以在外部监听）
        this.onTileSelected && this.onTileSelected(
            tileElement.dataset.suit,
            parseInt(tileElement.dataset.value),
            parseInt(tileElement.dataset.index)
        );
    }

    // 更新游戏信息
    updateGameInfo(game) {
        this.remainingTilesElement.textContent = game.getRemainingTiles();
        // 这里可以更新玩家分数等信息
    }

    // 启用/禁用操作按钮
    enableActions(actions) {
        // 映射操作到按钮
        this.pengBtn.disabled = !actions.includes('peng');
        this.gangBtn.disabled = !actions.includes('gang');
        this.huBtn.disabled = !actions.includes('hu') && !actions.includes('zimo');
        this.passBtn.disabled = !actions.includes('pass') && !actions.some(a => ['peng', 'gang', 'hu', 'zimo', 'chi'].includes(a));

        // 吃牌按钮
        if (this.chiBtn) {
            this.chiBtn.disabled = !actions.includes('chi');
        }

        // 显示操作按钮区域
        document.querySelector('.player-actions').style.display =
            actions.length > 0 ? 'flex' : 'none';
    }

    // 隐藏操作按钮
    hideActions() {
        document.querySelector('.player-actions').style.display = 'none';
    }

    // 处理操作按钮点击
    handleAction(action) {
        // 如果正在动画中，将操作加入队列
        if (this.isAnimating) {
            this.queueAction(action);
            return;
        }
        this.onAction && this.onAction(action);
    }

    // 显示消息
    showMessage(message, duration = 3000) {
        // 创建消息元素
        const messageElement = document.createElement('div');
        messageElement.className = 'message';
        messageElement.textContent = message;

        // 添加到游戏容器
        this.gameContainer.appendChild(messageElement);

        // 设置定时移除
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.style.animation = 'fadeOut 0.3s ease-out forwards';
                setTimeout(() => {
                    if (messageElement.parentNode) {
                        messageElement.parentNode.removeChild(messageElement);
                    }
                }, 300);
            }
        }, duration);
    }

    // 显示游戏提示
    showGameTip(message) {
        // 创建提示元素
        const tipElement = document.createElement('div');
        tipElement.className = 'game-tip';
        tipElement.textContent = message;

        // 添加到游戏容器
        this.gameContainer.appendChild(tipElement);

        // 设置定时移除
        setTimeout(() => {
            if (tipElement.parentNode) {
                tipElement.style.animation = 'fadeOut 0.3s ease-out forwards';
                setTimeout(() => {
                    if (tipElement.parentNode) {
                        tipElement.parentNode.removeChild(tipElement);
                    }
                }, 300);
            }
        }, 2000);
    }

    // 游戏结束
    showGameOver(message) {
        const gameOverElement = document.createElement('div');
        gameOverElement.className = 'game-over';
        gameOverElement.innerHTML = `
            <div class="game-over-content">
                <h2>游戏结束</h2>
                <p>${message}</p>
                <button onclick="location.reload()">重新开始</button>
            </div>
        `;

        this.gameContainer.appendChild(gameOverElement);
    }

    // 亮牌显示系统 - 显示所有玩家手牌和番型
    showAllHands(game) {
        // 创建亮牌面板
        const revealPanel = document.createElement('div');
        revealPanel.className = 'reveal-panel';

        let html = '<div class="reveal-title">胡牌结果</div>';

        // 显示胡牌玩家信息
        const winResult = game.getLastWinResult();
        if (winResult) {
            const player = winResult.playerIndex;
            const isZimo = winResult.isZimo;
            const fanResult = winResult.fanResult;

            html += `
                <div class="reveal-winner">
                    <div class="winner-name">玩家 ${player + 1} ${isZimo ? '自摸' : '胡牌'}</div>
                    <div class="winner-fan">
                        ${fanResult.fanTypes.map(f => f.name).join('、')}
                        <span class="fan-total">共 ${fanResult.totalFan} 番</span>
                    </div>
                </div>
            `;
        }

        // 显示所有玩家手牌
        html += '<div class="reveal-hands">';
        for (let i = 0; i < 4; i++) {
            const hand = game.players[i];
            const tiles = hand.getTiles();
            const exposed = hand.getExposed();
            const isWinner = winResult && winResult.playerIndex === i;

            html += `
                <div class="reveal-hand ${isWinner ? 'winner' : ''}">
                    <div class="reveal-hand-title">玩家 ${i + 1} ${i === 0 ? '(你)' : ''} ${isWinner ? '🏆' : ''}</div>
                    <div class="reveal-hand-tiles">
            `;

            // 显示明牌
            exposed.forEach(group => {
                html += '<div class="reveal-exposed-group">';
                group.tiles.forEach(tile => {
                    html += `<div class="reveal-tile exposed">${tile.getName()}</div>`;
                });
                html += '</div>';
            });

            // 显示手牌
            tiles.forEach(tile => {
                html += `<div class="reveal-tile">${tile.getName()}</div>`;
            });

            html += '</div></div>';
        }
        html += '</div>';

        // 添加关闭按钮
        html += '<button class="reveal-close-btn" onclick="this.parentElement.remove()">关闭</button>';

        revealPanel.innerHTML = html;
        this.gameContainer.appendChild(revealPanel);

        // 语音播报
        this.announce('游戏结束');
    }

    // 播放音效（不包含语音播报，语音播报在 controller 中处理）
    playSound(soundType) {
        let sound = null;
        switch(soundType) {
            case 'deal':
                sound = this.dealSound;
                break;
            case 'discard':
                sound = this.discardSound;
                break;
            case 'peng':
                sound = this.pengSound;
                break;
            case 'gang':
                sound = this.gangSound;
                break;
            case 'hu':
                sound = this.huSound;
                break;
            case 'win':
                sound = this.winSound;
                break;
            default:
                return;
        }

        if (sound) {
            // 重置音频并播放
            sound.currentTime = 0;
            sound.play().catch(e => {
                // 浏览器安全策略：首次需要用户交互才能播放音频
                // 这是正常行为，不需要警告
                if (e.name !== 'NotAllowedError') {
                    console.warn("音频播放失败:", e);
                }
            });
        }
    }

    // 设置语音播报开关
    setVoiceEnabled(enabled) {
        this.voiceAnnouncer.setEnabled(enabled);
    }

    // 获取语音播报状态
    isVoiceEnabled() {
        return this.voiceAnnouncer.isEnabled();
    }

    // 语音播报
    announce(text, playerIndex = 0) {
        this.voiceAnnouncer.announce(text, playerIndex);
    }

    // 语音播报操作
    announceAction(action, playerIndex = 0) {
        this.voiceAnnouncer.announceAction(action, playerIndex);
    }

    // 显示碰/杠动画
    showPengGangAnimation() {
        // 播放碰/杠音效
        this.playSound('peng'); // 或者 'gang'，这里统一用碰的音效

        // 在玩家手牌区域显示碰/杠动画
        const playerArea = document.querySelector('.player-area');
        if (playerArea) {
            playerArea.classList.add('animated-penggang');
            setTimeout(() => {
                playerArea.classList.remove('animated-penggang');
            }, 600);
        }
    }

    // 显示胡牌动画
    showWinAnimation() {
        // 播放胡牌音效
        this.playSound('win');

        // 在游戏容器上显示胡牌动画
        this.gameContainer.classList.add('animated-win');
        setTimeout(() => {
            this.gameContainer.classList.remove('animated-win');
        }, 1000);
    }

    // 设置牌被选择的回调
    setOnTileSelected(callback) {
        this.onTileSelected = callback;
    }

    // 设置操作按钮回调
    setOnAction(callback) {
        this.onAction = callback;
    }

    // 获取当前选择的AI难度
    getSelectedDifficulty() {
        return this.difficultySelect ? this.difficultySelect.value : 'medium';
    }

    // 设置AI难度选择器的值
    setDifficulty(difficulty) {
        if (this.difficultySelect) {
            this.difficultySelect.value = difficulty;
        }
    }

    // 设置难度变化回调
    setOnDifficultyChange(callback) {
        if (this.difficultySelect) {
            this.difficultySelect.addEventListener('change', (e) => {
                callback(e.target.value);
            });
        }
    }

    // 初始化调试面板
    initDebugPanel() {
        if (!this.debugToggleBtn) return;

        // 切换调试面板显示
        this.debugToggleBtn.addEventListener('click', () => {
            this.toggleDebugPanel();
        });

        // 关闭调试面板
        if (this.closeDebugBtn) {
            this.closeDebugBtn.addEventListener('click', () => {
                this.hideDebugPanel();
            });
        }

        // 显示AI手牌切换
        if (this.showAiHandsCheckbox) {
            this.showAiHandsCheckbox.addEventListener('change', (e) => {
                this.showAiHands = e.target.checked;
                if (this.onShowAiHandsChange) {
                    this.onShowAiHandsChange(this.showAiHands);
                }
            });
        }
    }

    // 切换调试面板
    toggleDebugPanel() {
        if (this.debugPanel) {
            const isVisible = this.debugPanel.style.display !== 'none';
            this.debugPanel.style.display = isVisible ? 'none' : 'block';
        }
    }

    // 显示调试面板
    showDebugPanel() {
        if (this.debugPanel) {
            this.debugPanel.style.display = 'block';
        }
    }

    // 隐藏调试面板
    hideDebugPanel() {
        if (this.debugPanel) {
            this.debugPanel.style.display = 'none';
        }
    }

    // 更新调试游戏状态
    updateDebugGameState(game) {
        if (!this.debugGameState) return;

        const state = {
            '当前玩家': game.getCurrentPlayer() + 1,
            '庄家': game.getDealer() + 1,
            '剩余牌数': game.getRemainingTiles(),
            '游戏结束': game.isGameOver() ? '是' : '否',
            '等待操作': game.getPendingActions().map(a =>
                `玩家${a.playerIndex + 1}:${a.action}`
            ).join(', ') || '无'
        };

        let html = '';
        for (const [key, value] of Object.entries(state)) {
            html += `<div><strong>${key}:</strong> ${value}</div>`;
        }
        this.debugGameState.innerHTML = html;
    }

    // 设置显示AI手牌回调
    setOnShowAiHandsChange(callback) {
        this.onShowAiHandsChange = callback;
    }

    // 设置新游戏回调
    setOnDebugNewGame(callback) {
        if (this.debugNewGameBtn) {
            this.debugNewGameBtn.addEventListener('click', callback);
        }
    }

    // 设置自动出牌回调
    setOnDebugAutoPlay(callback) {
        if (this.debugAutoPlayBtn) {
            this.debugAutoPlayBtn.addEventListener('click', callback);
        }
    }

    // 获取是否显示AI手牌
    getShowAiHands() {
        return this.showAiHands;
    }
}

// 页面加载完成后初始化UI
document.addEventListener('DOMContentLoaded', () => {
    window.mahjongUI = new MahjongUI();
});

// 导出UI类和语音播报类
window.MahjongUI = MahjongUI;
window.VoiceAnnouncer = VoiceAnnouncer;