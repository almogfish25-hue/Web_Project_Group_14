/* =========================================
   lobby.js — Lobby Page
   Team 14: Eyal Rotshtain & Almog Fishman
   ========================================= */


/* =========================================
   STATE
   ========================================= */

let currentPlayerName = '';
let roomCode          = '';
let players           = [];          // Array of player objects
let celebritySubmitted = false;      // Has the current player submitted their celebrity?


/* =========================================
   INIT — runs when the page loads
   ========================================= */

window.addEventListener('DOMContentLoaded', function() {

    // Guard: if the player skipped the join page, send them back
    if (!localStorage.getItem('playerName')) {
        window.location.href = 'index.html';
        return;
    }

    // Read data saved by index.js
    currentPlayerName = localStorage.getItem('playerName');
    roomCode          = localStorage.getItem('roomCode') || '1111';

    // Display them on the page
    document.getElementById('display-player-name').textContent = currentPlayerName;
    document.getElementById('display-room-code').textContent   = roomCode;

    // Load existing players array (or start fresh)
    const stored = localStorage.getItem('players');
    players = stored ? JSON.parse(stored) : [];

    // Re-fill celebrities for demo players after "Play Again"
    var demoCelebrities = {
        'Noa Cohen':    'Madonna',
        'Lior Ben Ami': 'Michael Jordan',
        'Yael Shapira': 'Lady Gaga',
        'Omer Levi':    'Elon Musk',
        'Dana Mizrahi': 'Cristiano Ronaldo'
    };
    players.forEach(function(p) {
        if (p.name !== currentPlayerName && p.celebrity === '' && demoCelebrities[p.name]) {
            p.celebrity = demoCelebrities[p.name];
        }
    });
    savePlayersToStorage();

    // Add the current player if not already in the list
    const alreadyIn = players.some(function(p) { return p.name === currentPlayerName; });
    if (!alreadyIn) {
        players.push({
            name:       currentPlayerName,
            celebrity:  '',
            score:      0,
            colorIndex: players.length + 1,   // Assign next available color
            owner:      currentPlayerName      // Each player starts as their own group
        });
        savePlayersToStorage();
    }

    // Add 5 test players (pre-filled celebrities) so you can test the full game flow
    // They only appear if no extra players have been added yet
    if (players.length === 1) {
        var testPlayers = [
           { name: 'Almog Fishman', celebrity: 'Katy Perry',      score: 0, colorIndex: 1, owner: 'Almog Fishman' },
        { name: 'Chen Epstein',     celebrity: 'Madonna',           score: 0, colorIndex: 2, owner: 'Chen Epstein '     },
        { name: 'Hadar Ben Ami',  celebrity: 'Michael Jordan',    score: 0, colorIndex: 3, owner: 'Hadar Ben Ami'  },
        { name: 'Yael Elazari',  celebrity: 'Lady Gaga',         score: 0, colorIndex: 4, owner: 'Yael Elazari'  },
        { name: 'Avi Aizman',     celebrity: 'Elon Musk',         score: 0, colorIndex: 5, owner: 'Avi Aizman'     },
        { name: 'Iztick Gurevich',  celebrity: 'Cristiano Ronaldo', score: 0, colorIndex: 6, owner: 'Iztick Gurevich'  }
        ];
        testPlayers.forEach(function(p) { players.push(p); });
        savePlayersToStorage();
    }

    renderPlayersList();
    updateStartButton();
});


/* =========================================
   HELPER FUNCTIONS
   ========================================= */

/* Save players array to localStorage */
function savePlayersToStorage() {
    localStorage.setItem('players', JSON.stringify(players));
}

/* Show an error message below an input field */
function showError(inputId, message) {
    const input = document.getElementById(inputId);
    input.classList.add('input-error');

    let errorEl = document.getElementById(inputId + '-error');
    if (!errorEl) {
        errorEl = document.createElement('span');
        errorEl.id = inputId + '-error';
        errorEl.className = 'error-msg';
        input.parentNode.appendChild(errorEl);
    }
    errorEl.textContent = message;
}

/* Clear all error messages */
function clearErrors() {
    document.querySelectorAll('.input-error').forEach(function(el) {
        el.classList.remove('input-error');
    });
    document.querySelectorAll('.error-msg').forEach(function(el) {
        el.remove();
    });
}

/* Render the waiting players list */
function renderPlayersList() {
    const list      = document.getElementById('players-list');
    const countEl   = document.getElementById('count-number');

    list.innerHTML  = '';
    countEl.textContent = players.length;

    players.forEach(function(player) {
        const isReady = player.celebrity !== '';

        const li = document.createElement('li');
        li.className = 'player-item ' + (isReady ? 'ready' : 'waiting');
        li.innerHTML =
            '<span class="player-status-icon">' + (isReady ? '✅' : '⏳') + '</span>' +
            '<span class="player-item-name">'   + player.name + '</span>' +
            '<span class="player-badge">'        + (isReady ? 'Ready' : 'Waiting') + '</span>';

        list.appendChild(li);
    });
}

/* Enable or disable the Start button depending on whether current player submitted */
function updateStartButton() {
    const btn = document.getElementById('start-game-btn');

    if (celebritySubmitted) {
        btn.disabled = false;
        btn.classList.add('pulse');      // Start the pulsing animation from CSS
    } else {
        btn.disabled = true;
        btn.classList.remove('pulse');
    }
}


/* =========================================
   CELEBRITY FORM — SUBMIT EVENT
   ========================================= */

document.getElementById('celebrity-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const nameInput    = document.getElementById('celebrity-name');
    const celebrityVal = nameInput.value.trim();

    clearErrors();

    let isValid = true;

    /* --- Validate: not empty --- */
    if (!celebrityVal) {
        showError('celebrity-name', 'Please enter a famous person\'s name.');
        isValid = false;
    }
    /* --- Validate: not a name already used this round --- */
    else {
        const alreadyUsed = players.some(function(p) {
            return p.celebrity.toLowerCase() === celebrityVal.toLowerCase();
        });
        if (alreadyUsed) {
            showError('celebrity-name', 'This name was already chosen by another player. Pick a different one!');
            isValid = false;
        }
    }

    if (!isValid) return;

    /* --- Save the celebrity to the current player's entry --- */
    const myPlayer = players.find(function(p) { return p.name === currentPlayerName; });
    if (myPlayer) {
        myPlayer.celebrity = celebrityVal;
        savePlayersToStorage();
    }

    /* --- Update UI --- */
    nameInput.disabled = true;                          // Lock the field
    document.querySelector('#celebrity-form .btn-primary').disabled = true;

    document.getElementById('celebrity-confirmed').classList.remove('hidden');

    celebritySubmitted = true;

    renderPlayersList();
    updateStartButton();
});


/* =========================================
   START GAME BUTTON — CLICK EVENT
   ========================================= */

document.getElementById('start-game-btn').addEventListener('click', function() {

    // Make sure current player has submitted a celebrity
    if (!celebritySubmitted) return;

    // Reset owner and colorIndex for a fresh round (scores are kept)
    players.forEach(function(player, index) {
        player.owner      = player.name;
        player.colorIndex = index + 1;
    });
    savePlayersToStorage();

    window.location.href = 'game.html';
});
