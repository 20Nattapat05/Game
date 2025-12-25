let currentPlayer = 'X';
let board = ["", "", "", "", "", "", "", "", ""];
let gameActive = true;

let scoreX = 0;
let scoreO = 0;
let scoreDraw = 0;

const statusDisplay = document.getElementById('status');
const cells = document.querySelectorAll('.cell');

const scoreXEl = document.getElementById('scoreX');
const scoreOEl = document.getElementById('scoreO');
const scoreDrawEl = document.getElementById('scoreDraw');

const winningConditions = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
];

function checkWinner(player) {
  return winningConditions.some(cond => {
    const [a, b, c] = cond;
    return board[a] === player && board[b] === player && board[c] === player;
  });
}

function handleCellClick(e) {
  const cell = e.target;
  const index = cell.getAttribute('data-index');

  if (currentPlayer !== 'X') {
    return;
  }

  if (board[index] !== "" || !gameActive) {
    return;
  }

  makeMove(index, 'X');

  if (gameActive && currentPlayer === 'O') {
    setTimeout(aiMove, 400);
  }
}

function makeMove(index, player) {
  board[index] = player;

  const cell = document.querySelector(`.cell[data-index="${index}"]`);
  cell.textContent = player;

  if (player === 'X') {
    cell.classList.add('cell-x');
  } else {
    cell.classList.add('cell-o');
  }

  checkResult(player);
}

function checkResult(playerJustMoved) {
  if (checkWinner(playerJustMoved)) {
    statusDisplay.textContent = `ผู้เล่น ${playerJustMoved} ชนะ!`;
    gameActive = false;

    if (playerJustMoved === 'X') {
      scoreX++;
      scoreXEl.textContent = scoreX;
    } else {
      scoreO++;
      scoreOEl.textContent = scoreO;
    }
    return;
  }

  if (!board.includes("")) {
    statusDisplay.textContent = "เสมอ!";
    gameActive = false;
    scoreDraw++;
    scoreDrawEl.textContent = scoreDraw;
    return;
  }

  currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
  statusDisplay.textContent = `ถึงตาผู้เล่น: ${currentPlayer}`;
}

function aiMove() {
  if (!gameActive || currentPlayer !== 'O') return;

  const index = findBestMoveForO();
  if (index === null || index === undefined) return;

  makeMove(index, 'O');
}

function findBestMoveForO() {
  const emptyIndices = board
    .map((value, idx) => (value === "" ? idx : null))
    .filter(idx => idx !== null);

  if (emptyIndices.length === 0) return null;

  for (let i of emptyIndices) {
    board[i] = 'O';
    if (checkWinner('O')) {
      board[i] = "";
      return i;
    }
    board[i] = "";
  }

  for (let i of emptyIndices) {
    board[i] = 'X';
    if (checkWinner('X')) {
      board[i] = "";
      return i;
    }
    board[i] = "";
  }

  if (board[4] === "") {
    return 4;
  }

  const corners = [0, 2, 6, 8];
  const availableCorners = corners.filter(i => board[i] === "");
  if (availableCorners.length > 0) {
    return availableCorners[Math.floor(Math.random() * availableCorners.length)];
  }

  return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
}

function resetGame() {
  board = ["", "", "", "", "", "", "", "", ""];
  gameActive = true;
  currentPlayer = 'X';
  statusDisplay.textContent = `ถึงตาผู้เล่น: ${currentPlayer}`;

  cells.forEach(cell => {
    cell.textContent = "";
    cell.classList.remove('cell-x', 'cell-o', 'fw-bold');
  });
}

cells.forEach(cell => {
  cell.addEventListener('click', handleCellClick);
});

document.getElementById('resetBtn').addEventListener('click', resetGame);
