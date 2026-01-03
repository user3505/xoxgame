const API_KEY = 'BURAYA_ABLY_API_KEY_GELECEK'; // Ably'den aldığın anahtarı buraya yapıştır.
let ably, channel, mySymbol;
let boardState = Array(9).fill(null);
let myTurn = false;

async function joinRoom() {
    const code = document.getElementById('roomCode').value;
    if (!code) return alert("Kod girin!");

    ably = new Ably.Realtime(API_KEY);
    channel = ably.channels.get('room-' + code);

    document.getElementById('setup').style.display = 'none';
    document.getElementById('game').style.display = 'block';
    document.getElementById('displayCode').innerText = code;

    // Odaya ilk giren X, ikinci giren O olur
    channel.presence.get((err, members) => {
        mySymbol = members.length === 0 ? 'X' : 'O';
        myTurn = (mySymbol === 'X');
        updateStatus();
    });
    channel.presence.enter();

    // Gelen hamleleri dinle
    channel.subscribe('move', (message) => {
        const { index, symbol } = message.data;
        if (symbol !== mySymbol) {
            boardState[index] = symbol;
            renderBoard();
            myTurn = true;
            updateStatus();
        }
    });
}

function makeMove(index) {
    if (!myTurn || boardState[index]) return;

    boardState[index] = mySymbol;
    renderBoard();
    channel.publish('move', { index, symbol: mySymbol });
    myTurn = false;
    updateStatus();
}

function renderBoard() {
    const cells = document.querySelectorAll('.cell');
    boardState.forEach((val, i) => cells[i].innerText = val || '');
}

function updateStatus() {
    document.getElementById('status').innerText = myTurn ? "Senin Sıran (" + mySymbol + ")" : "Rakip Bekleniyor...";
}
