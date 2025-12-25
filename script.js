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

  // ให้ X เป็นผู้เล่นคนจริง ส่วน O เป็นบอท
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

// ใช้ Minimax เพื่อให้ O เล่นโหดสุด ๆ
function findBestMoveForO() {
  let bestScore = -Infinity;
  let bestMove = null;

  for (let i = 0; i < board.length; i++) {
    if (board[i] === "") {
      board[i] = 'O';
      const score = minimax(board, 0, false); // ตาต่อไปเป็นของ X
      board[i] = "";

      if (score > bestScore) {
        bestScore = score;
        bestMove = i;
      }
    }
  }

  return bestMove;
}

function minimax(boardState, depth, isMaximizing) {
  if (isWinner(boardState, 'O')) {
    return 10 - depth; // ชนะเร็ว ดีกว่า
  }
  if (isWinner(boardState, 'X')) {
    return -10 + depth; // แพ้ช้า ดีกว่าแพ้เร็วหน่อยนึง
  }
  if (!boardState.includes("")) {
    return 0; // เสมอ
  }

  if (isMaximizing) {
    let bestScore = -Infinity;
    for (let i = 0; i < boardState.length; i++) {
      if (boardState[i] === "") {
        boardState[i] = 'O';
        const score = minimax(boardState, depth + 1, false);
        boardState[i] = "";
        bestScore = Math.max(bestScore, score);
      }
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (let i = 0; i < boardState.length; i++) {
      if (boardState[i] === "") {
        boardState[i] = 'X';
        const score = minimax(boardState, depth + 1, true);
        boardState[i] = "";
        bestScore = Math.min(bestScore, score);
      }
    }
    return bestScore;
  }
}

function isWinner(boardState, player) {
  return winningConditions.some(cond => {
    const [a, b, c] = cond;
    return (
      boardState[a] === player &&
      boardState[b] === player &&
      boardState[c] === player
    );
  });
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
