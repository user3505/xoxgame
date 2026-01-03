
const ABLY_KEY = 'nFNW9g.YVm8nA:YenZEZBS47RTDbPGVM58Hrt8v1mRzk6zT-DkzLQHszo'; // Kendi Key'ini buraya yaz
let ably, channel, mySymbol;
let boardState = Array(9).fill(null);
let myTurn = false;
let gameActive = true;
let scores = { X: 0, O: 0 };

async function initGame(mode) {
    const code = document.getElementById('roomCode').value;
    if (!code) return alert("Lütfen bir oda kodu belirleyin!");

    ably = new Ably.Realtime(ABLY_KEY);
    channel = ably.channels.get('room-' + code);

    // Rol Belirleme
    if (mode === 'create') {
        mySymbol = 'X';
        myTurn = true;
    } else {
        mySymbol = 'O';
        myTurn = false;
    }

    document.getElementById('myRole').innerText = mySymbol;
    document.getElementById('displayCode').innerText = code;
    document.getElementById('setup').style.display = 'none';
    document.getElementById('game').style.display = 'block';

    updateStatus();

    // Dinleyiciler
    channel.subscribe('move', (msg) => {
        if (msg.data.symbol !== mySymbol) applyMove(msg.data.index, msg.data.symbol);
    });

    channel.subscribe('reset', () => resetBoard());
}

function makeMove(index) {
    if (!gameActive || !myTurn || boardState[index]) return;

    applyMove(index, mySymbol);
    channel.publish('move', { index, symbol: mySymbol });
    myTurn = false;
    updateStatus();
}

function applyMove(index, symbol) {
    boardState[index] = symbol;
    const cells = document.querySelectorAll('.cell');
    cells[index].innerText = symbol;
    cells[index].classList.add(symbol);
    
    checkWinner();
    if (gameActive && symbol !== mySymbol) {
        myTurn = true;
        updateStatus();
    }
}

function checkWinner() {
    const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (let combo of wins) {
        const [a, b, c] = combo;
        if (boardState[a] && boardState[a] === boardState[b] && boardState[a] === boardState[c]) {
            return endGame(boardState[a]);
        }
    }
    if (!boardState.includes(null)) endGame('draw');
}

function endGame(result) {
    gameActive = false;
    const status = document.getElementById('status');
    if (result === 'draw') {
        status.innerText = "Berabere!";
    } else {
        status.innerText = `KAZANAN: ${result}`;
        scores[result]++;
        document.getElementById(`score${result}`).innerText = scores[result];
    }
    document.getElementById('resetBtn').style.display = "block";
}

function sendReset() { channel.publish('reset', {}); }

function resetBoard() {
    boardState = Array(9).fill(null);
    gameActive = true;
    myTurn = (mySymbol === 'X');
    document.querySelectorAll('.cell').forEach(c => { c.innerText = ""; c.className = "cell"; });
    document.getElementById('resetBtn').style.display = "none";
    updateStatus();
}

function updateStatus() {
    if (!gameActive) return;
    document.getElementById('status').innerText = myTurn ? "Sıra Sende!" : "Rakip Bekleniyor...";
}
