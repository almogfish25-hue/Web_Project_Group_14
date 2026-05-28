/* =========================================
   game.js — Game Page
   Team 14: Eyal Rotshtain & Almog Fishman
   ========================================= */


/* =========================================
   STATE
   ========================================= */

let players           = [];
let currentPlayerName = '';
let roomCode          = '';
let eliminationLog    = [];   // Tracks the order groups were eliminated (for scoring)


/* =========================================
   INIT — runs when the page loads
   ========================================= */

window.addEventListener('DOMContentLoaded', function() {

    // Guard: if the player skipped the join page, send them back
    if (!localStorage.getItem('playerName')) {
        window.location.href = 'index.html';
        return;
    }

    currentPlayerName = localStorage.getItem('playerName');
    roomCode          = localStorage.getItem('roomCode') || '1111';

    document.getElementById('game-room-code').textContent = roomCode;

    // Load players — fall back to demo data if nothing in storage
    const stored = localStorage.getItem('players');
    players = stored ? JSON.parse(stored) : getDemoPlayers();

    startCountdown();
});


/* =========================================
   DEMO DATA (fallback if opened directly)
   ========================================= */

function getDemoPlayers() {
    return [
        { name: 'Almog Fishman', celebrity: 'Katy Perry',      score: 0, colorIndex: 1, owner: 'Almog Fishman' },
        { name: 'Chen Epstein',     celebrity: 'Madonna',           score: 0, colorIndex: 2, owner: 'Chen Epstein '     },
        { name: 'Hadar Ben Ami',  celebrity: 'Michael Jordan',    score: 0, colorIndex: 3, owner: 'Hadar Ben Ami'  },
        { name: 'Yael Elazari',  celebrity: 'Lady Gaga',         score: 0, colorIndex: 4, owner: 'Yael Elazari'  },
        { name: 'Avi Aizman',     celebrity: 'Elon Musk',         score: 0, colorIndex: 5, owner: 'Avi Aizman'     },
        { name: 'Iztick Gurevich',  celebrity: 'Cristiano Ronaldo', score: 0, colorIndex: 6, owner: 'Iztick Gurevich'  }
    ];
}


/* =========================================
   PHASE MANAGER
   ========================================= */

/* Hide all phases and show only the requested one */
function showPhase(phaseId) {
    document.querySelectorAll('.game-phase').forEach(function(phase) {
        phase.classList.add('hidden');
    });
    document.getElementById(phaseId).classList.remove('hidden');
}


/* =========================================
   PHASE 1 — COUNTDOWN
   ========================================= */

function startCountdown() {
    showPhase('phase-countdown');

    let count  = 3;
    const el   = document.getElementById('countdown-number');

    el.textContent = count;

    const interval = setInterval(function() {
        count--;

        if (count > 0) {
            el.textContent = count;

            // Re-trigger the CSS animation for each new number
            el.style.animation = 'none';
            void el.offsetWidth;   // Force browser reflow
            el.style.animation = 'countdownPop 0.8s ease forwards';

        } else {
            clearInterval(interval);
            showCelebrityReveal();
        }

    }, 1000);
}


/* =========================================
   PHASE 2 — CELEBRITY REVEAL (3 seconds)
   ========================================= */

function showCelebrityReveal() {
    showPhase('phase-reveal');

    // Collect all celebrities and shuffle them randomly
    const celebrities = players
        .map(function(p) { return p.celebrity; })
        .filter(function(c) { return c && c.trim() !== ''; })
        .sort(function() { return Math.random() - 0.5; });

    // Render the list
    const list = document.getElementById('celebrity-reveal-list');
    list.innerHTML = '';

    celebrities.forEach(function(name) {
        const li = document.createElement('li');
        li.textContent = name;
        list.appendChild(li);
    });

    // Countdown timer display (3 → 2 → 1)
    let seconds  = 3;
    const timerEl = document.getElementById('reveal-timer');
    timerEl.textContent = seconds;

    const interval = setInterval(function() {
        seconds--;
        timerEl.textContent = seconds;

        if (seconds <= 0) {
            clearInterval(interval);
            showGameBoard();
        }
    }, 1000);
}


/* =========================================
   PHASE 3 — GAME BOARD
   ========================================= */

function showGameBoard() {
    showPhase('phase-game');
    renderPlayerBoard();
}

/* Build all player cards and attach click listeners */
function renderPlayerBoard() {
    const board = document.getElementById('player-board');
    board.innerHTML = '';

    players.forEach(function(player) {
        const card = document.createElement('div');
        card.className = 'player-card color-' + player.colorIndex;
        card.id        = 'card-' + sanitizeName(player.name);
        card.dataset.player = player.name;

        // Mark the current player's own card (can't capture yourself)
        const isMe = (player.name === currentPlayerName);

        card.innerHTML =
            '<div class="card-header">' +
                '<span class="card-name">' + player.name + '</span>' +
                (isMe ? '<span class="you-badge">You</span>' : '') +
            '</div>' +
            '<div class="card-score">Score: <span class="score-value">' + player.score + '</span></div>' +
            '<ul class="prisoners-list" id="prisoners-' + sanitizeName(player.name) + '"></ul>';

        // Attach capture listener — but NOT on your own card
        if (!isMe) {
            card.addEventListener('click', function() {
                capturePlayer(player.name);
            });
        } else {
            card.style.cursor = 'default';
            card.title = 'This is you!';
        }

        board.appendChild(card);
    });

    updatePrisonersDisplay();
}

/* Convert "John Doe" → "john-doe" (safe for element IDs) */
function sanitizeName(name) {
    return name.toLowerCase().replace(/\s+/g, '-');
}

/* Update each card's prisoners sub-list */
function updatePrisonersDisplay() {
    // First clear all prisoners lists
    document.querySelectorAll('.prisoners-list').forEach(function(ul) {
        ul.innerHTML = '';
    });

    // For each player, find who they own (excluding themselves)
    players.forEach(function(owner) {
        const listEl = document.getElementById('prisoners-' + sanitizeName(owner.name));
        if (!listEl) return;

        players.forEach(function(captive) {
            if (captive.owner === owner.name && captive.name !== owner.name) {
                const li = document.createElement('li');
                li.textContent = '↳ ' + captive.name;
                listEl.appendChild(li);
            }
        });
    });
}


/* =========================================
   CAPTURE LOGIC
   ========================================= */

function capturePlayer(targetName) {
    // Find the attacker (current player) and the target
    const attacker = players.find(function(p) { return p.name === currentPlayerName; });
    const target   = players.find(function(p) { return p.name === targetName; });

    if (!attacker || !target) return;

    // Can't capture someone already in your group
    if (target.owner === attacker.name) {
        alert(targetName + ' is already in your group!');
        return;
    }

    const previousGroupOwner = target.owner;

    // Record the eliminated group for scoring
    eliminationLog.push(previousGroupOwner);

    // Transfer the target AND everyone in their group to the attacker's color
    players.forEach(function(player) {
        if (player.owner === previousGroupOwner) {
            player.owner      = attacker.name;
            player.colorIndex = attacker.colorIndex;
        }
    });

    // Re-render the board with new colors
    renderPlayerBoard();

    // Check if someone has won
    checkWinCondition();
}


/* =========================================
   WIN CONDITION CHECK
   ========================================= */

function checkWinCondition() {
    // Get all unique group owners currently active
    const activeOwners = new Set(players.map(function(p) { return p.owner; }));

    if (activeOwners.size === 1) {
        // Short delay so the player sees the final board state before the modal
        setTimeout(endGame, 900);
    }
}


/* =========================================
   PHASE 4 — END GAME + SCORING
   ========================================= */

function endGame() {
    calculateScores();
    renderScoreTable();
    showPhase('phase-end');
}

function calculateScores() {
    // Winner = the player who owns everyone
    const winnerName = players[0].owner;  // All owners are the same at this point

    // Determine 2nd and 3rd from elimination log (last eliminated = 2nd place)
    const secondName = eliminationLog.length >= 1 ? eliminationLog[eliminationLog.length - 1] : null;
    const thirdName  = eliminationLog.length >= 2 ? eliminationLog[eliminationLog.length - 2] : null;

    // Award points
    players.forEach(function(player) {
        if (player.name === winnerName) {
            player.score += 5;
        } else if (player.name === secondName) {
            player.score += 2;
        } else if (player.name === thirdName) {
            player.score += 1;
        }
    });

    // Save updated scores to localStorage
    localStorage.setItem('players', JSON.stringify(players));

    // Display winner name in the modal
    document.getElementById('winner-name').textContent = winnerName;
}

function renderScoreTable() {
    // Sort players by total score descending for the table
    const sorted = [...players].sort(function(a, b) { return b.score - a.score; });

    const tbody = document.getElementById('score-table-body');
    tbody.innerHTML = '';

    const medals = ['🥇', '🥈', '🥉'];

    sorted.forEach(function(player, index) {
        const place = medals[index] || (index + 1) + 'th';
        const tr = document.createElement('tr');

        // Highlight the winner row
        if (index === 0) tr.classList.add('winner-row');

        tr.innerHTML =
            '<td>' + place + '</td>' +
            '<td>' + player.name + '</td>' +
            '<td>' + getPointsEarned(player.name, sorted[0].name) + '</td>' +
            '<td><strong>' + player.score + '</strong></td>';

        tbody.appendChild(tr);
    });
}

/* Returns the points label earned this round */
function getPointsEarned(playerName, winnerName) {
    const secondName = eliminationLog.length >= 1 ? eliminationLog[eliminationLog.length - 1] : null;
    const thirdName  = eliminationLog.length >= 2 ? eliminationLog[eliminationLog.length - 2] : null;

    if (playerName === winnerName) return '+5 🏆';
    if (playerName === secondName) return '+2';
    if (playerName === thirdName)  return '+1';
    return '+0';
}


/* =========================================
   END GAME BUTTONS — EVENT LISTENERS
   ========================================= */

/* Play Again → reset celebrities + owners, keep scores, go back to lobby */
document.getElementById('btn-play-again').addEventListener('click', function() {

    players.forEach(function(player) {
        player.celebrity  = '';
        player.owner      = player.name;
        // colorIndex will be reassigned in lobby.js on next round start
    });

    eliminationLog = [];

    localStorage.setItem('players', JSON.stringify(players));
    window.location.href = 'lobby.html';
});

/* End Game → clear all data and return to home */
document.getElementById('btn-end-game').addEventListener('click', function() {
    localStorage.clear();
    window.location.href = 'index.html';
});
