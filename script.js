let currentWordIndex = 0;
let score = 0;
const TOTAL_WORDS = words.length;
const POINTS_PER_WORD = 10;
const WINNING_SCORE = TOTAL_WORDS * POINTS_PER_WORD;

const wordImage = document.getElementById('wordImage');
const playAudio = document.getElementById('playAudio');
const optionsContainer = document.querySelector('.options-container');
const feedback = document.getElementById('feedback');
const nextButton = document.getElementById('nextWord');
const scoreElement = document.getElementById('score');

// 音频缓存
const audioCache = new Map();

// 音频播放锁，防止重复播放
let isPlayingAudio = false;

// 音效
const VICTORY_SOUND = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000.wav');
const CORRECT_SOUND = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435.wav');
const WRONG_SOUND = new Audio('https://assets.mixkit.co/active_storage/sfx/1428/1428.wav');

// 获取用户界面元素
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userInfo = document.getElementById('userInfo');
const userName = document.getElementById('userName');
const syncStatus = document.getElementById('syncStatus');

// 用户数据结构
let userData = {
    currentWordIndex: 0,
    score: 0,
    lastSync: null
};

// Firebase 认证状态监听
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        // 用户已登录
        loginBtn.style.display = 'none';
        userInfo.style.display = 'flex';
        userName.textContent = user.email;
        loadUserData(user.uid);
    } else {
        // 用户未登录
        loginBtn.style.display = 'block';
        userInfo.style.display = 'none';
        userName.textContent = '';
    }
});

// 登录功能
loginBtn.addEventListener('click', () => {
    firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider())
        .catch(error => {
            console.error('登录失败:', error);
            alert('登录失败，请重试');
        });
});

// 退出功能
logoutBtn.addEventListener('click', () => {
    firebase.auth().signOut()
        .then(() => {
            // 重置本地数据
            currentWordIndex = 0;
            score = 0;
            scoreElement.textContent = '0';
            loadWord();
        })
        .catch(error => {
            console.error('退出失败:', error);
            alert('退出失败，请重试');
        });
});

// 加载用户数据
function loadUserData(userId) {
    const userRef = firebase.database().ref(`users/${userId}`);
    userRef.once('value')
        .then(snapshot => {
            const data = snapshot.val();
            if (data) {
                currentWordIndex = data.currentWordIndex || 0;
                score = data.score || 0;
                scoreElement.textContent = score;
                loadWord();
                updateSyncStatus('数据已同步');
            }
        })
        .catch(error => {
            console.error('加载数据失败:', error);
            updateSyncStatus('同步失败');
        });
}

// 保存用户数据
function saveUserData() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    const userRef = firebase.database().ref(`users/${user.uid}`);
    userData = {
        currentWordIndex,
        score,
        lastSync: new Date().toISOString()
    };

    userRef.set(userData)
        .then(() => {
            updateSyncStatus('已保存');
            setTimeout(() => updateSyncStatus(''), 2000);
        })
        .catch(error => {
            console.error('保存失败:', error);
            updateSyncStatus('保存失败');
        });
}

// 更新同步状态显示
function updateSyncStatus(message) {
    syncStatus.textContent = message;
}

// 预加载音频
function preloadAudio(url) {
    if (!audioCache.has(url)) {
        const audio = new Audio();
        audio.src = url;
        audioCache.set(url, audio);
    }
    return audioCache.get(url);
}

// 预加载所有单词音频
words.forEach(word => {
    preloadAudio(word.audio);
});

function playSound(audio) {
    if (isPlayingAudio) return;
    
    isPlayingAudio = true;
    
    // 重置音频
    audio.currentTime = 0;
    
    // 确保音频播放结束后释放锁
    const unlockAudio = () => {
        isPlayingAudio = false;
        audio.removeEventListener('ended', unlockAudio);
        audio.removeEventListener('error', unlockAudio);
    };

    audio.addEventListener('ended', unlockAudio);
    audio.addEventListener('error', unlockAudio);
    
    audio.play()
        .catch(error => {
            console.error('音频播放失败:', error);
            unlockAudio();
        });
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function playWordAudio() {
    const audio = preloadAudio(words[currentWordIndex].audio);
    playSound(audio);
}

function showFeedback(isCorrect) {
    feedback.textContent = isCorrect ? '正确！👏' : '错误！😢';
    feedback.style.color = isCorrect ? '#4CAF50' : '#f44336';
    playSound(isCorrect ? CORRECT_SOUND : WRONG_SOUND);
}

function showVictoryMessage() {
    feedback.textContent = '🎉 恭喜你完成所有单词学习！你太棒了！🎉';
    feedback.style.color = '#2196F3';
    playSound(VICTORY_SOUND);
    
    // 隐藏下一个按钮，因为已经完成所有单词
    nextButton.style.display = 'none';
    
    // 禁用所有选项
    const options = document.querySelectorAll('.option');
    options.forEach(option => {
        option.disabled = true;
    });
    
    // 添加一个重新开始按钮
    const restartButton = document.createElement('button');
    restartButton.textContent = '重新开始';
    restartButton.className = 'next-button';
    restartButton.style.marginTop = '20px';
    restartButton.onclick = () => {
        currentWordIndex = 0;
        score = 0;
        scoreElement.textContent = score;
        loadWord();
        restartButton.remove();
    };
    feedback.parentNode.insertBefore(restartButton, feedback.nextSibling);
}

function updateScore(isCorrect) {
    if (isCorrect) {
        score += POINTS_PER_WORD;
        scoreElement.textContent = score;
        
        if (score >= WINNING_SCORE) {
            showVictoryMessage();
        }
        // 保存进度
        saveUserData();
    }
}

function handleOptionClick(event) {
    const selectedOption = event.target;
    const correctWord = words[currentWordIndex].word;
    const isCorrect = selectedOption.textContent === correctWord;

    // 禁用所有选项
    const options = document.querySelectorAll('.option');
    options.forEach(option => {
        option.disabled = true;
        if (option.textContent === correctWord) {
            option.classList.add('correct');
        } else if (option === selectedOption && !isCorrect) {
            option.classList.add('wrong');
        }
    });

    showFeedback(isCorrect);
    updateScore(isCorrect);
    
    // 只有在未达到胜利分数时才显示下一个按钮
    if (score < WINNING_SCORE) {
        nextButton.style.display = 'block';
    }
}

function loadWord() {
    const currentWord = words[currentWordIndex];
    
    // 重置界面
    feedback.textContent = '';
    nextButton.style.display = 'none';
    
    // 更新图片
    wordImage.src = currentWord.image;
    wordImage.alt = `图片: ${currentWord.word}`;
    
    // 打乱选项顺序
    const shuffledOptions = shuffleArray([...currentWord.options]);
    
    // 更新选项按钮
    const optionButtons = document.querySelectorAll('.option');
    optionButtons.forEach((button, index) => {
        button.textContent = shuffledOptions[index];
        button.className = 'option';
        button.disabled = false;
    });
}

function handleAudioPlay(e) {
    e.preventDefault(); // 阻止默认行为
    e.stopPropagation(); // 阻止事件冒泡
    playWordAudio();
}

// 移除旧的事件监听器
wordImage.removeEventListener('click', playWordAudio);
playAudio.removeEventListener('click', playWordAudio);

// 添加新的事件监听器
wordImage.addEventListener('click', handleAudioPlay);
playAudio.addEventListener('click', handleAudioPlay);

// 添加选项点击事件监听器
optionsContainer.addEventListener('click', (e) => {
    const option = e.target.closest('.option');
    if (option && !option.disabled) {
        handleOptionClick(e);
    }
});

function addTouchSupport() {
    // 只在必要时禁用默认行为
    document.addEventListener('touchmove', function(event) {
        if (event.touches.length > 1) {
            event.preventDefault();
        }
    }, { passive: false });

    // 禁用双指缩放
    document.addEventListener('gesturestart', function(event) {
        event.preventDefault();
    });

    // 为所有按钮添加触摸反馈
    const allButtons = document.querySelectorAll('button');
    allButtons.forEach(button => {
        button.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.95)';
        });

        button.addEventListener('touchend', function() {
            this.style.transform = 'scale(1)';
        });
    });

    // 为图片添加触摸反馈
    wordImage.addEventListener('touchstart', function(e) {
        this.style.transform = 'scale(0.98)';
        playWordAudio();
    });

    wordImage.addEventListener('touchend', function() {
        this.style.transform = 'scale(1)';
    });
}

nextButton.addEventListener('click', () => {
    if (currentWordIndex < TOTAL_WORDS - 1) {
        currentWordIndex++;
        loadWord();
        // 保存进度
        saveUserData();
    }
});

// 初始化
loadWord();
addTouchSupport();

// 添加视觉反馈的样式
const style = document.createElement('style');
style.textContent = `
    .option:active, .next-button:active {
        transform: scale(0.95);
    }
    
    .option.disabled {
        opacity: 0.7;
        pointer-events: none;
    }
    
    * {
        -webkit-tap-highlight-color: transparent;
        user-select: none;
        -webkit-user-select: none;
        -webkit-touch-callout: none;
    }

    .option {
        cursor: pointer;
        transition: transform 0.1s ease;
    }

    .option:not(.disabled):hover {
        transform: translateY(-2px);
    }
`;
document.head.appendChild(style);