const PIECES = {
  r_r: { text: "車", color: "red" },
  r_h: { text: "馬", color: "red" },
  r_e: { text: "相", color: "red" },
  r_a: { text: "仕", color: "red" },
  r_k: { text: "帥", color: "red" },
  r_c: { text: "炮", color: "red" },
  r_p: { text: "兵", color: "red" },
  b_r: { text: "車", color: "black" },
  b_h: { text: "馬", color: "black" },
  b_e: { text: "象", color: "black" },
  b_a: { text: "士", color: "black" },
  b_k: { text: "將", color: "black" },
  b_c: { text: "炮", color: "black" },
  b_p: { text: "卒", color: "black" }
};

const MAX_LIMITS = {
  r_k: 1,
  r_a: 2,
  r_e: 2,
  r_h: 2,
  r_r: 2,
  r_c: 2,
  r_p: 5,
  b_k: 1,
  b_a: 2,
  b_e: 2,
  b_h: 2,
  b_r: 2,
  b_c: 2,
  b_p: 5
};
const VALID_POSITIONS = {
  r_k: [
    [7, 3],
    [7, 4],
    [7, 5],
    [8, 3],
    [8, 4],
    [8, 5],
    [9, 3],
    [9, 4],
    [9, 5]
  ],
  r_a: [
    [7, 3],
    [7, 5],
    [8, 4],
    [9, 3],
    [9, 5]
  ],
  r_e: [
    [5, 2],
    [5, 6],
    [7, 0],
    [7, 4],
    [7, 8],
    [9, 2],
    [9, 6]
  ],
  b_k: [
    [0, 3],
    [0, 4],
    [0, 5],
    [1, 3],
    [1, 4],
    [1, 5],
    [2, 3],
    [2, 4],
    [2, 5]
  ],
  b_a: [
    [0, 3],
    [0, 5],
    [1, 4],
    [2, 3],
    [2, 5]
  ],
  b_e: [
    [0, 2],
    [0, 6],
    [2, 0],
    [2, 4],
    [2, 8],
    [4, 2],
    [4, 6]
  ]
};

const STANDARD_SETUP = [
  ["b_r", "b_h", "b_e", "b_a", "b_k", "b_a", "b_e", "b_h", "b_r"],
  [null, null, null, null, null, null, null, null, null],
  [null, "b_c", null, null, null, null, null, "b_c", null],
  ["b_p", null, "b_p", null, "b_p", null, "b_p", null, "b_p"],
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
  ["r_p", null, "r_p", null, "r_p", null, "r_p", null, "r_p"],
  [null, "r_c", null, null, null, null, null, "r_c", null],
  [null, null, null, null, null, null, null, null, null],
  ["r_r", "r_h", "r_e", "r_a", "r_k", "r_a", "r_e", "r_h", "r_r"]
];

let boardState = [];
let history = [];
let selection = null;
let currentTurn = "red";
let isGameOver = false;
let isPlacementMode = false;
let showHints = true;

function cloneBoard(board) {
  return JSON.parse(JSON.stringify(board));
}
function saveHistory() {
  history.push({ board: cloneBoard(boardState), turn: currentTurn });
}

function toggleHints() {
  showHints = !showHints;
  document.getElementById("hint-btn").innerText = showHints
    ? "移動提示：開"
    : "移動提示：關";
  renderBoard();
}

function updateTurnUI() {
  const indicator = document.getElementById("turn-indicator");
  if (isPlacementMode) {
    indicator.innerText = "🛠️ 自由擺放模式中...";
    indicator.className = "turn-indicator placement-mode-turn";
  } else {
    indicator.innerText =
      currentTurn === "red" ? "當前回合：紅方" : "當前回合：黑方";
    indicator.className =
      currentTurn === "red"
        ? "turn-indicator red-turn"
        : "turn-indicator black-turn";
  }
}

function initStandardBoard() {
  boardState = cloneBoard(STANDARD_SETUP);
  selection = null;
  currentTurn = "red";
  isGameOver = false;
  isPlacementMode = false;
  history = [];
  saveHistory();
  document.getElementById("game-over-modal").style.display = "none";
  document.getElementById("toolbox-container").style.display = "none";
  document.getElementById("finish-btn").style.display = "none";
  document.getElementById("undo-btn").style.display = "inline-block";
  updateTurnUI();
  renderBoard();
}

function initEmptyBoard() {
  boardState = Array.from({ length: 10 }, () => Array(9).fill(null));
  selection = null;
  isGameOver = false;
  isPlacementMode = true;
  history = [];
  document.getElementById("game-over-modal").style.display = "none";
  document.getElementById("toolbox-container").style.display = "block";
  document.getElementById("finish-btn").style.display = "inline-block";
  document.getElementById("undo-btn").style.display = "none";
  updateTurnUI();
  renderBoard();
  renderToolbox();
}

function finishPlacement() {
  let errors = [];
  let counts = {};
  for (let key in PIECES) counts[key] = 0;
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      let p = boardState[r][c];
      if (p) {
        counts[p]++;
        if (VALID_POSITIONS[p]) {
          if (!VALID_POSITIONS[p].some((pt) => pt[0] === r && pt[1] === c))
            errors.push(
              `🚫 ${PIECES[p].text} 放錯了路線位置 (坐標 ${c},${r})。`
            );
        }
      }
    }
  }
  for (let p in MAX_LIMITS)
    if (counts[p] > MAX_LIMITS[p])
      errors.push(`🚫 ${PIECES[p].text} 數量超標。`);
  if (counts["r_k"] !== 1) errors.push(`🚫 必須有且只有 1 個紅帥。`);
  if (counts["b_k"] !== 1) errors.push(`🚫 必須有且只有 1 個黑將。`);
  if (
    counts["r_k"] === 1 &&
    counts["b_k"] === 1 &&
    isGeneralsFacing(boardState)
  )
    errors.push(`🚫 將帥不能直接照面。`);

  if (errors.length > 0) {
    alert("【擺放違規】\n" + errors.join("\n"));
  } else {
    isPlacementMode = false;
    currentTurn = "red";
    selection = null;
    saveHistory();
    document.getElementById("toolbox-container").style.display = "none";
    document.getElementById("finish-btn").style.display = "none";
    document.getElementById("undo-btn").style.display = "inline-block";
    updateTurnUI();
    renderBoard();
    alert("佈局合法，遊戲開始！");
  }
}

function countPiecesBetween(sr, sc, er, ec, board) {
  let count = 0;
  if (sr === er) {
    let min = Math.min(sc, ec),
      max = Math.max(sc, ec);
    for (let c = min + 1; c < max; c++) if (board[sr][c]) count++;
  } else if (sc === ec) {
    let min = Math.min(sr, er),
      max = Math.max(sr, er);
    for (let r = min + 1; r < max; r++) if (board[r][sc]) count++;
  }
  return count;
}

function checkMoveRules(pieceId, sr, sc, er, ec, board) {
  const type = pieceId.split("_")[1];
  const color = pieceId.split("_")[0];
  const dr = er - sr;
  const dc = ec - sc;
  const absDr = Math.abs(dr);
  const absDc = Math.abs(dc);
  const target = board[er][ec];

  if (type === "r")
    return (
      (sr === er || sc === ec) &&
      countPiecesBetween(sr, sc, er, ec, board) === 0
    );
  if (type === "h") {
    if (!((absDr === 2 && absDc === 1) || (absDr === 1 && absDc === 2)))
      return false;
    if (absDr === 2 && board[sr + dr / 2][sc] !== null) return false; // 撇馬腿
    if (absDc === 2 && board[sr][sc + dc / 2] !== null) return false; // 撇馬腿
    return true;
  }
  if (type === "e") {
    if (absDr !== 2 || absDc !== 2) return false;
    if (color === "r" && er < 5) return false;
    if (color === "b" && er > 4) return false;
    if (board[sr + dr / 2][sc + dc / 2] !== null) return false; // 塞象眼
    return true;
  }
  if (type === "a")
    return (
      absDr === 1 &&
      absDc === 1 &&
      ec >= 3 &&
      ec <= 5 &&
      ((color === "r" && er >= 7) || (color === "b" && er <= 2))
    );
  if (type === "k")
    return (
      absDr + absDc === 1 &&
      ec >= 3 &&
      ec <= 5 &&
      ((color === "r" && er >= 7) || (color === "b" && er <= 2))
    );
  if (type === "c") {
    if (sr !== er && sc !== ec) return false;
    let between = countPiecesBetween(sr, sc, er, ec, board);
    return target ? between === 1 : between === 0;
  }
  if (type === "p") {
    if (color === "r")
      return sr >= 5
        ? dr === -1 && dc === 0
        : (dr === -1 && dc === 0) || (dr === 0 && absDc === 1);
    else
      return sr <= 4
        ? dr === 1 && dc === 0
        : (dr === 1 && dc === 0) || (dr === 0 && absDc === 1);
  }
  return false;
}

function isGeneralsFacing(virtualBoard) {
  let rkPos = null,
    bkPos = null;
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      if (virtualBoard[r][c] === "r_k") rkPos = { r, c };
      if (virtualBoard[r][c] === "b_k") bkPos = { r, c };
    }
  }
  if (!rkPos || !bkPos || rkPos.c !== bkPos.c) return false;
  let minR = Math.min(rkPos.r, bkPos.r),
    maxR = Math.max(rkPos.r, bkPos.r);
  let piecesBetween = 0;
  for (let r = minR + 1; r < maxR; r++) {
    if (virtualBoard[r][rkPos.c] !== null) piecesBetween++;
  }
  return piecesBetween === 0;
}

function isValidMove(sr, sc, er, ec, board) {
  let piece = board[sr][sc];
  let target = board[er][ec];
  if (sr === er && sc === ec) return false;
  if (target && target.split("_")[0] === piece.split("_")[0]) return false;
  if (!checkMoveRules(piece, sr, sc, er, ec, board)) return false;

  let virtualBoard = cloneBoard(board);
  virtualBoard[er][ec] = piece;
  virtualBoard[sr][sc] = null;
  if (isGeneralsFacing(virtualBoard)) return false;

  return true;
}

function processDropOrClick(row, col) {
  if (isGameOver) return;

  if (isPlacementMode) {
    if (selection && selection.type === "toolbox") {
      boardState[row][col] =
        selection.pieceId === "eraser" ? null : selection.pieceId;
      renderBoard();
    } else if (boardState[row][col]) {
      boardState[row][col] = null;
      renderBoard();
    }
    return;
  }

  let clickedPiece = boardState[row][col];
  if (!selection) {
    if (clickedPiece) {
      if (PIECES[clickedPiece].color !== currentTurn) {
        alert(`現在是 ${currentTurn === "red" ? "紅方" : "黑方"} 的回合！`);
        return;
      }
      selection = { type: "board", row, col, pieceId: clickedPiece };
      renderBoard();
    }
    return;
  }

  if (selection.type === "board") {
    if (selection.row === row && selection.col === col) {
      selection = null;
    } else if (clickedPiece && PIECES[clickedPiece].color === currentTurn) {
      selection = { type: "board", row, col, pieceId: clickedPiece };
    } else {
      if (!isValidMove(selection.row, selection.col, row, col, boardState)) {
        alert("違反移動規則！");
        return;
      }

      let targetEaten = boardState[row][col];
      boardState[row][col] = selection.pieceId;
      boardState[selection.row][selection.col] = null;
      selection = null;
      currentTurn = currentTurn === "red" ? "black" : "red";
      saveHistory();

      if (targetEaten === "r_k") {
        renderBoard();
        triggerGameOver("red");
        return;
      }
      if (targetEaten === "b_k") {
        renderBoard();
        triggerGameOver("black");
        return;
      }
      updateTurnUI();
    }
    renderBoard();
  }
}

function triggerGameOver(loserColor) {
  isGameOver = true;
  const modal = document.getElementById("game-over-modal");
  document.getElementById("winner-text").innerText =
    loserColor === "red" ? "🏆 黑方獲勝！" : "🏆 紅方獲勝！";
  document.getElementById("winner-text").style.color =
    loserColor === "red" ? "#1976D2" : "#D32F2F";
  document.getElementById("cheer-text").innerText =
    loserColor === "red"
      ? "紅方別灰心，勝敗乃兵家常事！"
      : "黑方別氣餒，差一點就守住了！";
  modal.style.display = "flex";
}

function undo() {
  if (isGameOver || isPlacementMode) return;
  if (history.length > 1) {
    history.pop();
    const lastState = history[history.length - 1];
    boardState = cloneBoard(lastState.board);
    currentTurn = lastState.turn;
    selection = null;
    updateTurnUI();
    renderBoard();
  } else {
    alert("已經退回到最開始的佈局了！");
  }
}

function drawVisualBoardSVG() {
  const svg = document.getElementById("visual-board");
  const CELL = 48;
  const W = 8 * CELL;
  const H = 9 * CELL;
  let html = "";
  html += `<rect x="0" y="0" width="${W}" height="${H}" fill="none" stroke="#333" stroke-width="3"/>`;
  for (let i = 1; i < 9; i++)
    html += `<line x1="0" y1="${i * CELL}" x2="${W}" y2="${
      i * CELL
    }" stroke="#333" stroke-width="1.5"/>`;
  for (let i = 1; i < 8; i++) {
    html += `<line x1="${i * CELL}" y1="0" x2="${i * CELL}" y2="${
      4 * CELL
    }" stroke="#333" stroke-width="1.5"/>`;
    html += `<line x1="${i * CELL}" y1="${5 * CELL}" x2="${
      i * CELL
    }" y2="${H}" stroke="#333" stroke-width="1.5"/>`;
  }
  html += `<line x1="${3 * CELL}" y1="0" x2="${5 * CELL}" y2="${
    2 * CELL
  }" stroke="#333" stroke-width="1.5"/>`;
  html += `<line x1="${5 * CELL}" y1="0" x2="${3 * CELL}" y2="${
    2 * CELL
  }" stroke="#333" stroke-width="1.5"/>`;
  html += `<line x1="${3 * CELL}" y1="${7 * CELL}" x2="${5 * CELL}" y2="${
    9 * CELL
  }" stroke="#333" stroke-width="1.5"/>`;
  html += `<line x1="${5 * CELL}" y1="${7 * CELL}" x2="${3 * CELL}" y2="${
    9 * CELL
  }" stroke="#333" stroke-width="1.5"/>`;

  const markCoords = [
    [2, 1],
    [2, 7],
    [7, 1],
    [7, 7],
    [3, 0],
    [3, 2],
    [3, 4],
    [3, 6],
    [3, 8],
    [6, 0],
    [6, 2],
    [6, 4],
    [6, 6],
    [6, 8]
  ];
  markCoords.forEach(([r, c]) => {
    let cx = c * CELL,
      cy = r * CELL,
      s = 5,
      len = 10;
    if (c > 0) {
      html += `<polyline points="${cx - s - len},${cy - s} ${cx - s},${
        cy - s
      } ${cx - s},${
        cy - s - len
      }" fill="none" stroke="#333" stroke-width="1.5"/><polyline points="${
        cx - s - len
      },${cy + s} ${cx - s},${cy + s} ${cx - s},${
        cy + s + len
      }" fill="none" stroke="#333" stroke-width="1.5"/>`;
    }
    if (c < 8) {
      html += `<polyline points="${cx + s + len},${cy - s} ${cx + s},${
        cy - s
      } ${cx + s},${
        cy - s - len
      }" fill="none" stroke="#333" stroke-width="1.5"/><polyline points="${
        cx + s + len
      },${cy + s} ${cx + s},${cy + s} ${cx + s},${
        cy + s + len
      }" fill="none" stroke="#333" stroke-width="1.5"/>`;
    }
  });
  html += `<text x="${CELL * 1.5}" y="${
    CELL * 4.65
  }" font-size="28" font-weight="bold" fill="#333">楚 河</text><text x="${
    CELL * 5.2
  }" y="${
    CELL * 4.65
  }" font-size="28" font-weight="bold" fill="#333">漢 界</text>`;
  svg.innerHTML = html;
}

function renderBoard() {
  const layer = document.getElementById("click-layer");
  layer.innerHTML = "";
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 9; c++) {
      const pointDiv = document.createElement("div");
      pointDiv.className = "point";
      pointDiv.dataset.row = r;
      pointDiv.dataset.col = c;
      pointDiv.style.left = `${c * 48}px`;
      pointDiv.style.top = `${r * 48}px`;

      pointDiv.onclick = () => processDropOrClick(r, c);
      pointDiv.ondragover = (e) => e.preventDefault();
      pointDiv.ondrop = (e) => {
        e.preventDefault();
        let targetRow = parseInt(e.currentTarget.dataset.row);
        let targetCol = parseInt(e.currentTarget.dataset.col);
        processDropOrClick(targetRow, targetCol);
      };

      let isHintDot = false;
      let isEnemyCapture = false;
      if (
        selection &&
        selection.type === "board" &&
        showHints &&
        !isPlacementMode
      ) {
        if (isValidMove(selection.row, selection.col, r, c, boardState)) {
          isHintDot = true;
          isEnemyCapture = boardState[r][c] !== null;
        }
      }

      const pieceId = boardState[r][c];
      if (pieceId) {
        const pData = PIECES[pieceId];
        const pieceDiv = document.createElement("div");
        pieceDiv.className = `piece ${pData.color}`;
        pieceDiv.innerText = pData.text;
        if (
          selection &&
          selection.type === "board" &&
          selection.row === r &&
          selection.col === c
        ) {
          pieceDiv.classList.add("selected-piece");
        }

        pieceDiv.draggable = true;
        pieceDiv.ondragstart = (e) => {
          if (isGameOver || (!isPlacementMode && pData.color !== currentTurn)) {
            e.preventDefault();
            return;
          }
          selection = { type: "board", row: r, col: c, pieceId: pieceId };
          setTimeout(() => pieceDiv.classList.add("dragging"), 0);
          renderBoard();
        };
        pieceDiv.ondragend = () => pieceDiv.classList.remove("dragging");
        pointDiv.appendChild(pieceDiv);
      }

      if (isHintDot) {
        const hintDiv = document.createElement("div");
        hintDiv.className = `hint-dot ${isEnemyCapture ? "red" : "green"}`;
        pointDiv.appendChild(hintDiv);
      }
      layer.appendChild(pointDiv);
    }
  }
}

function renderToolbox() {
  const toolboxDiv = document.getElementById("toolbox");
  toolboxDiv.innerHTML = "";
  const tools = [
    "r_k",
    "r_a",
    "r_e",
    "r_h",
    "r_r",
    "r_c",
    "r_p",
    "b_k",
    "b_a",
    "b_e",
    "b_h",
    "b_r",
    "b_c",
    "b_p",
    "eraser"
  ];
  tools.forEach((id) => {
    const wrap = document.createElement("div");
    wrap.className = "tool-item";
    if (selection && selection.type === "toolbox" && selection.pieceId === id)
      wrap.classList.add("active");

    wrap.onclick = () => {
      if (isGameOver || !isPlacementMode) return;
      selection =
        selection?.pieceId === id ? null : { type: "toolbox", pieceId: id };
      renderBoard();
      renderToolbox();
    };
    wrap.draggable = true;
    wrap.ondragstart = (e) => {
      if (isGameOver || !isPlacementMode) {
        e.preventDefault();
        return;
      }
      selection = { type: "toolbox", pieceId: id };
    };

    if (id === "eraser") {
      const e = document.createElement("div");
      e.className = "eraser";
      e.innerText = "移除";
      wrap.appendChild(e);
    } else {
      const p = document.createElement("div");
      p.className = `piece ${PIECES[id].color}`;
      p.innerText = PIECES[id].text;
      wrap.appendChild(p);
    }
    toolboxDiv.appendChild(wrap);
  });
}

drawVisualBoardSVG();
initStandardBoard();
