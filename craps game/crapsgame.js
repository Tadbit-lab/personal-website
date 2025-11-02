let point = null;
let gameStarted = false;
let balance = 100;
let playerName = "";
let wins = 0;
let losses = 0;
let betHistory = JSON.parse(localStorage.getItem("betHistory")) || [];

// 🧠 Load saved player data
window.addEventListener("load", () => {
  const savedName = localStorage.getItem("playerName");
  const savedBalance = localStorage.getItem("balance");
  const savedWins = localStorage.getItem("wins");
  const savedLosses = localStorage.getItem("losses");

  if (savedName && savedBalance) {
    playerName = savedName;
    balance = parseInt(savedBalance);
    wins = parseInt(savedWins) || 0;
    losses = parseInt(savedLosses) || 0;

    document.getElementById("registration").style.display = "none";
    document.getElementById("diceGame").style.display = "block";
    document.getElementById("displayName").textContent = playerName;
    document.getElementById("balance").textContent = balance;
    document.getElementById("playerPoint").textContent = "-";
    updateStats();
    updateLeaderboard(playerName, balance);
    updateBetHistory();
  }
});

// 🎯 Start Game
function startGame() {
  const nameInput = document.getElementById("playerName");
  playerName = nameInput.value.trim();
  const errorMessage = document.getElementById("error-message");

  if (playerName.length < 5) {
    errorMessage.textContent = "Name must be at least 5 characters long.";
    return;
  }

  if (/^\d/.test(playerName)) {
    errorMessage.textContent = "Name must not start with a number.";
    return;
  }

  errorMessage.textContent = "";
  document.getElementById("registration").style.display = "none";
  document.getElementById("diceGame").style.display = "block";
  document.getElementById("displayName").textContent = playerName;
  document.getElementById("balance").textContent = balance;
  document.getElementById("playerPoint").textContent = "-";

  localStorage.setItem("playerName", playerName);
  localStorage.setItem("balance", balance);
  localStorage.setItem("wins", wins);
  localStorage.setItem("losses", losses);
  localStorage.setItem("betHistory", JSON.stringify(betHistory));

  playSound("welcomeSound");
  updateStats();
  updateLeaderboard(playerName, balance);
  updateBetHistory();
}

// 🎲 Roll Dice
function rollDice() {
  const bet = parseInt(document.getElementById("betAmount").value);
  if (isNaN(bet) || bet < 1 || bet > 100) {
    showMessage("⚠️ Bet must be between $1 and $100.");
    return;
  }

  playSound("diceSound");

  const die1 = Math.floor(Math.random() * 6) + 1;
  const die2 = Math.floor(Math.random() * 6) + 1;
  const total = die1 + die2;

  animateDice(die1, die2);
  document.getElementById("score").textContent = total;

  if (!gameStarted) {
    handleComeOutRoll(total);
  } else {
    handlePointRoll(total);
  }
}

// 🎯 Come-Out Roll
function handleComeOutRoll(total) {
  if (total === 7 || total === 11) {
    updateBalance(true);
    wins++;
    playSound("winSound");
    triggerConfetti();
    showMessage(`🎉 You rolled ${total}. Natural! You win!`);
    endRound();
  } else if ([2, 3, 12].includes(total)) {
    updateBalance(false);
    losses++;
    playSound("loseSound");
    showMessage(`💀 You rolled ${total}. Craps! You lose.`);
    endRound();
  } else {
    point = total;
    gameStarted = true;
    document.getElementById("playerPoint").textContent = point;
    showMessage(`🎯 Point is set to ${point}. Keep rolling!`);
  }
}

// 🔁 Point Phase
function handlePointRoll(total) {
  if (total === point) {
    updateBalance(true);
    wins++;
    playSound("winSound");
    triggerConfetti();
    showMessage(`🏆 You hit your point (${point})! You win!`);
    endRound();
  } else if (total === 7) {
    updateBalance(false);
    losses++;
    playSound("loseSound");
    showMessage(`😢 You rolled a 7. You lose.`);
    endRound();
  } else {
    showMessage(`🎲 You rolled ${total}. Keep going!`);
  }
}

// 🔊 Play Sound Helper
function playSound(id) {
  const sound = document.getElementById(id);
  if (sound) {
    sound.volume = 0.6;
    sound.play().catch(err => console.warn(`${id} error:`, err));
  }
}

// 🎉 Confetti Animation
function triggerConfetti() {
  if (typeof confetti === "function") {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      zIndex: 999,
      disableForReducedMotion: true
    });
  }
}

// 💰 Balance + Leaderboard + History
function updateBalance(win) {
  const bet = parseInt(document.getElementById("betAmount").value);
  if (win) balance += bet;
  else balance -= bet;

  document.getElementById("balance").textContent = balance;
  localStorage.setItem("balance", balance);
  localStorage.setItem("wins", wins);
  localStorage.setItem("losses", losses);

  betHistory.push({
    result: win ? "✅ Won" : "❌ Lost",
    amount: bet,
    total: parseInt(document.getElementById("score").textContent)
  });

  localStorage.setItem("betHistory", JSON.stringify(betHistory));

  updateStats();
  updateLeaderboard(playerName, balance);
  updateBetHistory();
}

// 🏆 Leaderboard
function updateLeaderboard(name, score) {
  const leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];
  const existing = leaderboard.find(entry => entry.name === name);

  if (existing) {
    existing.score = score;
  } else {
    leaderboard.push({ name, score });
  }

  leaderboard.sort((a, b) => b.score - a.score);
  localStorage.setItem("leaderboard", JSON.stringify(leaderboard));

  const list = document.getElementById("leaderboardList");
  list.innerHTML = "";
  leaderboard.forEach(entry => {
    const item = document.createElement("li");
    item.textContent = `${entry.name} - $${entry.score}`;
    item.dataset.name = entry.name;
    item.dataset.score = entry.score;
    list.appendChild(item);
  });
}

// 📜 Betting History
function updateBetHistory() {
  const list = document.getElementById("betHistoryList");
  if (!list) return;

  list.innerHTML = "";
  betHistory.slice().reverse().forEach(entry => {
    const item = document.createElement("li");
    item.textContent = `${entry.result} $${entry.amount} on roll ${entry.total}`;
    list.appendChild(item);
  });
}

// 📊 Update Stats Panel
function updateStats() {
  const stats = document.getElementById("playerStats");
  if (stats) {
    stats.innerHTML = `Wins: ${wins} | Losses: ${losses}`;
  }
}

// 🔄 Reset Round
function endRound() {
  gameStarted = false;
  point = null;
  document.getElementById("playerPoint").textContent = "-";
  document.getElementById("nextRound").style.display = "inline-block";
  document.getElementById("exitGame").style.display = "inline-block";
}

// 🔁 Next Round
function nextRound() {
  document.getElementById("gameMessage").textContent = "";
  document.getElementById("score").textContent = "0";
  document.getElementById("die1").textContent = "🎲";
  document.getElementById("die2").textContent = "🎲";
  document.getElementById("nextRound").style.display = "none";
  document.getElementById("exitGame").style.display = "none";
}

// ❌ Exit Game
function exitGame() {
  localStorage.clear();
  location.reload();
}

// 🎲 Unicode Dice
function getDieFace(num) {
  const faces = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
  return faces[num - 1];
}

// 🎞️ Dice Animation
function animateDice(d1, d2) {
  const die1El = document.getElementById("die1");
  const die2El = document.getElementById("die2");

  die1El.style.transform = "rotate(20deg)";
  die2El.style.transform = "rotate(-20deg)";

  setTimeout(() => {
    die1El.textContent = getDieFace(d1);
    die2El.textContent = getDieFace(d2);
    die1El.style.transform = "rotate(0deg)";
    die2El.style.transform = "rotate(0deg)";
  }, 300);
}
 
function showHistory() {
  const section = document.getElementById("historySection");
  section.style.display = "block";
  setTimeout(() => section.classList.add("show"), 10);
  document.getElementById("diceGame").style.display = "none";
  updateBetHistory();
}

function hideHistory() {
  const section = document.getElementById("historySection");
  section.classList.remove("show");
  setTimeout(() => {
    section.style.display = "none";
    document.getElementById("diceGame").style.display = "block";
  }, 400);
}