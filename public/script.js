let playerSymbol = null;
let currentTurn = "X";
let board = Array(9).fill(null);
let socket = null;
let isOnline = false;
let currentRoom = null;

const boardDiv = document.getElementById("board");
const info = document.getElementById("info");
const gameArea = document.getElementById("gameArea");
const startMenu = document.getElementById("startMenu");
const roomInput = document.getElementById("roomInput");

function joinOnline(symbol) {
  const room = roomInput.value.trim();
  if (!room) {
    alert("Bitte gib einen Raumnamen ein.");
    return;
  }

  socket = io();
  isOnline = true;
  currentRoom = room;
  playerSymbol = symbol;

  socket.emit("joinRoom", { room, symbol });

  socket.on("joined", (data) => {
    info.textContent = `Du bist Spieler ${playerSymbol} im Raum ${room}`;
    gameArea.style.display = "block";
    startMenu.style.display = "none";
  });

  socket.on("updateBoard", ({ board: newBoard, currentTurn: turn }) => {
    board = newBoard;
    currentTurn = turn;
    renderBoard();
    info.textContent = currentTurn === playerSymbol
      ? "Du bist dran!"
      : "Gegner ist dran...";
  });

  socket.on("errorMsg", (msg) => {
    alert(msg);
    socket.disconnect();
    socket = null;
  });
}

function startAI() {
  isOnline = false;
  gameArea.style.display = "block";
  startMenu.style.display = "none";
  resetGame();
  renderBoard();
  info.textContent = "Du spielst gegen die KI!";
}

function backToMenu() {
  if (isOnline && socket) {
    socket.disconnect();
    socket = null;
  }
  board = Array(9).fill(null);
  currentTurn = "X";
  startMenu.style.display = "block";
  gameArea.style.display = "none";
}

function renderBoard() {
  boardDiv.innerHTML = "";
  board.forEach((cell, i) => {
    const div = document.createElement("div");
    div.classList.add("cell");
    div.textContent = cell || "";
    div.addEventListener("click", () => {
      if (isOnline) {
        if (currentTurn === playerSymbol && !board[i]) {
          socket.emit("makeMove", { room: currentRoom, index: i });
        }
      } else {
        handleAIClick(i);
      }
    });
    boardDiv.appendChild(div);
  });
}

function resetGame() {
  board = Array(9).fill(null);
  currentTurn = "X";
  if (isOnline && socket) {
    socket.emit("resetGame", currentRoom);
  } else {
    renderBoard();
    info.textContent = "Du spielst gegen die KI!";
  }
}

function aiMove() {
  const empty = board.map((v, i) => v === null ? i : null).filter(i => i !== null);
  if (empty.length === 0) return;
  const move = empty[Math.floor(Math.random() * empty.length)];
  board[move] = "O";
  currentTurn = "X";
  renderBoard();
  checkWinner();
}

function handleAIClick(i) {
  if (board[i] || currentTurn !== "X") return;
  board[i] = "X";
  currentTurn = "O";
  renderBoard();
  checkWinner();
  setTimeout(aiMove, 500);
}

function checkWinner() {
  const lines = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (const [a,b,c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      info.textContent = board[a] + " gewinnt!";
      return true;
    }
  }
  if (!board.includes(null)) {
    info.textContent = "Unentschieden!";
  }
}
