/* =========================================
   index.js — Join Room Page
   Team 14: Eyal Rotshtain & Almog Fishman
   ========================================= */


/* =========================================
   HELPER FUNCTIONS
   ========================================= */

/* Show an error message below an input field */
function showError(inputId, message) {
    const input = document.getElementById(inputId);
    input.classList.add('input-error');

    // Create error element if it doesn't exist yet
    let errorEl = document.getElementById(inputId + '-error');
    if (!errorEl) {
        errorEl = document.createElement('span');
        errorEl.id = inputId + '-error';
        errorEl.className = 'error-msg';
        input.parentNode.appendChild(errorEl);
    }

    errorEl.textContent = message;
}

/* Remove all error messages from the form */
function clearErrors() {
    document.querySelectorAll('.input-error').forEach(function(el) {
        el.classList.remove('input-error');
    });
    document.querySelectorAll('.error-msg').forEach(function(el) {
        el.remove();
    });
}


/* =========================================
   FORM VALIDATION + SUBMIT
   ========================================= */

document.getElementById('join-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const playerName = document.getElementById('player-name').value.trim();
    const roomCode   = document.getElementById('room-code').value.trim();

    clearErrors();

    let isValid = true;

    /* --- Validate: Player Name --- */
    if (!playerName) {
        showError('player-name', 'Please enter your name.');
        isValid = false;
    } else if (playerName.length < 2) {
        showError('player-name', 'Name must be at least 2 characters long.');
        isValid = false;
    } else if (!/^[֐-׿a-zA-Z\s]+$/.test(playerName)) {
        showError('player-name', 'Name must contain letters only — English or Hebrew (no numbers or symbols).');
        isValid = false;
    }

    /* --- Validate: Room Code --- */
    if (!roomCode) {
        showError('room-code', 'Please enter a room code.');
        isValid = false;
    } else if (!/^\d+$/.test(roomCode)) {
        showError('room-code', 'Room code must contain numbers only.');
        isValid = false;
    }

    /* --- If valid: save to localStorage and go to lobby --- */
    if (isValid) {
        localStorage.setItem('playerName', playerName);
        localStorage.setItem('roomCode', roomCode);

        // Clear any leftover game data from a previous session
        localStorage.removeItem('players');
        localStorage.removeItem('celebrities');

        window.location.href = 'lobby.html';
    }
});
