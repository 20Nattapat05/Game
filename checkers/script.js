const SIZE = 8;
const HUMAN = "r";
const AI = "b";
const MAX_DEPTH = 8;
const AI_TIME_LIMIT_MS = 2500;

let board = [];
let currentPlayer = HUMAN;
let selected = null;
let isHumanTurn = true;
let aiThinking = false;
let aiStartTime = 0;
let multiCapture = null;

const statusEl = document.getElementById("status");
const boardEl = document.getElementById("board");

function initBoard() {
  board = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));

  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < SIZE; col++) {
      if ((row + col) % 2 === 1) board[row][col] = "b";
    }
  }

  for (let row = SIZE - 2; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if ((row + col) % 2 === 1) board[row][col] = "r";
    }
  }

  currentPlayer = HUMAN;
  selected = null;
  isHumanTurn = true;
  aiThinking = false;
  multiCapture = null;
  renderBoard();
  updateStatus();
}

function updateStatus(message) {
  if (message) {
    statusEl.textContent = message;
    return;
  }
  if (aiThinking) {
    statusEl.textContent = "ถึงตา AI กำลังคิด...";
    return;
  }
  statusEl.textContent =
    currentPlayer === HUMAN
      ? "ถึงตาเดิน: ฝ่ายแดง (คุณ)"
      : "ถึงตาเดิน: ฝ่ายดำ (AI)";
}

function inBounds(r, c) {
  return r >= 0 && r < SIZE && c >= 0 && c < SIZE;
}

function cloneBoard(b) {
  return b.map((row) => row.slice());
}

function isPlayerPiece(piece, player) {
  if (!piece) return false;
  return piece.toLowerCase() === player;
}

function isOpponentPiece(piece, player) {
  if (!piece) return false;
  return piece.toLowerCase() !== player;
}

function directionsForPiece(piece) {
  const isKing = piece === "R" || piece === "B";
  const lower = piece.toLowerCase();
  if (isKing) return [[1, -1], [1, 1], [-1, -1], [-1, 1]];
  if (lower === "r") return [[-1, -1], [-1, 1]];
  return [[1, -1], [1, 1]];
}

function getMovesForPiece(b, row, col, player) {
  const piece = b[row][col];
  if (!piece || !isPlayerPiece(piece, player)) return [];

  const dirs = directionsForPiece(piece);
  const moves = [];
  const isKing = piece === "R" || piece === "B";

  // ----- ตัวธรรมดา -----
  if (!isKing) {
    for (const [dr, dc] of dirs) {
      const r1 = row + dr;
      const c1 = col + dc;

      // เดินธรรมดาหนึ่งช่อง
      if (inBounds(r1, c1) && !b[r1][c1]) {
        moves.push({
          fromRow: row,
          fromCol: col,
          toRow: r1,
          toCol: c1,
        });
      }

      // กินกระโดด 2 ช่อง
      const r2 = row + 2 * dr;
      const c2 = col + 2 * dc;
      if (
        inBounds(r2, c2) &&
        b[r1] &&
        isOpponentPiece(b[r1][c1], player) &&
        !b[r2][c2]
      ) {
        moves.push({
          fromRow: row,
          fromCol: col,
          toRow: r2,
          toCol: c2,
          captureRow: r1,
          captureCol: c1,
        });
      }
    }
    return moves;
  }

  // ----- KING -----
  // เดินไกลได้ + กินจากระยะไกลได้ แต่เวลาลงต้องอยู่หลังตัวที่กินเพียง 1 ช่อง
  for (const [dr, dc] of dirs) {
    let r = row + dr;
    let c = col + dc;

    // เดินธรรมดา: เลื่อนผ่านช่องว่างได้หลายช่อง
    while (inBounds(r, c) && !b[r][c]) {
      moves.push({
        fromRow: row,
        fromCol: col,
        toRow: r,
        toCol: c,
      });
      r += dr;
      c += dc;
    }

    // ถ้าเจอตัวศัตรูเป็นตัวแรกในทิศนั้น
    if (inBounds(r, c) && isOpponentPiece(b[r][c], player)) {
      const rAfter = r + dr;
      const cAfter = c + dc;
      // ต้องเป็นช่องว่าง "ถัดจาก" ตัวที่กิน 1 ช่องเท่านั้น
      if (inBounds(rAfter, cAfter) && !b[rAfter][cAfter]) {
        moves.push({
          fromRow: row,
          fromCol: col,
          toRow: rAfter,
          toCol: cAfter,
          captureRow: r,
          captureCol: c,
        });
      }
    }
    // ถ้าเจอทั้งตัวเราเองหรือศัตรูให้หยุดทิศนี้เลย
  }

  return moves;
}

function getAllMoves(b, player) {
  const allMoves = [];
  const captureMoves = [];

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (isPlayerPiece(b[r][c], player)) {
        const m = getMovesForPiece(b, r, c, player);
        for (const mv of m) {
          allMoves.push(mv);
          if (mv.captureRow !== undefined) captureMoves.push(mv);
        }
      }
    }
  }
  if (captureMoves.length > 0) return captureMoves;
  return allMoves;
}

function getLegalMovesForPiece(b, row, col, player) {
  const all = getAllMoves(b, player);
  return all.filter((m) => m.fromRow === row && m.fromCol === col);
}

function getCaptureMovesForPiece(b, row, col, player) {
  return getMovesForPiece(b, row, col, player).filter(
    (m) => m.captureRow !== undefined
  );
}

function applyMove(b, move) {
  const newB = cloneBoard(b);
  const piece = newB[move.fromRow][move.fromCol];
  newB[move.fromRow][move.fromCol] = null;
  newB[move.toRow][move.toCol] = piece;

  if (move.captureRow !== undefined) {
    newB[move.captureRow][move.captureCol] = null;
  }

  const lower = piece.toLowerCase();
  if (lower === "r" && move.toRow === 0) {
    newB[move.toRow][move.toCol] = "R";
  }
  if (lower === "b" && move.toRow === SIZE - 1) {
    newB[move.toRow][move.toCol] = "B";
  }

  return newB;
}

function evaluateBoard(b) {
  let score = 0;

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const piece = b[r][c];
      if (!piece) continue;
      const lower = piece.toLowerCase();

      let val = 0;
      if (lower === "r") val = 120;
      if (lower === "b") val = -120;
      if (piece === "R") val = 260;
      if (piece === "B") val = -260;

      const center = r >= 2 && r <= 5 && c >= 2 && c <= 5 ? 12 : 0;
      if (lower === HUMAN) val += center;
      else val -= center;

      if (lower === "r") {
        val += (SIZE - 1 - r) * 3;
      } else if (lower === "b") {
        val -= r * 3;
      }

      score += val;
    }
  }

  const humanMoves = getAllMoves(b, HUMAN).length;
  const aiMoves = getAllMoves(b, AI).length;
  score += (humanMoves - aiMoves) * 4;

  return score;
}

function minimax(b, depth, alpha, beta, playerToMove) {
  if (Date.now() - aiStartTime > AI_TIME_LIMIT_MS) {
    return { score: evaluateBoard(b) };
  }

  const humanMoves = getAllMoves(b, HUMAN);
  const aiMoves = getAllMoves(b, AI);

  if (humanMoves.length === 0) return { score: -99999 };
  if (aiMoves.length === 0) return { score: 99999 };

  if (depth === 0) return { score: evaluateBoard(b) };

  const moves = getAllMoves(b, playerToMove);

  if (playerToMove === HUMAN) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const newB = applyMove(b, move);
      let nextPlayer = HUMAN;
      if (move.captureRow !== undefined) {
        const moreCaps = getCaptureMovesForPiece(
          newB,
          move.toRow,
          move.toCol,
          HUMAN
        );
        if (moreCaps.length === 0) nextPlayer = AI;
      } else {
        nextPlayer = AI;
      }
      const result = minimax(newB, depth - 1, alpha, beta, nextPlayer);
      if (result.score > maxEval) {
        maxEval = result.score;
      }
      if (result.score > alpha) alpha = result.score;
      if (beta <= alpha) break;
    }
    return { score: maxEval };
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const newB = applyMove(b, move);
      let nextPlayer = AI;
      if (move.captureRow !== undefined) {
        const moreCaps = getCaptureMovesForPiece(
          newB,
          move.toRow,
          move.toCol,
          AI
        );
        if (moreCaps.length === 0) nextPlayer = HUMAN;
      } else {
        nextPlayer = HUMAN;
      }
      const result = minimax(newB, depth - 1, alpha, beta, nextPlayer);
      if (result.score < minEval) {
        minEval = result.score;
      }
      if (result.score < beta) beta = result.score;
      if (beta <= alpha) break;
    }
    return { score: minEval };
  }
}

function aiChooseMove() {
  const moves = getAllMoves(board, AI);
  if (moves.length === 0) return null;

  aiStartTime = Date.now();
  let bestScore = Infinity;
  let bestMove = null;

  moves.sort((a, b) => {
    const ca = a.captureRow !== undefined ? 1 : 0;
    const cb = b.captureRow !== undefined ? 1 : 0;
    return cb - ca;
  });

  for (const move of moves) {
    const newB = applyMove(board, move);
    const result = minimax(
      newB,
      MAX_DEPTH - 1,
      -Infinity,
      Infinity,
      move.captureRow !== undefined &&
        getCaptureMovesForPiece(newB, move.toRow, move.toCol, AI).length > 0
        ? AI
        : HUMAN
    );
    if (result.score < bestScore) {
      bestScore = result.score;
      bestMove = move;
    }

    if (Date.now() - aiStartTime > AI_TIME_LIMIT_MS) break;
  }

  if (!bestMove) return moves[0];
  return bestMove;
}

function aiChainCaptures(startRow, startCol) {
  let r = startRow;
  let c = startCol;

  while (true) {
    const caps = getCaptureMovesForPiece(board, r, c, AI);
    if (caps.length === 0) break;

    let best = caps[0];
    let bestScore = evaluateBoard(applyMove(board, caps[0]));
    for (let i = 1; i < caps.length; i++) {
      const b2 = applyMove(board, caps[i]);
      const sc = evaluateBoard(b2);
      if (sc < bestScore) {
        bestScore = sc;
        best = caps[i];
      }
    }

    board = applyMove(board, best);
    r = best.toRow;
    c = best.toCol;
  }
}

function aiTurn() {
  aiThinking = true;
  isHumanTurn = false;
  updateStatus();

  setTimeout(() => {
    const move = aiChooseMove();
    aiThinking = false;

    if (!move) {
      updateStatus("จบเกม! AI เดินไม่ได้ คุณชนะ 🎉");
      renderBoard();
      return;
    }

    board = applyMove(board, move);

    if (move.captureRow !== undefined) {
      aiChainCaptures(move.toRow, move.toCol);
    }

    currentPlayer = HUMAN;
    isHumanTurn = true;

    const humanMoves = getAllMoves(board, HUMAN);
    if (humanMoves.length === 0) {
      updateStatus("จบเกม! คุณเดินไม่ได้ AI ชนะ");
      renderBoard();
      return;
    }

    renderBoard();
    updateStatus();
  }, 150);
}

function renderBoard(highlightedMoves = []) {
  boardEl.innerHTML = "";

  const moveTargets = new Set(
    highlightedMoves.map((m) => `${m.toRow},${m.toCol}`)
  );

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      const isDark = (r + c) % 2 === 1;
      cell.classList.add(isDark ? "dark" : "light");
      cell.dataset.row = r;
      cell.dataset.col = c;

      const inner = document.createElement("div");
      inner.classList.add("cell-inner");

      const piece = board[r][c];
      if (piece) {
        const pieceEl = document.createElement("div");
        pieceEl.classList.add("piece");
        if (piece === "r" || piece === "R") pieceEl.classList.add("red");
        if (piece === "b" || piece === "B") pieceEl.classList.add("black");
        if (piece === "R" || piece === "B") pieceEl.classList.add("king");
        inner.appendChild(pieceEl);
      }

      if (selected && selected.row === r && selected.col === c) {
        cell.classList.add("selected");
      }

      if (moveTargets.has(`${r},${c}`)) {
        cell.classList.add("move-target", "selectable");
      } else if (
        piece &&
        isPlayerPiece(piece, HUMAN) &&
        isHumanTurn &&
        !aiThinking &&
        (!multiCapture ||
          (multiCapture.player === HUMAN &&
            multiCapture.row === r &&
            multiCapture.col === c))
      ) {
        cell.classList.add("selectable");
      }

      cell.appendChild(inner);
      cell.addEventListener("click", onCellClick);
      boardEl.appendChild(cell);
    }
  }
}

function onCellClick(e) {
  if (!isHumanTurn || aiThinking) return;

  const cell = e.currentTarget;
  const row = parseInt(cell.dataset.row);
  const col = parseInt(cell.dataset.col);
  const piece = board[row][col];

  if (multiCapture && multiCapture.player === HUMAN) {
    if (!selected) {
      selected = { row: multiCapture.row, col: multiCapture.col };
      highlightSelected();
      return;
    }
  }

  if (selected) {
    if (
      selected.row === row &&
      selected.col === col &&
      !(multiCapture && multiCapture.player === HUMAN)
    ) {
      selected = null;
      renderBoard();
      updateStatus();
      return;
    }

    let moves;
    if (multiCapture && multiCapture.player === HUMAN) {
      moves = getCaptureMovesForPiece(board, selected.row, selected.col, HUMAN);
    } else {
      moves = getLegalMovesForPiece(board, selected.row, selected.col, HUMAN);
    }

    const chosen = moves.find((m) => m.toRow === row && m.toCol === col);
    if (chosen) {
      board = applyMove(board, chosen);

      const isCapture = chosen.captureRow !== undefined;
      const newRow = chosen.toRow;
      const newCol = chosen.toCol;

      if (isCapture) {
        const moreCaps = getCaptureMovesForPiece(board, newRow, newCol, HUMAN);
        if (moreCaps.length > 0) {
          multiCapture = { row: newRow, col: newCol, player: HUMAN };
          selected = { row: newRow, col: newCol };
          currentPlayer = HUMAN;
          isHumanTurn = true;
          renderBoard(moreCaps);
          updateStatus("ต้องกินต่อด้วยตัวเดิม");
          return;
        }
      }

      multiCapture = null;
      selected = null;
      renderBoard();

      currentPlayer = AI;

      const aiMoves = getAllMoves(board, AI);
      if (aiMoves.length === 0) {
        updateStatus("จบเกม! AI เดินไม่ได้ คุณชนะ 🎉");
        return;
      }

      updateStatus();
      aiTurn();
    } else {
      if (
        piece &&
        isPlayerPiece(piece, HUMAN) &&
        !(multiCapture && multiCapture.player === HUMAN)
      ) {
        selected = { row, col };
        highlightSelected();
      } else if (!(multiCapture && multiCapture.player === HUMAN)) {
        selected = null;
        renderBoard();
      }
    }
  } else {
    if (piece && isPlayerPiece(piece, HUMAN)) {
      selected = { row, col };
      highlightSelected();
    }
  }
}

function highlightSelected() {
  if (!selected) {
    renderBoard();
    return;
  }
  let moves;
  if (multiCapture && multiCapture.player === HUMAN) {
    moves = getCaptureMovesForPiece(board, selected.row, selected.col, HUMAN);
  } else {
    moves = getLegalMovesForPiece(board, selected.row, selected.col, HUMAN);
  }
  renderBoard(moves);
}

document.getElementById("resetBtn").addEventListener("click", initBoard);

initBoard();
