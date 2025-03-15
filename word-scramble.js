// 单词拼写游戏的核心逻辑
let scrambleCurrentWordIndex = 0;
let scrambleScore = 0;
const SCRAMBLE_POINTS_PER_WORD = 10;
const TOTAL_SCRAMBLE_WORDS = words.length;

// 全局变量
let scrambleContainer;
let scrambleLetters;
let scrambleAnswer;
let scrambleFeedback;
let scrambleNextButton;
let scrambleScoreElement;
let scrambleProgressElement;
let scrambleImage;
let scrambleAudio;
let scramblePlayButton;
let scrambleImageContainer;

// 初始化游戏界面
function initializeGameUI() {
    // 获取或创建容器
    scrambleContainer = document.getElementById('scrambleContainer');
    if (!scrambleContainer) {
        console.error('找不到游戏容器');
        return;
    }

    // 创建基本游戏界面
    scrambleContainer.innerHTML = `
        <h2>单词拼写游戏</h2>
        <div class="scramble-score">得分: <span id="scrambleScore">0</span></div>
        <div id="scrambleLetters" class="scramble-letters"></div>
        <div id="scrambleAnswer" class="scramble-answer"></div>
        <div id="scrambleFeedback" class="scramble-feedback"></div>
        <button id="scrambleNextButton" class="scramble-next-button">下一个</button>
    `;

    // 获取必要的 DOM 元素
    scrambleLetters = document.getElementById('scrambleLetters');
    scrambleAnswer = document.getElementById('scrambleAnswer');
    scrambleFeedback = document.getElementById('scrambleFeedback');
    scrambleNextButton = document.getElementById('scrambleNextButton');
    scrambleScoreElement = document.getElementById('scrambleScore');

    // 创建进度显示元素
    scrambleProgressElement = document.createElement('div');
    scrambleProgressElement.className = 'progress';
    scrambleProgressElement.style.cssText = 'text-align: center; margin-bottom: 10px; color: #666;';
    scrambleContainer.insertAdjacentElement('afterbegin', scrambleProgressElement);

    // 创建图片和音频元素
    scrambleImage = document.createElement('img');
    scrambleImage.className = 'scramble-image';
    scrambleImage.alt = '单词图片';

    scrambleAudio = document.createElement('audio');
    scrambleAudio.className = 'scramble-audio';

    // 创建播放按钮
    scramblePlayButton = document.createElement('button');
    scramblePlayButton.className = 'scramble-play-button';
    scramblePlayButton.innerHTML = `
        <svg viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
        </svg>
    `;

    // 创建图片容器
    scrambleImageContainer = document.createElement('div');
    scrambleImageContainer.className = 'scramble-image-container';
    scrambleImageContainer.appendChild(scrambleImage);
    scrambleImageContainer.appendChild(scramblePlayButton);

    // 将图片容器插入到字母区域之前
    scrambleContainer.insertBefore(scrambleImageContainer, scrambleLetters);

    // 添加事件监听器
    scrambleAnswer.addEventListener('dragover', handleDragOver);
    scrambleAnswer.addEventListener('dragleave', handleDragLeave);
    scrambleAnswer.addEventListener('drop', handleDrop);

    scramblePlayButton.addEventListener('click', () => {
        scrambleAudio.currentTime = 0;
        scrambleAudio.play().catch(error => {
            console.error('音频播放失败:', error);
        });
    });

    scrambleNextButton.addEventListener('click', () => {
        scrambleCurrentWordIndex++;
        loadScrambleWord();
    });
}

// 更新进度显示
function updateScrambleProgress() {
    if (scrambleProgressElement) {
        scrambleProgressElement.textContent = `第 ${scrambleCurrentWordIndex + 1} 题 / 共 ${TOTAL_SCRAMBLE_WORDS} 题`;
    }
}

// 初始化拼写游戏
function initializeScrambleGame() {
    scrambleCurrentWordIndex = 0;
    scrambleScore = 0;
    if (scrambleScoreElement) {
        scrambleScoreElement.textContent = scrambleScore;
    }
    updateScrambleProgress();
    loadScrambleWord();
}

// 加载新的拼写单词
function loadScrambleWord() {
    if (scrambleCurrentWordIndex >= words.length) {
        showScrambleVictory();
        return;
    }

    const currentWord = words[scrambleCurrentWordIndex];
    const shuffledLetters = shuffleArray([...currentWord.word]);
    
    // 更新图片和音频
    if (scrambleImage) scrambleImage.src = currentWord.image;
    if (scrambleAudio) scrambleAudio.src = currentWord.audio;
    
    // 清空之前的字母
    if (scrambleLetters) scrambleLetters.innerHTML = '';
    
    // 创建可拖拽的字母
    shuffledLetters.forEach((letter, index) => {
        const letterElement = document.createElement('div');
        letterElement.className = 'scramble-letter';
        letterElement.draggable = true;
        letterElement.textContent = letter;
        
        letterElement.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', letter);
            e.dataTransfer.effectAllowed = 'move';
            letterElement.classList.add('dragging');
        });
        
        letterElement.addEventListener('dragend', (e) => {
            letterElement.classList.remove('dragging');
            if (e.dataTransfer.dropEffect === 'move') {
                letterElement.remove();
            }
        });
        
        scrambleLetters.appendChild(letterElement);
    });
    
    // 清空答案区域
    if (scrambleAnswer) scrambleAnswer.innerHTML = '';
    
    // 重置反馈
    if (scrambleFeedback) {
        scrambleFeedback.textContent = '';
        scrambleFeedback.className = 'scramble-feedback';
    }
    
    // 显示下一个按钮
    if (scrambleNextButton) {
        scrambleNextButton.style.display = 'none';
    }
    
    // 更新进度显示
    updateScrambleProgress();
    
    // 自动播放音频
    if (scrambleAudio) {
        setTimeout(() => {
            scrambleAudio.play().catch(error => {
                console.error('音频播放失败:', error);
            });
        }, 500);
    }
}

// 处理拖拽事件
function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const letter = e.dataTransfer.getData('text/plain');
    
    // 创建答案字母
    const answerLetter = document.createElement('div');
    answerLetter.className = 'scramble-answer-letter';
    answerLetter.textContent = letter;
    
    // 添加点击事件移除字母
    answerLetter.addEventListener('click', () => {
        const letterElement = document.createElement('div');
        letterElement.className = 'scramble-letter';
        letterElement.draggable = true;
        letterElement.textContent = letter;
        
        letterElement.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', letter);
            e.dataTransfer.effectAllowed = 'move';
            letterElement.classList.add('dragging');
        });
        
        letterElement.addEventListener('dragend', (e) => {
            letterElement.classList.remove('dragging');
            if (e.dataTransfer.dropEffect === 'move') {
                letterElement.remove();
            }
        });
        
        scrambleLetters.appendChild(letterElement);
        answerLetter.remove();
        checkScrambleAnswer();
    });
    
    scrambleAnswer.appendChild(answerLetter);
    checkScrambleAnswer();
}

// 检查答案
function checkScrambleAnswer() {
    const currentWord = words[scrambleCurrentWordIndex].word;
    const answer = Array.from(scrambleAnswer.children)
        .map(letter => letter.textContent)
        .join('');
    
    if (answer === currentWord) {
        scrambleFeedback.textContent = '正确！👏';
        scrambleFeedback.className = 'scramble-feedback correct';
        scrambleScore += SCRAMBLE_POINTS_PER_WORD;
        scrambleScoreElement.textContent = scrambleScore;
        scrambleNextButton.style.display = 'block';
    }
}

// 重启游戏函数
window.restartScrambleGame = function() {
    // 重置游戏状态
    scrambleCurrentWordIndex = 0;
    scrambleScore = 0;
    
    // 重新初始化游戏界面
    initializeGameUI();
    
    // 重新初始化游戏
    initializeScrambleGame();
}

// 显示胜利消息
function showScrambleVictory() {
    if (!scrambleContainer) return;
    
    scrambleContainer.innerHTML = `
        <div class="scramble-victory">
            <h2>🎉 恭喜完成所有单词拼写！</h2>
            <p>最终得分：${scrambleScore}</p>
            <button onclick="window.restartScrambleGame()" class="scramble-restart-button">
                重新开始
            </button>
        </div>
    `;
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    initializeGameUI();
    initializeScrambleGame();
}); 