let currentPlayer = 1;
let positions = { red:0, blue:0, green:0, yellow:0 };
let activeTokens = { red:false, blue:false, green:false, yellow:false };

function rollDice() {
  const roll = Math.floor(Math.random() * 6) + 1;
  document.getElementById("dice-result").innerText = `Player ${currentPlayer} rolled: ${roll}`;

  let color = ["red","blue","green","yellow"][currentPlayer-1];

  // Spawn token if not active and rolled 6
  if (roll === 6 && !activeTokens[color]) {
    document.getElementById(`token-${color}`).style.display = "block";
    activeTokens[color] = true;
  } 
  // Move token if active
  else if (activeTokens[color]) {
    positions[color] += roll;
    moveToken(color, positions[color]);
  }

  // Change turn if not rolling another after 6
  if (roll !== 6) {
    currentPlayer++;
    if (currentPlayer > 4) currentPlayer = 1;
  }
}

function moveToken(color, pos) {
  let token = document.getElementById(`token-${color}`);
  let step = 30; // Simple movement for testing
  token.style.top = `${50 + pos * step}px`;
  token.style.left = `${50 + pos * step}px`;
}
