const gameState = {
    balance: 1000,
    startingBalance: 1000,
    currentNumber: null,
    nextNumber: null,
    prediction: null,
    betAmount: 10,
    multiplier: 0,
    profit: 0,
    gameActive: false,
    maxMultiplier: 1000000,
    history: [],
    gameStarted: false,
    totalWins: 0,
    totalLosses: 0,
    username: 'Player'
};

const leaderboardStorage = {
    getLeaderboard: function() {
        const data = localStorage.getItem('limbo_leaderboard');
        return data ? JSON.parse(data) : [];
    },
    
    saveLeaderboard: function(data) {
        localStorage.setItem('limbo_leaderboard', JSON.stringify(data));
    },
    
    updatePlayer: function(username, newBalance) {
        let leaderboard = this.getLeaderboard();
        const existing = leaderboard.find(p => p.name === username);
        
        if (existing) {
            existing.balance = Math.max(existing.balance, newBalance);
        } else {
            leaderboard.push({ name: username, balance: newBalance });
        }
        
        leaderboard.sort((a, b) => b.balance - a.balance);
        this.saveLeaderboard(leaderboard);
        return leaderboard;
    },
    
    getPlayerRank: function(username) {
        const leaderboard = this.getLeaderboard();
        const rank = leaderboard.findIndex(p => p.name === username) + 1;
        return rank || null;
    }
};

const elements = {
    balance: document.getElementById('balance'),
    multiplier: document.getElementById('multiplier'),
    profit: document.getElementById('profit'),
    currentNumber: document.getElementById('currentNumber'),
    betAmount: document.getElementById('betAmount'),
    username: document.getElementById('username'),
    userRank: document.getElementById('userRank'),
    btnHigher: document.getElementById('btnHigher'),
    btnLower: document.getElementById('btnLower'),
    btnPlay: document.getElementById('btnPlay'),
    btnCashout: document.getElementById('btnCashout'),
    btnReset: document.getElementById('btnReset'),
    btnSetBet: document.getElementById('btnSetBet'),
    gameResult: document.getElementById('gameResult'),
    resultText: document.getElementById('resultText'),
    historyList: document.getElementById('historyList'),
    leaderboard: document.getElementById('leaderboard'),
    leaderboardModal: document.getElementById('leaderboardModal'),
    leaderboardFull: document.getElementById('leaderboardFull'),
    shareModal: document.getElementById('shareModal'),
    closeLeaderboard: document.getElementById('closeLeaderboard'),
    closeShare: document.getElementById('closeShare'),
    shareText: document.getElementById('shareText'),
    btnShare: document.getElementById('btnShare')
};

function initGame() {
    let username = localStorage.getItem('limbo_username');
    if (!username) {
        username = 'Player_' + Math.floor(Math.random() * 10000);
        localStorage.setItem('limbo_username', username);
    }
    gameState.username = username;
    elements.username.textContent = username;

    const savedBalance = localStorage.getItem('limbo_balance_' + username);
    if (savedBalance) {
        gameState.balance = parseFloat(savedBalance);
        gameState.startingBalance = gameState.balance;
    }

    gameState.currentNumber = generateRandomNumber();
    updateDisplay();
    setupEventListeners();
    updateLeaderboard();
    updateUserRank();
}

function setupEventListeners() {
    elements.btnHigher.addEventListener('click', () => makePrediction('higher'));
    elements.btnLower.addEventListener('click', () => makePrediction('lower'));
    elements.btnPlay.addEventListener('click', playRound);
    elements.btnCashout.addEventListener('click', cashOut);
    elements.btnReset.addEventListener('click', resetGame);
    elements.btnSetBet.addEventListener('click', setCustomBet);
    
    document.querySelectorAll('.bet-preset').forEach(btn => {
        btn.addEventListener('click', () => {
            const amount = btn.dataset.amount;
            elements.betAmount.value = amount;
            gameState.betAmount = parseFloat(amount);
            updateBetPresetUI(btn);
        });
    });

    elements.betAmount.addEventListener('change', () => {
        gameState.betAmount = parseFloat(elements.betAmount.value) || 10;
        if (gameState.betAmount > gameState.balance) {
            gameState.betAmount = gameState.balance;
            elements.betAmount.value = gameState.balance;
        }
        updateBetPresetUI(null);
    });

    elements.closeLeaderboard.addEventListener('click', () => {
        elements.leaderboardModal.classList.remove('active');
    });

    elements.closeShare.addEventListener('click', () => {
        elements.shareModal.classList.remove('active');
    });

    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('view-full-leaderboard')) {
            showFullLeaderboard();
        }
    });

    elements.btnShare.addEventListener('click', shareWin);

    elements.leaderboardModal.addEventListener('click', (e) => {
        if (e.target === elements.leaderboardModal) {
            elements.leaderboardModal.classList.remove('active');
        }
    });

    elements.shareModal.addEventListener('click', (e) => {
        if (e.target === elements.shareModal) {
            elements.shareModal.classList.remove('active');
        }
    });
}

function setCustomBet() {
    gameState.betAmount = parseFloat(elements.betAmount.value) || 10;
    if (gameState.betAmount > gameState.balance) {
        alert('Insufficient balance! Max: $' + gameState.balance.toFixed(2));
        gameState.betAmount = gameState.balance;
        elements.betAmount.value = gameState.balance;
    }
    updateBetPresetUI(null);
}

function updateBetPresetUI(activeBtn) {
    document.querySelectorAll('.bet-preset').forEach(btn => {
        btn.classList.remove('active');
        if (activeBtn && btn === activeBtn) {
            btn.classList.add('active');
        }
    });
}

function generateRandomNumber() {
    return parseFloat((Math.random() * 100).toFixed(2));
}

function makePrediction(direction) {
    if (!gameState.gameActive || gameState.prediction) return;
    
    gameState.prediction = direction;
    
    elements.btnHigher.disabled = true;
    elements.btnLower.disabled = true;
    
    if (direction === 'higher') {
        elements.btnHigher.style.opacity = '1';
        elements.btnLower.style.opacity = '0.5';
    } else {
        elements.btnLower.style.opacity = '1';
        elements.btnHigher.style.opacity = '0.5';
    }
}

function playRound() {
    if (gameState.gameActive && !gameState.prediction) {
        alert('Please make a prediction first!');
        return;
    }

    if (!gameState.gameActive) {
        if (gameState.betAmount > gameState.balance) {
            alert('Insufficient balance!');
            return;
        }

        gameState.gameActive = true;
        gameState.gameStarted = true;
        gameState.betAmount = parseFloat(elements.betAmount.value) || 10;
        gameState.currentNumber = generateRandomNumber();
        gameState.multiplier = 1.0;
        gameState.profit = 0;
        gameState.prediction = null;

        elements.btnPlay.textContent = 'NEXT ROUND';
        elements.btnCashout.disabled = false;
        elements.btnHigher.disabled = false;
        elements.btnLower.disabled = false;
        elements.btnHigher.style.opacity = '1';
        elements.btnLower.style.opacity = '1';
        
        hideResult();
        updateDisplay();
    } else if (gameState.prediction) {
        gameState.nextNumber = generateRandomNumber();
        
        const correct = checkPrediction();
        
        if (correct) {
            gameState.multiplier *= 1.1;
            if (gameState.multiplier > gameState.maxMultiplier) {
                gameState.multiplier = gameState.maxMultiplier;
            }
            gameState.profit = (gameState.betAmount * gameState.multiplier) - gameState.betAmount;
            showResult(true, `✓ CORRECT! Next: ${gameState.nextNumber.toFixed(2)}`);
        } else {
            gameState.balance -= gameState.betAmount;
            gameState.totalLosses++;
            gameState.gameActive = false;
            showResult(false, `✗ WRONG! Next was: ${gameState.nextNumber.toFixed(2)}`);
            setTimeout(() => {
                endGame(false);
            }, 2000);
        }

        gameState.history.unshift({
            number: gameState.currentNumber,
            nextNumber: gameState.nextNumber,
            prediction: gameState.prediction,
            correct: correct
        });

        gameState.currentNumber = gameState.nextNumber;
        gameState.prediction = null;

        elements.btnHigher.disabled = false;
        elements.btnLower.disabled = false;
        elements.btnHigher.style.opacity = '1';
        elements.btnLower.style.opacity = '1';

        updateDisplay();
    }
}

function checkPrediction() {
    if (gameState.prediction === 'higher') {
        return gameState.nextNumber > gameState.currentNumber;
    } else {
        return gameState.nextNumber < gameState.currentNumber;
    }
}

function cashOut() {
    if (!gameState.gameActive || gameState.multiplier === 0) {
        alert('No active game to cash out!');
        return;
    }

    const winnings = gameState.betAmount * gameState.multiplier;
    gameState.balance += winnings;
    gameState.totalWins++;
    gameState.history.unshift({
        number: gameState.currentNumber,
        multiplier: gameState.multiplier,
        winnings: winnings,
        cashed: true
    });

    showResult(true, `CASHED OUT! Won: $${winnings.toFixed(2)} (${gameState.multiplier.toFixed(2)}x)`);
    
    leaderboardStorage.updatePlayer(gameState.username, gameState.balance);
    updateUserRank();

    setTimeout(() => {
        elements.shareText.textContent = `I just won $${winnings.toFixed(2)} with a ${gameState.multiplier.toFixed(2)}x multiplier on Limbo! Can you beat my score?`;
        elements.shareModal.classList.add('active');
        endGame(true);
    }, 2000);
}

function endGame(won) {
    gameState.gameActive = false;
    gameState.multiplier = 0;
    gameState.profit = 0;
    gameState.gameStarted = false;
    elements.btnPlay.textContent = 'PLAY';
    elements.btnCashout.disabled = true;
    elements.btnHigher.disabled = true;
    elements.btnLower.disabled = true;
    elements.btnHigher.style.opacity = '1';
    elements.btnLower.style.opacity = '1';

    localStorage.setItem('limbo_balance_' + gameState.username, gameState.balance);

    updateDisplay();
    updateHistory();
    updateLeaderboard();
}

function showResult(win, message) {
    elements.gameResult.style.display = 'block';
    elements.gameResult.className = `game-result ${win ? 'win' : 'lose'}`;
    elements.resultText.textContent = message;
}

function hideResult() {
    elements.gameResult.style.display = 'none';
}

function resetGame() {
    if (confirm('Are you sure you want to reset your balance to $1,000?')) {
        gameState.balance = 1000;
        gameState.startingBalance = 1000;
        gameState.currentNumber = generateRandomNumber();
        gameState.nextNumber = null;
        gameState.prediction = null;
        gameState.betAmount = 10;
        gameState.multiplier = 0;
        gameState.profit = 0;
        gameState.gameActive = false;
        gameState.gameStarted = false;
        gameState.history = [];
        gameState.totalWins = 0;
        gameState.totalLosses = 0;
        
        elements.betAmount.value = 10;
        elements.btnPlay.textContent = 'PLAY';
        elements.btnCashout.disabled = true;
        elements.btnHigher.disabled = true;
        elements.btnLower.disabled = true;
        
        localStorage.setItem('limbo_balance_' + gameState.username, gameState.balance);
        
        hideResult();
        updateDisplay();
        updateHistory();
        updateLeaderboard();
    }
}

function updateDisplay() {
    elements.balance.textContent = `$${gameState.balance.toFixed(2)}`;
    
    if (gameState.gameStarted) {
        elements.currentNumber.textContent = gameState.currentNumber.toFixed(2);
    } else {
        elements.currentNumber.textContent = '--';
    }
    
    if (gameState.multiplier > 0) {
        elements.multiplier.textContent = `${gameState.multiplier.toFixed(2)}x`;
        elements.multiplier.style.color = gameState.multiplier >= gameState.maxMultiplier ? '#ffc700' : '#e94560';
    } else {
        elements.multiplier.textContent = '0.00x';
        elements.multiplier.style.color = '#e94560';
    }
    
    if (gameState.profit > 0) {
        elements.profit.textContent = `$${gameState.profit.toFixed(2)}`;
        elements.profit.style.color = '#00d4ff';
    } else {
        elements.profit.textContent = '$0.00';
        elements.profit.style.color = '#eaeaea';
    }

    if (!gameState.gameActive) {
        elements.btnHigher.disabled = true;
        elements.btnLower.disabled = true;
    }
}

function updateHistory() {
    if (gameState.history.length === 0) {
        elements.historyList.innerHTML = '<p class="empty">No results yet</p>';
        return;
    }

    elements.historyList.innerHTML = gameState.history.slice(0, 20).map((item, index) => {
        const isWin = item.correct || item.cashed;
        return `
            <div class="history-item ${isWin ? 'win' : 'lose'}">
                <div class="history-number">${item.cashed ? '💰' : (item.correct ? '✓' : '✗')}</div>
                <div class="history-text">${item.number.toFixed(1)}</div>
            </div>
        `;
    }).join('');
}

function updateLeaderboard() {
    const leaderboard = leaderboardStorage.getLeaderboard().slice(0, 5);
    
    elements.leaderboard.innerHTML = leaderboard.map((player, index) => {
        const rankClass = index === 0 ? 'top-1' : index === 1 ? 'top-2' : index === 2 ? 'top-3' : 'other';
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
        
        return `
            <div class="leaderboard-item ${rankClass}">
                <div class="rank-position">${medal}</div>
                <div class="leaderboard-info">
                    <div class="leaderboard-name">${player.name}</div>
                    <div class="leaderboard-balance">$${player.balance.toFixed(2)}</div>
                </div>
            </div>
        `;
    }).join('');

    elements.leaderboard.innerHTML += `
        <button class="view-full-leaderboard">View Full Leaderboard →</button>
    `;
}

function showFullLeaderboard() {
    const leaderboard = leaderboardStorage.getLeaderboard();
    
    elements.leaderboardFull.innerHTML = leaderboard.map((player, index) => {
        const rankClass = index === 0 ? 'top-1' : index === 1 ? 'top-2' : index === 2 ? 'top-3' : 'other';
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
        
        return `
            <div class="leaderboard-item-full ${rankClass}">
                <div class="rank-position-full">${medal}</div>
                <div class="leaderboard-info-full">
                    <div class="leaderboard-name-full">${player.name}</div>
                    <div class="leaderboard-balance-full">$${player.balance.toFixed(2)}</div>
                </div>
            </div>
        `;
    }).join('');

    elements.leaderboardModal.classList.add('active');
}

function updateUserRank() {
    const rank = leaderboardStorage.getPlayerRank(gameState.username);
    if (rank) {
        elements.userRank.textContent = `Rank: #${rank}`;
    } else {
        elements.userRank.textContent = 'Rank: --';
    }
}

function shareWin() {
    const text = elements.shareText.textContent;
    
    navigator.clipboard.writeText(text).then(() => {
        alert('Copied to clipboard! Share it with your friends.');
    }).catch(() => {
        alert('Share this: ' + text);
    });

    elements.shareModal.classList.remove('active');
}

document.addEventListener('DOMContentLoaded', initGame);