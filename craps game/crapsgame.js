let balance = 1000;
let playerName = "";
let wins = 0;
let losses = 0;
let betHistory = JSON.parse(localStorage.getItem("betHistory")) || [];

// 🧠 Show registration screen on page load
window.addEventListener("load", () => {
  document.getElementById("registration").style.display = "block";
  document.getElementById("diceGame").style.display = "none";

  playerName = "";
  balance = 1000;
  wins = 0;
  losses = 0;
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

// 🎲 Roll Dice with Even/Odd Betting
function rollDice() {
  const bet = parseInt(document.getElementById("betAmount").value);
  const betType = document.getElementById("betType").value;

  if (isNaN(bet) || bet < 1 || bet > balance) {
    showMessage("⚠️ Bet must be between $1 and your current balance.");
    return;
  }

  playSound("diceSound");

  const die1 = Math.floor(Math.random() * 6) + 1;
  const die2 = Math.floor(Math.random() * 6) + 1;
  const total = die1 + die2;

  animateDice(die1, die2);
  document.getElementById("score").textContent = total;

  const isEven = total % 2 === 0;
  const win = (betType === "even" && isEven) || (betType === "odd" && !isEven);

  if (win) {
    balance += bet;
    wins++;
    playSound("winSound");
    triggerConfetti();
    showMessage(`🎉 You bet ${betType} and rolled ${total}. You win!`);
  } else {
    balance -= bet;
    losses++;
    playSound("loseSound");
    showMessage(`💀 You bet ${betType} and rolled ${total}. You lose.`);
  }

  document.getElementById("balance").textContent = balance;
  localStorage.setItem("balance", balance);
  localStorage.setItem("wins", wins);
  localStorage.setItem("losses", losses);

  betHistory.push({
    result: win ? "✅ Won" : "❌ Lost",
    amount: bet,
    total: total,
    betType: betType
  });

  localStorage.setItem("betHistory", JSON.stringify(betHistory));

  updateStats();
  updateLeaderboard(playerName, balance);
  updateBetHistory();
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
function updateStats() {
  const stats = document.getElementById("playerStats");
  if (stats) {
    stats.innerHTML = `Wins: ${wins} | Losses: ${losses}`;
  }
}

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

function updateBetHistory() {
  const list = document.getElementById("betHistoryList");
  if (!list) return;

  list.innerHTML = "";
  betHistory.slice().reverse().forEach(entry => {
    const item = document.createElement("li");
    item.textContent = `${entry.result} $${entry.amount} on roll ${entry.total} (${entry.betType})`;
    list.appendChild(item);
  });
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

// 📜 Show/Hide History
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
    document.getElementById("gameMessage").textContent = "";
  }, 400);
}